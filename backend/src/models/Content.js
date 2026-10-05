import mongoose from "mongoose";

// Paid study content, served only to accounts with access (see
// services/content.service.js). Loaded by src/scripts/importContent.js from
// backend/content-source; never bundled into the website's code.

// One MCQ topic: its questions, in bank order.
const mcqTopicSchema = new mongoose.Schema({
  yearSlug: { type: String, required: true },
  blockSlug: { type: String, required: true },
  topicSlug: { type: String, required: true },
  order: { type: Number, default: 0 },
  questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
});
mcqTopicSchema.index({ yearSlug: 1, blockSlug: 1, topicSlug: 1 }, { unique: true });

// One OSPE topic: its stations.
const ospeTopicSchema = new mongoose.Schema({
  yearSlug: { type: String, required: true },
  blockSlug: { type: String, required: true },
  topicSlug: { type: String, required: true },
  order: { type: Number, default: 0 },
  stations: { type: [mongoose.Schema.Types.Mixed], default: [] },
});
ospeTopicSchema.index({ yearSlug: 1, blockSlug: 1, topicSlug: 1 }, { unique: true });

// One page of a guide: a history-taking topic, an examination or a handout.
const guideEntrySchema = new mongoose.Schema({
  guide: { type: String, enum: ["history", "exam", "handouts"], required: true },
  slug: { type: String, required: true },
  order: { type: Number, default: 0 },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
});
guideEntrySchema.index({ guide: 1, slug: 1 }, { unique: true });

// Catalogs (years, blocks, topics, counts), guide overview content, and the
// content version that every response's ETag is built from.
const contentMetaSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export const McqTopic = mongoose.model("McqTopic", mcqTopicSchema);
export const OspeTopic = mongoose.model("OspeTopic", ospeTopicSchema);
export const GuideEntry = mongoose.model("GuideEntry", guideEntrySchema);
export const ContentMeta = mongoose.model("ContentMeta", contentMetaSchema);
