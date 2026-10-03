// Specialty colours shared by the landing page and the signed-in app.
// sky = MCQs, mint = OSPE, coral = clinical examination, sun = history taking,
// violet = handouts, indigo = OSCE stations and primary actions.
export const TONES = {
  indigo: { soft: "bg-s-accent-soft", text: "text-s-accent", ring: "hover:border-s-accent/40", solid: "bg-s-accent" },
  sky: { soft: "bg-sky-soft", text: "text-sky", ring: "hover:border-sky/40", solid: "bg-sky" },
  mint: { soft: "bg-mint-soft", text: "text-mint", ring: "hover:border-mint/40", solid: "bg-mint" },
  coral: { soft: "bg-coral-soft", text: "text-coral", ring: "hover:border-coral/40", solid: "bg-coral" },
  sun: { soft: "bg-sun-soft", text: "text-sun", ring: "hover:border-sun/40", solid: "bg-sun-bright" },
  violet: { soft: "bg-violet-soft", text: "text-violet", ring: "hover:border-violet/40", solid: "bg-violet" },
};

// Each app section's colour and Healthicons glyph (see site/healthIconData.js).
export const SECTION_LOOK = {
  history: { tone: "sun", icon: "patient" },
  "clinical-exam": { tone: "coral", icon: "heart" },
  mcqs: { tone: "sky", icon: "book" },
  ospe: { tone: "mint", icon: "microscope" },
  handouts: { tone: "violet", icon: "medicines" },
  stations: { tone: "indigo", icon: "stethoscope" },
  progress: { tone: "indigo", icon: "cardiogram" },
};

// Colour and Fluent icon for an OSCE specialty, matched on its name. Unknown
// specialties cycle through the palette so neighbours differ.
const SPECIALTY_LOOKS = [
  [/respir|pulmon|chest/i, { tone: "sky", icon: "lungs" }],
  [/cardi|heart|cvs/i, { tone: "coral", icon: "anatomical-heart" }],
  [/gastr|abdom|hepat|liver|\bgit\b/i, { tone: "mint", icon: "microbe" }],
  [/endocr|diabet/i, { tone: "sun", icon: "drop-of-blood" }],
  [/nervous|neuro|cns/i, { tone: "violet", icon: "brain" }],
  [/gyn|obstet/i, { tone: "indigo", icon: "pregnant-woman" }],
  [/infect|tropical/i, { tone: "coral", icon: "thermometer" }],
  [/ortho/i, { tone: "sun", icon: "bone" }],
  [/rheum/i, { tone: "mint", icon: "leg" }],
  [/haemat|hemat|blood/i, { tone: "coral", icon: "drop-of-blood" }],
  [/renal|nephro|urolog/i, { tone: "sky", icon: "test-tube" }],
  [/psych|mental/i, { tone: "violet", icon: "speaking-head" }],
  [/paed|pediat|child/i, { tone: "sun", icon: "person-standing" }],
  [/ent\b|ear|otolar/i, { tone: "sky", icon: "ear" }],
  [/ophthal|eye/i, { tone: "indigo", icon: "eye" }],
  [/derma|skin/i, { tone: "coral", icon: "adhesive-bandage" }],
  [/surg/i, { tone: "mint", icon: "scissors" }],
  [/oncol|cancer/i, { tone: "violet", icon: "reminder-ribbon" }],
  [/pharm|drug|prescri/i, { tone: "violet", icon: "pill" }],
];
const FALLBACK_TONES = ["indigo", "violet", "mint", "sky", "sun", "coral"];

export function specialtyLook(name = "", index = 0) {
  const match = SPECIALTY_LOOKS.find(([re]) => re.test(name));
  return match ? match[1] : { tone: FALLBACK_TONES[index % FALLBACK_TONES.length], icon: "stethoscope" };
}
