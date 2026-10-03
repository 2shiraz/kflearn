// Settings the admin manages from the app: which sections students can see,
// whether signups and the AI patient are open, and AI credit pricing. Stored
// in AppSetting; the constants in config/credits.js are the defaults.
import { AppSetting } from "../models/AppSetting.js";
import { CREDIT_COSTS, CREDIT_PACKAGES, MAX_CREDIT_OPERATION, STARTING_CREDITS } from "../config/credits.js";

export const SECTION_KEYS = ["stations", "mcqs", "ospe", "history", "clinical-exam", "handouts", "progress"];

const SITE_KEY = "site";
const PRICING_KEY = "pricing";

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

// ---- Site access ----
export async function getSiteSettings() {
  const stored = (await AppSetting.findOne({ key: SITE_KEY }).lean())?.value || {};
  const sections = Object.fromEntries(SECTION_KEYS.map((key) => [key, stored.sections?.[key] !== false]));
  return {
    sections,
    signupsOpen: stored.signupsOpen !== false,
    aiPatient: stored.aiPatient !== false,
  };
}

export async function updateSiteSettings(payload = {}) {
  const current = await getSiteSettings();
  const next = { ...current, sections: { ...current.sections } };
  if (payload.sections !== undefined) {
    if (typeof payload.sections !== "object" || payload.sections === null) throw badRequest("Invalid sections.");
    for (const [key, value] of Object.entries(payload.sections)) {
      if (!SECTION_KEYS.includes(key) || typeof value !== "boolean") throw badRequest("Invalid sections.");
      next.sections[key] = value;
    }
  }
  for (const flag of ["signupsOpen", "aiPatient"]) {
    if (payload[flag] === undefined) continue;
    if (typeof payload[flag] !== "boolean") throw badRequest(`Invalid ${flag}.`);
    next[flag] = payload[flag];
  }
  await AppSetting.findOneAndUpdate({ key: SITE_KEY }, { $set: { value: next } }, { upsert: true });
  return next;
}

export function sectionClosed(message = "This section isn't available right now.") {
  const error = new Error(message);
  error.status = 403;
  error.code = "SECTION_CLOSED";
  return error;
}

// ---- Pricing ----
const DEFAULT_PRICING = {
  welcomeCredits: STARTING_CREDITS,
  costs: { ...CREDIT_COSTS },
  packages: CREDIT_PACKAGES.map((pkg) => ({ ...pkg })),
};

export async function getPricing() {
  const stored = (await AppSetting.findOne({ key: PRICING_KEY }).lean())?.value;
  if (!stored) return structuredClone(DEFAULT_PRICING);
  return {
    welcomeCredits: Number.isSafeInteger(stored.welcomeCredits) ? stored.welcomeCredits : DEFAULT_PRICING.welcomeCredits,
    costs: { ...DEFAULT_PRICING.costs, ...stored.costs },
    packages: Array.isArray(stored.packages) ? stored.packages : DEFAULT_PRICING.packages,
  };
}

const wholeNumber = (value, { min = 0, max = MAX_CREDIT_OPERATION } = {}) =>
  Number.isSafeInteger(value) && value >= min && value <= max;

export async function updatePricing(payload = {}) {
  const current = await getPricing();
  const next = structuredClone(current);

  if (payload.welcomeCredits !== undefined) {
    if (!wholeNumber(payload.welcomeCredits, { max: 10_000 })) throw badRequest("Welcome credits must be a whole number from 0 to 10,000.");
    next.welcomeCredits = payload.welcomeCredits;
  }
  if (payload.costs !== undefined) {
    for (const key of ["virtualPatient", "aiAssessment"]) {
      const value = payload.costs?.[key];
      if (value === undefined) continue;
      if (!wholeNumber(value, { min: 1, max: 1000 })) throw badRequest("Each AI action must cost between 1 and 1,000 credits.");
      next.costs[key] = value;
    }
  }
  if (payload.packages !== undefined) {
    if (!Array.isArray(payload.packages) || payload.packages.length > 8) throw badRequest("Up to 8 credit packages are allowed.");
    const seen = new Set();
    next.packages = payload.packages.map((pkg, index) => {
      const name = typeof pkg?.name === "string" ? pkg.name.trim() : "";
      if (!name || name.length > 40) throw badRequest("Each package needs a name of up to 40 characters.");
      if (!wholeNumber(pkg.credits, { min: 1 })) throw badRequest(`"${name}" needs a whole number of credits.`);
      if (!wholeNumber(pkg.pricePkr, { min: 0, max: 10_000_000 })) throw badRequest(`"${name}" needs a whole-rupee price.`);
      let id = typeof pkg.id === "string" && /^[a-z0-9-]{1,40}$/.test(pkg.id) ? pkg.id : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `package-${index + 1}`;
      while (seen.has(id)) id = `${id}-${index + 1}`;
      seen.add(id);
      return { id, name, credits: pkg.credits, pricePkr: pkg.pricePkr };
    });
  }
  await AppSetting.findOneAndUpdate({ key: PRICING_KEY }, { $set: { value: next } }, { upsert: true });
  return next;
}
