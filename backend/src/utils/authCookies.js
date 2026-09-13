import crypto from "node:crypto";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "kf_session";
export const CSRF_COOKIE = "XSRF-TOKEN";

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
  res.cookie(CSRF_COOKIE, crypto.randomBytes(24).toString("hex"), {
    ...baseOptions(),
    httpOnly: false,
    maxAge: expiresInMs,
  });
}

export function clearAuthCookies(res) {
  const options = { ...baseOptions() };
  res.clearCookie(SESSION_COOKIE, options);
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
}
