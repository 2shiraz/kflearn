import mongoose from "mongoose";

const unansweredQuestionSchema = new mongoose.Schema(
  {
    patientScriptId: { type: mongoose.Schema.Types.ObjectId, ref: "PatientScript", required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: "OsceStation", required: true },
    question: { type: String, required: true },
    normalizedQuestion: { type: String, required: true },
    count: { type: Number, default: 1 },
    lastAskedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

unansweredQuestionSchema.index({ patientScriptId: 1, normalizedQuestion: 1 }, { unique: true });

export const UnansweredQuestion = mongoose.model("UnansweredQuestion", unansweredQuestionSchema);
