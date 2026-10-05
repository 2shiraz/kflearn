import mongoose from "mongoose";
import { OsceAttempt } from "../models/OsceAttempt.js";
import { getAccess } from "../services/access.service.js";

const FINISH_WINDOW_MS = 24 * 60 * 60 * 1000;

function subscriptionRequired(res) {
  return res.status(402).json({
    success: false,
    message: "This needs an active monthly access pass.",
    code: "SUBSCRIPTION_REQUIRED",
  });
}

// Blocks study material for accounts without an active pass (or its grace
// days), once an admin has switched the paywall on. Checked against the
// database on every request; the token and the browser are never trusted.
export async function requireAccess(req, res, next) {
  try {
    const access = await getAccess({ id: req.user.id, role: req.user.role });
    req.access = access;
    if (access.hasAccess) return next();
    return subscriptionRequired(res);
  } catch (error) {
    return next(error);
  }
}

// For /api/osce/attempts: a station started while the account had access
// can still be finished and marked after the pass runs out (within a day of
// starting). Starting a new one, listing attempts and past results still need
// access.
const FINISHING = /^\/([0-9a-f]{24})(?:\/(messages(?:\/stream)?|end|self-assessment|ai-assessment|transcribe|discard))?\/?$/i;

export async function requireAccessOrUnfinishedAttempt(req, res, next) {
  try {
    const access = await getAccess({ id: req.user.id, role: req.user.role });
    req.access = access;
    if (access.hasAccess) return next();
    const match = FINISHING.exec(req.path);
    if (match && mongoose.isObjectIdOrHexString(match[1])) {
      const attempt = await OsceAttempt.findOne({ _id: match[1], userId: req.user.id }).select("status startedAt createdAt").lean();
      const started = attempt && new Date(attempt.startedAt || attempt.createdAt).getTime();
      if (attempt && ["started", "active", "ended", "assessing"].includes(attempt.status) && Date.now() - started < FINISH_WINDOW_MS) return next();
    }
    return subscriptionRequired(res);
  } catch (error) {
    return next(error);
  }
}
