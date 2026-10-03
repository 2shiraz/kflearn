import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const data = JSON.parse(readFileSync(new URL("./gynaeObstetrics15Stations.data.json", import.meta.url), "utf8"));
const aiNumbers = new Set([1, 2, 3, 5, 6, 7, 8]);
const types = ["counselling", "history", "history", "examination", "history", "counselling", "counselling", "history", "examination", "emergency", "emergency", "interpretation", "interpretation", "emergency", "emergency"];
const identities = {
  1: { name: "Nadia Farooq", age: 49, sex: "female" },
  2: { name: "Areeba Shah", age: 17, sex: "female" },
  3: { name: "Hiba Qureshi", age: 23, sex: "female" },
  4: { name: "Maham Riaz", age: 26, sex: "female" },
  5: { name: "Sara Nadeem", age: 31, sex: "female" },
  6: { name: "Anum Malik", age: 27, sex: "female" },
  7: { name: "Zoya Ahmed", age: 26, sex: "female" },
  8: { name: "Eman Hussain", age: 29, sex: "female" },
  9: { name: "Alina Khan", sex: "female" },
  10: { name: "Noor Fatima", age: 32, sex: "female" },
  11: { name: "Laiba Siddiqui", sex: "female" },
  12: { name: "Hira Aslam", sex: "female" },
  13: {},
  14: { name: "Maryam Tariq", sex: "female" },
  15: { name: "Saba Iqbal", age: 30, sex: "female" },
};
const openings = {
  1: "I've been having hot flushes, night sweats and vaginal dryness, and I'm struggling with sleep.",
  2: "I get cramping pain during the first day or two of my period, and it's making me miss college.",
  3: "I've been getting more hair on my face and putting on weight.",
  5: "I've been trying to get pregnant for eighteen months without success.",
  6: "I'm six weeks after giving birth and would like reliable contraception. What should I do if a condom breaks in future?",
  7: "I'm planning my first pregnancy in the next few months and would like some advice before I conceive.",
  8: "I'm about ten weeks pregnant with my first baby and have come for my booking visit.",
};

