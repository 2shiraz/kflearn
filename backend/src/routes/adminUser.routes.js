import { Router } from "express";
import { listAdminUsers } from "../controllers/adminUser.controller.js";
import { requireRole } from "../middleware/role.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"));
router.get("/", asyncHandler(listAdminUsers));

export default router;
