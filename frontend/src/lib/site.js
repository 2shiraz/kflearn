import { useEffect, useState } from "react";
import { getCurrentUser, getSiteConfig } from "./api";

// What the admin has switched on: visible sections, the AI patient, signups,
// and live announcements. The server sends the switches with every sign-in
// and they are cached, so the first screen already hides what's switched off
// (no flash). Each page load revalidates them in the background.
const CACHE_KEY = "kf_site";
const DEFAULT_SITE = {
  sections: {},
  aiPatient: true,
  signupsOpen: true,
  requireSubscription: false,
  watermark: false,
  announcements: [],
  // The account's monthly access: { required, unlimited, active, inGrace,
  // hasAccess, until, graceUntil, graceDays }. Worked out by the server; this
  // copy only decides what the screens show.
  access: null,
  loaded: false,
};

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cached ? { ...DEFAULT_SITE, ...cached, loaded: true } : null;
  } catch {
    return null;
  }
}

let site = readCache() || DEFAULT_SITE;
let request = null;
const listeners = new Set();

function publish(next) {
  site = next;
  try {
    const { loaded: _loaded, ...rest } = next;
    localStorage.setItem(CACHE_KEY, JSON.stringify(rest));
  } catch {
    // Storage blocked: still correct for this visit.
  }
  for (const listener of listeners) listener(site);
}

// Called by api.js with the switches that come back from sign-in and /me.
export function storeSite(next) {
  if (next && typeof next === "object") publish({ ...site, ...next, loaded: true });
}

export function clearSite() {
  site = DEFAULT_SITE;
  request = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Nothing cached.
  }
}

export function refreshSite() {
  request = getSiteConfig()
    .then((data) => publish({ ...DEFAULT_SITE, ...data, loaded: true }))
    .catch(() => {
      if (!site.loaded) publish({ ...site, loaded: true });
    });
  return request;
}

export function useSite() {
  const [value, setValue] = useState(site);
  useEffect(() => {
    listeners.add(setValue);
    if (!request && getCurrentUser()) refreshSite();
    else setValue(site);
    return () => listeners.delete(setValue);
  }, []);
  return value;
}

// Whether the account can open the study material. Admins and contributors
// always can. Until the status is known it counts as locked, so nothing
// appears and then disappears.
export function accessOpen(currentSite, user = getCurrentUser()) {
  if (["admin", "contributor"].includes(user?.role)) return true;
  if (!currentSite.loaded) return false;
  if (!currentSite.access) return !currentSite.requireSubscription;
  return currentSite.access.hasAccess !== false;
}

// The server answered "subscription required" (the pass ended while the page
// was open): lock straight away, then fetch the real status.
export function markAccessLost() {
  if (site.access) publish({ ...site, access: { ...site.access, hasAccess: false, active: false, inGrace: false } });
  request = null;
  refreshSite();
}

// A section is open unless the admin turned it off. Until the switches are
// known it counts as closed, so nothing appears and then disappears. Admins
// always see everything so they can check content before reopening it.
export function sectionOpen(currentSite, key, user = getCurrentUser()) {
  if (user?.role === "admin") return true;
  if (!currentSite.loaded) return false;
  return currentSite.sections?.[key] !== false;
}
