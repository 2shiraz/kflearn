import { AI_PROVIDERS, assertStudentMessageWithinConfiguredLimit } from "../services/llm.service.js";

export function requireBodyFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === "");
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
  assertStudentMessageWithinConfiguredLimit(req.body.text || "")
    .then(() => next())
    .catch((error) => next(error));
}
