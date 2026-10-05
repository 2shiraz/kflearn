import mongoose from "mongoose";

// One attempt to pay online. Created when a student starts checkout, with the
// price fixed by the server at that moment. It only becomes "paid" when the
// payment provider's signed notification arrives and checks out (signature,
// amount, currency); the student's return to the site proves nothing.
const checkoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["subscription", "credits"], required: true },
    packageId: { type: String, default: "" },
    packageName: { type: String, default: "" },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "PKR" },
    credits: { type: Number, default: 0, min: 0 },
    accessDays: { type: Number, default: 0, min: 0 },
    provider: { type: String, required: true },
    providerRef: { type: String, default: "" },
    status: { type: String, enum: ["pending", "paid", "failed", "expired", "review"], default: "pending", index: true },
    failureReason: { type: String, default: "", maxlength: 200 },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

export const Checkout = mongoose.model("Checkout", checkoutSchema);
