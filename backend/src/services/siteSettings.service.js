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

// ---- Branding ----
// The app name, browser title, search description, theme colour and logo.
// The logo is kept as image bytes in its own setting and served from
// /api/public/logo, so the branding object stays small.
const BRANDING_KEY = "branding";
const LOGO_KEY = "branding-logo";
export const ACCENTS = ["indigo", "blue", "teal", "emerald", "rose", "violet", "slate"];
const MAX_LOGO_BYTES = 200 * 1024;

const DEFAULT_BRANDING = {
  siteName: "KF LearnSmart",
  metaTitle: "KF LearnSmart",
  metaDescription: "OSCE practice with an AI patient, past paper MCQs and OSPE stations, history taking and clinical exam guides.",
  accent: "indigo",
  logoVersion: 0,
};

export async function getBranding() {
  const stored = (await AppSetting.findOne({ key: BRANDING_KEY }).lean())?.value || {};
  return {
    ...DEFAULT_BRANDING,
    ...Object.fromEntries(Object.entries(stored).filter(([key]) => key in DEFAULT_BRANDING)),
    accent: ACCENTS.includes(stored.accent) ? stored.accent : DEFAULT_BRANDING.accent,
  };
}

const LOGO_TYPES = {
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
};

// Only PNG, JPEG or WebP, checked by their actual bytes. SVG is refused
// because it can carry scripts.
function parseLogo(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
  if (!match) throw badRequest("The logo must be a PNG, JPEG or WebP image.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > MAX_LOGO_BYTES) throw badRequest("The logo must be under 200 KB.");
  if (!LOGO_TYPES[match[1]](bytes)) throw badRequest("That file isn't a valid image.");
  return { type: match[1], data: bytes.toString("base64") };
}

export async function updateBranding(payload = {}) {
  const current = await getBranding();
  const next = { ...current };
  const text = (key, max, required = false) => {
    if (payload[key] === undefined) return;
    if (typeof payload[key] !== "string" || payload[key].trim().length > max) throw badRequest(`${key} must be up to ${max} characters.`);
    if (required && !payload[key].trim()) throw badRequest(`${key} can't be empty.`);
    next[key] = payload[key].trim();
  };
  text("siteName", 40, true);
  text("metaTitle", 70, true);
  text("metaDescription", 160);
  if (payload.accent !== undefined) {
    if (!ACCENTS.includes(payload.accent)) throw badRequest("Pick one of the theme colours.");
    next.accent = payload.accent;
  }
  if (payload.logo !== undefined) {
    if (payload.logo === null) {
      await AppSetting.deleteOne({ key: LOGO_KEY });
      next.logoVersion = 0;
    } else {
      const logo = parseLogo(payload.logo);
      await AppSetting.findOneAndUpdate({ key: LOGO_KEY }, { $set: { value: logo } }, { upsert: true });
      next.logoVersion = Date.now();
    }
  }
  await AppSetting.findOneAndUpdate({ key: BRANDING_KEY }, { $set: { value: next } }, { upsert: true });
  return next;
}

export async function getLogo() {
  const stored = (await AppSetting.findOne({ key: LOGO_KEY }).lean())?.value;
  if (!stored?.data || !LOGO_TYPES[stored.type]) return null;
  return { type: stored.type, bytes: Buffer.from(stored.data, "base64") };
}
