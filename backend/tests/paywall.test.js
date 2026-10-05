import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { importContent } from "../src/content/importContent.js";
import { resetContentCache } from "../src/services/content.service.js";
import { seedOsceContent } from "../src/seed/osce.seed.js";
import { AccessPeriod } from "../src/models/AccessPeriod.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";

let mongod;
let app;
let station;
const DAY = 24 * 60 * 60 * 1000;

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
  await mongoose.connection.db.dropDatabase();
  await importContent();
  resetContentCache();
  station = (await seedOsceContent()).module;
});

async function account(email, role = "student", { credits = 0 } = {}) {
  const res = await request(app).post("/api/auth/register").set("User-Agent", "Mozilla/5.0 (Macintosh) Chrome/130.0").send({ fullName: "Test Person", email, password: "StrongPass123" });
  assert.equal(res.status, 201, res.body.message);
  await User.updateOne({ _id: res.body.data.user.id }, { $set: { role, creditBalance: credits } });
  return { auth: `Bearer ${res.body.data.token}`, id: res.body.data.user.id, email };
}

const on = async (admin) => request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ requireSubscription: true });
const grant = (admin, user, days = 30) => request(app).post(`/api/admin/users/${user.id}/access`).set("Authorization", admin.auth).send({ days, reason: "Test" });

// Every study route, as one table: each must refuse an account without a pass.
const PROTECTED = () => [
  ["get", "/api/dashboard/summary"],
  ["get", "/api/osce"],
  ["get", `/api/osce/${station.slug}`],
  ["get", `/api/osce/${station.slug}/single-player`],
  ["get", "/api/osce/attempts"],
  ["post", "/api/osce/attempts", { stationId: station._id.toString(), mode: "single-player" }],
  ["get", "/api/content/catalog"],
  ["get", "/api/content/guides/history"],
  ["get", "/api/content/guides/exam/cardiovascular-examination"],
  ["get", "/api/content/guides/handouts"],
  ["get", "/api/content/mcqs/mbbs-1/foundation"],
  ["get", "/api/content/ospe/mbbs-1/foundation"],
];

test("every study route returns 402 without a pass and opens with one", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  await on(admin);
  for (const [method, path, body] of PROTECTED()) {
    const res = await request(app)[method](path).set("Authorization", student.auth).send(body || {});
    assert.equal(res.status, 402, `${method} ${path} should need a pass`);
    assert.equal(res.body.code, "SUBSCRIPTION_REQUIRED");
  }
  // Still open without a pass: account, settings, credits, site switches.
  for (const path of ["/api/auth/me", "/api/site", "/api/credits", "/api/auth/sessions"]) {
    assert.equal((await request(app).get(path).set("Authorization", student.auth)).status, 200, path);
  }
  await grant(admin, student);
  for (const [method, path, body] of PROTECTED()) {
    const res = await request(app)[method](path).set("Authorization", student.auth).send(body || {});
    assert.ok([200, 201].includes(res.status), `${method} ${path} gave ${res.status}: ${res.body.message}`);
  }
  // Admins never need one, and nothing is locked while the switch is off.
  assert.equal((await request(app).get("/api/content/catalog").set("Authorization", admin.auth)).status, 200);
  await request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ requireSubscription: false });
  const other = await account("o@example.com");
  assert.equal((await request(app).get("/api/content/catalog").set("Authorization", other.auth)).status, 200);
});

test("content comes one block at a time, privately cached, never without signing in", async () => {
  const student = await account("s@example.com");
  assert.equal((await request(app).get("/api/content/catalog")).status, 401);

  const catalog = await request(app).get("/api/content/catalog").set("Authorization", student.auth);
  assert.equal(catalog.status, 200);
  assert.match(catalog.headers["cache-control"], /private, no-cache/);
  const year = catalog.body.data.mcq[0];
  const block = year.blocks[0];
  // The catalog has names and counts, but no questions.
  assert.ok(!JSON.stringify(catalog.body.data).includes('"questions"'));

  const res = await request(app).get(`/api/content/mcqs/${year.slug}/${block.slug}`).set("Authorization", student.auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.questions.length, block.count);
  assert.ok(res.headers.etag);
  const again = await request(app).get(`/api/content/mcqs/${year.slug}/${block.slug}`).set("Authorization", student.auth).set("If-None-Match", res.headers.etag);
  assert.equal(again.status, 304);

  const topic = block.topics[0];
  const one = await request(app).get(`/api/content/mcqs/${year.slug}/${block.slug}?topic=${topic.slug}`).set("Authorization", student.auth);
  assert.equal(one.body.data.questions.length, topic.count);
  // No whole-year endpoint, and bad slugs are just not found.
  assert.equal((await request(app).get(`/api/content/mcqs/${year.slug}`).set("Authorization", student.auth)).status, 404);
  assert.equal((await request(app).get(`/api/content/mcqs/${year.slug}/..%2F..`).set("Authorization", student.auth)).status, 404);
  assert.equal((await request(app).get("/api/content/guides/secrets").set("Authorization", student.auth)).status, 404);

  const page = await request(app).get("/api/content/guides/handouts").set("Authorization", student.auth);
  assert.ok(page.body.data.entries.length > 0);
  assert.equal(page.body.data.entries[0].sections, undefined, "guide lists carry no page bodies");
  const first = page.body.data.entries[0].slug;
  const full = await request(app).get(`/api/content/guides/handouts/${first}`).set("Authorization", student.auth);
  assert.ok(full.body.data.entry.sections.length > 0);
});

