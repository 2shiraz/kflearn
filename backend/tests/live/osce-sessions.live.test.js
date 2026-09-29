// LIVE end-to-end OSCE station tests.
//
// These simulate real student sessions: real OSCE questions go to the real AI
// virtual patient, and the transcript is marked by the real AI examiner. They
// use the API key from backend/.env and cost a few cents per run, so they are
// kept out of the normal `npm test` suite.
//
//   npm run test:live
//
// The database is an isolated in-memory MongoDB seeded with the real stations,
// so nothing here touches your development data.
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
import { generateJson } from "../../src/services/llm.service.js";

const HAS_AI_KEY = Boolean(env.groqApiKey || env.openaiApiKey);
const SKIP = HAS_AI_KEY ? false : "No GROQ_API_KEY or OPENAI_API_KEY in backend/.env";
const SESSION_TIMEOUT = 240_000;
const FULL_STATION = CREDIT_COSTS.virtualPatient + CREDIT_COSTS.aiAssessment;

let mongod;
let app;
let userCounter = 0;
const scores = {};

before(async () => {
  if (!HAS_AI_KEY) return;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seedOsceContent();
  app = createApp();
});

after(async () => {
  if (!HAS_AI_KEY) return;
  await mongoose.disconnect();
  await mongod.stop();
});

// ─── helpers ────────────────────────────────────────────────────────────────

async function registerStudent(credits) {
  userCounter += 1;
  const res = await request(app).post("/api/auth/register").send({
    fullName: `Live Student ${userCounter}`,
    email: `live.student.${userCounter}.${Date.now()}@example.com`,
    password: "StrongPass123",
    roleLabel: "MBBS Student",
  });
  assert.equal(res.status, 201);
  const userId = res.body.data.user.id;
  if (credits > 0) await grantCredits({ userId, amount: credits, note: "live test" });
  return { auth: `Bearer ${res.body.data.token}`, userId };
}

async function balanceOf(auth) {
  return (await request(app).get("/api/credits").set("Authorization", auth)).body.data.balance;
}

async function stationId(auth, slug) {
  const res = await request(app).get("/api/osce").set("Authorization", auth);
  const module = res.body.data.modules.find((item) => item.slug === slug);
  assert.ok(module, `station ${slug} is seeded`);
  return module.id;
}

async function startSession(auth, slug, mode = "virtual-patient") {
  const res = await request(app).post("/api/osce/attempts").set("Authorization", auth)
    .send({ stationId: await stationId(auth, slug), mode });
  assert.equal(res.status, 201, `start ${mode}: ${res.body.message}`);
  return res.body.data.attempt.id;
}

// Asks each question in turn and returns the patient's replies.
async function interview(auth, attemptId, questions) {
  const replies = [];
  for (const question of questions) {
    const res = await request(app).post(`/api/osce/attempts/${attemptId}/messages`)
      .set("Authorization", auth).send({ text: question });
    assert.equal(res.status, 200, `"${question}" -> ${res.status} ${res.body.message}`);
    const reply = res.body.data.patientMessage.text;
    assert.ok(reply && reply.trim().length > 0, `patient answered "${question}"`);
    replies.push(reply);
  }
  return replies;
}

async function endSession(auth, attemptId) {
  const res = await request(app).post(`/api/osce/attempts/${attemptId}/end`).set("Authorization", auth).send({});
  assert.equal(res.status, 200);
}

async function aiMark(auth, attemptId) {
  const res = await request(app).post(`/api/osce/attempts/${attemptId}/ai-assessment`).set("Authorization", auth);
  assert.equal(res.status, 200, `AI assessment: ${res.status} ${res.body.message}`);
  assertRealAiMarking(res.body.data);
  return res.body.data;
}

// Proves the marking came from the live model, not the deterministic fallback
// the app uses when the provider fails.
function assertRealAiMarking(data) {
  const expectedModel = env.groqApiKey ? env.groqEvalModel : env.openaiEvalModel;
  const summary = data.result.feedback?.summary || "";
  assert.doesNotMatch(summary, /deterministic fallback/i,
    "AI marking fell back to deterministic scoring — the provider call failed (bad key, network, or provider rate limit).");
  assert.equal(data.attempt.aiAssessment?.model, expectedModel, "marked by the configured evaluation model");
  assert.ok(data.result.itemScores.some((item) => item.rationale && item.rationale.trim()),
    "the examiner gave a rationale for its marks");
  assert.equal(data.attempt.status, "ai-assessed");
}

