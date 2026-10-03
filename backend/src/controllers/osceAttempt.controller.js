import crypto from "node:crypto";
import mongoose from "mongoose";
import { OsceAttempt } from "../models/OsceAttempt.js";
import { getStationClinicalBundle, checklistDto, studentStationDetailDto } from "../services/osce.service.js";
import { generatePatientResponse } from "../services/virtualPatient.service.js";
import { assessAttemptWithAi } from "../services/aiAssessment.service.js";
import { getAiSettings } from "../services/aiSettings.service.js";
import { selfAssessChecklist } from "../services/scoring.service.js";
import { messageId } from "../utils/ids.js";
import { transcribeAudio } from "../services/transcription.service.js";
import { refundCredits, spendCredits } from "../services/credit.service.js";
import { CREDIT_COSTS, MAX_STUDENT_MESSAGES_PER_ATTEMPT, MAX_TRANSCRIPTIONS_PER_ATTEMPT } from "../config/credits.js";

async function findOwnedAttempt(attemptId, userId) {
  if (!mongoose.isObjectIdOrHexString(attemptId)) {
    const error = new Error("Attempt not found.");
    error.status = 404;
    throw error;
  }
  const attempt = await OsceAttempt.findOne({ _id: attemptId, userId });
  if (!attempt) {
    const error = new Error("Attempt not found.");
    error.status = 404;
    throw error;
  }
  return attempt;
}

function invalidAttemptState() {
  const error = new Error("Attempt is not in the required state.");
  error.status = 409;
  return error;
}

function sessionNotPaid() {
  const error = new Error("This session was not paid for. Start a new AI Virtual Patient session.");
  error.status = 402;
  error.code = "SESSION_NOT_PAID";
  return error;
}

function usageLimitReached(message) {
  const error = new Error(message);
  error.status = 429;
  error.code = "STATION_LIMIT_REACHED";
  return error;
}

// Atomically claims one slot of a per-attempt usage counter before a provider
// call. The query only matches a paid, active virtual-patient attempt under
// its cap, so parallel requests can't exceed the cap or use an unpaid session.
async function reserveUsageSlot(attempt, userId, field, cap, limitMessage) {
  const reserved = await OsceAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      userId,
      status: "active",
      mode: "virtual-patient",
      "billing.virtualPatientCharged": true,
      [`usage.${field}`]: { $not: { $gte: cap } },
    },
    { $inc: { [`usage.${field}`]: 1 } },
    { new: true },
  );
  if (reserved) return reserved;
  const current = await OsceAttempt.findOne({ _id: attempt._id, userId }).lean();
  if (!current || current.status !== "active" || current.mode !== "virtual-patient") throw invalidAttemptState();
  if (!current.billing?.virtualPatientCharged) throw sessionNotPaid();
  throw usageLimitReached(limitMessage);
}

async function releaseUsageSlot(attemptId, userId, field) {
  await OsceAttempt.updateOne({ _id: attemptId, userId, [`usage.${field}`]: { $gt: 0 } }, { $inc: { [`usage.${field}`]: -1 } });
}

export async function createAttempt(req, res) {
  const { stationId, mode, aiProvider } = req.body;
  const { module, patientScript, checklist } = await getStationClinicalBundle(stationId);
  const aiSettings = await getAiSettings();
  if (module.status !== "published") {
    const error = new Error("Only published modules can be practiced.");
    error.status = 404;
    throw error;
  }
  if (module.practiceModes?.length && !module.practiceModes.includes(mode)) {
    const error = new Error("This practice mode is not available for this station.");
    error.status = 409;
    throw error;
  }

  const fields = {
    userId: req.user.id,
    stationId: module._id,
    patientScriptVersion: patientScript.version,
    checklistVersion: checklist.version,
    stationVersion: module.version,
    mode,
    aiProvider: aiProvider || aiSettings.defaultProvider,
    status: "active",
    messages: [],
  };

  if (mode !== "virtual-patient") {
    const attempt = await OsceAttempt.create(fields);
    res.status(201).json({ success: true, data: { attempt: attemptDto(attempt), module: studentStationDetailDto(module) } });
    return;
  }

  // Pay first, then create: the attempt only exists (and is only marked paid)
  // once the debit has succeeded. If creation fails, the debit is refunded.
  const attemptId = new mongoose.Types.ObjectId();
  const cost = CREDIT_COSTS.virtualPatient;
  const balance = await spendCredits({ userId: req.user.id, amount: cost, reason: "virtual-patient", attemptId });
  let attempt;
  try {
    attempt = await OsceAttempt.create({ ...fields, _id: attemptId, billing: { virtualPatientCharged: true } });
  } catch (error) {
    await refundCredits({ userId: req.user.id, amount: cost, reason: "virtual-patient", attemptId, note: "Session could not be created." });
    throw error;
  }

  res.status(201).json({
    success: true,
    data: { attempt: attemptDto(attempt), module: studentStationDetailDto(module), credits: { balance, charged: cost } },
  });
}

