import { ContentMeta, GuideEntry, McqTopic, OspeTopic } from "../models/Content.js";

// All study content lives in server memory (a few MB), loaded from the
// database and reloaded only when the content version changes (re-checked at
// most once a minute). Nothing is served without an access check upstream.
const RECHECK_MS = 60 * 1000;
const GUIDES = ["history", "exam", "handouts"];

let state = null;
let checkedAt = 0;
let loading = null;

const topicKey = (y, b, t) => `${y}/${b}/${t}`;
const summaryOf = ({ sections: _sections, ...summary }) => summary;

function notFound(message = "Not found.") {
  const error = new Error(message);
  error.status = 404;
  return error;
}

async function load(version) {
  const [meta, mcqTopics, ospeTopics, guideEntries] = await Promise.all([
    ContentMeta.find().lean(),
    McqTopic.find().sort({ yearSlug: 1, order: 1 }).lean(),
    OspeTopic.find().sort({ yearSlug: 1, order: 1 }).lean(),
    GuideEntry.find().sort({ guide: 1, order: 1 }).lean(),
  ]);
  const metaOf = Object.fromEntries(meta.map((m) => [m.key, m.data]));
  const guides = {};
  for (const guide of GUIDES) {
    const entries = guideEntries.filter((e) => e.guide === guide).map((e) => e.data);
    guides[guide] = { meta: metaOf[`${guide}-meta`] || {}, entries, summaries: entries.map(summaryOf) };
  }
  return {
    version: version || 0,
    mcqCatalog: metaOf["mcq-catalog"] || [],
    ospeCatalog: metaOf["ospe-catalog"] || [],
    mcqTopics: new Map(mcqTopics.map((t) => [topicKey(t.yearSlug, t.blockSlug, t.topicSlug), t.questions])),
    ospeTopics: new Map(ospeTopics.map((t) => [topicKey(t.yearSlug, t.blockSlug, t.topicSlug), t.stations])),
    guides,
  };
}

async function currentVersion() {
  return (await ContentMeta.findOne({ key: "version" }).lean())?.data || 0;
}

export async function getContent() {
  if (state && Date.now() - checkedAt < RECHECK_MS) return state;
  loading ??= (async () => {
    const version = await currentVersion();
    if (!state || state.version !== version) state = await load(version);
    checkedAt = Date.now();
    return state;
  })().finally(() => {
    loading = null;
  });
  return loading;
}

// Drops the in-memory copy (after an import in the same process, and in tests).
export function resetContentCache() {
  state = null;
  checkedAt = 0;
}

export async function contentCatalog() {
  const c = await getContent();
  return {
    version: c.version,
    mcq: c.mcqCatalog,
    ospe: c.ospeCatalog,
    guides: Object.fromEntries(GUIDES.map((g) => [g, c.guides[g].summaries])),
  };
}

// Counts only, for the public pages.
export async function contentCounts() {
  const c = await getContent();
  const total = (catalog) => catalog.reduce((n, y) => n + y.count, 0);
  const yearSummary = (y) => ({ year: y.year, name: y.name, count: y.count, blocks: y.blocks.map((b) => ({ name: b.name, count: b.count })) });
  return {
    mcq: { total: total(c.mcqCatalog), years: c.mcqCatalog.map(yearSummary) },
    ospe: { total: total(c.ospeCatalog), years: c.ospeCatalog.map(yearSummary) },
    examGuides: { total: c.guides.exam.entries.length, titles: c.guides.exam.summaries.map((s) => s.title) },
    historyGuides: { total: c.guides.history.entries.length, titles: c.guides.history.summaries.map((s) => s.title) },
    handouts: { total: c.guides.handouts.entries.length, systems: [...new Set(c.guides.handouts.summaries.map((s) => s.category))] },
  };
}

export async function guideIndex(guide) {
  if (!GUIDES.includes(guide)) throw notFound();
  const c = await getContent();
  return { version: c.version, meta: c.guides[guide].meta, entries: c.guides[guide].summaries };
}

export async function guidePage(guide, slug) {
  if (!GUIDES.includes(guide)) throw notFound();
  const c = await getContent();
  const { entries, summaries } = c.guides[guide];
  const index = entries.findIndex((e) => e.slug === slug);
  if (index === -1) throw notFound("That page doesn't exist.");
  return {
    version: c.version,
    entry: entries[index],
    prev: index > 0 ? summaries[index - 1] : null,
    next: index < entries.length - 1 ? summaries[index + 1] : null,
  };
}

// One block (or one topic in it) at a time: never a whole year or bank.
function blockItems(catalog, topics, yearSlug, blockSlug, topicSlug) {
  const year = catalog.find((y) => y.slug === yearSlug);
  const block = year?.blocks.find((b) => b.slug === blockSlug);
  if (!block) throw notFound("That block doesn't exist.");
  const chosen = topicSlug ? block.topics.filter((t) => t.slug === topicSlug) : block.topics;
  if (topicSlug && !chosen.length) throw notFound("That topic doesn't exist.");
  const items = [];
  for (const topic of chosen) {
    for (const item of topics.get(topicKey(yearSlug, blockSlug, topic.slug)) || []) {
      items.push({ ...item, topic: topic.name, topicSlug: topic.slug, block: block.name, blockSlug: block.slug });
    }
  }
  return items;
}

export async function mcqBlock(yearSlug, blockSlug, topicSlug) {
  const c = await getContent();
  return { version: c.version, questions: blockItems(c.mcqCatalog, c.mcqTopics, yearSlug, blockSlug, topicSlug) };
}

export async function ospeBlock(yearSlug, blockSlug, topicSlug) {
  const c = await getContent();
  return { version: c.version, stations: blockItems(c.ospeCatalog, c.ospeTopics, yearSlug, blockSlug, topicSlug) };
}
