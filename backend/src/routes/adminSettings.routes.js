import { Router } from "express";
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminGetSettings,
  adminListAnnouncements,
  adminUpdateAnnouncement,
  adminUpdateBranding,
  adminUpdatePricing,
  adminUpdateSite,
} from "../controllers/site.controller.js";
import { getAdminActivity, getAdminStats } from "../controllers/adminStats.controller.js";
import { requireRole } from "../middleware/role.js";
import { adminWriteLimiter } from "../middleware/rateLimit.js";
import { auditAdminChanges } from "../middleware/adminAudit.js";
import { validateObjectIdParam } from "../middleware/objectId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"), adminWriteLimiter, auditAdminChanges);
router.get("/settings", asyncHandler(adminGetSettings));
router.patch("/settings/site", asyncHandler(adminUpdateSite));
router.patch("/settings/pricing", asyncHandler(adminUpdatePricing));
router.patch("/settings/branding", asyncHandler(adminUpdateBranding));
router.get("/stats", asyncHandler(getAdminStats));
router.get("/activity", asyncHandler(getAdminActivity));
router.get("/announcements", asyncHandler(adminListAnnouncements));
router.post("/announcements", asyncHandler(adminCreateAnnouncement));
router.patch("/announcements/:id", validateObjectIdParam("id"), asyncHandler(adminUpdateAnnouncement));
router.delete("/announcements/:id", validateObjectIdParam("id"), asyncHandler(adminDeleteAnnouncement));

export default router;
