import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { AccessPeriod } from "../src/models/AccessPeriod.js";
import { AdminAuditLog } from "../src/models/AdminAuditLog.js";
import { Checkout } from "../src/models/Checkout.js";
import { Payment } from "../src/models/Payment.js";
import { PasswordResetToken } from "../src/models/PasswordResetToken.js";
import { User } from "../src/models/User.js";
import { WebhookEvent } from "../src/models/WebhookEvent.js";
import { outbox } from "../src/services/email/index.js";
import { testProvider } from "../src/services/payments/providers/test.provider.js";
import { sendAccessReminders } from "../src/services/reminders.service.js";

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
  // The duplicate checks rely on unique indexes, which the drop removed.
  await Promise.all([WebhookEvent, Payment, PasswordResetToken, Checkout].map((model) => model.syncIndexes()));
  outbox.length = 0;
});

async function account(email, role = "student") {
  const res = await request(app).post("/api/auth/register").set("User-Agent", "Mozilla/5.0 (Macintosh) Chrome/130.0").send({ fullName: "Test Person", email, password: "StrongPass123" });
  assert.equal(res.status, 201, res.body.message);
  await User.updateOne({ _id: res.body.data.user.id }, { $set: { role, creditBalance: 0 } });
  return { auth: `Bearer ${res.body.data.token}`, id: res.body.data.user.id, email };
}

async function paymentsOn() {
  const admin = await account("admin@example.com", "admin");
  const res = await request(app).patch("/api/admin/settings/site").set("Authorization", admin.auth).send({ onlinePayments: true, requireSubscription: true });
  assert.equal(res.status, 200, res.body.message);
  return admin;
}

const start = (user, item) => request(app).post("/api/payments/checkouts").set("Authorization", user.auth).send({ item });
const deliver = ({ rawBody, headers }) => request(app).post("/api/payments/webhooks/test").set(headers).set("Content-Type", "application/json").send(rawBody.toString("utf8"));

// A notification signed with the test secret, for any body we like.
function signed(body, timestamp = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", env.paymentTestSecret).update(`${timestamp}.${raw}`).digest("hex");
  return { rawBody: Buffer.from(raw), headers: { "x-test-signature": `t=${timestamp},v1=${sig}` } };
}
const paidEvent = (checkout, overrides = {}) => ({
  id: `evt_${crypto.randomBytes(6).toString("hex")}`,
  type: "payment.succeeded",
  data: { reference: checkout.providerRef, checkoutId: String(checkout._id), amount: checkout.amount, currency: checkout.currency, ...overrides },
});

test("checkout is off until the admin switches online payments on", async () => {
  const student = await account("s@example.com");
  const options = await request(app).get("/api/payments/options").set("Authorization", student.auth);
  assert.equal(options.status, 200);
  assert.equal(options.body.data.enabled, false);
  const res = await start(student, "monthly-access");
  assert.equal(res.status, 409);
  assert.equal(res.body.code, "PAYMENTS_OFF");
  assert.equal(await Checkout.countDocuments(), 0);
});

test("a paid monthly pass grants access once, with a receipt, at the server's price", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  const options = await request(app).get("/api/payments/options").set("Authorization", student.auth);
  assert.equal(options.body.data.enabled, true);
  assert.equal(options.body.data.test, true);

  // The browser can't choose the price.
  const res = await request(app).post("/api/payments/checkouts").set("Authorization", student.auth).send({ item: "monthly-access", amount: 1, pricePkr: 1 });
  assert.equal(res.status, 201, res.body.message);
  assert.equal(res.body.data.checkout.amount, 1499);
  assert.match(res.body.data.redirectUrl, /\/checkout\/test\//);
  const id = res.body.data.checkout.id;

  const site = await request(app).get("/api/site").set("Authorization", student.auth);
  assert.equal(site.body.data.access.hasAccess, false);

  const paid = await request(app).post(`/api/payments/checkouts/${id}/test-complete`).set("Authorization", student.auth).send({ outcome: "paid" });
  assert.equal(paid.status, 200, paid.body.message);
  assert.equal(paid.body.data.checkout.status, "paid");

  const after = await request(app).get("/api/site").set("Authorization", student.auth);
  assert.equal(after.body.data.access.hasAccess, true);
  const payment = await Payment.findOne({ userId: student.id }).lean();
  assert.equal(payment.method, "online");
  assert.equal(payment.amount, 1499);
  assert.equal(payment.provider, "test");
  assert.equal(await AccessPeriod.countDocuments({ userId: student.id, source: "processor" }), 1);
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(outbox.some((m) => m.to === student.email && /receipt/i.test(m.subject)));

  // Completing it again does nothing more.
  await request(app).post(`/api/payments/checkouts/${id}/test-complete`).set("Authorization", student.auth).send({ outcome: "paid" });
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal(await AccessPeriod.countDocuments({ userId: student.id }), 1);
});

