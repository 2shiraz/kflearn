import { useEffect, useState } from "react";

// Site name, browser title, search description, theme colour, logo and
// favicon, set
// by the admin. The last known branding is cached so it is applied before
// the first paint (no flash of the default look), then refreshed.
const CACHE_KEY = "kf_public_site";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const ACCENTS = {
  indigo: { label: "Indigo", accent: "#3B3FD8", strong: "#2C30B8", soft: "#E3E5FF" },
  blue: { label: "Blue", accent: "#1F6FEB", strong: "#1858C4", soft: "#DCEAFE" },
  teal: { label: "Teal", accent: "#0F7F86", strong: "#0B666C", soft: "#D3F0F0" },
  emerald: { label: "Emerald", accent: "#0E8A5F", strong: "#0A6E4B", soft: "#D7F3E6" },
  rose: { label: "Rose", accent: "#C8325D", strong: "#A6264B", soft: "#FCE1E8" },
  violet: { label: "Violet", accent: "#7036E0", strong: "#5B27C0", soft: "#ECE3FD" },
  slate: { label: "Slate", accent: "#334155", strong: "#1E293B", soft: "#E2E8F0" },
};

export const DEFAULT_BRANDING = {
  siteName: "KF LearnSmart",
  metaTitle: "KF LearnSmart",
  metaDescription: "",
  accent: "indigo",
  logoVersion: 0,
  faviconVersion: 0,
};

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || null;
  } catch {
    return null;
  }
}

let publicSite = readCache() || { signupsOpen: null, passwordReset: false, branding: DEFAULT_BRANDING };
const listeners = new Set();

export function logoUrl(branding) {
  return branding?.logoVersion ? `${API_BASE}/public/logo?v=${branding.logoVersion}` : "/logo.svg";
}

export function faviconUrl(branding) {
  return branding?.faviconVersion ? `${API_BASE}/public/favicon?v=${branding.faviconVersion}` : "/favicon.svg";
}

// Points the tab icons at the admin's favicon, or back at the built-in ones.
function setFavicon(branding) {
  for (const link of document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')) {
    if (!link.dataset.defaultHref) {
      link.dataset.defaultHref = link.getAttribute("href");
      link.dataset.defaultType = link.getAttribute("type") || "";
    }
    if (branding.faviconVersion) {
      link.setAttribute("href", faviconUrl(branding));
      link.removeAttribute("type");
    } else {
      link.setAttribute("href", link.dataset.defaultHref);
      if (link.dataset.defaultType) link.setAttribute("type", link.dataset.defaultType);
    }
  }
}

function setMeta(name, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

// Writes the branding into the page: a <style> override for the accent
// tokens, the title, description and theme-color.
export function applyBranding(branding = DEFAULT_BRANDING) {
  const accent = ACCENTS[branding.accent] || ACCENTS.indigo;
  let style = document.getElementById("brand-accent");
  if (!style) {
    style = document.createElement("style");
    style.id = "brand-accent";
    document.head.appendChild(style);
  }
  style.textContent = `.site{--s-accent:${accent.accent};--s-accent-strong:${accent.strong};--s-accent-soft:${accent.soft};}`;
  if (branding.metaTitle) document.title = branding.metaTitle;
  setMeta("description", branding.metaDescription);
  setMeta("theme-color", accent.accent);
  setFavicon(branding);
}

function publish(next) {
  publicSite = next;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: branding still applies for this visit.
  }
  applyBranding(next.branding);
  for (const listener of listeners) listener(next);
}

export function refreshPublicSite() {
  return fetch(`${API_BASE}/public/site`, { credentials: "include" })
    .then((res) => res.json())
    .then((json) => {
      if (json?.data) publish({ signupsOpen: json.data.signupsOpen !== false, passwordReset: json.data.passwordReset === true, branding: { ...DEFAULT_BRANDING, ...json.data.branding } });
    })
    .catch(() => {});
}

// Called once from main.jsx before React renders.
export function bootBranding() {
  applyBranding(publicSite.branding);
  refreshPublicSite();
}

export function usePublicSite() {
  const [value, setValue] = useState(publicSite);
  useEffect(() => {
    listeners.add(setValue);
    setValue(publicSite);
    return () => listeners.delete(setValue);
  }, []);
  return value;
}

export function useBranding() {
  return usePublicSite().branding || DEFAULT_BRANDING;
}

// The site name as set by the admin, for headers and footers.
export function SiteName() {
  return useBranding().siteName;
}
