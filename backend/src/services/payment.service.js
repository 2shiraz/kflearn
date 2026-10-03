import mongoose from "mongoose";
import { MAX_CREDIT_OPERATION } from "../config/credits.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { getPricing } from "./siteSettings.service.js";

const DAY = 24 * 60 * 60 * 1000;
export const PAYMENT_METHODS = ["bank-transfer", "cash", "mobile-wallet", "card", "other"];
const MAX_AMOUNT = 10_000_000;

function badRequest(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

// Adds the bought credits to the account and ledgers them as a purchase.
// Shared by hand-recorded payments now and processor webhooks later.
async function creditPayment(payment) {
  if (!payment.credits) return null;
  const user = await User.findOneAndUpdate({ _id: payment.userId }, { $inc: { creditBalance: payment.credits } }, { new: true, projection: { creditBalance: 1 } });
  if (!user) throw badRequest("Account not found.", 404);
  try {
    const row = await CreditTransaction.create({
      userId: payment.userId, type: "grant", reason: "purchase", amount: payment.credits,
      balanceAfter: user.creditBalance, note: `Payment ${payment._id}`.slice(0, 200), createdBy: payment.recordedBy,
    });
    return row._id;
  } catch (error) {
    await User.updateOne({ _id: payment.userId }, { $inc: { creditBalance: -payment.credits } });
    throw error;
  }
}

// A payment taken outside the site (bank transfer, cash, mobile wallet),
// recorded by an admin. The account gets the credits straight away.
export async function recordManualPayment(input, actor) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const user = email && (await User.findOne({ email }, { _id: 1 }).lean());
  if (!user) throw badRequest("No account has that email.");

  let { amount, credits } = input;
  let packageId = "";
  let packageName = "";
  if (input.packageId) {
    const pkg = (await getPricing()).packages.find((p) => p.id === input.packageId);
    if (!pkg) throw badRequest("That package no longer exists.");
    packageId = pkg.id;
    packageName = pkg.name;
    amount ??= pkg.pricePkr;
    credits ??= pkg.credits;
  }
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_AMOUNT) throw badRequest("Enter the amount paid in whole rupees.");
  if (!Number.isSafeInteger(credits) || credits < 0 || credits > MAX_CREDIT_OPERATION) throw badRequest("Enter the AI credits to add as a whole number.");
  const method = PAYMENT_METHODS.includes(input.method) ? input.method : "other";
  const providerRef = typeof input.reference === "string" ? input.reference.trim().slice(0, 120) : "";
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 300) : "";
  let paidAt = new Date();
  if (input.paidAt) {
    paidAt = new Date(input.paidAt);
    if (Number.isNaN(paidAt.getTime()) || paidAt.getTime() > Date.now() + DAY) throw badRequest("Pick the date the money arrived.");
  }
  if (providerRef && (await Payment.exists({ provider: "manual", providerRef }))) throw badRequest("A payment with that reference is already recorded.", 409);

  const payment = await Payment.create({
    userId: user._id, amount, credits, packageId, packageName, method, provider: "manual",
    providerRef, note, paidAt, status: "paid", recordedBy: actor,
  });
  try {
    payment.creditTransactionId = await creditPayment(payment);
    await payment.save();
  } catch (error) {
    await Payment.deleteOne({ _id: payment._id });
    throw error;
  }
  return payment;
}

// Marks a payment as refunded. Optionally takes the bought credits back,
// never more than the account still has.
export async function refundPayment(id, { removeCredits = false, note = "" } = {}, actor) {
  const payment = await Payment.findById(id);
  if (!payment) throw badRequest("Payment not found.", 404);
  if (payment.status !== "paid") throw badRequest("Only a paid payment can be refunded.", 409);
  payment.status = "refunded";
  payment.refundedAmount = payment.amount;
  payment.refundedAt = new Date();
  if (note) payment.note = `${payment.note ? `${payment.note} / ` : ""}Refund: ${String(note).trim()}`.slice(0, 300);
  let removed = 0;
  if (removeCredits && payment.credits) {
    const user = await User.findById(payment.userId, { creditBalance: 1 });
    removed = Math.min(user?.creditBalance || 0, payment.credits);
    if (removed > 0) {
      const after = await User.findOneAndUpdate({ _id: payment.userId, creditBalance: { $gte: removed } }, { $inc: { creditBalance: -removed } }, { new: true, projection: { creditBalance: 1 } });
      if (after) {
        await CreditTransaction.create({
          userId: payment.userId, type: "deduct", reason: "purchase-refund", amount: -removed,
          balanceAfter: after.creditBalance, note: `Refund of payment ${payment._id}`, createdBy: actor,
        });
      } else removed = 0;
    }
  }
  await payment.save();
  return { payment, creditsRemoved: removed };
}

