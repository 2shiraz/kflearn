import { env } from "../config/env.js";
import { getGroqClient } from "../config/groq.js";
import { buildAssessmentPrompt } from "../prompts/assessment.prompt.js";
import { calculateScore } from "./scoring.service.js";

function fallbackItemScores(checklist, attempt) {
  const coveredFacts = new Set(attempt.internalCoverage?.factIds || []);
  const coveredConcepts = new Set(attempt.internalCoverage?.conceptIds || []);
  return checklist.sections.flatMap((section) =>
    section.items.map((item) => {
      const factHit = item.relatedFactIds.some((id) => coveredFacts.has(id));
      const conceptHit = item.expectedConcepts.some((id) => coveredConcepts.has(id));
      return {
        itemId: item.itemId,
        rawScore: factHit || conceptHit ? item.maxRawScore || 1 : 0,
        evidence: factHit || conceptHit ? "Matched against internally tracked patient facts/concepts." : "",
        rationale: factHit || conceptHit ? "Relevant concept was explored." : "No clear evidence in the transcript.",
      };
    }),
  );
}

function parseAssessmentJson(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("AI assessment did not return JSON.");
  return JSON.parse(text.slice(first, last + 1));
}

export async function assessAttemptWithAi({ module, checklist, attempt }) {
  const transcript = attempt.messages
    .filter((message) => message.role === "student")
    .map((message) => ({ text: message.finalText, inputType: message.inputType, at: message.createdAt }));

  let parsed;
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: env.groqEvalModel,
      temperature: 0.1,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: buildAssessmentPrompt({ module, checklist, transcript }),
    });
    parsed = parseAssessmentJson(completion.choices[0]?.message?.content || "{}");
  } catch (error) {
    if (error.status === 503) throw error;
    parsed = {
      items: fallbackItemScores(checklist, attempt),
      summary: "Assessment completed with deterministic fallback because AI assessment was unavailable.",
      strengths: [],
      improvements: [],
    };
  }

  const itemScores = Array.isArray(parsed.items) ? parsed.items : fallbackItemScores(checklist, attempt);
  return {
    itemScores,
    finalScore: calculateScore(checklist, itemScores),
    feedback: {
      summary: parsed.summary || "Assessment complete.",
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      missedItems: checklist.sections.flatMap((section) =>
        section.items
          .filter((item) => !itemScores.find((score) => score.itemId === item.itemId && Number(score.rawScore) > 0))
          .map((item) => item.label),
      ),
    },
    model: env.groqEvalModel,
  };
}