test("an AI credit pack adds the pack's credits", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  const res = await start(student, "starter");
  assert.equal(res.status, 201, res.body.message);
  await request(app).post(`/api/payments/checkouts/${res.body.data.checkout.id}/test-complete`).set("Authorization", student.auth).send({ outcome: "paid" });
  assert.equal((await User.findById(student.id).lean()).creditBalance, 220);
  assert.equal(await AccessPeriod.countDocuments({ userId: student.id }), 0);
  assert.equal((await start(student, "not-a-pack")).status, 400);
});

test("a declined payment grants nothing", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  const res = await start(student, "monthly-access");
  const done = await request(app).post(`/api/payments/checkouts/${res.body.data.checkout.id}/test-complete`).set("Authorization", student.auth).send({ outcome: "failed" });
  assert.equal(done.body.data.checkout.status, "failed");
  assert.equal(await Payment.countDocuments(), 0);
  assert.equal(await AccessPeriod.countDocuments(), 0);
});

test("notifications with a bad, missing or old signature are refused", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  await start(student, "monthly-access");
  const checkout = await Checkout.findOne().lean();

  const forged = signed(paidEvent(checkout));
  forged.headers["x-test-signature"] = forged.headers["x-test-signature"].replace(/v1=./, "v1=0");
  assert.equal((await deliver(forged)).status, 400);

  const unsigned = signed(paidEvent(checkout));
  assert.equal((await request(app).post("/api/payments/webhooks/test").set("Content-Type", "application/json").send(unsigned.rawBody.toString())).status, 400);

  // Signed, but the body was changed afterwards.
  const tampered = signed(paidEvent(checkout));
  const body = JSON.parse(tampered.rawBody.toString());
  body.data.amount = 1;
  assert.equal((await deliver({ rawBody: Buffer.from(JSON.stringify(body)), headers: tampered.headers })).status, 400);

  const stale = signed(paidEvent(checkout), Math.floor(Date.now() / 1000) - 10 * 60);
  assert.equal((await deliver(stale)).status, 400);

  // A provider that isn't the one in use.
  assert.equal((await request(app).post("/api/payments/webhooks/other").send({})).status, 404);

  assert.equal(await Payment.countDocuments(), 0);
  assert.equal((await Checkout.findById(checkout._id).lean()).status, "pending");
});

test("the same notification delivered twice, or two events for one checkout, grant once", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  await start(student, "monthly-access");
  const checkout = await Checkout.findOne().lean();
  const event = signed(paidEvent(checkout));
  const [a, b] = await Promise.all([deliver(event), deliver(event)]);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.deepEqual([a.body.data.outcome, b.body.data.outcome].sort(), ["duplicate", "paid"]);

  const second = await deliver(signed(paidEvent(checkout)));
  assert.equal(second.body.data.outcome, "already-paid");
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal(await AccessPeriod.countDocuments(), 1);
});

test("a payment for the wrong amount is held for review and grants nothing", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  await start(student, "monthly-access");
  const checkout = await Checkout.findOne().lean();
  const res = await deliver(signed(paidEvent(checkout, { amount: 10 })));
  assert.equal(res.body.data.outcome, "amount-mismatch");
  assert.equal((await Checkout.findById(checkout._id).lean()).status, "review");
  assert.equal(await Payment.countDocuments(), 0);
  assert.equal(await AccessPeriod.countDocuments(), 0);
  assert.equal(await AdminAuditLog.countDocuments({ action: "Online payment held for review" }), 1);

  // Wrong reference for the checkout id: ignored.
  await start(student, "monthly-access");
  const other = await Checkout.findOne({ status: "pending" }).lean();
  const wrongRef = await deliver(signed(paidEvent({ ...other, providerRef: "test_someone_else" })));
  assert.equal(wrongRef.body.data.outcome, "unknown-checkout");
  assert.equal(await Payment.countDocuments(), 0);
});

test("students only see and complete their own checkouts", async () => {
  await paymentsOn();
  const owner = await account("owner@example.com");
  const other = await account("other@example.com");
  const res = await start(owner, "monthly-access");
  const id = res.body.data.checkout.id;
  assert.equal((await request(app).get(`/api/payments/checkouts/${id}`).set("Authorization", other.auth)).status, 404);
  assert.equal((await request(app).post(`/api/payments/checkouts/${id}/test-complete`).set("Authorization", other.auth).send({ outcome: "paid" })).status, 404);
  assert.equal((await request(app).get(`/api/payments/checkouts/${id}`).set("Authorization", owner.auth)).body.data.checkout.status, "pending");
  assert.equal((await request(app).get("/api/payments/options")).status, 401);
  assert.equal(await Payment.countDocuments(), 0);
});

