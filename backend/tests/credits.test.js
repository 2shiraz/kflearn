import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { seedHistoryContent } from "../src/seed/history.seed.js";
import { HistoryAttempt } from "../src/models/HistoryAttempt.js";
import { CreditTransaction } from "../src/models/CreditTransaction.js";
import { User } from "../src/models/User.js";
import { grantCredits } from "../src/services/credit.service.js";
import { CREDIT_COSTS, MAX_STUDENT_MESSAGES_PER_ATTEMPT, MAX_TRANSCRIPTIONS_PER_ATTEMPT } from "../src/config/credits.js";
import { env } from "../src/config/env.js";

let mongod;
let app;
let moduleId;

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
  await CreditTransaction.syncIndexes();
  const seeded = await seedHistoryContent();
  moduleId = seeded.module._id.toString();
});

async function registerUser(email, credits = 0) {
  const res = await request(app).post("/api/auth/register")
    .send({ fullName: "Credit Tester", email, password: "StrongPass123" });
  assert.equal(res.status, 201);
  const userId = res.body.data.user.id;
  if (credits > 0) await grantCredits({ userId, amount: credits, note: "test" });
  return { auth: `Bearer ${res.body.data.token}`, userId };
}

const balanceOf = async (userId) => (await User.findById(userId).lean()).creditBalance;
const startSession = (auth, mode = "virtual-patient", extra = {}) =>
  request(app).post("/api/history/attempts").set("Authorization", auth).send({ moduleId, mode, ...extra });

async function withoutAiProviders(fn) {
  const saved = [env.groqApiKey, env.openaiApiKey];
  env.groqApiKey = "";
  env.openaiApiKey = "";
  try {
    return await fn();
  } finally {
    [env.groqApiKey, env.openaiApiKey] = saved;
  }
}

test("new users start with zero credits and see server-side pricing", async () => {
  const { auth } = await registerUser("zero@example.com");
  const res = await request(app).get("/api/credits").set("Authorization", auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.balance, 0);
  assert.deepEqual(res.body.data.costs, { virtualPatient: 3, aiAssessment: 2, fullStation: 5 });
  const pro = res.body.data.packages.find((pkg) => pkg.id === "pro");
  assert.equal(pro.credits, 730);
  assert.equal(pro.fullStations, 146);
});

test("credit endpoints require authentication", async () => {
  assert.equal((await request(app).get("/api/credits")).status, 401);
  assert.equal((await request(app).get("/api/credits/transactions")).status, 401);
});

test("a virtual patient session cannot be started without credits", async () => {
  const { auth, userId } = await registerUser("broke@example.com", CREDIT_COSTS.virtualPatient - 1);
  const res = await startSession(auth);
  assert.equal(res.status, 402);
  assert.equal(res.body.code, "INSUFFICIENT_CREDITS");
  assert.equal(await HistoryAttempt.countDocuments({ userId }), 0);
  assert.equal(await balanceOf(userId), CREDIT_COSTS.virtualPatient - 1);
});

test("guided self-practice stays free", async () => {
  const { auth, userId } = await registerUser("free@example.com");
  const res = await startSession(auth, "single-player");
  assert.equal(res.status, 201);
  assert.equal(await balanceOf(userId), 0);
});

test("starting a virtual patient session debits once and records the ledger", async () => {
  const { auth, userId } = await registerUser("payer@example.com", 10);
  const res = await startSession(auth);
  assert.equal(res.status, 201);
  assert.deepEqual(res.body.data.credits, { balance: 7, charged: 3 });
  assert.equal(await balanceOf(userId), 7);
  const attempt = await HistoryAttempt.findById(res.body.data.attempt.id);
  assert.equal(attempt.billing.virtualPatientCharged, true);
  const spend = await CreditTransaction.findOne({ userId, type: "spend" }).lean();
  assert.equal(spend.amount, -3);
  assert.equal(spend.attemptId.toString(), res.body.data.attempt.id);
});

