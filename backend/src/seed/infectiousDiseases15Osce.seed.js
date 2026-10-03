import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const data = JSON.parse(readFileSync(new URL("./infectiousDiseases15Stations.data.json", import.meta.url), "utf8"));
const aiNumbers = new Set([2, 3, 6, 7, 9, 13, 14]);
const types = ["history", "history", "history", "interpretation", "examination", "counselling", "counselling", "emergency", "history", "emergency", "emergency", "emergency", "history", "counselling", "interpretation"];
const identities = {
  1: { name: "Adeel Rahman", age: 31, sex: "male" },
  2: { name: "Haris Khan", age: 34, sex: "male" },
  3: { name: "Mehwish Tariq", age: 27, sex: "female" },
  4: { name: "Anum Shah", age: 22, sex: "female" },
  5: { name: "Zoya Malik", age: 36, sex: "female" },
  6: { name: "Eman Raza", age: 28, sex: "female" },
  7: { name: "Hiba Noor", age: 25, sex: "female" },
  8: { name: "Sameer Iqbal", age: 62, sex: "male" },
  9: { name: "Ayesha Gul", age: 41, sex: "female" },
  10: { name: "Waqas Ali", age: 38, sex: "male" },
  11: { name: "Daniyal Shah", age: 47, sex: "male" },
  12: { name: "Laiba Ahmed", age: 20, sex: "female" },
  13: { name: "Farhan Yousaf", age: 43, sex: "male" },
  14: { name: "Rayan Siddiqui", age: 29, sex: "male" },
  15: { name: "Talha Nadeem", age: 33, sex: "male" },
};
const openings = {
  2: "I've been getting fevers, shivering, sweats and bad headaches since travelling to a malaria area.",
  3: "I've had fever, bad body aches, pain behind my eyes and a rash for four days.",
  6: "I'm eighteen weeks pregnant and was exposed to chickenpox at home yesterday. I'm not sure if I had it as a child.",
  7: "I'm ten weeks pregnant and was in close contact with a child who later had a rubella-like illness.",
  9: "I've been having fevers for several weeks and still don't know what's causing them.",
  13: "I've had a cough for five weeks, lost weight and had night sweats. Sometimes I cough up blood.",
  14: "My HIV screening test came back reactive, and I'm very anxious about what that means.",
};

