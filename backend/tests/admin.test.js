import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { seedOsceContent } from "../src/seed/osce.seed.js";
import { ContentAuditLog } from "../src/models/ContentAuditLog.js";
import { CreditTransaction } from "../src/models/CreditTransaction.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { User } from "../src/models/User.js";

let mongod;
let app;
let station;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  env.groqApiKey = "";
  env.openaiApiKey = "";
  await mongoose.connection.db.dropDatabase();
  station = (await seedOsceContent()).module;
});

const PASSWORD = "StrongPass123";

async function account(email, role = "student") {
  const res = await request(app).post("/api/auth/register").send({ fullName: "Test Person", email, password: PASSWORD });
  assert.equal(res.status, 201, res.body.message);
  if (role !== "student") await User.updateOne({ _id: res.body.data.user.id }, { $set: { role } });
  return { auth: `Bearer ${res.body.data.token}`, id: res.body.data.user.id, email };
}

test("admin endpoints are refused to students", async () => {
  const student = await account("student@example.com");
  for (const [method, path] of [["get", "/api/admin/settings"], ["patch", "/api/admin/settings/pricing"], ["get", "/api/admin/announcements"], ["patch", `/api/admin/users/${student.id}`], ["patch", `/api/admin/osce/${station._id}`]]) {
    const res = await request(app)[method](path).set("Authorization", student.auth).send({});
    assert.equal(res.status, 403, `${method} ${path}`);
  }
});

test("closing the OSCE section hides it from students but not admins", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s1@example.com");
  const off = await request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ sections: { stations: false } });
  assert.equal(off.status, 200);
  assert.equal(off.body.data.site.sections.stations, false);
  assert.equal(off.body.data.site.sections.mcqs, true);

  const list = await request(app).get("/api/osce").set("Authorization", student.auth);
  assert.equal(list.status, 403);
  assert.equal(list.body.code, "SECTION_CLOSED");
  const start = await request(app).post("/api/osce/attempts").set("Authorization", student.auth).send({ stationId: station._id.toString(), mode: "single-player" });
  assert.equal(start.status, 403);
  assert.equal((await request(app).get("/api/osce").set("Authorization", admin.auth)).status, 200);

  const site = await request(app).get("/api/site").set("Authorization", student.auth);
  assert.equal(site.body.data.sections.stations, false);

  const bad = await request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ sections: { secret: true } });
  assert.equal(bad.status, 400);
});

test("switching the AI patient off removes the mode and blocks new AI sessions", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s2@example.com");
  await request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ aiPatient: false });
  const list = await request(app).get("/api/osce").set("Authorization", student.auth);
  const row = list.body.data.modules.find((m) => m.slug === station.slug);
  assert.equal(row.aiVirtualPatientAvailable, false);
  assert.equal(row.practiceOptions.includes("virtual-patient"), false);
  const ai = await request(app).post("/api/osce/attempts").set("Authorization", student.auth).send({ stationId: station._id.toString(), mode: "virtual-patient" });
  assert.equal(ai.status, 403);
  const free = await request(app).post("/api/osce/attempts").set("Authorization", student.auth).send({ stationId: station._id.toString(), mode: "single-player" });
  assert.equal(free.status, 201);
});

test("signups can be closed", async () => {
  const admin = await account("admin@example.com", "admin");
  await request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ signupsOpen: false });
  assert.equal((await request(app).get("/api/public/site")).body.data.signupsOpen, false);
  const res = await request(app).post("/api/auth/register").send({ fullName: "Late", email: "late@example.com", password: PASSWORD });
  assert.equal(res.status, 403);
  assert.equal(res.body.code, "SIGNUPS_CLOSED");
});

