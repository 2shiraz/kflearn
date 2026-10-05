import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { seedOsceContent } from "../src/seed/osce.seed.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { CreditTransaction } from "../src/models/CreditTransaction.js";
import { User } from "../src/models/User.js";
import { grantCredits } from "../src/services/credit.service.js";
import { CREDIT_COSTS, MAX_STUDENT_MESSAGES_PER_ATTEMPT, MAX_TRANSCRIPTIONS_PER_ATTEMPT } from "../src/config/credits.js";
import { env } from "../src/config/env.js";

let mongod;
let app;
let stationId;

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
  const seeded = await seedOsceContent();
  stationId = seeded.module._id.toString();
});

async function registerUser(email, credits = 0) {
  const res = await request(app).post("/api/auth/register")
    .send({ fullName: "Credit Tester", email, password: "StrongPass123" });
  assert.equal(res.status, 201);
  const userId = res.body.data.user.id;
  // Spending fixtures need exact balances independently of the signup offer.
  await User.updateOne({ _id: userId }, { $set: { creditBalance: 0 } });
  await CreditTransaction.deleteMany({ userId });
  if (credits > 0) await grantCredits({ userId, amount: credits, note: "test" });
  return { auth: `Bearer ${res.body.data.token}`, userId };
}

const balanceOf = async (userId) => (await User.findById(userId).lean()).creditBalance;
const startSession = (auth, mode = "virtual-patient", extra = {}) =>
  request(app).post("/api/osce/attempts").set("Authorization", auth).send({ stationId, mode, ...extra });

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

test("new users start with no AI credits by default and see server-side pricing", async () => {
  const signup = await request(app).post("/api/auth/register").send({ fullName: "New Student", email: "welcome@example.com", password: "StrongPass123" });
  assert.equal(signup.status, 201);
  const userId = signup.body.data.user.id;
  const auth = `Bearer ${signup.body.data.token}`;
  const res = await request(app).get("/api/credits").set("Authorization", auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.balance, 0);
  assert.equal(await CreditTransaction.countDocuments({ userId }), 0);
  assert.equal((await request(app).post("/api/auth/register").send({ fullName: "New Student", email: "welcome@example.com", password: "StrongPass123" })).status, 409);
});


test("public credit packages expose names and prices only", async () => {
  const res = await request(app).get("/api/public/credit-packages");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.packages.map((pkg) => Object.keys(pkg).sort()), [
    ["credits", "id", "name", "pricePkr"], ["credits", "id", "name", "pricePkr"], ["credits", "id", "name", "pricePkr"],
  ]);
  assert.equal(res.body.data.packages.find((pkg) => pkg.id === "starter").pricePkr, 999);
  assert.equal(res.body.data.costs, undefined);
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
  assert.equal(await OsceAttempt.countDocuments({ userId }), 0);
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
  const attempt = await OsceAttempt.findById(res.body.data.attempt.id);
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
  assert.equal(await OsceAttempt.countDocuments({ userId }), 1);
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
  await User.updateOne({ _id: userId }, { $set: { creditBalance: 0 } });
  const forged = await startSession(auth, "virtual-patient", { billing: { virtualPatientCharged: true }, _id: new mongoose.Types.ObjectId() });
  assert.equal(forged.status, 402);
  assert.equal(await OsceAttempt.countDocuments({ userId }), 0);
});

