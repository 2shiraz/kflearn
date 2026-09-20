import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { seedHistoryContent } from "../src/seed/history.seed.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { HistoryModule } from "../src/models/HistoryModule.js";
import { HistoryAttempt } from "../src/models/HistoryAttempt.js";
import { User } from "../src/models/User.js";
import { assessChecklistFromTranscript, calculateScore, selfAssessChecklist } from "../src/services/scoring.service.js";
import { env } from "../src/config/env.js";

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
  await seedHistoryContent();
});

test("patient script rejects duplicate fact IDs", async () => {
  const script = new PatientScript({
    name: "Bad",
    slug: "bad",
    openingStatement: "Hello",
    facts: [
      baseFact("same"),
      baseFact("same"),
    ],
  });
  await assert.rejects(() => script.validate(), /factId values must be unique/);
});

test("checklist rejects duplicate item IDs", async () => {
  const checklist = new SmartChecklist({
    title: "Bad",
    slug: "bad-checklist",
    sourceScoring: { maxRawScore: 2 },
    sections: [{ sectionId: "a", title: "A", items: [baseItem("same"), baseItem("same")] }],
  });
  await assert.rejects(() => checklist.validate(), /itemId values must be unique/);
});

test("unpublished module is not visible to authenticated students", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("visibility@example.com");
  seeded.module.status = "draft";
  await seeded.module.save();
  const res = await request(app).get("/api/history").set("Authorization", auth);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.modules.some((module) => module.slug === seeded.module.slug), false);
});

test("creating attempt snapshots content versions", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("snapshot@example.com");
  const res = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  assert.equal(res.status, 201);
  const attempt = await HistoryAttempt.findById(res.body.data.attempt.id);
  assert.equal(attempt.patientScriptVersion, 1);
  assert.equal(attempt.checklistVersion, 1);
  assert.equal(attempt.moduleVersion, 1);
});

test("creating attempt stores selected AI provider", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("provider@example.com");
  const res = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient", aiProvider: "openai" });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.attempt.aiProvider, "openai");
  const attempt = await HistoryAttempt.findById(res.body.data.attempt.id);
  assert.equal(attempt.aiProvider, "openai");
});

test("student cannot access another user's attempt", async () => {
  const seeded = await seedHistoryContent();
  const studentA = await registerTestUser("student.a@example.com");
  const studentB = await registerTestUser("student.b@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", studentA)
    .send({ moduleId: seeded.module._id.toString(), mode: "single-player" });
  const read = await request(app)
    .get(`/api/history/attempts/${create.body.data.attempt.id}`)
    .set("Authorization", studentB);
  assert.equal(read.status, 404);
  assert.equal((await request(app).post(`/api/history/attempts/${create.body.data.attempt.id}/end`)
    .set("Authorization", studentB).send({})).status, 404);
  assert.equal((await request(app).post(`/api/history/attempts/${create.body.data.attempt.id}/self-assessment`)
    .set("Authorization", studentB).send({ checkedItemIds: [] })).status, 404);
  assert.equal((await request(app).get("/api/history/attempts").set("Authorization", studentB)).body.data.length, 0);
});

test("ended unassessed sessions are hidden from attempt history", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("hidden.ended@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  assert.equal(create.status, 201);

  const end = await request(app)
    .post(`/api/history/attempts/${create.body.data.attempt.id}/end`)
    .set("Authorization", auth)
    .send({ elapsedSeconds: 120 });
  assert.equal(end.status, 200);

  const history = await request(app).get("/api/history/attempts").set("Authorization", auth);
  assert.equal(history.status, 200);
  assert.equal(history.body.data.some((attempt) => attempt.id === create.body.data.attempt.id), false);

  const score = await request(app)
    .post(`/api/history/attempts/${create.body.data.attempt.id}/self-assessment`)
    .set("Authorization", auth)
    .send({ checkedItemIds: [] });
  assert.equal(score.status, 200);

  const scoredHistory = await request(app).get("/api/history/attempts").set("Authorization", auth);
  assert.equal(scoredHistory.body.data.some((attempt) => attempt.id === create.body.data.attempt.id), true);
});

