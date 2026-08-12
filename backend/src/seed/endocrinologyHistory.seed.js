import { HistoryModule } from "../models/HistoryModule.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const sourceReference = "User-provided Abdominal pain 10 station";
const slug = "dka-abdominal-pain-vomiting-history";

export async function seedEndocrinologyHistoryStations({ universalGuide }) {
  const gynaecology = await Specialty.findOneAndUpdate(
    { slug: "gynaecology" },
    {
      $set: {
        name: "Gynaecology",
        slug: "gynaecology",
        description: "Gynaecology history-taking modules.",
        icon: "stethoscope",
        order: 2,
        active: true,
      },
    },
    { upsert: true, new: true },
  );

  const station = dkaStation();
  const patientScript = await PatientScript.findOneAndUpdate(
    { slug: station.patientScript.slug },
    { $set: station.patientScript },
    { upsert: true, new: true },
  );
  const checklist = await SmartChecklist.findOneAndUpdate(
    { slug: station.checklist.slug },
    { $set: station.checklist },
    { upsert: true, new: true },
  );
  const module = await HistoryModule.findOneAndUpdate(
    { slug: station.module.slug },
    {
      $set: {
        ...station.module,
        specialtyId: gynaecology._id,
        historyGuideId: universalGuide._id,
        patientScriptId: patientScript._id,
        smartChecklistId: checklist._id,
      },
    },
    { upsert: true, new: true },
  );

  return [module];
}

