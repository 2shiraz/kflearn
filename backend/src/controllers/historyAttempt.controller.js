import { HistoryAttempt } from "../models/HistoryAttempt.js";
import { getModuleClinicalBundle, checklistDto, studentModuleDetailDto } from "../services/history.service.js";
import { generatePatientResponse } from "../services/virtualPatient.service.js";
import { assessAttemptWithAi } from "../services/aiAssessment.service.js";
import { selfAssessChecklist } from "../services/scoring.service.js";
import { messageId } from "../utils/ids.js";
import { transcribeAudio } from "../services/transcription.service.js";

async function findOwnedAttempt(attemptId, userId) {
  const attempt = await HistoryAttempt.findOne({ _id: attemptId, userId });
  if (!attempt) {
    const error = new Error("Attempt not found.");
    error.status = 404;
    throw error;
  }
  return attempt;
}

export async function createAttempt(req, res) {
  const { moduleId, mode } = req.body;
  const { module, patientScript, checklist } = await getModuleClinicalBundle(moduleId);
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
      checklist: checklistDto(checklist),
    },
  });
}

export async function listAttempts(req, res) {
  const attempts = await HistoryAttempt.find({ userId: req.user.id }).populate("historyModuleId").sort({ createdAt: -1 });
  res.json({
    success: true,
    data: attempts.map((attempt) => ({
      id: attempt._id,
      mode: attempt.mode,
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

  attempt.messages.push(studentMessage, patientMessage);
  attempt.internalCoverage.factIds = [...new Set([...(attempt.internalCoverage?.factIds || []), ...response.matchedFactIds])];
  attempt.internalCoverage.conceptIds = [...new Set([...(attempt.internalCoverage?.conceptIds || []), ...response.matchedConceptIds])];
  await attempt.save();

  res.json({
    success: true,
    data: {
      studentMessage: { id: studentMessage.messageId, text: studentMessage.finalText },
      patientMessage: { id: patientMessage.messageId, text: patientMessage.finalText },
      attempt: attemptDto(attempt),
    },
  });
}

export async function endAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  attempt.status = "ended";
  attempt.endedAt = new Date();
  attempt.elapsedSeconds = req.body.elapsedSeconds || Math.round((attempt.endedAt - attempt.startedAt) / 1000);
  attempt.timerState = "ended";
  if (req.body.notes) attempt.notes = req.body.notes;
  await attempt.save();
  res.json({ success: true, data: attemptDto(attempt) });
}

export async function selfAssessAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  const { checklist } = await getModuleClinicalBundle(attempt.historyModuleId);
  const result = selfAssessChecklist(checklist, req.body.checkedItemIds || []);
  attempt.selfAssessment = { checkedItemIds: req.body.checkedItemIds || [], itemScores: result.itemScores };
  attempt.finalScore = result.finalScore;
  attempt.feedback = {
    summary: "Self assessment complete.",
    missedItems: checklist.sections.flatMap((section) => section.items.filter((item) => !req.body.checkedItemIds?.includes(item.itemId)).map((item) => item.label)),
  };
  attempt.status = "self-assessed";
  await attempt.save();
  res.json({ success: true, data: { attempt: attemptDto(attempt), result: resultDto(attempt, checklist) } });
}

export async function aiAssessAttempt(req, res) {
  const attempt = await findOwnedAttempt(req.params.attemptId, req.user.id);
  const { module, checklist } = await getModuleClinicalBundle(attempt.historyModuleId);
  const result = await assessAttemptWithAi({ module, checklist, attempt });
  attempt.aiAssessment = { itemScores: result.itemScores, model: result.model };
  attempt.finalScore = result.finalScore;
  attempt.feedback = result.feedback;
  attempt.status = "ai-assessed";
  await attempt.save();
  res.json({ success: true, data: { attempt: attemptDto(attempt), result: resultDto(attempt, checklist) } });
}

export async function transcribeAttemptAudio(req, res) {
  if (!req.file) {
    const error = new Error("Audio file is required.");
    error.status = 400;
    throw error;
  }
  await findOwnedAttempt(req.params.attemptId, req.user.id);
  const text = await transcribeAudio(req.file);
  res.json({ success: true, data: { transcript: text } });
}

export function attemptDto(attempt) {
  return {
    id: attempt._id,
    moduleId: attempt.historyModuleId,
    mode: attempt.mode,
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