test("patient response endpoint does not serialize hidden facts", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("patient.response@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const res = await request(app)
    .post(`/api/history/attempts/${create.body.data.attempt.id}/messages`)
    .set("Authorization", auth)
    .send({ text: "Do you smoke?" });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.patientMessage.text.includes("vape"));
  assert.equal(JSON.stringify(res.body).includes("matchedFactIds"), false);
  assert.equal(JSON.stringify(res.body).includes("asthma_family_history"), false);
});

test("patient message endpoint rejects oversized questions", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("long.message@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const res = await request(app)
    .post(`/api/history/attempts/${create.body.data.attempt.id}/messages`)
    .set("Authorization", auth)
    .send({ text: "word ".repeat(800) });
  assert.equal(res.status, 413);
});

test("haematemesis virtual patient answers natural OSCE phrasing", async () => {
  const auth = await registerTestUser("haem.patient@example.com");
  const moduleRes = await request(app).get("/api/history").set("Authorization", auth);
  const module = moduleRes.body.data.modules.find((item) => item.slug === "haematemesis-upper-gi-bleed-history");
  assert.ok(module);

  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: module.id, mode: "virtual-patient" });
  assert.equal(create.status, 201);

  const cases = [
    ["When did the vomiting blood start?", /started suddenly this morning|this morning/i],
    ["What do you think might be causing this?", /related to my liver|liver/i],
    ["What are you most worried about?", /bleeding inside|might die|scared/i],
    ["Hi, I’m one of the doctors. Can I confirm your name and date of birth?", /50 years old/i],
    ["I’d like to ask you some questions about what happened today. Is that okay?", /yes/i],
  ];

  for (const [text, expected] of cases) {
    const res = await request(app)
      .post(`/api/history/attempts/${create.body.data.attempt.id}/messages`)
      .set("Authorization", auth)
      .send({ text });
    assert.equal(res.status, 200);
    assert.match(res.body.data.patientMessage.text, expected);
  }
});

test("virtual patient intent matching uses authored content across stations", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("content.aware@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  assert.equal(create.status, 201);

  const worried = await request(app)
    .post(`/api/history/attempts/${create.body.data.attempt.id}/messages`)
    .set("Authorization", auth)
    .send({ text: "What are you most worried about with this?" });
  assert.equal(worried.status, 200);
  assert.match(worried.body.data.patientMessage.text, /worried|exams|sports/i);

  const medication = await request(app)
    .post(`/api/history/attempts/${create.body.data.attempt.id}/messages`)
    .set("Authorization", auth)
    .send({ text: "Are you taking any tablets or medicines for it?" });
  assert.equal(medication.status, 200);
  assert.match(medication.body.data.patientMessage.text, /medication|medicine|prescribed|inhaler/i);
});

test("haematemesis transcript scoring does not collapse to zero", async () => {
  const module = await HistoryModule.findOne({ slug: "haematemesis-upper-gi-bleed-history" });
  const checklist = await SmartChecklist.findById(module.smartChecklistId);
  const attempt = new HistoryAttempt({
    userId: "score-test",
    historyModuleId: module._id,
    mode: "virtual-patient",
    messages: haematemesisHalfScoreQuestions.map((text, index) => ({
      messageId: `student_${index}`,
      role: "student",
      inputType: "typed",
      finalText: text,
    })),
    internalCoverage: {
      factIds: [],
      conceptIds: ["onset", "timing", "character", "dizziness_weakness", "melaena", "alcohol_related_cirrhosis", "oesophageal_varices", "ideas", "concerns", "expectations", "alcohol", "smoking", "recreational_drugs"],
    },
  });

  const result = assessChecklistFromTranscript(checklist, attempt);
  assert.ok(result.finalScore.percentage >= 35, `Expected meaningful score, got ${result.finalScore.percentage}%`);
  assert.ok(result.finalScore.percentage <= 75, `Expected mid-range score, got ${result.finalScore.percentage}%`);
});

test("deterministic scoring and self assessment calculation", async () => {
  const seeded = await seedHistoryContent();
  const result = selfAssessChecklist(seeded.checklist, ["duration", "nocturnal"]);
  assert.equal(result.finalScore.rawScore, 2);
  assert.equal(result.finalScore.maxRawScore, 8);
  assert.equal(result.finalScore.weightedScore, 5);
  assert.equal(calculateScore(seeded.checklist, result.itemScores).percentage, result.finalScore.percentage);
});

