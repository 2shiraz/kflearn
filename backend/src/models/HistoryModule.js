import mongoose from "mongoose";

const historyModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: "Specialty", required: true },
    presentingComplaint: { type: String, required: true },
    systemOrTopic: { type: String, default: "" },
    stationType: { type: String, enum: ["history"], default: "history" },
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
    historyGuideId: { type: mongoose.Schema.Types.ObjectId, ref: "HistoryGuide" },
    patientScriptId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientScript" },
    smartChecklistId: { type: mongoose.Schema.Types.ObjectId, ref: "SmartChecklist" },
    examinerInstructions: { type: String, default: "" },
    keyAnswerGuide: { type: String, default: "" },
    suggestedCandidateApproach: [{ type: String }],
    learningNotes: { type: String, default: "" },
    commonMistakes: [{ type: String }],
    keyDifferentials: [{ type: String }],
    vivaQuestions: [
      {
        question: String,
        modelAnswerOutline: String,
      },
    ],
    sourceReferences: [{ type: String }],
    status: { type: String, enum: ["draft", "approved", "published", "archived"], default: "draft" },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    publishedAt: Date,
  },
  { timestamps: true },
);

export const HistoryModule = mongoose.model("HistoryModule", historyModuleSchema);
