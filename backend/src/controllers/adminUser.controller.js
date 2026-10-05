import bcrypt from "bcryptjs";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { OsceAttempt } from "../models/OsceAttempt.js";
import { User } from "../models/User.js";
import { adminAdjustCredits, listTransactions } from "../services/credit.service.js";
import { AccessPeriod } from "../models/AccessPeriod.js";
import { accessUntilByUser, getAccess, grantAccess, isPrivileged, listAccessPeriods, revokeAccessPeriod } from "../services/access.service.js";
import { Session } from "../models/Session.js";
import { closeAllSessions, closeOwnSession, listOpenSessions, sharingFlags } from "../services/session.service.js";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

const ROLES = ["student", "contributor", "admin"];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function userDto(user, accessUntil = null, sharingFlag = null) {
  return {
    sharingFlag,
    accessUntil,
    unlimitedAccess: isPrivileged(user),
    mustChangePassword: Boolean(user.mustChangePassword),
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    avatar: user.avatar || "",
    profile: user.profile,
    creditBalance: user.creditBalance ?? 0,
    suspended: Boolean(user.suspended),
    lastActiveAt: user.lastActiveAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findTarget(id) {
  const user = await User.findById(id);
  if (!user) throw httpError(404, "Account not found.");
  return user;
}

// An admin can't lock themselves out, and the last admin can't be removed.
async function guardAdminChange(req, user, { demoting = false, suspending = false, deleting = false } = {}) {
  const self = user._id.toString() === req.user.id;
  if (self && (demoting || suspending || deleting)) throw httpError(409, "You can't do this to your own account.");
  if (user.role === "admin" && (demoting || deleting)) {
    const admins = await User.countDocuments({ role: "admin", suspended: { $ne: true } });
    if (admins <= 1) throw httpError(409, "There must always be at least one admin.");
  }
}

// Giving or removing admin rights is the most powerful change in the app, so
// it needs the acting admin's own password, not just a valid session.
async function confirmActorPassword(req) {
  const password = req.body?.password;
  const actor = await User.findById(req.user.id).select("passwordHash");
  if (typeof password !== "string" || !actor || !(await bcrypt.compare(password, actor.passwordHash))) {
    throw httpError(403, "Enter your own password to change admin access.");
  }
}

export async function listAdminUsers(req, res) {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
  const ids = users.map((u) => u._id);
  const [until, flags] = await Promise.all([accessUntilByUser(ids), sharingFlags(ids)]);
  res.json({ success: true, data: users.map((u) => userDto(u, until.get(String(u._id)) || null, flags.get(String(u._id)) || null)) });
}

export async function getAdminUser(req, res) {
  const user = await findTarget(req.params.id);
  const [transactions, attempts, access, periods, sessions, flags] = await Promise.all([
    listTransactions(user._id.toString(), 20),
    OsceAttempt.countDocuments({ userId: user._id, status: { $in: ["self-assessed", "ai-assessed"] } }),
    getAccess(user),
    listAccessPeriods(user._id),
    listOpenSessions(user._id, null, { fullIp: true }),
    sharingFlags([user._id]),
  ]);
  res.json({ success: true, data: { user: userDto(user, access.until, flags.get(String(user._id)) || null), transactions, markedStations: attempts, access, periods, sessions } });
}

export async function updateAdminUser(req, res) {
  const user = await findTarget(req.params.id);
  const body = req.body || {};

  if (body.fullName !== undefined) {
    const name = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!name || name.length > 120) throw httpError(400, "Enter a name of up to 120 characters.");
    user.fullName = name;
  }
  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) throw httpError(400, "Invalid role.");
    if (body.role !== user.role) {
      await guardAdminChange(req, user, { demoting: user.role === "admin" });
      if (body.role === "admin" || user.role === "admin") await confirmActorPassword(req);
      user.role = body.role;
      user.sessionVersion = (user.sessionVersion || 0) + 1; // permissions changed: sign in again
    }
  }
  if (body.suspended !== undefined) {
    if (typeof body.suspended !== "boolean") throw httpError(400, "Invalid suspended flag.");
    if (body.suspended !== Boolean(user.suspended)) {
      if (body.suspended) await guardAdminChange(req, user, { suspending: true });
      user.suspended = body.suspended;
      if (body.suspended) user.sessionVersion = (user.sessionVersion || 0) + 1; // end their sessions now
    }
  }
  await user.save();
  res.json({ success: true, data: { user: userDto(user) } });
}