test("an unpaid session cannot use the AI patient or transcription", async () => {
  const { auth, userId } = await registerUser("unpaid@example.com", 50);
  const legacy = await OsceAttempt.create({
    userId, stationId: stationId, mode: "virtual-patient", status: "active",
    billing: { virtualPatientCharged: false },
  });
  const message = await request(app).post(`/api/osce/attempts/${legacy._id}/messages`).set("Authorization", auth).send({ text: "Do you smoke?" });
  assert.equal(message.status, 402);
  assert.equal(message.body.code, "SESSION_NOT_PAID");
  const audio = await request(app).post(`/api/osce/attempts/${legacy._id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.from("fake audio"), { filename: "clip.webm", contentType: "audio/webm" });
  assert.equal(audio.status, 402);
  assert.equal((await OsceAttempt.findById(legacy._id)).messages.length, 0);
  assert.equal(await balanceOf(userId), 50);
});

test("a free self-practice session cannot be used to reach the AI patient", async () => {
  const { auth } = await registerUser("sneaky@example.com");
  const created = await startSession(auth, "single-player");
  const id = created.body.data.attempt.id;
  assert.equal((await request(app).post(`/api/osce/attempts/${id}/messages`).set("Authorization", auth).send({ text: "Hello" })).status, 409);
});

test("one paid session has a hard cap on questions and transcriptions", async () => {
  const { auth } = await registerUser("capped@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  await OsceAttempt.updateOne({ _id: id }, { $set: {
    "usage.studentMessages": MAX_STUDENT_MESSAGES_PER_ATTEMPT,
    "usage.transcriptions": MAX_TRANSCRIPTIONS_PER_ATTEMPT,
  } });
  const message = await request(app).post(`/api/osce/attempts/${id}/messages`).set("Authorization", auth).send({ text: "Do you smoke?" });
  assert.equal(message.status, 429);
  assert.equal(message.body.code, "STATION_LIMIT_REACHED");
  const audio = await request(app).post(`/api/osce/attempts/${id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.from("fake audio"), { filename: "clip.webm", contentType: "audio/webm" });
  assert.equal(audio.status, 429);
});

test("parallel questions cannot exceed the per-session cap", async () => {
  const { auth } = await registerUser("burst@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  await OsceAttempt.updateOne({ _id: id }, { $set: { "usage.studentMessages": MAX_STUDENT_MESSAGES_PER_ATTEMPT - 2 } });
  const results = await Promise.all(Array.from({ length: 6 }, () =>
    request(app).post(`/api/osce/attempts/${id}/messages`).set("Authorization", auth).send({ text: "How old are you?" })));
  assert.equal(results.filter((res) => res.status === 200).length, 2);
  assert.equal(results.filter((res) => res.status === 429).length, 4);
  assert.equal((await OsceAttempt.findById(id)).usage.studentMessages, MAX_STUDENT_MESSAGES_PER_ATTEMPT);
});

test("AI assessment is refused without credits and leaves the attempt re-assessable", async () => {
  const { auth, userId } = await registerUser("no.assess@example.com", CREDIT_COSTS.virtualPatient + 1);
  const id = (await startSession(auth)).body.data.attempt.id;
  await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", auth).send({});
  const res = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth);
  assert.equal(res.status, 402);
  assert.equal(res.body.code, "INSUFFICIENT_CREDITS");
  const attempt = await OsceAttempt.findById(id);
  assert.equal(attempt.status, "ended");
  assert.equal(attempt.billing.aiAssessmentCharged, false);
  assert.equal(await balanceOf(userId), 1);
});

test("a failed AI assessment is refunded in full", async () => {
  const { auth, userId } = await registerUser("refund@example.com", 10);
  const id = (await startSession(auth)).body.data.attempt.id;
  await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", auth).send({});
  const res = await withoutAiProviders(() => request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth));
  assert.equal(res.status, 503);
  assert.equal(await balanceOf(userId), 7);
  const attempt = await OsceAttempt.findById(id);
  assert.equal(attempt.status, "ended");
  assert.equal(attempt.billing.aiAssessmentCharged, false);
  const ledger = await CreditTransaction.find({ userId, reason: "ai-assessment" }).sort({ createdAt: 1 }).lean();
  assert.deepEqual(ledger.map((row) => row.amount), [-2, 2]);
});

test("parallel AI assessment requests never charge more than once", async () => {
  const { auth, userId } = await registerUser("assess.race@example.com", 10);
  const id = (await startSession(auth)).body.data.attempt.id;
  await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", auth).send({});
  const results = await withoutAiProviders(() => Promise.all(Array.from({ length: 5 }, () =>
    request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth))));
  assert.ok(results.every((res) => [409, 503].includes(res.status)));
  assert.equal(await balanceOf(userId), 7);
  const spends = await CreditTransaction.countDocuments({ userId, reason: "ai-assessment", type: "spend" });
  const refunds = await CreditTransaction.countDocuments({ userId, reason: "ai-assessment", type: "refund" });
  assert.equal(spends, refunds);
});

test("a configured provider failure refunds AI marking and leaves the attempt retryable", { timeout: 30000 }, async () => {
  const { auth, userId } = await registerUser("assess.success@example.com", 10);
  const id = (await startSession(auth)).body.data.attempt.id; // -3 (VP) -> 7
  for (const q of ["When did the wheeze start?", "Do you smoke?", "Any known triggers?"]) {
    await request(app).post(`/api/osce/attempts/${id}/messages`).set("Authorization", auth).send({ text: q });
  }
  await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", auth).send({});

  // A key is configured but rejected by the provider. This must never become
  // a charged deterministic "AI" result.
  const [savedGroq, savedOpenai] = [env.groqApiKey, env.openaiApiKey];
  env.groqApiKey = "sk-bogus-forces-deterministic-fallback";
  env.openaiApiKey = "";
  let res;
  try {
    res = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth);
  } finally {
    [env.groqApiKey, env.openaiApiKey] = [savedGroq, savedOpenai];
  }

  assert.equal(res.status, 503);
  assert.match(res.body.message, /AI marking failed/);
  assert.equal(await balanceOf(userId), 7);
  assert.equal(await CreditTransaction.countDocuments({ userId, reason: "ai-assessment", type: "spend" }), 1);
  assert.equal(await CreditTransaction.countDocuments({ userId, reason: "ai-assessment", type: "refund" }), 1);
  const attempt = await OsceAttempt.findById(id);
  assert.equal(attempt.status, "ended");
  assert.equal(attempt.billing.aiAssessmentCharged, false);
  assert.equal(attempt.aiAssessment?.model, undefined);

  // It is eligible for another attempt, not stuck in "assessing" or finalized.
  const retry = await withoutAiProviders(() => request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth));
  assert.equal(retry.status, 503);
  assert.equal(await balanceOf(userId), 7);
});

