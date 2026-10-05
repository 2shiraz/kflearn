import { ContentMeta, GuideEntry, McqTopic, OspeTopic } from "../models/Content.js";
import { readContentSource } from "./readContentSource.js";

// Replaces the study content in the connected database with what's in
// content-source, and bumps the content version so running servers reload
// it and browsers' cached copies are re-checked.
export async function importContent({ source } = {}) {
  const content = await readContentSource(source);
  const guideRows = Object.values(content.guides).flatMap((g) => g.entries);

  await Promise.all([McqTopic.deleteMany({}), OspeTopic.deleteMany({}), GuideEntry.deleteMany({})]);
  await McqTopic.insertMany(content.mcq.topics, { ordered: true });
  await OspeTopic.insertMany(content.ospe.topics, { ordered: true });
  await GuideEntry.insertMany(guideRows, { ordered: true });

  const meta = {
    "mcq-catalog": content.mcq.catalog,
    "ospe-catalog": content.ospe.catalog,
    "history-meta": content.guides.history.meta,
    "exam-meta": content.guides.exam.meta,
    "handouts-meta": content.guides.handouts.meta,
    version: Date.now(),
  };
  for (const [key, data] of Object.entries(meta)) {
    await ContentMeta.findOneAndUpdate({ key }, { $set: { data } }, { upsert: true });
  }
  return {
    mcqTopics: content.mcq.topics.length,
    mcqs: content.mcq.topics.reduce((n, t) => n + t.questions.length, 0),
    ospeStations: content.ospe.topics.reduce((n, t) => n + t.stations.length, 0),
    guidePages: guideRows.length,
    version: meta.version,
  };
}
