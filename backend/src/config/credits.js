// The single source of truth for credit pricing. The frontend reads these from
// GET /api/credits and never hardcodes them, so a price change is a one-line
// edit here. All enforcement happens server-side against these values.

export const CREDIT_VALUE_PKR = 5;
// Temporary signup allowance. Applies only when an account is registered.
export const STARTING_CREDITS = 30;

export const CREDIT_COSTS = Object.freeze({
  virtualPatient: 3,
  aiAssessment: 2,
});

export const CREDIT_PACKAGES = Object.freeze([
  Object.freeze({ id: "starter", name: "Starter", credits: 220, pricePkr: 999 }),
  Object.freeze({ id: "standard", name: "Standard", credits: 480, pricePkr: 1999 }),
  Object.freeze({ id: "pro", name: "Pro", credits: 730, pricePkr: 2999 }),
]);

// One paid virtual-patient session is priced for ~20-25 questions. These caps
// stop a single 3-credit payment from being reused for unbounded AI calls.
export const MAX_STUDENT_MESSAGES_PER_ATTEMPT = 40;
export const MAX_TRANSCRIPTIONS_PER_ATTEMPT = 60;

// Upper bound for any single grant/spend, so a typo in a script can't mint an
// absurd balance.
export const MAX_CREDIT_OPERATION = 100_000;
