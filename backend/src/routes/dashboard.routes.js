import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/summary", asyncHandler(getDashboardSummary));

export default router;
