import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    sessionVersion: { type: Number, default: 0 },
    // Only ever changed through credit.service.js (atomic, ledgered). No user-
    // facing route writes this field.
    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isSafeInteger, message: "creditBalance must be an integer." },
    },
    role: { type: String, enum: ["student", "contributor", "admin"], default: "student" },
    roleLabel: { type: String, default: "" },
    // Id of one of the bundled avatars (see config/avatars.js), never image data.
    avatar: { type: String, default: "" },
    profile: {
      institution: { type: String, default: "" },
      programme: { type: String, default: "" },
      yearLevel: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
