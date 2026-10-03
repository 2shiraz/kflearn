import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const data = JSON.parse(readFileSync(new URL("./rheumatology10Stations.data.json", import.meta.url), "utf8"));
const aiNumbers = new Set([1, 2, 3, 4, 5, 10]);
// Use actual candidate tasks: the manual's generic format header does not
// distinguish the data, examination and emergency stations.
const types = ["history","history","history","history","history","interpretation","examination","examination","emergency","history"];
// Most scenarios intentionally have no name. Do not invent identities.
const identities = {
  1: { age:15,sex:"male",occupation:"student" },
  2: { age:42,sex:"female" },
  3: { age:27,sex:"male" },
  4: { age:58,sex:"female" },
  5: { age:52,sex:"male" },
  6: {}, 7: {}, 8: { age:29,sex:"male" }, 9: { age:63 },
  10: { name:"Moin Ahmad",age:28 },
};
const openings = Object.fromEntries(data.stations.filter(s=>aiNumbers.has(s.number)).map(s=>[s.number,s.simulationScript[0].replace(/^Opening:\s*[“"]?/,"").replace(/[”"]$/,"")]));
const responses = {
  1: ["I've had a fever and sometimes palpitations. I haven't fainted or had an injury, and I've never been told I had rheumatic fever before.","I'm worried the pains are spreading. Can my heart be affected?"],
  2: ["Both sides are affected: the knuckles, middle finger joints and wrists. Morning stiffness lasts over an hour, and I feel tired. I don't have psoriasis.","I'm worried my fingers will become permanently deformed."],
  3: ["This started before I was thirty. The pain switches between my buttocks and wakes me in the second half of the night. Exercise helps, but rest doesn't. There wasn't an injury.","I once had a painful red eye. I don't have any known psoriasis.","I'm afraid I won't be able to bend my spine."],
  4: ["I haven't had fever, a hot swollen knee or prolonged morning stiffness. Stairs are difficult, and I'm overweight.","Do I need a knee replacement now?"],
  5: ["There wasn't an injury. I've felt a bit feverish but haven't had shaking chills. I had a similar, shorter episode before. I have high blood pressure and take a diuretic; I don't know more specific drug details.","Is a high uric acid blood test enough to prove gout?"],
  10: ["It comes with sitting at my desk for a long time and moving my neck. I haven't had pressure-like pain with exertion, sweating, breathlessness, fainting or an injury.","I haven't had arm weakness, persistent numbness, problems walking or bowel or bladder symptoms.","I'm worried it might be my heart or a serious neck problem."],
};
const dialogue = Object.fromEntries(data.stations.filter(s=>aiNumbers.has(s.number)).map(s=>[s.number,s.simulationScript.map((line,i)=>["OTHER",i===0?"Presenting symptoms":`History detail ${i}`,i===0?openings[s.number]:responses[s.number][i-1],line.toLowerCase().match(/[a-z]{4,}/g)||[]])]));

