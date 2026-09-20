import crypto from "node:crypto";
import { env } from "../config/env.js";

// __Host- prevents a sibling subdomain from planting a Domain cookie with the
// same name. The prefix requires Secure and Path=/, both set below.
export const SESSION_COOKIE = env.cookieSecure ? "__Host-kf_session" : "kf_session";
export const CSRF_COOKIE = env.cookieSecure ? "__Host-XSRF-TOKEN" : "XSRF-TOKEN";

function baseOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: "/",
  };
}

export function setAuthCookies(res, { token, expiresInMs }) {
  res.cookie(SESSION_COOKIE, token, { ...baseOptions(), maxAge: expiresInMs });
  // CSRF token must be readable by frontend JS (double-submit pattern), so it is NOT httpOnly.
  const csrfToken = crypto.randomBytes(24).toString("hex");
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...baseOptions(),
    httpOnly: false,
    maxAge: expiresInMs,
  });
  return csrfToken;
}

export function clearAuthCookies(res) {
  const options = { ...baseOptions() };
  res.clearCookie(SESSION_COOKIE, options);
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
}
