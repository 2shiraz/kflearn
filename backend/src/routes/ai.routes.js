import { Router } from "express";
import { getAiStatus, updateAiStatus } from "../controllers/ai.controller.js";
import { requireRole } from "../middleware/role.js";
import { adminWriteLimiter } from "../middleware/rateLimit.js";
import { auditAdminChanges } from "../middleware/adminAudit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"), adminWriteLimiter, auditAdminChanges);
router.get("/status", asyncHandler(getAiStatus));
router.patch("/status", asyncHandler(updateAiStatus));

export default router;
