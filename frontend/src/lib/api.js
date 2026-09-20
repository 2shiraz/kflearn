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

function clearLegacySessionStorage() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function saveAuthSession(data) {
  clearLegacySessionStorage();
  if (data?.user) localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
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
  if (data?.user) localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  if (data?.csrfToken) localStorage.setItem(CSRF_KEY, data.csrfToken);
  return data;
}

export async function updateProfileRequest(payload) {
  const data = await apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (data?.user) localStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data;
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
    throw new Error(data.message || "Request failed.");
  }
  return data.data;
}

export function listHistoryModules() {
  return apiFetch("/history");
}

export function getDashboardSummary() {
  return apiFetch("/dashboard/summary");
}

export function getHistoryModule(slug) {
  return apiFetch(`/history/${slug}`);
}

export function getSinglePlayerContent(slug) {
  return apiFetch(`/history/${slug}/single-player`);
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

export function createHistoryAttempt({ moduleId, mode, aiProvider }) {
  return apiFetch("/history/attempts", {
    method: "POST",
    body: JSON.stringify({ moduleId, mode, aiProvider }),
  });
}

export function getHistoryAttempt(attemptId) {
  return apiFetch(`/history/attempts/${attemptId}`);
}

export function listHistoryAttempts() {
  return apiFetch("/history/attempts");
}

export function sendPatientMessage(attemptId, payload) {
  return apiFetch(`/history/attempts/${attemptId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function endHistoryAttempt(attemptId, payload = {}) {
  return apiFetch(`/history/attempts/${attemptId}/end`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function selfAssessHistoryAttempt(attemptId, checkedItemIds) {
  return apiFetch(`/history/attempts/${attemptId}/self-assessment`, {
    method: "POST",
    body: JSON.stringify({ checkedItemIds }),
  });
}

export function aiAssessHistoryAttempt(attemptId) {
  return apiFetch(`/history/attempts/${attemptId}/ai-assessment`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function transcribeHistoryAudio(attemptId, audioBlob) {
  const form = new FormData();
  form.append("audio", audioBlob, "question.webm");
  return apiFetch(`/history/attempts/${attemptId}/transcribe`, {
    method: "POST",
    body: form,
  });
}

export function listAdminHistoryModules() {
  return apiFetch("/admin/history");
}

export function listAdminUsers() {
  return apiFetch("/admin/users");
}

export function createAdminHistoryContent(payload) {
  return apiFetch("/admin/history", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function publishAdminHistoryModule(id) {
  return apiFetch(`/admin/history/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "published" }),
  });
}
