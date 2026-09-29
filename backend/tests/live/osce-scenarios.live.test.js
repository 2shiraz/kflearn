// Real provider integration scenarios. Run explicitly with npm run test:live:scenarios.
// Never included in npm test: these make external AI calls and incur provider usage.
// Every user, balance, station and attempt is created in an isolated in-memory DB.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { CREDIT_COSTS } from "../../src/config/credits.js";
import { CreditTransaction } from "../../src/models/CreditTransaction.js";
import { OsceAttempt } from "../../src/models/OsceAttempt.js";
import { seedOsceContent } from "../../src/seed/osce.seed.js";
import { grantCredits } from "../../src/services/credit.service.js";

const HAS_AI_KEY = Boolean(env.groqApiKey || env.openaiApiKey);
const FULL_COST = CREDIT_COSTS.virtualPatient + CREDIT_COSTS.aiAssessment;
const TIMEOUT = 240_000;
let mongod;
let app;
let studentNumber = 0;

before(async () => {
  if (!HAS_AI_KEY) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seedOsceContent();
  app = createApp();
});

after(async () => {
  if (!mongod) return;
  await mongoose.disconnect();
  await mongod.stop();
});

async function student(credits = FULL_COST) {
  studentNumber += 1;
  const created = await request(app).post("/api/auth/register").send({
    fullName: `Scenario Student ${studentNumber}`,
    email: `scenario.${studentNumber}.${Date.now()}@example.com`,
    password: "StrongPass123",
    roleLabel: "MBBS Student",
  });
  assert.equal(created.status, 201);
  const userId = created.body.data.user.id;
  if (credits) await grantCredits({ userId, amount: credits, note: "isolated live test" });
  return { auth: `Bearer ${created.body.data.token}`, userId };
}

async function balance(auth) {
  const res = await request(app).get("/api/credits").set("Authorization", auth);
  assert.equal(res.status, 200);
  return res.body.data.balance;
}

async function createSession(auth, slug, mode = "virtual-patient") {
  const listed = await request(app).get("/api/osce").set("Authorization", auth);
  assert.equal(listed.status, 200);
  const station = listed.body.data.modules.find((row) => row.slug === slug);
  assert.ok(station, `seeded station ${slug} exists`);
  const created = await request(app).post("/api/osce/attempts").set("Authorization", auth)
    .send({ stationId: station.id, mode });
  assert.equal(created.status, 201, created.body.message);
  return created.body.data.attempt.id;
}

