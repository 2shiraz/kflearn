import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { PasswordResetToken } from "../models/PasswordResetToken.js";
import { User } from "../models/User.js";
import { sendEmail } from "./email/index.js";
import { passwordResetEmail } from "./email/templates.js";
import { closeAllSessions } from "./session.service.js";
import { getBranding } from "./siteSettings.service.js";

const TOKEN_TTL_MS = 30 * 60 * 1000;
const RESEND_GAP_MS = 2 * 60 * 1000;
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

// Emails a reset link if the address has an account. Says nothing either way,
// so the form can't be used to find out who has an account.
export async function requestPasswordReset(email) {
  if (typeof email !== "string" || email.length > 254) return;
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("email fullName suspended").lean();
  if (!user || user.suspended) return;
  const recent = await PasswordResetToken.exists({ userId: user._id, createdAt: { $gte: new Date(Date.now() - RESEND_GAP_MS) } });
  if (recent) return;

  // Only the newest link works.
  await PasswordResetToken.updateMany({ userId: user._id, usedAt: null }, { $set: { usedAt: new Date() } });
  const token = crypto.randomBytes(32).toString("base64url");
  await PasswordResetToken.create({ userId: user._id, tokenHash: hash(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) });
  const { siteName } = await getBranding();
  await sendEmail({
    to: user.email,
    ...passwordResetEmail({ name: user.fullName, link: `${env.frontendUrl}/reset-password?token=${token}`, siteName }),
  });
}

// Sets a new password from a reset link. The link works once, within 30
// minutes, and signing in again is needed on every device afterwards.
export async function resetPassword({ token, password } = {}) {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) throw httpError(400, "This reset link isn't valid. Ask for a new one.", "RESET_INVALID");
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) throw httpError(400, "New password is too long.");
  if (!PASSWORD_RULE.test(password)) {
    throw httpError(400, "Password must be at least 8 characters and include a letter and a number.");
  }
  const record = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: hash(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );
  if (!record) throw httpError(400, "This reset link has expired or was already used. Ask for a new one.", "RESET_INVALID");
  const user = await User.findById(record.userId);
  if (!user || user.suspended) throw httpError(400, "This reset link isn't valid. Ask for a new one.", "RESET_INVALID");
  user.passwordHash = await bcrypt.hash(password, 12);
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.mustChangePassword = false;
  await user.save();
  await closeAllSessions(user._id, "password-reset");
}
