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
