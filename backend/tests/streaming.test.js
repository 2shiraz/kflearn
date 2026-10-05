import assert from "node:assert/strict";
import { test, before, after, beforeEach } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { CreditTransaction } from "../src/models/CreditTransaction.js";
import { OsceAttempt } from "../src/models/OsceAttempt.js";
import { User } from "../src/models/User.js";
import { seedOsceContent } from "../src/seed/osce.seed.js";
import { grantCredits } from "../src/services/credit.service.js";
import { generatePatientResponse } from "../src/services/virtualPatient.service.js";
import { createReplyExtractor } from "../src/utils/replyStream.js";
import { MAX_STUDENT_MESSAGES_PER_ATTEMPT } from "../src/config/credits.js";

// ---- Reading the reply out of JSON that's still arriving ----

function feed(chunks) {
  const push = createReplyExtractor();
  return chunks.map((chunk) => push(chunk));
}

test("the reply is read out of the JSON piece by piece, however it's split", () => {
  const json = JSON.stringify({ reply: "It started \"suddenly\", about 2 days ago.\nNo fever. Café ✓ 😀", usedFactIds: ["onset"] });
  for (const size of [1, 2, 3, 7, json.length]) {
    const chunks = [];
    for (let i = 0; i < json.length; i += size) chunks.push(json.slice(i, i + size));
    assert.equal(feed(chunks).join(""), "It started \"suddenly\", about 2 days ago.\nNo fever. Café ✓ 😀", `chunks of ${size}`);
  }
  // \u escapes, including a pair split across pieces.
  assert.equal(feed(['{"reply":"caf\\u00', 'e9 \\ud83d', '\\ude00"}']).join(""), "café 😀");
  // Whitespace around the key, and nothing from other fields.
  assert.equal(feed(['{ "reply" : "Hi', ' there", "usedFactIds": ["x"], "note": "hidden"}']).join(""), "Hi there");
  // Other fields first are skipped too.
  assert.equal(feed(['{"usedFactIds":[],', '"reply":"Yes"}']).join(""), "Yes");
});

// ---- Streaming from the AI patient ----

const patientScript = {
  patientIdentity: { name: "Maya Khan", age: 28 },
  openingStatement: "My chest gets tight sometimes.",
  facts: [{ factId: "trigger", conceptId: "triggers", label: "Triggers", value: "Classroom dust", naturalResponse: "Dust in my classroom sets it off.", revealPolicy: "IF_RELEVANT_QUESTION" }],
};
const module = { title: "Suspected Adult Asthma", presentingComplaint: "Chest tightness" };
const attempt = { aiProvider: "groq", messages: [] };
const fakeStream = (pieces, { failAfter } = {}) => async ({ onText }) => {
  let text = "";
  for (const [i, piece] of pieces.entries()) {
    if (failAfter === i) throw new Error("connection dropped");
    text += piece;
    onText(piece);
  }
  return { text, provider: "groq", model: "test-model" };
};

test("streamed words reach onText, and the checked answer is returned", async () => {
  const words = [];
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "What sets it off?",
    stream: fakeStream(['{"reply":"Dust in', ' my classroom', ' sets it off.","usedFactIds":["trigger","made-up"]}']),
    generate: async () => assert.fail("should not fall back to the unstreamed call"),
    onText: (text) => words.push(text),
  });
  assert.equal(words.join(""), "Dust in my classroom sets it off.");
  assert.ok(words.length >= 2);
  assert.equal(result.text, "Dust in my classroom sets it off.");
  assert.deepEqual(result.matchedFactIds, ["trigger"]);
});

test("a provider that won't stream is asked again the usual way", async () => {
  const words = [];
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "What sets it off?",
    stream: async () => { throw new Error("stream not supported with JSON mode"); },
    generate: async () => ({ text: JSON.stringify({ reply: "The dust does.", usedFactIds: ["trigger"] }), provider: "groq", model: "m" }),
    onText: (text) => words.push(text),
  });
  assert.equal(words.length, 0);
  assert.equal(result.text, "The dust does.");
});

