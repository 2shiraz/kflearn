import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { buildCvsStationBundles, seedCvsOsceStations } from "../src/seed/cvsOsce.seed.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { PatientScript } from "../src/models/PatientScript.js";
import { SmartChecklist } from "../src/models/SmartChecklist.js";
import { Specialty } from "../src/models/Specialty.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";

const source = JSON.parse(readFileSync(new URL("../src/seed/cvs15Stations.data.json", import.meta.url), "utf8"));
let mongod;
let app;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  await seedCvsOsceStations();
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

async function register(email) {
  const response = await request(app).post("/api/auth/register").send({
    fullName: "CVS Seed Test",
    email,
    password: "StrongPass123",
    roleLabel: "MBBS Student",
  });
  assert.equal(response.status, 201);
  return `Bearer ${response.body.data.token}`;
}

test("portable CVS data contains all 15 full stations and 20-point rubrics", () => {
  assert.equal(source.stations.length, 15);
  assert.equal(source.metadata.assessmentDesign.length, 6);
  assert.equal(source.metadata.printingAndAssembly.length, 3);
  const bundles = buildCvsStationBundles();
  assert.equal(bundles.length, 15);
  assert.deepEqual(bundles.filter((bundle) => bundle.module.practiceModes.includes("virtual-patient")).map((bundle) => bundle.source.number), [2, 3, 4, 5, 6, 14]);
  for (const [index, original] of source.stations.entries()) {
    const { module, checklist } = bundles[index];
    assert.equal(original.number, index + 1);
    assert.equal(original.time, "10 minutes");
    assert.equal(original.checklist.length, 10);
    assert.equal(checklist.sections[0].items.reduce((sum, item) => sum + item.maxRawScore, 0), 20);
    assert.equal(original.globalRating.length, 5);
    for (const field of ["candidateInstructions", "candidateHandout", "learningNotes", "simulationScript", "examinerInstructions", "keyAnswerGuide", "suggestedApproach", "promptQuestions", "expectedCompetencies", "criticalSafetyErrors", "sourceNote"]) {
      assert.ok(original[field].length > 0, `Station ${original.number} missing ${field}`);
    }
    assert.deepEqual(module.candidateHandout, original.candidateHandout);
    assert.deepEqual(module.simulationScript, original.simulationScript);
  }
});

test("stored content preserves every station section and linked checklist", async () => {
  assert.equal(await OsceStation.countDocuments({ slug: /^cvs-\d\d-/ }), 15);
  assert.equal(await PatientScript.countDocuments({ slug: /^cvs-\d\d-/ }), 15);
  assert.equal(await SmartChecklist.countDocuments({ slug: /^cvs-\d\d-/ }), 15);
  assert.ok(await Specialty.exists({ slug: "cardiovascular" }));
  for (const bundle of buildCvsStationBundles()) {
    const module = await OsceStation.findOne({ slug: bundle.module.slug }).lean();
    const patient = await PatientScript.findById(module.patientScriptId).lean();
    const checklist = await SmartChecklist.findById(module.smartChecklistId).lean();
    const authored = bundle.source;
    assert.equal(module.title, authored.title);
    assert.equal(module.stationFormat, authored.format);
    assert.equal(module.timeLimitSeconds, 600);
    assert.deepEqual(module.candidateInstructions.tasks, authored.candidateInstructions);
    assert.deepEqual(module.candidateHandout, authored.candidateHandout);
    assert.equal(module.learningNotes, authored.learningNotes.join("\n"));
    assert.deepEqual(module.simulationScript, authored.simulationScript);
    assert.equal(module.examinerInstructions, authored.examinerInstructions.join("\n"));
    assert.equal(module.keyAnswerGuide, authored.keyAnswerGuide.join("\n"));
    assert.deepEqual(module.suggestedCandidateApproach, authored.suggestedApproach);
    assert.deepEqual(module.vivaQuestions.map((question) => question.question), authored.promptQuestions);
    assert.deepEqual(module.expectedCompetencies, authored.expectedCompetencies);
    assert.deepEqual(module.criticalSafetyErrors, authored.criticalSafetyErrors);
    assert.deepEqual(module.globalRatingOptions, authored.globalRating);
    assert.deepEqual(module.assessmentDesign, source.metadata.assessmentDesign);
    assert.deepEqual(module.facultySourceNote, authored.sourceNote);
    assert.ok(patient.facts.length >= 3);
    assert.deepEqual(checklist.sections[0].items.map((item) => item.label), authored.checklist.map((item) => item.criterion));
  }
});

