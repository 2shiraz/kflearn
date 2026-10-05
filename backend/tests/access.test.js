import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AccessPeriod } from "../src/models/AccessPeriod.js";
import { User } from "../src/models/User.js";

let mongod;
let app;
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
});

async function account(email, role = "student") {
  const res = await request(app).post("/api/auth/register").send({ fullName: "Test Person", email, password: "StrongPass123" });
  assert.equal(res.status, 201, res.body.message);
  if (role !== "student") await User.updateOne({ _id: res.body.data.user.id }, { $set: { role } });
  return { auth: `Bearer ${res.body.data.token}`, id: res.body.data.user.id, email };
}

const requireSubscription = (admin, on) =>
  request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ requireSubscription: on });
const accessOf = async (user) => (await request(app).get("/api/site").set("Authorization", user.auth)).body.data.access;

test("with the switch off nobody is locked out; with it on, a new account has no access", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  const signup = await request(app).post("/api/auth/register").send({ fullName: "New Person", email: "new@example.com", password: "StrongPass123" });
  assert.equal(signup.body.data.access.required, false);
  assert.equal(signup.body.data.access.hasAccess, true);

  assert.equal((await requireSubscription(admin, true)).status, 200);
  const access = await accessOf(student);
  assert.equal(access.required, true);
  assert.equal(access.hasAccess, false);
  assert.equal(access.until, null);
  // Admins and contributors never need a pass.
  assert.equal((await accessOf(admin)).hasAccess, true);
  const contributor = await account("c@example.com", "contributor");
  assert.equal((await accessOf(contributor)).unlimited, true);
  // /me carries it too.
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", student.auth)).body.data.access.hasAccess, false);
});

test("grants stack: renewing early adds to the end date, after a lapse it starts from now", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  await requireSubscription(admin, true);

  const noReason = await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", admin.auth).send({ days: 30 });
  assert.equal(noReason.status, 400);
  const first = await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", admin.auth).send({ days: 30, reason: "Testing" });
  assert.equal(first.status, 201, first.body.message);
  const firstUntil = new Date(first.body.data.access.until).getTime();
  assert.ok(Math.abs(firstUntil - (Date.now() + 30 * DAY)) < 60_000);

  const second = await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", admin.auth).send({ days: 30, reason: "Renewal" });
  assert.ok(Math.abs(new Date(second.body.data.access.until).getTime() - (firstUntil + 30 * DAY)) < 1000);
  assert.equal((await accessOf(student)).active, true);

  // Lapsed long ago: the next grant starts now, not from the old end date.
  await AccessPeriod.updateMany({ userId: student.id }, { $set: { from: new Date(Date.now() - 100 * DAY), to: new Date(Date.now() - 40 * DAY) } });
  assert.equal((await accessOf(student)).hasAccess, false);
  const third = await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", admin.auth).send({ days: 30, reason: "Back" });
  assert.ok(Math.abs(new Date(third.body.data.access.until).getTime() - (Date.now() + 30 * DAY)) < 60_000);
});

test("the grace period keeps access for 3 days after the pass ends", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  await requireSubscription(admin, true);
  await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", admin.auth).send({ days: 30, reason: "Testing" });

  await AccessPeriod.updateMany({ userId: student.id }, { $set: { to: new Date(Date.now() - 1 * DAY) } });
  let access = await accessOf(student);
  assert.equal(access.active, false);
  assert.equal(access.inGrace, true);
  assert.equal(access.hasAccess, true);

  await AccessPeriod.updateMany({ userId: student.id }, { $set: { to: new Date(Date.now() - 4 * DAY) } });
  access = await accessOf(student);
  assert.equal(access.inGrace, false);
  assert.equal(access.hasAccess, false);
});

test("revoking a period takes the access away, and only once", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  await requireSubscription(admin, true);
  const granted = await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", admin.auth).send({ days: 30, reason: "Testing" });
  const periodId = granted.body.data.periods[0].id;

  const revoked = await request(app).post(`/api/admin/users/${student.id}/access/${periodId}/revoke`).set("Authorization", admin.auth);
  assert.equal(revoked.status, 200, revoked.body.message);
  assert.equal(revoked.body.data.access.hasAccess, false);
  assert.ok(revoked.body.data.periods[0].revokedAt);
  assert.equal((await request(app).post(`/api/admin/users/${student.id}/access/${periodId}/revoke`).set("Authorization", admin.auth)).status, 409);
  assert.equal((await request(app).post(`/api/admin/users/${student.id}/access/not-an-id/revoke`).set("Authorization", admin.auth)).status, 404);
  // Students can't grant themselves access.
  assert.equal((await request(app).post(`/api/admin/users/${student.id}/access`).set("Authorization", student.auth).send({ days: 30, reason: "x" })).status, 403);
});

test("a recorded subscription payment adds a pass, and refunding it takes the pass back", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  await requireSubscription(admin, true);

  const paid = await request(app).post("/api/admin/payments").set("Authorization", admin.auth).send({ email: student.email, kind: "subscription", method: "bank-transfer" });
  assert.equal(paid.status, 201, paid.body.message);
  assert.equal(paid.body.data.payment.amount, 1499);
  assert.equal(paid.body.data.payment.kind, "subscription");
  assert.equal(paid.body.data.payment.accessDays, 30);
  assert.equal(paid.body.data.payment.credits, 0);
  assert.equal((await accessOf(student)).active, true);

  const report = (await request(app).get("/api/admin/revenue?days=30").set("Authorization", admin.auth)).body.data;
  assert.equal(report.subscriptions.active, 1);
  assert.equal(report.subscriptions.newSubscribers, 1);
  assert.equal(report.subscriptions.expiringSoon, 0);

  const refund = await request(app).post(`/api/admin/payments/${paid.body.data.payment.id}/refund`).set("Authorization", admin.auth).send({});
  assert.equal(refund.status, 200, refund.body.message);
  assert.equal(refund.body.data.accessRevoked, true);
  assert.equal((await accessOf(student)).hasAccess, false);
});

test("an admin can set a temporary password that the student must change", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  const weak = await request(app).post(`/api/admin/users/${student.id}/password`).set("Authorization", admin.auth).send({ password: "short" });
  assert.equal(weak.status, 400);
  const set = await request(app).post(`/api/admin/users/${student.id}/password`).set("Authorization", admin.auth).send({ password: "TempPass2026" });
  assert.equal(set.status, 200, set.body.message);
  // Their old session ends; the temporary password works and is flagged.
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", student.auth)).status, 401);
  const login = await request(app).post("/api/auth/login").send({ email: student.email, password: "TempPass2026" });
  assert.equal(login.status, 200);
  assert.equal(login.body.data.user.mustChangePassword, true);
  const changed = await request(app).post("/api/auth/password").set("Authorization", `Bearer ${login.body.data.token}`).send({ currentPassword: "TempPass2026", newPassword: "MyOwnPass2026" });
  assert.equal(changed.status, 200, changed.body.message);
  assert.equal(changed.body.data.user.mustChangePassword, false);
  // Admin passwords can't be reset this way.
  assert.equal((await request(app).post(`/api/admin/users/${admin.id}/password`).set("Authorization", admin.auth).send({ password: "TempPass2026" })).status, 409);
});
