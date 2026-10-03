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
