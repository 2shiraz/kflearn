import { Router } from "express";
import { createCheckout, getCheckout, getPaymentOptions, testCompleteCheckout } from "../controllers/payment.controller.js";
import { paymentLimiter } from "../middleware/rateLimit.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Online checkout for the signed-in student (mounted after authenticate and
// CSRF). The provider's notification route is public and lives in app.js.
const router = Router();
router.use(paymentLimiter);

router.get("/options", asyncHandler(getPaymentOptions));
router.post("/checkouts", asyncHandler(createCheckout));
router.get("/checkouts/:id", asyncHandler(getCheckout));
router.post("/checkouts/:id/test-complete", asyncHandler(testCompleteCheckout));

export default router;
