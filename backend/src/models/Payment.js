import mongoose from "mongoose";

// One row per payment for AI credits. Today the admin records payments by
// hand (bank transfer, cash, mobile wallet). When a payment processor is
// connected, its webhook writes rows here too, with provider and providerRef
// set, so revenue reports keep working from one place.
//
// Amounts are whole units of `currency` (PKR has no paisa in practice).
const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "PKR" },
    // Charged by the processor; zero for payments recorded by hand.
    fee: { type: Number, default: 0, min: 0 },
    credits: { type: Number, required: true, min: 0 },
    packageId: { type: String, default: "" },
    packageName: { type: String, default: "" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "paid", index: true },
    method: { type: String, enum: ["bank-transfer", "cash", "mobile-wallet", "card", "other"], default: "other" },
    // "manual" for admin-recorded payments, else the processor's name.
    provider: { type: String, default: "manual" },
    // The bank, wallet or processor transaction reference.
    providerRef: { type: String, default: "", maxlength: 120 },
    paidAt: { type: Date, index: true },
    refundedAmount: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date },
    creditTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditTransaction" },
    note: { type: String, default: "", maxlength: 300 },
    recordedBy: { type: String, default: "system", maxlength: 120 },
  },
  { timestamps: true },
);

// A processor reference can only be recorded once.
paymentSchema.index({ provider: 1, providerRef: 1 }, { unique: true, partialFilterExpression: { providerRef: { $gt: "" } } });

export const Payment = mongoose.model("Payment", paymentSchema);
