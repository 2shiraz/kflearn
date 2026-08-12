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
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function cleanProfile(profile = {}) {
  return {
    institution: String(profile.institution || "").trim(),
    programme: String(profile.programme || "").trim(),
    yearLevel: String(profile.yearLevel || "").trim(),
    targetExam: String(profile.targetExam || "").trim(),
    expectedExamDate: String(profile.expectedExamDate || "").trim(),
  };
}

export async function registerUser({ fullName, email, password, roleLabel, profile }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();
  if (!normalizedName || !normalizedEmail || !password) {
    const error = new Error("Full name, email, and password are required.");
    error.status = 400;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.status = 400;
    throw error;
  }

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    externalId: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fullName: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role: "student",
    roleLabel: String(roleLabel || "").trim(),
    profile: cleanProfile(profile),
  });

  return { token: signToken(user), expiresIn: env.jwtExpiresIn, user: toUserDto(user) };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password || "", user.passwordHash))) {
    const error = new Error("Incorrect email or password.");
    error.status = 401;
    throw error;
  }

  return { token: signToken(user), expiresIn: env.jwtExpiresIn, user: toUserDto(user) };
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
    const fullName = String(payload.fullName || "").trim();
    if (!fullName) {
      const error = new Error("Full name is required.");
      error.status = 400;
      throw error;
    }
    user.fullName = fullName;
  }
  if (payload.roleLabel !== undefined) user.roleLabel = String(payload.roleLabel || "").trim();
  if (payload.profile) user.profile = { ...user.profile, ...cleanProfile(payload.profile) };

  await user.save();
  return { user: toUserDto(user) };
}
