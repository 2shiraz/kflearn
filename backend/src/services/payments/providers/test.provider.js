import crypto from "node:crypto";
import { env } from "../../../config/env.js";

// A pretend payment provider for trying checkout end to end without real
// money. It behaves like a real one: the student is sent to a payment page
// (here a page on this site), and the result comes back as a signed
// notification that goes through exactly the same checks as a real provider's.
const SIGNATURE_HEADER = "x-test-signature";
const TOLERANCE_SECONDS = 5 * 60;

const hmac = (payload) => crypto.createHmac("sha256", env.paymentTestSecret).update(payload).digest("hex");

export const testProvider = {
  name: "test",
  label: "Test payments",
  isTest: true,

  // Called when a student starts checkout.
  async createCheckout(checkout) {
    return {
      providerRef: `test_${checkout._id}`,
      redirectUrl: `${env.frontendUrl}/checkout/test/${checkout._id}`,
    };
  },

  // Builds the signed notification the provider would send us.
  buildEvent(checkout, outcome) {
    const body = JSON.stringify({
      id: `evt_${crypto.randomBytes(12).toString("hex")}`,
      type: outcome === "paid" ? "payment.succeeded" : "payment.failed",
      created: Math.floor(Date.now() / 1000),
      data: { reference: checkout.providerRef, checkoutId: String(checkout._id), amount: checkout.amount, currency: checkout.currency },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    return { rawBody: Buffer.from(body), headers: { [SIGNATURE_HEADER]: `t=${timestamp},v1=${hmac(`${timestamp}.${body}`)}` } };
  },

  // Checks the signature and its age, then reads the event. Throws if
  // anything is off.
  verifyWebhook({ rawBody, headers }) {
    const header = String(headers[SIGNATURE_HEADER] || "");
    const parts = Object.fromEntries(header.split(",").map((p) => p.split("=").map((s) => s.trim())));
    const timestamp = Number(parts.t);
    if (!parts.v1 || !Number.isFinite(timestamp)) throw new Error("Missing signature.");
    if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) throw new Error("Signature too old.");
    const expected = Buffer.from(hmac(`${timestamp}.${rawBody.toString("utf8")}`), "hex");
    const given = Buffer.from(parts.v1, "hex");
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw new Error("Bad signature.");
    const event = JSON.parse(rawBody.toString("utf8"));
    return {
      eventId: String(event.id || ""),
      status: event.type === "payment.succeeded" ? "paid" : event.type === "payment.failed" ? "failed" : "ignored",
      providerRef: String(event.data?.reference || ""),
      checkoutId: String(event.data?.checkoutId || ""),
      amount: Number(event.data?.amount),
      currency: String(event.data?.currency || ""),
    };
  },
};
