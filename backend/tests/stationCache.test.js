import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { OsceStation } from "../src/models/OsceStation.js";
import { User } from "../src/models/User.js";
import { seedOsceContent } from "../src/seed/osce.seed.js";
import { setStationCacheTtl } from "../src/services/stationCache.service.js";

let mongod;
let app;
let station;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

after(async () => {
  setStationCacheTtl(0);
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  station = (await seedOsceContent()).module;
  setStationCacheTtl(60 * 1000);
});

async function account(email, role = "student") {
  const res = await request(app).post("/api/auth/register").send({ fullName: "Test Person", email, password: "StrongPass123" });
  assert.equal(res.status, 201, res.body.message);
  await User.updateOne({ _id: res.body.data.user.id }, { $set: { role } });
  return `Bearer ${res.body.data.token}`;
}

const list = (auth) => request(app).get("/api/osce").set("Authorization", auth);

test("the station list carries no station content", async () => {
  const student = await account("s@example.com");
  const res = await list(student);
  assert.equal(res.status, 200);
  const row = res.body.data.modules.find((m) => m.slug === station.slug);
  assert.ok(row);
  for (const field of ["candidateInstructions", "learningNotes", "keyAnswerGuide", "examinerInstructions", "simulationScript", "patientScript", "checklist"]) {
    assert.equal(row[field], undefined, field);
  }
  assert.ok(row.title && row.specialty?.name && row.practiceOptions.length);
});

test("repeat reads are served from memory, and admin changes show at once", async () => {
  const student = await account("s@example.com");
  const admin = await account("admin@example.com", "admin");
  const before = (await list(student)).body.data.total;
  await request(app).get(`/api/osce/${station.slug}`).set("Authorization", student);

  // A change made behind the server's back (a script) isn't seen until the
  // cache expires: proof that the list isn't read from the database each time.
  await OsceStation.updateOne({ _id: station._id }, { $set: { title: "Changed directly" } });
  assert.notEqual((await list(student)).body.data.modules.find((m) => m.slug === station.slug).title, "Changed directly");
  assert.notEqual((await request(app).get(`/api/osce/${station.slug}`).set("Authorization", student)).body.data.title, "Changed directly");

  // A change through the admin area clears it straight away.
  const res = await request(app).patch(`/api/admin/osce/${station._id}/status`).set("Authorization", admin).send({ status: "archived" });
  assert.equal(res.status, 200, res.body.message);
  const after = (await list(student)).body.data;
  assert.equal(after.total, before - 1);
  assert.equal(after.modules.some((m) => m.slug === station.slug), false);
  assert.equal((await request(app).get(`/api/osce/${station.slug}`).set("Authorization", student)).status, 404);
});
