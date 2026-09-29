import { buildAssessmentPrompt } from "../prompts/assessment.prompt.js";
import { generateJson } from "./llm.service.js";
import { calculateScore } from "./scoring.service.js";

function parseAssessmentJson(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("AI assessment did not return JSON.");
  return JSON.parse(text.slice(first, last + 1));
}

function retryableAssessmentError(error, phase) {
  if (phase !== "provider-request") return true;
  const status = Number(error.status || error.statusCode);
  return status === 408 || status === 429 || status >= 500 ||
    ["APIConnectionError", "APITimeoutError", "AbortError", "TimeoutError"].includes(error.name);
}

export async function assessAttemptWithAi({ module, checklist, attempt, generate = generateJson }) {
  const transcript = attempt.messages
    .filter((message) => message.role === "student")
    .map((message) => ({ text: message.finalText, inputType: message.inputType, at: message.createdAt }));

  let parsed;
  let completion;
  let phase = "provider-request";
  const messages = buildAssessmentPrompt({ module, checklist, transcript });
  for (let tryNumber = 1; tryNumber <= 2; tryNumber += 1) {
    phase = "provider-request";
    completion = undefined;
    try {
      completion = await generate({ provider: attempt.aiProvider, maxTokens: 5000, messages });
      if (!completion || typeof completion.model !== "string" || !completion.model ||
        typeof completion.provider !== "string" || !completion.provider) {
        throw new Error("AI assessment did not identify its model and provider.");
      }
      phase = "response-json";
      parsed = parseAssessmentJson(completion.text || "{}");
      phase = "checklist-validation";
      validateAssessment(checklist, parsed);
      break;
    } catch (error) {
      if (tryNumber === 1 && retryableAssessmentError(error, phase)) continue;
      if (error.status === 503 && error.message === "No AI provider is configured.") throw error;
      // Never log transcripts, provider response bodies, or API keys. The
      // controller refunds the charge and returns the attempt to "ended".
      console.error("AI assessment failed", {
        provider: completion?.provider || attempt.aiProvider,
        model: completion?.model || undefined,
        status: Number(error.status || error.statusCode) || undefined,
        type: error.name,
        phase,
        attempts: tryNumber,
      });
      const unavailable = new Error("AI marking failed. Please retry; no assessment was saved.");
      unavailable.status = 503;
      unavailable.publicMessage = unavailable.message;
      throw unavailable;
    }
  }

  const itemScores = normalizeAiScores(checklist.sections.flatMap((section) => section.items), parsed.items);
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
    model: completion.model,
    provider: completion.provider,
  };
}

function validateAssessment(checklist, parsed) {
  const validItems = checklist.sections.flatMap((section) => section.items);
  const ids = new Set(validItems.map((item) => item.itemId));
  if (!Array.isArray(parsed.items) || parsed.items.length !== ids.size ||
    parsed.items.some((score) => !ids.has(score?.itemId) || !Number.isFinite(Number(score.rawScore))) ||
    new Set(parsed.items.map((score) => score.itemId)).size !== ids.size) {
    throw new Error("AI assessment omitted or malformed checklist scores.");
  }
  if (!parsed.items.some((score) => typeof score.rationale === "string" && score.rationale.trim())) {
    throw new Error("AI assessment did not provide examiner rationale.");
  }
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
