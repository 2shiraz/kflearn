import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "contributor", "admin"], default: "student" },
    roleLabel: { type: String, default: "" },
    profile: {
      institution: { type: String, default: "" },
      programme: { type: String, default: "" },
      yearLevel: { type: String, default: "" },
      targetExam: { type: String, default: "" },
      expectedExamDate: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
