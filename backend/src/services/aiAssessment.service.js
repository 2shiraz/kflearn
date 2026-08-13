import { buildAssessmentPrompt } from "../prompts/assessment.prompt.js";
import { generateJson } from "./llm.service.js";
import { assessChecklistFromTranscript, calculateScore } from "./scoring.service.js";

function fallbackItemScores(checklist, attempt) {
  return assessChecklistFromTranscript(checklist, attempt).itemScores;
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
  let model = attempt.aiProvider;
  let provider = attempt.aiProvider;
  try {
    const completion = await generateJson({
      provider: attempt.aiProvider,
      maxTokens: 5000,
      messages: buildAssessmentPrompt({ module, checklist, transcript }),
    });
    model = completion.model;
    provider = completion.provider;
    parsed = parseAssessmentJson(completion.text || "{}");
  } catch (error) {
    if (error.status === 503) throw error;
    parsed = {
      items: fallbackItemScores(checklist, attempt),
      summary: "Assessment completed with deterministic fallback because AI assessment was unavailable.",
      strengths: [],
      improvements: [],
    };
  }

  const deterministicScores = fallbackItemScores(checklist, attempt);
  const itemScores = selectAssessmentScores(checklist, Array.isArray(parsed.items) ? parsed.items : [], deterministicScores);
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
    model,
    provider,
  };
}

function selectAssessmentScores(checklist, aiScores, deterministicScores) {
  const validItems = checklist.sections.flatMap((section) => section.items);
  const normalizedAiScores = normalizeAiScores(validItems, aiScores);
  const aiFinalScore = calculateScore(checklist, normalizedAiScores);
  if (aiFinalScore.rawScore > 0) return normalizedAiScores;
  return deterministicScores;
}

function normalizeAiScores(validItems, aiScores) {
  const aiById = new Map(aiScores.map((score) => [score.itemId, score]));
  return validItems.map((item) => {
    const aiScore = aiById.get(item.itemId);
    const maxRawScore = Number(item.maxRawScore || 1);
    const normalizedAiRaw = Number.isFinite(Number(aiScore?.rawScore)) ? Math.min(Math.max(Number(aiScore.rawScore), 0), maxRawScore) : 0;
    return {
      itemId: item.itemId,
      rawScore: normalizedAiRaw,
      evidence: aiScore?.evidence || "",
      rationale: aiScore?.rationale || "",
    };
  });
}
