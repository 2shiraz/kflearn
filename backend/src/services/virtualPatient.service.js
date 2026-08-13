import { UnansweredQuestion } from "../models/UnansweredQuestion.js";
import { buildVirtualPatientMessages } from "../prompts/virtualPatient.prompt.js";
import { selectRelevantFacts } from "./historyIntent.service.js";
import { generateText } from "./llm.service.js";
import { keywordMatches, normalizeText } from "../utils/text.js";

export async function generatePatientResponse({ patientScript, module, attempt, studentQuestion }) {
  const conversationalResponse = buildConversationalResponse(patientScript, studentQuestion);
  if (conversationalResponse) {
    return {
      text: conversationalResponse,
      matchedFactIds: [],
      matchedConceptIds: [],
    };
  }

  const { concepts, facts } = selectRelevantFacts(studentQuestion, patientScript);

  if (facts.length === 0) {
    await UnansweredQuestion.findOneAndUpdate(
      { patientScriptId: patientScript._id, normalizedQuestion: normalizeText(studentQuestion) },
      {
        $setOnInsert: {
          patientScriptId: patientScript._id,
          historyModuleId: module._id,
          question: studentQuestion,
          normalizedQuestion: normalizeText(studentQuestion),
        },
        $inc: { count: 1 },
        $set: { lastAskedAt: new Date() },
      },
      { upsert: true },
    );
    return {
      text: "I'm not really sure about that. I haven't noticed anything specific.",
      matchedFactIds: [],
      matchedConceptIds: concepts,
    };
  }

  try {
    const completion = await generateText({
      provider: attempt.aiProvider,
      maxTokens: 160,
      messages: buildVirtualPatientMessages({
        patientScript,
        relevantFacts: facts,
        recentMessages: attempt.messages.slice(-8),
        studentQuestion,
      }),
    });
    return {
      text: completion.text || facts[0].naturalResponse,
      matchedFactIds: facts.map((fact) => fact.factId),
      matchedConceptIds: concepts,
      aiProvider: completion.provider,
      aiModel: completion.model,
    };
  } catch (error) {
    return {
      text: facts.map((fact) => fact.naturalResponse).join(" "),
      matchedFactIds: facts.map((fact) => fact.factId),
      matchedConceptIds: concepts,
      aiProvider: attempt.aiProvider,
    };
  }
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
