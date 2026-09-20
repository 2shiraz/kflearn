import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

function toUserDto(user) {
  const profile = user.profile || {};
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel || "",
    institution: profile.institution || "",
    programme: profile.programme || "",
    yearLevel: profile.yearLevel || "",
    targetExam: profile.targetExam || "",
    expectedExamDate: profile.expectedExamDate || "",
    profile: {
      institution: profile.institution || "",
      programme: profile.programme || "",
      yearLevel: profile.yearLevel || "",
      targetExam: profile.targetExam || "",
      expectedExamDate: profile.expectedExamDate || "",
    },
  };
}

function signToken(user) {
  const token = jwt.sign({ sub: user._id.toString(), sv: user.sessionVersion || 0 }, env.jwtSecret, {
    algorithm: "HS256",
    expiresIn: env.jwtExpiresIn,
  });
  const { exp } = jwt.decode(token);
  return { token, expiresInMs: exp * 1000 - Date.now() };
}

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PROFILE_LIMITS = {
  institution: 200,
  programme: 120,
  yearLevel: 80,
  targetExam: 120,
  expectedExamDate: 80,
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

export async function registerUser({ fullName, email, password, roleLabel, profile }) {
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
    profile: safeProfile,
  });

  const { token, expiresInMs } = signToken(user);
  return { token, expiresInMs, user: toUserDto(user) };
}

export async function loginUser({ email, password }) {
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

  const { token, expiresInMs } = signToken(user);
  return { token, expiresInMs, user: toUserDto(user) };
}

export async function revokeUserSessions(userId) {
  await User.updateOne({ _id: userId }, { $inc: { sessionVersion: 1 } });
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
  if (payload.profile !== undefined) user.profile = { ...user.profile, ...cleanProfile(payload.profile) };

  await user.save();
  return { user: toUserDto(user) };
}
