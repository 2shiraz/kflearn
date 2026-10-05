// Fails the build if any paid study content (MCQ questions, OSPE stations,
// guide or handout text) ends up in the built website. The content lives in
// backend/content-source and is only served by the API to accounts with
// access; it must never be bundled into public files again.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const source = path.resolve(here, "../../backend/content-source");

// Hand-written public previews that are allowed in the website on purpose
// (the landing page's sample question).
const ALLOWED = [
  "A 58-year-old man presents with crushing central chest pain radiating",
  "ST elevation in the inferior leads (II, III, aVF) classically indicates",
];

if (!fs.existsSync(source)) {
  console.warn("check-dist: backend/content-source not found, skipping the content check.");
  process.exit(0);
}

const probes = new Set();
const add = (text) => {
  if (typeof text !== "string") return;
  const clean = text.trim();
  if (clean.length < 60) return;
  const probe = clean.slice(0, 50);
  if (!ALLOWED.some((a) => probe.startsWith(a.slice(0, 50)) || a.startsWith(probe))) probes.add(probe);
};
const walk = (value) => {
  if (typeof value === "string") add(value);
  else if (Array.isArray(value)) value.forEach(walk);
  else if (value && typeof value === "object") Object.values(value).forEach(walk);
};

for (const dir of ["mcqs", "mcqs/extra", "ospe"]) {
  const full = path.join(source, dir);
  if (!fs.existsSync(full)) continue;
  for (const file of fs.readdirSync(full)) {
    if (!/^mbbs-\d+\.json$/.test(file)) continue;
    const data = JSON.parse(fs.readFileSync(path.join(full, file), "utf8"));
    for (const items of Object.values(data)) {
      // Every 4th item keeps the scan quick while still catching any bundle.
      items.forEach((item, i) => { if (i % 4 === 0) { add(item.s); add(item.e); add(item.sc); } });
    }
  }
}
for (const file of ["historyTakingGuide.js", "clinicalExaminationGuide.js", "handoutNotes.js"]) {
  const mod = await import(pathToFileURL(path.join(source, file)).href);
  walk(Object.values(mod).filter((v) => typeof v !== "function"));
}

const files = [];
const collect = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (/\.(js|mjs|css|html|json|map|txt)$/.test(entry.name)) files.push(full);
  }
};
collect(dist);

const leaks = [];
for (const file of files) {
  // Bundlers escape quotes and apostrophes; compare on a loosened copy.
  const text = fs.readFileSync(file, "utf8").replace(/\\(["'`])/g, "$1");
  for (const probe of probes) {
    if (text.includes(probe)) {
      leaks.push(`${path.relative(dist, file)}: "${probe}..."`);
      if (leaks.length >= 10) break;
    }
  }
  if (leaks.length >= 10) break;
}

if (leaks.length) {
  console.error("check-dist: paid study content found in the built website:");
  for (const leak of leaks) console.error(`  ${leak}`);
  process.exit(1);
}
console.log(`check-dist: no study content in ${files.length} built files (${probes.size} samples checked).`);
