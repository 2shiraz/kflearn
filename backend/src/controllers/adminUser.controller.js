import { CreditTransaction } from "../models/CreditTransaction.js";
import { OsceAttempt } from "../models/OsceAttempt.js";
import { User } from "../models/User.js";
import { adminAdjustCredits, listTransactions } from "../services/credit.service.js";

const ROLES = ["student", "contributor", "admin"];

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function userDto(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    avatar: user.avatar || "",
    profile: user.profile,
    creditBalance: user.creditBalance ?? 0,
    suspended: Boolean(user.suspended),
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

export async function listAdminUsers(req, res) {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: users.map(userDto) });
}

export async function getAdminUser(req, res) {
  const user = await findTarget(req.params.id);
  const [transactions, attempts] = await Promise.all([
    listTransactions(user._id.toString(), 20),
    OsceAttempt.countDocuments({ userId: user._id, status: { $in: ["self-assessed", "ai-assessed"] } }),
  ]);
  res.json({ success: true, data: { user: userDto(user), transactions, markedStations: attempts } });
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
  ]);
  await User.deleteOne({ _id: user._id });
  res.json({ success: true, data: { id: req.params.id } });
}