test("parallel session starts cannot double-spend the same credits", async () => {
  const { auth, userId } = await registerUser("racer@example.com", CREDIT_COSTS.virtualPatient);
  const results = await Promise.all(Array.from({ length: 8 }, () => startSession(auth)));
  assert.deepEqual(results.map((res) => res.status).sort(), [201, 402, 402, 402, 402, 402, 402, 402]);
  assert.equal(await balanceOf(userId), 0);
  assert.equal(await HistoryAttempt.countDocuments({ userId }), 1);
});

test("clients cannot set or mint their own credits", async () => {
  const register = await request(app).post("/api/auth/register").send({
    fullName: "Minter", email: "minter@example.com", password: "StrongPass123", creditBalance: 9999,
  });
  assert.equal(register.status, 201);
  const auth = `Bearer ${register.body.data.token}`;
  const userId = register.body.data.user.id;
  assert.equal(await balanceOf(userId), 0);

  await request(app).patch("/api/auth/me").set("Authorization", auth).send({ creditBalance: 9999, $inc: { creditBalance: 9999 } });
  assert.equal(await balanceOf(userId), 0);

  for (const method of ["post", "put", "patch", "delete"]) {
    assert.equal((await request(app)[method]("/api/credits").set("Authorization", auth).send({ balance: 9999 })).status, 404);
  }
  // Client-supplied billing flags are ignored.
  const forged = await startSession(auth, "virtual-patient", { billing: { virtualPatientCharged: true }, _id: new mongoose.Types.ObjectId() });
  assert.equal(forged.status, 402);
  assert.equal(await HistoryAttempt.countDocuments({ userId }), 0);
});

