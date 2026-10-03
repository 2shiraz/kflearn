// Facts shown on the public pages. MCQ and OSPE figures come straight from the
// banks' metadata (small files; the question bodies stay lazy-loaded).
import { mcqTotalCount, mcqYears } from "../data/mcqs/catalog";
import { ospeTotalCount, ospeYears } from "../data/ospe";

// These three are copied from data/clinicalExaminationGuide.js (stations),
// data/historyTakingGuide.js (topics) and data/handoutNotes.js (handouts) so the
// landing page doesn't download those large files. Update them if the data changes.
export const EXAM_GUIDE_COUNT = 19;
export const HISTORY_TOPIC_COUNT = 9;
export const HANDOUT_COUNT = 47;
export const HANDOUT_SYSTEM_COUNT = 7;

export const MCQ_COUNT = mcqTotalCount;
export const OSPE_COUNT = ospeTotalCount;

export const formatCount = (n) => n.toLocaleString("en-US");

// Content keeps growing (or gets pruned), so public figures are shown as
// "at least" counts: 5,000+ rather than an exact number that goes stale.
export const plus = (n) => `${formatCount(n)}+`;

export const SIGNUP_LABEL = "Create free account";

const YEAR_LABELS = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year", 5: "Final Year" };

// Per-year coverage for the landing page: MCQ modules and OSPE blocks.
export const yearCoverage = mcqYears
  .slice()
  .sort((a, b) => a.year - b.year)
  .map((mcq) => {
    const ospe = ospeYears.find((y) => y.year === mcq.year);
    return {
      year: mcq.year,
      label: YEAR_LABELS[mcq.year] || mcq.name,
      mcqCount: mcq.count,
      mcqBlocks: mcq.blocks.map((b) => b.name),
      ospeCount: ospe?.count || 0,
      ospeBlocks: ospe ? ospe.blocks.map((b) => b.name) : [],
    };
  });

// Real stations from the OSCE bank, used as public previews. Text is taken from
// each station's candidate instructions.
export const sampleStations = [
  {
    title: "Suspected Pulmonary Embolism",
    area: "Respiratory",
    kind: "History and acute plan",
    setting: "Acute assessment unit",
    brief: "Daniel Reed, aged 54, developed sudden breathlessness and pleuritic chest pain three weeks after a knee replacement.",
  },
  {
    title: "Suspected Adult Asthma",
    area: "Respiratory",
    kind: "History and diagnostic plan",
    setting: "Respiratory outpatient clinic",
    brief: "Maya Khan, a 28-year-old primary-school teacher, reports episodic wheeze and chest tightness.",
  },
  {
    title: "Haematemesis History",
    area: "Gastroenterology",
    kind: "History",
    setting: "Emergency department",
    brief: "A 50-year-old woman has presented with haematemesis.",
  },
  {
    title: "Hemoptysis",
    area: "Respiratory",
    kind: "History and urgent investigation",
    setting: "Rapid-access respiratory clinic",
    brief: "Peter Mensah, aged 61, has coughed up blood several times this week.",
  },
  {
    title: "DKA Abdominal Pain History",
    area: "Endocrinology",
    kind: "History",
    setting: "Emergency department",
    brief: "A 24-year-old woman presents with vomiting and abdominal pain.",
  },
  {
    title: "Suspected Interstitial Lung Disease",
    area: "Respiratory",
    kind: "Occupational history",
    setting: "Respiratory clinic",
    brief: "Ahmed Saleh, aged 58, has progressive exertional breathlessness and a persistent dry cough.",
  },
];

