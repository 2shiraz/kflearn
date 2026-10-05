import { Router } from "express";
import { deleteMe, forgotPassword, listSessions, resetPasswordHandler, login, logout, me, register, revokeAllSessions, revokeSession, updateMe, updatePassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import { accountSecurityLimiter, authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// This router is mounted ahead of the app-wide authenticate/csrfProtection chain
// (so /register and /login can run before a session exists), so the one mutating
// routes here apply both themselves.
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot", authLimiter, forgotPassword);
router.post("/reset", authLimiter, resetPasswordHandler);
router.post("/logout", authenticate, csrfProtection, logout);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, csrfProtection, updateMe);
router.post("/password", authLimiter, authenticate, csrfProtection, accountSecurityLimiter, updatePassword);
router.post("/me/delete", authLimiter, authenticate, csrfProtection, accountSecurityLimiter, deleteMe);
router.get("/sessions", authenticate, listSessions);
router.post("/sessions/revoke-all", authenticate, csrfProtection, revokeAllSessions);
router.post("/sessions/:sessionId/revoke", authenticate, csrfProtection, revokeSession);

export default router;