export async function getAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  const { module, patientScript, checklist } = await getStationClinicalBundle(attempt.stationId);
  res.json({
    success: true,
    data: {
      attempt: attemptDto(attempt),
      module: { ...studentStationDetailDto(module, { includeReview: ["self-assessed", "ai-assessed"].includes(attempt.status) }), openingStatement: patientScript.openingStatement },
      checklist: attempt.mode === "single-player" || attempt.status !== "active" ? checklistDto(checklist) : undefined,
    },
  });
}

export async function listAttempts(req, res) {
  const attempts = await OsceAttempt.find({ userId: req.user.id, status: { $in: ["self-assessed", "ai-assessed"] } }).populate("stationId").sort({ createdAt: -1 });
  res.json({
    success: true,
    data: attempts.map((attempt) => ({
      id: attempt._id,
      mode: attempt.mode,
      aiProvider: attempt.aiProvider,
      status: attempt.status,
      startedAt: attempt.startedAt,
      endedAt: attempt.endedAt,
      finalScore: attempt.finalScore,
      module: attempt.stationId ? {
        title: attempt.stationId.title,
        slug: attempt.stationId.slug,
        presentingComplaint: attempt.stationId.presentingComplaint,
      } : null,
    })),
  });
}

export async function sendPatientMessage(req, res) {
  const { text, inputType = "typed", originalTranscript = "" } = req.body;
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  if (attempt.status !== "active" || attempt.mode !== "virtual-patient") throw invalidAttemptState();
  const reserved = await reserveUsageSlot(
    attempt, req.user.id, "studentMessages", MAX_STUDENT_MESSAGES_PER_ATTEMPT,
    `You've reached the ${MAX_STUDENT_MESSAGES_PER_ATTEMPT}-question limit for this station. End the session to be assessed.`,
  );
  let response;
  try {
    const { module, patientScript } = await getStationClinicalBundle(reserved.stationId);
    response = await generatePatientResponse({ patientScript, module, attempt: reserved, studentQuestion: text });
  } catch (error) {
    await releaseUsageSlot(attempt._id, req.user.id, "studentMessages");
    throw error;
  }

  const studentMessage = {
    messageId: messageId("student"),
    role: "student",
    inputType,
    originalTranscript,
    finalText: text,
    matchedFactIds: response.matchedFactIds,
    matchedConceptIds: response.matchedConceptIds,
  };
  const patientMessage = {
    messageId: messageId("patient"),
    role: "patient",
    inputType: "typed",
    finalText: response.text,
    matchedFactIds: response.matchedFactIds,
    matchedConceptIds: response.matchedConceptIds,
  };

  const updated = await OsceAttempt.findOneAndUpdate(
    { _id: attempt._id, userId: req.user.id, status: "active" },
    {
      $push: { messages: { $each: [studentMessage, patientMessage] } },
      $addToSet: {
        "internalCoverage.factIds": { $each: response.matchedFactIds },
        "internalCoverage.conceptIds": { $each: response.matchedConceptIds },
      },
    },
    { new: true, runValidators: true },
  );
  if (!updated) throw invalidAttemptState();

  res.json({
    success: true,
    data: {
      studentMessage: { id: studentMessage.messageId, text: studentMessage.finalText },
      patientMessage: { id: patientMessage.messageId, text: patientMessage.finalText },
      attempt: attemptDto(updated),
    },
  });
}

