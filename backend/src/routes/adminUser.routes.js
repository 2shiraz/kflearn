import { Router } from "express";
import { adjustAdminUserCredits, deleteAdminUser, getAdminUser, listAdminUsers, updateAdminUser } from "../controllers/adminUser.controller.js";
import { requireRole } from "../middleware/role.js";
import { validateObjectIdParam } from "../middleware/objectId.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireRole("admin"));
router.get("/", asyncHandler(listAdminUsers));
router.get("/:id", validateObjectIdParam("id"), asyncHandler(getAdminUser));
router.patch("/:id", validateObjectIdParam("id"), asyncHandler(updateAdminUser));
router.post("/:id/credits", validateObjectIdParam("id"), asyncHandler(adjustAdminUserCredits));
router.post("/:id/delete", validateObjectIdParam("id"), asyncHandler(deleteAdminUser));

export default router;