// ---- Reports ----
export const REVENUE_RANGES = { 7: "day", 30: "day", 90: "week", 365: "month" };

function utcDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// The start of the day, week (Monday) or month a date falls in.
function bucketStart(date, bucket) {
  const d = utcDay(date);
  if (bucket === "week") d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  if (bucket === "month") d.setUTCDate(1);
  return d;
}

function nextBucket(date, bucket) {
  const d = new Date(date);
  if (bucket === "day") d.setUTCDate(d.getUTCDate() + 1);
  if (bucket === "week") d.setUTCDate(d.getUTCDate() + 7);
  if (bucket === "month") d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

const key = (date) => date.toISOString().slice(0, 10);

function summarise(payments, refunds) {
  const gross = payments.reduce((sum, p) => sum + p.amount, 0);
  const refunded = refunds.reduce((sum, p) => sum + p.refundedAmount, 0);
  const fees = payments.reduce((sum, p) => sum + (p.fee || 0), 0);
  return {
    gross,
    refunds: refunded,
    fees,
    net: gross - refunded - fees,
    payments: payments.length,
    customers: new Set(payments.map((p) => String(p.userId))).size,
    averageOrder: payments.length ? Math.round(gross / payments.length) : 0,
    creditsSold: payments.reduce((sum, p) => sum + p.credits, 0),
  };
}

// Everything for the Revenue screen: totals against the previous period,
// a series by day, week or month, the split by package and method, and how
// AI credits were sold, given away and used.
export async function revenueReport({ days = 30, bucket } = {}) {
  days = REVENUE_RANGES[days] ? days : 30;
  bucket = ["day", "week", "month"].includes(bucket) ? bucket : REVENUE_RANGES[days];
  const end = new Date();
  const start = new Date(utcDay(end).getTime() - (days - 1) * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  const counted = { status: { $in: ["paid", "refunded"] } };
  const fields = { userId: 1, amount: 1, fee: 1, credits: 1, packageId: 1, packageName: 1, method: 1, paidAt: 1, refundedAmount: 1, refundedAt: 1 };

  const [current, previous, refundsNow, refundsBefore, firstPaid, lifetime, ledger, outstanding] = await Promise.all([
    Payment.find({ ...counted, paidAt: { $gte: start } }, fields).lean(),
    Payment.find({ ...counted, paidAt: { $gte: prevStart, $lt: start } }, fields).lean(),
    Payment.find({ status: "refunded", refundedAt: { $gte: start } }, fields).lean(),
    Payment.find({ status: "refunded", refundedAt: { $gte: prevStart, $lt: start } }, fields).lean(),
    Payment.aggregate([{ $match: counted }, { $group: { _id: "$userId", first: { $min: "$paidAt" } } }, { $match: { first: { $gte: start } } }, { $count: "n" }]),
    Payment.aggregate([{ $match: counted }, { $group: { _id: null, gross: { $sum: "$amount" }, refunds: { $sum: "$refundedAmount" }, fees: { $sum: "$fee" }, payments: { $sum: 1 }, customers: { $addToSet: "$userId" } } }]),
    CreditTransaction.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { type: "$type", reason: "$reason" }, total: { $sum: "$amount" } } }]),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$creditBalance" } } }]),
  ]);

  const series = [];
  const index = new Map();
  for (let at = bucketStart(start, bucket); at <= end; at = nextBucket(at, bucket)) {
    const row = { date: key(at), revenue: 0, refunds: 0, payments: 0 };
    index.set(row.date, row);
    series.push(row);
  }
  for (const p of current) {
    const row = index.get(key(bucketStart(p.paidAt, bucket)));
    if (row) { row.revenue += p.amount; row.payments += 1; }
  }
  for (const p of refundsNow) {
    const row = index.get(key(bucketStart(p.refundedAt, bucket)));
    if (row) row.refunds += p.refundedAmount;
  }

  const group = (by, label) => {
    const map = new Map();
    for (const p of current) {
      const id = by(p);
      const row = map.get(id) || { id, label: label(p), revenue: 0, payments: 0 };
      row.revenue += p.amount;
      row.payments += 1;
      map.set(id, row);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  };

  const sumLedger = (match) => ledger.filter((r) => match(r._id)).reduce((sum, r) => sum + r.total, 0);
  const life = lifetime[0];
  return {
    days,
    bucket,
    currency: "PKR",
    current: { ...summarise(current, refundsNow), newCustomers: firstPaid[0]?.n || 0 },
    previous: summarise(previous, refundsBefore),
    series,
    byPackage: group((p) => p.packageId || "custom", (p) => p.packageName || "Custom amount"),
    byMethod: group((p) => p.method, (p) => p.method),
    credits: {
      sold: sumLedger((id) => id.reason === "purchase"),
      free: sumLedger((id) => ["welcome-grant", "admin-grant"].includes(id.reason) || (id.reason === "admin-adjust" && id.type === "grant")),
      used: -sumLedger((id) => id.type === "spend") - sumLedger((id) => id.type === "refund" && id.reason !== "purchase"),
      outstanding: outstanding[0]?.total || 0,
    },
    lifetime: {
      net: life ? life.gross - life.refunds - life.fees : 0,
      payments: life?.payments || 0,
      customers: life?.customers.length || 0,
    },
    // No processor is connected yet; payments are recorded by an admin.
    provider: { connected: false, name: "" },
  };
}

