import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildEndocrinology15StationBundles, seedEndocrinology15OsceStations } from "../src/seed/endocrinology15Osce.seed.js";
import { seedEndocrinologyOsceStations } from "../src/seed/endocrinologyOsce.seed.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { Specialty } from "../src/models/Specialty.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { User } from "../src/models/User.js";
import { assessAttemptWithAi } from "../src/services/aiAssessment.service.js";
import { buildVirtualPatientMessages } from "../src/prompts/virtualPatient.prompt.js";

const original = JSON.parse(readFileSync(new URL("../src/seed/endocrinology15Stations.data.json", import.meta.url), "utf8"));
let mongod;
let app;
before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  await seedEndocrinology15OsceStations();
});
after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
async function register(email) {
  const response = await request(app).post("/api/auth/register").send({ fullName: "Endocrinology Test", email, password: "StrongPass123", roleLabel: "MBBS Student" });
  assert.equal(response.status, 201);
  return { token: `Bearer ${response.body.data.token}`, userId: response.body.data.user.id };
}

test("all 15 endocrinology stations persist the complete reviewed content and 20-point rubric", async () => {
  const bundles = buildEndocrinology15StationBundles();
  assert.equal(bundles.length, 15);
  assert.deepEqual(bundles.map(b => b.module.title), ["Hypothyroidism", "Hyperthyroidism", "Type 2 Diabetes Mellitus", "Hypoglycaemia", "Diabetic Foot", "Gestational Diabetes", "Primary Adrenal Insufficiency", "Adrenal Crisis", "Cushing Syndrome", "Acromegaly", "Hyperprolactinaemia / Prolactinoma", "Cranial Diabetes Insipidus", "Hypercalcaemia due to Primary Hyperparathyroidism", "Acute Symptomatic Hypocalcaemia", "Diabetic Ketoacidosis"]);
  assert.deepEqual(bundles.filter(b => b.module.practiceModes.includes("virtual-patient")).map(b => b.source.number), [1, 2, 3, 6, 7, 11, 13]);
  assert.equal(await OsceStation.countDocuments({ taskTags: "endocrinology-15" }), 15);
  assert.equal(await PatientScript.countDocuments({ slug: /^endo-\d\d-/ }), 15);
  assert.equal(await SmartChecklist.countDocuments({ slug: /^endo-\d\d-/ }), 15);
  for (const bundle of bundles) {
    const station = await OsceStation.findOne({ slug: bundle.module.slug }).lean();
    const rubric = await SmartChecklist.findById(station.smartChecklistId).lean();
    const script = await PatientScript.findById(station.patientScriptId).lean();
    const expected = bundle.source;
    assert.equal(station.timeLimitSeconds, 600);
    assert.deepEqual(station.candidateInstructions.tasks, expected.candidateInstructions);
    assert.deepEqual(station.candidateHandout, expected.candidateHandout);
    assert.deepEqual(station.simulationScript, expected.simulationScript);
    assert.equal(station.learningNotes, expected.learningNotes.join("\n"));
    assert.equal(station.examinerInstructions, expected.examinerInstructions.join("\n"));
    assert.equal(station.keyAnswerGuide, expected.keyAnswerGuide.join("\n"));
    assert.deepEqual(station.suggestedCandidateApproach, expected.suggestedApproach);
    assert.deepEqual(station.vivaQuestions.map(q => q.question), expected.promptQuestions);
    assert.deepEqual(station.expectedCompetencies, expected.expectedCompetencies);
    assert.deepEqual(station.criticalSafetyErrors, expected.criticalSafetyErrors);
    assert.deepEqual(station.globalRatingOptions, expected.globalRating);
    assert.deepEqual(station.facultySourceNote, expected.sourceNote);
    assert.equal(station.facultyNote, original.metadata.facultyNote);
    assert.deepEqual(station.assessmentDesign, original.metadata.assessmentDesign);
    assert.deepEqual(rubric.sections.flatMap(s => s.items.map(i => i.label)), expected.checklist.map(i => i.criterion));
    assert.equal(rubric.sections.flatMap(s => s.items).reduce((sum, item) => sum + item.maxRawScore, 0), 20);
    assert.equal(script.facts.length, bundle.patientScript.facts.length);
    assert.equal(String(station.specialtyId), String((await Specialty.findOne({ slug: "endocrinology" }))._id));
  }
});

