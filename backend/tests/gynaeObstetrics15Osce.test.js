import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildGynaeObstetrics15StationBundles, seedGynaeObstetrics15OsceStations } from "../src/seed/gynaeObstetrics15Osce.seed.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { Specialty } from "../src/models/Specialty.js";
import { User } from "../src/models/User.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { buildVirtualPatientMessages } from "../src/prompts/virtualPatient.prompt.js";
import { assessAttemptWithAi } from "../src/services/aiAssessment.service.js";

const original = JSON.parse(readFileSync(new URL("../src/seed/gynaeObstetrics15Stations.data.json", import.meta.url), "utf8"));
let mongod, app;
before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  await seedGynaeObstetrics15OsceStations();
});
after(async () => { await mongoose.disconnect(); await mongod?.stop(); });
async function register(email) {
  const response = await request(app).post("/api/auth/register").send({ fullName: "Gynae Obstetrics Test", email, password: "StrongPass123", roleLabel: "MBBS Student" });
  assert.equal(response.status, 201);
  return { token: `Bearer ${response.body.data.token}`, userId: response.body.data.user.id };
}
function compareAuthored(actual, expected) {
  if (expected instanceof Date) assert.equal(new Date(actual).toISOString(), expected.toISOString());
  else if (Array.isArray(expected)) { assert.equal(actual.length, expected.length); expected.forEach((value, i) => compareAuthored(actual[i], value)); }
  else if (expected && typeof expected === "object") for (const [key, value] of Object.entries(expected)) compareAuthored(actual[key], value);
  else assert.deepEqual(actual, expected);
}

test("all 15 gynae/obstetrics stations preserve every authored section and linked eight-minute/20-point rubric", async () => {
  const bundles = buildGynaeObstetrics15StationBundles();
  assert.equal(bundles.length, 15);
  assert.deepEqual(bundles.map(b => b.module.title), original.stations.map(s => s.title));
  assert.equal(await OsceStation.countDocuments({ taskTags: "gynae-obstetrics-15" }), 15);
  assert.equal(await PatientScript.countDocuments({ slug: /^gynae-obs-\d\d-/ }), 15);
  assert.equal(await SmartChecklist.countDocuments({ slug: /^gynae-obs-\d\d-/ }), 15);
  const specialty = await Specialty.findOne({ slug: "gynaecology" });
  for (const bundle of bundles) {
    const station = await OsceStation.findOne({ slug: bundle.module.slug }).lean();
    compareAuthored(station, bundle.module);
    assert.equal(station.timeLimitSeconds, 480);
    assert.equal(String(station.specialtyId), String(specialty._id));
    const script = await PatientScript.findById(station.patientScriptId).lean();
    const rubric = await SmartChecklist.findById(station.smartChecklistId).lean();
    compareAuthored(script, bundle.patientScript);
    compareAuthored(rubric, bundle.checklist);
    const source = original.stations[bundle.source.number - 1];
    assert.deepEqual(station.candidateInstructions.tasks, source.candidateInstructions);
    assert.deepEqual(station.candidateHandout, source.candidateHandout);
    assert.deepEqual(station.simulationScript, source.simulationScript);
    assert.equal(station.keyAnswerGuide, source.keyAnswerGuide.join("\n"));
    assert.equal(station.examinerInstructions, source.examinerInstructions.join("\n"));
    assert.deepEqual(station.suggestedCandidateApproach, source.suggestedApproach);
    assert.deepEqual(station.expectedCompetencies, source.expectedCompetencies);
    assert.deepEqual(station.criticalSafetyErrors, source.criticalSafetyErrors);
    assert.deepEqual(station.globalRatingOptions, source.globalRating);
    assert.deepEqual(station.vivaQuestions.map(q => q.question), source.promptQuestions);
    assert.deepEqual(station.facultySourceNote, source.sourceNote);
    assert.deepEqual(station.assessmentDesign, [...original.metadata.assessmentDesign, source.scoringAnchor]);
    assert.equal(station.learningNotes, "");
    assert.equal(rubric.sections[0].items.reduce((sum, item) => sum + item.maxRawScore, 0), 20);
    assert.deepEqual(rubric.sections[0].items.map(i => i.label), source.checklist.map(i => i.criterion));
    assert.ok(rubric.sections[0].items.every(i => i.allowPartial && !i.criticalSafetyItem));
  }
});

