import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildCns15StationBundles, seedCns15OsceStations } from "../src/seed/cns15Osce.seed.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { Specialty } from "../src/models/Specialty.js";
import { User } from "../src/models/User.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { buildVirtualPatientMessages } from "../src/prompts/virtualPatient.prompt.js";
import { assessAttemptWithAi } from "../src/services/aiAssessment.service.js";

const original = JSON.parse(readFileSync(new URL("../src/seed/cns15Stations.data.json", import.meta.url), "utf8"));
let mongod, app;
before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  await seedCns15OsceStations();
});
after(async () => { await mongoose.disconnect(); await mongod?.stop(); });
async function register(email) {
  const response = await request(app).post("/api/auth/register").send({ fullName: "CNS Test", email, password: "StrongPass123", roleLabel: "MBBS Student" });
  assert.equal(response.status, 201);
  return { token: `Bearer ${response.body.data.token}`, userId: response.body.data.user.id };
}
function compareAuthored(actual, expected) {
  if (expected instanceof Date) assert.equal(new Date(actual).toISOString(), expected.toISOString());
  else if (Array.isArray(expected)) { assert.equal(actual.length, expected.length); expected.forEach((value, i) => compareAuthored(actual[i], value)); }
  else if (expected && typeof expected === "object") for (const [key, value] of Object.entries(expected)) compareAuthored(actual[key], value);
  else assert.deepEqual(actual, expected);
}

