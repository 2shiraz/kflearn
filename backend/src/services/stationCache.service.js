import { env } from "../config/env.js";
import { OsceStation } from "../models/OsceStation.js";

// Published OSCE stations change rarely but are read on every station page and
// every AI patient message, so their loaded documents are kept in memory.
// Admin changes clear it straight away (see clearStationCacheOnWrite); the
// 5 minute limit covers changes made outside this process, such as seed
// scripts or a second server. Cached documents are shared: read them, never
// change or save them.
const MAX_ENTRIES = 500;
// The test suite rebuilds the database between tests, so nothing is kept
// there unless a test turns it on.
let ttlMs = env.nodeEnv === "test" ? 0 : 5 * 60 * 1000;

export function setStationCacheTtl(ms) {
  ttlMs = ms;
  invalidateStationCache();
}

let generation = 0;
const entries = new Map();

export function remember(key, load) {
  const hit = entries.get(key);
  if (hit && hit.generation === generation && Date.now() - hit.at < ttlMs) return hit.promise;
  const entry = { at: Date.now(), generation, promise: null };
  // A failed or missing load isn't kept, so the next request tries again.
  entry.promise = load().then((value) => {
    if (value == null && entries.get(key) === entry) entries.delete(key);
    return value;
  }, (error) => {
    if (entries.get(key) === entry) entries.delete(key);
    throw error;
  });
  if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
  entries.set(key, entry);
  return entry.promise;
}

export function invalidateStationCache() {
  generation += 1;
  entries.clear();
}

// Only what the station list shows (stationListDto), not the full scripts,
// notes and checklists.
export const LIST_FIELDS = "title slug presentingComplaint specialtyId difficulty status timeLimitSeconds shortDescription taskTags stationType stationFormat category practiceModes updatedAt";

export function publishedStationList() {
  return remember("list", () => OsceStation.find({ status: "published" })
    .select(LIST_FIELDS)
    .populate("specialtyId", "name slug")
    .sort({ updatedAt: -1 }));
}

// Clears the cache around any admin change to stations: once when the change
// arrives and again when it has finished, so a read in between can't leave
// the old version cached.
export function clearStationCacheOnWrite(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  invalidateStationCache();
  res.on("finish", invalidateStationCache);
  return next();
}