test("pretend payments are off on the live site", async () => {
  await paymentsOn();
  const student = await account("s@example.com");
  const was = env.isProduction;
  env.isProduction = true;
  try {
    const options = await request(app).get("/api/payments/options").set("Authorization", student.auth);
    assert.equal(options.body.data.enabled, false);
    assert.equal((await start(student, "monthly-access")).status, 409);
    const checkout = { _id: new mongoose.Types.ObjectId(), providerRef: "test_x", amount: 1499, currency: "PKR" };
    assert.equal((await deliver(testProvider.buildEvent(checkout, "paid"))).status, 404);
  } finally {
    env.isProduction = was;
  }
});

test("password reset: same answer for any email, link works once, signs out everywhere", async () => {
  const student = await account("s@example.com");
  const unknown = await request(app).post("/api/auth/forgot").send({ email: "nobody@example.com" });
  const known = await request(app).post("/api/auth/forgot").send({ email: "S@Example.com" });
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.body, known.body);
  assert.equal(outbox.length, 1);
  const token = new URL(outbox[0].text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");
  assert.ok(token);
  // Only a hash is stored.
  assert.equal(await PasswordResetToken.countDocuments({ tokenHash: token }), 0);

  // Asking again straight away doesn't send another.
  await request(app).post("/api/auth/forgot").send({ email: "s@example.com" });
  assert.equal(outbox.length, 1);

  assert.equal((await request(app).post("/api/auth/reset").send({ token, password: "short" })).status, 400);
  const ok = await request(app).post("/api/auth/reset").send({ token, password: "NewPassword456" });
  assert.equal(ok.status, 200, ok.body.message);
  assert.equal((await request(app).post("/api/auth/reset").send({ token, password: "Another789xyz" })).status, 400);

  // The old sign-in no longer works; the new password does.
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", student.auth)).status, 401);
  assert.equal((await request(app).post("/api/auth/login").send({ email: "s@example.com", password: "StrongPass123" })).status, 401);
  assert.equal((await request(app).post("/api/auth/login").send({ email: "s@example.com", password: "NewPassword456" })).status, 200);
});

test("password reset links expire, and a newer link replaces the older one", async () => {
  await account("s@example.com");
  await request(app).post("/api/auth/forgot").send({ email: "s@example.com" });
  const first = new URL(outbox[0].text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");
  await PasswordResetToken.collection.updateMany({}, { $set: { createdAt: new Date(Date.now() - 10 * 60 * 1000) } });
  await request(app).post("/api/auth/forgot").send({ email: "s@example.com" });
  assert.equal(outbox.length, 2);
  const second = new URL(outbox[1].text.match(/https?:\/\/\S+/)[0]).searchParams.get("token");
  assert.equal((await request(app).post("/api/auth/reset").send({ token: first, password: "NewPassword456" })).status, 400);

  await PasswordResetToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await request(app).post("/api/auth/reset").send({ token: second, password: "NewPassword456" })).status, 400);
});

test("access reminders are sent once before the pass ends and once after", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("s@example.com");
  const later = await account("later@example.com");
  const now = Date.now();
  await AccessPeriod.create([
    { userId: student.id, from: new Date(now - 27 * DAY), to: new Date(now + 3 * DAY), days: 30, source: "admin-grant", createdBy: "test" },
    { userId: later.id, from: new Date(now), to: new Date(now + 20 * DAY), days: 20, source: "admin-grant", createdBy: "test" },
    { userId: admin.id, from: new Date(now - 27 * DAY), to: new Date(now + 3 * DAY), days: 30, source: "admin-grant", createdBy: "test" },
  ]);
  assert.equal(await sendAccessReminders(), 1);
  assert.equal(await sendAccessReminders(), 0);
  assert.equal(outbox.filter((m) => m.to === student.email).length, 1);

  // Four days later the pass has ended: one more, then nothing.
  const ended = new Date(now + 4 * DAY);
  assert.equal(await sendAccessReminders(ended), 1);
  assert.equal(await sendAccessReminders(ended), 0);
  assert.equal(outbox.filter((m) => m.to === student.email).length, 2);
  assert.equal(outbox.filter((m) => m.to !== student.email).length, 0);
});
