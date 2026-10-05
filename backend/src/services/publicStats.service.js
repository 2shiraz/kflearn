import { OsceStation } from "../models/OsceStation.js";
import { contentCounts } from "./content.service.js";

// Counts and names for the public pages (landing, features, pricing, about,
// sign in). Never question text, answers or guide content. Worked out once
// and kept in memory for 10 minutes, or until station content changes.
const TTL_MS = 10 * 60 * 1000;

let cached = null;
let cachedAt = 0;
let pending = null;

async function build() {
  const [summary, osceStations] = await Promise.all([contentCounts(), OsceStation.countDocuments({ status: "published" })]);
  return {
    mcq: summary.mcq,
    ospe: summary.ospe,
    osce: { total: osceStations },
    examGuides: summary.examGuides,
    historyGuides: summary.historyGuides,
    handouts: summary.handouts,
  };
}

export async function getPublicStats() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  // One rebuild at a time, however many visitors arrive together.
  pending ??= build()
    .then((stats) => {
      cached = stats;
      cachedAt = Date.now();
      return stats;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

// Called when published content changes, so the next visit sees new counts.
export function invalidatePublicStats() {
  cached = null;
  cachedAt = 0;
}
