import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Reads the study content from backend/content-source (written by the docx
// parsers in tools/) into plain objects ready for the database. Nothing here
// is ever sent to a browser directly.
export const DEFAULT_SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../content-source");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

// mcqs/index.js holds the year tree as a JSON array literal; read it out of
// the source text rather than running the file.
function readMcqYearTree(dir) {
  const src = fs.readFileSync(path.join(dir, "mcqs/index.js"), "utf8");
  const marker = "export const mcqYears = ";
  const start = src.indexOf(marker) + marker.length;
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === "[") depth += 1;
    if (src[i] === "]" && --depth === 0) { end = i + 1; break; }
  }
  return JSON.parse(src.slice(start, end));
}

// Turns a year tree plus its "block/topic" -> items file into topic rows.
function topicRows(years, dir, itemKey) {
  const rows = [];
  for (const year of years) {
    const file = path.join(dir, `${year.slug}.json`);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    const data = readJson(file);
    let order = 0;
    for (const block of year.blocks) {
      for (const topic of block.topics) {
        rows.push({
          yearSlug: year.slug,
          blockSlug: block.slug,
          topicSlug: topic.slug,
          order: order++,
          [itemKey]: data[`${block.slug}/${topic.slug}`] || [],
        });
      }
    }
  }
  return rows;
}

// Years -> blocks -> topics with names, slugs and counts only.
const catalogOf = (years) => years.map((y) => ({
  slug: y.slug,
  year: y.year,
  name: y.name,
  count: y.count,
  blocks: y.blocks.map((b) => ({
    slug: b.slug,
    name: b.name,
    count: b.count,
    topics: b.topics.map((t) => ({ slug: t.slug, name: t.name, count: t.count })),
  })),
}));

const importModule = (dir, file) => import(pathToFileURL(path.join(dir, file)).href);
const entries = (guide, list) => list.map((data, order) => ({ guide, slug: data.slug, order, data }));

export async function readContentSource(dir = DEFAULT_SOURCE) {
  // MCQs: the original banks plus anything dropped into mcqs/extra.
  const extraDir = path.join(dir, "mcqs/extra");
  const extraYears = fs.existsSync(extraDir)
    ? fs.readdirSync(extraDir).filter((f) => f.endsWith(".meta.json")).map((f) => readJson(path.join(extraDir, f)))
    : [];
  const baseYears = readMcqYearTree(dir);
  const mcqTopics = [...topicRows(baseYears, path.join(dir, "mcqs"), "questions"), ...topicRows(extraYears, extraDir, "questions")];
  const mcqYears = [...baseYears, ...extraYears].sort((a, b) => a.year - b.year);

  const ospeYears = readJson(path.join(dir, "ospe/years.json"));
  const ospeTopics = topicRows(ospeYears, path.join(dir, "ospe"), "stations");

  const history = await importModule(dir, "historyTakingGuide.js");
  const exam = await importModule(dir, "clinicalExaminationGuide.js");
  const handouts = await importModule(dir, "handoutNotes.js");

  return {
    mcq: { catalog: catalogOf(mcqYears), topics: mcqTopics },
    ospe: { catalog: catalogOf(ospeYears), topics: ospeTopics },
    guides: {
      history: {
        meta: {
          universalOpening: history.universalOpening,
          coreMnemonics: history.coreMnemonics,
          generalApproach: history.generalApproach,
          communicationSkills: history.communicationSkills,
          presentationTemplate: history.presentationTemplate,
          masterChecklist: history.masterChecklist,
        },
        entries: entries("history", history.topics),
      },
      exam: {
        meta: {
          universalOpening: exam.universalOpening,
          coreMnemonic: exam.coreMnemonic,
          mskFramework: exam.mskFramework,
          masterQuickReference: exam.masterQuickReference,
          presentationTemplate: exam.presentationTemplate,
          finalChecklist: exam.finalChecklist,
        },
        entries: entries("exam", exam.stations),
      },
      handouts: {
        meta: { aboutThisCollection: handouts.aboutThisCollection, categoryOrder: handouts.CATEGORY_ORDER },
        entries: entries("handouts", handouts.handouts),
      },
    },
  };
}