test("audio route rejects missing audio", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("audio@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const res = await request(app).post(`/api/history/attempts/${create.body.data.attempt.id}/transcribe`).set("Authorization", auth);
  assert.equal(res.status, 400);
});

test("missing Groq key returns useful AI assessment error", async () => {
  const originalKey = env.groqApiKey;
  env.groqApiKey = "";
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("groq@example.com");
  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  await request(app).post(`/api/history/attempts/${create.body.data.attempt.id}/end`).set("Authorization", auth).send({});
  const res = await request(app).post(`/api/history/attempts/${create.body.data.attempt.id}/ai-assessment`).set("Authorization", auth);
  env.groqApiKey = originalKey;
  assert.equal(res.status, 503);
  assert.match(res.body.message, /No AI provider|GROQ_API_KEY|OPENAI_API_KEY/);
  assert.equal((await HistoryAttempt.findById(create.body.data.attempt.id)).status, "ended");
});

test("admin can view users and update AI settings", async () => {
  const auth = await registerTestUser("admin.settings@example.com");
  const user = await User.findOne({ email: "admin.settings@example.com" });
  user.role = "admin";
  await user.save();

  const users = await request(app).get("/api/admin/users").set("Authorization", auth);
  assert.equal(users.status, 200);
  assert.ok(users.body.data.some((item) => item.email === "admin.settings@example.com"));
  assert.equal(JSON.stringify(users.body.data).includes("passwordHash"), false);

  const settings = await request(app)
    .patch("/api/ai/status")
    .set("Authorization", auth)
    .send({
      defaultProvider: "openai",
      maxStudentMessageTokens: 120,
      openaiApiKey: "sk-test",
      openaiChatModel: "gpt-5.6-luna",
      openaiEvalModel: "gpt-5.6-luna",
    });
  assert.equal(settings.status, 200);
  assert.equal(settings.body.data.defaultProvider, "openai");
  assert.equal(settings.body.data.maxStudentMessageTokens, 120);
  const openai = settings.body.data.providers.find((provider) => provider.id === "openai");
  assert.equal(openai.configured, true);
  assert.equal(JSON.stringify(settings.body.data).includes("sk-test"), false);
  assert.equal((await request(app).patch("/api/admin/history/not-an-id/status").set("Authorization", auth)
    .send({ status: "published" })).status, 404);

  user.role = "student";
  await user.save();
  assert.equal((await request(app).get("/api/admin/users").set("Authorization", auth)).status, 403);
});

test("protected endpoints reject requests without a real token", async () => {
  const seeded = await seedHistoryContent();
  const res = await request(app)
    .post("/api/history/attempts")
    .send({ moduleId: seeded.module._id.toString(), mode: "single-player" });
  assert.equal(res.status, 401);
});

test("malformed attempt and module identifiers are rejected before MongoDB casting", async () => {
  const auth = await registerTestUser("bad.ids@example.com");
  assert.equal((await request(app).post("/api/history/attempts").set("Authorization", auth)
    .send({ moduleId: 6, mode: "single-player" })).status, 404);
  assert.equal((await request(app).get("/api/history/attempts/not-an-id").set("Authorization", auth)).status, 404);
});

