import mongoose from "mongoose";

// Append-only ledger: every change to User.creditBalance writes one row here.
// Nothing in the app updates or deletes these documents.
const creditTransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["grant", "spend", "refund"], required: true },
    reason: { type: String, enum: ["virtual-patient", "ai-assessment", "admin-grant", "purchase", "welcome-grant"], required: true },
    // Signed: negative for spend, positive for grant/refund.
    amount: {
      type: Number,
      required: true,
      validate: { validator: (value) => Number.isSafeInteger(value) && value !== 0, message: "amount must be a non-zero integer." },
    },
    balanceAfter: { type: Number, required: true },
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "OsceAttempt" },
    note: { type: String, default: "", maxlength: 200 },
    createdBy: { type: String, default: "system", maxlength: 120 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model("CreditTransaction", creditTransactionSchema);
