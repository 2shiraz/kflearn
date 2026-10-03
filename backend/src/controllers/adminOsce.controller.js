import mongoose from "mongoose";
import { OSCE_CATEGORIES, stationCategory } from "../utils/osceCategories.js";
import { ContentAuditLog } from "../models/ContentAuditLog.js";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";
import { OsceFramework } from "../models/OsceFramework.js";
import { REVIEW_PARTS, stationListDto } from "../services/osce.service.js";
import { importStations, parseImport } from "../services/osceImport.service.js";

export async function listAdminStations(req, res) {
  const modules = await OsceStation.find().populate("specialtyId").sort({ createdAt: -1 });
  // Dates let the admin list sort by newest or recently edited.
  res.json({ success: true, data: modules.map((m) => ({ ...stationListDto(m), createdAt: m.createdAt, updatedAt: m.updatedAt })) });
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

// What a half-written draft still needs before students can see it.
async function missingForPublish(module) {
  const missing = [];
  if (!module.presentingComplaint?.trim()) missing.push("presenting complaint");
  if (!module.shortDescription?.trim()) missing.push("short description");
  if (!module.candidateInstructions?.tasks?.length) missing.push("at least one task");
  const checklist = module.smartChecklistId ? await SmartChecklist.findById(module.smartChecklistId).lean() : null;
  if (!checklist?.sections?.some((sec) => sec.items?.length)) missing.push("checklist items");
  if (module.practiceModes?.includes("virtual-patient")) {
    const script = module.patientScriptId ? await PatientScript.findById(module.patientScriptId).lean() : null;
    if ((script?.facts?.length || 0) < 4) missing.push("3 patient facts for the AI patient");
  }
  return missing;
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
  if (["approved", "published"].includes(status)) {
    const missing = await missingForPublish(module);
    if (missing.length) {
      const error = new Error(`Finish this station first. Missing: ${missing.join(", ")}.`);
      error.status = 400;
      throw error;
    }
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

// The marking checklist as the editor sees it: sections of items, each with
// its marks (1 = tick, 2 or more = graded with partial marks) and weight.
function checklistEditDto(checklist) {
  if (!checklist) return { sections: [] };
  return {
    sections: checklist.sections.map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      items: section.items.map((item) => ({
        itemId: item.itemId,
        label: item.label,
        description: item.description || "",
        marks: item.maxRawScore || 1,
        weight: item.weightCategory || "major",
        critical: Boolean(item.criticalSafetyItem),
      })),
    })),
  };
}

function editableDto(station, checklist) {
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
    vivaQuestions: (station.vivaQuestions || []).map((q) => ({ question: q.question || "", answer: q.modelAnswerOutline || "" })),
    reviewVisibility: Object.fromEntries(REVIEW_PARTS.map((key) => [key, station.reviewVisibility?.[key] !== false])),
    checklist: checklistEditDto(checklist),
  };
}

const WEIGHTS = ["critical", "major", "minor"];

// Applies the edited checklist. Existing items keep their ids (and their
// matching keywords and feedback text), so past results still line up.
function applyChecklist(checklist, input, slug) {
  if (!input || !Array.isArray(input.sections) || !input.sections.length || input.sections.length > 12) throw badRequest("The checklist needs 1 to 12 sections.");
  const previous = new Map(checklist.sections.flatMap((s) => s.items.map((item) => [item.itemId, item.toObject ? item.toObject() : item])));
  const used = new Set();
  let order = 0;
  let next = Date.now() % 100000;
  const sections = input.sections.map((section, si) => {
    const title = typeof section?.title === "string" ? section.title.trim() : "";
    if (!title || title.length > 120) throw badRequest(`Checklist section ${si + 1} needs a title.`);
    if (!Array.isArray(section.items) || !section.items.length || section.items.length > 40) throw badRequest(`"${title}" needs 1 to 40 items.`);
    const sectionId = typeof section.sectionId === "string" && /^[\w-]{1,80}$/.test(section.sectionId) ? section.sectionId : `section_${si + 1}`;
    return {
      sectionId,
      title,
      items: section.items.map((item, ii) => {
        const label = typeof item?.label === "string" ? item.label.trim() : "";
        if (!label || label.length > 300) throw badRequest(`"${title}" item ${ii + 1} needs a label of up to 300 characters.`);
        if (!Number.isInteger(item.marks) || item.marks < 1 || item.marks > 10) throw badRequest(`"${label}" must be worth 1 to 10 marks.`);
        if (item.weight !== undefined && !WEIGHTS.includes(item.weight)) throw badRequest("Invalid weight.");
        const description = typeof item.description === "string" ? item.description.trim().slice(0, 600) : "";
        let itemId = typeof item.itemId === "string" && previous.has(item.itemId) && !used.has(item.itemId) ? item.itemId : null;
        while (!itemId || used.has(itemId)) itemId = `${slug}_c${(next += 1)}`;
        used.add(itemId);
        const before = previous.get(itemId) || {};
        const critical = item.critical === true;
        order += 1;
        return {
          ...before,
          itemId,
          label,
          description,
          maxRawScore: item.marks,
          allowPartial: item.marks > 1,
          weightCategory: critical ? "critical" : item.weight || before.weightCategory || "major",
          criticalSafetyItem: critical,
          order,
        };
      }),
    };
  });
  checklist.sections = sections;
  checklist.sourceScoring = {
    ...(checklist.sourceScoring?.toObject ? checklist.sourceScoring.toObject() : checklist.sourceScoring),
    maxRawScore: sections.reduce((sum, s) => sum + s.items.reduce((t, i) => t + i.maxRawScore, 0), 0),
  };
  checklist.version = (checklist.version || 1) + 1;
}

