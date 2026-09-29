import assert from "node:assert/strict";
import { test } from "node:test";
import { assessAttemptWithAi } from "../src/services/aiAssessment.service.js";

const module = { title: "Asthma", presentingComplaint: "Wheeze" };
const checklist = {
  sections: [{ sectionId: "hpc", title: "Symptoms", items: [
    { itemId: "duration", label: "Duration", maxRawScore: 1, weightCategory: "major" },
    { itemId: "trigger", label: "Triggers", maxRawScore: 1, weightCategory: "major" },
  ] }],
};
const attempt = { aiProvider: "groq", messages: [{ role: "student", finalText: "How long?" }] };
const completion = (items) => ({
  text: JSON.stringify({ items, summary: "Reviewed transcript.", strengths: [], improvements: [] }),
  model: "test-model", provider: "groq",
});

test("a complete real-model response is scored, including an all-zero result", async () => {
  const result = await assessAttemptWithAi({ module, checklist, attempt, generate: async () => completion([
    { itemId: "duration", rawScore: 0, evidence: "", rationale: "Not asked clearly." },
    { itemId: "trigger", rawScore: 0, evidence: "", rationale: "Not asked." },
  ]) });
  assert.equal(result.model, "test-model");
  assert.equal(result.provider, "groq");
  assert.equal(result.finalScore.percentage, 0);
  assert.deepEqual(result.feedback.missedItems, ["Duration", "Triggers"]);
});

test("a partial or malformed model response fails instead of silently falling back", async () => {
  await assert.rejects(() => assessAttemptWithAi({ module, checklist, attempt, generate: async () => completion([
    { itemId: "duration", rawScore: 1, rationale: "Asked about timing." },
  ]) }), (error) => error.status === 503 && /AI marking failed/.test(error.message));
});

test("provider errors fail instead of returning a model name equal to the provider", async () => {
  await assert.rejects(() => assessAttemptWithAi({ module, checklist, attempt, generate: async () => {
    const error = new Error("upstream failure with sensitive details");
    error.status = 429;
    throw error;
  } }), (error) => error.status === 503 && !/sensitive/.test(error.message));
});

test("a malformed first response is retried once and a valid AI result is kept", async () => {
  let calls = 0;
  const result = await assessAttemptWithAi({ module, checklist, attempt, generate: async () => {
    calls += 1;
    return calls === 1
      ? { text: "{", model: "test-model", provider: "groq" }
      : completion([
        { itemId: "duration", rawScore: 1, evidence: "How long?", rationale: "Asked about duration." },
        { itemId: "trigger", rawScore: 0, evidence: "", rationale: "Not asked." },
      ]);
  } });
  assert.equal(calls, 2);
  assert.equal(result.model, "test-model");
  assert.equal(result.finalScore.percentage, 50);
});

test("authentication errors are not retried", async () => {
  let calls = 0;
  await assert.rejects(() => assessAttemptWithAi({ module, checklist, attempt, generate: async () => {
    calls += 1;
    const error = new Error("invalid API key");
    error.status = 401;
    throw error;
  } }), (error) => error.status === 503);
  assert.equal(calls, 1);
});
