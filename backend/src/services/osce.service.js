import mongoose from "mongoose";
import { OSCE_CATEGORIES, stationCategory, stationPracticeOptions } from "../utils/osceCategories.js";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { remember } from "./stationCache.service.js";

export function stationListDto(module) {
  const category = stationCategory(module);
  const practiceOptions = stationPracticeOptions(module);
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
    category,
    categoryLabel: OSCE_CATEGORIES.find(({ value }) => value === category).label,
    practiceOptions,
    aiVirtualPatientAvailable: practiceOptions.includes("virtual-patient"),
  };
}

export const REVIEW_PARTS = ["learningNotes", "keyAnswerGuide", "suggestedCandidateApproach", "examinerInstructions", "vivaQuestions", "criticalSafetyErrors"];

// A review part is shown unless the admin switched it off for this station.
const reviewShown = (module, key) => module.reviewVisibility?.[key] !== false;

export function studentStationDetailDto(module, { includeReview = false } = {}) {
  const hasPostStationReview = Boolean(module.assessmentDesign?.length);
  const show = (key, value) => (reviewShown(module, key) ? value : undefined);
  return {
    ...stationListDto(module),
    candidateInstructions: module.candidateInstructions,
    candidateHandout: module.candidateHandout || [],
    practiceOptions: stationPracticeOptions(module),
    learningNotes: !hasPostStationReview || includeReview ? show("learningNotes", module.learningNotes) : undefined,
    commonMistakes: module.commonMistakes,
    keyDifferentials: module.keyDifferentials,
    vivaQuestions: !hasPostStationReview || includeReview ? show("vivaQuestions", module.vivaQuestions) : undefined,
    ...(includeReview ? {
      examinerInstructions: show("examinerInstructions", module.examinerInstructions),
      keyAnswerGuide: show("keyAnswerGuide", module.keyAnswerGuide),
      suggestedCandidateApproach: show("suggestedCandidateApproach", module.suggestedCandidateApproach),
      expectedCompetencies: module.expectedCompetencies,
      criticalSafetyErrors: show("criticalSafetyErrors", module.criticalSafetyErrors),
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
  const module = typeof slug === "string"
    ? await remember(`slug:${slug}`, () => OsceStation.findOne({ slug, status: "published" }).populate("specialtyId"))
    : null;
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
  // Read on every AI patient message, so kept in memory (see stationCache).
  const bundle = await remember(`bundle:${stationId}`, async () => {
    const module = await OsceStation.findById(stationId).populate("specialtyId");
    if (!module) return null;
    const [patientScript, checklist] = await Promise.all([
      PatientScript.findById(module.patientScriptId),
      SmartChecklist.findById(module.smartChecklistId),
    ]);
    return { module, patientScript, checklist };
  });
  if (!bundle) {
    const error = new Error("OSCE station not found.");
    error.status = 404;
    throw error;
  }
  const { module, patientScript, checklist } = bundle;
  if (!patientScript || !checklist) {
    const error = new Error("OSCE station clinical content is incomplete.");
    error.status = 409;
    throw error;
  }
  return { module, patientScript, checklist };
}
