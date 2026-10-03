import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const data = JSON.parse(readFileSync(new URL("./orthopedics15Stations.data.json", import.meta.url), "utf8"));
// Stations requiring performance of a physical examination remain guided-only.
// Combined history stations ask for an examination plan, not invented findings.
const aiNumbers = new Set([1, 2, 3, 5, 6, 7, 11, 12, 14, 15]);
const types = ["history","history","history","examination","history","history","history","examination","examination","examination","history","history","examination","interpretation","counselling"];
const names = ["Hamza Farooq","Sana Qureshi","Bilal Ahmed","Usman Tariq","Ayaan Khan","Maryam Shah","Kamran Siddiqui","Hira Nadeem","Areeba Malik","Zain Ali","Fahad Raza","Saad Mahmood","Noor Fatima","Farzana Iqbal","Imran Yousaf"];
const ages = [29,46,39,44,4,48,56,52,30,45,43,57,60,67,69];
const female = new Set([2,6,8,9,13,14]);
const identities = Object.fromEntries(names.map((name,i)=>[i+1,{name,age:ages[i],sex:female.has(i+1)?"female":"male",occupation:i===0?"factory supervisor":i===1?"computer operator":""}]));
const openings = Object.fromEntries(data.stations.filter(s=>aiNumbers.has(s.number)).map(s=>[s.number,s.simulationScript[0].replace(/^(Opening:|Mother says:)\s*[“"]?/,"").replace(/[”"]$/,"")]));
const responses = {
  1: ["The pain is dull, about five out of ten. It gets worse when I bend at work and eases with rest. I haven't had an injury, rash, pins and needles or weakness.","I haven't had pain with exertion or breathlessness. I'm frightened it could be my heart; a close relative recently died from a heart attack."],
  2: ["It is constant pain in my lower back, about six out of ten, worse with movement. It doesn't go down my legs, and I haven't had weakness or lost sensation.","I've been resting because I thought that was best. I'm worried about coping at home and want some pain relief."],
  3: ["I haven't had bladder or bowel problems, numbness around my bottom, fever or weight loss.","Coughing makes it worse. I'm worried it's a slipped disc and I'll need surgery."],
  5: ["His diet doesn't have much food rich in vitamin D or calcium. He has no known kidney or liver disease.","I'm worried that his bowed legs will be permanent."],
  6: ["I haven't had a major injury. My diet doesn't include much calcium or vitamin-D-rich food.","I don't have any known kidney or liver disease, and haven't had a fracture."],
  7: ["The pain is constant, five or six out of ten, and worse at night. It can go towards my elbow, and I struggle to comb my hair.","I have diabetes. I haven't had fever, an injury, chest pain or a stiff neck."],
  11: ["I've had a similar episode before. I enjoy meat and take a thiazide for high blood pressure. There wasn't an injury.","I'm wondering whether this is definitely gout. I can't give you a definite answer about fever."],
  12: ["It came on gradually and doesn't spread anywhere. I haven't had fever or a recent injury. Morning stiffness is brief, not over an hour.","I'm overweight and don't get much exercise. I'm worried I might need surgery."],
  14: ["My weight is low, I don't have much dairy or exercise, and I have a smoking history. My menopause happened relatively early; the exact age isn't provided.","What does the T-score mean, and how can I prevent another fracture?"],
  15: ["I'm willing to exercise and change my lifestyle, but I'm worried about taking tablets long term.","I don't know more detailed medical information about whether a particular medicine is suitable for me."],
};
const dialogue = Object.fromEntries(data.stations.filter(s=>aiNumbers.has(s.number)).map(s=>[s.number,s.simulationScript.map((line,i)=>["OTHER",i===0?"Presenting symptoms":i===1?"History and symptoms":"Associated history and concerns",i===0?openings[s.number]:responses[s.number][i-1],line.toLowerCase().match(/[a-z]{4,}/g) || []])]));

const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildOrthopedics15StationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 4) throw new Error("Incomplete orthopedics data.");
  return data.stations.map((station, index) => {
    if (station.number !== index + 1 || station.time !== "8 minutes" || station.checklist.length !== 10 || station.globalRating.length !== 5) throw new Error(`Incomplete station ${station.number}.`);
    const slug = `orthopedics-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiNumbers.has(station.number);
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
      stationType: types[index], stationFormat: station.format, practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["orthopedics-15", "orthopedics", types[index]], difficulty: [3, 5, 14].includes(station.number) ? "advanced" : "intermediate",
      timeLimitSeconds: 480, shortDescription: station.candidateInstructions[0],
      candidateInstructions: { context: station.format, patientSummary: "", tasks: station.candidateInstructions, examinationRequired: ["examination", "emergency"].includes(types[index]), additionalInstructions: [station.time, station.analyticScore] },
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
      sourceReferences: ["Orthopedics_15_OSCE_Stations.pdf"], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed", publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number], baselineState: {},
      openingStatement: opening, demeanor: { general: station.number === 5 ? "Speak as Ayaan's mother about her four-year-old child, not as the child." : interactive ? "Respond naturally as the named patient, using the authored symptoms, preferences and concerns." : "Simulation material for guided practice only.", verbosity: "Only disclose supplied details relevant to what is asked." }, facts,
      emotionalCues: [], patientQuestions: [], expectedPatientAttitude: interactive ? "Use only the supplied history and concerns. Do not invent symptom negatives, dates, allergies, medicines, physical examination findings or test results. The student may state examination plans, but you cannot perform or supply unprovided examination results." + (station.number === 5 ? " For the child rickets case, speak as the mother about Ayaan; her name and age are not supplied. Never speak as an adult Ayaan or invent his mother’s demographics." : "") + (station.number === 11 ? " No fever volunteered is not a negative fever history. Fever remains unknown if asked." : "") : "Guided examination, interpretation or emergency simulation; not an AI patient interview.",
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

export async function seedOrthopedics15OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "orthopedics" }, { $setOnInsert: { name: "Orthopedics", slug: "orthopedics", description: "Orthopedics OSCE stations.", icon: "stethoscope", order: 8, active: true } }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildOrthopedics15StationBundles()) {
    const script = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    stations.push(await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: script._id, smartChecklistId: checklist._id } }, { upsert: true, new: true, runValidators: true }));
  }
  return stations;
}
