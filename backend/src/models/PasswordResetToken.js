import mongoose from "mongoose";

// A "forgot password" link. Only a hash of the token is stored, so a copy of
// the database can't be used to reset passwords. Single use, short-lived.
const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

// Removed by MongoDB a day after they expire.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
