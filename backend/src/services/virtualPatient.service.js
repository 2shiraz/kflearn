import { UnansweredQuestion } from "../models/UnansweredQuestion.js";
import { buildVirtualPatientMessages } from "../prompts/virtualPatient.prompt.js";
import { selectRelevantFacts } from "./osceIntent.service.js";
import { generateJson } from "./llm.service.js";
import { keywordMatches, normalizeText } from "../utils/text.js";

function parsePatientReply(text, patientScript) {
  const parsed = JSON.parse(text);
  if (typeof parsed.reply !== "string" || !parsed.reply.trim()) throw new Error("AI patient reply was empty.");
  if (!Array.isArray(parsed.usedFactIds)) throw new Error("AI patient fact references were missing.");
  const validIds = new Set((patientScript.facts || []).map((fact) => fact.factId));
  const matchedFactIds = [...new Set(parsed.usedFactIds.filter((id) => typeof id === "string" && validIds.has(id)))];
  const matchedConceptIds = [...new Set(matchedFactIds.map((id) => patientScript.facts.find((fact) => fact.factId === id)?.conceptId).filter(Boolean))];
  return { text: parsed.reply.trim(), matchedFactIds, matchedConceptIds };
}

export async function generatePatientResponse({ patientScript, module, attempt, studentQuestion, generate = generateJson }) {
  try {
    const completion = await generate({
      provider: attempt.aiProvider,
      modelType: "chat",
      maxTokens: 450,
      messages: buildVirtualPatientMessages({
        patientScript,
        module,
        recentMessages: attempt.messages.slice(-12),
        studentQuestion,
      }),
    });
    return {
      ...parsePatientReply(completion.text, patientScript),
      aiProvider: completion.provider,
      aiModel: completion.model,
    };
  } catch (error) {
    // Keep a paid session usable if the provider fails or returns malformed JSON.
    return fallbackPatientResponse({ patientScript, module, studentQuestion });
  }
}

async function fallbackPatientResponse({ patientScript, module, studentQuestion }) {
  const conversationalResponse = buildConversationalResponse(patientScript, studentQuestion);
  if (conversationalResponse) return { text: conversationalResponse, matchedFactIds: [], matchedConceptIds: [] };

  const { concepts, facts } = selectRelevantFacts(studentQuestion, patientScript);
  if (facts.length) {
    return {
      text: facts.map((fact) => fact.naturalResponse).join(" "),
      matchedFactIds: facts.map((fact) => fact.factId),
      matchedConceptIds: concepts,
    };
  }

  await UnansweredQuestion.findOneAndUpdate(
    { patientScriptId: patientScript._id, normalizedQuestion: normalizeText(studentQuestion) },
    {
      $setOnInsert: {
        patientScriptId: patientScript._id,
        stationId: module._id,
        question: studentQuestion,
        normalizedQuestion: normalizeText(studentQuestion),
      },
      $inc: { count: 1 },
      $set: { lastAskedAt: new Date() },
    },
    { upsert: true },
  );
  return { text: "I'm not really sure about that. I haven't noticed anything specific.", matchedFactIds: [], matchedConceptIds: concepts };
}

function buildConversationalResponse(patientScript, studentQuestion) {
  const question = normalizeText(studentQuestion);
  const identity = patientScript.patientIdentity || {};

  if (matchesAny(question, ["is that okay", "is that ok", "can i ask", "would like to ask", "take a history", "ask you some questions", "consent"])) {
    return "Yes, that's okay.";
  }

  if (matchesAny(question, ["my name is", "i am one of the doctors", "im one of the doctors", "i m one of the doctors", "hello", "hi"])) {
    if (!matchesAny(question, ["name", "date of birth", "dob", "confirm"])) return "Hello.";
  }

  if (matchesAny(question, ["confirm your name", "your name", "date of birth", "dob", "confirm your details"])) {
    const details = [];
    if (identity.name) details.push(`My name is ${identity.name}.`);
    if (identity.age) details.push(`I am ${identity.age} years old.`);
    if (details.length > 0) return details.join(" ");
    return "I'm sorry, I don't think my name or date of birth has been provided.";
  }

  return "";
}

function matchesAny(question, terms) {
  return terms.some((term) => keywordMatches(question, term));
}
