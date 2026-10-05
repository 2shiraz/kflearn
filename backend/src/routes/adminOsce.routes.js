import { Router } from "express";
import { createOsceContent, deleteAdminStation, getAdminStation, importOsceStations, listAdminStations, listSpecialties, updateAdminStation, updateStationStatus } from "../controllers/adminOsce.controller.js";
import { clearStationCacheOnWrite } from "../services/stationCache.service.js";
import { requireRole } from "../middleware/role.js";
import { adminWriteLimiter } from "../middleware/rateLimit.js";
import { auditAdminChanges } from "../middleware/adminAudit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"), adminWriteLimiter, auditAdminChanges, clearStationCacheOnWrite);
router.get("/", asyncHandler(listAdminStations));
router.post("/", asyncHandler(createOsceContent));
router.get("/specialties", asyncHandler(listSpecialties));
router.post("/import", asyncHandler(importOsceStations));
router.get("/:id", asyncHandler(getAdminStation));
router.patch("/:id", asyncHandler(updateAdminStation));
router.patch("/:id/status", asyncHandler(updateStationStatus));
router.delete("/:id", asyncHandler(deleteAdminStation));

export default router;
