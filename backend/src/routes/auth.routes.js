import { Router } from "express";
import { login, logout, me, register, updateMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// This router is mounted ahead of the app-wide authenticate/csrfProtection chain
// (so /register and /login can run before a session exists), so the one mutating
// route here that needs it — PATCH /me — applies both itself.
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", authenticate, csrfProtection, logout);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, csrfProtection, updateMe);

export default router;
