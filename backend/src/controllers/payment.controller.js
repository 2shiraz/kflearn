import { completeTestCheckout, getOwnCheckout, handleWebhook, paymentOptions, startCheckout } from "../services/checkout.service.js";

export async function getPaymentOptions(req, res) {
  res.json({ success: true, data: await paymentOptions() });
}

export async function createCheckout(req, res) {
  res.status(201).json({ success: true, data: await startCheckout(req.user, req.body || {}) });
}

export async function getCheckout(req, res) {
  res.json({ success: true, data: { checkout: await getOwnCheckout(req.user, req.params.id) } });
}

export async function testCompleteCheckout(req, res) {
  res.json({ success: true, data: { checkout: await completeTestCheckout(req.user, req.params.id, req.body?.outcome) } });
}

// Public: the payment provider calls this. Authenticated by its signature,
// checked against the exact bytes it sent.
export async function receiveWebhook(req, res) {
  const result = await handleWebhook(req.params.provider, { rawBody: req.rawBody, headers: req.headers });
  res.json({ success: true, data: result });
}
