import { currentUser, loginUser, registerUser, updateCurrentUser } from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const data = await registerUser(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const data = await loginUser(req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
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
