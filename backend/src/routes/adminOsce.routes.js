import { Router } from "express";
import { createOsceContent, getAdminStation, listAdminStations, listSpecialties, updateAdminStation, updateStationStatus } from "../controllers/adminOsce.controller.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"));
router.get("/", asyncHandler(listAdminStations));
router.post("/", asyncHandler(createOsceContent));
router.get("/specialties", asyncHandler(listSpecialties));
router.get("/:id", asyncHandler(getAdminStation));
router.patch("/:id", asyncHandler(updateAdminStation));
router.patch("/:id/status", asyncHandler(updateStationStatus));

export default router;
