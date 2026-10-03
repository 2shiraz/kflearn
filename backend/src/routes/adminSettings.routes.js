import { Router } from "express";
import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminGetSettings,
  adminListAnnouncements,
  adminUpdateAnnouncement,
  adminUpdatePricing,
  adminUpdateSite,
} from "../controllers/site.controller.js";
import { requireRole } from "../middleware/role.js";
import { validateObjectIdParam } from "../middleware/objectId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"));
router.get("/settings", asyncHandler(adminGetSettings));
router.patch("/settings/site", asyncHandler(adminUpdateSite));
router.patch("/settings/pricing", asyncHandler(adminUpdatePricing));
router.get("/announcements", asyncHandler(adminListAnnouncements));
router.post("/announcements", asyncHandler(adminCreateAnnouncement));
router.patch("/announcements/:id", validateObjectIdParam("id"), asyncHandler(adminUpdateAnnouncement));
router.delete("/announcements/:id", validateObjectIdParam("id"), asyncHandler(adminDeleteAnnouncement));

export default router;