const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildRheumatology10StationBundles() {
  if (data.stations.length !== 10 || data.metadata.assessmentDesign.length !== 4) throw new Error("Incomplete rheumatology data.");
  return data.stations.map((station, index) => {
    if (station.number !== index + 1 || station.time !== "8 minutes" || station.checklist.length !== 10 || station.globalRating.length !== 5) throw new Error(`Incomplete station ${station.number}.`);
    const slug = `rheumatology-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiNumbers.has(station.number);
    const stationFormat = ({ 6: "Data interpretation", 7: "Examination", 8: "Examination", 9: "Emergency assessment and management" })[station.number] || station.format;
    const opening = openings[station.number] || station.candidateInstructions[0];
    const makeFact = (value, response, label, section, factIndex, triggers = [], revealPolicy = "IF_RELEVANT_QUESTION") => ({
      factId: `${slug}-fact-${factIndex + 1}`, conceptId: slugify(label).replaceAll("-", "_"), label, section,
      value, naturalResponse: response, revealPolicy, triggerConcepts: triggers.map(trigger => slugify(trigger).replaceAll("-", "_")), synonyms: triggers, relatedChecklistItemIds: [],
    });
    if (interactive && (dialogue[station.number]?.length !== station.simulationScript.length || dialogue[station.number].some(row => !row[2]))) throw new Error(`Incomplete dialogue ${station.number}.`);
    const facts = interactive ? [
      makeFact(station.candidateInstructions[0], opening, "Presenting concern", "PC", 0, ["opening", "what brought you"], "OPENING"),
      ...dialogue[station.number].map(([section, label, response, triggers], i) => makeFact(station.simulationScript[i], response, label, section, i + 1, triggers, section === "SH" ? "IF_ASKED" : "IF_RELEVANT_QUESTION")),
    ] : station.simulationScript.map((line, i) => makeFact(line, line, `Simulation cue ${i + 1}`, "OTHER", i));
    const module = {
      title: station.title, slug, presentingComplaint: opening, systemOrTopic: station.primaryCompetency,
      stationType: types[index], stationFormat, practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["rheumatology-10", "rheumatology", types[index]], difficulty: [1, 9].includes(station.number) ? "advanced" : "intermediate",
      timeLimitSeconds: 480, shortDescription: station.candidateInstructions[0],
      candidateInstructions: { context: stationFormat, patientSummary: "", tasks: station.candidateInstructions, examinationRequired: ["examination", "emergency"].includes(types[index]), additionalInstructions: [station.time, station.analyticScore] },
      candidateHandout: station.candidateHandout, simulationScript: station.simulationScript,
      examinerInstructions: station.examinerInstructions.join("\n"), keyAnswerGuide: station.keyAnswerGuide.join("\n"),
      suggestedCandidateApproach: station.suggestedApproach, learningNotes: station.learningNotes.join("\n"),
      expectedCompetencies: station.expectedCompetencies, criticalSafetyErrors: station.criticalSafetyErrors, globalRatingOptions: station.globalRating,
      assessmentDesign: [...data.metadata.assessmentDesign, station.scoringAnchor],
      // Retain all manual metadata in JSON, but only show clinical practice
      // guidance to students, not provenance or production/printing commentary.
      facultyNote: "Medication choice, dose, contraindications, referral pathways and emergency care must follow current local guidance.",
      facultySourceNote: station.sourceNote, commonMistakes: [], keyDifferentials: [],
      vivaQuestions: station.promptQuestions.map(question => ({ question, modelAnswerOutline: "" })),
      sourceReferences: ["Rheumatology_10_OSCE_Stations.pdf"], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed", publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number], baselineState: {},
      openingStatement: opening, demeanor: { general: interactive ? "Respond naturally as the patient using only the supplied history and concerns." : "Guided simulation only; not an AI patient interview.", verbosity: "Reveal only the supplied details relevant to the question." }, facts,
      emotionalCues: [], patientQuestions: [], expectedPatientAttitude: interactive ? "Do not invent a name, dates, medicines, allergies, symptom negatives, examination findings or test results. Unspecified history is unknown, not normal. Examination plans can be discussed but physical findings are not available unless authored." : "Guided interpretation, physical examination or emergency practice; not an AI conversation.",
      unknownFactPolicy: "If a detail is not supplied, say you do not know or cannot remember. Unreported is not the same as denied. Never fabricate examination findings, test values, obstetric dates, medicine doses or reassuring negatives.",
      sourceReferences: module.sourceReferences, status: "published", version: 1,
    };
    const checklist = {
      title: `${station.title} — analytic checklist`, slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: 20, description: station.scoringAnchor }, weightConfiguration: { critical: 1, major: 1, minor: 1 },
      sections: [{ sectionId: `${slug}-analytic`, title: "Analytic checklist (20 points)", items: station.checklist.map(({ order, criterion }) => ({
        itemId: `${slug}-criterion-${order}`, label: criterion, description: criterion, category: types[index], expectedConcepts: [criterion], relatedFactIds: [],
        weightCategory: "major", maxRawScore: 2, allowPartial: true, criticalSafetyItem: false, remediationText: criterion, order,
      })) }], status: "published", version: 1,
    };
    return { source: station, module, patientScript, checklist };
  });
}

export async function seedRheumatology10OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "rheumatology" }, { $setOnInsert: { name: "Rheumatology", slug: "rheumatology", description: "Rheumatology OSCE stations.", icon: "stethoscope", order: 9, active: true } }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildRheumatology10StationBundles()) {
    const script = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    stations.push(await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: script._id, smartChecklistId: checklist._id } }, { upsert: true, new: true, runValidators: true }));
  }
  return stations;
}
