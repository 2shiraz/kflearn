import { Router } from "express";
import {
  aiAssessAttempt,
  createAttempt,
  endAttempt,
  getAttempt,
  listAttempts,
  selfAssessAttempt,
  sendPatientMessage,
  transcribeAttemptAudio,
} from "../controllers/historyAttempt.controller.js";
import { audioUpload } from "../middleware/upload.js";
import { aiActionLimiter } from "../middleware/rateLimit.js";
import { requireBodyFields, validateAiProvider, validateAttemptMode, validateEndAttempt, validateSelfAssessment, validateStudentMessageLength } from "../validators/history.validators.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(listAttempts));
router.post("/", requireBodyFields(["moduleId", "mode"]), validateAttemptMode, validateAiProvider, asyncHandler(createAttempt));
router.get("/:attemptId", asyncHandler(getAttempt));
router.post("/:attemptId/messages", aiActionLimiter, requireBodyFields(["text"]), validateStudentMessageLength, asyncHandler(sendPatientMessage));
router.post("/:attemptId/end", validateEndAttempt, asyncHandler(endAttempt));
router.post("/:attemptId/self-assessment", validateSelfAssessment, asyncHandler(selfAssessAttempt));
router.post("/:attemptId/ai-assessment", aiActionLimiter, asyncHandler(aiAssessAttempt));
router.post("/:attemptId/transcribe", aiActionLimiter, audioUpload.single("audio"), asyncHandler(transcribeAttemptAudio));

export default router;
