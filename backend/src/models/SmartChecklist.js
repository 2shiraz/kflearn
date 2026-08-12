import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "history" },
    expectedConcepts: [{ type: String }],
    relatedFactIds: [{ type: String }],
    weightCategory: { type: String, enum: ["critical", "major", "minor"], default: "major" },
    maxRawScore: { type: Number, default: 1, min: 0 },
    allowPartial: { type: Boolean, default: true },
    criticalSafetyItem: { type: Boolean, default: false },
    commonMistake: { type: String, default: "" },
    remediationText: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

const smartChecklistSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sourceScoring: {
      maxRawScore: { type: Number, required: true },
      description: { type: String, default: "" },
    },
    weightConfiguration: {
      critical: { type: Number, default: 3 },
      major: { type: Number, default: 2 },
      minor: { type: Number, default: 1 },
    },
    sections: [
      {
        sectionId: { type: String, required: true },
        title: { type: String, required: true },
        items: [checklistItemSchema],
      },
    ],
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["draft", "approved", "published", "archived"], default: "draft" },
  },
  { timestamps: true },
);

smartChecklistSchema.pre("validate", function validateUniqueItemIds(next) {
  const ids = this.sections.flatMap((section) => section.items.map((item) => item.itemId));
  if (ids.length !== new Set(ids).size) {
    next(new Error("Checklist itemId values must be unique."));
    return;
  }
  next();
});

export const SmartChecklist = mongoose.model("SmartChecklist", smartChecklistSchema);
