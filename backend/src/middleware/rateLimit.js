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
