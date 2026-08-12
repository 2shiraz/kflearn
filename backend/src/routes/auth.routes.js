import { Router } from "express";
import { login, me, register, updateMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateMe);

export default router;
