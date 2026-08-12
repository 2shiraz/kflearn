import mongoose from "mongoose";

const contentAuditLogSchema = new mongoose.Schema(
  {
    contentType: { type: String, required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    version: { type: Number, default: 1 },
    action: { type: String, required: true },
    changedBy: { type: String, default: "" },
    changedAt: { type: Date, default: Date.now },
    summary: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ContentAuditLog = mongoose.model("ContentAuditLog", contentAuditLogSchema);
