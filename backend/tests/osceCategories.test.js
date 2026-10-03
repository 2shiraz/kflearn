import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { OSCE_CATEGORIES, stationCategory } from "../src/utils/osceCategories.js";
import { stationListDto, studentStationDetailDto } from "../src/services/osce.service.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { categorizeOsceStations } from "../src/services/osceCategories.service.js";
import { OSCE_CATEGORIES as uiCategories, filterStations, hasVirtualPatient } from "../../frontend/src/lib/osceFilters.js";

let db;
before(async () => {
  db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
});
after(async () => { await mongoose.disconnect(); await db?.stop(); });

test("six categories are consistent across frontend and backend", () => {
  assert.equal(OSCE_CATEGORIES.length, 6);
  assert.deepEqual(OSCE_CATEGORIES, uiCategories);
});
test("categories preserve existing types and explicit overrides; procedures are separate", () => {
  for (const { value } of OSCE_CATEGORIES) assert.equal(stationCategory({ stationType: value }), value);
  assert.equal(stationCategory({ stationType: "examination", stationFormat: "Static procedural station" }), "procedure");
  assert.equal(stationCategory({ category: "counselling", stationFormat: "Procedural" }), "counselling");
});
test("list/detail expose the same actual AI availability without changing legacy modes", () => {
  for (const [practiceModes, expected] of [[["single-player"], false], [["single-player", "virtual-patient"], true], [[], true]]) {
    const station = { stationType: "history", practiceModes };
    const list = stationListDto(station);
    const detail = studentStationDetailDto(station);
    assert.equal(list.aiVirtualPatientAvailable, expected);
    assert.equal(hasVirtualPatient(list), expected);
    assert.deepEqual(list.practiceOptions, detail.practiceOptions);
    assert.equal(list.categoryLabel, "History & Clinical Assessment");
  }
});
test("search and combined category/specialty/mode/difficulty filters work without mutating input", () => {
  const stations = [
    { title: "Chest pain", category: "history", specialty: { name: "CVS" }, difficulty: "beginner", practiceOptions: ["single-player", "virtual-patient"], timeLimitSeconds: 600 },
    { title: "Chest examination", category: "examination", specialty: { name: "CVS" }, difficulty: "advanced", practiceOptions: ["single-player"], timeLimitSeconds: 480 },
    { title: "Abdominal pain", category: "history", specialty: { name: "GIT" }, difficulty: "beginner", practiceOptions: ["single-player", "virtual-patient"], timeLimitSeconds: 360 },
  ];
  assert.deepEqual(filterStations(stations, { q: "cvs CHEST", category: "history", specialty: "CVS", mode: "ai", difficulty: "beginner" }).map(s => s.title), ["Chest pain"]);
  assert.deepEqual(filterStations(stations, { mode: "guided" }).map(s => s.title), ["Chest examination"]);
  assert.equal(filterStations(stations, { q: "notfound" }).length, 0);
  assert.equal(filterStations(stations, { sort: "duration" })[0].title, "Abdominal pain");
  assert.equal(stations[0].title, "Chest pain");
});
test("category backfill is idempotent, preserves authored data and does not change modes", async () => {
  const base = { specialtyId: new mongoose.Types.ObjectId(), presentingComplaint: "Test", shortDescription: "Test", status: "published" };
  await OsceStation.create([
    { ...base, title: "LP", slug: "lp", stationType: "examination", stationFormat: "Static procedural station", practiceModes: ["single-player"] },
    { ...base, title: "Conversation", slug: "conversation", category: "counselling", practiceModes: ["single-player", "virtual-patient"] },
  ]);
  const before = await OsceStation.find().sort({ slug: 1 }).lean();
  assert.equal((await categorizeOsceStations()).updated, 1);
  assert.equal((await categorizeOsceStations()).updated, 0);
  const after = await OsceStation.find().sort({ slug: 1 }).lean();
  for (let i = 0; i < before.length; i++) {
    const { category: oldCategory, ...oldData } = before[i];
    const { category: newCategory, ...newData } = after[i];
    assert.deepEqual(newData, oldData);
    if (oldCategory) assert.equal(newCategory, oldCategory);
  }
  assert.equal(after.find(s => s.slug === "lp").category, "procedure");
});
