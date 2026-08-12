const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const SESSION_KEY = "kf_user";
const LEGACY_SESSION_KEY = "kf_mock_user";
const TOKEN_KEY = "kf_auth_token";

export const ROLE_OPTIONS = [
  "MBBS Student",
  "FCPS Candidate",
  "MCPS Candidate",
  "Postgraduate Resident",
  "Other Medical Learner",
];

export function saveAuthSession(data) {
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  if (data?.token) sessionStorage.setItem(TOKEN_KEY, data.token);
  if (data?.user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data;
}

export function getCurrentUser() {
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    logout();
    return null;
  }
}

export function getAuthToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token === "mock-jwt-token") {
    logout();
    return null;
  }
  return token;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
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
  if (data?.user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data;
}

export async function updateProfileRequest(payload) {
  const data = await apiFetch("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (data?.user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
  return data;
}

export function saveProfileDetails(user, profile) {
  const merged = { ...user, ...profile, profile: { ...(user?.profile || {}), ...profile } };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
  return merged;
}

async function publicFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
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
  const token = getAuthToken();
  if (!token) {
    logout();
    window.location.href = "/signin";
    throw new Error("Authentication required.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
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

export function getHistoryModule(slug) {
  return apiFetch(`/history/${slug}`);
}

export function getSinglePlayerContent(slug) {
  return apiFetch(`/history/${slug}/single-player`);
}

export function createHistoryAttempt({ moduleId, mode }) {
  return apiFetch("/history/attempts", {
    method: "POST",
    body: JSON.stringify({ moduleId, mode }),
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