test("CVS seed is idempotent and preserves station, script and checklist IDs", async () => {
  const before = await OsceStation.find({ slug: /^cvs-\d\d-/ }).sort({ slug: 1 }).lean();
  await seedCvsOsceStations();
  const after = await OsceStation.find({ slug: /^cvs-\d\d-/ }).sort({ slug: 1 }).lean();
  assert.equal(after.length, 15);
  for (let index = 0; index < before.length; index += 1) {
    for (const field of ["_id", "specialtyId", "patientScriptId", "smartChecklistId"]) {
      assert.equal(String(after[index][field]), String(before[index][field]));
    }
  }
});

test("candidate sees the handout but not examiner prompts or post-station learning notes", async () => {
  const token = await register("cvs.candidate@example.com");
  const patientStation = await request(app).get("/api/osce/cvs-03-post-mi-secondary-prevention").set("Authorization", token);
  assert.equal(patientStation.status, 200);
  assert.deepEqual(patientStation.body.data.practiceOptions, ["single-player", "virtual-patient"]);
  assert.ok(patientStation.body.data.candidateHandout.length);
  assert.equal(patientStation.body.data.learningNotes, undefined);
  assert.equal(patientStation.body.data.vivaQuestions, undefined);
  const emergencyStation = await request(app).get("/api/osce/cvs-07-acute-pulmonary-oedema").set("Authorization", token);
  assert.equal(emergencyStation.status, 200);
  assert.deepEqual(emergencyStation.body.data.practiceOptions, ["single-player"]);
  const guided = await request(app).get("/api/osce/cvs-07-acute-pulmonary-oedema/single-player").set("Authorization", token);
  assert.equal(guided.status, 200);
  assert.equal(guided.body.data.simulationScript.length, 5);
  assert.equal(guided.body.data.checklist.sections[0].items.length, 10);
  assert.ok(guided.body.data.criticalSafetyErrors.length);
  assert.ok(guided.body.data.learningNotes);
});

test("emergency stations reject paid AI mode before an attempt is created", async () => {
  const token = await register("cvs.mode@example.com");
  const station = await OsceStation.findOne({ slug: "cvs-15-cardiac-arrest" });
  const response = await request(app).post("/api/osce/attempts").set("Authorization", token)
    .send({ stationId: String(station._id), mode: "virtual-patient" });
  assert.equal(response.status, 409);
  assert.equal(await OsceAttempt.countDocuments(), 0);
  const guided = await request(app).post("/api/osce/attempts").set("Authorization", token)
    .send({ stationId: String(station._id), mode: "single-player" });
  assert.equal(guided.status, 201);
});

test("CVS self-marking records partial credit on a 0/1/2 criterion", async () => {
  const token = await register("cvs.partial@example.com");
  const station = await OsceStation.findOne({ slug: "cvs-03-post-mi-secondary-prevention" });
  const created = await request(app).post("/api/osce/attempts").set("Authorization", token)
    .send({ stationId: String(station._id), mode: "single-player" });
  assert.equal(created.status, 201);
  const attemptId = created.body.data.attempt.id;
  assert.equal((await request(app).post(`/api/osce/attempts/${attemptId}/end`).set("Authorization", token).send({})).status, 200);
  const checklist = await SmartChecklist.findById(station.smartChecklistId);
  const firstId = checklist.sections[0].items[0].itemId;
  const marked = await request(app).post(`/api/osce/attempts/${attemptId}/self-assessment`).set("Authorization", token)
    .send({ checkedItemIds: [firstId], itemScores: [{ itemId: firstId, rawScore: 1 }] });
  assert.equal(marked.status, 200);
  const attempt = await OsceAttempt.findById(attemptId);
  assert.equal(attempt.finalScore.rawScore, 1);
  assert.equal(attempt.finalScore.maxRawScore, 20);
});

test("DVT teaching copy keeps the complete source but corrects the delayed-ultrasound pathway", () => {
  const original = source.stations[10];
  const bundle = buildCvsStationBundles()[10];
  assert.match(original.learningNotes[0], /interim parenteral anticoagulation/);
  assert.match(bundle.module.learningNotes, /D-dimer, give interim therapeutic anticoagulation/);
  assert.match(bundle.module.keyAnswerGuide, /ultrasound within 24 hours/);
  assert.match(bundle.checklist.sections[0].items[4].label, /rather than relying on D-dimer alone/);
});
