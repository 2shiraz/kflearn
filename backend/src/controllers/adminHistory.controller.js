import { ContentAuditLog } from "../models/ContentAuditLog.js";
import { HistoryModule } from "../models/HistoryModule.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";
import { HistoryGuide } from "../models/HistoryGuide.js";
import { moduleListDto } from "../services/history.service.js";

export async function listAdminModules(req, res) {
  const modules = await HistoryModule.find().populate("specialtyId").sort({ updatedAt: -1 });
  res.json({ success: true, data: modules.map(moduleListDto) });
}

export async function createHistoryContent(req, res) {
  const { specialtySlug, specialtyName, guideSlug, module, patientScript, checklist } = req.body;
  const specialty = await Specialty.findOneAndUpdate(
    { slug: specialtySlug },
    { $set: { name: specialtyName || specialtySlug, slug: specialtySlug, active: true } },
    { upsert: true, new: true },
  );
  const guide = guideSlug ? await HistoryGuide.findOne({ slug: guideSlug }) : null;
  const script = await PatientScript.create(patientScript);
  const smartChecklist = await SmartChecklist.create(checklist);
  const createdModule = await HistoryModule.create({
    ...module,
    specialtyId: specialty._id,
    historyGuideId: guide?._id,
    patientScriptId: script._id,
    smartChecklistId: smartChecklist._id,
    status: "draft",
    createdBy: req.user.id,
  });
  await ContentAuditLog.create({
    contentType: "HistoryModule",
    contentId: createdModule._id,
    action: "created",
    changedBy: req.user.id,
    summary: "Created draft history content bundle.",
  });
  res.status(201).json({ success: true, data: { module: createdModule } });
}

export async function updateModuleStatus(req, res) {
  const module = await HistoryModule.findById(req.params.id);
  if (!module) {
    const error = new Error("Module not found.");
    error.status = 404;
    throw error;
  }
  const { status } = req.body;
  if (!["draft", "approved", "published", "archived"].includes(status)) {
    const error = new Error("Invalid status.");
    error.status = 400;
    throw error;
  }
  module.status = status;
  if (status === "published") module.publishedAt = new Date();
  await module.save();
  await ContentAuditLog.create({
    contentType: "HistoryModule",
    contentId: module._id,
    version: module.version,
    action: status,
    changedBy: req.user.id,
    summary: `Status changed to ${status}.`,
  });
  res.json({ success: true, data: { module } });
}