test("all 15 cns stations preserve every authored section and linked eight-minute/20-point rubric", async () => {
  const bundles = buildCns15StationBundles();
  assert.equal(bundles.length, 15);
  assert.deepEqual(bundles.map(b => b.module.title), original.stations.map(s => s.title));
  assert.equal(await OsceStation.countDocuments({ taskTags: "cns-15" }), 15);
  assert.equal(await PatientScript.countDocuments({ slug: /^cns-\d\d-/ }), 15);
  assert.equal(await SmartChecklist.countDocuments({ slug: /^cns-\d\d-/ }), 15);
  const specialty = await Specialty.findOne({ slug: "cns" });
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

test("repeat seeding retains IDs, unrelated legacy content and custom specialty settings", async () => {
  const specialty = await Specialty.findOne({ slug: "cns" });
  await Specialty.updateOne({ _id: specialty._id }, { $set: { description: "Custom specialty details" } });
  const [example] = buildCns15StationBundles();
  const legacy = await OsceStation.create({ ...example.module, slug: "legacy-unrelated-station", title: "Existing unrelated station", taskTags: ["legacy"], specialtyId: specialty._id });
  const before = await OsceStation.find({ taskTags: "cns-15" }).sort({ slug: 1 }).lean();
  await seedCns15OsceStations();
  const after = await OsceStation.find({ taskTags: "cns-15" }).sort({ slug: 1 }).lean();
  assert.equal(after.length, 15);
  for (let i = 0; i < before.length; i++) for (const key of ["_id", "patientScriptId", "smartChecklistId", "specialtyId"]) assert.equal(String(after[i][key]), String(before[i][key]));
  assert.equal((await OsceStation.findById(legacy._id)).title, "Existing unrelated station");
  assert.equal((await Specialty.findById(specialty._id)).description, "Custom specialty details");
});

test("candidate views hide examiner answers and show three AI conversations and twelve guided-only cases", async () => {
  const { token, userId } = await register("cns.modes@example.com");
  await User.updateOne({ _id: userId }, { $set: { creditBalance: 100 } });
  const bundles = buildCns15StationBundles();
  assert.deepEqual(bundles.filter(b => b.module.practiceModes.includes("virtual-patient")).map(b => b.source.number), [1, 2, 3]);
  const attempts = await OsceAttempt.countDocuments();
  for (const bundle of bundles) {
    const response = await request(app).get(`/api/osce/${bundle.module.slug}`).set("Authorization", token);
    assert.equal(response.status, 200);
    assert.ok(response.body.data, `Missing station data for ${bundle.module.slug}: ${response.text}`);
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
  const { token } = await register("cns.marking@example.com");
  const bundle = buildCns15StationBundles()[7];
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



test("AI patient and parent contexts preserve every scripted fact without examiner leakage", () => {
  const b=buildCns15StationBundles();
  for(const {module,patientScript,source} of b.filter(s=>s.module.practiceModes.includes("virtual-patient"))) {
    for(const line of source.simulationScript) assert.ok(patientScript.facts.some(f=>f.value===line));
    assert.ok(patientScript.facts.every(f=>f.naturalResponse));
    const prompt=buildVirtualPatientMessages({module,patientScript,recentMessages:[],studentQuestion:"wot happend b4 n how long?"});
    assert.ok(!prompt[0].content.includes(module.keyAnswerGuide));
    assert.ok(!prompt[0].content.includes(module.examinerInstructions));
  }
  assert.equal(b[2].patientScript.patientIdentity.name,"Mahnoor Ali");
  assert.equal(b[2].patientScript.patientIdentity.age,undefined);
  assert.match(b[2].patientScript.demeanor.general,/mother of 18-month-old Rayyan/);
  assert.match(b[1].patientScript.facts.map(f=>f.naturalResponse).join(" "),/witness.*ninety seconds/);
  assert.match(b[2].patientScript.facts.map(f=>f.naturalResponse).join(" "),/39.4.*three minutes/);
});

test("static stations retain full findings, precise values and repaired wrapped instructions", () => {
  const b=buildCns15StationBundles();
  assert.equal(b[4].module.stationType,"examination");
  assert.match(b[4].module.examinerInstructions,/E: opens eyes to speech = 3.*V: confused conversation = 4.*M: localises pain = 5.*12\/15/);
  assert.equal(b[5].module.candidateInstructions.tasks.length,1);
  assert.match(b[5].module.candidateInstructions.tasks[0],/^Interpret.*management principle for each\.$/);
  assert.equal(b[7].module.candidateInstructions.tasks.length,1);
  assert.match(b[7].module.candidateInstructions.tasks[0],/^Demonstrate.*contraindications and specimen handling\.$/);
  assert.match(b[8].module.keyAnswerGuide,/right abducens \(VI\) palsy/);
  assert.match(b[10].module.keyAnswerGuide,/respiratory function and autonomic instability/);
  assert.match(b[14].module.simulationScript.join(" "),/>5 minutes/);
  assert.ok(!b[14].module.simulationScript.join(" ").includes("glucose 5"));
  for(const s of b) {
    assert.equal(s.source.promptQuestions.length,2);
    assert.equal(s.source.checklist.length,10);
    assert.ok(s.source.checklist.every(c=>c.criterion && !c.criterion.includes("0 / 1 / 2")));
    assert.ok(s.source.criticalSafetyErrors.length>=1);
  }
});

test("AI marking receives parent counselling context and the complete partial-credit rubric", async () => {
  const {module,checklist}=buildCns15StationBundles()[2];
  const result=await assessAttemptWithAi({module,checklist,attempt:{aiProvider:"openai",messages:[{role:"student",finalText:"Protect Rayyan from injury, do not restrain him or put objects in his mouth, and time the seizure."}]},generate:async({messages})=>{
    const payload=JSON.parse(messages[1].content);
    assert.equal(payload.module.keyAnswerGuide,module.keyAnswerGuide);
    assert.deepEqual(payload.module.criticalSafetyErrors,module.criticalSafetyErrors);
    return {provider:"openai",model:"test-model",text:JSON.stringify({items:checklist.sections[0].items.map(item=>({itemId:item.itemId,rawScore:item.order===8?2:item.order===9?1:0,rationale:"Transcript evidence."})),summary:"Reviewed.",strengths:[],improvements:[]})};
  }});
  assert.equal(result.finalScore.rawScore,3);
  assert.equal(result.finalScore.maxRawScore,20);
});
