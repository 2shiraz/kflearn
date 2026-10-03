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

// Real stations from the newest OSCE sets (GIT, infectious diseases, gynae and
// obstetrics), used as public previews. Briefs are each station's own short
// description. Every station runs for 8 minutes.
export const sampleStations = [
  {
    title: "Inflammatory Bowel Disease",
    area: "Gastroenterology",
    kind: "History and differential diagnosis",
    brief: "Ms Kiran Abbasi, aged 27, presents with several weeks of bloody diarrhoea, abdominal pain and weight loss.",
  },
  {
    title: "Dengue Fever",
    area: "Infectious diseases",
    kind: "Warning signs and counselling",
    brief: "Ms Mehwish Tariq, 27, has 4 days of fever, severe myalgia, retro-orbital pain and a rash.",
  },
  {
    title: "Female Infertility: Initial Assessment",
    area: "Gynaecology and obstetrics",
    kind: "Couple-based history and investigation",
    brief: "Mrs Sara Nadeem, 31, has been trying to conceive for 18 months without success.",
  },
  {
    title: "Malaria",
    area: "Infectious diseases",
    kind: "Travel fever history and severity",
    brief: "Mr Haris Khan, 34, presents with recurrent fever, rigors, sweats and severe headache after travel to a malaria-endemic area.",
  },
  {
    title: "Coeliac Disease",
    area: "Gastroenterology",
    kind: "History, investigation and counselling",
    brief: "Ms Amna Riasat, aged 29, presents with bloating, loose stools, tiredness and unexplained low iron levels on a recent blood test.",
  },
  {
    title: "Menopause: Focused History and Counselling",
    area: "Gynaecology and obstetrics",
    kind: "History and shared decision-making",
    brief: "Mrs Nadia Farooq, 49, reports hot flushes, night sweats, vaginal dryness and sleep disturbance.",
  },
];

// Interactive hero demo. The patient lines come from the "Inflammatory Bowel
// Disease" station script (opening statement and authored facts), written in
// the first person. `area` matches the checklist row below.
export const demoPatient = {
  name: "Kiran Abbasi",
  age: 27,
  station: "Inflammatory Bowel Disease",
  setting: "8-minute history station",
  opening: "Doctor, I've had bloody diarrhoea and stomach cramps for weeks, and I've lost some weight.",
  questions: [
    { ask: "What are your stools like?", reply: "There's blood and mucus in most of them, and the cramps are low down in my tummy.", area: "Stool content and pattern" },
    { ask: "Any mouth ulcers, or pain around your back passage?", reply: "No mouth ulcers, and no pain or discharge around my back passage.", area: "Mouth and perianal symptoms" },
    { ask: "Do you smoke?", reply: "No, I don't smoke.", area: "Smoking" },
    { ask: "Any problems with your joints, eyes or skin?", reply: "My knees ache a little, but my eyes and skin are fine.", area: "Extra-intestinal features" },
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

// The full marking checklist of the "Inflammatory Bowel Disease" station:
// 10 items, each marked out of 2, for 20 points.
export const demoChecklist = [
  { label: "Stool content and pattern", detail: "Blood and mucus, continuous or patchy" },
  { label: "Pain pattern", detail: "Character and site of the abdominal pain" },
  { label: "Mouth and perianal symptoms", detail: "Asks directly about mouth ulcers and perianal pain or discharge" },
  { label: "Smoking", detail: "Smoking status and why it matters for each condition" },
  { label: "Extra-intestinal features", detail: "Joints, eyes and skin" },
  { label: "Reasoned diagnosis", detail: "The more likely diagnosis from the history, acknowledging overlap" },
  { label: "Definitive diagnosis", detail: "Explains that colonoscopy with biopsy is needed" },
  { label: "First-line tests", detail: "FBC, inflammatory markers, stool calprotectin and culture" },
  { label: "Urgent referral", detail: "Gastroenterology referral for systemic symptoms and weight loss" },
  { label: "Concerns and understanding", detail: "Addresses her worry about cancer honestly and checks understanding" },
];

export const CHECKLIST_ITEM_MARKS = 2;

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
