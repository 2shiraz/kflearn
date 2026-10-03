import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const data = JSON.parse(readFileSync(new URL("./cns15Stations.data.json", import.meta.url), "utf8"));
const aiNumbers = new Set([1, 2, 3]);
const types = ["history","history","counselling","emergency","examination","interpretation","interpretation","examination","examination","examination","examination","examination","examination","emergency","emergency"];
const identities = {
  1:{name:"Ahsan Raza",age:34,sex:"male",occupation:"office worker"},
  2:{name:"Zoya Khan",age:27,sex:"female",occupation:"teacher"},
  3:{name:"Mahnoor Ali",sex:"female"},
  4:{name:"Sameer Hussain",age:66,sex:"male"},
  5:{name:"Daniyal Shah",age:52,sex:"male"},
  6:{},7:{},
  8:{name:"Shahzaib Iqbal",age:24,sex:"male"},
  9:{name:"Iqra Salman",age:41,sex:"female"},
  10:{name:"Affan Malik",age:58,sex:"male"},
  11:{name:"Anaya Rahman",age:32,sex:"female"},
  12:{name:"Rameez Akhtar",age:49,sex:"male"},
  13:{name:"Waleed Farooq",age:68,sex:"male"},
  14:{name:"Hania Siddiqui",age:45,sex:"female"},
  15:{name:"Azlan Qureshi",age:36,sex:"male"},
};
const openings = {
  1:"I've had a severe throbbing headache on the right side for two days, with nausea and sensitivity to light and sound.",
  2:"I collapsed and was told I was shaking. I've never had a seizure before.",
  3:"My eighteen-month-old son Rayyan had a convulsion with a fever. Does this mean he has epilepsy?",
};
// One conversational response per original identity/script entry. No unnamed
// witness becomes a separate patient; Zoya reports the supplied witness account.
const responses = {
  1:["I'm Ahsan Raza, thirty-four, and work in an office.","It's a throbbing pain on the right, for two days, seven out of ten. I feel nauseated and light and sound bother me.","I see zig-zag shapes before the headache. Lying in a dark, quiet room helps.","I had a similar attack six months ago, and my father has similar headaches.","I haven't had fever, a stiff neck, an injury, persistent weakness or a sudden thunderclap onset.","Could this be a brain tumour?"],
  2:["I'm Zoya Khan, twenty-seven, and a teacher. This is my first collapse with shaking.","The witness said I suddenly lost consciousness, stiffened, then jerked on both sides for about ninety seconds.","I bit the side of my tongue and was confused for twenty minutes afterwards. I didn't have chest pain or palpitations before it.","I've been short of sleep recently. I haven't been withdrawing from alcohol or drugs.","I've never had a seizure before and don't have a current focal deficit."],
  3:["I'm Mahnoor Ali, Rayyan's mother. He's eighteen months old and had a convulsion with a fever.","His temperature was 39.4 degrees. He shook all over for three minutes, slept afterwards and then returned to his usual self.","It was his first episode. There weren't one-sided features, and it didn't happen again within twenty-four hours.","He hasn't had a rash that doesn't fade under pressure, ongoing drowsiness or a stiff neck. His immunisations are up to date.","Does this mean he has epilepsy?"],
};
const dialogue = Object.fromEntries(data.stations.filter(s=>aiNumbers.has(s.number)).map(s=>[s.number,s.simulationScript.map((line,i)=>["OTHER",i===0?"Identity and presenting context":`Patient history detail ${i}`,responses[s.number][i],line.toLowerCase().match(/[a-z]{4,}/g)||[]])]));

const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildCns15StationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 4) throw new Error("Incomplete cns data.");
  return data.stations.map((station, index) => {
    if (station.number !== index + 1 || station.time !== "8 minutes" || station.checklist.length !== 10 || station.globalRating.length !== 5) throw new Error(`Incomplete station ${station.number}.`);
    const slug = `cns-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiNumbers.has(station.number);
    const stationFormat = station.format;
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
      taskTags: ["cns-15", "cns", types[index]], difficulty: [4, 8, 11, 14, 15].includes(station.number) ? "advanced" : "intermediate",
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
      sourceReferences: ["CNS_15_OSCE_Stations.pdf"], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed", publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number], baselineState: {},
      openingStatement: opening, demeanor: { general: station.number === 3 ? "You are Mahnoor Ali, speaking as the mother of 18-month-old Rayyan. Never speak as the child or invent the mother’s age." : interactive ? "Respond naturally as the patient using only the supplied history and concerns." : "Guided simulation only; not an AI patient interview.", verbosity: "Reveal only the supplied details relevant to the question." }, facts,
      emotionalCues: [], patientQuestions: [], expectedPatientAttitude: interactive ? "Do not invent a name, dates, medicines, allergies, symptom negatives, examination findings or test results. Unspecified history is unknown, not normal. Examination plans can be discussed but physical findings are not available unless authored." + (station.number === 3 ? " Speak as Mahnoor Ali about Rayyan, her 18-month-old child." : "") : "Guided interpretation, physical examination or emergency practice; not an AI conversation.",
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

export async function seedCns15OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "cns" }, { $setOnInsert: { name: "Central Nervous System", slug: "cns", description: "CNS OSCE stations.", icon: "stethoscope", order: 10, active: true } }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildCns15StationBundles()) {
    const script = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    stations.push(await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: script._id, smartChecklistId: checklist._id } }, { upsert: true, new: true, runValidators: true }));
  }
  return stations;
}

