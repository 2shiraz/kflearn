import { HistoryModule } from "../models/HistoryModule.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const sourceReference = "User-provided Haematemesis 01 station";
const slug = "haematemesis-upper-gi-bleed-history";

export async function seedGastroenterologyHistoryStations({ universalGuide }) {
  const gastroenterology = await Specialty.findOneAndUpdate(
    { slug: "gastroenterology" },
    {
      $set: {
        name: "Gastroenterology",
        slug: "gastroenterology",
        description: "Gastrointestinal history-taking modules.",
        icon: "stethoscope",
        order: 4,
        active: true,
      },
    },
    { upsert: true, new: true },
  );

  const station = haematemesisStation();
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
        specialtyId: gastroenterology._id,
        historyGuideId: universalGuide._id,
        patientScriptId: patientScript._id,
        smartChecklistId: checklist._id,
      },
    },
    { upsert: true, new: true },
  );

  return [module];
}

function haematemesisStation() {
  return {
    module: {
      title: "Haematemesis History",
      slug,
      presentingComplaint: "Haematemesis",
      systemOrTopic: "Upper GI bleed",
      stationType: "history",
      taskTags: ["history", "gastroenterology", "haematemesis", "upper-gi-bleed"],
      difficulty: "advanced",
      timeLimitSeconds: 360,
      shortDescription: "50-year-old woman in the emergency department with haematemesis.",
      candidateInstructions: {
        context: "You are working in the emergency department.",
        patientSummary: "A 50-year-old woman has presented with haematemesis.",
        tasks: ["Please take a history."],
        examinationRequired: false,
        additionalInstructions: [],
      },
      examinerInstructions: "",
      keyAnswerGuide: "Diagnosis: Upper GI bleed.\nFurther assessments: vital signs all within normal range (NEWS = 0); abdominal examination with no peripheral stigmata of chronic liver disease, mild epigastric tenderness on deep palpation, no rebound tenderness or guarding.\nInvestigations: FBC for anaemia, U&Es for raised urea, LFTs, clotting, group and save/crossmatch; consider endoscopy.\nDifferentials: variceal bleed most likely, Mallory-Weiss tear, alcohol-related gastritis.",
      suggestedCandidateApproach: [],
      learningNotes: "",
      commonMistakes: [],
      keyDifferentials: ["Variceal bleed", "Mallory-Weiss tear", "Alcohol-related gastritis"],
      vivaQuestions: [
        {
          question: "What further clinical examinations/assessments would you like to perform?",
          modelAnswerOutline: "Vital signs all within normal range (NEWS = 0). Abdominal examination: no peripheral stigmata of chronic liver disease, mild epigastric tenderness on deep palpation, no rebound tenderness or guarding.",
        },
        {
          question: "Describe some appropriate further investigations.",
          modelAnswerOutline: "Bloods: FBC for anaemia, U&Es for raised urea, LFT for alcohol-related derangement, clotting for coagulopathy, group and save/crossmatch. Consider endoscopy.",
        },
        {
          question: "What is your differential diagnosis?",
          modelAnswerOutline: "Variceal bleed most likely, Mallory-Weiss tear, alcohol-related gastritis.",
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
      name: "50-year-old woman - Haematemesis",
      slug: `${slug}-patient`,
      patientIdentity: { name: "", age: 50, sex: "woman", occupation: "unemployed", pronouns: "" },
      baselineState: {},
      openingStatement: "I vomited a lot of blood this morning, and it really frightened me.",
      demeanor: { general: "", verbosity: "Only provide details if asked." },
      facts: [
        fact(`${slug}_opening`, "PC", "opening_statement", "Opening Statement", "I vomited a lot of blood this morning, and it really frightened me.", ["opening", "haematemesis", "vomited blood"]),
        fact("haem_key_details", "OTHER", "key_details", "Key details", "I am 50 years old, I am in the emergency department, and I am unemployed.", ["age", "emergency department", "occupation", "unemployed"]),
        fact("haem_onset", "HPC", "onset", "Onset", "It started suddenly this morning. I felt sick, then vomited blood.", ["onset", "started", "sudden", "this morning"]),
        fact("haem_character", "HPC", "character", "Character", "It was bright red blood, and there were darker clots in it as well. It was not just a few streaks. I had not been vomiting for hours before it happened.", ["character", "bright red", "clots", "streaks"]),
        fact("haem_dizziness", "RED_FLAG", "dizziness_weakness", "Dizziness and weakness", "I feel really weak and light-headed. I am worried I will pass out if I try to stand.", ["dizzy", "weak", "light-headed", "pass out", "stand"]),
        fact("haem_melaena", "HPC", "melaena", "Melaena", "My stools have been black and sticky for the last couple of days.", ["melaena", "black stool", "sticky stool"]),
        fact("haem_distension", "HPC", "abdominal_distension", "Abdominal distension", "My tummy has been getting more swollen over the last few months.", ["distension", "swollen tummy", "ascites"]),
        fact("haem_ankle_swelling", "HPC", "ankle_swelling", "Ankle swelling", "My ankles have been swollen for a while, especially by the end of the day.", ["ankle swelling", "swollen ankles"]),
        fact("haem_bruising", "HPC", "easy_bruising", "Easy bruising", "I have noticed I bruise more easily than I used to.", ["bruising", "bruise"]),
        fact("haem_timing", "HPC", "timing", "Timing", "I vomited blood twice this morning. I still feel sick, but I have not vomited again since getting here.", ["timing", "twice", "nausea"]),
        fact("haem_exacerbating_relieving", "HPC", "exacerbating_relieving", "Exacerbating and relieving factors", "I cannot think what set it off. Resting has not really helped how weak I feel.", ["trigger", "rest", "relief"]),
        fact("haem_severity", "HPC", "severity", "Severity", "There was a lot of blood, much more than just streaks. It filled part of the toilet bowl. I feel faint when I stand up.", ["severity", "large volume", "toilet bowl", "faint"]),
        fact("haem_previous", "HPC", "previous_episodes", "Previous episodes", "No, I have never vomited blood before.", ["previous", "before"]),
        fact("haem_other_negatives", "HPC", "other_symptoms", "Other symptoms", "No severe abdominal pain, chest pain or abdominal trauma. No fresh rectal bleeding. No epistaxis or bleeding from the mouth before vomiting. No fever, rigors, diarrhoea, unwell contacts or recent foreign travel. No confusion or reduced consciousness.", ["abdominal pain", "chest pain", "trauma", "rectal bleeding", "epistaxis", "fever", "travel", "confusion"]),
        fact("haem_meds_negatives", "DH", "nsaid_anticoagulant_antiplatelet", "NSAIDs, anticoagulants and antiplatelets", "No recent NSAID use, anticoagulants or antiplatelets.", ["NSAID", "ibuprofen", "aspirin", "anticoagulant", "antiplatelet"]),
        fact("haem_ideas", "ICE", "ideas", "Ideas", "I think this might be related to my liver. I was told it was damaged before.", ["ideas", "liver"]),
        fact("haem_concerns", "ICE", "concerns", "Concerns", "I am scared I am bleeding inside and that I might die.", ["concerns", "bleeding inside", "die"]),
        fact("haem_expectations", "ICE", "expectations", "Expectations", "I just want you to stop the bleeding and tell me what is going on.", ["expectations", "stop bleeding"]),
        fact("haem_cirrhosis", "PMH", "alcohol_related_cirrhosis", "Alcohol-related cirrhosis", "I was told last year that my liver was scarred from drinking. I know I should have taken it more seriously.", ["cirrhosis", "liver", "scarred", "drinking"]),
        fact("haem_varices", "PMH", "oesophageal_varices", "Oesophageal varices", "They found swollen veins in my food pipe on a camera test a few months ago. I was meant to go back, but I missed the appointment.", ["varices", "food pipe", "camera test", "appointment"]),
        fact("haem_mental_health", "PMH", "depression_anxiety", "Depression and anxiety", "I struggle with my mood and feeling anxious. I saw the GP recently and they increased my antidepressant.", ["depression", "anxiety", "mood", "antidepressant"]),
        fact("haem_surgery", "PMH", "surgery", "Surgery", "No, I have never had any operations on my tummy, or anywhere else.", ["surgery", "operations"]),
        fact("haem_sertraline", "DH", "sertraline", "Sertraline", "I take sertraline 100 mg by mouth daily. It was recently increased from 50 mg.", ["sertraline", "antidepressant"]),
        fact("haem_propranolol", "DH", "propranolol", "Propranolol", "I was given propranolol for the swollen veins, but I do not always remember to take it.", ["propranolol", "adherence", "swollen veins"]),
        fact("haem_lactulose", "DH", "lactulose", "Lactulose", "I was given lactulose, but I do not really take it because it gives me diarrhoea.", ["lactulose", "diarrhoea"]),
        fact("haem_otc_nsaid", "DH", "otc_nsaid", "Over-the-counter NSAIDs", "I do not take ibuprofen or aspirin.", ["OTC", "ibuprofen", "aspirin"]),
        fact("haem_penicillin", "DH", "penicillin_intolerance", "Penicillin intolerance", "Penicillin gave me really bad diarrhoea last time I took it.", ["penicillin", "allergy", "intolerance"]),
        fact("haem_family", "FH", "family_history", "Family history", "My parents are both frail and in their 80s, but I do not think anything runs in the family.", ["family history", "parents"]),
        fact("haem_living_support", "SH", "living_support", "Living and support", "I live on my own in a rented flat. I do not really have many people nearby. I have pushed people away a bit because of the drinking.", ["living", "alone", "support", "rented flat"]),
        fact("haem_unemployed", "SH", "employment", "Employment", "I lost my job during lockdown and I have struggled to find one since then.", ["employment", "job", "lockdown"]),
        fact("haem_alcohol", "SH", "alcohol", "Alcohol", "I drink most days now, usually strong cider or wine, whatever I can afford. I know it is damaging my liver, but stopping has been really hard. I am drinking about 2 litres of vodka a week.", ["alcohol", "cider", "wine", "vodka", "drinking"]),
        fact("haem_smoking", "SH", "smoking", "Smoking", "I have a 40 pack-year smoking history.", ["smoking", "pack-year"]),
        fact("haem_drugs", "SH", "recreational_drugs", "Recreational drug use", "No, I do not take recreational drugs.", ["drugs", "recreational"]),
        fact("haem_diet_exercise", "SH", "diet_exercise", "Diet and exercise", "I eat ready meals and tinned food. I do not leave the house apart from when I am buying more vodka, so I do not exercise.", ["diet", "exercise", "ready meals", "tinned food"]),
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
      title: "Haematemesis History Checklist",
      slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: checklistRows.length, description: "32 one-mark checklist rows from the provided station" },
      weightConfiguration: { critical: 3, major: 2, minor: 1 },
      sections: [{ sectionId: "station_checklist", title: "Station checklist", items: checklistRows.map((label, index) => row(`haem_${index + 1}`, label, index)) }],
      version: 1,
      status: "published",
    },
  };
}

const checklistRows = [
  "Washes hands and dons PPE if appropriate",
  "Introduces themselves to the patient including name and role",
  "Confirms the patient's name and date of birth",
  "Explains that they would like to take a history from the patient",
  "Gains consent to proceed with taking a history",
  "Uses open questioning to explore the patient's presenting complaint",
  "Onset: clarifies when the vomiting and haematemesis started",
  "Time course: establishes timeline of vomiting and haematemesis",
  "Character: asks the patient to describe the character and volume of haematemesis",
  "Associated symptoms: ask if there are any other associated symptoms (abdominal pain, melaena, syncope)",
  "Identifies alcohol binge as potential trigger",
  "Screens for other key gastrointestinal symptoms (e.g. weight loss, nausea, jaundice, fatigue)",
  "Explores the patient's ideas, concerns and expectations",
  "Summarises the patient's presenting complaint",
  "Screens for relevant symptoms in other body systems",
  "Screens for conditions that increase the risk of gastrointestinal disease",
  "Asks about pre-existing gastrointestinal disease",
  "Asks about other medical diagnoses, previous surgical history and procedures",
  "Asks if the patient is currently taking any prescribed medications or over-the-counter remedies",
  "Asks if the patient has any allergies and if so, clarify what kind of reaction they had to the substance",
  "Asks if there is any family history of gastrointestinal disease",
  "Explores the patient's general social context",
  "Takes a smoking history",
  "Takes an alcohol history",
  "Asks about recreational drug use",
  "Gathers details about the patient's occupation",
  "Summarises the salient points of the history back to the patient and ask if they feel anything has been missed",
  "Thanks the patient for their time",
  "Disposes of PPE appropriately and washes hands",
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
  const conceptId = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || itemId;
  return {
    itemId,
    label,
    description: label,
    category: "history",
    expectedConcepts: [conceptId],
    relatedFactIds: [],
    weightCategory: index === 9 || index === 15 ? "critical" : "major",
    maxRawScore: 1,
    allowPartial: true,
    criticalSafetyItem: index === 9 || index === 15,
    commonMistake: "",
    remediationText: label,
    order: index + 1,
  };
}
