import mongoose from "mongoose";

// One block of paid (or granted) access to the site. An account's access runs
// to the latest `to` of its periods that haven't been revoked. Periods are
// added by an admin (a grant or a recorded payment) and, later, by the
// payment processor. Rows are never edited except to revoke them.
const accessPeriodSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    source: { type: String, enum: ["admin-grant", "payment", "processor"], required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    reason: { type: String, default: "", maxlength: 200 },
    createdBy: { type: String, default: "system", maxlength: 120 },
    revokedAt: { type: Date },
    revokedBy: { type: String, default: "", maxlength: 120 },
    // When each in-app/email reminder about this period was sent, so a
    // restart never sends it twice.
    remindedEndingAt: { type: Date },
    remindedEndedAt: { type: Date },
  },
  { timestamps: true },
);

accessPeriodSchema.index({ userId: 1, to: -1 });

export const AccessPeriod = mongoose.model("AccessPeriod", accessPeriodSchema);
