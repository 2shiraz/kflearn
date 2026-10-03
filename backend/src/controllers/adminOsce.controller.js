import mongoose from "mongoose";
import { OSCE_CATEGORIES, stationCategory } from "../utils/osceCategories.js";
import { ContentAuditLog } from "../models/ContentAuditLog.js";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";
import { OsceFramework } from "../models/OsceFramework.js";
import { stationListDto } from "../services/osce.service.js";

export async function listAdminStations(req, res) {
  const modules = await OsceStation.find().populate("specialtyId").sort({ updatedAt: -1 });
  res.json({ success: true, data: modules.map(stationListDto) });
}

export async function createOsceContent(req, res) {
  const { specialtySlug, specialtyName, guideSlug, module, patientScript, checklist } = req.body;
  if (module?.category && !OSCE_CATEGORIES.some(({ value }) => value === module.category)) {
    const error = new Error("Invalid station category.");
    error.status = 400;
    throw error;
  }
  const specialty = await Specialty.findOneAndUpdate(
    { slug: specialtySlug },
    { $set: { name: specialtyName || specialtySlug, slug: specialtySlug, active: true } },
    { upsert: true, new: true },
  );
  const guide = guideSlug ? await OsceFramework.findOne({ slug: guideSlug }) : null;
  const script = await PatientScript.create(patientScript);
  const smartChecklist = await SmartChecklist.create(checklist);
  const createdModule = await OsceStation.create({
    ...module,
    category: stationCategory(module),
    specialtyId: specialty._id,
    osceFrameworkId: guide?._id,
    patientScriptId: script._id,
    smartChecklistId: smartChecklist._id,
    status: "draft",
    createdBy: req.user.id,
  });
  await ContentAuditLog.create({
    contentType: "OsceStation",
    contentId: createdModule._id,
    action: "created",
    changedBy: req.user.id,
    summary: "Created draft OSCE station content bundle.",
  });
  res.status(201).json({ success: true, data: { module: createdModule } });
}

export async function updateStationStatus(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    const error = new Error("Module not found.");
    error.status = 404;
    throw error;
  }
  const module = await OsceStation.findById(req.params.id);
  if (!module) {
    const error = new Error("Module not found.");
    error.status = 404;
    throw error;
  }
  const { status } = req.body || {};
  if (!["draft", "approved", "published", "archived"].includes(status)) {
    const error = new Error("Invalid status.");
    error.status = 400;
    throw error;
  }
  module.status = status;
  if (status === "published") module.publishedAt = new Date();
  await module.save();
  await ContentAuditLog.create({
    contentType: "OsceStation",
    contentId: module._id,
    version: module.version,
    action: status,
    changedBy: req.user.id,
    summary: `Status changed to ${status}.`,
  });
  res.json({ success: true, data: { module } });
}

// ---- Editing a station's student-facing content ----
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const MODES = ["single-player", "virtual-patient"];

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function findStation(id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    const error = new Error("Station not found.");
    error.status = 404;
    throw error;
  }
  const station = await OsceStation.findById(id).populate("specialtyId");
  if (!station) {
    const error = new Error("Station not found.");
    error.status = 404;
    throw error;
  }
  return station;
}

function editableDto(station) {
  return {
    id: station._id,
    slug: station.slug,
    status: station.status,
    version: station.version,
    title: station.title,
    shortDescription: station.shortDescription,
    presentingComplaint: station.presentingComplaint,
    specialtyId: station.specialtyId?._id || station.specialtyId,
    category: station.category || "",
    difficulty: station.difficulty,
    timeLimitSeconds: station.timeLimitSeconds,
    practiceModes: station.practiceModes?.length ? station.practiceModes : MODES,
    candidateInstructions: {
      context: station.candidateInstructions?.context || "",
      patientSummary: station.candidateInstructions?.patientSummary || "",
      tasks: station.candidateInstructions?.tasks || [],
    },
    keyAnswerGuide: station.keyAnswerGuide || "",
    examinerInstructions: station.examinerInstructions || "",
    learningNotes: station.learningNotes || "",
    suggestedCandidateApproach: station.suggestedCandidateApproach || [],
    criticalSafetyErrors: station.criticalSafetyErrors || [],
  };
}

