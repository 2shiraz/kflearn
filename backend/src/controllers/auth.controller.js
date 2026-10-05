import { changePassword, currentUser, deleteAccount, loginUser, registerUser, revokeUserSessions, updateCurrentUser } from "../services/auth.service.js";
import { closeOwnSession, closeSession, listOpenSessions } from "../services/session.service.js";
import { requestPasswordReset, resetPassword } from "../services/passwordReset.service.js";

const contextOf = (req) => ({ ip: req.ip, userAgent: req.get("User-Agent") || "" });
import { clearAuthCookies, CSRF_COOKIE, setAuthCookies } from "../utils/authCookies.js";
import { getSiteSettings } from "../services/siteSettings.service.js";
import { getAccess } from "../services/access.service.js";

// The app's section switches travel with the session so the first screen
// after signing in already knows what to hide.
async function respondWithSession(req, res, status, { token, expiresInMs, user }) {
  const csrfToken = setAuthCookies(res, { token, expiresInMs });
  const site = await getSiteSettings();
  const access = await getAccess(user, { site });
  // Browser requests carry Origin and use the httpOnly cookie. Keep a Bearer
  // token in the JSON response only for non-browser API clients.
  res.set("Cache-Control", "no-store").status(status).json({
    success: true,
    data: {
      ...(!req.get("Origin") && !req.get("Sec-Fetch-Site") ? { token } : {}),
      csrfToken,
      expiresIn: Math.round(expiresInMs / 1000),
      user,
      site,
      access,
    },
  });
}

export async function register(req, res, next) {
  try {
    const data = await registerUser(req.body || {}, contextOf(req));
    await respondWithSession(req, res, 201, data);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body || {}, contextOf(req));
    await respondWithSession(req, res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    // Signs out this device only.
    await closeSession(req.sessionId);
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const [data, site] = await Promise.all([currentUser(req.user.id), getSiteSettings()]);
    const access = await getAccess(data.user, { site });
    res.json({ success: true, data: { ...data, site, access, csrfToken: req.cookies?.[CSRF_COOKIE] || "" } });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const data = await updateCurrentUser(req.user.id, req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req, res, next) {
  try {
    const data = await changePassword(req.user.id, req.body || {}, contextOf(req));
    await respondWithSession(req, res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function deleteMe(req, res, next) {
  try {
    await deleteAccount(req.user.id, req.body || {});
    clearAuthCookies(res);
    res.set("Cache-Control", "no-store").json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ---- Signed-in devices ----
export async function listSessions(req, res, next) {
  try {
    res.json({ success: true, data: { sessions: await listOpenSessions(req.user.id, req.sessionId) } });
  } catch (error) {
    next(error);
  }
}

export async function revokeSession(req, res, next) {
  try {
    await closeOwnSession(req.user.id, req.params.sessionId);
    if (req.params.sessionId === req.sessionId) clearAuthCookies(res);
    res.json({ success: true, data: { sessions: await listOpenSessions(req.user.id, req.sessionId) } });
  } catch (error) {
    next(error);
  }
}

// Signs out every device, including this one.
export async function revokeAllSessions(req, res, next) {
  try {
    await revokeUserSessions(req.user.id);
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ---- Forgot password ----
// Always the same answer, whether or not the email has an account.
export async function forgotPassword(req, res, next) {
  try {
    await requestPasswordReset(req.body?.email);
    res.json({ success: true, data: { sent: true } });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    await resetPassword(req.body || {});
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
