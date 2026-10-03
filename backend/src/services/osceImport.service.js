// Builds OSCE stations from a simple JSON format the admin can get from any
// AI chat (paste a station from a document, ask for this format). Everything
// is validated here; nothing from the JSON reaches the database unchecked,
// and imported stations always start as drafts.
import { ContentAuditLog } from "../models/ContentAuditLog.js";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";
import { OSCE_CATEGORIES } from "../utils/osceCategories.js";

export const MAX_IMPORT_STATIONS = 20;
const FACT_SECTIONS = ["PC", "HPC", "PMH", "DH", "FH", "SH", "ROS", "ICE", "RED_FLAG", "OTHER"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

class ImportError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const slugify = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function reader(path) {
  const fail = (message) => { throw new ImportError(`${path}: ${message}`); };
  return {
    text(obj, key, { required = false, max = 2000, fallback = "" } = {}) {
      const value = obj?.[key];
      if (value === undefined || value === null || value === "") {
        if (required) fail(`"${key}" is required.`);
        return fallback;
      }
      if (typeof value !== "string") fail(`"${key}" must be text.`);
      if (value.length > max) fail(`"${key}" is longer than ${max} characters.`);
      return value.trim();
    },
    list(obj, key, { required = false, max = 40, itemMax = 600 } = {}) {
      const value = obj?.[key];
      if (value === undefined || value === null) {
        if (required) fail(`"${key}" is required.`);
        return [];
      }
      if (!Array.isArray(value)) fail(`"${key}" must be a list.`);
      if (value.length > max) fail(`"${key}" can have at most ${max} entries.`);
      return value.map((item, i) => {
        if (typeof item !== "string") fail(`"${key}[${i}]" must be text.`);
        if (item.length > itemMax) fail(`"${key}[${i}]" is too long.`);
        return item.trim();
      }).filter(Boolean);
    },
    fail,
  };
}

// Turns one JSON station into validated documents (not yet saved).
// draft: a half-written station from the editor. Only the title is needed;
// the rest is checked when the station is published.
export function parseStation(raw, index = 0, { draft = false } = {}) {
  const at = `Station ${index + 1}`;
  const r = reader(at);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) r.fail("must be an object.");

  const title = r.text(raw, "title", { required: true, max: 160 });
  const specialty = r.text(raw, "specialty", { required: !draft, max: 80, fallback: "General" });
  const category = r.text(raw, "category", { fallback: "history" }).toLowerCase();
  if (!OSCE_CATEGORIES.some(({ value }) => value === category)) r.fail(`"category" must be one of: ${OSCE_CATEGORIES.map((c) => c.value).join(", ")}.`);
  const difficulty = r.text(raw, "difficulty", { fallback: "intermediate" }).toLowerCase();
  if (!DIFFICULTIES.includes(difficulty)) r.fail(`"difficulty" must be beginner, intermediate or advanced.`);
  const minutes = raw.timeLimitMinutes ?? 8;
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) r.fail(`"timeLimitMinutes" must be a number from 1 to 60.`);
  const aiPatient = raw.aiPatient !== false;
  const practiceModes = [raw.checklistPractice !== false && "single-player", aiPatient && "virtual-patient"].filter(Boolean);
  if (!practiceModes.length) r.fail("leave at least one way to practise (checklistPractice or aiPatient).");

  const candidate = raw.candidate || {};
  const cr = reader(`${at} > candidate`);
  const tasks = cr.list(candidate, "tasks", { required: !draft, max: 20 });
  if (!tasks.length && !draft) cr.fail(`"tasks" needs at least one task.`);

  const patient = raw.patient || {};
  const pr = reader(`${at} > patient`);
  const openingStatement = pr.text(patient, "openingStatement", { required: aiPatient && !draft, max: 600, fallback: "Hello doctor." });
  const age = patient.age;
  if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 120)) pr.fail(`"age" must be a whole number of years.`);
  const factsRaw = patient.facts ?? [];
  if (!Array.isArray(factsRaw) || factsRaw.length > 80) pr.fail(`"facts" must be a list of up to 80 facts.`);
  if (aiPatient && !draft && factsRaw.length < 3) pr.fail(`an AI patient needs at least 3 facts so it can answer questions.`);

  // The checklist is either a flat list of items, or a list of sections
  // ({ title, items }) when the station groups its marking points.
  const checklistRaw = draft ? raw.checklist ?? [] : raw.checklist;
  if (!Array.isArray(checklistRaw) || (!checklistRaw.length && !draft)) r.fail(`"checklist" must be a list of items.`);
  const sectioned = checklistRaw.every((entry) => Array.isArray(entry?.items));
  const sectionsRaw = (sectioned ? checklistRaw : [{ title: "Station checklist", items: checklistRaw }]).filter((sec) => !draft || sec.items.length);
  if (sectionsRaw.length > 12) r.fail(`"checklist" can have at most 12 sections.`);
  if (sectionsRaw.reduce((n, sec) => n + sec.items.length, 0) > 60) r.fail(`"checklist" can have at most 60 items.`);

  const review = raw.review || {};
  const rr = reader(`${at} > review`);
  const viva = review.vivaQuestions ?? [];
  if (!Array.isArray(viva) || viva.length > 15) rr.fail(`"vivaQuestions" must be a list of up to 15.`);

  const base = slugify(title) || `station-${Date.now()}`;
  const facts = factsRaw.map((fact, i) => {
    const fr = reader(`${at} > patient > facts[${i}]`);
    const section = fr.text(fact, "section", { fallback: "OTHER" }).toUpperCase().replace(/\s+/g, "_");
    if (!FACT_SECTIONS.includes(section)) fr.fail(`"section" must be one of: ${FACT_SECTIONS.join(", ")}.`);
    const label = fr.text(fact, "label", { required: true, max: 120 });
    const answer = fr.text(fact, "answer", { required: true, max: 1200 });
    const keywords = fr.list(fact, "keywords", { max: 20, itemMax: 60 });
    const concept = slugify(label).replace(/-/g, "_") || `fact_${i + 1}`;
    return {
      factId: `${base}_f${i + 1}`,
      section,
      conceptId: concept,
      label,
      value: answer,
      naturalResponse: answer,
      revealPolicy: "IF_RELEVANT_QUESTION",
      triggerConcepts: [concept, ...keywords.map((k) => k.toLowerCase())],
      synonyms: keywords,
      relatedChecklistItemIds: [],
    };
  });

  let itemCount = 0;
  const sections = sectionsRaw.map((section, si) => {
    const sectionTitle = sectioned ? reader(`${at} > checklist[${si}]`).text(section, "title", { required: true, max: 120 }) : "Station checklist";
    if (!section.items.length) r.fail(`checklist section "${sectionTitle}" has no items.`);
    return { sectionId: `section_${si + 1}`, title: sectionTitle, items: section.items.map((item, ii) => {
    const i = itemCount++;
    const ir = reader(sectioned ? `${at} > checklist[${si}] > items[${ii}]` : `${at} > checklist[${i}]`);
    const label = ir.text(item, "label", { required: true, max: 200 });
    const marks = item.marks ?? 1;
    if (!Number.isInteger(marks) || marks < 1 || marks > 10) ir.fail(`"marks" must be a whole number from 1 to 10.`);
    const critical = item.critical === true;
    return {
      itemId: `${base}_c${i + 1}`,
      label,
      description: ir.text(item, "description", { max: 600 }),
      category,
      expectedConcepts: ir.list(item, "keywords", { max: 20, itemMax: 60 }),
      relatedFactIds: [],
      weightCategory: critical ? "critical" : "major",
      maxRawScore: marks,
      allowPartial: marks > 1,
      criticalSafetyItem: critical,
      order: i + 1,
    };
  }) };
  });
  const items = sections.flatMap((section) => section.items);

  return {
    specialty,
    module: {
      title,
      slug: base,
      presentingComplaint: r.text(raw, "presentingComplaint", { required: !draft, max: 200 }),
      systemOrTopic: specialty,
      category,
      stationType: category === "procedure" ? "examination" : category,
      practiceModes,
      taskTags: [category, slugify(specialty)],
      difficulty,
      timeLimitSeconds: Math.round(minutes * 60),
      shortDescription: r.text(raw, "shortDescription", { required: !draft, max: 600 }),
      candidateInstructions: {
        context: cr.text(candidate, "context", { max: 2000 }),
        patientSummary: cr.text(candidate, "patientSummary", { max: 2000 }),
        tasks,
        examinationRequired: ["examination", "procedure"].includes(category),
        additionalInstructions: [],
      },
      keyAnswerGuide: rr.text(review, "answerGuide", { max: 6000 }),
      suggestedCandidateApproach: rr.list(review, "approach", { max: 20 }),
      examinerInstructions: rr.text(review, "examinerLooksFor", { max: 6000 }),
      criticalSafetyErrors: rr.list(review, "criticalSafetyErrors", { max: 15 }),
      learningNotes: rr.text(review, "notes", { max: 6000 }),
      reviewVisibility: parseVisibility(review.show, rr),
      vivaQuestions: viva.map((q, i) => {
        const vr = reader(`${at} > review > vivaQuestions[${i}]`);
        return { question: vr.text(q, "question", { required: true, max: 400 }), modelAnswerOutline: vr.text(q, "answer", { max: 1500 }) };
      }),
    },
    patientScript: {
      name: `${pr.text(patient, "name", { fallback: "Patient", max: 80 })} - ${title}`,
      patientIdentity: {
        name: pr.text(patient, "name", { fallback: "Patient", max: 80 }),
        age,
        sex: pr.text(patient, "sex", { max: 20 }).toLowerCase(),
        occupation: pr.text(patient, "occupation", { max: 80 }),
        pronouns: "",
      },
      openingStatement,
      demeanor: { general: pr.text(patient, "demeanor", { max: 200 }) },
      facts: [
        {
          factId: `${base}_opening`, section: "PC", conceptId: "opening_statement", label: "Opening statement",
          value: openingStatement, naturalResponse: openingStatement, revealPolicy: "OPENING",
          triggerConcepts: ["opening_statement"], synonyms: [], relatedChecklistItemIds: [],
        },
        ...facts,
      ],
      status: "draft",
    },
    checklist: {
      title: `${title} checklist`,
      sourceScoring: { maxRawScore: items.reduce((sum, item) => sum + item.maxRawScore, 0), description: "Imported checklist" },
      sections,
      status: "draft",
    },
  };
}

