import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

// The reviewed, structured data is checked in beside this seed. The original
// PDF is not needed when this seed is run against another MongoDB database.
const data = JSON.parse(readFileSync(new URL("./cvs15Stations.data.json", import.meta.url), "utf8"));
const sourceReference = "CVS_OSCE_15_Stations.pdf";
const aiStationNumbers = new Set([2, 3, 4, 5, 6, 14]);
const stationTypes = [
  "emergency", "history", "counselling", "counselling", "history",
  "counselling", "emergency", "emergency", "emergency", "examination",
  "interpretation", "emergency", "examination", "counselling", "emergency",
];
const identities = {
  2: { name: "Ashraf Butt", sex: "male" },
  3: { name: "Muhammad Mahmood", sex: "male" },
  4: { name: "Fazal Ahmad", age: 57, sex: "male" },
  5: {},
  6: { name: "Saira Iqbal", age: 63, sex: "female" },
  14: {},
};

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function spokenOpening(script) {
  const first = script[0] || "";
  return first.match(/[“"]([^”"]+)[”"]/)?.[1] || first;
}

// Each tuple is [section, label, source locations, natural patient answer,
// conversational triggers]. Patient speech is authored only from the case
// facts. Examination findings remain in the guided simulation script instead
// of being spoken by an AI patient.
const dialogueFacts = {
  2: [
    ["PC", "Opening concern", ["script:0"], "Since my heart attack, I get chest pain when I exert myself. My spray used to settle it, but the attacks are getting more frequent and lasting longer.", ["chest pain", "what brought you", "opening"]],
    ["HPC", "Pain pattern", ["script:1", "handout:0"], "It's a crushing pain in the centre of my chest that goes into my neck and left arm. Cold, emotion, heavy meals, and exertion bring it on; rest and my GTN spray usually help within 10 to 15 minutes. No episode has lasted over 15 minutes or happened at rest so far.", ["pain", "onset", "radiation", "trigger", "rest", "duration", "spray"]],
    ["HPC", "Alternative-pain features", ["script:2"], "Pressing on the chest or moving doesn't reproduce it. Breathing, antacids, and changing position don't seem to explain it either. I haven't had chest trauma.", ["breathing", "palpation", "movement", "antacid", "trauma", "position"]],
    ["PMH", "Previous heart attack", ["handout:2"], "I had a heart attack last year. I don't know of any diabetes, and heart disease and high blood pressure run in my family.", ["heart attack", "medical history", "diabetes", "family"]],
    ["SH", "Smoking, alcohol and work", ["script:3", "handout:2"], "I smoke heavily but want to quit. I drink occasionally and my cashier job is sedentary and stressful. I'm not known to have asthma.", ["smoke", "alcohol", "work", "stress", "asthma"]],
    ["ICE", "Fears and expectations", ["script:4"], "I'm afraid of another heart attack. Is there something beyond the spray that could help? I'm worried you may say I need surgery.", ["worried", "concern", "expect", "surgery"]],
  ],
  3: [
    ["PC", "Opening concern", ["script:0"], "I'm glad to be home, but I have a lot of questions about what I can and can't do after my heart attack.", ["how are you", "what brought you", "questions"]],
    ["ICE", "Questions about recovery", ["script:1"], "What exactly happened to my heart? Could it happen again? When can I work, fly, swim and have sex again? I also wonder what an angiogram or treadmill test is.", ["work", "fly", "sex", "swim", "angiogram", "recovery"]],
    ["ICE", "Mood and anxiety", ["script:2"], "I've felt low and anxious since coming home and worry about suddenly dying. I haven't thought about hurting myself.", ["mood", "anxious", "depressed", "suicidal", "mental health"]],
    ["DH", "Medicines and side effects", ["script:3", "handout:0"], "I'm taking aspirin, atenolol, ramipril and simvastatin, with GTN spray for emergencies. I'll take them, but I worry about side effects, especially impotence. Do I really need all of them?", ["medicines", "aspirin", "atenolol", "ramipril", "simvastatin", "side effects"]],
    ["RED_FLAG", "Current symptoms", ["handout:1"], "I don't have chest pain, breathlessness, fever or pain when breathing at the moment.", ["chest pain", "breathless", "fever", "pleuritic", "symptoms"]],
    ["SH", "Work and habits", ["handout:2"], "I have a desk job, enjoy swimming, smoke and drink socially.", ["occupation", "work", "swimming", "smoke", "alcohol"]],
  ],
  4: [
    ["PC", "Opening concern", ["script:0"], "But doctor, I feel fine. Do I really need medicine for high blood pressure?", ["blood pressure", "what brings you", "medicine"]],
    ["HPC", "Diagnosis and symptoms", ["script:1", "handout:0", "handout:1"], "It was found by chance about a year ago and has stayed high on repeat checks. I sometimes get a headache or blurred vision, but no chest pain, breathlessness, swollen legs or stroke. The tests for another cause were negative.", ["diagnosis", "when", "headache", "vision", "heart", "kidney", "stroke", "secondary"]],
    ["SH", "Lifestyle and family", ["script:2", "handout:2"], "I smoke and drink more than recommended, sit at a desk most of the day, and don't exercise much. I'm overweight, and high blood pressure and heart disease run in my family.", ["smoke", "drink", "exercise", "weight", "family", "work"]],
    ["ICE", "Mood and sexual function", ["script:3"], "My mood has been low and I've been having trouble with erections. Could blood-pressure tablets make that worse?", ["mood", "depression", "erectile", "sex", "side effect"]],
    ["ICE", "Fears and goals", ["script:4"], "A friend died of high blood pressure. I'm worried this is untreatable and I want to know how to live normally and avoid complications.", ["worried", "fear", "expect", "complications"]],
  ],
  5: [
    ["PC", "Palpitations", ["script:0", "handout:0"], "My heart has been racing on and off for a few weeks and I get a little breathless on exertion.", ["palpitations", "onset", "breathlessness", "what brought you"]],
    ["RED_FLAG", "Associated symptoms", ["script:1", "handout:0"], "I haven't fainted, had chest pain at rest or noticed leg swelling.", ["faint", "syncope", "chest pain", "leg swelling"]],
    ["PMH", "Stroke-risk history", ["script:1", "handout:1"], "I have treated high blood pressure and I'm over 65. I don't know of diabetes, a previous stroke or TIA, or vascular disease.", ["age", "hypertension", "diabetes", "stroke", "vascular", "risk"]],
    ["SH", "Alcohol and caffeine", ["script:1"], "I drink alcohol occasionally and don't have excessive caffeine.", ["alcohol", "caffeine", "coffee"]],
    ["DH", "Bleeding-risk history", ["script:2"], "I haven't had bleeding or liver or kidney disease, I don't take other blood-thinning or anti-inflammatory medicines, and I drink modestly.", ["bleeding", "liver", "kidney", "blood thinner", "anti-inflammatory"]],
    ["ICE", "Stroke and treatment concerns", ["script:3"], "Does this mean I'm bound to have a stroke? Can my heart be put back into a normal rhythm? I'm anxious about being on blood thinners for a long time.", ["worried", "stroke", "normal rhythm", "blood thinner"]],
  ],
  6: [
    ["PC", "Opening concern", ["script:0"], "My ankles are more swollen and I get out of breath much quicker than before.", ["breathless", "swollen", "what brought you"]],
    ["HPC", "Functional change and fluid symptoms", ["script:1", "handout:0"], "I used to manage two flights of stairs but now one makes me breathless. My ankles are swollen, I've gained about 2 kg this week and sleep on two pillows.", ["stairs", "exercise", "weight", "ankle", "orthopnoea", "pillows"]],
    ["DH", "Current treatment", ["handout:1"], "I take an ACE inhibitor and a beta-blocker at moderate doses, and I have a water tablet. I haven't been started on an MRA or an SGLT2 inhibitor.", ["medicine", "ACE inhibitor", "beta-blocker", "diuretic", "treatment"]],
    ["SH", "Adherence and salt", ["script:1", "handout:2"], "I sometimes skip the water tablet because of how often I need the toilet. I've eaten more salty food during the family wedding season.", ["adherence", "missed", "water tablet", "salt", "diet", "toilet"]],
    ["RED_FLAG", "Possible precipitants", ["script:1"], "I haven't noticed chest pain, fever or palpitations and haven't taken NSAIDs or any new over-the-counter medicines.", ["chest pain", "fever", "palpitations", "NSAID", "new medicine"]],
    ["ICE", "Prognosis concern", ["script:3"], "I'm worried my heart is failing completely. Would more medicine help, or is this untreatable now?", ["worried", "concern", "prognosis", "more medicine"]],
  ],
  14: [
    ["PC", "Opening concern", ["script:0"], "I heard my cholesterol came back high. Does that mean I need medicine for the rest of my life?", ["cholesterol", "results", "medicine", "what brought you"]],
    ["OTHER", "Lipid results", ["handout:0"], "I was told my total and LDL cholesterol are high. My HDL is low-normal and triglycerides are mildly raised, but I don't know exact numbers.", ["cholesterol", "LDL", "HDL", "triglycerides", "numbers"]],
    ["PMH", "Cardiovascular history", ["script:1", "handout:2"], "I don't have known heart or vascular disease, a stroke or diabetes, and I haven't had chest pain. My blood pressure was previously borderline.", ["heart disease", "stroke", "diabetes", "blood pressure", "chest pain"]],
    ["SH", "Risk factors", ["script:1", "handout:1"], "I smoke, sit at work most of the day and am overweight. My father had a heart attack in his 50s. I drink alcohol occasionally.", ["smoke", "work", "weight", "family", "father", "alcohol"]],
    ["ICE", "Statin concern and preference", ["script:2"], "I've heard statins can cause muscle problems. I'd prefer to try diet first; might that be enough?", ["statin", "side effect", "muscle", "diet", "worried"]],
  ],
};

function sourceAt(station, pointer) {
  const [kind, indexText] = pointer.split(":");
  const list = kind === "script" ? station.simulationScript : station.candidateHandout;
  const value = list[Number(indexText)];
  if (!value) throw new Error(`Missing CVS source pointer ${station.number}:${pointer}`);
  return value;
}

function teachingCopy(station) {
  if (station.number !== 11) return station;
  // Preserve the original wording in cvs15Stations.data.json. The teaching
  // copy follows the current NICE NG158 delayed-ultrasound branch: likely DVT
  // gets urgent ultrasound, but when that cannot happen within four hours,
  // D-dimer is taken before interim therapeutic anticoagulation and a scan
  // within 24 hours. D-dimer alone must never be treated as exclusion here.
  return {
    ...station,
    learningNotes: ["Learning note: Use the two-level Wells score to classify suspected DVT. If DVT is likely, arrange a proximal leg ultrasound with a result within 4 hours if possible. If that is not possible, take a D-dimer, give interim therapeutic anticoagulation as appropriate, and obtain the ultrasound result within 24 hours. Do not use a D-dimer alone to rule out likely DVT. For unlikely DVT, follow the D-dimer-led pathway. Confirmed proximal DVT usually needs at least 3 months of anticoagulation, with longer treatment individualised to provocation and bleeding risk."],
    examinerInstructions: station.examinerInstructions.map((item) => item.replace(
      "rather than starting with a D-dimer",
      "rather than using D-dimer alone to defer ultrasound or indicated interim treatment",
    )),
    keyAnswerGuide: station.keyAnswerGuide.map((item) => item
      .replace("or interim parenteral anticoagulation with ultrasound to follow within 24 hours if not", "or, if that cannot happen, D-dimer followed by interim therapeutic anticoagulation and ultrasound within 24 hours")
      .replace("not as the first test in a \"likely\" presentation", "not as a stand-alone rule-out test in a \"likely\" presentation")),
    checklist: station.checklist.map((item) => item.order === 5 ? {
      ...item,
      criterion: "Routes likely DVT to urgent ultrasound; if delayed beyond 4 hours, takes D-dimer, starts indicated interim therapeutic anticoagulation and obtains ultrasound within 24 hours rather than relying on D-dimer alone.",
    } : item),
    criticalSafetyErrors: station.criticalSafetyErrors.map((item) => item.replace(
      "Orders D-dimer as the first test in a Wells \"likely\" presentation instead of urgent ultrasound.",
      "Uses D-dimer alone to exclude a Wells-likely DVT or fails to arrange urgent ultrasound and indicated interim treatment.",
    )),
  };
}

export function buildCvsStationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 6) throw new Error("CVS station data is incomplete.");
  return data.stations.map((originalStation, index) => {
    const station = teachingCopy(originalStation);
    if (station.number !== index + 1 || station.checklist.length !== 10 || station.time !== "10 minutes") {
      throw new Error(`CVS station ${station.number} has an incomplete rubric or timing.`);
    }
    const slug = `cvs-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiStationNumbers.has(station.number);
    const facts = interactive
      ? dialogueFacts[station.number].map(([section, label, pointers, naturalResponse, triggers], factIndex) => ({
          factId: `${slug}-fact-${factIndex + 1}`,
          section,
          conceptId: slugify(label).replaceAll("-", "_"),
          label,
          value: pointers.map((pointer) => sourceAt(station, pointer)).join("\n"),
          naturalResponse,
          revealPolicy: "IF_RELEVANT_QUESTION",
          triggerConcepts: triggers.map((trigger) => slugify(trigger).replaceAll("-", "_")),
          synonyms: triggers,
          relatedChecklistItemIds: [],
        }))
      : station.simulationScript.map((line, factIndex) => ({
          factId: `${slug}-fact-${factIndex + 1}`,
          section: "OTHER",
          conceptId: `simulation_cue_${factIndex + 1}`,
          label: `Simulation cue ${factIndex + 1}`,
          value: line,
          naturalResponse: line,
          revealPolicy: "IF_RELEVANT_QUESTION",
          triggerConcepts: [],
          synonyms: [],
          relatedChecklistItemIds: [],
        }));
    const module = {
      title: station.title,
      slug,
      presentingComplaint: station.title,
      systemOrTopic: station.primaryCompetency,
      stationType: stationTypes[index],
      stationFormat: station.format,
      practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["cvs-15", "cardiovascular", stationTypes[index]],
      difficulty: [1, 7, 8, 9, 12, 15].includes(station.number) ? "advanced" : "intermediate",
      timeLimitSeconds: 600,
      shortDescription: station.candidateInstructions[0],
      candidateInstructions: {
        context: station.format,
        patientSummary: "",
        tasks: station.candidateInstructions,
        examinationRequired: ["examination", "emergency"].includes(stationTypes[index]),
        additionalInstructions: [station.time, station.analyticScore],
      },
      candidateHandout: station.candidateHandout,
      simulationScript: station.simulationScript,
      examinerInstructions: station.examinerInstructions.join("\n"),
      keyAnswerGuide: station.keyAnswerGuide.join("\n"),
      suggestedCandidateApproach: station.suggestedApproach,
      learningNotes: station.learningNotes.join("\n"),
      expectedCompetencies: station.expectedCompetencies,
      criticalSafetyErrors: station.criticalSafetyErrors,
      globalRatingOptions: station.globalRating,
      assessmentDesign: data.metadata.assessmentDesign,
      facultyNote: data.metadata.facultyNote,
      facultySourceNote: station.sourceNote,
      commonMistakes: [],
      keyDifferentials: [],
      vivaQuestions: station.promptQuestions.map((question) => ({ question, modelAnswerOutline: "" })),
      sourceReferences: [sourceReference],
      status: "published",
      version: 1,
      createdBy: "seed",
      reviewedBy: "seed",
      publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`,
      slug: `${slug}-script`,
      patientIdentity: identities[station.number] || {},
      baselineState: {},
      openingStatement: spokenOpening(station.simulationScript),
      demeanor: { general: interactive ? "Answer as this patient, revealing only relevant case facts." : "Simulator cues for guided self-practice." },
      facts,
      emotionalCues: [],
      patientQuestions: [],
      expectedPatientAttitude: interactive ? "Respond naturally as the patient; do not act as an examiner or nurse." : "Not an AI-patient station.",
      unknownFactPolicy: "If the case does not supply a detail, say you do not know; do not invent clinical facts.",
      sourceReferences: [sourceReference],
      status: "published",
      version: 1,
    };
    const checklist = {
      title: `${station.title} — analytic checklist`,
      slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: 20, description: data.metadata.assessmentDesign.slice(0, 2).join(" ") },
      weightConfiguration: { critical: 1, major: 1, minor: 1 },
      sections: [{
        sectionId: `${slug}-analytic`,
        title: "Analytic checklist (20 points)",
        items: station.checklist.map(({ order, criterion }) => ({
          itemId: `${slug}-criterion-${order}`,
          label: criterion,
          description: criterion,
          category: stationTypes[index],
          expectedConcepts: [criterion],
          relatedFactIds: [],
          weightCategory: "major",
          maxRawScore: 2,
          allowPartial: true,
          criticalSafetyItem: false,
          remediationText: criterion,
          order,
        })),
      }],
      status: "published",
      version: 1,
    };
    return { source: station, module, patientScript, checklist };
  });
}

export async function seedCvsOsceStations() {
  const bundles = buildCvsStationBundles();
  const specialty = await Specialty.findOneAndUpdate(
    { slug: "cardiovascular" },
    { $set: { name: "Cardiovascular", slug: "cardiovascular", description: "Cardiovascular OSCE stations.", icon: "stethoscope", order: 5, active: true } },
    { upsert: true, new: true, runValidators: true },
  );
  const stations = [];
  for (const bundle of bundles) {
    const patientScript = await PatientScript.findOneAndUpdate(
      { slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true },
    );
    const checklist = await SmartChecklist.findOneAndUpdate(
      { slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true },
    );
    const station = await OsceStation.findOneAndUpdate(
      { slug: bundle.module.slug },
      { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: patientScript._id, smartChecklistId: checklist._id } },
      { upsert: true, new: true, runValidators: true },
    );
    stations.push(station);
  }
  return stations;
}
