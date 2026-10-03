import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// The test suite exercises login/register/attempt-creation dozens of times a
// second against one in-process app instance — real limiting there would just
// produce flaky 429s, not a meaningful security check, so it's skipped in "test".
const skipInTests = () => env.nodeEnv === "test";

// SEC-04: throttle brute-force credential guessing on auth endpoints.
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: "Too many attempts. Please try again in a minute.", code: "RATE_LIMITED" },
});

// A looser, general-purpose ceiling for the rest of the API.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: "Too many requests. Please slow down.", code: "RATE_LIMITED" },
});

// Provider-backed actions are expensive. A per-account ceiling also limits
// abuse from several clients sharing one public IP.
// Admin changes: generous for real work, tight enough to stop a stolen
// session from bulk-editing the site.
export const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipInTests() || ["GET", "HEAD", "OPTIONS"].includes(req.method),
  message: { success: false, message: "Too many admin changes in a short time. Please wait a few minutes.", code: "RATE_LIMITED" },
});

export const aiActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: "AI request limit reached. Please try again later.", code: "RATE_LIMITED" },
});

// Starting a session spends credits and writes a DB row. Nothing here reaches a
// provider, but a per-account ceiling stops scripted session-creation spam
// (rapid self-drain and row flooding). Kept separate from the AI-action budget
// so starting a session never eats into a user's message/assessment allowance.
export const attemptCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: "Too many sessions started. Please try again later.", code: "RATE_LIMITED" },
});

// Password changes and account deletion re-check the password, so cap guesses
// per account as well as per IP (authLimiter).
export const accountSecurityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes.", code: "RATE_LIMITED" },
});
