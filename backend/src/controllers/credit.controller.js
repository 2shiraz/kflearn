import { creditPricing, getBalance, listTransactions, publicCreditPackages, publicPricing } from "../services/credit.service.js";
import { getPublicStats } from "../services/publicStats.service.js";

export async function getCredits(req, res) {
  res.json({ success: true, data: { balance: await getBalance(req.user.id), ...(await creditPricing()) } });
}

export async function getCreditTransactions(req, res) {
  res.json({ success: true, data: await listTransactions(req.user.id) });
}

export async function getPublicCreditPackages(req, res) {
  res.json({ success: true, data: { packages: await publicCreditPackages() } });
}

// Prices change rarely and only by an admin, so a minute of caching is safe.
export async function getPublicPricing(req, res) {
  res.set("Cache-Control", "public, max-age=60");
  res.json({ success: true, data: await publicPricing() });
}

// Counts for the public pages. Browsers keep it 5 minutes, a CDN an hour, and
// either may serve a stale copy for a day while it refreshes in the background.
export async function getPublicStatsHandler(req, res) {
  res.set("Cache-Control", "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400");
  res.json({ success: true, data: await getPublicStats() });
}
