import { Router } from "express";
import { createOsceContent, listAdminStations, updateStationStatus } from "../controllers/adminOsce.controller.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"));
router.get("/", asyncHandler(listAdminStations));
router.post("/", asyncHandler(createOsceContent));
router.patch("/:id/status", asyncHandler(updateStationStatus));

export default router;
