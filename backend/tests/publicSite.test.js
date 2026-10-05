import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { seedOsceContent } from "../src/seed/osce.seed.js";
import { User } from "../src/models/User.js";
import { invalidatePublicStats } from "../src/services/publicStats.service.js";

let mongod;
let app;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
  invalidatePublicStats();
});

test("public stats give counts and names only, and are cacheable", async () => {
  const res = await request(app).get("/api/public/stats");
  assert.equal(res.status, 200);
  assert.match(res.headers["cache-control"], /public, max-age=300/);
  const { mcq, ospe, osce, examGuides, historyGuides, handouts } = res.body.data;
  assert.ok(mcq.total > 0 && mcq.years.length > 0);
  assert.ok(ospe.total > 0);
  assert.equal(osce.total, 0);
  assert.ok(examGuides.titles.length === examGuides.total);
  assert.ok(historyGuides.total > 0 && handouts.systems.length > 0);
  // No question bodies, options, answers or explanations.
  const text = JSON.stringify(res.body.data);
  for (const key of ['"s":', '"o":', '"a":', '"e":', '"questions"', '"answer"']) assert.ok(!text.includes(key), `stats leak ${key}`);
});

test("publishing a station refreshes the cached OSCE count", async () => {
  const { module } = await seedOsceContent();
  await request(app).get("/api/public/stats");
  const reg = await request(app).post("/api/auth/register").send({ fullName: "Admin Person", email: "admin@example.com", password: "StrongPass123" });
  await User.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } });
  const auth = `Bearer ${reg.body.data.token}`;
  const before = (await request(app).get("/api/public/stats")).body.data.osce.total;
  const published = await request(app).patch(`/api/admin/osce/${module._id}/status`).set("Authorization", auth).send({ status: module.status === "published" ? "archived" : "published" });
  assert.equal(published.status, 200, published.body.message);
  const after = (await request(app).get("/api/public/stats")).body.data.osce.total;
  assert.notEqual(after, before);
});

test("public pricing shows the monthly plan, and admins can change it", async () => {
  const res = await request(app).get("/api/public/pricing");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.plan, { pricePkr: 1499, periodDays: 30, graceDays: 3 });
  assert.ok(Array.isArray(res.body.data.packages));

  const reg = await request(app).post("/api/auth/register").send({ fullName: "Admin Person", email: "admin@example.com", password: "StrongPass123" });
  await User.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } });
  const auth = `Bearer ${reg.body.data.token}`;
  const bad = await request(app).patch("/api/admin/settings/pricing").set("Authorization", auth).send({ subscription: { periodDays: 0 } });
  assert.equal(bad.status, 400);
  const ok = await request(app).patch("/api/admin/settings/pricing").set("Authorization", auth).send({ subscription: { pricePkr: 1999 } });
  assert.equal(ok.status, 200, ok.body.message);
  assert.equal((await request(app).get("/api/public/pricing")).body.data.plan.pricePkr, 1999);
});