export async function listSpecialties(req, res) {
  const specialties = await Specialty.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: specialties.map((s) => ({ id: s._id, name: s.name, slug: s.slug })) });
}

export async function getAdminStation(req, res) {
  res.json({ success: true, data: editableDto(await findStation(req.params.id)) });
}

export async function updateAdminStation(req, res) {
  const station = await findStation(req.params.id);
  const body = req.body || {};
  const text = (value, label, max, required = false) => {
    if (typeof value !== "string" || value.length > max) throw badRequest(`${label} is too long or invalid.`);
    if (required && !value.trim()) throw badRequest(`${label} is required.`);
    return value.trim();
  };
  const list = (value, label) => {
    if (!Array.isArray(value) || value.length > 40 || value.some((item) => typeof item !== "string" || item.length > 600)) throw badRequest(`${label} is invalid.`);
    return value.map((item) => item.trim()).filter(Boolean);
  };

  if (body.title !== undefined) station.title = text(body.title, "Title", 160, true);
  if (body.shortDescription !== undefined) station.shortDescription = text(body.shortDescription, "Short description", 600, true);
  if (body.presentingComplaint !== undefined) station.presentingComplaint = text(body.presentingComplaint, "Presenting complaint", 200, true);
  if (body.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(body.difficulty)) throw badRequest("Invalid difficulty.");
    station.difficulty = body.difficulty;
  }
  if (body.category !== undefined) {
    if (body.category !== "" && !OSCE_CATEGORIES.some(({ value }) => value === body.category)) throw badRequest("Invalid category.");
    station.category = body.category;
  }
  if (body.timeLimitSeconds !== undefined) {
    if (!Number.isSafeInteger(body.timeLimitSeconds) || body.timeLimitSeconds < 60 || body.timeLimitSeconds > 3600) throw badRequest("Time limit must be between 1 and 60 minutes.");
    station.timeLimitSeconds = body.timeLimitSeconds;
  }
  if (body.practiceModes !== undefined) {
    if (!Array.isArray(body.practiceModes) || !body.practiceModes.length || body.practiceModes.some((m) => !MODES.includes(m))) throw badRequest("Pick at least one practice mode.");
    station.practiceModes = [...new Set(body.practiceModes)];
  }
  if (body.specialtyId !== undefined) {
    if (!mongoose.isObjectIdOrHexString(body.specialtyId) || !(await Specialty.exists({ _id: body.specialtyId }))) throw badRequest("Invalid specialty.");
    station.specialtyId = body.specialtyId;
  }
  if (body.candidateInstructions !== undefined) {
    const ci = body.candidateInstructions || {};
    if (ci.context !== undefined) station.set("candidateInstructions.context", text(ci.context, "Context", 2000));
    if (ci.patientSummary !== undefined) station.set("candidateInstructions.patientSummary", text(ci.patientSummary, "Patient summary", 2000));
    if (ci.tasks !== undefined) station.set("candidateInstructions.tasks", list(ci.tasks, "Tasks"));
  }
  for (const [key, label] of [["keyAnswerGuide", "Answer guide"], ["examinerInstructions", "Examiner guidance"], ["learningNotes", "Review notes"]]) {
    if (body[key] !== undefined) station[key] = text(body[key], label, 6000);
  }
  for (const [key, label] of [["suggestedCandidateApproach", "Suggested approach"], ["criticalSafetyErrors", "Critical safety errors"]]) {
    if (body[key] !== undefined) station[key] = list(body[key], label);
  }

  if (!station.isModified()) {
    res.json({ success: true, data: editableDto(await station.populate("specialtyId")) });
    return;
  }
  station.version = (station.version || 1) + 1;
  await station.save();
  await ContentAuditLog.create({
    contentType: "OsceStation",
    contentId: station._id,
    version: station.version,
    action: "updated",
    changedBy: req.user.id,
    summary: "Edited station content from the admin area.",
  });
  res.json({ success: true, data: editableDto(await station.populate("specialtyId")) });
}