test("retrying a crashed, already-paid assessment does not charge again", async () => {
  const { auth, userId } = await registerUser("crashed@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  await OsceAttempt.updateOne({ _id: id }, { $set: {
    status: "assessing", assessmentStartedAt: new Date(Date.now() - 11 * 60 * 1000),
    assessmentLeaseId: "crashed", "billing.aiAssessmentCharged": true,
  } });
  // Balance is 0, so a second charge would be a 402 — reaching the provider
  // (503 here) proves the retry was not billed.
  const res = await withoutAiProviders(() => request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth));
  assert.equal(res.status, 503);
});

test("AI assessment is refused on a guided self-practice attempt and never charges", async () => {
  const { auth, userId } = await registerUser("sp.assess@example.com", 10);
  const created = await startSession(auth, "single-player");
  const id = created.body.data.attempt.id;
  await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", auth).send({});
  const res = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth);
  assert.equal(res.status, 409);
  assert.equal(await balanceOf(userId), 10);
  assert.equal((await OsceAttempt.findById(id)).billing.aiAssessmentCharged, false);
});

test("a user cannot pay to assess another user's attempt", async () => {
  const alice = await registerUser("idor.alice@example.com", 10);
  const bob = await registerUser("idor.bob@example.com", 10);
  const id = (await startSession(alice.auth)).body.data.attempt.id;
  await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", alice.auth).send({});
  const res = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", bob.auth);
  assert.equal(res.status, 404);
  assert.equal(await balanceOf(bob.userId), 10);
});

test("session creation is rate-limited per account", async () => {
  const { auth } = await registerUser("ratelimit.a@example.com");
  const other = await registerUser("ratelimit.b@example.com");
  const previous = env.nodeEnv;
  env.nodeEnv = "development"; // switch off the test-only rate-limit bypass
  try {
    for (let index = 0; index < 40; index += 1) {
      assert.equal((await startSession(auth, "single-player")).status, 201);
    }
    const blocked = await startSession(auth, "single-player");
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.code, "RATE_LIMITED");
    // The ceiling is per-account, so a different user is unaffected.
    assert.equal((await startSession(other.auth, "single-player")).status, 201);
  } finally {
    env.nodeEnv = previous;
  }
});

test("all credit packages report correct full-station math", async () => {
  const { auth } = await registerUser("packages@example.com");
  const { packages } = (await request(app).get("/api/credits").set("Authorization", auth)).body.data;
  assert.deepEqual(
    packages.map((pkg) => [pkg.id, pkg.credits, pkg.fullStations]),
    [["starter", 220, 44], ["standard", 480, 96], ["pro", 730, 146]],
  );
});

test("the grant primitive rejects invalid amounts", async () => {
  const { userId } = await registerUser("grant.validate@example.com");
  for (const bad of [0, -5, 1.5, 100001, Number.MAX_SAFE_INTEGER + 1, NaN]) {
    await assert.rejects(() => grantCredits({ userId, amount: bad, note: "bad" }));
  }
  assert.equal(await balanceOf(userId), 0);
  assert.equal(await CreditTransaction.countDocuments({ userId }), 0);
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

test("an iPhone recording (mp4 with a codec) is accepted and a missing voice key gets a clear message", async () => {
  const { auth } = await registerUser("iphone@example.com", 3);
  const id = (await startSession(auth)).body.data.attempt.id;
  const res = await request(app).post(`/api/osce/attempts/${id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.alloc(2000, 1), { filename: "question.mp4", contentType: "audio/mp4;codecs=mp4a.40.2" });
  assert.equal(res.status, 503, res.body.message);
  assert.match(res.body.message, /Voice typing isn't set up yet/);
  const attempt = await OsceAttempt.findById(id).lean();
  assert.equal(attempt.usage?.transcriptions || 0, 0);
});
