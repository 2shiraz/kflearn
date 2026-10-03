import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildGit15StationBundles, seedGit15OsceStations } from "../src/seed/git15Osce.seed.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { Specialty } from "../src/models/Specialty.js";
import { User } from "../src/models/User.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { buildVirtualPatientMessages } from "../src/prompts/virtualPatient.prompt.js";
import { assessAttemptWithAi } from "../src/services/aiAssessment.service.js";

const original = JSON.parse(readFileSync(new URL("../src/seed/git15Stations.data.json", import.meta.url), "utf8"));
let mongod, app;
before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  await seedGit15OsceStations();
});
after(async () => { await mongoose.disconnect(); await mongod?.stop(); });
async function register(email) {
  const response = await request(app).post("/api/auth/register").send({ fullName: "GIT Test", email, password: "StrongPass123", roleLabel: "MBBS Student" });
  assert.equal(response.status, 201);
  return { token: `Bearer ${response.body.data.token}`, userId: response.body.data.user.id };
}

test("all 15 GIT stations preserve complete reviewed sections, eight-minute timing and 20-point rubrics", async () => {
  const bundles = buildGit15StationBundles();
  assert.equal(bundles.length, 15);
  assert.equal(original.metadata.printingAndAssembly.length, 3);
  assert.equal(await OsceStation.countDocuments({ taskTags: "git-15" }), 15);
  assert.equal(await PatientScript.countDocuments({ slug: /^git-\d\d-/ }), 15);
  assert.equal(await SmartChecklist.countDocuments({ slug: /^git-\d\d-/ }), 15);
  const specialty = await Specialty.findOne({ slug: "gastroenterology" });
  for (const { source, module, patientScript } of bundles) {
    const persisted = await OsceStation.findOne({ slug: module.slug }).lean();
    assert.equal(persisted.timeLimitSeconds, 480);
    assert.equal(String(persisted.specialtyId), String(specialty._id));
    for (const field of ["title", "stationFormat", "stationType", "facultyNote", "keyAnswerGuide", "examinerInstructions", "learningNotes"]) assert.equal(persisted[field], module[field]);
    for (const field of ["candidateHandout", "simulationScript", "suggestedCandidateApproach", "expectedCompetencies", "criticalSafetyErrors", "globalRatingOptions", "facultySourceNote", "assessmentDesign", "practiceModes"]) assert.deepEqual(persisted[field], module[field]);
    assert.deepEqual(persisted.candidateInstructions.tasks, source.candidateInstructions);
    assert.deepEqual(persisted.vivaQuestions.map(q => q.question), source.promptQuestions);
    const checklist = await SmartChecklist.findById(persisted.smartChecklistId).lean();
    assert.deepEqual(checklist.sections[0].items.map(i => i.label), source.checklist.map(i => i.criterion));
    assert.equal(checklist.sections[0].items.reduce((sum, i) => sum + i.maxRawScore, 0), 20);
    assert.ok(checklist.sections[0].items.every(i => i.allowPartial));
    const script = await PatientScript.findById(persisted.patientScriptId).lean();
    assert.deepEqual(script.facts, patientScript.facts);
    for (const section of ["candidateInstructions", "candidateHandout", "learningNotes", "simulationScript", "examinerInstructions", "keyAnswerGuide", "suggestedApproach", "promptQuestions", "expectedCompetencies", "criticalSafetyErrors", "sourceNote"]) assert.ok(original.stations[source.number - 1][section].length, `${source.number}: ${section}`);
    assert.equal(source.globalRating.length, 5);
  }
});

test("re-seeding preserves IDs and leaves unrelated gastroenterology stations and specialty settings intact", async () => {
  const specialty = await Specialty.findOne({ slug: "gastroenterology" });
  await Specialty.updateOne({ _id: specialty._id }, { $set: { description: "Custom description" } });
  const [example] = buildGit15StationBundles();
  const legacy = await OsceStation.create({ ...example.module, slug: "haematemesis-upper-gi-bleed-history", title: "Existing history", specialtyId: specialty._id, taskTags: ["legacy"] });
  const before = await OsceStation.find({ taskTags: "git-15" }).sort({ slug: 1 }).lean();
  await seedGit15OsceStations();
  const after = await OsceStation.find({ taskTags: "git-15" }).sort({ slug: 1 }).lean();
  assert.equal(after.length, 15);
  for (let i = 0; i < before.length; i++) for (const key of ["_id", "patientScriptId", "smartChecklistId", "specialtyId"]) assert.equal(String(after[i][key]), String(before[i][key]));
  assert.equal((await OsceStation.findById(legacy._id)).title, "Existing history");
  assert.equal((await Specialty.findById(specialty._id)).description, "Custom description");
});

