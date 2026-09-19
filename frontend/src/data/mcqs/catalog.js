// MCQ catalog used by the app: the original MBBS 1-4 banks (index.js) plus any
// extra banks dropped into ./extra/.
//
// To add a new bank: put <slug>.json and <slug>.meta.json in ./extra/
// (generate both with tools/parse_final_year.py). No code changes needed —
// Vite picks them up automatically below.
import { mcqYears as baseYears, loadQuestions as loadBaseQuestions } from "./index";

const extraMeta = import.meta.glob("./extra/*.meta.json", { eager: true, import: "default" });
const extraData = import.meta.glob(["./extra/*.json", "!./extra/*.meta.json"], { import: "default" });

const extraYears = Object.values(extraMeta).sort((a, b) => a.year - b.year);

export const mcqYears = [...baseYears, ...extraYears];

export const mcqTotalCount = mcqYears.reduce((sum, y) => sum + y.count, 0);

export function getYear(yearSlug) {
  return mcqYears.find((y) => y.slug === yearSlug) || null;
}

export function getBlock(yearSlug, blockSlug) {
  return getYear(yearSlug)?.blocks.find((b) => b.slug === blockSlug) || null;
}

// Returns questions for a whole year, one block, or one topic: [{ id, s, o, a, e, topic, block }]
export async function loadQuestions(yearSlug, blockSlug, topicSlug) {
  const year = extraYears.find((y) => y.slug === yearSlug);
  if (!year) return loadBaseQuestions(yearSlug, blockSlug, topicSlug);

  const load = extraData[`./extra/${yearSlug}.json`];
  if (!load) throw new Error("Question file for this year is missing.");
  const data = await load();
  const out = [];
  for (const block of year.blocks) {
    if (blockSlug && block.slug !== blockSlug) continue;
    for (const topic of block.topics) {
      if (topicSlug && topic.slug !== topicSlug) continue;
      for (const q of data[`${block.slug}/${topic.slug}`] || []) out.push({ ...q, topic: topic.name, block: block.name });
    }
  }
  return out;
}
