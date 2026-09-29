import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getOsceStation, getSinglePlayerContent, listOsceStations } from "../controllers/osce.controller.js";

const router = Router();

router.get("/", asyncHandler(listOsceStations));
router.get("/:slug", asyncHandler(getOsceStation));
router.get("/:slug/single-player", asyncHandler(getSinglePlayerContent));

export default router;
