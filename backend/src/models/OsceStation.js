import mongoose from "mongoose";
import { OSCE_CATEGORIES } from "../utils/osceCategories.js";

const osceStationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: "Specialty", required: true },
    presentingComplaint: { type: String, required: true },
    systemOrTopic: { type: String, default: "" },
    stationType: { type: String, enum: ["history", "counselling", "examination", "interpretation", "emergency"], default: "history" },
    stationFormat: { type: String, default: "" },
    category: { type: String, enum: ["", ...OSCE_CATEGORIES.map(({ value }) => value)], default: "" },
    practiceModes: [{ type: String, enum: ["single-player", "virtual-patient"] }],
    taskTags: [{ type: String }],
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    timeLimitSeconds: { type: Number, default: 360 },
    thumbnail: { type: String, default: "" },
    shortDescription: { type: String, required: true },
    candidateInstructions: {
      context: String,
      patientSummary: String,
      tasks: [{ type: String }],
      examinationRequired: { type: Boolean, default: false },
      additionalInstructions: [{ type: String }],
    },
    candidateHandout: [{ type: String }],
    simulationScript: [{ type: String }],
    osceFrameworkId: { type: mongoose.Schema.Types.ObjectId, ref: "OsceFramework" },
    patientScriptId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientScript" },
    smartChecklistId: { type: mongoose.Schema.Types.ObjectId, ref: "SmartChecklist" },
    examinerInstructions: { type: String, default: "" },
    keyAnswerGuide: { type: String, default: "" },
    suggestedCandidateApproach: [{ type: String }],
    learningNotes: { type: String, default: "" },
    expectedCompetencies: [{ type: String }],
    criticalSafetyErrors: [{ type: String }],
    globalRatingOptions: [{ type: String }],
    assessmentDesign: [{ type: String }],
    facultyNote: { type: String, default: "" },
    facultySourceNote: [{ type: String }],
    commonMistakes: [{ type: String }],
    keyDifferentials: [{ type: String }],
    vivaQuestions: [
      {
        question: String,
        modelAnswerOutline: String,
      },
    ],
    sourceReferences: [{ type: String }],
    // Which parts of the station review students see after the station.
    // Missing or true means shown.
    reviewVisibility: {
      learningNotes: { type: Boolean, default: true },
      keyAnswerGuide: { type: Boolean, default: true },
      suggestedCandidateApproach: { type: Boolean, default: true },
      examinerInstructions: { type: Boolean, default: true },
      vivaQuestions: { type: Boolean, default: true },
      criticalSafetyErrors: { type: Boolean, default: true },
    },
    status: { type: String, enum: ["draft", "approved", "published", "archived"], default: "draft" },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    publishedAt: Date,
  },
  { timestamps: true },
);

export const OsceStation = mongoose.model("OsceStation", osceStationSchema, "oscestations");
