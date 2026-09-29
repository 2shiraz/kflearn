import assert from "node:assert/strict";
import { test } from "node:test";
import { generatePatientResponse } from "../src/services/virtualPatient.service.js";

const patientScript = {
  patientIdentity: { name: "Maya Khan", age: 28, occupation: "teacher" },
  openingStatement: "My chest gets tight sometimes.",
  baselineState: { generalAppearance: "comfortable at rest" },
  demeanor: { general: "mildly anxious" },
  facts: [
    { factId: "trigger", conceptId: "triggers", label: "Triggers", value: "Classroom dust", naturalResponse: "Dust in my classroom sets it off.", revealPolicy: "IF_RELEVANT_QUESTION" },
    { factId: "family", conceptId: "family_history", label: "Family", value: "Mother has asthma", naturalResponse: "My mother has asthma.", revealPolicy: "IF_RELEVANT_QUESTION" },
  ],
};
const module = { title: "Suspected Adult Asthma", presentingComplaint: "Chest tightness" };
const attempt = { aiProvider: "groq", messages: [
  { role: "student", finalText: "Tell me about the chest tightness." },
  { role: "patient", finalText: "My chest gets tight sometimes." },
] };

test("AI sees all authored patient facts and the recent conversation even for an indirect question", async () => {
  let sent;
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "Does anything in the classroom make it play up?",
    generate: async (request) => {
      sent = request;
      return { text: JSON.stringify({ reply: "Yes, the dust in my classroom sets it off.", usedFactIds: ["trigger"] }), provider: "groq", model: "test-model" };
    },
  });
  assert.match(sent.messages[0].content, /Dust in my classroom/);
  assert.match(sent.messages[0].content, /Mother has asthma/);
  assert.deepEqual(sent.messages.slice(-3).map((message) => message.content), [
    "Tell me about the chest tightness.", "My chest gets tight sometimes.", "Does anything in the classroom make it play up?",
  ]);
  assert.equal(result.text, "Yes, the dust in my classroom sets it off.");
  assert.deepEqual(result.matchedFactIds, ["trigger"]);
  assert.deepEqual(result.matchedConceptIds, ["triggers"]);
});

test("AI can answer follow-ups without keyword matching the current question", async () => {
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "And what about when you're at home?",
    generate: async () => ({ text: JSON.stringify({ reply: "I have not noticed that at home.", usedFactIds: [] }), provider: "groq", model: "test-model" }),
  });
  assert.equal(result.text, "I have not noticed that at home.");
  assert.deepEqual(result.matchedFactIds, []);
});

test("only authored fact IDs may enter internal coverage", async () => {
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "Any family conditions?",
    generate: async () => ({ text: JSON.stringify({ reply: "My mother has asthma.", usedFactIds: ["family", "fake", "family"] }), provider: "groq", model: "test-model" }),
  });
  assert.deepEqual(result.matchedFactIds, ["family"]);
  assert.deepEqual(result.matchedConceptIds, ["family_history"]);
});

test("malformed AI replies fall back to authored patient answers", async () => {
  const result = await generatePatientResponse({
    patientScript, module, attempt, studentQuestion: "What triggers it?",
    generate: async () => ({ text: "not json", provider: "groq", model: "test-model" }),
  });
  assert.match(result.text, /Dust in my classroom/);
});
