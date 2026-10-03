import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    sessionVersion: { type: Number, default: 0 },
    // Signup initializes a ledgered welcome grant; later changes go through
    // credit.service.js. User-supplied balances are never accepted.
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
    // Set at signup so the welcome tour runs once; cleared when it's finished
    // or skipped. Accounts made before the tour existed default to false.
    tourPending: { type: Boolean, default: false },
    profile: {
      institution: { type: String, default: "" },
      programme: { type: String, default: "" },
      yearLevel: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
