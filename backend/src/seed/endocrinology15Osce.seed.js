import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

// Complete reviewed content ships with the seed; no external document is
// needed when deploying this collection to another MongoDB database.
const data = JSON.parse(readFileSync(new URL("./endocrinology15Stations.data.json", import.meta.url), "utf8"));
const sourceReference = "Endocrinology_OSCE_15_Stations.pdf";
const aiStationNumbers = new Set([1, 2, 3, 6, 7, 11, 13]);
const stationTypes = ["history", "history", "counselling", "emergency", "examination", "counselling", "history", "emergency", "examination", "examination", "history", "interpretation", "interpretation", "emergency", "emergency"];
const identities = {
  1: { name: "Hamid Saeed", age: 74, sex: "male" },
  2: { name: "Mrs Abdullah", sex: "female" },
  3: { name: "Anam Awais", age: 47, sex: "female" },
  4: { name: "Zeeshan", age: 45, sex: "male" },
  5: { name: "Ramazan Ahmad", age: 55, sex: "male" },
  6: { name: "Mrs Abdullah", sex: "female" },
  11: { sex: "female" },
};

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function spokenOpening(script) {
  return script[0].match(/[“"]([^”"]+)[”"]/)?.[1] || script[0];
}

// [section, label, exact source pointers, patient wording, question triggers].
// Unspecified clinical positives/negatives and demographic details stay unknown.
const dialogueFacts = {
  1: [
    ["HPC", "Progression and impact", ["script:1", "handout:0"], "It has come on gradually over several months. I'm tired and my muscles feel weak, and it's affecting the things I normally do around the house and socially.", ["onset", "when", "tired", "weak", "activities", "daily life"]],
    ["HPC", "Hypothyroid symptoms", ["script:2"], "I've put on weight, feel unusually cold and prefer warm weather. I'm constipated, my skin is dry, my hair is dry and thinning, and my voice is a little hoarse. I sleep more and sometimes feel low, but I haven't thought about harming myself.", ["weight", "cold", "bowels", "skin", "hair", "voice", "sleep", "mood"]],
    ["RED_FLAG", "Alternative causes and severe symptoms", ["script:3"], "I haven't had prolonged morning stiffness in my shoulders or hips, black stools, trouble breathing when lying down, seizures or confusion.", ["stiff", "shoulders", "hips", "black stools", "orthopnoea", "seizures", "confusion"]],
    ["PMH", "Thyroid history", ["script:4"], "I've never had thyroid surgery, radioactive iodine treatment or thyroid medicine. I haven't noticed recent swelling in my neck.", ["thyroid", "surgery", "radioiodine", "neck swelling", "previous treatment"]],
    ["PMH", "Heart disease and current stability", ["handout:2", "instructions:0"], "I have ischaemic heart disease. I don't have new chest pain or heart-failure symptoms now, and I haven't been unusually cold to the point of hypothermia or become confused.", ["heart disease", "angina", "chest pain", "heart failure", "hypothermia"]],
    ["DH", "Medicines and allergies", ["script:5"], "I take my prescribed heart medicines regularly. I don't take lithium, amiodarone or herbal thyroid preparations, and I have no known drug allergy. The specific names of my other heart medicines haven't been supplied.", ["medicine", "lithium", "amiodarone", "herbal", "allergy"]],
    ["OTHER", "Thyroid results", ["handout:1"], "The repeat blood test has a high TSH and low free T4. I don't have the actual numbers.", ["blood test", "results", "TSH", "free T4"]],
    ["ICE", "Beliefs and concerns", ["script:6"], "I wondered whether this was just ageing. I'm worried my heart disease might be getting worse, and I hope you can explain what's happening and find a safe treatment.", ["think", "worried", "concern", "hope", "expect"]],
  ],
  2: [
    ["HPC", "Duration and thyrotoxic symptoms", ["instructions:0", "script:1"], "The racing heart, sweating and shaking have been going on for six months. I feel hot, have lost weight despite eating well, go to the toilet more often and sleep poorly. My hands are moist and shaky enough to make writing difficult.", ["when", "duration", "heat", "weight", "appetite", "bowel", "sleep", "tremor", "writing"]],
    ["RED_FLAG", "Cardiorespiratory symptoms and asthma", ["script:2", "handout:1"], "I haven't had chest pain, fainting, trouble breathing lying down or swollen ankles. My asthma makes me wheeze from time to time and I use inhalers. Nobody has prescribed propranolol for me.", ["chest pain", "faint", "breathless", "ankles", "asthma", "inhalers", "propranolol"]],
    ["HPC", "Eyes and neck", ["script:3"], "My eyes feel gritty, but I don't have double vision or loss of sight. I've noticed a little fullness in my neck without pain.", ["eyes", "vision", "double vision", "neck", "swelling", "pain"]],
    ["SH", "Pregnancy status and plans", ["script:4"], "I'm not pregnant at the moment, but I'd like a pregnancy in the future. I'm happy to discuss timing and contraception with the specialist team.", ["pregnant", "pregnancy", "children", "contraception", "plans"]],
    ["DH", "Medicines, supplements and allergies", ["script:5"], "I only use my inhalers. I don't take amiodarone, lithium, thyroid hormones or iodine supplements, and I have no known drug allergy.", ["medicine", "amiodarone", "lithium", "iodine", "supplements", "allergy"]],
    ["OTHER", "Thyroid results", ["handout:0"], "My TSH is below the normal range and my free T4 is above it. I don't have exact numbers.", ["blood test", "results", "TSH", "free T4"]],
    ["ICE", "Concern and expectation", ["script:6"], "I'm afraid this is a heart problem. I want the symptoms to settle quickly, but I don't want treatment to make my asthma worse.", ["worried", "think", "concern", "expect", "asthma"]],
  ],
  3: [
    ["HPC", "Diabetes duration and current symptoms", ["instructions:0", "handout:0", "script:1"], "I've had type 2 diabetes for two years. I'm thirsty, passing urine often including at night, and tired. I'm hungrier but have lost some weight, get recurrent boils and genital itching, and sometimes have blurred vision and tingling toes. I don't have a foot wound, vomiting, abdominal pain or confusion.", ["duration", "thirst", "urine", "night", "weight", "boils", "itching", "vision", "tingling", "foot", "vomiting"]],
    ["DH", "Treatment and adherence barriers", ["handout:1", "script:2"], "I take metformin, but often miss it because it makes me bloated and work gets in the way. I don't use herbal remedies and have no known drug allergy.", ["metformin", "medicine", "missed", "bloating", "adherence", "herbal", "allergy"]],
    ["OTHER", "Monitoring and treatment context", ["instructions:0", "handout:1", "handout:2"], "My random glucose is 300 mg/dL and my HbA1c is above the target agreed for me. My kidney function is adequate for the treatments being discussed, and blood pressure and cholesterol checks are due.", ["glucose", "HbA1c", "results", "kidney", "cholesterol", "target"]],
    ["SH", "Lifestyle", ["script:3"], "My meals are irregular, I have sugary drinks and don't exercise much. I don't smoke and don't drink harmful amounts of alcohol.", ["diet", "meals", "drinks", "exercise", "smoke", "alcohol"]],
    ["PMH", "Complications and comorbidity", ["script:4", "handout:1", "handout:2"], "I haven't had chest pain, stroke symptoms or trouble breathing lying down, and I don't know of kidney disease or heart failure. I'm not pregnant. My blood pressure has been high before, and my eye screening is overdue.", ["chest pain", "stroke", "kidney", "heart failure", "blood pressure", "pregnant", "screening"]],
    ["ICE", "Psychosocial and affordability", ["script:5"], "Work and family stress make it hard to look after myself. I'm worried about complications and want a practical plan I can afford.", ["stress", "family", "work", "worried", "cost", "afford", "expect"]],
  ],
  6: [
    ["PMH", "Pregnancy and diabetes history", ["instructions:0", "script:2", "handout:1"], "I'm 24 weeks pregnant. I had gestational diabetes before and a baby weighing more than 4.5 kg, but haven't had known diabetes outside pregnancy. My BMI is over 30 and my mother had gestational diabetes too.", ["weeks", "pregnant", "previous", "baby", "weight", "family", "mother", "diabetes"]],
    ["OTHER", "Glucose testing", ["handout:0"], "My glucose test at 16 weeks was normal, but the two-hour result on the 75 gram test at 24 weeks was 250 mg/dL, or 13.9 mmol/L.", ["test", "result", "OGTT", "glucose", "16 weeks"]],
    ["RED_FLAG", "Current maternal and fetal symptoms", ["script:1"], "I feel well. I haven't had vomiting, abdominal pain, reduced baby movements, headaches, visual problems or any acute illness.", ["vomiting", "abdominal pain", "movements", "headache", "vision", "unwell"]],
    ["DH", "Lisinopril exposure and allergies", ["script:3", "handout:2"], "Another doctor started lisinopril for my blood pressure a few days ago before they knew I was pregnant. I've taken it as prescribed and have no known drug allergy.", ["medicine", "lisinopril", "blood pressure", "ACE inhibitor", "allergy"]],
    ["SH", "Support and treatment preferences", ["script:4"], "My family supports me. I'm willing to see a dietitian and check my glucose at home.", ["family", "support", "diet", "monitor", "glucose checks"]],
    ["ICE", "Concerns", ["script:5"], "I'm worried about harm to my baby, the baby growing too large, needing injections and whether I'll have diabetes later on.", ["worried", "baby", "injections", "future", "concern"]],
  ],
  7: [
    ["HPC", "Adrenal symptoms and duration", ["script:1", "handout:1"], "For months I've been tired, losing weight and getting dizzy when I stand. I crave salt and my skin has become darker.", ["when", "fatigue", "weight", "dizzy", "standing", "salt", "skin"]],
    ["RED_FLAG", "Current stability", ["script:1", "handout:0"], "I can take tablets by mouth. I don't have vomiting, fever, abdominal pain, fainting or confusion at the moment.", ["vomiting", "fever", "abdominal pain", "faint", "confusion", "tablets"]],
    ["OTHER", "Confirmed diagnosis", ["handout:0"], "The specialist confirmed primary adrenal insufficiency from the blood tests. I haven't been given exact results here.", ["diagnosis", "blood test", "specialist", "results"]],
    ["DH", "Adherence concern", ["script:2"], "I'm worried I'll become dependent on steroids. Can I stop the tablets when I'm feeling well?", ["steroids", "dependent", "stop", "tablets", "adherence"]],
    ["SH", "Family and travel", ["script:3"], "I live with family who could learn what to do in an emergency. Sometimes I travel to places a long way from a hospital.", ["family", "support", "travel", "hospital", "emergency"]],
    ["ICE", "Beliefs and expectations", ["script:4"], "I'm afraid the medicine might be more dangerous than the condition. I want a simple plan for emergencies.", ["worried", "think", "medicine", "expect", "emergency plan"]],
  ],
  11: [
    ["HPC", "Reproductive and breast symptoms", ["script:1", "instructions:0"], "My periods stopped and I started getting milk from my breasts gradually. My libido is lower and I'd like children in the future. I haven't noticed bloody discharge, a breast lump or fever.", ["period", "onset", "milk", "breast", "libido", "fertility", "children", "fever"]],
    ["RED_FLAG", "Headache and vision", ["script:2"], "I get mild headaches now and then, but no sudden severe headache, vomiting, double vision or loss of sight at the sides.", ["headache", "vision", "vomiting", "double vision", "peripheral"]],
    ["OTHER", "Tests and pregnancy", ["handout:0"], "My pregnancy test was negative. The prolactin result was high, but my thyroid and kidney tests were within the normal ranges. I haven't had a pituitary scan.", ["pregnancy", "test", "prolactin", "thyroid", "kidney", "scan"]],
    ["DH", "Risperidone and relapse concern", ["script:3", "handout:1"], "Psychiatry prescribed risperidone and it has helped my mental health. I'm worried about relapsing and won't stop it without advice from my psychiatric team. No other relevant medicine is listed.", ["medicine", "risperidone", "mental health", "stop", "relapse"]],
    ["ICE", "Concerns and expectations", ["script:4"], "I'm afraid of a pituitary tumour and not being able to have children. I'd like to know whether I need a scan and treatment.", ["worried", "tumour", "fertility", "scan", "expect"]],
  ],
  13: [
    ["HPC", "Renal, GI and general symptoms", ["script:1", "instructions:0"], "I've had kidney stones more than once and get renal colic from time to time. I'm also constipated and tired.", ["stones", "urine", "pain", "colic", "bowels", "constipation", "fatigue"]],
    ["RED_FLAG", "Severe hypercalcaemia symptoms", ["script:1", "handout:0"], "I'm not vomiting, severely dehydrated or confused, and I haven't had a coma or heart symptoms. I'm alert and stable now.", ["vomiting", "dehydration", "confusion", "heart", "collapse"]],
    ["PMH", "Skeletal complications", ["script:2"], "I sometimes have aching bones, but don't know of any fragility fracture.", ["bones", "pain", "fracture", "skeletal"]],
    ["DH", "Medicines and family history", ["script:3"], "I haven't reported calcium supplements or a thiazide medicine. I don't know of any endocrine syndrome in the family.", ["calcium", "supplement", "thiazide", "medicine", "family"]],
    ["OTHER", "Biochemistry and imaging", ["handout:0", "handout:1"], "My adjusted calcium has been high on more than one test, and the parathyroid hormone is high too. The kidney ultrasound shows a stone. I haven't had a neck scan, and exact blood-test values haven't been supplied.", ["calcium", "PTH", "parathyroid", "results", "ultrasound", "neck scan"]],
    ["ICE", "Belief and concern", ["script:4"], "I thought a neck scan would confirm what's wrong. I'm worried about damage to my kidneys.", ["think", "scan", "worried", "kidneys", "concern"]],
  ],
};

function sourceAt(station, pointer) {
  const [kind, index] = pointer.split(":");
  const lists = { script: station.simulationScript, handout: station.candidateHandout, instructions: station.candidateInstructions };
  const value = lists[kind]?.[Number(index)];
  if (!value) throw new Error(`Missing endocrinology source pointer ${station.number}:${pointer}`);
  return value;
}

function teachingCopy(original) {
  // The JSON retains every original section. Published wording resolves these
  // discrepancies against the cited clinical guidance
  // guidance, rather than silently losing the original material.
  if (original.number === 2) return {
    ...original,
    keyAnswerGuide: original.keyAnswerGuide.map(line => line.startsWith("Monitor TFTs during treatment;")
      ? "Monitor thyroid function during antithyroid treatment. NICE NG145 recommends TSH, FT4 and FT3 every 6 weeks until TSH is within range, then TSH with cascading every 3 months until antithyroid drugs are stopped; follow the approved local specialist plan."
      : line),
  };
  if (original.number === 4) return {
    ...original,
    keyAnswerGuide: original.keyAnswerGuide.map((line, index) => index === 0
      ? "Recognise symptomatic hypoglycaemia and treat before prolonged history-taking. Do not assign level 1 from a value described only as below 70 mg/dL; classification depends on the exact glucose and need for assistance."
      : line),
  };
  if (original.number !== 14) return original;
  const treatment = "10–20 mL of 10% calcium gluconate diluted in 50–100 mL of 5% dextrose IV over 10 minutes with continuous ECG monitoring, following the approved local emergency protocol";
  return {
    ...original,
    learningNotes: original.learningNotes.map(line => line.replace("10 mL of 10% calcium gluconate IV over 10–20 minutes with ECG monitoring", treatment)),
    examinerInstructions: original.examinerInstructions.map(line => line.replace("10 mL of 10% calcium gluconate over 10–20 minutes and monitoring", treatment)),
    keyAnswerGuide: original.keyAnswerGuide.map(line => line.replace("10 mL of 10% calcium gluconate IV over 10–20 minutes with continuous ECG monitoring", treatment)),
    checklist: original.checklist.map(item => item.order === 5 ? { ...item, criterion: "Orders 10–20 mL of 10% calcium gluconate IV according to the approved emergency protocol." }
      : item.order === 6 ? { ...item, criterion: "Specifies dilution in 50–100 mL of 5% dextrose, administration over 10 minutes, and continuous ECG monitoring according to the approved emergency protocol." } : item),
  };
}

export function buildEndocrinology15StationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 6) throw new Error("Incomplete endocrinology station data.");
  return data.stations.map((original, index) => {
    const station = teachingCopy(original);
    if (station.number !== index + 1 || station.checklist.length !== 10 || station.time !== "10 minutes") throw new Error(`Incomplete endocrinology station ${station.number}.`);
    const slug = `endo-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiStationNumbers.has(station.number);
    const opening = spokenOpening(station.simulationScript);
    const makeFact = (section, label, value, naturalResponse, triggers, factIndex, revealPolicy = "IF_RELEVANT_QUESTION") => ({
      factId: `${slug}-fact-${factIndex + 1}`, section, conceptId: slugify(label).replaceAll("-", "_"), label, value, naturalResponse, revealPolicy,
      triggerConcepts: triggers.map(trigger => slugify(trigger).replaceAll("-", "_")), synonyms: triggers, relatedChecklistItemIds: [],
    });
    const facts = interactive ? [
      makeFact("PC", "Opening concern", station.simulationScript[0], opening, ["opening", "what brought you", "tell me"], 0, "OPENING"),
      ...dialogueFacts[station.number].map(([section, label, pointers, naturalResponse, triggers], factIndex) =>
        makeFact(section, label, pointers.map(pointer => sourceAt(station, pointer)).join("\n"), naturalResponse, triggers, factIndex + 1)),
    ] : station.simulationScript.map((line, factIndex) => makeFact("OTHER", `Simulation cue ${factIndex + 1}`, line, line, [], factIndex));
    const module = {
      title: station.title, slug, presentingComplaint: opening, systemOrTopic: station.primaryCompetency,
      stationType: stationTypes[index], stationFormat: station.format,
      practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["endocrinology-15", "endocrinology", stationTypes[index]],
      difficulty: [4, 8, 12, 14, 15].includes(station.number) ? "advanced" : "intermediate", timeLimitSeconds: 600,
      shortDescription: station.candidateInstructions[0],
      candidateInstructions: { context: station.format, patientSummary: "", tasks: station.candidateInstructions,
        examinationRequired: ["examination", "emergency"].includes(stationTypes[index]), additionalInstructions: [station.time, station.analyticScore] },
      candidateHandout: station.candidateHandout, simulationScript: station.simulationScript,
      examinerInstructions: station.examinerInstructions.join("\n"), keyAnswerGuide: station.keyAnswerGuide.join("\n"),
      suggestedCandidateApproach: station.suggestedApproach, learningNotes: station.learningNotes.join("\n"),
      expectedCompetencies: station.expectedCompetencies, criticalSafetyErrors: station.criticalSafetyErrors,
      globalRatingOptions: station.globalRating, assessmentDesign: data.metadata.assessmentDesign,
      facultyNote: data.metadata.facultyNote, facultySourceNote: station.sourceNote,
      commonMistakes: [], keyDifferentials: [], vivaQuestions: station.promptQuestions.map(question => ({ question, modelAnswerOutline: "" })),
      sourceReferences: [sourceReference], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed",
      publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number] || {}, baselineState: {}, openingStatement: opening,
      demeanor: { general: station.simulationScript[0], verbosity: "Only disclose the case details relevant to what is asked." }, facts,
      emotionalCues: [], patientQuestions: [],
      expectedPatientAttitude: interactive ? "Respond naturally as this patient using the supplied case facts." : "Simulator cues for guided practice.",
      unknownFactPolicy: "If the case does not supply a detail, say you do not know; do not invent positive or negative clinical facts, doses, demographic details, or dates.",
      sourceReferences: [sourceReference], status: "published", version: 1,
    };
    const checklist = {
      title: `${station.title} — analytic checklist`, slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: 20, description: data.metadata.assessmentDesign.slice(0, 2).join(" ") },
      weightConfiguration: { critical: 1, major: 1, minor: 1 },
      sections: [{ sectionId: `${slug}-analytic`, title: "Analytic checklist (20 points)", items: station.checklist.map(({ order, criterion }) => ({
        itemId: `${slug}-criterion-${order}`, label: criterion, description: criterion, category: stationTypes[index],
        expectedConcepts: [criterion], relatedFactIds: [], weightCategory: "major", maxRawScore: 2, allowPartial: true,
        criticalSafetyItem: false, remediationText: criterion, order,
      })) }], status: "published", version: 1,
    };
    return { source: station, module, patientScript, checklist };
  });
}

export async function seedEndocrinology15OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "endocrinology" }, {
    $setOnInsert: { name: "Endocrinology", slug: "endocrinology", description: "Endocrinology OSCE stations.", icon: "stethoscope", order: 6, active: true },
  }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildEndocrinology15StationBundles()) {
    const patientScript = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    const station = await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, {
      $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: patientScript._id, smartChecklistId: checklist._id },
    }, { upsert: true, new: true, runValidators: true });
    stations.push(station);
  }
  // Repair only the known legacy DKA station's specialty, preserving all IDs,
  // clinical content, visibility, and attempts.
  await OsceStation.updateOne({ slug: "dka-abdominal-pain-vomiting-history", taskTags: "endocrinology" }, { $set: { specialtyId: specialty._id } });
  return stations;
}
