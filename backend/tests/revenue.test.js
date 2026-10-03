import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { CreditTransaction } from "../src/models/CreditTransaction.js";
import { Payment } from "../src/models/Payment.js";
import { User } from "../src/models/User.js";

let mongod;
let app;

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

const balance = async (id) => (await User.findById(id).lean()).creditBalance;

test("revenue and payments are admin only", async () => {
  const student = await account("s@example.com");
  for (const [method, path] of [["get", "/api/admin/revenue"], ["get", "/api/admin/payments"], ["get", "/api/admin/payments/export"], ["post", "/api/admin/payments"]]) {
    assert.equal((await request(app)[method](path).set("Authorization", student.auth).send({})).status, 403, `${method} ${path}`);
  }
});

test("a recorded payment adds the package's credits and shows in the report", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("buyer@example.com");
  const before = await balance(student.id);

  const bad = await request(app).post("/api/admin/payments").set("Authorization", admin.auth).send({ email: "nobody@example.com", packageId: "starter" });
  assert.equal(bad.status, 400);

  const paid = await request(app).post("/api/admin/payments").set("Authorization", admin.auth)
    .send({ email: "BUYER@example.com", packageId: "standard", method: "bank-transfer", reference: "TX-1001" });
  assert.equal(paid.status, 201, paid.body.message);
  assert.equal(paid.body.data.payment.amount, 1999);
  assert.equal(paid.body.data.payment.credits, 480);
  assert.equal(await balance(student.id), before + 480);
  assert.ok(await CreditTransaction.exists({ userId: student.id, reason: "purchase", amount: 480 }));

  const dup = await request(app).post("/api/admin/payments").set("Authorization", admin.auth).send({ email: student.email, packageId: "standard", reference: "TX-1001" });
  assert.equal(dup.status, 409);

  const custom = await request(app).post("/api/admin/payments").set("Authorization", admin.auth).send({ email: student.email, amount: 500, credits: 100, method: "cash" });
  assert.equal(custom.status, 201, custom.body.message);

  const report = await request(app).get("/api/admin/revenue?days=30").set("Authorization", admin.auth);
  assert.equal(report.status, 200, report.body.message);
  const r = report.body.data;
  assert.equal(r.bucket, "day");
  assert.equal(r.series.length, 30);
  assert.equal(r.current.gross, 2499);
  assert.equal(r.current.net, 2499);
  assert.equal(r.current.payments, 2);
  assert.equal(r.current.customers, 1);
  assert.equal(r.current.newCustomers, 1);
  assert.equal(r.current.averageOrder, 1250);
  assert.equal(r.series.at(-1).revenue, 2499);
  assert.deepEqual(r.byPackage.map((p) => p.label), ["Standard", "Custom amount"]);
  assert.equal(r.credits.sold, 580);
  assert.equal(r.lifetime.net, 2499);

  const monthly = await request(app).get("/api/admin/revenue?days=365&bucket=month").set("Authorization", admin.auth);
  assert.equal(monthly.body.data.bucket, "month");
  assert.equal(monthly.body.data.series.reduce((s, row) => s + row.revenue, 0), 2499);

  const listed = await request(app).get("/api/admin/payments?q=buyer").set("Authorization", admin.auth);
  assert.equal(listed.body.data.total, 2);
  assert.equal(listed.body.data.payments[0].email, student.email);
});

test("a refund marks the payment, takes credits back if asked, and lowers net revenue", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("buyer@example.com");
  const paid = await request(app).post("/api/admin/payments").set("Authorization", admin.auth).send({ email: student.email, amount: 1000, credits: 200, method: "mobile-wallet" });
  const id = paid.body.data.payment.id;
  const withCredits = await balance(student.id);

  const refund = await request(app).post(`/api/admin/payments/${id}/refund`).set("Authorization", admin.auth).send({ removeCredits: true, note: "Paid twice" });
  assert.equal(refund.status, 200, refund.body.message);
  assert.equal(refund.body.data.payment.status, "refunded");
  assert.equal(refund.body.data.creditsRemoved, 200);
  assert.equal(await balance(student.id), withCredits - 200);
  assert.equal((await request(app).post(`/api/admin/payments/${id}/refund`).set("Authorization", admin.auth).send({})).status, 409);

  const r = (await request(app).get("/api/admin/revenue?days=7").set("Authorization", admin.auth)).body.data;
  assert.equal(r.current.gross, 1000);
  assert.equal(r.current.refunds, 1000);
  assert.equal(r.current.net, 0);
});

test("payments export as a spreadsheet with formula-looking cells made safe", async () => {
  const admin = await account("admin@example.com", "admin");
  const student = await account("buyer@example.com");
  await Payment.create({ userId: student.id, amount: 999, credits: 220, packageName: "Starter", method: "cash", paidAt: new Date(), note: "=HYPERLINK(\"x\")" });
  const csv = await request(app).get("/api/admin/payments/export").set("Authorization", admin.auth);
  assert.equal(csv.status, 200);
  assert.match(csv.headers["content-type"], /text\/csv/);
  const [header, row] = csv.text.split("\n");
  assert.match(header, /^Date paid,Email/);
  assert.match(row, /buyer@example.com/);
  assert.match(row, /"'=HYPERLINK\(""x""\)"/);
});
