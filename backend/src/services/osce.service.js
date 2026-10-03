import mongoose from "mongoose";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";

export function stationListDto(module) {
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
    stationType: module.stationType,
    stationFormat: module.stationFormat,
  };
}

export function studentStationDetailDto(module, { includeReview = false } = {}) {
  const hasPostStationReview = Boolean(module.assessmentDesign?.length);
  return {
    ...stationListDto(module),
    candidateInstructions: module.candidateInstructions,
    candidateHandout: module.candidateHandout || [],
    practiceOptions: module.practiceModes?.length ? module.practiceModes : ["single-player", "virtual-patient"],
    learningNotes: !hasPostStationReview || includeReview ? module.learningNotes : undefined,
    commonMistakes: module.commonMistakes,
    keyDifferentials: module.keyDifferentials,
    vivaQuestions: !hasPostStationReview || includeReview ? module.vivaQuestions : undefined,
    ...(includeReview ? {
      examinerInstructions: module.examinerInstructions,
      keyAnswerGuide: module.keyAnswerGuide,
      suggestedCandidateApproach: module.suggestedCandidateApproach,
      expectedCompetencies: module.expectedCompetencies,
      criticalSafetyErrors: module.criticalSafetyErrors,
      globalRatingOptions: module.globalRatingOptions,
      assessmentDesign: module.assessmentDesign,
      facultyNote: module.facultyNote,
    } : {}),
  };
}

export function singlePlayerDto({ module, patientScript, checklist }) {
  return {
    ...studentStationDetailDto(module, { includeReview: true }),
    simulationScript: module.simulationScript || [],
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

export async function getPublishedStationBySlug(slug) {
  const module = await OsceStation.findOne({ slug, status: "published" }).populate("specialtyId");
  if (!module) {
    const error = new Error("OSCE station not found.");
    error.status = 404;
    throw error;
  }
  return module;
}

export async function getStationClinicalBundle(stationId) {
  if (!mongoose.isObjectIdOrHexString(stationId)) {
    const error = new Error("OSCE station not found.");
    error.status = 404;
    throw error;
  }
  const module = await OsceStation.findById(stationId).populate("specialtyId");
  if (!module) {
    const error = new Error("OSCE station not found.");
    error.status = 404;
    throw error;
  }
  const [patientScript, checklist] = await Promise.all([
    PatientScript.findById(module.patientScriptId),
    SmartChecklist.findById(module.smartChecklistId),
  ]);
  if (!patientScript || !checklist) {
    const error = new Error("OSCE station clinical content is incomplete.");
    error.status = 409;
    throw error;
  }
  return { module, patientScript, checklist };
}
