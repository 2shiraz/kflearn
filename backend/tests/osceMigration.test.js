import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { migrateOsceNames } from "../src/migrations/osceNames.js";

let mongod;
let db;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDatabase(mongod.getUri());
  db = mongoose.connection.db;
});

after(async () => {
  await disconnectDatabase();
  await mongod?.stop();
});

test("OSCE migration preserves IDs and relationships and can be rerun", async () => {
  const stationId = new mongoose.Types.ObjectId();
  const frameworkId = new mongoose.Types.ObjectId();
  const attemptId = new mongoose.Types.ObjectId();
  await db.collection("historyguides").insertOne({ _id: frameworkId, slug: "guide" });
  await db.collection("historymodules").insertOne({ _id: stationId, slug: "station", historyGuideId: frameworkId });
  await db.collection("historyattempts").insertOne({ _id: attemptId, historyModuleId: stationId, moduleVersion: 2 });
  await db.collection("unansweredquestions").insertOne({ historyModuleId: stationId, patientScriptId: new mongoose.Types.ObjectId() });
  await db.collection("credittransactions").insertOne({ attemptId, amount: -3 });
  await db.collection("contentauditlogs").insertOne({ contentType: "HistoryModule", contentId: stationId });

  await assert.rejects(() => connectDatabase(mongod.getUri()), /Legacy OSCE collections found/);

  const plan = await migrateOsceNames(db);
  assert.ok(plan.some((action) => action.includes("historymodules -> oscestations")));
  assert.ok((await db.listCollections({ name: "historymodules" }).toArray()).length);

  await migrateOsceNames(db, { apply: true });
  assert.equal((await db.listCollections({ name: "historymodules" }).toArray()).length, 0);
  assert.deepEqual((await db.collection("oscestations").findOne({ _id: stationId })).osceFrameworkId, frameworkId);
  const attempt = await db.collection("osceattempts").findOne({ _id: attemptId });
  assert.deepEqual(attempt.stationId, stationId);
  assert.equal(attempt.stationVersion, 2);
  assert.deepEqual((await db.collection("unansweredquestions").findOne({})).stationId, stationId);
  assert.deepEqual((await db.collection("credittransactions").findOne({})).attemptId, attemptId);
  assert.equal((await db.collection("contentauditlogs").findOne({})).contentType, "OsceStation");
  assert.deepEqual(await migrateOsceNames(db, { apply: true }), []);
});

test("OSCE migration refuses a populated destination collection conflict", async () => {
  await db.collection("historymodules").insertOne({ slug: "old" });
  await assert.rejects(() => migrateOsceNames(db, { apply: true }), /Both historymodules and oscestations contain data/);
  await db.collection("oscestations").deleteMany({});
  await migrateOsceNames(db, { apply: true });
  assert.equal((await db.collection("oscestations").findOne({ slug: "old" })).slug, "old");
});
