import { isPaymentId, listPayments, paymentDto, paymentsCsv, recordManualPayment, refundPayment, revenueReport } from "../services/payment.service.js";

// Revenue reports and the payments ledger for the admin console.
export async function getRevenue(req, res) {
  const data = await revenueReport({ days: Number(req.query.days), bucket: req.query.bucket });
  res.json({ success: true, data });
}

export async function getPayments(req, res) {
  res.json({ success: true, data: await listPayments(req.query) });
}

export async function exportPayments(req, res) {
  const csv = await paymentsCsv();
  res.set({
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    "Cache-Control": "no-store",
  });
  res.send(csv);
}

export async function createPayment(req, res) {
  const payment = await recordManualPayment(req.body || {}, req.user.email || req.user.id);
  await payment.populate("userId", "email fullName");
  res.status(201).json({ success: true, data: { payment: paymentDto(payment.toObject()) } });
}

export async function refundPaymentHandler(req, res) {
  if (!isPaymentId(req.params.id)) {
    const error = new Error("Payment not found.");
    error.status = 404;
    throw error;
  }
  const { payment, creditsRemoved, accessRevoked } = await refundPayment(req.params.id, { removeCredits: req.body?.removeCredits === true, note: req.body?.note }, req.user.email || req.user.id);
  await payment.populate("userId", "email fullName");
  res.json({ success: true, data: { payment: paymentDto(payment.toObject()), creditsRemoved, accessRevoked } });
}