// review.show: { answerGuide: false, ... } hides that part from students.
const SHOW_KEYS = {
  notes: "learningNotes",
  answerGuide: "keyAnswerGuide",
  approach: "suggestedCandidateApproach",
  examinerLooksFor: "examinerInstructions",
  vivaQuestions: "vivaQuestions",
  criticalSafetyErrors: "criticalSafetyErrors",
};
function parseVisibility(show, rr) {
  if (show === undefined) return undefined;
  if (typeof show !== "object" || show === null) rr.fail(`"show" must be an object.`);
  const out = {};
  for (const [key, value] of Object.entries(show)) {
    if (!SHOW_KEYS[key] || typeof value !== "boolean") rr.fail(`"show.${key}" isn't a review part that can be hidden.`);
    out[SHOW_KEYS[key]] = value;
  }
  return out;
}

export function parseImport(payload, { draft = false } = {}) {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.stations) ? payload.stations : [payload];
  if (!list.length) throw new ImportError("The JSON has no stations in it.");
  if (list.length > MAX_IMPORT_STATIONS) throw new ImportError(`Import up to ${MAX_IMPORT_STATIONS} stations at a time.`);
  return list.map((raw, i) => parseStation(raw, i, { draft }));
}

async function freeSlug(base) {
  let slug = base;
  for (let n = 2; await OsceStation.exists({ slug }); n += 1) slug = `${base}-${n}`;
  return slug;
}