function itemScore(data, itemId) {
  return Number(data.result.itemScores.find((item) => item.itemId === itemId)?.rawScore ?? 0);
}

function report(label, data) {
  const { percentage, rawScore, maxRawScore } = data.result.finalScore;
  console.log(`    ${label}: ${percentage}% (${rawScore}/${maxRawScore}) — ${data.result.feedback.summary.slice(0, 140)}`);
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe("Live OSCE station sessions (real AI patient + real AI marking)", { skip: SKIP }, () => {
  test("the configured AI provider is reachable", { timeout: 60_000 }, async () => {
    const completion = await generateJson({
      maxTokens: 200,
      messages: [
        { role: "system", content: "Reply only with JSON." },
        { role: "user", content: 'Return {"status":"ok"}' },
      ],
    });
    assert.match(completion.text, /ok/i, "provider returned a real completion");
    console.log(`    provider=${completion.provider} model=${completion.model}`);
  });

  test("Asthma station — a thorough candidate is interviewed and marked highly", { timeout: SESSION_TIMEOUT }, async () => {
    const { auth } = await registerStudent(10);
    const id = await startSession(auth, "breathlessness-young-adult-asthma");
    assert.equal(await balanceOf(auth), 10 - CREDIT_COSTS.virtualPatient);

    // The checklist stays hidden while the virtual-patient session is running.
    const active = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", auth);
    assert.equal(active.body.data.checklist, undefined);

    const replies = await interview(auth, id, [
      "Hello, I'm one of the doctors. Can you tell me what's been happening?",
      "How long have you been having these episodes of breathlessness?",
      "How often do the episodes come on, and are you normal in between?",
      "Do you wake up at night or early in the morning with the cough or wheeze?",
      "Is there anything that triggers the episodes, like exercise, cold air, dust or pollen?",
      "Have you ever had to go to A&E, be admitted to hospital, or needed intensive care for your breathing?",
      "Do you have any allergies, hay fever or eczema?",
      "Does anyone in your family have asthma or allergies?",
      "Do you smoke cigarettes or vape at all?",
      "Are you using any inhalers or medicines for it at the moment?",
      "How is this affecting your daily life, and what are you most worried about?",
    ]);
    const transcript = replies.join(" ").toLowerCase();
    assert.match(transcript, /four months|4 months|months/, "patient gives the duration");
    assert.match(transcript, /exercise|cold|dust|pollen/, "patient describes triggers");
    assert.match(transcript, /mother|mum|mom/, "patient gives the family history");
    assert.match(transcript, /vape|vaping/, "patient discloses vaping");

    await endSession(auth, id);
    const ended = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", auth);
    assert.ok(ended.body.data.checklist, "the checklist is revealed once the session ends");

    const marked = await aiMark(auth, id);
    report("thorough asthma candidate", marked);
    scores.thoroughAsthma = marked.result.finalScore.percentage;
    assert.ok(scores.thoroughAsthma >= 60, `a thorough history should score well (got ${scores.thoroughAsthma}%)`);
    for (const itemId of ["duration", "nocturnal", "triggers", "family_history", "smoking_vaping"]) {
      assert.ok(itemScore(marked, itemId) > 0, `examiner credited "${itemId}"`);
    }
    assert.equal(await balanceOf(auth), 10 - FULL_STATION);
  });

  test("Asthma station — a weak candidate is marked lower than a thorough one", { timeout: SESSION_TIMEOUT }, async () => {
    const { auth } = await registerStudent(FULL_STATION);
    const id = await startSession(auth, "breathlessness-young-adult-asthma");
    await interview(auth, id, [
      "Hello, what brings you in?",
      "Okay. Is it bad?",
    ]);
    await endSession(auth, id);

    const marked = await aiMark(auth, id);
    report("weak asthma candidate", marked);
    const weak = marked.result.finalScore.percentage;
    assert.ok(weak < 50, `a two-question history should score poorly (got ${weak}%)`);
    if (scores.thoroughAsthma !== undefined) {
      assert.ok(weak < scores.thoroughAsthma, `weak (${weak}%) should score below thorough (${scores.thoroughAsthma}%)`);
    }
    assert.ok(marked.result.feedback.missedItems.length >= 4, "the examiner lists what was missed");
    assert.equal(itemScore(marked, "family_history"), 0, "no credit for a question that was never asked");
    assert.equal(await balanceOf(auth), 0);
  });

  test("Pulmonary embolism station — safety-critical risk factors are elicited and credited", { timeout: SESSION_TIMEOUT }, async () => {
    const { auth } = await registerStudent(FULL_STATION);
    const id = await startSession(auth, "pdf-focused-history-immediate-assessment-suspected-pulmonary-embolism");
    const replies = await interview(auth, id, [
      "Are you able to talk to me comfortably right now? How is your breathing at this moment?",
      "When exactly did the breathlessness start, and did it come on suddenly?",
      "Can you describe the chest pain? Where is it and is it worse when you breathe in?",
      "Have you felt faint, collapsed, or coughed up any blood?",
      "Have you noticed any swelling, pain or redness in either of your legs?",
      "Have you had any recent surgery, hospital stays, or been less mobile recently?",
      "Have you ever had a blood clot in your leg or lungs before?",
      "Any cancer, long-haul travel, or blood clots running in the family?",
      "Are you taking any blood thinners, and have you had any bleeding problems or stomach ulcers?",
      "Do you have any kidney problems or allergies to contrast dye?",
      "Have you had any fever or productive cough?",
    ]);
    const transcript = replies.join(" ").toLowerCase();
    assert.match(transcript, /calf|leg/, "patient reports the swollen calf");
    assert.match(transcript, /knee/, "patient reports the recent knee replacement");

    await endSession(auth, id);
    const marked = await aiMark(auth, id);
    report("pulmonary embolism candidate", marked);
    assert.ok(itemScore(marked, "pe_dvt_previous_vte") > 0, "examiner credited the DVT / previous VTE questions");
    assert.ok(itemScore(marked, "pe_provoking_risks") > 0, "examiner credited the provoking-risk questions");
    assert.ok(marked.result.finalScore.percentage >= 40, `got ${marked.result.finalScore.percentage}%`);
  });

  test("Gynaecology abdominal pain station — a sensitive history is marked across sections", { timeout: SESSION_TIMEOUT }, async () => {
    const { auth } = await registerStudent(FULL_STATION);
    const id = await startSession(auth, "abdominal-pain-young-woman-gynaecology-history");
    const replies = await interview(auth, id, [
      "Hello, I'm one of the doctors. Can I confirm your name and age, and what's brought you in today?",
      "Where exactly is the pain, when did it start and how did it come on?",
      "What does the pain feel like, does it spread anywhere, and how bad is it out of ten?",
      "Have you had any bleeding from down below? Any clots or passing of tissue?",
      "Any nausea, vomiting, diarrhoea, urinary symptoms or fever?",
      "Have you felt dizzy or fainted at all?",
      "When was your last menstrual period, and are your periods usually regular?",
      "Is there any chance you could be pregnant? Are you using any contraception?",
      "I need to ask some personal questions. Are you sexually active, and have you had any new partners?",
      "Do you take any regular medicines, and is there anything that runs in the family?",
      "Do you smoke or drink alcohol, and what do you do for work?",
      "What do you think is going on, and is there anything worrying you?",
    ]);
    assert.match(replies.join(" ").toLowerCase(), /bleed/, "patient discloses the vaginal bleeding");

    await endSession(auth, id);
    const marked = await aiMark(auth, id);
    report("gynaecology candidate", marked);
    for (const itemId of ["abdo_associated_bleeding", "abdo_gyn_history", "abdo_sexual_history"]) {
      assert.ok(itemScore(marked, itemId) > 0, `examiner credited "${itemId}"`);
    }
    assert.ok(marked.result.finalScore.percentage >= 50, `got ${marked.result.finalScore.percentage}%`);
  });

  test("Haematemesis station — a full-length emergency history is marked", { timeout: SESSION_TIMEOUT }, async () => {
    const { auth } = await registerStudent(FULL_STATION);
    const id = await startSession(auth, "haematemesis-upper-gi-bleed-history");
    const replies = await interview(auth, id, [
      "Hi, I'm one of the doctors. Can I confirm your name and age?",
      "Can you tell me what brought you into hospital today?",
      "When did the vomiting of blood start, and how many times has it happened?",
      "What did the blood look like — bright red, dark, or like coffee grounds? Any clots?",
      "Have you felt dizzy, weak, or like you might faint?",
      "Have you noticed any black, sticky stools?",
      "Any abdominal pain, chest pain, or bleeding from anywhere else?",
      "Do you have any liver disease, or have you been told you have swollen veins in your food pipe?",
      "Are you taking any regular medicines, blood thinners, aspirin or ibuprofen?",
      "How much alcohol do you drink in a typical week?",
      "Do you smoke or use any recreational drugs?",
      "What are you most worried about?",
    ]);
    assert.match(replies.join(" ").toLowerCase(), /liver|alcohol|drink/, "patient discloses liver disease / alcohol");

    await endSession(auth, id);
    const marked = await aiMark(auth, id);
    report("haematemesis candidate", marked);
    assert.ok(marked.result.finalScore.percentage >= 30, `got ${marked.result.finalScore.percentage}%`);
  });

  test("Guided self-practice mode is free, shows the checklist, and is self-marked without AI", { timeout: 60_000 }, async () => {
    const { auth } = await registerStudent(0);
    const id = await startSession(auth, "breathlessness-young-adult-asthma", "single-player");
    assert.equal(await balanceOf(auth), 0, "self-practice costs nothing");

    const view = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", auth);
    assert.ok(view.body.data.checklist, "the checklist is visible straight away in self-practice");
    const allItems = view.body.data.checklist.sections.flatMap((section) => section.items.map((item) => item.itemId));
    assert.equal(allItems.length, 8);

    // The AI patient and AI examiner are not available in this mode.
    assert.equal((await request(app).post(`/api/osce/attempts/${id}/messages`).set("Authorization", auth)
      .send({ text: "How long has this been going on?" })).status, 409);

    await endSession(auth, id);
    assert.equal((await request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth)).status, 409);

    const ticked = ["duration", "pattern", "triggers", "family_history"];
    const marked = await request(app).post(`/api/osce/attempts/${id}/self-assessment`).set("Authorization", auth)
      .send({ checkedItemIds: ticked });
    assert.equal(marked.status, 200);
    assert.equal(marked.body.data.attempt.status, "self-assessed");
    assert.equal(marked.body.data.result.finalScore.rawScore, ticked.length);
    assert.equal(marked.body.data.result.finalScore.percentage, 50);
    assert.equal(await balanceOf(auth), 0);
  });

  test("A student who can't afford AI marking can still self-mark their virtual-patient session", { timeout: SESSION_TIMEOUT }, async () => {
    const { auth, userId } = await registerStudent(CREDIT_COSTS.virtualPatient);
    const id = await startSession(auth, "breathlessness-young-adult-asthma");
    assert.equal(await balanceOf(auth), 0);
    await interview(auth, id, [
      "How long have you had these symptoms?",
      "Do you have a family history of asthma?",
    ]);
    await endSession(auth, id);

    // No credits left: AI marking is refused and the attempt is left intact.
    const refused = await request(app).post(`/api/osce/attempts/${id}/ai-assessment`).set("Authorization", auth);
    assert.equal(refused.status, 402);
    assert.equal(refused.body.code, "INSUFFICIENT_CREDITS");
    assert.equal((await OsceAttempt.findById(id)).status, "ended");

    const self = await request(app).post(`/api/osce/attempts/${id}/self-assessment`).set("Authorization", auth)
      .send({ checkedItemIds: ["duration", "family_history"] });
    assert.equal(self.status, 200);
    assert.equal(self.body.data.attempt.status, "self-assessed");

    // After marking, the session is closed to further questions and appears in history.
    assert.equal((await request(app).post(`/api/osce/attempts/${id}/messages`).set("Authorization", auth)
      .send({ text: "One more question?" })).status, 409);
    const history = await request(app).get("/api/osce/attempts").set("Authorization", auth);
    assert.ok(history.body.data.some((row) => String(row.id) === id && row.status === "self-assessed"));

    const ledger = await CreditTransaction.find({ userId }).sort({ createdAt: 1 }).lean();
    assert.deepEqual(ledger.map((row) => [row.type, row.amount]), [["grant", 3], ["spend", -3]]);
  });
});
