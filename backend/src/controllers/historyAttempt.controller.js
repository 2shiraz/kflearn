import crypto from "node:crypto";
import mongoose from "mongoose";
import { HistoryAttempt } from "../models/HistoryAttempt.js";
import { getModuleClinicalBundle, checklistDto, studentModuleDetailDto } from "../services/history.service.js";
import { generatePatientResponse } from "../services/virtualPatient.service.js";
import { assessAttemptWithAi } from "../services/aiAssessment.service.js";
import { getAiSettings } from "../services/aiSettings.service.js";
import { selfAssessChecklist } from "../services/scoring.service.js";
import { messageId } from "../utils/ids.js";
import { transcribeAudio } from "../services/transcription.service.js";

async function findOwnedAttempt(attemptId, userId) {
  if (!mongoose.isObjectIdOrHexString(attemptId)) {
    const error = new Error("Attempt not found.");
    error.status = 404;
    throw error;
  }
  const attempt = await HistoryAttempt.findOne({ _id: attemptId, userId });
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

export async function createAttempt(req, res) {
  const { moduleId, mode, aiProvider } = req.body;
  const { module, patientScript, checklist } = await getModuleClinicalBundle(moduleId);
  const aiSettings = await getAiSettings();
  if (module.status !== "published") {
    const error = new Error("Only published modules can be practiced.");
    error.status = 404;
    throw error;
  }

  const attempt = await HistoryAttempt.create({
    userId: req.user.id,
    historyModuleId: module._id,
    patientScriptVersion: patientScript.version,
    checklistVersion: checklist.version,
    moduleVersion: module.version,
    mode,
    aiProvider: aiProvider || aiSettings.defaultProvider,
    status: "active",
    messages: [],
  });

  res.status(201).json({ success: true, data: { attempt: attemptDto(attempt), module: studentModuleDetailDto(module) } });
}

export async function getAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  const { module, patientScript, checklist } = await getModuleClinicalBundle(attempt.historyModuleId);
  res.json({
    success: true,
    data: {
      attempt: attemptDto(attempt),
      module: { ...studentModuleDetailDto(module), openingStatement: patientScript.openingStatement },
      checklist: attempt.mode === "single-player" || attempt.status !== "active" ? checklistDto(checklist) : undefined,
    },
  });
}

export async function listAttempts(req, res) {
  const attempts = await HistoryAttempt.find({ userId: req.user.id, status: { $in: ["self-assessed", "ai-assessed"] } }).populate("historyModuleId").sort({ createdAt: -1 });
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
      module: attempt.historyModuleId ? {
        title: attempt.historyModuleId.title,
        slug: attempt.historyModuleId.slug,
        presentingComplaint: attempt.historyModuleId.presentingComplaint,
      } : null,
    })),
  });
}

export async function sendPatientMessage(req, res) {
  const { text, inputType = "typed", originalTranscript = "" } = req.body;
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  if (attempt.status !== "active" || attempt.mode !== "virtual-patient") throw invalidAttemptState();
  const { module, patientScript } = await getModuleClinicalBundle(attempt.historyModuleId);
  const response = await generatePatientResponse({ patientScript, module, attempt, studentQuestion: text });

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

  const updated = await HistoryAttempt.findOneAndUpdate(
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
  const updated = await HistoryAttempt.findOneAndUpdate(
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

export async function selfAssessAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  if (attempt.status !== "ended") throw invalidAttemptState();
  const { checklist } = await getModuleClinicalBundle(attempt.historyModuleId);
  const result = selfAssessChecklist(checklist, req.body.checkedItemIds || []);
  const feedback = {
    summary: "Self assessment complete.",
    missedItems: checklist.sections.flatMap((section) => section.items.filter((item) => !req.body.checkedItemIds?.includes(item.itemId)).map((item) => item.label)),
  };
  const updated = await HistoryAttempt.findOneAndUpdate(
    { _id: attempt._id, userId: req.user.id, status: "ended" },
    { $set: {
      selfAssessment: { checkedItemIds: req.body.checkedItemIds || [], itemScores: result.itemScores },
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
  const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
  if (attempt.status !== "ended" && !(attempt.status === "assessing" && attempt.assessmentStartedAt < staleBefore)) {
    throw invalidAttemptState();
  }
  const { module, checklist } = await getModuleClinicalBundle(attempt.historyModuleId);
  const leaseId = crypto.randomUUID();
  const reserved = await HistoryAttempt.findOneAndUpdate(
    { _id: attempt._id, userId: req.user.id, $or: [
      { status: "ended" },
      { status: "assessing", assessmentStartedAt: { $lt: staleBefore } },
    ] },
    { $set: { status: "assessing", assessmentStartedAt: new Date(), assessmentLeaseId: leaseId } },
    { new: true },
  );
  if (!reserved) throw invalidAttemptState();
  try {
    const result = await assessAttemptWithAi({ module, checklist, attempt: reserved });
    const updated = await HistoryAttempt.findOneAndUpdate(
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
    res.json({ success: true, data: { attempt: attemptDto(updated), result: resultDto(updated, checklist) } });
  } catch (error) {
    await HistoryAttempt.updateOne(
      { _id: attempt._id, userId: req.user.id, status: "assessing", assessmentLeaseId: leaseId },
      { $set: { status: "ended" }, $unset: { assessmentStartedAt: "", assessmentLeaseId: "" } },
    );
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
  const text = await transcribeAudio(req.file);
  res.json({ success: true, data: { transcript: text } });
}

export function attemptDto(attempt) {
  return {
    id: attempt._id,
    moduleId: attempt.historyModuleId,
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
