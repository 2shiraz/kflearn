import { changePassword, currentUser, deleteAccount, loginUser, registerUser, revokeUserSessions, updateCurrentUser } from "../services/auth.service.js";
import { clearAuthCookies, CSRF_COOKIE, setAuthCookies } from "../utils/authCookies.js";
import { getSiteSettings } from "../services/siteSettings.service.js";

// The app's section switches travel with the session so the first screen
// after signing in already knows what to hide.
async function respondWithSession(req, res, status, { token, expiresInMs, user }) {
  const csrfToken = setAuthCookies(res, { token, expiresInMs });
  const site = await getSiteSettings();
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
    },
  });
}

export async function register(req, res, next) {
  try {
    const data = await registerUser(req.body || {});
    await respondWithSession(req, res, 201, data);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body || {});
    await respondWithSession(req, res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await revokeUserSessions(req.user.id);
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const [data, site] = await Promise.all([currentUser(req.user.id), getSiteSettings()]);
    res.json({ success: true, data: { ...data, site, csrfToken: req.cookies?.[CSRF_COOKIE] || "" } });
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
    const data = await changePassword(req.user.id, req.body || {});
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
