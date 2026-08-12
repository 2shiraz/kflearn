import { Router } from "express";
import { getAiStatus } from "../controllers/ai.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/status", asyncHandler(getAiStatus));

export default router;
