import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getPricing, getSiteSettings } from "./siteSettings.service.js";
import { avatarFor, isAvatarId, randomAvatarId } from "../config/avatars.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { OsceAttempt } from "../models/OsceAttempt.js";
import { User } from "../models/User.js";
import { AccessPeriod } from "../models/AccessPeriod.js";
import { Session } from "../models/Session.js";
import mongoose from "mongoose";
import { closeAllSessions, openSession } from "./session.service.js";

function toUserDto(user) {
  const profile = user.profile || {};
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel || "",
    avatar: avatarFor(user),
    tourPending: Boolean(user.tourPending),
    mustChangePassword: Boolean(user.mustChangePassword),
    institution: profile.institution || "",
    programme: profile.programme || "",
    yearLevel: profile.yearLevel || "",
    profile: {
      institution: profile.institution || "",
      programme: profile.programme || "",
      yearLevel: profile.yearLevel || "",
    },
  };
}

// Signs a token for a new session on this device. The token carries the
// session id, so the device limit and "sign out this device" take effect on
// the very next request.
async function issueSession(user, context) {
  const sid = new mongoose.Types.ObjectId();
  const token = jwt.sign({ sub: user._id.toString(), sv: user.sessionVersion || 0, sid: sid.toString() }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn,
  });
  const { exp } = jwt.decode(token);
  await openSession(user, { id: sid, expiresAt: new Date(exp * 1000), context });
  return { token, expiresInMs: exp * 1000 - Date.now() };
}

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PROFILE_LIMITS = {
  institution: 200,
  programme: 120,
  yearLevel: 80,
};

function badProfile() {
  const error = new Error("Invalid profile details.");
  error.status = 400;
  return error;
}

function cleanProfile(profile = {}) {
  if (typeof profile !== "object" || profile === null || Array.isArray(profile)) throw badProfile();
  return Object.fromEntries(Object.entries(PROFILE_LIMITS).map(([field, limit]) => {
    const value = profile[field] ?? "";
    if (typeof value !== "string" || value.length > limit) throw badProfile();
    return [field, value.trim()];
  }));
}

export async function registerUser({ fullName, email, password, roleLabel, profile }, context) {
  if (typeof fullName !== "string" || typeof email !== "string" || typeof password !== "string" ||
      Buffer.byteLength(password, "utf8") > 72 || fullName.length > 120 || email.length > 254 ||
      (roleLabel !== undefined && (typeof roleLabel !== "string" || roleLabel.length > 80))) {
    const error = new Error("Invalid registration details.");
    error.status = 400;
    throw error;
  }
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();
  if (!normalizedName || !normalizedEmail || !password) {
    const error = new Error("Full name, email, and password are required.");
    error.status = 400;
    throw error;
  }
  if (!PASSWORD_RULE.test(password)) {
    const error = new Error("Password must be at least 8 characters and include a letter and a number.");
    error.status = 400;
    throw error;
  }
  const safeProfile = cleanProfile(profile);
  if (!(await getSiteSettings()).signupsOpen) {
    const error = new Error("New signups are closed right now.");
    error.status = 403;
    error.code = "SIGNUPS_CLOSED";
    throw error;
  }
  const { welcomeCredits } = await getPricing();

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    externalId: `user_${crypto.randomUUID()}`,
    fullName: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: "student",
    roleLabel: String(roleLabel || "").trim(),
    avatar: randomAvatarId(),
    tourPending: true,
    creditBalance: welcomeCredits,
    profile: safeProfile,
  });

  if (welcomeCredits > 0) {
    try {
      await CreditTransaction.create({
        userId: user._id, type: "grant", reason: "welcome-grant",
        amount: welcomeCredits, balanceAfter: welcomeCredits,
        note: "Welcome credits for your new account.", createdBy: "system",
      });
    } catch (error) {
      // Don't leave a partially registered account with untracked credits.
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  }

  const { token, expiresInMs } = await issueSession(user, context);
  return { token, expiresInMs, user: toUserDto(user) };
}

