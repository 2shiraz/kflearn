import { Router } from "express";
import { adjustAdminUserCredits, deleteAdminUser, getAdminUser, grantAdminUserAccess, listAdminUsers, revokeAdminUserAccess, revokeAdminUserSession, revokeAllAdminUserSessions, setAdminUserPassword, updateAdminUser } from "../controllers/adminUser.controller.js";
import { requireRole } from "../middleware/role.js";
import { adminWriteLimiter } from "../middleware/rateLimit.js";
import { auditAdminChanges } from "../middleware/adminAudit.js";
import { validateObjectIdParam } from "../middleware/objectId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"), adminWriteLimiter, auditAdminChanges);
router.get("/", asyncHandler(listAdminUsers));
router.get("/:id", validateObjectIdParam("id"), asyncHandler(getAdminUser));
router.patch("/:id", validateObjectIdParam("id"), asyncHandler(updateAdminUser));
router.post("/:id/credits", validateObjectIdParam("id"), asyncHandler(adjustAdminUserCredits));
router.post("/:id/delete", validateObjectIdParam("id"), asyncHandler(deleteAdminUser));
router.post("/:id/access", validateObjectIdParam("id"), asyncHandler(grantAdminUserAccess));
router.post("/:id/access/:periodId/revoke", validateObjectIdParam("id"), asyncHandler(revokeAdminUserAccess));
router.post("/:id/password", validateObjectIdParam("id"), asyncHandler(setAdminUserPassword));
router.post("/:id/sessions/revoke-all", validateObjectIdParam("id"), asyncHandler(revokeAllAdminUserSessions));
router.post("/:id/sessions/:sessionId/revoke", validateObjectIdParam("id"), asyncHandler(revokeAdminUserSession));

export default router;