test("repeat seeding retains IDs, the existing abdominal-pain history and custom specialty settings", async () => {
  const specialty = await Specialty.findOne({ slug: "gynaecology" });
  await Specialty.updateOne({ _id: specialty._id }, { $set: { description: "Custom specialty details" } });
  const [example] = buildGynaeObstetrics15StationBundles();
  const legacy = await OsceStation.create({ ...example.module, slug: "abdominal-pain-young-woman-gynaecology-history", title: "Existing abdominal pain history", taskTags: ["legacy"], specialtyId: specialty._id });
  const before = await OsceStation.find({ taskTags: "gynae-obstetrics-15" }).sort({ slug: 1 }).lean();
  await seedGynaeObstetrics15OsceStations();
  const after = await OsceStation.find({ taskTags: "gynae-obstetrics-15" }).sort({ slug: 1 }).lean();
  assert.equal(after.length, 15);
  for (let i = 0; i < before.length; i++) for (const key of ["_id", "patientScriptId", "smartChecklistId", "specialtyId"]) assert.equal(String(after[i][key]), String(before[i][key]));
  assert.equal((await OsceStation.findById(legacy._id)).title, "Existing abdominal pain history");
  assert.equal((await Specialty.findById(specialty._id)).description, "Custom specialty details");
});

test("candidate views hide examiner answers and show seven AI conversations and eight guided-only cases", async () => {
  const { token, userId } = await register("gynae.modes@example.com");
  await User.updateOne({ _id: userId }, { $set: { creditBalance: 100 } });
  const bundles = buildGynaeObstetrics15StationBundles();
  assert.deepEqual(bundles.filter(b => b.module.practiceModes.includes("virtual-patient")).map(b => b.source.number), [1, 2, 3, 5, 6, 7, 8]);
  const attempts = await OsceAttempt.countDocuments();
  for (const bundle of bundles) {
    const response = await request(app).get(`/api/osce/${bundle.module.slug}`).set("Authorization", token);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.candidateHandout, bundle.module.candidateHandout);
    assert.deepEqual(response.body.data.practiceOptions, bundle.module.practiceModes);
    for (const field of ["learningNotes", "keyAnswerGuide", "examinerInstructions", "vivaQuestions", "criticalSafetyErrors"]) assert.equal(response.body.data[field], undefined);
    if (!bundle.module.practiceModes.includes("virtual-patient")) {
      const station = await OsceStation.findOne({ slug: bundle.module.slug });
      const blocked = await request(app).post("/api/osce/attempts").set("Authorization", token).send({ stationId: String(station._id), mode: "virtual-patient" });
      assert.equal(blocked.status, 409);
      const guided = await request(app).get(`/api/osce/${bundle.module.slug}/single-player`).set("Authorization", token);
      assert.equal(guided.status, 200);
      assert.deepEqual(guided.body.data.simulationScript, bundle.module.simulationScript);
      assert.equal(guided.body.data.keyAnswerGuide, bundle.module.keyAnswerGuide);
    }
  }
  assert.equal(await OsceAttempt.countDocuments(), attempts);
  assert.equal((await User.findById(userId)).creditBalance, 100);
});

test("guided assessment saves partial marks and returns full review even without separate learning paragraphs", async () => {
  const { token } = await register("gynae.marking@example.com");
  const bundle = buildGynaeObstetrics15StationBundles()[13];
  const station = await OsceStation.findOne({ slug: bundle.module.slug });
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
  assert.equal(review.body.data.module.learningNotes, "");
  assert.equal(review.body.data.module.keyAnswerGuide, station.keyAnswerGuide);
  assert.equal(review.body.data.module.examinerInstructions, station.examinerInstructions);
  assert.deepEqual(review.body.data.module.criticalSafetyErrors, [...station.criticalSafetyErrors]);
});