async function runMarkedStation({ slug, questions, creditedItems = [] }) {
  const { auth, userId } = await student();
  const id = await createSession(auth, slug);
  assert.equal(await balance(auth), CREDIT_COSTS.aiAssessment, "session start spends only virtual-patient credits");

  const active = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", auth);
  assert.equal(active.status, 200);
  assert.equal(active.body.data.attempt.mode, "virtual-patient");
  assert.equal(active.body.data.checklist, undefined, "AI mode hides the checklist before marking");

  const replies = [];
  for (const question of questions) {
    const answer = await request(app).post(`/api/osce/attempts/${id}/messages`)
      .set("Authorization", auth).send({ text: question });
    assert.equal(answer.status, 200, `patient response to: ${question}; ${answer.body.message}`);
    assert.ok(answer.body.data.patientMessage.text?.trim(), "patient replied to the real question");
    replies.push(answer.body.data.patientMessage.text);
  }

  const ended = await request(app).post(`/api/osce/attempts/${id}/end`)
    .set("Authorization", auth).send({});
  assert.equal(ended.status, 200);
  const revealed = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", auth);
  assert.ok(revealed.body.data.checklist, "checklist is available after the session ends");

  const marked = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`)
    .set("Authorization", auth).send({});
  assert.equal(marked.status, 200, `AI marking failed: ${marked.body.message}`);
  const { attempt, result, credits } = marked.body.data;
  assert.equal(attempt.status, "ai-assessed");
  assert.equal(credits.charged, CREDIT_COSTS.aiAssessment);
  assert.equal(await balance(auth), 0, "one full AI station costs exactly five credits");
  assert.ok(result.finalScore.maxRawScore > 0 && Number.isFinite(result.finalScore.percentage));
  assert.equal(result.itemScores.length, revealed.body.data.checklist.sections.flatMap((s) => s.items).length);

  // A deterministic fallback can have the same score shape, so require both
  // the configured live model identity and actual examiner rationale.
  const expectedProvider = env.groqApiKey ? "groq" : "openai";
  assert.equal(attempt.aiAssessment.provider, expectedProvider);
  assert.equal(attempt.aiAssessment.model, expectedProvider === "groq" ? env.groqEvalModel : env.openaiEvalModel);
  assert.doesNotMatch(result.feedback.summary || "", /deterministic fallback/i);
  assert.ok(result.itemScores.some((item) => item.rationale?.trim()), "live examiner supplied rationale");
  for (const itemId of creditedItems) {
    assert.ok(result.itemScores.some((item) => item.itemId === itemId && item.rawScore > 0),
      `examiner credited ${itemId}`);
  }
  const ledger = await CreditTransaction.find({ userId }).lean();
  assert.equal(ledger.filter((row) => row.type === "spend").length, 2);
  assert.equal(ledger.filter((row) => row.type === "refund").length, 0);
  console.log(`    ${slug}: ${result.finalScore.percentage}% after ${questions.length} questions`);
  return { auth, id, replies, result };
}

describe("Additional real-AI OSCE sessions", { skip: HAS_AI_KEY ? false : "Configure GROQ_API_KEY or OPENAI_API_KEY" }, () => {
  test("Adult asthma: control, severity and triggers are elicited and AI-marked", { timeout: TIMEOUT }, async () => {
    await runMarkedStation({
      slug: "pdf-focused-history-diagnostic-planning-suspected-adult-asthma",
      questions: [
        "Hello, I'm a doctor. Can I check your name and age, and are you comfortable breathing right now?",
        "Can you tell me what has been happening with your breathing? How long has it gone on?",
        "How often do the wheeze and tight chest happen? Are you normal between episodes?",
        "Does it wake you at night or affect exercise, sleep or work?",
        "Do cold air, exercise, dust, cats or pollen bring it on? Does anything relieve it?",
        "Have you ever needed emergency treatment, hospital admission or intensive care for an attack?",
        "Do you have eczema or hay fever? Does anyone in your family have asthma?",
        "Do you smoke or vape, and are you taking any regular medicines or inhalers?",
        "Are you getting blue lips, fainting or struggling to speak during an episode?",
      ],
      creditedItems: ["adult_asthma_core_symptoms", "adult_asthma_triggers", "adult_asthma_previous_severity"],
    });
  });

  test("Haemoptysis: source, immediate danger, cancer and TB risks are AI-marked", { timeout: TIMEOUT }, async () => {
    await runMarkedStation({
      slug: "pdf-focused-history-hemoptysis-malignancy-tuberculosis-risk",
      questions: [
        "Can you describe the blood—how much, how often, and is it mixed with sputum after coughing?",
        "Could it be coming from your nose, gums or vomit instead?",
        "Are you choking, very short of breath, faint, or passing large clots now?",
        "How long have you been coughing, and have you had fever, weight loss or night sweats?",
        "Do you smoke? What work have you done, including construction or demolition?",
        "Have you ever had TB, or been close to someone with TB? Where did you grow up?",
        "Do you take blood thinners, or have a bleeding disorder, bronchiectasis or blood clots?",
        "What worries you most about this, and have the bleeding episodes been getting worse?",
      ],
      creditedItems: ["hemoptysis_confirms_true", "hemoptysis_quantifies_safely", "hemoptysis_tb_risks"],
    });
  });

  test("Occupational lung disease: exposure chronology and protection are AI-marked", { timeout: TIMEOUT }, async () => {
    await runMarkedStation({
      slug: "pdf-focused-occupational-environmental-history-suspected-interstitial-lung-disease",
      questions: [
        "When did your breathlessness and dry cough begin, and have they gradually worsened?",
        "How far can you walk or climb stairs now? Are you breathless while resting?",
        "Any fever, chest pain, coughing blood, sputum or wheeze?",
        "Please walk me through every job you've done. Do you cut engineered stone or work around silica dust?",
        "For how many years have you had dust exposure? Do you use a mask and reliable extraction equipment?",
        "Did you work in demolition or remove insulation before this job?",
        "Are there birds, mould, water damage or other exposures at home? Is it better on weekends away from work?",
        "Do you smoke, take any medicines, or have joint symptoms or a family history of lung fibrosis?",
        "How is this affecting you and your family, and what concerns do you have about work?",
      ],
      creditedItems: ["ild_lifetime_job_history", "ild_inorganic_exposures", "ild_exposure_control"],
    });
  });

  test("DKA: vomiting, type 1 diabetes, missed insulin and dehydration are AI-marked", { timeout: TIMEOUT }, async () => {
    await runMarkedStation({
      slug: "dka-abdominal-pain-vomiting-history",
      questions: [
        "Hello, I'm a doctor. What brought you to the emergency department today?",
        "When did the vomiting begin, how often is it happening, and can you keep water down? Any blood?",
        "Where is the abdominal pain, when did it start, and how severe is it from zero to ten?",
        "Do you have diarrhoea, fever, a rash, tiredness or any other symptoms?",
        "Are you very thirsty, and how much urine are you passing? Have you felt faint?",
        "Do you have diabetes? When were you diagnosed, and what type is it?",
        "Which insulin do you normally take, and have you missed any doses while unwell?",
        "Have you had a recent infection, such as a chest infection? Are you taking antibiotics?",
        "What other medicines do you take, and do you have any allergies?",
        "What do you think is causing this, and what is worrying you most?",
      ],
      creditedItems: ["dka_abdo_7", "dka_abdo_22", "dka_abdo_25"],
    });
  });

  test("Pulmonary embolism: a second real session charges once and cannot be AI-marked twice", { timeout: TIMEOUT }, async () => {
    const { auth, id } = await runMarkedStation({
      slug: "pdf-focused-history-immediate-assessment-suspected-pulmonary-embolism",
      questions: [
        "Are you able to speak normally, or are you faint, confused or turning blue right now?",
        "When did the breathlessness and sharp chest pain start? Is the pain worse when you breathe in?",
        "Have you coughed blood or collapsed?",
        "Is either calf painful or swollen? Have you ever had a clot before?",
        "Have you recently had surgery, stayed in hospital or been less mobile?",
        "Do you have cancer, recent long travel or a family history of clots?",
        "Are you on blood thinners, or have you had serious bleeding or stomach ulcers?",
        "Do you have kidney disease or a contrast-dye allergy?",
      ],
      creditedItems: ["pe_immediate_safety", "pe_dvt_previous_vte", "pe_provoking_risks"],
    });
    const retry = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`)
      .set("Authorization", auth).send({});
    assert.equal(retry.status, 409, "a completed AI assessment cannot charge again");
    assert.equal(await balance(auth), 0);
  });

  test("Guided self-practice is free and never reaches either AI endpoint", { timeout: 60_000 }, async () => {
    const { auth } = await student(0);
    const id = await createSession(auth, "dka-abdominal-pain-vomiting-history", "single-player");
    const view = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", auth);
    assert.equal(view.body.data.attempt.mode, "single-player");
    assert.ok(view.body.data.checklist);
    assert.equal((await request(app).post(`/api/osce/attempts/${id}/messages`)
      .set("Authorization", auth).send({ text: "When did the vomiting start?" })).status, 409);
    await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", auth).send({});
    assert.equal((await request(app).post(`/api/osce/attempts/${id}/ai-assessment`)
      .set("Authorization", auth).send({})).status, 409);
    const firstItem = view.body.data.checklist.sections[0].items[0].itemId;
    const self = await request(app).post(`/api/osce/attempts/${id}/self-assessment`)
      .set("Authorization", auth).send({ checkedItemIds: [firstItem] });
    assert.equal(self.status, 200);
    assert.equal(self.body.data.attempt.status, "self-assessed");
    assert.equal(await balance(auth), 0);
    assert.equal((await OsceAttempt.findById(id)).billing.aiAssessmentCharged, false);
  });
});
