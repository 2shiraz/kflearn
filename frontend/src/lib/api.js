const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Real authentication is the httpOnly session cookie the server sets on
// login/register — the browser attaches it to every request automatically,
// including from a freshly opened tab, which is what makes sessions survive
// new tabs. `kf_user` below is just a cached copy of the profile for instant,
// synchronous UI reads (e.g. "is anyone logged in?" on first render); it is
// stored in localStorage (shared across tabs) rather than sessionStorage
// (per-tab, which was the cause of the "new tab signs me out" bug) and is
// never treated as a credential — every server request is re-authorized from
// the cookie regardless of what this cache says.
const SESSION_KEY = "kf_user";
const CSRF_KEY = "kf_csrf";
const LEGACY_SESSION_KEY = "kf_mock_user";
const LEGACY_TOKEN_KEY = "kf_auth_token";

export const ROLE_OPTIONS = [
  "MBBS Student",
  "FCPS Candidate",
  "MCPS Candidate",
  "Postgraduate Resident",
  "Other Medical Learner",
];

export const YEAR_LEVEL_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Final Year",
  "House Job",
  "Graduate",
  "Postgraduate Trainee",
];

// Tells mounted UI (sidebar, top bar) that the cached user changed, e.g. a new
// avatar or name saved from Settings.
export const USER_EVENT = "kf:user";

function storeUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new window.Event(USER_EVENT));
}

function clearLegacySessionStorage() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function saveAuthSession(data) {
  clearLegacySessionStorage();
  if (data?.user) storeUser(data.user);
  if (data?.csrfToken) localStorage.setItem(CSRF_KEY, data.csrfToken);
  return data;
}

export function getCurrentUser() {
  clearLegacySessionStorage();
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    logout();
    return null;
  }
}

function getCsrfToken() {
  const stored = localStorage.getItem(CSRF_KEY);
  if (stored) return stored;
  const match = document.cookie.match(/(?:^|;\s*)(?:__Host-)?XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function logout() {
  const csrfToken = getCsrfToken();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CSRF_KEY);
  clearLegacySessionStorage();
  // Best-effort: ask the server to clear the httpOnly cookie too (it can't be
  // cleared from JS). `keepalive` lets the request finish even though callers
  // redirect the page away immediately after calling logout().
  fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "X-XSRF-Token": csrfToken },
  }).catch(() => {});
}

export async function registerRequest({ fullName, email, password, roleLabel, profile }) {
  const data = await publicFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, roleLabel, profile }),
  });
  return saveAuthSession(data);
}

export async function loginRequest({ email, password }) {
  const data = await publicFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return saveAuthSession(data);
}

export async function fetchCurrentUser() {
  const data = await apiFetch("/auth/me");
  if (data?.user) storeUser(data.user);
  if (data?.csrfToken) localStorage.setItem(CSRF_KEY, data.csrfToken);
  return data;
}

export async function updateProfileRequest(payload) {
  const data = await apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (data?.user) storeUser(data.user);
  return data;
}

// Signs out every other session; the server returns a fresh session for this one.
export async function changePasswordRequest({ currentPassword, newPassword }) {
  const data = await apiFetch("/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return saveAuthSession(data);
}

export async function deleteAccountRequest({ password }) {
  await apiFetch("/auth/me/delete", {
    method: "POST",
    body: JSON.stringify({ password, confirmation: "DELETE" }),
  });
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(CSRF_KEY);
  clearLegacySessionStorage();
}

// Ends the first-run welcome tour. The cached user is updated first so the
// tour doesn't come back on the next page even if the request fails.
export function markTourDone() {
  const user = getCurrentUser();
  if (!user?.tourPending) return Promise.resolve();
  storeUser({ ...user, tourPending: false });
  return updateProfileRequest({ tourDone: true }).catch(() => {});
}

export function saveProfileDetails(user, profile) {
  const merged = { ...user, ...profile, profile: { ...(user?.profile || {}), ...profile } };
  localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
  return merged;
}

async function publicFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed.");
  }
  return data.data;
}

async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      // The session itself travels via the httpOnly cookie (sent automatically);
      // this header proves the request came from the frontend for state changes.
      ...(method !== "GET" ? { "X-XSRF-Token": getCsrfToken() } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    logout();
    window.location.href = "/signin";
  }
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || "Request failed.");
    error.status = res.status;
    error.code = data.code;
    throw error;
  }
  return data.data;
}

// Public: credit package names, credits and prices for the pricing page.
export function getPublicCreditPackages() {
  return publicFetch("/public/credit-packages");
}

export function getCredits() {
  return apiFetch("/credits");
}

