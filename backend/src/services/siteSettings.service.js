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
// The monthly access pass that unlocks the site. Each paid period adds
// periodDays; access carries on for graceDays after it ends.
const DEFAULT_SUBSCRIPTION = { pricePkr: 1499, periodDays: 30, graceDays: 3 };

const DEFAULT_PRICING = {
  subscription: { ...DEFAULT_SUBSCRIPTION },
  welcomeCredits: STARTING_CREDITS,
  costs: { ...CREDIT_COSTS },
  packages: CREDIT_PACKAGES.map((pkg) => ({ ...pkg })),
};

export async function getPricing() {
  const stored = (await AppSetting.findOne({ key: PRICING_KEY }).lean())?.value;
  if (!stored) return structuredClone(DEFAULT_PRICING);
  return {
    subscription: { ...DEFAULT_SUBSCRIPTION, ...stored.subscription },
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

  if (payload.subscription !== undefined) {
    const sub = payload.subscription || {};
    const limits = { pricePkr: [0, 10_000_000, "The monthly price must be a whole number of rupees."], periodDays: [1, 366, "The access period must be 1 to 366 days."], graceDays: [0, 30, "The grace period must be 0 to 30 days."] };
    for (const [key, [min, max, message]] of Object.entries(limits)) {
      if (sub[key] === undefined) continue;
      if (!wholeNumber(sub[key], { min, max })) throw badRequest(message);
      next.subscription[key] = sub[key];
    }
  }
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
// The app name, browser title, search description, theme colour, logo and
// favicon. The images are kept as bytes in their own settings and served
// from /api/public/logo and /api/public/favicon, so the branding object
// stays small.
const BRANDING_KEY = "branding";
const LOGO_KEY = "branding-logo";
const FAVICON_KEY = "branding-favicon";
const MAX_FAVICON_BYTES = 100 * 1024;
export const ACCENTS = ["indigo", "blue", "teal", "emerald", "rose", "violet", "slate"];
const MAX_LOGO_BYTES = 200 * 1024;

const DEFAULT_BRANDING = {
  siteName: "KF LearnSmart",
  metaTitle: "KF LearnSmart",
  metaDescription: "OSCE practice with an AI patient, past paper MCQs and OSPE stations, history taking and clinical exam guides.",
  accent: "indigo",
  logoVersion: 0,
  faviconVersion: 0,
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
const FAVICON_TYPES = {
  ...LOGO_TYPES,
  "image/x-icon": (b) => b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0,
};

// Only PNG, JPEG or WebP, checked by their actual bytes. SVG is refused
// because it can carry scripts.
// The favicon may also be an .ico file.
function parseImage(dataUrl, { name, types, max }) {
  const match = /^data:(image\/[a-z.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
  // Browsers label .ico files with either type.
  const type = match?.[1] === "image/vnd.microsoft.icon" ? "image/x-icon" : match?.[1];
  if (!match || !types[type]) throw badRequest(`The ${name} must be a ${types["image/x-icon"] ? "PNG, JPEG, WebP or ICO" : "PNG, JPEG or WebP"} image.`);
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > max) throw badRequest(`The ${name} must be under ${max / 1024} KB.`);
  if (!types[type](bytes)) throw badRequest("That file isn't a valid image.");
  return { type, data: bytes.toString("base64") };
}

async function storeImage(value, key, options) {
  if (value === null) {
    await AppSetting.deleteOne({ key });
    return 0;
  }
  const image = parseImage(value, options);
  await AppSetting.findOneAndUpdate({ key }, { $set: { value: image } }, { upsert: true });
  return Date.now();
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
  // Check both images before storing either, so a bad favicon doesn't leave
  // a half-saved logo.
  if (payload.logo) parseImage(payload.logo, { name: "logo", types: LOGO_TYPES, max: MAX_LOGO_BYTES });
  if (payload.favicon) parseImage(payload.favicon, { name: "favicon", types: FAVICON_TYPES, max: MAX_FAVICON_BYTES });
  if (payload.logo !== undefined) next.logoVersion = await storeImage(payload.logo, LOGO_KEY, { name: "logo", types: LOGO_TYPES, max: MAX_LOGO_BYTES });
  if (payload.favicon !== undefined) next.faviconVersion = await storeImage(payload.favicon, FAVICON_KEY, { name: "favicon", types: FAVICON_TYPES, max: MAX_FAVICON_BYTES });
  await AppSetting.findOneAndUpdate({ key: BRANDING_KEY }, { $set: { value: next } }, { upsert: true });
  return next;
}

async function getImage(key, types) {
  const stored = (await AppSetting.findOne({ key }).lean())?.value;
  if (!stored?.data || !types[stored.type]) return null;
  return { type: stored.type, bytes: Buffer.from(stored.data, "base64") };
}

export const getLogo = () => getImage(LOGO_KEY, LOGO_TYPES);
export const getFavicon = () => getImage(FAVICON_KEY, FAVICON_TYPES);