test("a third device signs out the oldest; devices can be listed and signed out", async () => {
  await account("s@example.com");
  const login = (ua) => request(app).post("/api/auth/login").set("User-Agent", ua).send({ email: "s@example.com", password: "StrongPass123" });
  // Registration was device one.
  const second = await login("Mozilla/5.0 (iPhone) Safari/604.1");
  const third = await login("Mozilla/5.0 (Windows NT 10.0) Firefox/131.0");
  const auth2 = `Bearer ${second.body.data.token}`;
  const auth3 = `Bearer ${third.body.data.token}`;

  const sessions = await request(app).get("/api/auth/sessions").set("Authorization", auth3);
  assert.equal(sessions.body.data.sessions.length, 2);
  assert.deepEqual(sessions.body.data.sessions.map((s) => s.device).sort(), ["Firefox on Windows", "Safari on iPhone"]);
  assert.ok(sessions.body.data.sessions.find((s) => s.current));

  // Device two signs device three out.
  const thirdId = sessions.body.data.sessions.find((s) => s.current).id;
  assert.equal((await request(app).post(`/api/auth/sessions/${thirdId}/revoke`).set("Authorization", auth2)).status, 200);
  const ended = await request(app).get("/api/auth/me").set("Authorization", auth3);
  assert.equal(ended.status, 401);
  assert.equal(ended.body.code, "SESSION_ENDED");

  // Signing out ends only that device.
  assert.equal((await request(app).post("/api/auth/logout").set("Authorization", auth2)).status, 200);
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", auth2)).status, 401);
  const fourth = await login("Mozilla/5.0 (Linux; Android 14) Chrome/130.0");
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${fourth.body.data.token}`)).status, 200);

  // Sign out everywhere.
  const fourthAuth = `Bearer ${fourth.body.data.token}`;
  assert.equal((await request(app).post("/api/auth/sessions/revoke-all").set("Authorization", fourthAuth)).status, 200);
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", fourthAuth)).status, 401);
  assert.equal(await Session.countDocuments({ revokedAt: null }), 0);
  // A validly signed token with no open session behind it is refused.
  const user = await User.findOne({ email: "s@example.com" }).lean();
  const noSession = jwt.sign({ sub: user._id.toString(), sv: user.sessionVersion }, env.jwtSecret, { algorithm: "HS256", expiresIn: "1h" });
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${noSession}`)).status, 401);
});

test("admins can see and sign out a student's devices, and many sign-ins get flagged", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  const detail = await request(app).get(`/api/admin/users/${student.id}`).set("Authorization", admin.auth);
  assert.equal(detail.body.data.sessions.length, 1);
  const sid = detail.body.data.sessions[0].id;
  assert.equal((await request(app).post(`/api/admin/users/${student.id}/sessions/${sid}/revoke`).set("Authorization", admin.auth)).status, 200);
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", student.auth)).status, 401);

  for (let i = 0; i < 6; i += 1) {
    await request(app).post("/api/auth/login").set("X-Forwarded-For", `10.0.0.${i}`).send({ email: "s@example.com", password: "StrongPass123" });
  }
  const list = await request(app).get("/api/admin/users").set("Authorization", admin.auth);
  assert.ok(list.body.data.find((u) => u.id === student.id).sharingFlag);
});

test("a station started with access can still be finished after the pass ends, but no new one", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com", "student", { credits: 10 });
  await on(admin);
  await grant(admin, student);
  const started = await request(app).post("/api/osce/attempts").set("Authorization", student.auth).send({ stationId: station._id.toString(), mode: "single-player" });
  assert.equal(started.status, 201, started.body.message);
  const id = started.body.data.attempt.id;

  // The pass and its grace days run out.
  await AccessPeriod.updateMany({ userId: student.id }, { $set: { to: new Date(Date.now() - 10 * DAY) } });
  assert.equal((await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", student.auth)).status, 200);
  assert.equal((await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", student.auth).send({ elapsedSeconds: 60 })).status, 200);
  const marked = await request(app).post(`/api/osce/attempts/${id}/self-assessment`).set("Authorization", student.auth).send({ checkedItemIds: [] });
  assert.equal(marked.status, 200, marked.body.message);
  // Marked: the result page (with the station review) now needs a pass again.
  assert.equal((await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", student.auth)).status, 402);
  assert.equal((await request(app).post("/api/osce/attempts").set("Authorization", student.auth).send({ stationId: station._id.toString(), mode: "single-player" })).status, 402);

  // An attempt from long ago can't be reopened either.
  const old = await OsceAttempt.create({ userId: student.id, stationId: station._id, mode: "single-player", status: "active", startedAt: new Date(Date.now() - 3 * DAY) });
  assert.equal((await request(app).get(`/api/osce/attempts/${old._id}`).set("Authorization", student.auth)).status, 402);
});
