import { useEffect, useState } from "react";
import { getCurrentUser, getSiteConfig } from "./api";

// What the admin has switched on: visible sections, the AI patient, signups,
// and live announcements. Fetched once per page load and shared by every
// component; the admin screens call refreshSite() after saving.
const DEFAULT_SITE = {
  sections: {},
  aiPatient: true,
  signupsOpen: true,
  announcements: [],
  loaded: false,
};

let site = DEFAULT_SITE;
let request = null;
const listeners = new Set();

function publish(next) {
  site = next;
  for (const listener of listeners) listener(site);
}

export function refreshSite() {
  request = getSiteConfig()
    .then((data) => publish({ ...DEFAULT_SITE, ...data, loaded: true }))
    .catch(() => publish({ ...site, loaded: true }));
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

// A section is open unless the admin turned it off. Admins always see
// everything so they can check content before reopening a section.
export function sectionOpen(currentSite, key, user = getCurrentUser()) {
  if (user?.role === "admin") return true;
  return currentSite.sections?.[key] !== false;
}