export async function listSpecialties(req, res) {
  const specialties = await Specialty.find().sort({ name: 1 }).lean();
  res.json({ success: true, data: specialties.map((s) => ({ id: s._id, name: s.name, slug: s.slug })) });
}

export async function getAdminStation(req, res) {
  const station = await findStation(req.params.id);
  const checklist = station.smartChecklistId ? await SmartChecklist.findById(station.smartChecklistId) : null;
  res.json({ success: true, data: editableDto(station, checklist) });
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
  const finished = station.status !== "draft";
  if (body.shortDescription !== undefined) station.shortDescription = text(body.shortDescription, "Short description", 600, finished);
  if (body.presentingComplaint !== undefined) station.presentingComplaint = text(body.presentingComplaint, "Presenting complaint", 200, finished);
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
  if (body.vivaQuestions !== undefined) {
    if (!Array.isArray(body.vivaQuestions) || body.vivaQuestions.length > 15) throw badRequest("Up to 15 examiner questions.");
    station.vivaQuestions = body.vivaQuestions
      .map((q) => ({ question: text(q?.question ?? "", "Question", 400), modelAnswerOutline: text(q?.answer ?? "", "Answer", 1500) }))
      .filter((q) => q.question);
  }
  if (body.reviewVisibility !== undefined) {
    if (typeof body.reviewVisibility !== "object" || body.reviewVisibility === null) throw badRequest("Invalid review settings.");
    for (const [key, value] of Object.entries(body.reviewVisibility)) {
      if (!REVIEW_PARTS.includes(key) || typeof value !== "boolean") throw badRequest("Invalid review settings.");
      station.set(`reviewVisibility.${key}`, value);
    }
  }

  let checklist = station.smartChecklistId ? await SmartChecklist.findById(station.smartChecklistId) : null;
  if (body.checklist !== undefined) {
    if (!checklist) throw badRequest("This station has no checklist to edit.");
    applyChecklist(checklist, body.checklist, station.slug);
    await checklist.validate();
  }

  if (!station.isModified() && !checklist?.isModified()) {
    res.json({ success: true, data: editableDto(await station.populate("specialtyId"), checklist) });
    return;
  }
  if (checklist?.isModified()) {
    await checklist.save();
    if (!station.isModified()) station.markModified("version");
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
  res.json({ success: true, data: editableDto(await station.populate("specialtyId"), checklist) });
}

// ---- Import from JSON ----
// dryRun checks the JSON and returns a summary without saving anything.
export async function importOsceStations(req, res) {
  const { stations, dryRun, draft } = req.body || {};
  if (stations === undefined) {
    const error = new Error("Paste the station JSON first.");
    error.status = 400;
    throw error;
  }
  const parsed = parseImport(stations, { draft: draft === true });
  if (dryRun === true) {
    res.json({
      success: true,
      data: {
        preview: parsed.map((p) => ({
          title: p.module.title,
          specialty: p.specialty,
          category: p.module.category,
          tasks: p.module.candidateInstructions.tasks.length,
          facts: p.patientScript.facts.length - 1,
          checklistItems: p.checklist.sections.reduce((n, sec) => n + sec.items.length, 0),
          marks: p.checklist.sourceScoring.maxRawScore,
          aiPatient: p.module.practiceModes.includes("virtual-patient"),
        })),
      },
    });
    return;
  }
  const created = await importStations(parsed, req.user.id);
  res.status(201).json({ success: true, data: { created } });
}
