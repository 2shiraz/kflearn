import mongoose from "mongoose";
import { AdminAuditLog } from "../models/AdminAuditLog.js";
import { Checkout } from "../models/Checkout.js";
import { User } from "../models/User.js";
import { WebhookEvent } from "../models/WebhookEvent.js";
import { accessUntil } from "./access.service.js";
import { getBranding, getPricing, getSiteSettings } from "./siteSettings.service.js";
import { recordProviderPayment, SUBSCRIPTION_PACKAGE_ID } from "./payment.service.js";
import { getProvider } from "./payments/providers/index.js";
import { sendEmail } from "./email/index.js";
import { receiptEmail } from "./email/templates.js";

const CHECKOUT_TTL_MS = 30 * 60 * 1000;
const MAX_OPEN_CHECKOUTS_PER_HOUR = 6;

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

// What a student can pay for online right now. Online payments need both a
// configured provider and the admin's "Online payments" switch.
export async function paymentOptions() {
  const [provider, site, pricing] = await Promise.all([getProvider(), getSiteSettings(), getPricing()]);
  const enabled = Boolean(provider && site.onlinePayments);
  return {
    enabled,
    test: Boolean(enabled && provider.isTest),
    plan: { pricePkr: pricing.subscription.pricePkr, periodDays: pricing.subscription.periodDays },
    packages: pricing.packages.map(({ id, name, credits, pricePkr }) => ({ id, name, credits, pricePkr })),
  };
}

export function checkoutDto(c) {
  return {
    id: c._id,
    kind: c.kind,
    packageName: c.packageName,
    amount: c.amount,
    currency: c.currency,
    credits: c.credits,
    accessDays: c.accessDays,
    status: c.status === "review" ? "pending" : c.status,
    createdAt: c.createdAt,
    completedAt: c.completedAt || null,
  };
}

// Starts checkout. The price, credits and days always come from the server's
// own pricing, never from the browser.
export async function startCheckout(user, { item } = {}) {
  const provider = getProvider();
  const site = await getSiteSettings();
  if (!provider || !site.onlinePayments) throw httpError(409, "Online payment isn't available right now.", "PAYMENTS_OFF");

  const pricing = await getPricing();
  let order;
  if (item === SUBSCRIPTION_PACKAGE_ID) {
    order = { kind: "subscription", packageId: SUBSCRIPTION_PACKAGE_ID, packageName: "Monthly access", amount: pricing.subscription.pricePkr, accessDays: pricing.subscription.periodDays, credits: 0 };
  } else {
    const pkg = pricing.packages.find((p) => p.id === item);
    if (!pkg) throw httpError(400, "Choose something to buy.");
    order = { kind: "credits", packageId: pkg.id, packageName: pkg.name, amount: pkg.pricePkr, credits: pkg.credits, accessDays: 0 };
  }
  if (!Number.isSafeInteger(order.amount) || order.amount < 1) throw httpError(409, "This item can't be bought online.");

  const recent = await Checkout.countDocuments({ userId: user.id, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } });
  if (recent >= MAX_OPEN_CHECKOUTS_PER_HOUR) throw httpError(429, "Too many checkouts started. Please wait a while and try again.", "RATE_LIMITED");

  const checkout = await Checkout.create({ ...order, userId: user.id, currency: "PKR", provider: provider.name, expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS) });
  try {
    const { providerRef, redirectUrl } = await provider.createCheckout(checkout);
    checkout.providerRef = providerRef;
    await checkout.save();
    return { checkout: checkoutDto(checkout), redirectUrl };
  } catch (error) {
    checkout.status = "failed";
    checkout.failureReason = "Could not start the payment.";
    await checkout.save();
    console.error("Checkout failed to start:", error.message);
    throw httpError(502, "We couldn't reach the payment provider. Please try again.");
  }
}

export async function getOwnCheckout(user, id) {
  if (!mongoose.isObjectIdOrHexString(id)) throw httpError(404, "Checkout not found.");
  const checkout = await Checkout.findOne({ _id: id, userId: user.id });
  if (!checkout) throw httpError(404, "Checkout not found.");
  if (checkout.status === "pending" && checkout.expiresAt < new Date()) {
    checkout.status = "expired";
    await checkout.save();
  }
  return checkoutDto(checkout);
}

async function flagForReview(checkout, reason) {
  await Checkout.updateOne({ _id: checkout._id }, { $set: { status: "review", failureReason: reason.slice(0, 200) } });
  // Shows in the admin activity log. The reason itself is on the checkout.
  await AdminAuditLog.create({
    actorId: `provider:${checkout.provider}`,
    action: "Online payment held for review",
    target: `checkout ${checkout._id} (account ${checkout.userId})`.slice(0, 200),
    fields: ["amount"],
  }).catch((error) => console.error("Could not log payment review:", error.message));
}