// Every entry corresponds to one complete original script bullet. Unspecified
// history stays unknown; particularly vaccination, exposures, test values and
// reassuring negative symptoms are never made up to fill out a template.
const dialogue = {
  2: [
    ["HPC", "Fever and associated symptoms", "I get fevers with shivering and drenching sweats, muscle aches and headaches.", ["fever", "rigors", "sweats", "headache", "aches"]],
    ["SH", "Travel and prophylaxis", "I recently travelled to a rural area where malaria occurs. I didn't take preventive medicine. I can't give more specific dates or location details.", ["travel", "where", "dates", "rural", "prophylaxis"]],
    ["RED_FLAG", "Deterioration today", "My urine is dark, and I've been feeling increasingly tired and sluggish today.", ["dark urine", "urine", "lethargic", "worse", "today"]],
  ],
  3: [
    ["HPC", "Symptoms", "I've had high fever, severe body aches, pain behind my eyes, nausea and a rash.", ["fever", "myalgia", "retro orbital", "nausea", "rash"]],
    ["RED_FLAG", "Bleeding and abdominal symptoms", "I haven't had major bleeding so far, but on this fourth day my tummy is becoming more uncomfortable.", ["bleeding", "abdominal pain", "tummy", "day", "worse"]],
  ],
  6: [
    ["HPC", "Current symptoms", "I'm well at the moment and haven't had a rash or fever.", ["rash", "fever", "unwell", "symptoms"]],
    ["PMH", "Varicella immunity", "I don't have a reliable history of having chickenpox or being vaccinated against it.", ["chickenpox", "vaccination", "immunity", "childhood"]],
  ],
  7: [
    ["HPC", "Symptoms and vaccination history", "I don't have any symptoms now, and I'm not sure about my vaccinations.", ["symptoms", "rash", "fever", "vaccination", "immunity"]],
    ["ICE", "Fetal concern", "I'm very anxious about what this might mean for my baby.", ["worried", "baby", "concern", "anxious"]],
  ],
  9: [
    ["HPC", "Fever duration and constitutional symptoms", "I've had fevers for four weeks. I'm tired and have lost three kilograms.", ["duration", "weeks", "tired", "fatigue", "weight"]],
    ["OTHER", "Previous assessment", "The first basic tests didn't give a diagnosis. I don't know more detailed test results.", ["tests", "results", "investigations", "previous assessment"]],
  ],
  13: [
    ["SH", "Household and TB contact", "I live with my extended family. One relative was treated for tuberculosis last year.", ["home", "household", "family", "contact", "TB"]],
    ["PMH", "Previous TB treatment", "I've never been treated for tuberculosis before.", ["previous", "treatment", "TB"]],
  ],
  14: [
    ["ICE", "AIDS and confidentiality concerns", "Does this mean I definitely have AIDS? Will my family be told?", ["AIDS", "family", "confidentiality", "concern", "worried"]],
  ],
};
const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildInfectiousDiseases15StationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 4) throw new Error("Incomplete infectious-diseases data.");
  return data.stations.map((station, index) => {
    if (station.number !== index + 1 || station.time !== "8 minutes" || station.checklist.length !== 10 || station.globalRating.length !== 5) throw new Error(`Incomplete station ${station.number}.`);
    const slug = `infectious-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiNumbers.has(station.number);
    const opening = openings[station.number] || station.candidateInstructions[0];
    const makeFact = (value, response, label, section, factIndex, triggers = [], revealPolicy = "IF_RELEVANT_QUESTION") => ({
      factId: `${slug}-fact-${factIndex + 1}`, conceptId: slugify(label).replaceAll("-", "_"), label, section,
      value, naturalResponse: response, revealPolicy, triggerConcepts: triggers.map(trigger => slugify(trigger).replaceAll("-", "_")), synonyms: triggers, relatedChecklistItemIds: [],
    });
    if (interactive && dialogue[station.number]?.length !== station.simulationScript.length) throw new Error(`Incomplete dialogue ${station.number}.`);
    const facts = interactive ? [
      makeFact(station.candidateInstructions[0], opening, "Presenting concern", "PC", 0, ["opening", "what brought you"], "OPENING"),
      ...dialogue[station.number].map(([section, label, response, triggers], i) => makeFact(station.simulationScript[i], response, label, section, i + 1, triggers, section === "SH" ? "IF_ASKED" : "IF_RELEVANT_QUESTION")),
    ] : station.simulationScript.map((line, i) => makeFact(line, line, `Simulation cue ${i + 1}`, "OTHER", i));
    const module = {
      title: station.title, slug, presentingComplaint: opening, systemOrTopic: station.primaryCompetency,
      stationType: types[index], stationFormat: station.format, practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["infectious-diseases-15", "infectious-diseases", types[index]], difficulty: [4, 8, 10, 11, 12, 15].includes(station.number) ? "advanced" : "intermediate",
      timeLimitSeconds: 480, shortDescription: station.candidateInstructions[0],
      candidateInstructions: { context: station.format, patientSummary: "", tasks: station.candidateInstructions, examinationRequired: ["examination", "emergency"].includes(types[index]), additionalInstructions: [station.time, station.analyticScore] },
      candidateHandout: station.candidateHandout, simulationScript: station.simulationScript,
      examinerInstructions: station.examinerInstructions.join("\n"), keyAnswerGuide: station.keyAnswerGuide.join("\n"),
      suggestedCandidateApproach: station.suggestedApproach, learningNotes: station.learningNotes.join("\n"),
      expectedCompetencies: station.expectedCompetencies, criticalSafetyErrors: station.criticalSafetyErrors, globalRatingOptions: station.globalRating,
      assessmentDesign: [...data.metadata.assessmentDesign, station.scoringAnchor],
      // Retain all manual metadata in JSON, but only show clinical practice
      // guidance to students, not provenance or production/printing commentary.
      facultyNote: `${data.metadata.facultyNote[3]}\nDrug choice, dose, prophylaxis schedules, isolation and referral pathways must be checked against current institutional/provincial/national guidance before summative use.`,
      facultySourceNote: station.sourceNote, commonMistakes: [], keyDifferentials: [],
      vivaQuestions: station.promptQuestions.map(question => ({ question, modelAnswerOutline: "" })),
      sourceReferences: ["Infectious_Diseases_15_OSCE_Stations.pdf"], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed", publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number], baselineState: {},
      openingStatement: opening, demeanor: { general: interactive ? "Respond naturally as the named patient, using the authored symptoms, preferences and concerns." : "Simulation material for guided practice only.", verbosity: "Only disclose supplied details relevant to what is asked." }, facts,
      emotionalCues: [], patientQuestions: [], expectedPatientAttitude: interactive ? "Use only the supplied history and concerns. Do not invent symptom negatives, travel locations or dates, exposure details, immune status, vaccination history, allergies, medicines, physical examination findings or test results. The student may state examination plans, but you cannot perform or supply unprovided examination results. For HIV counselling, do not invent a transmission history or confirmed diagnosis." : "Guided examination, interpretation or emergency simulation; not an AI patient interview.",
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

export async function seedInfectiousDiseases15OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "infectious-diseases" }, { $setOnInsert: { name: "Infectious Diseases", slug: "infectious-diseases", description: "Infectious-disease OSCE stations.", icon: "stethoscope", order: 7, active: true } }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildInfectiousDiseases15StationBundles()) {
    const script = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    stations.push(await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: script._id, smartChecklistId: checklist._id } }, { upsert: true, new: true, runValidators: true }));
  }
  return stations;
}