export async function loginUser({ email, password }, context) {
  if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || Buffer.byteLength(password, "utf8") > 1024) {
    const error = new Error("Incorrect email or password.");
    error.status = 401;
    throw error;
  }
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password || "", user.passwordHash))) {
    const error = new Error("Incorrect email or password.");
    error.status = 401;
    throw error;
  }
  if (user.suspended) {
    const error = new Error("This account has been suspended. Please contact support.");
    error.status = 403;
    error.code = "ACCOUNT_SUSPENDED";
    throw error;
  }

  const { token, expiresInMs } = await issueSession(user, context);
  return { token, expiresInMs, user: toUserDto(user) };
}

// "Sign out everywhere": every token the account has stops working.
export async function revokeUserSessions(userId) {
  await User.updateOne({ _id: userId }, { $inc: { sessionVersion: 1 } });
  await closeAllSessions(userId);
}

export async function currentUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }
  return { user: toUserDto(user) };
}

export async function updateCurrentUser(userId, payload) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  if (payload.fullName !== undefined) {
    const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
    if (!fullName || fullName.length > 120) {
      const error = new Error("Full name is required.");
      error.status = 400;
      throw error;
    }
    user.fullName = fullName;
  }
  if (payload.roleLabel !== undefined) {
    if (typeof payload.roleLabel !== "string" || payload.roleLabel.length > 80) throw badProfile();
    user.roleLabel = payload.roleLabel.trim();
  }
  if (payload.avatar !== undefined) {
    if (!isAvatarId(payload.avatar)) throw badProfile();
    user.avatar = payload.avatar;
  }
  // The client can only mark the tour as done; replaying it is client-side.
  if (payload.tourDone !== undefined) {
    if (payload.tourDone !== true) throw badProfile();
    user.tourPending = false;
  }
  if (payload.profile !== undefined) user.profile = { ...user.profile, ...cleanProfile(payload.profile) };

  await user.save();
  return { user: toUserDto(user) };
}

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

// Re-checks the account password before a sensitive change. Uses 400, not
// 401, so a typo doesn't look like an expired session to the client.
async function verifyPassword(user, password) {
  if (typeof password !== "string" || !password || Buffer.byteLength(password, "utf8") > 1024 ||
      !(await bcrypt.compare(password, user.passwordHash || ""))) {
    throw httpError(400, "Your current password is incorrect.", "WRONG_PASSWORD");
  }
}

// Changing the password signs out every other session (sessionVersion bump)
// and returns a fresh token so this one stays signed in.
export async function changePassword(userId, { currentPassword, newPassword } = {}, context) {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, "User not found.");
  await verifyPassword(user, currentPassword);

  if (typeof newPassword !== "string" || Buffer.byteLength(newPassword, "utf8") > 72) {
    throw httpError(400, "New password is too long.");
  }
  if (!PASSWORD_RULE.test(newPassword)) {
    throw httpError(400, "Password must be at least 8 characters and include a letter and a number.");
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw httpError(400, "Choose a password different from your current one.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.mustChangePassword = false;
  await user.save();
  await closeAllSessions(user._id, "password-changed");

  const { token, expiresInMs } = await issueSession(user, context);
  return { token, expiresInMs, user: toUserDto(user) };
}

// Permanently removes the account and the practice data tied to it.
export async function deleteAccount(userId, { password, confirmation } = {}) {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, "User not found.");
  if (user.role === "admin") {
    throw httpError(403, "Admin accounts can't be deleted from settings.", "ADMIN_DELETE_BLOCKED");
  }
  if (confirmation !== "DELETE") throw httpError(400, "Type DELETE to confirm.");
  await verifyPassword(user, password);

  await OsceAttempt.deleteMany({ userId: user._id.toString() });
  await CreditTransaction.deleteMany({ userId: user._id });
  await AccessPeriod.deleteMany({ userId: user._id });
  await Session.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });
}
