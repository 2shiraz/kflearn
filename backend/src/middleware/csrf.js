import { CSRF_COOKIE } from "../utils/authCookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Double-submit cookie check: the CSRF cookie is readable by same-site JS but a
// cross-site attacker page can't read it, only resend it blindly — so the header
// and cookie only match when the request actually came from our own frontend JS.
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method) || !req.authViaCookie) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.header("x-xsrf-token");
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const error = new Error("Invalid or missing CSRF token.");
    error.status = 403;
    return next(error);
  }
  return next();
}
