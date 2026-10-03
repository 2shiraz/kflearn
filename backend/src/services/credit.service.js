import mongoose from "mongoose";
import { MAX_CREDIT_OPERATION, MAX_STUDENT_MESSAGES_PER_ATTEMPT } from "../config/credits.js";
import { getPricing } from "./siteSettings.service.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { User } from "../models/User.js";

function assertValidAmount(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_CREDIT_OPERATION) {
    throw new Error(`Invalid credit amount: ${amount}`);
  }
}

function insufficientCredits(required, balance) {
  const error = new Error(`You need ${required} AI credits for this. Your balance is ${balance}.`);
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

// Admin balance correction from the Accounts screen. Positive adds credits,
// negative removes them (never below zero). Always ledgered with who did it.
export async function adminAdjustCredits({ userId, amount, note = "", createdBy }) {
  if (!Number.isSafeInteger(amount) || amount === 0 || Math.abs(amount) > MAX_CREDIT_OPERATION) {
    const error = new Error("Enter a whole number of credits, not zero.");
    error.status = 400;
    throw error;
  }
  const filter = amount < 0 ? { _id: userId, creditBalance: { $gte: -amount } } : { _id: userId };
  const user = await User.findOneAndUpdate(filter, { $inc: { creditBalance: amount } }, { new: true, projection: { creditBalance: 1 } });
  if (!user) {
    const exists = await User.exists({ _id: userId });
    const error = new Error(exists ? "That would take the balance below zero." : "Account not found.");
    error.status = exists ? 409 : 404;
    throw error;
  }
  try {
    await CreditTransaction.create({
      userId, type: amount > 0 ? "grant" : "deduct", reason: "admin-adjust",
      amount, balanceAfter: user.creditBalance, note: String(note).slice(0, 200), createdBy,
    });
  } catch (error) {
    await User.updateOne({ _id: userId }, { $inc: { creditBalance: -amount } });
    throw error;
  }
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

// Public, unauthenticated view for the marketing pricing page: package names,
// credit amounts and prices only. Per-action costs stay behind authentication.
export async function publicCreditPackages() {
  const { packages } = await getPricing();
  return packages.map(({ id, name, credits, pricePkr }) => ({ id, name, credits, pricePkr }));
}

export async function creditPricing() {
  const { costs, packages } = await getPricing();
  const fullStation = costs.virtualPatient + costs.aiAssessment;
  return {
    costs: { ...costs, fullStation },
    limits: { studentMessagesPerStation: MAX_STUDENT_MESSAGES_PER_ATTEMPT },
    packages: packages.map((pkg) => ({
      ...pkg,
      fullStations: Math.floor(pkg.credits / fullStation),
    })),
  };
}
