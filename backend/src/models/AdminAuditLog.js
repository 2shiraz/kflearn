import mongoose from "mongoose";

// Append-only record of every change made through the admin area: who, what
// and when. Never stores secret values such as API keys or passwords.
const adminAuditLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, required: true },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true, maxlength: 120 },
    target: { type: String, default: "", maxlength: 200 },
    fields: [{ type: String, maxlength: 60 }],
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);
