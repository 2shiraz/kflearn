// Writes src/content/catalogSummary.json: names and counts only (no questions,
// answers or guide text) for the public stats endpoint. Run it after the MCQ,
// OSPE or guide banks change:
//
//   node src/scripts/buildCatalogSummary.js
//
// For now it reads the banks from frontend/src/data. Once the content moves
// to the database, the stats come from there and this script goes away.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../../../frontend/src/data");
const outFile = path.resolve(here, "../content/catalogSummary.json");

// mcqs/index.js holds the year tree as a JSON array literal next to loader
// code that only runs under Vite, so read the literal out of the source.
function readMcqYears() {
  const src = fs.readFileSync(path.join(dataDir, "mcqs/index.js"), "utf8");
  const marker = "export const mcqYears = ";
  const start = src.indexOf(marker) + marker.length;
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === "[") depth += 1;
    if (src[i] === "]" && --depth === 0) { end = i + 1; break; }
  }
  const base = JSON.parse(src.slice(start, end));
  const extraDir = path.join(dataDir, "mcqs/extra");
  const extra = fs.readdirSync(extraDir)
    .filter((f) => f.endsWith(".meta.json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(extraDir, f), "utf8")));
  return [...base, ...extra].sort((a, b) => a.year - b.year);
}

const yearSummary = (y) => ({
  year: y.year,
  name: y.name,
  count: y.count,
  blocks: y.blocks.map((b) => ({ name: b.name, count: b.count })),
});

const mcqYears = readMcqYears();
const ospeYears = JSON.parse(fs.readFileSync(path.join(dataDir, "ospe/years.json"), "utf8"));
const { handouts } = await import(pathToFileURL(path.join(dataDir, "handoutNotes.js")).href);
const { stations } = await import(pathToFileURL(path.join(dataDir, "clinicalExaminationGuide.js")).href);
const { topics } = await import(pathToFileURL(path.join(dataDir, "historyTakingGuide.js")).href);

const summary = {
  mcq: { total: mcqYears.reduce((n, y) => n + y.count, 0), years: mcqYears.map(yearSummary) },
  ospe: { total: ospeYears.reduce((n, y) => n + y.count, 0), years: ospeYears.map(yearSummary) },
  examGuides: { total: stations.length, titles: stations.map((s) => s.title) },
  historyGuides: { total: topics.length, titles: topics.map((t) => t.title) },
  handouts: { total: handouts.length, systems: [...new Set(handouts.map((h) => h.category))] },
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), outFile)}: ${summary.mcq.total} MCQs, ${summary.ospe.total} OSPE stations, ${summary.examGuides.total} examination guides, ${summary.historyGuides.total} history guides, ${summary.handouts.total} handouts.`);