// Interactive hero demo. The patient lines are taken from the "Suspected
// Pulmonary Embolism" station script (opening statement and facts), written
// in the first person. `area` matches the station's checklist row.
export const demoPatient = {
  name: "Daniel Reed",
  age: 54,
  station: "Suspected Pulmonary Embolism",
  setting: "Acute assessment unit",
  opening: "I suddenly became short of breath this morning, and it hurts when I breathe in.",
  questions: [
    { ask: "When did this start?", reply: "Suddenly, about two hours ago.", area: "Symptom analysis" },
    { ask: "Can you describe the pain?", reply: "It's sharp, on the right side, and worse when I take a deep breath.", area: "Symptom analysis" },
    { ask: "Any recent surgery or travel?", reply: "I had a knee replacement three weeks ago, and I haven't been moving much since.", area: "Provoking risks" },
    { ask: "Any swelling in your legs?", reply: "My left calf has been swollen and sore for two days.", area: "DVT or previous VTE" },
  ],
};

// A real question from the MBBS Fourth Year bank (Internal Medicine, cardiology).
export const sampleMcq = {
  where: "MBBS Fourth Year, Internal Medicine",
  stem: "A 58-year-old man presents with crushing central chest pain radiating to the left arm, lasting 45 minutes, with ST-segment elevation in leads II, III, and aVF on ECG. Which coronary artery is most likely occluded?",
  options: [
    "Left anterior descending artery",
    "Left circumflex artery",
    "Left main coronary artery",
    "Posterior descending artery from the left circumflex",
    "Right coronary artery",
  ],
  answer: 4,
  explanation: "ST elevation in the inferior leads (II, III, aVF) classically indicates occlusion of the right coronary artery, which typically supplies the inferior wall of the left ventricle in most individuals (right-dominant circulation).",
};

// The full marking checklist of the "Suspected Pulmonary Embolism" station,
// with its real weights (critical = 3 marks, major = 2).
export const demoChecklist = [
  { label: "Immediate safety", detail: "Distress, syncope, hypotension, hypoxaemia, ongoing pain", weight: "critical" },
  { label: "Symptom analysis", detail: "Sudden onset, dyspnoea, pleuritic pain, cough, hemoptysis", weight: "major" },
  { label: "DVT or previous VTE", detail: "Unilateral calf pain or swelling, previous DVT or PE", weight: "major" },
  { label: "Provoking risks", detail: "Surgery, trauma, immobility, travel, admission", weight: "major" },
  { label: "Additional risks", detail: "Cancer, pregnancy or postpartum, oestrogen, thrombophilia", weight: "major" },
  { label: "Differentials", detail: "ACS, pneumothorax, pneumonia, aortic pathology", weight: "major" },
  { label: "Treatment and imaging", detail: "Bleeding risk, anticoagulants, renal disease, allergy", weight: "major" },
  { label: "Plan and communication", detail: "Urgency, observations, D-dimer or imaging, escalation", weight: "critical" },
];

export const WEIGHT_MARKS = { critical: 3, major: 2, minor: 1 };

export const faqs = [
  {
    q: "Is KF LearnSmart free to use?",
    a: "Yes. A free account includes the MCQ bank, OSPE stations, every guide, handout notes and guided self-practice on OSCE stations. The AI virtual patient comes with a practice pack.",
  },
  {
    q: "How does the AI virtual patient work?",
    a: "Each OSCE station has a scripted patient. You ask questions by typing or speaking, and the patient answers from its script, only revealing what you ask about. You can have replies read aloud.",
  },
  {
    q: "How is my station marked?",
    a: "When you end a station you can request AI assessment. It checks your transcript against the station's marking checklist and gives you a score, a written summary and the items you missed. You can also mark yourself against the checklist instead.",
  },
  {
    q: "Do I need a microphone?",
    a: "No. Every station works with typed questions. Voice input is there if you prefer to speak, as you would in the exam.",
  },
  {
    q: "Which years does the question bank cover?",
    a: "MCQs cover MBBS First Year to Final Year, organised by module and topic. OSPE stations cover First to Fourth Year.",
  },
  {
    q: "Is this an official examination?",
    a: "No. KF LearnSmart is a self-practice tool. It is not affiliated with any examining body, and AI feedback is formative, not a clinical result or certification.",
  },
];
