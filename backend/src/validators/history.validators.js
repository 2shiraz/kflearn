import { AI_PROVIDERS, assertStudentMessageWithinConfiguredLimit } from "../services/llm.service.js";

function reject(next, message) {
  const error = new Error(message);
  error.status = 400;
  next(error);
}

export function requireBodyFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((field) => req.body?.[field] === undefined || req.body[field] === "");
    if (missing.length) {
      const error = new Error(`Missing required fields: ${missing.join(", ")}`);
      error.status = 400;
      next(error);
      return;
    }
    next();
  };
}

export function validateAttemptMode(req, res, next) {
  if (!["single-player", "virtual-patient"].includes(req.body.mode)) {
    const error = new Error("mode must be single-player or virtual-patient.");
    error.status = 400;
    next(error);
    return;
  }
  next();
}

export function validateAiProvider(req, res, next) {
  if (req.body.aiProvider && !AI_PROVIDERS.includes(req.body.aiProvider)) {
    const error = new Error("aiProvider must be groq or openai.");
    error.status = 400;
    next(error);
    return;
  }
  next();
}

export function validateStudentMessageLength(req, res, next) {
  const { text, inputType = "typed", originalTranscript = "" } = req.body;
  if (typeof text !== "string" || !text.trim() ||
      !["typed", "voice"].includes(inputType) ||
      typeof originalTranscript !== "string" || originalTranscript.length > 640) {
    reject(next, "Invalid patient message.");
    return;
  }
  if (text.length > 640) {
    const error = new Error("Message is too long.");
    error.status = 413;
    next(error);
    return;
  }
  req.body.text = text.trim();
  assertStudentMessageWithinConfiguredLimit(req.body.text)
    .then(() => next())
    .catch((error) => next(error));
}

export function validateEndAttempt(req, res, next) {
  if (req.body?.notes !== undefined && (typeof req.body.notes !== "string" || req.body.notes.length > 5000)) {
    reject(next, "Notes must be text of at most 5000 characters.");
    return;
  }
  next();
}

export function validateSelfAssessment(req, res, next) {
  const ids = req.body?.checkedItemIds;
  if (!Array.isArray(ids) || ids.length > 200 || ids.some((id) => typeof id !== "string" || id.length > 128)) {
    reject(next, "checkedItemIds must be an array of item IDs.");
    return;
  }
  req.body.checkedItemIds = [...new Set(ids)];
  next();
}
