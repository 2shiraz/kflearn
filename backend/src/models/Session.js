import mongoose from "mongoose";

// One signed-in device. The session id travels inside the sign-in token, and
// every request checks the session is still open, so signing a device out
// (or the two-device limit doing it) takes effect immediately.
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expiresAt: { type: Date, required: true },
    lastSeenAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: "", maxlength: 400 },
    ip: { type: String, default: "", maxlength: 64 },
    revokedAt: { type: Date },
    revokedReason: { type: String, default: "", maxlength: 40 },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, revokedAt: 1, createdAt: -1 });
// Closed or expired rows are kept for a month for the device history, then removed.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Session = mongoose.model("Session", sessionSchema);
