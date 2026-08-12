import mongoose from "mongoose";

const guideItemSchema = new mongoose.Schema(
  {
    conceptId: { type: String, required: true },
    heading: { type: String, required: true },
    explanation: { type: String, default: "" },
    exampleQuestions: [{ type: String }],
  },
  { _id: false },
);

const historyGuideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    type: { type: String, enum: ["universal", "presenting-complaint", "specialty"], required: true },
    specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: "Specialty" },
    presentingComplaint: { type: String, default: "" },
    overview: { type: String, default: "" },
    sections: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        items: [guideItemSchema],
      },
    ],
    frameworks: [
      {
        name: { type: String, required: true },
        acronym: { type: String, default: "" },
        items: [{ type: String }],
      },
    ],
    redFlags: [{ type: String }],
    differentials: [{ type: String }],
    commonMistakes: [{ type: String }],
    sourceReferences: [{ type: String }],
    status: { type: String, enum: ["draft", "approved", "published", "archived"], default: "draft" },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: "seed" },
    reviewedBy: { type: String, default: "" },
    publishedAt: Date,
  },
  { timestamps: true },
);

export const HistoryGuide = mongoose.model("HistoryGuide", historyGuideSchema);
