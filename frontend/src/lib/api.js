// Central API client. Every function here returns the SAME shape as the
// real backend will, per API_SPEC.md — so flipping USE_MOCK to false is
// the only change needed when the backend is ready. Nothing in the pages
// should import fetch() directly; they call these functions instead.

const USE_MOCK = true; // <-- flip this when backend/auth endpoints are live
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Seed accounts for local frontend dev / demoing without a backend.
const MOCK_USERS = [
  {
    email: "student@kflearn.pk",
    password: "Student123",
    user: { id: "u_001", fullName: "Ayesha Khan", email: "student@kflearn.pk", role: "student" },
  },
  {
    email: "contributor@kflearn.pk",
    password: "Contrib123",
    user: { id: "u_002", fullName: "Dr. Bilal Ahmed", email: "contributor@kflearn.pk", role: "contributor" },
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/auth/login
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{token: string, expiresIn: number, user: object}>}
 */
export async function loginRequest({ email, password }) {
  if (USE_MOCK) {
    await delay(600); // simulate network latency
    const match = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!match) {
      throw new Error("Incorrect email or password.");
    }
    return { token: "mock-jwt-token", expiresIn: 86400, user: match.user };
  }

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data.data;
}
