import { Router } from "express";
import { getSite } from "../controllers/site.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(getSite));
export default router;
