import { clearSite, markAccessLost, storeSite } from "./site";
import { clearContentCache } from "./content";
import { attemptsChanged, clearOsceCache, stationsChanged } from "./osce";
import { clearCredits } from "./credits";

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
  if (data?.site) storeSite({ ...data.site, ...(data.access ? { access: data.access } : {}) });
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
  clearSite();
  clearContentCache();
  clearOsceCache();
  clearCredits();
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
  if (data?.site) storeSite({ ...data.site, ...(data.access ? { access: data.access } : {}) });
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

// Identical GET requests already on their way share one response, so two
// parts of a page asking for the same thing at once cost one request.
const pendingGets = new Map();

function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" || options.body) return sendApiRequest(path, options, method);
  if (!pendingGets.has(path)) {
    pendingGets.set(path, sendApiRequest(path, options, method).finally(() => pendingGets.delete(path)));
  }
  return pendingGets.get(path);
}

// Changes that make kept OSCE data out of date.
function afterChange(path) {
  if (path.startsWith("/admin/osce")) stationsChanged();
  if (path.startsWith("/osce/attempts")) attemptsChanged();
}

async function sendApiRequest(path, options, method) {
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
    window.location.href = data.code === "SESSION_ENDED" ? "/signin?signedout=device" : "/signin";
  }
  if (res.status === 402 && data.code === "SUBSCRIPTION_REQUIRED") markAccessLost();
  if (!res.ok || data.success === false) {
    const error = new Error(data.message || "Request failed.");
    error.status = res.status;
    error.code = data.code;
    throw error;
  }
  if (method !== "GET") afterChange(path);
  return data.data;
}

// Public: credit package names, credits and prices for the pricing page.
export function getPublicCreditPackages() {
  return publicFetch("/public/credit-packages");
}

// Study content (needs a signed-in account with access). See lib/content.js.
export function getContentPath(path) {
  return apiFetch(`/content${path}`);
}

// Signed-in devices.
export function listMySessions() {
  return apiFetch("/auth/sessions");
}

export function signOutDevice(sessionId) {
  return apiFetch(`/auth/sessions/${sessionId}/revoke`, { method: "POST", body: JSON.stringify({}) });
}

export function signOutEverywhere() {
  return apiFetch("/auth/sessions/revoke-all", { method: "POST", body: JSON.stringify({}) });
}

export function revokeAdminUserSession(id, sessionId) {
  return apiFetch(`/admin/users/${id}/sessions/${sessionId}/revoke`, { method: "POST", body: JSON.stringify({}) });
}

export function revokeAllAdminUserSessions(id) {
  return apiFetch(`/admin/users/${id}/sessions/revoke-all`, { method: "POST", body: JSON.stringify({}) });
}

// Public: the monthly access plan and the AI credit packs.
export function getPublicPricing() {
  return publicFetch("/public/pricing");
}

// Public: counts and names for the marketing pages (never any content).
export function getPublicStats() {
  return publicFetch("/public/stats");
}

// ---- Online payments ----
export function getPaymentOptions() {
  return apiFetch("/payments/options");
}

// Starts checkout for the monthly pass ("monthly-access") or an AI credit
// pack id. The server sets the price.
export function startCheckout(item) {
  return apiFetch("/payments/checkouts", { method: "POST", body: JSON.stringify({ item }) });
}

export function getCheckout(id) {
  return apiFetch(`/payments/checkouts/${encodeURIComponent(id)}`);
}

// Test mode only: the pretend payment page's Pay and Decline buttons.
export function completeTestCheckout(id, outcome) {
  return apiFetch(`/payments/checkouts/${encodeURIComponent(id)}/test-complete`, { method: "POST", body: JSON.stringify({ outcome }) });
}

// ---- Forgot password ----
export function forgotPasswordRequest(email) {
  return publicFetch("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
}

export function resetPasswordRequest({ token, password }) {
  return publicFetch("/auth/reset", { method: "POST", body: JSON.stringify({ token, password }) });
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

const AUDIO_EXTENSIONS = { "audio/mp4": "mp4", "audio/ogg": "ogg", "audio/wav": "wav", "audio/mpeg": "mp3" };

export function transcribeOsceAudio(attemptId, audioBlob) {
  const form = new FormData();
  const ext = AUDIO_EXTENSIONS[(audioBlob.type || "").split(";")[0]] || "webm";
  form.append("audio", audioBlob, `question.${ext}`);
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

export function updateAdminBranding(payload) {
  return apiFetch("/admin/settings/branding", { method: "PATCH", body: JSON.stringify(payload) });
}

// ---- Admin: revenue and payments ----
export function getAdminRevenue(days = 30, bucket = "") {
  return apiFetch(`/admin/revenue?days=${days}${bucket ? `&bucket=${bucket}` : ""}`);
}

export function listAdminPayments({ status = "", q = "", page = 1 } = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  return apiFetch(`/admin/payments?${params}`);
}

export function recordAdminPayment(payment) {
  return apiFetch("/admin/payments", { method: "POST", body: JSON.stringify(payment) });
}

export function refundAdminPayment(id, { removeCredits = false, note = "" } = {}) {
  return apiFetch(`/admin/payments/${id}/refund`, { method: "POST", body: JSON.stringify({ removeCredits, note }) });
}

// Downloads every payment as a CSV file.
export async function downloadAdminPayments() {
  const res = await fetch(`${API_BASE}/admin/payments/export`, { credentials: "include" });
  if (!res.ok) throw new Error("Couldn't export payments.");
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function getAdminStats(days = 30) {
  return apiFetch(`/admin/stats?days=${days}`);
}

export function getAdminActivity() {
  return apiFetch("/admin/activity");
}

// Deletes a station for good; confirmTitle must match its title.
export function deleteAdminStation(id, confirmTitle) {
  return apiFetch(`/admin/osce/${id}`, { method: "DELETE", body: JSON.stringify({ confirmTitle }) });
}

// draft: a half-written station from the editor; only the title is checked.
export function importAdminStations(stations, dryRun = false, draft = false) {
  return apiFetch("/admin/osce/import", { method: "POST", body: JSON.stringify({ stations, dryRun, draft }) });
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

// Monthly access: grant or extend by a number of days, or revoke one period.
export function grantAdminUserAccess(id, { days, reason }) {
  return apiFetch(`/admin/users/${id}/access`, { method: "POST", body: JSON.stringify({ days, reason }) });
}

export function revokeAdminUserAccess(id, periodId) {
  return apiFetch(`/admin/users/${id}/access/${periodId}/revoke`, { method: "POST", body: JSON.stringify({}) });
}

// Sets a temporary password; the student is asked to change it.
export function setAdminUserPassword(id, password) {
  return apiFetch(`/admin/users/${id}/password`, { method: "POST", body: JSON.stringify({ password }) });
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