test("AI profiles retain every patient script fact without leaking examiner guidance or inventing pregnancy/physical results", () => {
  for (const { module, patientScript, source } of buildGynaeObstetrics15StationBundles().filter(b => b.module.practiceModes.includes("virtual-patient"))) {
    for (const line of source.simulationScript) assert.ok(patientScript.facts.some(f => f.value === line));
    const prompt = buildVirtualPatientMessages({ module, patientScript, recentMessages: [], studentQuestion: "wat are ur periods like?" });
    assert.ok(!prompt[0].content.includes(module.keyAnswerGuide));
    assert.ok(!prompt[0].content.includes(module.examinerInstructions));
    assert.match(patientScript.unknownFactPolicy, /Unreported is not the same as denied/);
    assert.match(patientScript.expectedPatientAttitude, /Do not invent blood pressure/);
  }
  const b = buildGynaeObstetrics15StationBundles();
  assert.equal(b[1].patientScript.patientIdentity.age, 17);
  assert.equal(b[1].patientScript.facts.find(f => f.section === "SH").revealPolicy, "IF_ASKED");
  assert.match(b[5].patientScript.openingStatement, /breaks in future/);
  assert.match(b[5].patientScript.facts.map(f => f.naturalResponse).join(" "), /mixed feeds/);
  assert.equal(b[8].patientScript.patientIdentity.age, undefined);
  assert.deepEqual(b[12].patientScript.patientIdentity, {});
});

test("AI assessment receives counselling context, protocol-based answers and the 0/1/2 rubric", async () => {
  const { module, checklist } = buildGynaeObstetrics15StationBundles()[5];
  const result = await assessAttemptWithAi({ module, checklist, attempt: { aiProvider: "openai", messages: [{ role: "student", finalText: "Are you breastfeeding? We can discuss an implant or intrauterine contraception." }] }, generate: async ({ messages }) => {
    const payload = JSON.parse(messages[1].content);
    assert.deepEqual(payload.module.candidateHandout, module.candidateHandout);
    assert.match(payload.module.keyAnswerGuide, /medical eligibility/);
    assert.deepEqual(payload.module.criticalSafetyErrors, module.criticalSafetyErrors);
    return { provider: "openai", model: "test-model", text: JSON.stringify({ items: checklist.sections[0].items.map(item => ({ itemId: item.itemId, rawScore: item.order === 1 ? 1 : item.order === 4 ? 2 : 0, rationale: "Based on transcript evidence." })), summary: "Reviewed.", strengths: [], improvements: [] }) };
  } });
  assert.equal(result.finalScore.rawScore, 3);
  assert.equal(result.finalScore.maxRawScore, 20);
});

test("static cards retain exact clinical values, EDD, complete CTG criterion and the repaired reading order", () => {
  const b = buildGynaeObstetrics15StationBundles();
  assert.equal(original.metadata.facultyNote.length, 5);
  assert.equal(original.metadata.assessmentDesign.length, 4);
  assert.match(b[5].module.suggestedCandidateApproach[0], /explain EC backup → safety net\.$/);
  assert.match(b[8].module.simulationScript.join(" "), /12 January 2026/);
  assert.match(b[8].module.simulationScript.join(" "), /34 cm.*3\/5.*142\/min/);
  assert.match(b[8].module.keyAnswerGuide, /19 October 2026/);
  assert.match(b[9].module.simulationScript.join(" "), /168\/112/);
  assert.match(b[11].module.simulationScript[0], /5 cm at 14:00; 6 cm at 18:00/);
  assert.match(b[12].module.simulationScript.join(" "), /170 bpm.*3 bpm for 50 minutes.*6 contractions/);
  assert.equal(b[12].checklist.sections[0].items[6].label, "Stops/reduces oxytocin and calls senior help.");
  assert.match(b[13].module.simulationScript.join(" "), /86\/54.*124\/min/);
  assert.match(b[14].module.simulationScript.join(" "), /112\/min.*94\/60/);
  for (const bundle of b) assert.doesNotMatch(bundle.module.facultyNote, /uploaded|source-derived|Faculty Draft/);
});