function dkaStation() {
  return {
    module: {
      title: "DKA Abdominal Pain History",
      slug,
      presentingComplaint: "Vomiting and abdominal pain",
      systemOrTopic: "Diabetic ketoacidosis",
      stationType: "history",
      taskTags: ["history", "endocrinology", "diabetes", "dka", "abdominal-pain"],
      difficulty: "advanced",
      timeLimitSeconds: 600,
      shortDescription: "24-year-old woman with vomiting, abdominal pain, and recent missed insulin doses.",
      candidateInstructions: {
        context: "You are a junior doctor working in the emergency department at your local hospital.",
        patientSummary: "A 24-year-old woman presents with vomiting and abdominal pain.",
        tasks: ["Please take a history.", "At the end of the station, the examiner may ask you some further questions."],
        examinationRequired: false,
        additionalInstructions: [],
      },
      examinerInstructions: "",
      keyAnswerGuide: "Diagnosis: Diabetic ketoacidosis (DKA).\nFurther assessments: vital signs showing hypotension, tachycardia, tachypnoea, normal oxygen saturation, apyrexia; abdominal examination showing diffuse tenderness, prolonged capillary refill, smell of pear drops on breath.\nInvestigations: capillary blood glucose 33 mmol/L; capillary/urinary ketones +++; VBG showing metabolic acidosis; bloods including FBC, CRP, U&E, LFTs, serum blood glucose, blood cultures, amylase, lactate; urinary pregnancy test negative.\nManagement: two large-bore cannulas; IV fluids via infusion pump with 0.9% sodium chloride; fixed-rate insulin infusion as per local protocol; replace potassium if needed; monitor venous pH, glucose, ketones and sodium bicarbonate; treat precipitating factors such as infection.",
      suggestedCandidateApproach: [],
      learningNotes: "",
      commonMistakes: [],
      keyDifferentials: ["Diabetic ketoacidosis", "Gastroenteritis", "Pancreatitis", "Sepsis"],
      vivaQuestions: [
        {
          question: "What further clinical examinations/assessments would you like to perform?",
          modelAnswerOutline: "Vital signs: hypotension, tachycardia, tachypnoea, normal oxygen saturation, apyrexial. Abdominal examination: diffuse tenderness, prolonged capillary refill, smell of pear drops on breath.",
        },
        {
          question: "Describe some appropriate further investigations.",
          modelAnswerOutline: "Capillary blood glucose 33 mmol/L; capillary/urinary ketones +++; VBG metabolic acidosis; bloods including FBC, CRP, U&E, LFTs, serum blood glucose, blood cultures, amylase, lactate; urinary pregnancy test negative.",
        },
        {
          question: "What is your differential diagnosis?",
          modelAnswerOutline: "Diabetic ketoacidosis most likely, gastroenteritis, pancreatitis, sepsis.",
        },
        {
          question: "Describe the management of diabetic ketoacidosis.",
          modelAnswerOutline: "Two large-bore cannulas, IV 0.9% sodium chloride via infusion pump, fixed-rate insulin infusion as per local protocol, potassium replacement if needed, monitoring of venous pH/glucose/ketones/sodium bicarbonate, and treatment of precipitating factors.",
        },
      ],
      sourceReferences: [sourceReference],
      status: "published",
      version: 1,
      createdBy: "seed",
      reviewedBy: "seed",
      publishedAt: new Date(),
    },
    patientScript: {
      name: "24-year-old woman - Vomiting and Abdominal Pain",
      slug: `${slug}-patient`,
      patientIdentity: { name: "", age: 24, sex: "woman", occupation: "retail worker", pronouns: "" },
      baselineState: {},
      openingStatement: "I've been vomiting and I've got abdominal pain.",
      demeanor: { general: "", verbosity: "Only provide details if asked." },
      facts: [
        fact(`${slug}_opening`, "PC", "opening_statement", "Opening Statement", "I've been vomiting and I've got abdominal pain.", ["opening", "what brought you in"]),
        fact("dka_key_details", "OTHER", "key_details", "Key details", "I am 24 years old, I am in A&E, and I work in retail.", ["age", "A&E", "retail", "work"]),
        fact("dka_vomiting_duration", "HPC", "vomiting_duration", "Vomiting duration", "The vomiting started around 3 days ago.", ["vomiting", "duration", "started"]),
        fact("dka_vomiting_worse", "HPC", "vomiting_worse", "Vomiting progression", "I've been unwell for the past 3 days, but it's become worse today. I am unable to keep anything down.", ["worse", "progression", "keep anything down"]),
        fact("dka_vomiting_triggers", "HPC", "vomiting_triggers", "Vomiting triggers", "Nothing seems to make it better or worse. It is not related to eating or position and has no timing pattern.", ["eating", "position", "pattern", "triggers"]),
        fact("dka_vomit_content", "HPC", "vomit_content", "Vomit content", "It is now just liquid because that is the only thing I have been able to keep down, but initially it contained food.", ["vomit", "liquid", "food"]),
        fact("dka_no_hematemesis", "HPC", "blood_in_vomit", "Blood in vomit", "There is no blood in the vomit.", ["blood", "vomit"]),
        fact("dka_antiemetic", "DH", "anti_sickness_tablet", "Anti-sickness tablet", "I took some kind of anti-sickness tablet yesterday that my mum gave me, but it does not seem to have helped.", ["anti-sickness", "tablet", "mum"]),
        fact("dka_abdominal_pain_duration", "HPC", "abdominal_pain_duration", "Abdominal pain duration", "The abdominal pain has been present for around 2 days and started after the vomiting episodes.", ["abdominal pain", "duration"]),
        fact("dka_abdominal_pain_site", "HPC", "abdominal_pain_site", "Abdominal pain site", "I can't pinpoint an area where the pain is; it's just everywhere.", ["site", "where", "everywhere"]),
        fact("dka_abdominal_pain_triggers", "HPC", "abdominal_pain_triggers", "Abdominal pain triggers", "It is not related to eating or drinking, and it is not related to any particular movement.", ["eating", "drinking", "movement"]),
        fact("dka_abdominal_pain_course", "HPC", "abdominal_pain_course", "Abdominal pain course", "The pain has always been there since it started 2 days ago and seems to be getting worse.", ["course", "changed", "worse"]),
        fact("dka_no_distension", "HPC", "abdominal_distension", "Abdominal distension", "I've not noticed my stomach is swollen at all.", ["distension", "swollen"]),
        fact("dka_diarrhoea", "HPC", "diarrhoea", "Diarrhoea", "I've had really bad diarrhoea since yesterday. I've been to the toilet 7-8 times.", ["diarrhoea", "toilet"]),
        fact("dka_no_pr_bleeding", "HPC", "pr_bleeding", "PR bleeding", "There is no PR bleeding.", ["PR bleeding", "rectal bleeding"]),
        fact("dka_appetite", "HPC", "appetite", "Appetite", "I have lost my appetite.", ["appetite"]),
        fact("dka_thirst", "HPC", "thirst_fluids", "Thirst and fluids", "I'm really thirsty but I keep vomiting every time I drink.", ["thirst", "fluids", "drink"]),
        fact("dka_paracetamol", "HPC", "pain_relief", "Pain relief", "I tried paracetamol for the pain, but it did not help.", ["paracetamol", "pain relief"]),
        fact("dka_severity", "HPC", "severity", "Severity", "The pain is 8 out of 10.", ["severity", "score"]),
        fact("dka_urine", "RED_FLAG", "urine_output", "Urine output", "I am only passing small amounts of urine.", ["urine", "wee", "passing"]),
        fact("dka_fatigue", "HPC", "weak_fatigued", "Weakness and fatigue", "I can't even sit up and watch TV. I feel so exhausted.", ["weak", "fatigue", "exhausted"]),
        fact("dka_chest_infection", "HPC", "chest_infection", "Chest infection", "My chest infection has been getting better with antibiotics, but these new symptoms seem to have taken hold and I am feeling much worse.", ["chest infection", "cough", "shortness of breath", "antibiotics"]),
        fact("dka_no_rash_contacts", "HPC", "rashes_sick_contacts", "Rashes and sick contacts", "I have no rashes and no sick contacts.", ["rash", "sick contacts"]),
        fact("dka_ideas", "ICE", "ideas", "Ideas", "I think I could have had a dodgy takeaway a few nights ago. My partner is a vegetarian but I ate chicken, so it makes sense that he's ok.", ["ideas", "takeaway", "chicken"]),
        fact("dka_concerns", "ICE", "concerns", "Concerns", "I'm worried that I can't even keep water down. When I was first diagnosed with diabetes they said that when I'm unwell I should be doing something different with my insulin, but I can't remember what exactly.", ["concerns", "water", "diabetes", "insulin"]),
        fact("dka_expectations", "ICE", "expectations", "Expectations", "I just want something to make me feel better and to get home.", ["expectations", "home"]),
        fact("dka_t1dm", "PMH", "type_1_diabetes", "Type 1 diabetes mellitus", "I have type 1 diabetes mellitus, diagnosed at 17, and it is usually well controlled.", ["diabetes", "T1DM", "diagnosed"]),
        fact("dka_asthma_surgery", "PMH", "asthma_surgery", "Asthma and surgery", "I had childhood asthma but have not been unwell with this since age 10. I have no past surgical history.", ["asthma", "surgery"]),
        fact("dka_levemir", "DH", "levemir", "Levemir", "I take Levemir injection twice daily, but I have missed a few doses over the last week while unwell with the chest infection.", ["Levemir", "insulin", "missed doses"]),
        fact("dka_humalog", "DH", "humalog", "Humalog", "I inject Humalog before meals, usually 3-4 times a day, but I have not been eating much so I have missed quite a few doses over the last week.", ["Humalog", "insulin", "meals"]),
        fact("dka_other_meds", "DH", "other_medications", "Other medications", "I have a blue salbutamol inhaler but have not used it in years. I take the oral contraceptive pill, POP, and always remember to take it. I take no over-the-counter medications.", ["salbutamol", "POP", "contraceptive", "OTC"]),
        fact("dka_nkda", "DH", "allergies", "Allergies", "No known drug allergies.", ["allergy", "NKDA"]),
        fact("dka_family_history", "FH", "family_history", "Family history", "Nil of note.", ["family history"]),
        fact("dka_social_living_work", "SH", "living_work", "Living and work", "I live with my boyfriend in a new build property. I work in retail and have been doing a lot of hours because a manager position is about to come up.", ["living", "boyfriend", "retail", "work"]),
        fact("dka_social_smoking_alcohol_drugs", "SH", "smoking_alcohol_drugs", "Smoking, alcohol and recreational drugs", "I am a non-smoker. I drink a bottle of wine a week, usually on a Saturday night with my boyfriend at home. I do not use recreational drugs.", ["smoking", "alcohol", "wine", "drugs"]),
        fact("dka_social_diet_exercise", "SH", "diet_exercise", "Diet and exercise", "I generally have a healthy diet, have a takeaway once a week, and go to the gym occasionally.", ["diet", "takeaway", "gym", "exercise"]),
        fact("dka_sexual_history", "SH", "sexual_history", "Sexual history", "I am sexually active with my boyfriend, have never had an STI, have no PV discharge, and take POP regularly with no periods on this, but I might have forgotten it whilst unwell with the chest infection.", ["sex", "STI", "PV discharge", "POP", "periods"]),
      ],
      emotionalCues: [],
      patientQuestions: [],
      expectedPatientAttitude: "",
      unknownFactPolicy: "If a fact is not supplied in the station script, do not invent details.",
      sourceReferences: [sourceReference],
      status: "published",
      version: 1,
    },
    checklist: {
      title: "DKA Abdominal Pain History Checklist",
      slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: checklistRows.length, description: "39 one-mark checklist rows from the provided station" },
      weightConfiguration: { critical: 3, major: 2, minor: 1 },
      sections: [
        {
          sectionId: "station_checklist",
          title: "Station checklist",
          items: checklistRows.map((label, index) => row(`dka_abdo_${index + 1}`, label, index)),
        },
      ],
      version: 1,
      status: "published",
    },
  };
}