const PAGE_SIZE = 25;

export async function listPayments({ status, q, page = 1 } = {}) {
  const filter = {};
  if (["pending", "paid", "failed", "refunded"].includes(status)) filter.status = status;
  const term = typeof q === "string" ? q.trim().slice(0, 80) : "";
  if (term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({ $or: [{ email: { $regex: escaped, $options: "i" } }, { fullName: { $regex: escaped, $options: "i" } }] }, { _id: 1 }).limit(200).lean();
    filter.$or = [{ userId: { $in: users.map((u) => u._id) } }, { providerRef: { $regex: escaped, $options: "i" } }];
  }
  page = Math.max(1, Math.min(1000, Number.parseInt(page, 10) || 1));
  const [rows, total] = await Promise.all([
    Payment.find(filter).sort({ paidAt: -1, createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).populate("userId", "email fullName").lean(),
    Payment.countDocuments(filter),
  ]);
  return { payments: rows.map(paymentDto), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function paymentDto(p) {
  const user = p.userId && typeof p.userId === "object" && "email" in p.userId ? p.userId : null;
  return {
    id: p._id,
    userId: user?._id || p.userId,
    email: user?.email || "Deleted account",
    name: user?.fullName || "",
    amount: p.amount,
    currency: p.currency,
    fee: p.fee,
    credits: p.credits,
    packageName: p.packageName || "Custom amount",
    status: p.status,
    method: p.method,
    provider: p.provider,
    reference: p.providerRef,
    paidAt: p.paidAt,
    refundedAt: p.refundedAt,
    note: p.note,
    recordedBy: p.recordedBy,
  };
}

const csvCell = (value) => {
  const text = value == null ? "" : String(value);
  // Leading = + - @ would run as a formula in a spreadsheet.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Every payment as a spreadsheet, newest first.
export async function paymentsCsv() {
  const rows = await Payment.find().sort({ paidAt: -1 }).limit(50_000).populate("userId", "email fullName").lean();
  const header = ["Date paid", "Email", "Name", "Package", "Amount", "Currency", "Fee", "AI credits", "Method", "Provider", "Reference", "Status", "Refunded", "Refunded on", "Note", "Recorded by"];
  const lines = rows.map((p) => {
    const d = paymentDto(p);
    return [d.paidAt?.toISOString().slice(0, 10), d.email, d.name, d.packageName, d.amount, d.currency, d.fee, d.credits, d.method, d.provider, d.reference, d.status, p.refundedAmount || 0, d.refundedAt?.toISOString().slice(0, 10), d.note, d.recordedBy];
  });
  return [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\n");
}

export const isPaymentId = (id) => mongoose.isObjectIdOrHexString(id);