async function sendReceipt(checkout, payment) {
  const [user, branding, until] = await Promise.all([
    User.findById(checkout.userId).select("email fullName").lean(),
    getBranding(),
    checkout.kind === "subscription" ? accessUntil(checkout.userId) : null,
  ]);
  if (!user) return;
  await sendEmail({
    to: user.email,
    ...receiptEmail({ name: user.fullName, item: checkout.packageName, amount: payment.amount, currency: payment.currency, paidAt: payment.paidAt, until, credits: checkout.credits, siteName: branding.siteName }),
  });
}

// A notification from the payment provider. Every check must pass before
// anything is granted:
//   1. it comes from the provider in use, and its signature is valid and fresh
//   2. it hasn't been processed before (event id)
//   3. it matches a checkout of ours, by both id and provider reference
//   4. the amount and currency are exactly what the server asked for
// Returns { outcome } for logging; the provider always gets a 200 for events
// we've understood, so it stops retrying.
export async function handleWebhook(providerName, { rawBody, headers }) {
  const provider = getProvider();
  if (!provider || provider.name !== providerName) throw httpError(404, "Not found.");
  let event;
  try {
    event = provider.verifyWebhook({ rawBody: rawBody || Buffer.alloc(0), headers });
  } catch (error) {
    console.warn(`Rejected ${providerName} notification: ${error.message}`);
    throw httpError(400, "Invalid signature.");
  }
  if (!event.eventId) throw httpError(400, "Missing event id.");

  try {
    await WebhookEvent.create({ provider: provider.name, eventId: event.eventId, checkoutId: event.checkoutId });
  } catch (error) {
    if (error.code === 11000) return { outcome: "duplicate" };
    throw error;
  }
  const record = (outcome) => WebhookEvent.updateOne({ provider: provider.name, eventId: event.eventId }, { $set: { outcome } }).then(() => ({ outcome }));

  if (event.status === "ignored") return record("ignored");
  if (!mongoose.isObjectIdOrHexString(event.checkoutId)) return record("unknown-checkout");
  const checkout = await Checkout.findOne({ _id: event.checkoutId, provider: provider.name, providerRef: event.providerRef });
  if (!checkout) return record("unknown-checkout");
  if (checkout.status === "paid") return record("already-paid");

  if (event.status === "failed") {
    await Checkout.updateOne({ _id: checkout._id, status: { $in: ["pending", "expired"] } }, { $set: { status: "failed", failureReason: "Declined by the payment provider.", completedAt: new Date() } });
    return record("failed");
  }

  if (event.amount !== checkout.amount || event.currency !== checkout.currency) {
    await flagForReview(checkout, `amount ${event.currency} ${event.amount} doesn't match ${checkout.currency} ${checkout.amount}`);
    return record("amount-mismatch");
  }

  // Claim the checkout before granting, so two deliveries racing each other
  // can't both grant. A payment that arrives after the checkout expired is
  // still honoured: the money was taken.
  const claimed = await Checkout.findOneAndUpdate(
    { _id: checkout._id, status: { $in: ["pending", "expired", "failed"] } },
    { $set: { status: "paid", completedAt: new Date() } },
    { new: true },
  );
  if (!claimed) return record("already-paid");
  try {
    const payment = await recordProviderPayment(claimed);
    await Checkout.updateOne({ _id: claimed._id }, { $set: { paymentId: payment._id } });
    sendReceipt(claimed, payment).catch(() => {});
  } catch (error) {
    await Checkout.updateOne({ _id: claimed._id }, { $set: { status: "pending", completedAt: null } });
    await WebhookEvent.deleteOne({ provider: provider.name, eventId: event.eventId });
    throw error;
  }
  return record("paid");
}

// Test mode only: the pretend provider's payment page reports the result as
// a signed notification through handleWebhook, exactly like a real provider.
export async function completeTestCheckout(user, id, outcome) {
  const provider = getProvider();
  if (!provider?.isTest) throw httpError(404, "Not found.");
  if (!["paid", "failed"].includes(outcome)) throw httpError(400, "Choose pay or decline.");
  if (!mongoose.isObjectIdOrHexString(id)) throw httpError(404, "Checkout not found.");
  const checkout = await Checkout.findOne({ _id: id, userId: user.id });
  if (!checkout) throw httpError(404, "Checkout not found.");
  if (checkout.status !== "pending") return checkoutDto(checkout);
  await handleWebhook(provider.name, provider.buildEvent(checkout, outcome));
  return checkoutDto(await Checkout.findById(id));
}