test("candidate views conceal examiner material, with 11 AI conversations and four guided-only stations", async () => {
  const { token, userId } = await register("git.modes@example.com");
  await User.updateOne({ _id: userId }, { $set: { creditBalance: 100 } });
  const bundles = buildGit15StationBundles();
  assert.deepEqual(bundles.filter(b => b.module.practiceModes.includes("virtual-patient")).map(b => b.source.number), [1, 2, 3, 4, 6, 7, 8, 9, 10, 13, 14]);
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

test("guided GIT sessions award partial credit and release the complete post-station review", async () => {
  const { token } = await register("git.marking@example.com");
  const station = await OsceStation.findOne({ slug: "git-11-acute-upper-gastrointestinal-bleeding" });
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
  assert.equal(review.body.data.module.keyAnswerGuide, station.keyAnswerGuide);
  assert.equal(review.body.data.module.learningNotes, station.learningNotes);
});

test("AI context covers every authored script/handout fact and identifies the grandmother as respondent", () => {
  for (const { module, patientScript, source } of buildGit15StationBundles().filter(b => b.module.practiceModes.includes("virtual-patient"))) {
    const prompt = buildVirtualPatientMessages({ module, patientScript, recentMessages: [], studentQuestion: "tell me wat happnd?" });
    for (const line of [...source.simulationScript, ...source.candidateHandout]) assert.ok(patientScript.facts.some(f => f.value === line));
    assert.ok(!prompt[0].content.includes(module.keyAnswerGuide));
    assert.match(patientScript.unknownFactPolicy, /Unreported is not the same as denied/);
  }
  const grandmother = buildGit15StationBundles()[9];
  assert.equal(grandmother.patientScript.patientIdentity.age, 55);
  assert.match(grandmother.patientScript.expectedPatientAttitude, /grandmother/);
  const prompt = buildVirtualPatientMessages({ ...grandmother, recentMessages: [], studentQuestion: "when did baby get yellow?" });
  assert.match(prompt[0].content, /six-day-old grandson/);
  assert.match(prompt[0].content, /not the baby/);
  assert.equal(buildGit15StationBundles()[2].patientScript.patientIdentity.age, undefined);
});

test("AI marking gets counselling context and the ten-item partial-credit rubric", async () => {
  const { module, checklist } = buildGit15StationBundles()[9];
  const result = await assessAttemptWithAi({ module, checklist, attempt: { aiProvider: "openai", messages: [{ role: "student", finalText: "When did the yellow colour start? Please continue breastfeeding." }] }, generate: async ({ messages }) => {
    const payload = JSON.parse(messages[1].content);
    assert.deepEqual(payload.module.candidateHandout, module.candidateHandout);
    assert.deepEqual(payload.module.criticalSafetyErrors, module.criticalSafetyErrors);
    assert.match(payload.module.keyAnswerGuide, /within 2 hours/);
    return { provider: "openai", model: "test-model", text: JSON.stringify({ items: checklist.sections[0].items.map(item => ({ itemId: item.itemId, rawScore: item.order === 1 ? 2 : item.order === 8 ? 1 : 0, rationale: "Transcript evidence." })), summary: "Reviewed.", strengths: [], improvements: [] }) };
  } });
  assert.equal(result.finalScore.rawScore, 3);
  assert.equal(result.finalScore.maxRawScore, 20);
});

test("clinical corrections keep original wording internally and align published guidance and scoring", () => {
  const b = buildGit15StationBundles();
  assert.match(b[2].module.learningNotes, /two-week PPI washout/);
  assert.match(b[3].module.learningNotes, /OR associated/);
  assert.match(b[6].checklist.sections[0].items[3].label, /rather than stool count alone/);
  assert.match(b[9].module.learningNotes, /within 2 hours/);
  assert.match(b[9].checklist.sections[0].items[4].label, /actual bilirubin/);
  assert.match(original.stations[10].checklist[7].criterion, /IV PPI/);
  assert.match(b[10].checklist.sections[0].items[7].label, /rather than routine pre-endoscopy PPI/);
  assert.match(original.stations[11].checklist[2].criterion, /aggressive IV/);
  assert.match(b[11].module.keyAnswerGuide, /moderately aggressive/);
  assert.match(b[11].checklist.sections[0].items[2].label, /fluid overload/);
  assert.match(b[14].checklist.sections[0].items[7].label, /appropriate imaging/);
});