const checklistRows = [
  "Washes hands and dons PPE if appropriate",
  "Introduces themselves to the patient including name and role",
  "Confirms the patient's name and date of birth",
  "Explains that they'd like to take a history from the patient",
  "Gains consent to proceed with history taking",
  "Uses open questioning to explore the patient's presenting complaint",
  "Asks about vomiting - onset, duration, severity",
  "Enquires about blood in vomit",
  "Site: asks where the abdominal pain is",
  "Onset: clarifies when the abdominal pain first started and if it came on suddenly or gradually",
  "Character: asks the patient to describe how the abdominal pain feels",
  "Radiation: asks if the abdominal pain moves anywhere else",
  "Associated symptoms: asks if there are any other associated symptoms (diarrhoea, weight loss, rashes, fatigue, abdominal distension)",
  "Time course: asks how the abdominal pain has changed over time",
  "Exacerbating or relieving factors: asks if anything makes the abdominal pain worse or better",
  "Severity: asks how severe the abdominal pain is on a scale of 0-10",
  "Asks about diet over the last week and identifies minimal eating",
  "Asks about preceding chest infection",
  "Explores the patient's ideas, concerns and expectations",
  "Summarises the patient's presenting complaint",
  "Screens for relevant symptoms in other body systems",
  "Asks if the patient has any medical conditions - identifies T1DM",
  "Asks if the patient has had any relevant surgical procedures",
  "Asks if the patient is currently taking any prescribed medications or over-the-counter remedies",
  "Clarifies if patient has been taking insulin as prescribed",
  "Asks if the patient has any drug allergies and if so, clarifies what kind of reaction they had to the substance",
  "Asks if there is any other relevant family history of note",
  "Explores the patient's general social context (accommodation, who the patient lives with, how the patient manages with activities of daily living, care needs)",
  "Takes a smoking history",
  "Takes an alcohol history",
  "Asks about recreational drug use",
  "Asks about diet and exercise",
  "Asks about the patient's occupation",
  "Summarises the salient points of the history back to the patient and asks if they feel anything has been missed",
  "Thanks the patient for their time",
  "Disposes of PPE appropriately and washes their hands",
  "Active listening",
  "Summarising",
  "Signposting",
];

function fact(factId, section, conceptId, label, value, synonyms) {
  return {
    factId,
    section,
    conceptId,
    label,
    value,
    naturalResponse: value,
    revealPolicy: factId.endsWith("_opening") ? "OPENING" : "IF_RELEVANT_QUESTION",
    triggerConcepts: [conceptId],
    synonyms,
    relatedChecklistItemIds: [],
  };
}

function row(itemId, label, index) {
  const lower = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return {
    itemId,
    label,
    description: label,
    category: "history",
    expectedConcepts: [lower || itemId],
    relatedFactIds: [],
    weightCategory: index === 19 || index === 24 ? "critical" : "major",
    maxRawScore: 1,
    allowPartial: true,
    criticalSafetyItem: index === 19 || index === 24,
    commonMistake: "",
    remediationText: label,
    order: index + 1,
  };
}
