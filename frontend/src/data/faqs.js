// Shared FAQ content for the landing page and the How It Works page.
// Every answer must match what the code actually does. Update here, not in the components.

export const faqs = [
  {
    q: "Is KF LearnSmart an official examination platform?",
    a: "No. KF LearnSmart is a formative self-assessment and preparation tool. It does not replace formal OSCE examinations or institutional assessment, and AI feedback is not a clinical result or certification.",
  },
  {
    q: "What content is included?",
    a: "8 interactive OSCE stations across Respiratory, Gynaecology, Gastroenterology and Endocrinology, with weighted checklists. Also 9 history-taking topics, 12 clinical examination guides, 47 OSCE handouts, and 170 MCQs across five banks. The station bank grows as new stations are approved and published.",
  },
  {
    q: "How is AI used?",
    a: "AI plays the patient in virtual sessions, transcribes spoken answers, and marks your checklist from your own words with evidence for each item. The app calculates the score itself. See How It Works & AI for the full breakdown.",
  },
  {
    q: "Does AI decide my final score?",
    a: "The AI assigns a raw score to each checklist item based on your transcript. The percentage is then calculated by the app from the item weights (critical, major, minor), so the arithmetic is not left to the model.",
  },
  {
    q: "What if the AI fails during a session?",
    a: "In a virtual patient session, the app falls back to replies drawn from the patient script so the session keeps going. If AI marking fails, no assessment is saved and the credits used for it are refunded automatically.",
  },
  {
    q: "Is there a free version?",
    a: "Yes. Sample stations, guided self-practice, the guides, handouts and MCQs are free once you sign in. The AI virtual patient and AI marking use credits, and the current costs are shown on the Credits page.",
  },
  {
    q: "Can I practise without a microphone?",
    a: "Yes. Every station accepts typed answers. A microphone is only needed if you choose voice input, and you can review the transcript before it is submitted.",
  },
  {
    q: "Do I need a good internet connection?",
    a: "The guides, handouts and MCQs are mostly text, so they are light to load. The AI sessions and marking need a connection to the server while you practise.",
  },
  {
    q: "What happens to my answers?",
    a: "Your typed or transcribed answers are saved with your attempt so you can review your results. They are sent to the AI provider to be processed. Read How It Works & AI for the details.",
  },
];
