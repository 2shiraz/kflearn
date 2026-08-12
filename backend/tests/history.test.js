import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { seedHistoryContent } from "../src/seed/history.seed.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { HistoryAttempt } from "../src/models/HistoryAttempt.js";
import { User } from "../src/models/User.js";
import { calculateScore, selfAssessChecklist } from "../src/services/scoring.service.js";
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
  assert.match(medication.body.data.patientMessage.text, /salbutamol|inhaler/i);
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
  const res = await request(app).post(`/api/history/attempts/${create.body.data.attempt.id}/ai-assessment`).set("Authorization", auth);
  env.groqApiKey = originalKey;
  assert.equal(res.status, 503);
  assert.match(res.body.message, /GROQ_API_KEY/);
});

test("protected endpoints reject requests without a real token", async () => {
  const seeded = await seedHistoryContent();
  const res = await request(app)
    .post("/api/history/attempts")
    .send({ moduleId: seeded.module._id.toString(), mode: "single-player" });
  assert.equal(res.status, 401);
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