test("an unpaid session cannot use the AI patient or transcription", async () => {
  const { auth, userId } = await registerUser("unpaid@example.com", 50);
  const legacy = await HistoryAttempt.create({
    userId, historyModuleId: moduleId, mode: "virtual-patient", status: "active",
    billing: { virtualPatientCharged: false },
  });
  const message = await request(app).post(`/api/history/attempts/${legacy._id}/messages`).set("Authorization", auth).send({ text: "Do you smoke?" });
  assert.equal(message.status, 402);
  assert.equal(message.body.code, "SESSION_NOT_PAID");
  const audio = await request(app).post(`/api/history/attempts/${legacy._id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.from("fake audio"), { filename: "clip.webm", contentType: "audio/webm" });
  assert.equal(audio.status, 402);
  assert.equal((await HistoryAttempt.findById(legacy._id)).messages.length, 0);
  assert.equal(await balanceOf(userId), 50);
});

test("a free self-practice session cannot be used to reach the AI patient", async () => {
  const { auth } = await registerUser("sneaky@example.com");
  const created = await startSession(auth, "single-player");
  const id = created.body.data.attempt.id;
  assert.equal((await request(app).post(`/api/history/attempts/${id}/messages`).set("Authorization", auth).send({ text: "Hello" })).status, 409);
});

test("one paid session has a hard cap on questions and transcriptions", async () => {
  const { auth } = await registerUser("capped@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  await HistoryAttempt.updateOne({ _id: id }, { $set: {
    "usage.studentMessages": MAX_STUDENT_MESSAGES_PER_ATTEMPT,
    "usage.transcriptions": MAX_TRANSCRIPTIONS_PER_ATTEMPT,
  } });
  const message = await request(app).post(`/api/history/attempts/${id}/messages`).set("Authorization", auth).send({ text: "Do you smoke?" });
  assert.equal(message.status, 429);
  assert.equal(message.body.code, "STATION_LIMIT_REACHED");
  const audio = await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.from("fake audio"), { filename: "clip.webm", contentType: "audio/webm" });
  assert.equal(audio.status, 429);
});

test("parallel questions cannot exceed the per-session cap", async () => {
  const { auth } = await registerUser("burst@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  await HistoryAttempt.updateOne({ _id: id }, { $set: { "usage.studentMessages": MAX_STUDENT_MESSAGES_PER_ATTEMPT - 2 } });
  const results = await Promise.all(Array.from({ length: 6 }, () =>
    request(app).post(`/api/history/attempts/${id}/messages`).set("Authorization", auth).send({ text: "How old are you?" })));
  assert.equal(results.filter((res) => res.status === 200).length, 2);
  assert.equal(results.filter((res) => res.status === 429).length, 4);
  assert.equal((await HistoryAttempt.findById(id)).usage.studentMessages, MAX_STUDENT_MESSAGES_PER_ATTEMPT);
});

test("AI assessment is refused without credits and leaves the attempt re-assessable", async () => {
  const { auth, userId } = await registerUser("no.assess@example.com", CREDIT_COSTS.virtualPatient + 1);
  const id = (await startSession(auth)).body.data.attempt.id;
  await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth).send({});
  const res = await request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth);
  assert.equal(res.status, 402);
  assert.equal(res.body.code, "INSUFFICIENT_CREDITS");
  const attempt = await HistoryAttempt.findById(id);
  assert.equal(attempt.status, "ended");
  assert.equal(attempt.billing.aiAssessmentCharged, false);
  assert.equal(await balanceOf(userId), 1);
});

test("a failed AI assessment is refunded in full", async () => {
  const { auth, userId } = await registerUser("refund@example.com", 10);
  const id = (await startSession(auth)).body.data.attempt.id;
  await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth).send({});
  const res = await withoutAiProviders(() => request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth));
  assert.equal(res.status, 503);
  assert.equal(await balanceOf(userId), 7);
  const attempt = await HistoryAttempt.findById(id);
  assert.equal(attempt.status, "ended");
  assert.equal(attempt.billing.aiAssessmentCharged, false);
  const ledger = await CreditTransaction.find({ userId, reason: "ai-assessment" }).sort({ createdAt: 1 }).lean();
  assert.deepEqual(ledger.map((row) => row.amount), [-2, 2]);
});

test("parallel AI assessment requests never charge more than once", async () => {
  const { auth, userId } = await registerUser("assess.race@example.com", 10);
  const id = (await startSession(auth)).body.data.attempt.id;
  await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth).send({});
  const results = await withoutAiProviders(() => Promise.all(Array.from({ length: 5 }, () =>
    request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth))));
  assert.ok(results.every((res) => [409, 503].includes(res.status)));
  assert.equal(await balanceOf(userId), 7);
  const spends = await CreditTransaction.countDocuments({ userId, reason: "ai-assessment", type: "spend" });
  const refunds = await CreditTransaction.countDocuments({ userId, reason: "ai-assessment", type: "refund" });
  assert.equal(spends, refunds);
});

test("retrying a crashed, already-paid assessment does not charge again", async () => {
  const { auth, userId } = await registerUser("crashed@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  await HistoryAttempt.updateOne({ _id: id }, { $set: {
    status: "assessing", assessmentStartedAt: new Date(Date.now() - 11 * 60 * 1000),
    assessmentLeaseId: "crashed", "billing.aiAssessmentCharged": true,
  } });
  // Balance is 0, so a second charge would be a 402 — reaching the provider
  // (503 here) proves the retry was not billed.
  const res = await withoutAiProviders(() => request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth));
  assert.equal(res.status, 503);
});

test("users only see their own credit history", async () => {
  const alice = await registerUser("alice.credits@example.com", 10);
  const bob = await registerUser("bob.credits@example.com", 20);
  await startSession(alice.auth);
  const res = await request(app).get("/api/credits/transactions").set("Authorization", alice.auth);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((row) => row.amount), [-3, 10]);
  const bobRes = await request(app).get("/api/credits/transactions").set("Authorization", bob.auth);
  assert.deepEqual(bobRes.body.data.map((row) => row.amount), [20]);
});