test("re-seeding preserves IDs and repairs only the legacy DKA specialty without losing its content", async () => {
  const [legacy] = await seedEndocrinologyOsceStations({ universalGuide: { _id: new mongoose.Types.ObjectId() } });
  const wrongSpecialty = await Specialty.create({ name: "Gynaecology", slug: "gynaecology" });
  await OsceStation.updateOne({ _id: legacy._id }, { $set: { specialtyId: wrongSpecialty._id } });
  const before = await OsceStation.find({ taskTags: "endocrinology-15" }).sort({ slug: 1 }).lean();
  await seedEndocrinology15OsceStations();
  const after = await OsceStation.find({ taskTags: "endocrinology-15" }).sort({ slug: 1 }).lean();
  assert.equal(after.length, 15);
  for (let index = 0; index < before.length; index += 1) {
    for (const field of ["_id", "specialtyId", "patientScriptId", "smartChecklistId"]) assert.equal(String(after[index][field]), String(before[index][field]));
  }
  const repaired = await OsceStation.findById(legacy._id).lean();
  assert.equal(String(repaired.specialtyId), String((await Specialty.findOne({ slug: "endocrinology" }))._id));
  assert.equal(repaired.title, "DKA Abdominal Pain History");
  assert.equal(String(repaired.patientScriptId), String(legacy.patientScriptId));
  assert.equal(String(repaired.smartChecklistId), String(legacy.smartChecklistId));
  assert.equal(repaired.keyAnswerGuide, legacy.keyAnswerGuide);
});

test("candidate handouts are visible while examiner prompts and learning notes wait for review", async () => {
  const { token } = await register("endo.candidate@example.com");
  for (const bundle of buildEndocrinology15StationBundles()) {
    const response = await request(app).get(`/api/osce/${bundle.module.slug}`).set("Authorization", token);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.candidateHandout, bundle.module.candidateHandout);
    assert.deepEqual(response.body.data.practiceOptions, bundle.module.practiceModes);
    assert.equal(response.body.data.learningNotes, undefined);
    assert.equal(response.body.data.vivaQuestions, undefined);
    assert.equal(response.body.data.keyAnswerGuide, undefined);
    assert.equal(response.body.data.criticalSafetyErrors, undefined);
  }
  const guided = await request(app).get("/api/osce/endo-08-adrenal-crisis/single-player").set("Authorization", token);
  assert.equal(guided.status, 200);
  assert.ok(guided.body.data.simulationScript.length);
  assert.ok(guided.body.data.keyAnswerGuide);
  assert.ok(guided.body.data.learningNotes);
  assert.equal(guided.body.data.criticalSafetyErrors.length, 3);
  assert.ok(guided.body.data.facultyNote);
});

test("all eight guided-only endocrinology stations reject paid AI sessions before creating or charging an attempt", async () => {
  const { token, userId } = await register("endo.modes@example.com");
  await User.updateOne({ _id: userId }, { $set: { creditBalance: 100 } });
  const beforeAttempts = await OsceAttempt.countDocuments();
  const beforeCredits = (await User.findById(userId)).creditBalance;
  const stations = await OsceStation.find({ taskTags: "endocrinology-15", practiceModes: { $nin: ["virtual-patient"] } });
  assert.equal(stations.length, 8);
  for (const station of stations) {
    const response = await request(app).post("/api/osce/attempts").set("Authorization", token).send({ stationId: String(station._id), mode: "virtual-patient" });
    assert.equal(response.status, 409);
  }
  assert.equal(await OsceAttempt.countDocuments(), beforeAttempts);
  assert.equal((await User.findById(userId)).creditBalance, beforeCredits);
});

