import mongoose from "mongoose";
import { AccessPeriod } from "../models/AccessPeriod.js";
import { User } from "../models/User.js";
import { getPricing, getSiteSettings } from "./siteSettings.service.js";

const DAY = 24 * 60 * 60 * 1000;
const MAX_GRANT_DAYS = 366;

// Admins and contributors manage the site and never need a pass.
export const isPrivileged = (user) => ["admin", "contributor"].includes(user?.role);

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

// The end of the account's latest non-revoked period, or null if it never had one.
export async function accessUntil(userId) {
  const latest = await AccessPeriod.findOne({ userId, revokedAt: null }).sort({ to: -1 }).select("to").lean();
  return latest?.to || null;
}

// What the account can do right now. `hasAccess` is the one the app checks:
// true for admins, while the switch is off, during a pass, and in the grace
// days after it. Always worked out from the database, never from the token.
export async function getAccess(user, { site, pricing } = {}) {
  const [settings, prices] = await Promise.all([site || getSiteSettings(), pricing || getPricing()]);
  const required = Boolean(settings.requireSubscription);
  const unlimited = isPrivileged(user);
  const until = user?._id || user?.id ? await accessUntil(user._id || user.id) : null;
  const graceDays = prices.subscription.graceDays;
  const graceUntil = until ? new Date(until.getTime() + graceDays * DAY) : null;
  const now = Date.now();
  const active = Boolean(until && until.getTime() > now);
  const inGrace = Boolean(!active && graceUntil && graceUntil.getTime() > now);
  return {
    required,
    unlimited,
    active,
    inGrace,
    hasAccess: unlimited || !required || active || inGrace,
    until,
    graceUntil,
    graceDays,
  };
}

// Adds a period. It starts when the current access ends, or now if it has
// already ended, so renewing early never loses days.
export async function grantAccess({ userId, days, source, reason = "", createdBy = "system", paymentId, session } = {}) {
  if (!Number.isSafeInteger(days) || days < 1 || days > MAX_GRANT_DAYS) throw httpError(400, `Grant between 1 and ${MAX_GRANT_DAYS} days.`);
  if (!(await User.exists({ _id: userId }))) throw httpError(404, "Account not found.");
  const current = await accessUntil(userId);
  const from = new Date(Math.max(Date.now(), current ? current.getTime() : 0));
  const to = new Date(from.getTime() + days * DAY);
  const [period] = await AccessPeriod.create([{
    userId, from, to, days, source, paymentId,
    reason: String(reason || "").trim().slice(0, 200),
    createdBy: String(createdBy).slice(0, 120),
  }], session ? { session } : undefined);
  return period;
}

export async function revokeAccessPeriod({ userId, periodId, revokedBy = "system" }) {
  if (!mongoose.isObjectIdOrHexString(periodId)) throw httpError(404, "Access period not found.");
  const period = await AccessPeriod.findOne({ _id: periodId, userId });
  if (!period) throw httpError(404, "Access period not found.");
  if (period.revokedAt) throw httpError(409, "That period is already revoked.");
  period.revokedAt = new Date();
  period.revokedBy = String(revokedBy).slice(0, 120);
  await period.save();
  return period;
}

export function accessPeriodDto(p) {
  return {
    id: p._id,
    from: p.from,
    to: p.to,
    days: p.days,
    source: p.source,
    paymentId: p.paymentId || null,
    reason: p.reason,
    createdBy: p.createdBy,
    createdAt: p.createdAt,
    revokedAt: p.revokedAt || null,
    revokedBy: p.revokedBy || "",
  };
}

export async function listAccessPeriods(userId) {
  const rows = await AccessPeriod.find({ userId }).sort({ from: -1, createdAt: -1 }).limit(100).lean();
  return rows.map(accessPeriodDto);
}

// Access-until for many accounts at once (the admin accounts list).
export async function accessUntilByUser(userIds) {
  const rows = await AccessPeriod.aggregate([
    { $match: { userId: { $in: userIds }, revokedAt: null } },
    { $group: { _id: "$userId", until: { $max: "$to" } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.until]));
}

// Subscriber figures for Admin > Revenue. "New" is an account's first ever
// period; "renewed" is any later one.
export async function subscriptionStats({ start }) {
  const { subscription } = await getPricing();
  const now = new Date();
  const graceMs = subscription.graceDays * DAY;
  const [latest, createdInRange] = await Promise.all([
    AccessPeriod.aggregate([
      { $match: { revokedAt: null } },
      { $group: { _id: "$userId", until: { $max: "$to" } } },
    ]),
    AccessPeriod.aggregate([
      { $match: { revokedAt: null } },
      { $sort: { createdAt: 1 } },
      { $group: { _id: "$userId", first: { $first: "$createdAt" }, all: { $push: "$createdAt" } } },
    ]),
  ]);
  const t = now.getTime();
  let active = 0;
  let inGrace = 0;
  let expiringSoon = 0;
  let lapsed = 0;
  for (const { until } of latest) {
    const end = until.getTime();
    if (end > t) {
      active += 1;
      if (end - t <= 7 * DAY) expiringSoon += 1;
    } else if (end + graceMs > t) inGrace += 1;
    else if (end >= start.getTime()) lapsed += 1;
  }
  let newSubscribers = 0;
  let renewals = 0;
  for (const row of createdInRange) {
    for (const createdAt of row.all) {
      if (createdAt < start) continue;
      if (createdAt.getTime() === row.first.getTime()) newSubscribers += 1;
      else renewals += 1;
    }
  }
  return { active, inGrace, expiringSoon, lapsed, newSubscribers, renewals };
}
