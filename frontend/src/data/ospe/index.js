// OSPE station bank (MBBS 1-4, 100 stations per year, 20 per module/block).
// Generated from the MBBS<n>_OSPE_Bank_100.docx files by tools/parse_ospe_docx.py —
// rerun that script instead of hand-editing the JSON.
// years.json holds the year -> block -> topic tree; station bodies live in
// mbbs-<year>.json and are loaded on demand so they stay out of the main bundle.
// Static practice content: checklists ship to the browser, so don't reuse this for graded exams.
import years from "./years.json";

export const ospeYears = years;

export const ospeTotalCount = ospeYears.reduce((sum, y) => sum + y.count, 0);

const loaders = import.meta.glob(["./mbbs-*.json"], { import: "default" });

export function getYear(yearSlug) {
  return ospeYears.find((y) => y.slug === yearSlug) || null;
}

export function getBlock(yearSlug, blockSlug) {
  return getYear(yearSlug)?.blocks.find((b) => b.slug === blockSlug) || null;
}

// Returns stations for a whole year, one block, or one topic:
// [{ id, n, t: title, sc: scenario, tk: [tasks], ck: [checklist], topic, block }]
export async function loadStations(yearSlug, blockSlug, topicSlug) {
  const year = getYear(yearSlug);
  const load = loaders[`./${yearSlug}.json`];
  if (!year || !load) throw new Error("Unknown year.");
  const data = await load();
  const out = [];
  for (const block of year.blocks) {
    if (blockSlug && block.slug !== blockSlug) continue;
    for (const topic of block.topics) {
      if (topicSlug && topic.slug !== topicSlug) continue;
      for (const s of data[`${block.slug}/${topic.slug}`] || []) out.push({ ...s, topic: topic.name, block: block.name });
    }
  }
  return out;
}
