import { getAccess } from "../services/access.service.js";
import { Announcement } from "../models/Announcement.js";
import { getBranding, getFavicon, getLogo, getPricing, getSiteSettings, updateBranding, updatePricing, updateSiteSettings } from "../services/siteSettings.service.js";
import { emailEnabled } from "../services/email/index.js";
import { getProvider } from "../services/payments/providers/index.js";

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function announcementDto(a) {
  return {
    id: a._id,
    title: a.title,
    message: a.message,
    tone: a.tone,
    linkLabel: a.linkLabel,
    linkHref: a.linkHref,
    active: a.active,
    endsAt: a.endsAt || null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

const liveFilter = () => ({ active: true, $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gt: new Date() } }] });

// ---- For everyone ----
export async function getPublicSite(req, res) {
  const [{ signupsOpen }, branding] = await Promise.all([getSiteSettings(), getBranding()]);
  res.json({ success: true, data: { signupsOpen, passwordReset: emailEnabled(), branding } });
}

export const getPublicLogo = (req, res) => sendImage(res, getLogo);
export const getPublicFavicon = (req, res) => sendImage(res, getFavicon);

async function sendImage(res, load) {
  const logo = await load();
  if (!logo) {
    res.status(404).end();
    return;
  }
  res.set({
    "Content-Type": logo.type,
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
    "Cross-Origin-Resource-Policy": "cross-origin",
  });
  res.send(logo.bytes);
}

// What the signed-in app needs: visible sections, feature switches and the
// announcements to show.
// Also the account's access status, so every page load re-checks it.
export async function getSite(req, res) {
  const [site, announcements] = await Promise.all([
    getSiteSettings(),
    Announcement.find(liveFilter()).sort({ createdAt: -1 }).limit(3).lean(),
  ]);
  const access = await getAccess({ id: req.user.id, role: req.user.role }, { site });
  res.json({ success: true, data: { ...site, announcements: announcements.map(announcementDto), access } });
}

// ---- Admin ----
export async function adminGetSettings(req, res) {
  const [site, pricing, branding] = await Promise.all([getSiteSettings(), getPricing(), getBranding()]);
  // Which payment provider and email sender the server is set up with, so the
  // admin can see whether online payments and reset emails can work.
  const provider = getProvider();
  const services = {
    payments: { connected: Boolean(provider), name: provider?.label || "", test: Boolean(provider?.isTest) },
    email: emailEnabled(),
  };
  res.json({ success: true, data: { site, pricing, branding, services } });
}

export async function adminUpdateBranding(req, res) {
  res.json({ success: true, data: { branding: await updateBranding(req.body || {}) } });
}

export async function adminUpdateSite(req, res) {
  res.json({ success: true, data: { site: await updateSiteSettings(req.body || {}) } });
}

export async function adminUpdatePricing(req, res) {
  res.json({ success: true, data: { pricing: await updatePricing(req.body || {}) } });
}

const TONES = ["info", "success", "warning"];

// Only same-site paths or https links, so an announcement can't carry a
// javascript: URL into students' browsers.
function cleanAnnouncement(body = {}, partial = false) {
  const out = {};
  const text = (key, max, required = false) => {
    if (body[key] === undefined) {
      if (required && !partial) throw badRequest("A title is required.");
      return;
    }
    if (typeof body[key] !== "string" || body[key].trim().length > max) throw badRequest(`${key} is too long.`);
    if (required && !body[key].trim()) throw badRequest("A title is required.");
    out[key] = body[key].trim();
  };
  text("title", 100, true);
  text("message", 500);
  text("linkLabel", 40);
  text("linkHref", 300);
  if (out.linkHref && !/^(\/(?!\/)|https:\/\/)/.test(out.linkHref)) throw badRequest("Links must start with / or https://.");
  if (body.tone !== undefined) {
    if (!TONES.includes(body.tone)) throw badRequest("Invalid tone.");
    out.tone = body.tone;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") throw badRequest("Invalid active flag.");
    out.active = body.active;
  }
  if (body.endsAt !== undefined) {
    if (body.endsAt === null || body.endsAt === "") out.endsAt = null;
    else {
      const date = new Date(body.endsAt);
      if (Number.isNaN(date.getTime())) throw badRequest("Invalid end date.");
      out.endsAt = date;
    }
  }
  return out;
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function adminListAnnouncements(req, res) {
  const rows = await Announcement.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, data: rows.map(announcementDto) });
}

export async function adminCreateAnnouncement(req, res) {
  const created = await Announcement.create({ ...cleanAnnouncement(req.body), createdBy: req.user.id });
  res.status(201).json({ success: true, data: announcementDto(created) });
}

export async function adminUpdateAnnouncement(req, res) {
  const updated = await Announcement.findByIdAndUpdate(req.params.id, { $set: cleanAnnouncement(req.body, true) }, { new: true, runValidators: true }).lean();
  if (!updated) throw notFound("Announcement not found.");
  res.json({ success: true, data: announcementDto(updated) });
}

export async function adminDeleteAnnouncement(req, res) {
  const removed = await Announcement.findByIdAndDelete(req.params.id);
  if (!removed) throw notFound("Announcement not found.");
  res.json({ success: true, data: { id: req.params.id } });
}
