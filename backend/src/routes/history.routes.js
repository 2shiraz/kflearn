import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getHistoryModule, getSinglePlayerContent, listHistoryModules } from "../controllers/history.controller.js";

const router = Router();

router.get("/", asyncHandler(listHistoryModules));
router.get("/:slug", asyncHandler(getHistoryModule));
router.get("/:slug/single-player", asyncHandler(getSinglePlayerContent));

export default router;