test("new user can register, login, update profile, and own attempts", async () => {
  const seeded = await seedHistoryContent();
  const email = "new.user@example.com";
  const password = "StrongPass123";

  const register = await request(app)
    .post("/api/auth/register")
    .send({
      fullName: "New User",
      email,
      password,
      roleLabel: "FCPS Candidate",
      profile: {
        institution: "Test Medical College",
        programme: "MBBS",
        yearLevel: "Year 5",
        targetExam: "OSCE",
        expectedExamDate: "March 2027",
      },
    });
  assert.equal(register.status, 201);
  assert.equal(register.body.data.user.email, email);
  assert.equal(register.body.data.user.role, "student");
  assert.equal(register.body.data.user.roleLabel, "FCPS Candidate");
  assert.equal(register.body.data.user.institution, "Test Medical College");
  assert.ok(register.body.data.token);

  const duplicate = await request(app)
    .post("/api/auth/register")
    .send({ fullName: "New User", email, password });
  assert.equal(duplicate.status, 409);

  const login = await request(app).post("/api/auth/login").send({ email, password });
  assert.equal(login.status, 200);
  const token = login.body.data.token;
  assert.equal(login.body.data.user.yearLevel, "Year 5");

  const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, email);

  const update = await request(app)
    .patch("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .send({
      fullName: "New Account User",
      roleLabel: "Postgraduate Resident",
      profile: { institution: "Updated College", programme: "FCPS" },
    });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.user.fullName, "New Account User");
  assert.equal(update.body.data.user.institution, "Updated College");
  assert.equal(update.body.data.user.programme, "FCPS");

  const create = await request(app)
    .post("/api/history/attempts")
    .set("Authorization", `Bearer ${token}`)
    .send({ moduleId: seeded.module._id.toString(), mode: "single-player" });
  assert.equal(create.status, 201);
  const attempt = await HistoryAttempt.findById(create.body.data.attempt.id);
  const user = await User.findOne({ email });
  assert.equal(attempt.userId, user._id.toString());
});

test("registration and login reject malformed credentials and bcrypt-truncated passwords", async () => {
  const malformed = await request(app).post("/api/auth/register").send({
    fullName: "Test User", email: { $ne: null }, password: "StrongPass123",
  });
  assert.equal(malformed.status, 400);

  const tooLong = await request(app).post("/api/auth/register").send({
    fullName: "Test User", email: "too.long@example.com", password: `${"A".repeat(72)}1`,
  });
  assert.equal(tooLong.status, 400);
  assert.equal(await User.countDocuments({ email: "too.long@example.com" }), 0);

  const login = await request(app).post("/api/auth/login").send({ email: { $ne: null }, password: "StrongPass123" });
  assert.equal(login.status, 401);

  const oversizedProfile = await request(app).post("/api/auth/register").send({
    fullName: "Test User", email: "large.profile@example.com", password: "StrongPass123",
    profile: { institution: "x".repeat(201) },
  });
  assert.equal(oversizedProfile.status, 400);
});

test("logout requires CSRF for cookie sessions and revokes previously issued JWTs", async () => {
  const agent = request.agent(app);
  const register = await agent.post("/api/auth/register").send({
    fullName: "Session User", email: "session@example.com", password: "StrongPass123",
  });
  assert.equal(register.status, 201);
  const token = register.body.data.token;

  const missingCsrf = await agent.post("/api/auth/logout");
  assert.equal(missingCsrf.status, 403);
  assert.equal((await agent.get("/api/auth/me")).status, 200);

  const csrfCookie = register.headers["set-cookie"].find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  const csrfToken = csrfCookie.split(";")[0].split("=")[1];
  const logout = await agent.post("/api/auth/logout").set("X-XSRF-Token", csrfToken);
  assert.equal(logout.status, 200);
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`)).status, 401);
  assert.equal((await agent.get("/api/auth/me")).status, 401);

  const login = await request(app).post("/api/auth/login").send({ email: "session@example.com", password: "StrongPass123" });
  assert.equal(login.status, 200);
  assert.equal((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.data.token}`)).status, 200);
});

test("browser login response keeps its session token in the httpOnly cookie", async () => {
  await registerTestUser("browser@example.com");
  const res = await request(app).post("/api/auth/login").set("Origin", env.frontendUrl)
    .send({ email: "browser@example.com", password: "StrongPass123" });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.token, undefined);
  assert.ok(res.headers["set-cookie"].some((cookie) => cookie.startsWith("kf_session=") && cookie.includes("HttpOnly")));
  const csrfCookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  assert.equal(res.body.data.csrfToken, csrfCookie.split(";")[0].split("=")[1]);
  assert.equal(res.headers["access-control-allow-origin"], env.frontendUrl);
  assert.equal(res.headers["cache-control"], "no-store");
});

