import mongoose from "mongoose";
import { Session } from "../models/Session.js";

// Students can be signed in on at most this many devices. Signing in on one
// more signs out the device that signed in longest ago. Admins and
// contributors aren't limited.
export const MAX_DEVICES = 2;
const LIMIT_EXEMPT = ["admin", "contributor"];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// A short readable name for a device, from its browser's user agent.
export function deviceLabel(userAgent = "") {
  const ua = String(userAgent);
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android"
    : /Mac OS X|Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /CrOS/.test(ua) ? "Chromebook" : /Linux/.test(ua) ? "Linux" : "";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox"
    : /CriOS|Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || "Unknown device";
}

const contextOf = (context = {}) => ({
  userAgent: String(context.userAgent || "").slice(0, 400),
  ip: String(context.ip || "").slice(0, 64),
});

// Opens a session for a new sign-in and applies the device limit.
export async function openSession(user, { id, expiresAt, context } = {}) {
  const session = await Session.create({ _id: id, userId: user._id, expiresAt, ...contextOf(context) });
  if (!LIMIT_EXEMPT.includes(user.role)) {
    const open = await Session.find({ userId: user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1, _id: -1 }).select("_id").lean();
    const extra = open.slice(MAX_DEVICES).map((s) => s._id);
    if (extra.length) await Session.updateMany({ _id: { $in: extra } }, { $set: { revokedAt: new Date(), revokedReason: "device-limit" } });
  }
  return session;
}

// Called on every authenticated request. Returns false if the session is
// closed, expired or belongs to someone else.
export async function touchSession(sessionId, userId, context) {
  if (!sessionId || !mongoose.isObjectIdOrHexString(sessionId)) return false;
  const session = await Session.findOne({ _id: sessionId, userId, revokedAt: null, expiresAt: { $gt: new Date() } }).lean();
  if (!session) return false;
  // Record activity at most every 5 minutes per device.
  if (Date.now() - new Date(session.lastSeenAt).getTime() > 5 * 60 * 1000) {
    Session.updateOne({ _id: session._id }, { $set: { lastSeenAt: new Date(), ...contextOf(context) } }).catch(() => {});
  }
  return true;
}

export async function closeSession(sessionId, reason = "signed-out") {
  if (!sessionId || !mongoose.isObjectIdOrHexString(sessionId)) return;
  await Session.updateOne({ _id: sessionId, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: reason } });
}

export async function closeAllSessions(userId, reason = "signed-out-everywhere") {
  await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: reason } });
}

// Masks the last part of an IP address for display.
const maskIp = (ip = "") => (ip.includes(".") ? ip.replace(/\.\d+$/, ".x") : ip.replace(/:[0-9a-f]*$/i, ":x"));

export function sessionDto(s, currentId, { fullIp = false } = {}) {
  return {
    id: s._id,
    device: deviceLabel(s.userAgent),
    ip: fullIp ? s.ip : maskIp(s.ip),
    createdAt: s.createdAt,
    lastSeenAt: s.lastSeenAt,
    current: currentId ? String(s._id) === String(currentId) : false,
  };
}

export async function listOpenSessions(userId, currentId, options) {
  const rows = await Session.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({ lastSeenAt: -1 }).lean();
  return rows.map((s) => sessionDto(s, currentId, options));
}

export async function closeOwnSession(userId, sessionId) {
  if (!mongoose.isObjectIdOrHexString(sessionId)) throw httpError(404, "That device isn't signed in.");
  const result = await Session.updateOne({ _id: sessionId, userId, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: "signed-out-remotely" } });
  if (!result.matchedCount) throw httpError(404, "That device isn't signed in.");
}

// Accounts signing in from many places in a day, for Admin > Accounts.
const FLAG_IPS = 4;
const FLAG_SIGNINS = 6;
export async function sharingFlags(userIds) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await Session.aggregate([
    { $match: { userId: { $in: userIds }, createdAt: { $gte: since } } },
    { $group: { _id: "$userId", signIns: { $sum: 1 }, ips: { $addToSet: "$ip" }, devices: { $addToSet: "$userAgent" } } },
  ]);
  const flags = new Map();
  for (const r of rows) {
    if (r.ips.length >= FLAG_IPS || r.signIns >= FLAG_SIGNINS) {
      flags.set(String(r._id), { signIns: r.signIns, places: r.ips.length, devices: r.devices.length });
    }
  }
  return flags;
}