export async function adjustAdminUserCredits(req, res) {
  const user = await findTarget(req.params.id);
  const { amount, note } = req.body || {};
  if (note !== undefined && (typeof note !== "string" || note.length > 200)) throw httpError(400, "Keep the note under 200 characters.");
  const balance = await adminAdjustCredits({
    userId: user._id,
    amount,
    note: note?.trim() || (amount > 0 ? "Added by admin." : "Removed by admin."),
    createdBy: req.user.email || req.user.id,
  });
  res.json({ success: true, data: { balance } });
}

export async function deleteAdminUser(req, res) {
  const user = await findTarget(req.params.id);
  await guardAdminChange(req, user, { deleting: true });
  if (req.body?.confirmation !== user.email) throw httpError(400, "Type the account's email to confirm.");
  await Promise.all([
    OsceAttempt.deleteMany({ userId: user._id }),
    CreditTransaction.deleteMany({ userId: user._id }),
    AccessPeriod.deleteMany({ userId: user._id }),
    Session.deleteMany({ userId: user._id }),
  ]);
  await User.deleteOne({ _id: user._id });
  res.json({ success: true, data: { id: req.params.id } });
}

// ---- Monthly access ----
async function accessResponse(user) {
  const [access, periods] = await Promise.all([getAccess(user), listAccessPeriods(user._id)]);
  return { access, periods };
}

// Grants or extends access by a number of days, with a reason for the record.
export async function grantAdminUserAccess(req, res) {
  const user = await findTarget(req.params.id);
  const { days, reason } = req.body || {};
  if (typeof reason !== "string" || !reason.trim()) throw httpError(400, "Give a reason for the record.");
  await grantAccess({ userId: user._id, days, source: "admin-grant", reason, createdBy: req.user.email || req.user.id });
  res.status(201).json({ success: true, data: await accessResponse(user) });
}

export async function revokeAdminUserAccess(req, res) {
  const user = await findTarget(req.params.id);
  await revokeAccessPeriod({ userId: user._id, periodId: req.params.periodId, revokedBy: req.user.email || req.user.id });
  res.json({ success: true, data: await accessResponse(user) });
}

// Sets a temporary password for a student who can't sign in (there is no
// email reset yet). Signs out their devices; they're asked to change it.
export async function setAdminUserPassword(req, res) {
  const user = await findTarget(req.params.id);
  if (user._id.toString() === req.user.id) throw httpError(409, "Change your own password in Settings.");
  if (user.role === "admin") throw httpError(409, "Admin passwords can only be changed by their owner.");
  const { password } = req.body || {};
  if (typeof password !== "string" || !PASSWORD_RULE.test(password)) throw httpError(400, "Use at least 8 characters, with a letter and a number.");
  user.passwordHash = await bcrypt.hash(password, 12);
  user.mustChangePassword = true;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  await closeAllSessions(user._id, "admin-password-reset");
  res.json({ success: true, data: { user: userDto(user, (await getAccess(user)).until) } });
}

// ---- Signed-in devices ----
export async function revokeAdminUserSession(req, res) {
  const user = await findTarget(req.params.id);
  await closeOwnSession(user._id, req.params.sessionId);
  res.json({ success: true, data: { sessions: await listOpenSessions(user._id, null, { fullIp: true }) } });
}

export async function revokeAllAdminUserSessions(req, res) {
  const user = await findTarget(req.params.id);
  if (user._id.toString() === req.user.id) throw httpError(409, "Use Settings to sign out your own devices.");
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  await closeAllSessions(user._id, "signed-out-by-admin");
  res.json({ success: true, data: { sessions: [] } });
}