export async function endAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  if (attempt.status !== "active") throw invalidAttemptState();
  const endedAt = new Date();
  const updated = await OsceAttempt.findOneAndUpdate(
    { _id: attempt._id, userId: req.user.id, status: "active" },
    { $set: {
      status: "ended",
      endedAt,
      elapsedSeconds: Math.max(0, Math.round((endedAt - attempt.startedAt) / 1000)),
      timerState: "ended",
      ...(req.body?.notes !== undefined ? { notes: req.body.notes } : {}),
    } },
    { new: true, runValidators: true },
  );
  if (!updated) throw invalidAttemptState();
  res.json({ success: true, data: attemptDto(updated) });
}

// The student left a station before finishing it. The attempt is deleted
// outright so it leaves no history; credits already spent on an AI session are
// not refunded (the conversation itself used the provider). Attempts that are
// being marked, or already marked, are kept.
export async function discardAttempt(req, res) {
  await findOwnedAttempt(req.params.attemptId, req.user.id);
  const removed = await OsceAttempt.findOneAndDelete({
    _id: req.params.attemptId,
    userId: req.user.id,
    status: { $in: ["active", "ended"] },
  });
  if (!removed) throw invalidAttemptState();
  res.json({ success: true });
}

export async function selfAssessAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  if (attempt.status !== "ended") throw invalidAttemptState();
  const { checklist } = await getStationClinicalBundle(attempt.stationId);
  const checklistItems = checklist.sections.flatMap((section) => section.items);
  const validItems = new Map(checklistItems.map((item) => [item.itemId, item]));
  if (req.body.itemScores?.some(({ itemId, rawScore }) => !validItems.has(itemId) || rawScore > validItems.get(itemId).maxRawScore)) {
    const error = new Error("itemScores contains an unknown item or a score outside the item's range.");
    error.status = 400;
    throw error;
  }
  const result = selfAssessChecklist(checklist, req.body.checkedItemIds || [], req.body.itemScores || []);
  const feedback = {
    summary: "Self assessment complete.",
    missedItems: checklistItems.filter((item) => !result.itemScores.find((score) => score.itemId === item.itemId)?.rawScore).map((item) => item.label),
  };
  const updated = await OsceAttempt.findOneAndUpdate(
    { _id: attempt._id, userId: req.user.id, status: "ended" },
    { $set: {
      selfAssessment: { checkedItemIds: result.itemScores.filter((score) => score.rawScore > 0).map((score) => score.itemId), itemScores: result.itemScores },
      finalScore: result.finalScore,
      feedback,
      status: "self-assessed",
    } },
    { new: true, runValidators: true },
  );
  if (!updated) throw invalidAttemptState();
  res.json({ success: true, data: { attempt: attemptDto(updated), result: resultDto(updated, checklist) } });
}