test("pricing changes apply to signup credits, session costs and packages", async () => {
  const admin = await account("admin@example.com", "admin");
  const saved = await request(app).patch("/api/admin/settings/pricing").set("Authorization", admin.auth).send({
    welcomeCredits: 12,
    costs: { virtualPatient: 4, aiAssessment: 3 },
    packages: [{ name: "Exam week", credits: 100, pricePkr: 499 }],
  });
  assert.equal(saved.status, 200, saved.body.message);

  const student = await account("s3@example.com");
  assert.equal((await User.findById(student.id).lean()).creditBalance, 12);
  const credits = await request(app).get("/api/credits").set("Authorization", student.auth);
  assert.equal(credits.body.data.costs.fullStation, 7);
  const pub = await request(app).get("/api/public/credit-packages");
  assert.deepEqual(pub.body.data.packages, [{ id: "exam-week", name: "Exam week", credits: 100, pricePkr: 499 }]);

  const started = await request(app).post("/api/osce/attempts").set("Authorization", student.auth).send({ stationId: station._id.toString(), mode: "virtual-patient" });
  assert.equal(started.status, 201);
  assert.equal(started.body.data.credits.charged, 4);
  assert.equal(started.body.data.credits.balance, 8);

  for (const bad of [{ welcomeCredits: -1 }, { costs: { virtualPatient: 0 } }, { packages: [{ name: "", credits: 1, pricePkr: 1 }] }, { packages: [{ name: "X", credits: 1.5, pricePkr: 1 }] }]) {
    assert.equal((await request(app).patch("/api/admin/settings/pricing").set("Authorization", admin.auth).send(bad)).status, 400);
  }

  await request(app).patch("/api/admin/settings/pricing").set("Authorization", admin.auth).send({ welcomeCredits: 0 });
  const none = await account("s4@example.com");
  assert.equal((await User.findById(none.id).lean()).creditBalance, 0);
  assert.equal(await CreditTransaction.countDocuments({ userId: none.id }), 0);
});

test("announcements: admin manages them, students see only live ones", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s5@example.com");
  const created = await request(app).post("/api/admin/announcements").set("Authorization", admin.auth)
    .send({ title: "Mock exam on Friday", message: "Practise two stations a day.", tone: "info", linkLabel: "Practise", linkHref: "/stations" });
  assert.equal(created.status, 201);
  await request(app).post("/api/admin/announcements").set("Authorization", admin.auth).send({ title: "Old", active: false });
  await request(app).post("/api/admin/announcements").set("Authorization", admin.auth).send({ title: "Expired", endsAt: new Date(Date.now() - 1000).toISOString() });

  let site = await request(app).get("/api/site").set("Authorization", student.auth);
  assert.deepEqual(site.body.data.announcements.map((a) => a.title), ["Mock exam on Friday"]);

  const off = await request(app).patch(`/api/admin/announcements/${created.body.data.id}`).set("Authorization", admin.auth).send({ active: false });
  assert.equal(off.body.data.active, false);
  site = await request(app).get("/api/site").set("Authorization", student.auth);
  assert.equal(site.body.data.announcements.length, 0);

  const unsafe = await request(app).post("/api/admin/announcements").set("Authorization", admin.auth).send({ title: "x", linkHref: "javascript:alert(1)" });
  assert.equal(unsafe.status, 400);
  assert.equal((await request(app).post("/api/admin/announcements").set("Authorization", admin.auth).send({ message: "no title" })).status, 400);

  const del = await request(app).delete(`/api/admin/announcements/${created.body.data.id}`).set("Authorization", admin.auth);
  assert.equal(del.status, 200);
  assert.equal((await request(app).get("/api/admin/announcements").set("Authorization", admin.auth)).body.data.length, 2);
});