// Saves parsed stations as drafts. Each station is all-or-nothing: if a part
// fails to save, the parts already written for it are removed.
export async function importStations(parsed, userId) {
  const created = [];
  for (const station of parsed) {
    const slug = await freeSlug(station.module.slug);
    const specialtySlug = slugify(station.specialty);
    const specialty = await Specialty.findOneAndUpdate(
      { slug: specialtySlug },
      { $setOnInsert: { name: station.specialty, slug: specialtySlug, active: true } },
      { upsert: true, new: true },
    );
    const script = await PatientScript.create({ ...station.patientScript, slug: `${slug}-patient` });
    let checklist;
    try {
      checklist = await SmartChecklist.create({ ...station.checklist, slug: `${slug}-checklist` });
      const module = await OsceStation.create({
        ...station.module,
        slug,
        specialtyId: specialty._id,
        patientScriptId: script._id,
        smartChecklistId: checklist._id,
        status: "draft",
        createdBy: userId,
      });
      await ContentAuditLog.create({ contentType: "OsceStation", contentId: module._id, action: "imported", changedBy: userId, summary: "Imported from JSON as a draft." });
      created.push({ id: module._id, title: module.title, slug: module.slug, specialty: specialty.name });
    } catch (error) {
      await PatientScript.deleteOne({ _id: script._id });
      if (checklist) await SmartChecklist.deleteOne({ _id: checklist._id });
      throw error;
    }
  }
  return created;
}
