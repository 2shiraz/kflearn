import { Router } from "express";
import { createHistoryContent, listAdminModules, updateModuleStatus } from "../controllers/adminHistory.controller.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"));
router.get("/", asyncHandler(listAdminModules));
router.post("/", asyncHandler(createHistoryContent));
router.patch("/:id/status", asyncHandler(updateModuleStatus));

export default router;