export function getCreditTransactions() {
  return apiFetch("/credits/transactions");
}

export function listOsceStations() {
  return apiFetch("/osce");
}

export function getDashboardSummary() {
  return apiFetch("/dashboard/summary");
}

export function getOsceStation(slug) {
  return apiFetch(`/osce/${slug}`);
}

export function getSinglePlayerContent(slug) {
  return apiFetch(`/osce/${slug}/single-player`);
}

export function getAiStatus() {
  return apiFetch("/ai/status");
}

export function updateAiStatus(payload) {
  return apiFetch("/ai/status", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createOsceAttempt({ stationId, mode, aiProvider }) {
  return apiFetch("/osce/attempts", {
    method: "POST",
    body: JSON.stringify({ stationId, mode, aiProvider }),
  });
}

export function getOsceAttempt(attemptId) {
  return apiFetch(`/osce/attempts/${attemptId}`);
}

export function listOsceAttempts() {
  return apiFetch("/osce/attempts");
}

export function sendPatientMessage(attemptId, payload) {
  return apiFetch(`/osce/attempts/${attemptId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function endOsceAttempt(attemptId, payload = {}) {
  return apiFetch(`/osce/attempts/${attemptId}/end`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Leaving a station before finishing it deletes the attempt (no history).
export function discardOsceAttempt(attemptId) {
  return apiFetch(`/osce/attempts/${attemptId}/discard`, { method: "POST", body: "{}" });
}

// Same, for when the tab is closing: keepalive lets the request outlive the page.
export function discardOsceAttemptOnExit(attemptId) {
  try {
    fetch(`${API_BASE}/osce/attempts/${attemptId}/discard`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json", "X-XSRF-Token": getCsrfToken() },
      body: "{}",
    }).catch(() => {});
  } catch {
    // Best effort only.
  }
}

export function selfAssessOsceAttempt(attemptId, checkedItemIds, itemScores = []) {
  return apiFetch(`/osce/attempts/${attemptId}/self-assessment`, {
    method: "POST",
    body: JSON.stringify({ checkedItemIds, itemScores }),
  });
}

export function aiAssessOsceAttempt(attemptId) {
  return apiFetch(`/osce/attempts/${attemptId}/ai-assessment`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function transcribeOsceAudio(attemptId, audioBlob) {
  const form = new FormData();
  form.append("audio", audioBlob, "question.webm");
  return apiFetch(`/osce/attempts/${attemptId}/transcribe`, {
    method: "POST",
    body: form,
  });
}

// ---- Site settings (what students can see) ----
export function getSiteConfig() {
  return apiFetch("/site");
}

export function getPublicSite() {
  return publicFetch("/public/site", { method: "GET" });
}

// ---- Admin: settings, pricing, announcements ----
export function getAdminSettings() {
  return apiFetch("/admin/settings");
}

export function updateAdminSite(payload) {
  return apiFetch("/admin/settings/site", { method: "PATCH", body: JSON.stringify(payload) });
}

export function updateAdminPricing(payload) {
  return apiFetch("/admin/settings/pricing", { method: "PATCH", body: JSON.stringify(payload) });
}

export function listAdminAnnouncements() {
  return apiFetch("/admin/announcements");
}

export function createAdminAnnouncement(payload) {
  return apiFetch("/admin/announcements", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAdminAnnouncement(id, payload) {
  return apiFetch(`/admin/announcements/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteAdminAnnouncement(id) {
  return apiFetch(`/admin/announcements/${id}`, { method: "DELETE" });
}

// ---- Admin: accounts ----
export function getAdminUser(id) {
  return apiFetch(`/admin/users/${id}`);
}

export function updateAdminUser(id, payload) {
  return apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function adjustAdminUserCredits(id, payload) {
  return apiFetch(`/admin/users/${id}/credits`, { method: "POST", body: JSON.stringify(payload) });
}

export function deleteAdminUser(id, confirmation) {
  return apiFetch(`/admin/users/${id}/delete`, { method: "POST", body: JSON.stringify({ confirmation }) });
}

// ---- Admin: station editing ----
export function getAdminStation(id) {
  return apiFetch(`/admin/osce/${id}`);
}

export function updateAdminStation(id, payload) {
  return apiFetch(`/admin/osce/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function listAdminSpecialties() {
  return apiFetch("/admin/osce/specialties");
}

export function listAdminOsceStations() {
  return apiFetch("/admin/osce");
}

export function listAdminUsers() {
  return apiFetch("/admin/users");
}

export function createAdminOsceContent(payload) {
  return apiFetch("/admin/osce", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminOsceStationStatus(id, status) {
  return apiFetch(`/admin/osce/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