// [section, label, patient wording, relevant questions]. Each entry corresponds
// to one complete original script bullet. No extra clinical facts are assumed.
const dialogue = {
  1: [
    ["HPC", "Menstrual pattern", "My last period was sixteen months ago. They became irregular before they stopped.", ["last period", "LMP", "cycles", "bleeding"]],
    ["HPC", "Symptoms and impact", "The hot flushes and night sweats disturb my sleep. I have vaginal dryness, pain during sex and recurring urinary symptoms.", ["flushes", "sweat", "sleep", "dryness", "sex", "urine"]],
    ["PMH", "Bleeding, blood pressure and smoking", "I haven't bled since my periods stopped. I have mild high blood pressure and smoke ten cigarettes a day.", ["bleeding", "blood pressure", "smoking", "cigarettes"]],
    ["ICE", "Health concerns", "Will I get osteoporosis or a heart attack now?", ["concerns", "worried", "bones", "heart"]],
  ],
  2: [
    ["PMH", "Menstrual history", "My periods started when I was fourteen. They come every twenty-eight to thirty days and the amount of bleeding is normal.", ["menarche", "cycles", "regular", "flow", "periods"]],
    ["HPC", "Pain pattern", "The pain started about a year after my first period. It starts with the bleeding, spreads to my back and improves after a day or two.", ["pain", "onset", "when", "back", "radiation", "better"]],
    ["ROS", "Associated symptoms and red flags", "Sometimes I feel sick or have diarrhoea. I haven't had bleeding between periods, unusual discharge or ongoing pelvic pain between periods.", ["nausea", "diarrhoea", "bleeding", "discharge", "pelvic pain"]],
    ["SH", "Sexual history and main concern", "I'm not sexually active. My main concern is missing classes.", ["sexually active", "pregnancy risk", "college", "impact", "concern"]],
  ],
  3: [
    ["HPC", "Hirsutism and acne", "The hair on my face has been increasing for eight months, and I have acne too.", ["hair", "when", "onset", "acne", "progression"]],
    ["HPC", "Cycles and BMI", "My periods come every forty-five to sixty days. My recorded BMI is thirty-two.", ["cycles", "periods", "weight", "BMI"]],
    ["RED_FLAG", "Virilisation", "My voice hasn't suddenly become deeper, and I haven't noticed enlargement of my clitoris or sudden severe masculinising changes.", ["voice", "deepening", "clitoris", "rapid", "virilisation"]],
    ["ICE", "Appearance and fertility", "I'm worried about how I look and whether I'll be able to have children in the future.", ["appearance", "fertility", "children", "worried"]],
  ],
  5: [
    ["SH", "Relationship and intercourse", "I've been married for three years. We've had unprotected sex two or three times a week for the last eighteen months.", ["married", "intercourse", "frequency", "duration", "unprotected"]],
    ["PMH", "Cycles and pregnancies", "My periods are irregular, every forty to fifty days. I've never been pregnant before.", ["cycles", "periods", "pregnancy", "miscarriage"]],
    ["PMH", "Tubal risk", "I had chlamydia treated five years ago. I've never had pelvic surgery.", ["STI", "chlamydia", "infection", "tubal", "surgery"]],
    ["OTHER", "Partner assessment", "My husband hasn't had a semen test yet.", ["partner", "husband", "semen", "male factor"]],
  ],
  6: [
    ["PMH", "Birth and postpartum course", "I had a vaginal birth six weeks ago, without any postpartum complications.", ["birth", "delivery", "weeks", "complications"]],
    ["PMH", "Feeding and eligibility history", "I'm breastfeeding with mixed feeds. I haven't had migraine with aura, a blood clot, liver disease or breast cancer. I don't smoke.", ["breastfeeding", "feeding", "migraine", "aura", "clot", "VTE", "liver", "cancer", "smoking"]],
    ["ICE", "Method preferences", "I'd prefer something I don't have to remember every day, but I'd like to understand the pills as well.", ["preference", "daily", "pill", "implant", "coil", "choice"]],
  ],
  7: [
    ["SH", "Family relationship, BMI and known illness", "I'm planning to marry my first cousin. My BMI is twenty-nine, and I don't know of any chronic illness.", ["family", "cousin", "consanguinity", "BMI", "illness"]],
    ["DH", "Supplements and vaccination", "I take an over-the-counter vitamin supplement. I don't know whether I'm immune to rubella.", ["medication", "supplement", "vitamin", "rubella", "vaccination"]],
    ["PMH", "Pregnancy history", "I've never been pregnant before.", ["pregnant", "pregnancies", "miscarriage"]],
  ],
  8: [
    ["HPC", "Dating and symptoms", "Based on my last period I'm ten weeks and two days pregnant. I have mild nausea but no bleeding or pain.", ["LMP", "dates", "weeks", "nausea", "bleeding", "pain"]],
    ["PMH", "Medical, surgical and obstetric history", "This is my first pregnancy. I haven't had a medical disease or surgery.", ["illness", "surgery", "pregnancy", "obstetric history"]],
    ["FH", "Diabetes in family", "My mother has diabetes.", ["family", "mother", "diabetes"]],
  ],
};
const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function buildGynaeObstetrics15StationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 4) throw new Error("Incomplete gynaecology/obstetrics data.");
  return data.stations.map((station, index) => {
    if (station.number !== index + 1 || station.time !== "8 minutes" || station.checklist.length !== 10 || station.globalRating.length !== 5) throw new Error(`Incomplete station ${station.number}.`);
    const slug = `gynae-obs-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiNumbers.has(station.number);
    const opening = openings[station.number] || station.candidateInstructions[0];
    const makeFact = (value, response, label, section, factIndex, triggers = [], revealPolicy = "IF_RELEVANT_QUESTION") => ({
      factId: `${slug}-fact-${factIndex + 1}`, conceptId: slugify(label).replaceAll("-", "_"), label, section,
      value, naturalResponse: response, revealPolicy, triggerConcepts: triggers.map(trigger => slugify(trigger).replaceAll("-", "_")), synonyms: triggers, relatedChecklistItemIds: [],
    });
    if (interactive && dialogue[station.number]?.length !== station.simulationScript.length) throw new Error(`Incomplete dialogue ${station.number}.`);
    const facts = interactive ? [
      makeFact(station.candidateInstructions[0], opening, "Presenting concern", "PC", 0, ["opening", "what brought you"], "OPENING"),
      ...dialogue[station.number].map(([section, label, response, triggers], i) => makeFact(station.simulationScript[i], response, label, section, i + 1, triggers, station.number === 2 && i === 3 ? "IF_ASKED" : "IF_RELEVANT_QUESTION")),
    ] : station.simulationScript.map((line, i) => makeFact(line, line, `Simulation cue ${i + 1}`, "OTHER", i));
    const module = {
      title: station.title, slug, presentingComplaint: opening, systemOrTopic: station.primaryCompetency,
      stationType: types[index], stationFormat: station.format, practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["gynae-obstetrics-15", "gynaecology", types[index]], difficulty: [10, 11, 12, 13, 14, 15].includes(station.number) ? "advanced" : "intermediate",
      timeLimitSeconds: 480, shortDescription: station.candidateInstructions[0],
      candidateInstructions: { context: station.format, patientSummary: "", tasks: station.candidateInstructions, examinationRequired: ["examination", "emergency"].includes(types[index]), additionalInstructions: [station.time, station.analyticScore] },
      candidateHandout: station.candidateHandout, simulationScript: station.simulationScript,
      examinerInstructions: station.examinerInstructions.join("\n"), keyAnswerGuide: station.keyAnswerGuide.join("\n"),
      suggestedCandidateApproach: station.suggestedApproach, learningNotes: station.learningNotes.join("\n"),
      expectedCompetencies: station.expectedCompetencies, criticalSafetyErrors: station.criticalSafetyErrors, globalRatingOptions: station.globalRating,
      assessmentDesign: [...data.metadata.assessmentDesign, station.scoringAnchor],
      // Retain all manual metadata in JSON, but only show clinical practice
      // guidance to students, not provenance or production/printing commentary.
      facultyNote: `${data.metadata.facultyNote[4]}\nExact drug doses, antihypertensive thresholds, magnesium sulphate regimens, thromboprophylaxis, abortion law/process, contraceptive eligibility and emergency protocols must be checked against current approved institutional, provincial and national guidance before summative use.`,
      facultySourceNote: station.sourceNote, commonMistakes: [], keyDifferentials: [],
      vivaQuestions: station.promptQuestions.map(question => ({ question, modelAnswerOutline: "" })),
      sourceReferences: ["Gynae_Obstetrics_15_OSCE_Stations.pdf"], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed", publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number], baselineState: {},
      openingStatement: opening, demeanor: { general: interactive ? "Respond naturally as the named patient, using the authored symptoms, preferences and concerns." : "Simulation material for guided practice only.", verbosity: "Only disclose supplied details relevant to what is asked." }, facts,
      emotionalCues: [], patientQuestions: [], expectedPatientAttitude: interactive ? "Use the supplied history and concerns. Do not assume pregnancy status, contraception, sexual activity, allergy, medicines, menstrual dates or family history beyond the authored details. Do not invent blood pressure or physical examination findings. For PCOS and booking, the student may discuss examination plans; you cannot perform or supply unprovided examination results." : "Guided examination, interpretation or emergency simulation; not an AI patient interview.",
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

export async function seedGynaeObstetrics15OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "gynaecology" }, { $setOnInsert: { name: "Gynaecology", slug: "gynaecology", description: "Gynaecology and obstetrics OSCE stations.", icon: "stethoscope", order: 2, active: true } }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildGynaeObstetrics15StationBundles()) {
    const script = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    stations.push(await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: script._id, smartChecklistId: checklist._id } }, { upsert: true, new: true, runValidators: true }));
  }
  return stations;
}
