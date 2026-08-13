import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    rawScore: Number,
    maxRawScore: Number,
    weightedScore: Number,
    maxWeightedScore: Number,
    percentage: Number,
  },
  { _id: false },
);

const historyAttemptSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    historyModuleId: { type: mongoose.Schema.Types.ObjectId, ref: "HistoryModule", required: true },
    patientScriptVersion: Number,
    checklistVersion: Number,
    moduleVersion: Number,
    mode: { type: String, enum: ["single-player", "virtual-patient"], required: true },
    aiProvider: { type: String, enum: ["groq", "openai"], default: "groq" },
    status: {
      type: String,
      enum: ["started", "active", "ended", "self-assessed", "ai-assessed"],
      default: "started",
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    elapsedSeconds: { type: Number, default: 0 },
    timerState: { type: String, default: "running" },
    notes: { type: String, default: "" },
    messages: [
      {
        messageId: { type: String, required: true },
        role: { type: String, enum: ["student", "patient", "system"], required: true },
        inputType: { type: String, enum: ["typed", "voice"], default: "typed" },
        originalTranscript: String,
        finalText: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        matchedFactIds: [{ type: String }],
        matchedConceptIds: [{ type: String }],
      },
    ],
    internalCoverage: {
      factIds: [{ type: String }],
      conceptIds: [{ type: String }],
      checklistItemIds: [{ type: String }],
    },
    selfAssessment: {
      checkedItemIds: [{ type: String }],
      itemScores: [{ itemId: String, rawScore: Number, evidence: String }],
    },
    aiAssessment: {
      itemScores: [{ itemId: String, rawScore: Number, evidence: String, rationale: String }],
      model: String,
      provider: String,
    },
    finalScore: scoreSchema,
    feedback: {
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      missedItems: [{ type: String }],
      summary: String,
    },
  },
  { timestamps: true },
);

export const HistoryAttempt = mongoose.model("HistoryAttempt", historyAttemptSchema);
