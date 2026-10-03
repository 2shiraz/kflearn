import { creditPricing, getBalance, listTransactions, publicCreditPackages } from "../services/credit.service.js";

export async function getCredits(req, res) {
  res.json({ success: true, data: { balance: await getBalance(req.user.id), ...(await creditPricing()) } });
}

export async function getCreditTransactions(req, res) {
  res.json({ success: true, data: await listTransactions(req.user.id) });
}

export async function getPublicCreditPackages(req, res) {
  res.json({ success: true, data: { packages: await publicCreditPackages() } });
}
