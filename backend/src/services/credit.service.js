import mongoose from "mongoose";
import { CREDIT_COSTS, CREDIT_PACKAGES, MAX_CREDIT_OPERATION, MAX_STUDENT_MESSAGES_PER_ATTEMPT } from "../config/credits.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { User } from "../models/User.js";

function assertValidAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_CREDIT_OPERATION) {
    throw new Error(`Invalid credit amount: ${amount}`);
  }
}

function insufficientCredits(required, balance) {
  const error = new Error(`You need ${required} credits for this. Your balance is ${balance}.`);
  error.status = 402;
  error.code = "INSUFFICIENT_CREDITS";
  return error;
}

export async function getBalance(userId) {
  const user = await User.findById(userId, { creditBalance: 1 }).lean();
  return user?.creditBalance ?? 0;
}

// The balance check and the decrement are one atomic MongoDB operation, so
// concurrent requests can never spend the same credits twice or go negative.
export async function spendCredits({ userId, amount, reason, attemptId }) {
  assertValidAmount(amount);
  const user = await User.findOneAndUpdate(
    { _id: userId, creditBalance: { $gte: amount } },
    { $inc: { creditBalance: -amount } },
    { new: true, projection: { creditBalance: 1 } },
  );
  if (!user) throw insufficientCredits(amount, await getBalance(userId));

  try {
    await CreditTransaction.create({ userId, type: "spend", reason, amount: -amount, balanceAfter: user.creditBalance, attemptId });
  } catch (error) {
    // Never keep a debit without its ledger row.
    await User.updateOne({ _id: userId }, { $inc: { creditBalance: amount } });
    throw error;
  }
  return user.creditBalance;
}

export async function refundCredits({ userId, amount, reason, attemptId, note = "" }) {
  assertValidAmount(amount);
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { creditBalance: amount } },
    { new: true, projection: { creditBalance: 1 } },
  );
  if (!user) return 0;
  await CreditTransaction.create({ userId, type: "refund", reason, amount, balanceAfter: user.creditBalance, attemptId, note });
  return user.creditBalance;
}

// Only called from the CLI grant script (and tests) — no HTTP route grants credits.
export async function grantCredits({ userId, amount, note = "", createdBy = "system" }) {
  assertValidAmount(amount);
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { creditBalance: amount } },
    { new: true, projection: { creditBalance: 1 } },
  );
  if (!user) throw new Error("User not found.");
  await CreditTransaction.create({ userId, type: "grant", reason: "admin-grant", amount, balanceAfter: user.creditBalance, note, createdBy });
  return user.creditBalance;
}

export async function listTransactions(userId, limit = 50) {
  const rows = await CreditTransaction.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  return rows.map((row) => ({
    id: row._id,
    type: row.type,
    reason: row.reason,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    note: row.note || "",
    createdAt: row.createdAt,
  }));
}

export function creditPricing() {
  const fullStation = CREDIT_COSTS.virtualPatient + CREDIT_COSTS.aiAssessment;
  return {
    costs: { ...CREDIT_COSTS, fullStation },
    limits: { studentMessagesPerStation: MAX_STUDENT_MESSAGES_PER_ATTEMPT },
    packages: CREDIT_PACKAGES.map((pkg) => ({
      ...pkg,
      fullStations: Math.floor(pkg.credits / fullStation),
    })),
  };
}
