import { creditPricing, getBalance, listTransactions } from "../services/credit.service.js";

export async function getCredits(req, res) {
  res.json({ success: true, data: { balance: await getBalance(req.user.id), ...creditPricing() } });
}

export async function getCreditTransactions(req, res) {
  res.json({ success: true, data: await listTransactions(req.user.id) });
}