test("students cannot promote themselves or call admin APIs", async () => {
  const auth = await registerTestUser("plain.student@example.com");
  const update = await request(app).patch("/api/auth/me").set("Authorization", auth).send({
    role: "admin", profile: { institution: "College" },
  });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.user.role, "student");
  assert.equal((await request(app).patch("/api/auth/me").set("Authorization", auth)
    .send({ roleLabel: "x".repeat(81) })).status, 400);
  assert.equal((await request(app).patch("/api/auth/me").set("Authorization", auth)
    .send({ profile: { institution: "x".repeat(201) } })).status, 400);
  assert.equal((await request(app).get("/api/admin/users").set("Authorization", auth)).status, 403);
  assert.equal((await request(app).patch("/api/ai/status").set("Authorization", auth).send({ defaultProvider: "openai" })).status, 403);
});

test("virtual patient state and checklist cannot be changed after the session ends", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("states@example.com");
  const created = await request(app).post("/api/history/attempts").set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const id = created.body.data.attempt.id;

  const active = await request(app).get(`/api/history/attempts/${id}`).set("Authorization", auth);
  assert.equal(active.status, 200);
  assert.equal(active.body.data.checklist, undefined);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/self-assessment`).set("Authorization", auth).send({ checkedItemIds: [] })).status, 409);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth)).status, 409);

  const ended = await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth)
    .send({ elapsedSeconds: 999999, notes: "Finished" });
  assert.equal(ended.status, 200);
  assert.ok(ended.body.data.elapsedSeconds < 30);
  assert.equal((await request(app).get(`/api/history/attempts/${id}`).set("Authorization", auth)).body.data.checklist.title, seeded.checklist.title);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth).send({})).status, 409);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/messages`).set("Authorization", auth).send({ text: "Do you smoke?" })).status, 409);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.from("fake audio"), { filename: "clip.webm", contentType: "audio/webm" })).status, 409);

  const scored = await request(app).post(`/api/history/attempts/${id}/self-assessment`).set("Authorization", auth)
    .send({ checkedItemIds: [] });
  assert.equal(scored.status, 200);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/self-assessment`).set("Authorization", auth).send({ checkedItemIds: [] })).status, 409);
  assert.equal((await request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth)).status, 409);
  assert.equal((await HistoryAttempt.findById(id)).messages.length, 0);
});

test("concurrent assessments commit only one result", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("race@example.com");
  const created = await request(app).post("/api/history/attempts").set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "single-player" });
  const id = created.body.data.attempt.id;
  await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth).send({});

  const scores = await Promise.all([
    request(app).post(`/api/history/attempts/${id}/self-assessment`).set("Authorization", auth).send({ checkedItemIds: ["duration"] }),
    request(app).post(`/api/history/attempts/${id}/self-assessment`).set("Authorization", auth).send({ checkedItemIds: ["nocturnal"] }),
  ]);
  assert.deepEqual(scores.map((res) => res.status).sort(), [200, 409]);
  assert.equal((await HistoryAttempt.findById(id)).status, "self-assessed");
});

test("a stale AI assessment lease can be retried without an old request overwriting it", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("stale.lease@example.com");
  const created = await request(app).post("/api/history/attempts").set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const id = created.body.data.attempt.id;
  await request(app).post(`/api/history/attempts/${id}/end`).set("Authorization", auth).send({});
  await HistoryAttempt.updateOne({ _id: id }, { $set: {
    status: "assessing", assessmentStartedAt: new Date(Date.now() - 11 * 60 * 1000), assessmentLeaseId: "abandoned",
  } });

  const originalGroq = env.groqApiKey;
  const originalOpenAi = env.openaiApiKey;
  env.groqApiKey = "";
  env.openaiApiKey = "";
  try {
    const retried = await request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth);
    assert.equal(retried.status, 503);
    const attempt = await HistoryAttempt.findById(id);
    assert.equal(attempt.status, "ended");
    assert.equal(attempt.assessmentLeaseId, undefined);

    await HistoryAttempt.updateOne({ _id: id }, { $set: {
      status: "assessing", assessmentStartedAt: new Date(), assessmentLeaseId: "current",
    } });
    assert.equal((await request(app).post(`/api/history/attempts/${id}/ai-assessment`).set("Authorization", auth)).status, 409);
  } finally {
    env.groqApiKey = originalGroq;
    env.openaiApiKey = originalOpenAi;
  }
});

test("message and upload inputs are bounded before database or provider use", async () => {
  const seeded = await seedHistoryContent();
  const auth = await registerTestUser("validation@example.com");
  const created = await request(app).post("/api/history/attempts").set("Authorization", auth)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const id = created.body.data.attempt.id;

  const badText = await request(app).post(`/api/history/attempts/${id}/messages`).set("Authorization", auth)
    .send({ text: { $gt: "" } });
  assert.equal(badText.status, 400);
  const badTranscript = await request(app).post(`/api/history/attempts/${id}/messages`).set("Authorization", auth)
    .send({ text: "Hi", originalTranscript: "x".repeat(641) });
  assert.equal(badTranscript.status, 400);
  const badUpload = await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", auth)
    .attach("audio", Buffer.from("not audio"), { filename: "clip.txt", contentType: "text/plain" });
  assert.equal(badUpload.status, 400);
  const craftedFields = await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", auth)
    .field("items[4294967294]", "x").field("items[name]", "y");
  assert.equal(craftedFields.status, 400);
  assert.equal((await request(app).get("/api/health")).status, 200);
  assert.equal((await HistoryAttempt.findById(id)).messages.length, 0);
});

test("login attempts and provider-backed actions have separate rate limits", async () => {
  const seeded = await seedHistoryContent();
  const userA = await registerTestUser("limited.a@example.com");
  const userB = await registerTestUser("limited.b@example.com");
  const created = await request(app).post("/api/history/attempts").set("Authorization", userA)
    .send({ moduleId: seeded.module._id.toString(), mode: "virtual-patient" });
  const id = created.body.data.attempt.id;

  const previous = env.nodeEnv;
  env.nodeEnv = "development";
  try {
    for (let index = 0; index < 10; index += 1) {
      const failed = await request(app).post("/api/auth/login").send({ email: "none@example.com", password: "BadPass123" });
      assert.equal(failed.status, 401);
    }
    assert.equal((await request(app).post("/api/auth/login").send({ email: "none@example.com", password: "BadPass123" })).status, 429);

    for (let index = 0; index < 60; index += 1) {
      const missingAudio = await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", userA);
      assert.equal(missingAudio.status, 400);
    }
    assert.equal((await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", userA)).status, 429);
    assert.equal((await request(app).post(`/api/history/attempts/${id}/transcribe`).set("Authorization", userB)
      .attach("audio", Buffer.from("fake audio"), { filename: "clip.webm", contentType: "audio/webm" })).status, 404);
  } finally {
    env.nodeEnv = previous;
  }
});

function baseFact(factId) {
  return {
    factId,
    section: "HPC",
    conceptId: factId,
    label: factId,
    value: "value",
    naturalResponse: "response",
  };
}

const haematemesisHalfScoreQuestions = [
  "Hi, I am one of the doctors. Can I confirm your age?",
  "I would like to ask you some questions about what happened today. Is that okay?",
  "Can you tell me what brought you into hospital?",
  "When did the vomiting blood start?",
  "How many times have you vomited blood today?",
  "What did the blood look like? Was it bright red or dark? Were there clots?",
  "Was it just streaks or a larger amount?",
  "Have you felt dizzy, weak, or like you might faint?",
  "Have you noticed black or sticky stools?",
  "Any abdominal pain, chest pain, fever, diarrhoea, or bleeding from anywhere else?",
  "Has this ever happened before?",
  "Do you have any liver disease or previous stomach or food pipe problems?",
  "Have you ever had a camera test or been told you have swollen veins?",
  "Are you taking any regular medications?",
  "Do you take aspirin, ibuprofen, blood thinners, or any over-the-counter medicines?",
  "Do you have any allergies?",
  "How much alcohol do you drink?",
  "Do you smoke?",
  "Do you use any recreational drugs?",
  "What do you think might be causing this?",
  "What are you most worried about?",
  "What were you hoping we could do today?",
  "Thank you, I will summarise: you vomited a large amount of blood this morning, feel weak and light-headed, have black stools, and you have liver disease. Is there anything important I have missed?",
];

function baseItem(itemId) {
  return {
    itemId,
    label: itemId,
    expectedConcepts: [itemId],
    relatedFactIds: [itemId],
  };
}

async function registerTestUser(email) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      fullName: "Test User",
      email,
      password: "StrongPass123",
      roleLabel: "MBBS Student",
    });
  assert.equal(res.status, 201);
  return `Bearer ${res.body.data.token}`;
}
