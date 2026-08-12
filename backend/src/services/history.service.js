import { HistoryModule } from "../models/HistoryModule.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";

export function moduleListDto(module) {
  return {
    id: module._id,
    title: module.title,
    slug: module.slug,
    presentingComplaint: module.presentingComplaint,
    specialty: module.specialtyId ? { id: module.specialtyId._id, name: module.specialtyId.name, slug: module.specialtyId.slug } : null,
    difficulty: module.difficulty,
    status: module.status,
    timeLimitSeconds: module.timeLimitSeconds,
    shortDescription: module.shortDescription,
    taskTags: module.taskTags,
  };
}

export function studentModuleDetailDto(module) {
  return {
    ...moduleListDto(module),
    candidateInstructions: module.candidateInstructions,
    practiceOptions: ["single-player", "virtual-patient"],
    learningNotes: module.learningNotes,
    commonMistakes: module.commonMistakes,
    keyDifferentials: module.keyDifferentials,
    vivaQuestions: module.vivaQuestions,
  };
}

export function singlePlayerDto({ module, patientScript, checklist }) {
  return {
    ...studentModuleDetailDto(module),
    patientScript: {
      patientIdentity: patientScript.patientIdentity,
      openingStatement: patientScript.openingStatement,
      facts: patientScript.facts.map((fact) => ({
        factId: fact.factId,
        section: fact.section,
        label: fact.label,
        value: fact.value,
        naturalResponse: fact.naturalResponse,
      })),
    },
    checklist: checklistDto(checklist),
    examinerInstructions: module.examinerInstructions,
    keyAnswerGuide: module.keyAnswerGuide,
    suggestedCandidateApproach: module.suggestedCandidateApproach,
  };
}

export function checklistDto(checklist) {
  return {
    id: checklist._id,
    title: checklist.title,
    sourceScoring: checklist.sourceScoring,
    sections: checklist.sections.map((section) => ({
      sectionId: section.sectionId,
      title: section.title,
      items: section.items.map((item) => ({
        itemId: item.itemId,
        label: item.label,
        description: item.description,
        category: item.category,
        weightCategory: item.weightCategory,
        maxRawScore: item.maxRawScore,
        allowPartial: item.allowPartial,
        criticalSafetyItem: item.criticalSafetyItem,
        commonMistake: item.commonMistake,
        remediationText: item.remediationText,
        order: item.order,
      })),
    })),
  };
}

export async function getPublishedModuleBySlug(slug) {
  const module = await HistoryModule.findOne({ slug, status: "published" }).populate("specialtyId");
  if (!module) {
    const error = new Error("History module not found.");
    error.status = 404;
    throw error;
  }
  return module;
}

export async function getModuleClinicalBundle(moduleId) {
  const module = await HistoryModule.findById(moduleId).populate("specialtyId");
  if (!module) {
    const error = new Error("History module not found.");
    error.status = 404;
    throw error;
  }
  const [patientScript, checklist] = await Promise.all([
    PatientScript.findById(module.patientScriptId),
    SmartChecklist.findById(module.smartChecklistId),
  ]);
  if (!patientScript || !checklist) {
    const error = new Error("History module clinical content is incomplete.");
    error.status = 409;
    throw error;
  }
  return { module, patientScript, checklist };
}