test("guided endocrinology assessment saves 0/1/2 partial credit and releases post-station notes", async () => {
  const { token } = await register("endo.marking@example.com");
  const station = await OsceStation.findOne({ slug: "endo-08-adrenal-crisis" });
  const rubric = await SmartChecklist.findById(station.smartChecklistId);
  const items = rubric.sections[0].items;
  const created = await request(app).post("/api/osce/attempts").set("Authorization", token).send({ stationId: String(station._id), mode: "single-player" });
  assert.equal(created.status, 201);
  const id = created.body.data.attempt.id;
  assert.equal((await request(app).post(`/api/osce/attempts/${id}/end`).set("Authorization", token).send({})).status, 200);
  const marked = await request(app).post(`/api/osce/attempts/${id}/self-assessment`).set("Authorization", token).send({ checkedItemIds: [items[0].itemId, items[1].itemId], itemScores: [{ itemId: items[0].itemId, rawScore: 1 }, { itemId: items[1].itemId, rawScore: 2 }] });
  assert.equal(marked.status, 200);
  const attempt = await OsceAttempt.findById(id);
  assert.equal(attempt.finalScore.rawScore, 3);
  assert.equal(attempt.finalScore.maxRawScore, 20);
  assert.equal(attempt.finalScore.percentage, 15);
  const review = await request(app).get(`/api/osce/attempts/${id}`).set("Authorization", token);
  assert.equal(review.status, 200);
  assert.ok(review.body.data.module.learningNotes);
  assert.equal(review.body.data.module.keyAnswerGuide, station.keyAnswerGuide);
  assert.deepEqual(review.body.data.module.criticalSafetyErrors, [...station.criticalSafetyErrors]);
});

test("AI marking receives counselling tasks, clinical context and the partial-credit rubric", async () => {
  const { module, checklist, patientScript } = buildEndocrinology15StationBundles()[6];
  const sentence = "Never stop your steroid tablets abruptly. If vomiting prevents taking them, seek emergency care for an injection.";
  const result = await assessAttemptWithAi({ module, checklist, attempt: { aiProvider: "openai", messages: [{ role: "student", finalText: sentence }] }, generate: async ({ messages }) => {
    assert.match(messages[0].content, /counselling/);
    assert.match(messages[0].content, /explained/);
    const payload = JSON.parse(messages[1].content);
    assert.deepEqual(payload.module.candidateHandout, module.candidateHandout);
    assert.deepEqual(payload.module.criticalSafetyErrors, module.criticalSafetyErrors);
    assert.equal(payload.transcript[0].text, sentence);
    return { provider: "openai", model: "test-model", text: JSON.stringify({ items: checklist.sections[0].items.map(item => ({ itemId: item.itemId, rawScore: item.order === 5 ? 2 : item.order === 7 ? 1 : 0, rationale: item.order === 5 ? "Explicit cessation counselling." : "Compared with transcript evidence." })), summary: "Reviewed counselling.", strengths: [], improvements: [] }) };
  } });
  assert.equal(result.finalScore.rawScore, 3);
  assert.equal(result.finalScore.maxRawScore, 20);
  const prompt = buildVirtualPatientMessages({ module, patientScript, recentMessages: [], studentQuestion: "feelin dizzy when ya get up?" });
  assert.match(prompt[0].content, /dizziness on standing/);
  assert.match(prompt[0].content, /travels to areas far from a hospital/);
  assert.ok(!prompt[0].content.includes(module.keyAnswerGuide));
});

test("published teaching corrections preserve original content and use the cited clinical standard", () => {
  const bundles = buildEndocrinology15StationBundles();
  assert.match(original.stations[1].keyAnswerGuide.at(-1), /4–8-week/);
  assert.match(bundles[1].module.keyAnswerGuide, /every 6 weeks/);
  assert.match(bundles[1].module.keyAnswerGuide, /every 3 months/);
  assert.match(original.stations[3].keyAnswerGuide[0], /level-1/);
  assert.doesNotMatch(bundles[3].module.keyAnswerGuide, /symptomatic level-1/);
  assert.match(original.stations[13].learningNotes[0], /10 mL.*10–20 minutes/);
  assert.match(bundles[13].module.learningNotes, /10–20 mL.*50–100 mL.*over 10 minutes/);
  assert.match(bundles[13].checklist.sections[0].items[5].label, /continuous ECG monitoring/);
});
