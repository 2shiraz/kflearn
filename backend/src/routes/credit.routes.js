import { Router } from "express";
import { getCreditTransactions, getCredits } from "../controllers/credit.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Read-only by design: balances change only as a side effect of paid actions
// on the server, or through the CLI grant script. Purchases arrive with the
// payment integration.
const router = Router();

router.get("/", asyncHandler(getCredits));
router.get("/transactions", asyncHandler(getCreditTransactions));

export default router;