export async function aiAssessAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  // AI assessment belongs to the paid virtual-patient flow only. Guided
  // self-practice is self-marked and never reaches this endpoint in the UI;
  // reject it here so the server enforces that boundary regardless of client.
  if (attempt.mode !== "virtual-patient") throw invalidAttemptState();
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  if (attempt.status !== "ended" && !(attempt.status === "assessing" && attempt.assessmentStartedAt < staleBefore)) {
    throw invalidAttemptState();
  }
  const { module, checklist } = await getStationClinicalBundle(attempt.stationId);
  const leaseId = crypto.randomUUID();
  const reserved = await OsceAttempt.findOneAndUpdate(
    { _id: attempt._id, userId: req.user.id, $or: [
      { status: "ended" },
      { status: "assessing", assessmentStartedAt: { $lt: staleBefore } },
    ] },
    { $set: { status: "assessing", assessmentStartedAt: new Date(), assessmentLeaseId: leaseId } },
    { new: true },
  );
  if (!reserved) throw invalidAttemptState();

  const releaseLease = () => OsceAttempt.updateOne(
    { _id: attempt._id, userId: req.user.id, status: "assessing", assessmentLeaseId: leaseId },
    { $set: { status: "ended" }, $unset: { assessmentStartedAt: "", assessmentLeaseId: "" } },
  );

  // Charge once per attempt, inside the lease (only one request can hold it).
  // If a previous run was charged and then crashed, a stale-lease retry is free.
  const cost = CREDIT_COSTS.aiAssessment;
  let chargedNow = false;
  let balance;
  if (!reserved.billing?.aiAssessmentCharged) {
    try {
      balance = await spendCredits({ userId: req.user.id, amount: cost, reason: "ai-assessment", attemptId: attempt._id });
    } catch (error) {
      await releaseLease();
      throw error;
    }
    const marked = await OsceAttempt.updateOne(
      { _id: attempt._id, userId: req.user.id, status: "assessing", assessmentLeaseId: leaseId },
      { $set: { "billing.aiAssessmentCharged": true } },
    );
    if (marked.modifiedCount !== 1) {
      await refundCredits({ userId: req.user.id, amount: cost, reason: "ai-assessment", attemptId: attempt._id, note: "Assessment lease was lost." });
      throw invalidAttemptState();
    }
    chargedNow = true;
  }

  try {
    const result = await assessAttemptWithAi({ module, checklist, attempt: reserved });
    const updated = await OsceAttempt.findOneAndUpdate(
      { _id: attempt._id, userId: req.user.id, status: "assessing", assessmentLeaseId: leaseId },
      { $set: {
        aiAssessment: { itemScores: result.itemScores, model: result.model, provider: result.provider },
        finalScore: result.finalScore,
        feedback: result.feedback,
        status: "ai-assessed",
      }, $unset: { assessmentStartedAt: "", assessmentLeaseId: "" } },
      { new: true, runValidators: true },
    );
    if (!updated) throw invalidAttemptState();
    res.json({
      success: true,
      data: {
        attempt: attemptDto(updated),
        result: resultDto(updated, checklist),
        credits: chargedNow ? { balance, charged: cost } : { charged: 0 },
      },
    });
  } catch (error) {
    // Refund only if this request still owns the lease: the same atomic update
    // releases it and clears the charge flag, so a concurrent retry that took
    // over the lease can never end up with a free assessment.
    const released = await OsceAttempt.updateOne(
      { _id: attempt._id, userId: req.user.id, status: "assessing", assessmentLeaseId: leaseId, "billing.aiAssessmentCharged": true },
      { $set: { status: "ended", "billing.aiAssessmentCharged": false }, $unset: { assessmentStartedAt: "", assessmentLeaseId: "" } },
    );
    if (released.modifiedCount === 1) {
      await refundCredits({ userId: req.user.id, amount: cost, reason: "ai-assessment", attemptId: attempt._id, note: "AI assessment failed." });
    } else {
      await releaseLease();
    }
    throw error;
  }
}

export async function transcribeAttemptAudio(req, res) {
  if (!req.file) {
    const error = new Error("Audio file is required.");
    error.status = 400;
    throw error;
  }
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  if (attempt.status !== "active" || attempt.mode !== "virtual-patient") throw invalidAttemptState();
  await reserveUsageSlot(
    attempt, req.user.id, "transcriptions", MAX_TRANSCRIPTIONS_PER_ATTEMPT,
    "Voice transcription limit reached for this station. Type your questions instead.",
  );
  let text;
  try {
    text = await transcribeAudio(req.file);
  } catch (error) {
    await releaseUsageSlot(attempt._id, req.user.id, "transcriptions");
    throw error;
  }
  res.json({ success: true, data: { transcript: text } });
}

export function attemptDto(attempt) {
  return {
    id: attempt._id,
    stationId: attempt.stationId,
    mode: attempt.mode,
    aiProvider: attempt.aiProvider,
    status: attempt.status,
    startedAt: attempt.startedAt,
    endedAt: attempt.endedAt,
    elapsedSeconds: attempt.elapsedSeconds,
    notes: attempt.notes,
    messages: attempt.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
      id: message.messageId,
      role: message.role,
      inputType: message.inputType,
      finalText: message.finalText,
      createdAt: message.createdAt,
    })),
    finalScore: attempt.finalScore,
    feedback: attempt.feedback,
    aiAssessment: attempt.aiAssessment ? { model: attempt.aiAssessment.model, provider: attempt.aiAssessment.provider } : undefined,
  };
}

function resultDto(attempt, checklist) {
  const scores = attempt.aiAssessment?.itemScores?.length ? attempt.aiAssessment.itemScores : attempt.selfAssessment?.itemScores || [];
  return {
    checklist: checklistDto(checklist),
    itemScores: scores,
    finalScore: attempt.finalScore,
    feedback: attempt.feedback,
  };
}
