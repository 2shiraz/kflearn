import { env } from "../config/env.js";
import { getGroqClient } from "../config/groq.js";
import { UnansweredQuestion } from "../models/UnansweredQuestion.js";
import { buildVirtualPatientMessages } from "../prompts/virtualPatient.prompt.js";
import { selectRelevantFacts } from "./historyIntent.service.js";
import { normalizeText } from "../utils/text.js";

export async function generatePatientResponse({ patientScript, module, attempt, studentQuestion }) {
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
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: env.groqChatModel,
      temperature: 0.4,
      max_tokens: 160,
      messages: buildVirtualPatientMessages({
        patientScript,
        relevantFacts: facts,
        recentMessages: attempt.messages.slice(-8),
        studentQuestion,
      }),
    });
    return {
      text: completion.choices[0]?.message?.content?.trim() || facts[0].naturalResponse,
      matchedFactIds: facts.map((fact) => fact.factId),
      matchedConceptIds: concepts,
    };
  } catch (error) {
    return {
      text: facts.map((fact) => fact.naturalResponse).join(" "),
      matchedFactIds: facts.map((fact) => fact.factId),
      matchedConceptIds: concepts,
    };
  }
}