test("a stream that breaks halfway ends with a scripted reply that replaces it", async () => {
  const words = [];
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "What is your name?",
    stream: fakeStream(['{"reply":"My na', 'me is'], { failAfter: 1 }),
    generate: async () => assert.fail("must not ask again once words were shown"),
    onText: (text) => words.push(text),
  });
  assert.equal(words.join(""), "My na");
  assert.match(result.text, /Maya Khan/);

  // Malformed JSON at the end: same.
  const malformed = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "What is your name?",
    stream: fakeStream(['{"reply":"Hello', ' doctor"']),
    onText: () => {},
  });
  assert.match(malformed.text, /Maya Khan/);
});

// ---- The streaming endpoint ----

let mongod;
let app;
let stationId;

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
  await CreditTransaction.syncIndexes();
  stationId = (await seedOsceContent()).module._id.toString();
});

async function student(email) {
  const res = await request(app).post("/api/auth/register").send({ fullName: "Stream Tester", email, password: "StrongPass123" });
  assert.equal(res.status, 201);
  await User.updateOne({ _id: res.body.data.user.id }, { $set: { creditBalance: 0 } });
  await grantCredits({ userId: res.body.data.user.id, amount: 50, note: "test" });
  return `Bearer ${res.body.data.token}`;
}

// Reads the whole event stream as text, then splits it into events.
const sse = (req) => req.buffer(true).parse((res, done) => {
  let text = "";
  res.setEncoding("utf8");
  res.on("data", (chunk) => { text += chunk; });
  res.on("end", () => done(null, text));
});
const events = (text) => text.trim().split("\n\n").map((block) => {
  const [eventLine, dataLine] = block.split("\n");
  return { event: eventLine.replace("event: ", ""), data: JSON.parse(dataLine.replace("data: ", "")) };
});

async function withoutAiProviders(fn) {
  const saved = [env.groqApiKey, env.openaiApiKey];
  env.groqApiKey = "";
  env.openaiApiKey = "";
  try {
    return await fn();
  } finally {
    [env.groqApiKey, env.openaiApiKey] = saved;
  }
}

test("the streaming endpoint answers as events and saves the exchange", async () => {
  const auth = await student("s@example.com");
  const id = (await request(app).post("/api/osce/attempts").set("Authorization", auth).send({ stationId, mode: "virtual-patient" })).body.data.attempt.id;

  const res = await withoutAiProviders(() => sse(request(app).post(`/api/osce/attempts/${id}/messages/stream`).set("Authorization", auth).send({ text: "Hello, can you confirm your name?" })));
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/event-stream/);
  assert.match(res.headers["cache-control"], /no-transform/);
  const list = events(res.body);
  const done = list.find((e) => e.event === "done");
  assert.ok(done, res.body);
  assert.ok(done.data.patientMessage.text);
  assert.equal(done.data.studentMessage.text, "Hello, can you confirm your name?");

  const saved = await OsceAttempt.findById(id).lean();
  assert.equal(saved.messages.length, 2);
  assert.equal(saved.messages[1].finalText, done.data.patientMessage.text);
  assert.equal(saved.usage.studentMessages, 1);
});

test("refusals before the AI is asked are ordinary JSON errors", async () => {
  const owner = await student("owner@example.com");
  const other = await student("other@example.com");
  const id = (await request(app).post("/api/osce/attempts").set("Authorization", owner).send({ stationId, mode: "virtual-patient" })).body.data.attempt.id;

  const notYours = await request(app).post(`/api/osce/attempts/${id}/messages/stream`).set("Authorization", other).send({ text: "Hello" });
  assert.equal(notYours.status, 404);
  assert.match(notYours.headers["content-type"], /json/);

  await OsceAttempt.updateOne({ _id: id }, { $set: { "usage.studentMessages": MAX_STUDENT_MESSAGES_PER_ATTEMPT } });
  const limit = await request(app).post(`/api/osce/attempts/${id}/messages/stream`).set("Authorization", owner).send({ text: "Hello" });
  assert.equal(limit.status, 429);
  assert.equal(limit.body.code, "STATION_LIMIT_REACHED");

  assert.equal((await request(app).post(`/api/osce/attempts/${id}/messages/stream`).set("Authorization", owner).send({})).status, 400);
});
