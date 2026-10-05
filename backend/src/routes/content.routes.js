import { Router } from "express";
import { getCatalog, getGuideIndex, getGuidePage, getMcqBlock, getOspeBlock } from "../controllers/content.controller.js";
import { requireAccess } from "../middleware/requireAccess.js";
import { contentDailyLimiter, contentHourlyLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Study content. Mounted after authenticate: every request needs a signed-in
// account with access, and counts toward that account's content limits.
const router = Router();

router.use(requireAccess, contentHourlyLimiter, contentDailyLimiter);
router.get("/catalog", asyncHandler(getCatalog));
router.get("/guides/:guide", asyncHandler(getGuideIndex));
router.get("/guides/:guide/:slug", asyncHandler(getGuidePage));
router.get("/mcqs/:year/:block", asyncHandler(getMcqBlock));
router.get("/ospe/:year/:block", asyncHandler(getOspeBlock));

export default router;
