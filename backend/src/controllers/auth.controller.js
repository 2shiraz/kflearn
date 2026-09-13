import { currentUser, loginUser, registerUser, updateCurrentUser } from "../services/auth.service.js";
import { clearAuthCookies, setAuthCookies } from "../utils/authCookies.js";

function respondWithSession(res, status, { token, expiresInMs, user }) {
  setAuthCookies(res, { token, expiresInMs });
  res.status(status).json({
    success: true,
    data: { token, expiresIn: Math.round(expiresInMs / 1000), user },
  });
}

export async function register(req, res, next) {
  try {
    const data = await registerUser(req.body);
    respondWithSession(res, 201, data);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body);
    respondWithSession(res, 200, data);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ success: true });
}

export async function me(req, res, next) {
  try {
    const data = await currentUser(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const data = await updateCurrentUser(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