test("admins can edit, suspend, re-credit and delete accounts", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s6@example.com");

  const renamed = await request(app).patch(`/api/admin/users/${student.id}`).set("Authorization", admin.auth).send({ fullName: "Ayesha Raza", role: "contributor" });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.data.user.role, "contributor");

  const added = await request(app).post(`/api/admin/users/${student.id}/credits`).set("Authorization", admin.auth).send({ amount: 20, note: "Exam bonus" });
  assert.equal(added.status, 200);
  const before = added.body.data.balance;
  const tooMuch = await request(app).post(`/api/admin/users/${student.id}/credits`).set("Authorization", admin.auth).send({ amount: -(before + 1) });
  assert.equal(tooMuch.status, 409);
  const removed = await request(app).post(`/api/admin/users/${student.id}/credits`).set("Authorization", admin.auth).send({ amount: -5 });
  assert.equal(removed.body.data.balance, before - 5);
  const ledger = await CreditTransaction.find({ userId: student.id, reason: "admin-adjust" }).sort({ createdAt: 1 }).lean();
  assert.deepEqual(ledger.map((row) => [row.type, row.amount, row.createdBy]), [["grant", 20, admin.email], ["deduct", -5, admin.email]]);

  const detail = await request(app).get(`/api/admin/users/${student.id}`).set("Authorization", admin.auth);
  assert.equal(detail.body.data.transactions.length >= 2, true);

  // Suspension ends the session and blocks sign-in.
  const relogin = await request(app).post("/api/auth/login").send({ email: student.email, password: PASSWORD });
  const fresh = `Bearer ${relogin.body.data.token}`;
  await request(app).patch(`/api/admin/users/${student.id}`).set("Authorization", admin.auth).send({ suspended: true });
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", fresh)).status, 401);
  const blocked = await request(app).post("/api/auth/login").send({ email: student.email, password: PASSWORD });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, "ACCOUNT_SUSPENDED");
  await request(app).patch(`/api/admin/users/${student.id}`).set("Authorization", admin.auth).send({ suspended: false });
  assert.equal((await request(app).post("/api/auth/login").send({ email: student.email, password: PASSWORD })).status, 200);

  const wrongConfirm = await request(app).post(`/api/admin/users/${student.id}/delete`).set("Authorization", admin.auth).send({ confirmation: "nope" });
  assert.equal(wrongConfirm.status, 400);
  const gone = await request(app).post(`/api/admin/users/${student.id}/delete`).set("Authorization", admin.auth).send({ confirmation: student.email });
  assert.equal(gone.status, 200);
  assert.equal(await User.exists({ _id: student.id }), null);
  assert.equal(await CreditTransaction.countDocuments({ userId: student.id }), 0);
});

test("an admin can't lock themselves out or remove the last admin", async () => {
  const admin = await account("admin@example.com", "admin");
  for (const body of [{ role: "student" }, { suspended: true }]) {
    assert.equal((await request(app).patch(`/api/admin/users/${admin.id}`).set("Authorization", admin.auth).send(body)).status, 409);
  }
  assert.equal((await request(app).post(`/api/admin/users/${admin.id}/delete`).set("Authorization", admin.auth).send({ confirmation: admin.email })).status, 409);

  const other = await account("admin2@example.com", "admin");
  assert.equal((await request(app).patch(`/api/admin/users/${other.id}`).set("Authorization", admin.auth).send({ role: "student" })).status, 200);
});

test("admins can edit a station's content, with validation and an audit entry", async () => {
  const admin = await account("admin@example.com", "admin");
  const id = station._id.toString();
  const loaded = await request(app).get(`/api/admin/osce/${id}`).set("Authorization", admin.auth);
  assert.equal(loaded.status, 200);
  assert.equal(loaded.body.data.title, station.title);

  const saved = await request(app).patch(`/api/admin/osce/${id}`).set("Authorization", admin.auth).send({
    title: "Chest pain: focused history",
    timeLimitSeconds: 480,
    practiceModes: ["single-player"],
    candidateInstructions: { tasks: ["Take a focused history.", " ", "Explain your next steps."] },
    criticalSafetyErrors: ["Misses red flags."],
  });
  assert.equal(saved.status, 200, saved.body.message);
  const after = await OsceStation.findById(id).lean();
  assert.equal(after.title, "Chest pain: focused history");
  assert.equal(after.timeLimitSeconds, 480);
  assert.deepEqual(after.practiceModes, ["single-player"]);
  assert.deepEqual(after.candidateInstructions.tasks, ["Take a focused history.", "Explain your next steps."]);
  assert.equal(after.version, station.version + 1);
  assert.equal(await ContentAuditLog.countDocuments({ contentId: id, action: "updated" }), 1);

  for (const bad of [{ title: "" }, { timeLimitSeconds: 5 }, { practiceModes: [] }, { difficulty: "impossible" }, { specialtyId: "nope" }]) {
    assert.equal((await request(app).patch(`/api/admin/osce/${id}`).set("Authorization", admin.auth).send(bad)).status, 400, JSON.stringify(bad));
  }
  assert.equal((await request(app).get("/api/admin/osce/specialties").set("Authorization", admin.auth)).body.data.length >= 1, true);
});
