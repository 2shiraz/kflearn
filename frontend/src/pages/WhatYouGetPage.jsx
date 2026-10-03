import { Link } from "react-router-dom";
import {
  ArrowRight, BookOpen, CheckCircle2, ClipboardList, Coins, FileQuestion, FileText, Lock,
  MessageSquareText, Sparkles, Stethoscope, UserPlus, Clock,
} from "lucide-react";
import PageShell from "../components/PageShell";
import { ConsultationScene } from "../components/Illustrations";

const signupSteps = [
  {
    n: "01", icon: UserPlus, title: "Create your account",
    body: "Enter your full name, email and a password of at least 8 characters with a letter and a number. Your account is ready straight away.",
  },
  {
    n: "02", icon: ClipboardList, title: "Choose your role",
    body: "Pick the option that fits you: MBBS Student, FCPS Candidate, MCPS Candidate, Postgraduate Resident, or Other Medical Learner.",
  },
  {
    n: "03", icon: Sparkles, title: "Add your details",
    body: "Optionally add your institution, programme, year, target examination and expected exam date. You can change these any time in Settings.",
  },
];

const modules = [
  {
    icon: MessageSquareText,
    title: "OSCE Stations",
    access: "Free to practise · AI uses credits",
    tint: "#FF8FCF",
    headline: "8 interactive stations with weighted checklists",
    points: [
      "Respiratory, Gynaecology, Gastroenterology and Endocrinology stations",
      "Patient scenario, candidate brief and a timed station",
      "Guided self-practice: work through the checklist and mark yourself, free",
      "AI virtual patient: interview a patient who answers in character",
      "AI checklist marking with evidence for each item, plus viva questions with model-answer outlines",
    ],
    cta: { to: "/stations", label: "Browse stations" },
  },
  {
    icon: Stethoscope,
    title: "Clinical Examination Guide",
    access: "Free with an account",
    tint: "#7FB8FF",
    headline: "12 examination stations, step by step",
    points: [
      "The order of examination, from introduction to the final findings",
      "Mnemonics and technique notes for each station",
      "Normal and abnormal findings, and what each one suggests",
      "Covers core examination, musculoskeletal, neurological and advanced stations",
    ],
    cta: { to: "/clinical-examination", label: "Open the guide" },
  },
  {
    icon: BookOpen,
    title: "History Taking Guide",
    access: "Free with an account",
    tint: "#C6A6FF",
    headline: "9 history-taking topics organised by presenting complaint",
    points: [
      "Question sets to ask in the order a consultation flows",
      "Mnemonics that help you remember the key points",
      "Differentials to consider for each presenting complaint",
    ],
    cta: { to: "/history-taking", label: "Open the guide" },
  },
  {
    icon: FileQuestion,
    title: "MCQ Bank",
    access: "Free with an account",
    tint: "#7FE3C4",
    headline: "170 single-best-answer questions in five banks",
    points: [
      "Organised by MBBS year, module and topic",
      "Read mode shows answers and explanations for a whole topic",
      "Practise mode lets you answer first and check yourself",
      "Your progress is saved in this browser, so it stays on this device",
    ],
    cta: { to: "/mcqs", label: "Start practising MCQs" },
  },
  {
    icon: FileText,
    title: "OSCE Handouts",
    access: "Free with an account",
    tint: "#FFD84D",
    headline: "47 consolidated station handouts",
    points: [
      "Each handout follows the same pattern: introduction, core concepts, clinical features, diagnosis, management and key takeaways",
      "Organised by system for quick revision before an exam",
      "Written for the Pakistani context, with local protocol notes where practice differs",
    ],
    cta: { to: "/handout-notes", label: "Read handouts" },
  },
  {
    icon: Clock,
    title: "Attempt History",
    access: "Free with an account",
    tint: "#FF8FCF",
    headline: "Every station attempt, saved to your account",
    points: [
      "Review past attempts, scores and the feedback you received",
      "Return to a virtual patient session you started but have not finished",
    ],
    cta: { to: "/stations/attempts", label: "View my attempts" },
  },
];

const credits = [
  "New accounts start with 0 credits. Credits are bought in packages from the Credits page.",
  "A virtual patient session costs a fixed number of credits, and so does an AI marking run. The current costs are shown in the app before you spend anything.",
  "If an AI step fails, the credits for that step are refunded automatically.",
  "Guides, handouts, MCQs, sample stations and guided self-practice never use credits.",
];

const firstSession = [
  "Open the Stations page and choose a Respiratory station to start with.",
  "Read the patient scenario and candidate brief, then start guided self-practice to see the expected checklist.",
  "Try the AI virtual patient when you are ready. Ask one question at a time and review the transcript before it is marked.",
  "Read your feedback: what you covered, what you missed, and the viva questions to practise next.",
];

const notIncluded = [
  "Official examination certificates or any result that counts towards a formal assessment",
  "Guaranteed exam results. Practice shows where you stand, not what you will score on the day",
  "A dedicated Progress page. The page is planned but not yet built, so use Attempt History for now",
  "Peer practice partners. This is not available in the current release",
];

export default function WhatYouGetPage() {
  return (
    <PageShell>
      <section className="app-gradient-bg py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:px-10">
          <div>
            <span className="gradient-pill inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-ink">
              <Sparkles size={13} /> What you get when you join
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-ink">
              One account. Every station, guide, question and handout you need for OSCE prep.
            </h1>
            <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
              Sign up in under a minute to unlock the full study library. Practise stations
              alone for free, and add an AI virtual patient when you want realistic feedback. Here
              is exactly what is inside.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="gradient-brand flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
                Create a free account <ArrowRight size={16} />
              </Link>
              <Link to="/sample-stations" className="glass-surface rounded-lg px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand">
                See sample stations first
              </Link>
            </div>
          </div>
          <ConsultationScene className="mx-auto w-full max-w-md drop-shadow-xl" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">Sign up in three steps</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Only your name, email and password are required. Everything else can wait.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {signupSteps.map((s) => (
            <div key={s.n} className="glass-surface rounded-lg p-6">
              <p className="font-mono text-xs text-ink-soft">{s.n}</p>
              <span className="gradient-icon mt-3 flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                <s.icon size={18} />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">What is inside your account</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Every module, what it contains, and whether it is free or uses credits.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {modules.map((m) => (
            <div key={m.title} className="glass-surface flex flex-col rounded-lg p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                  <m.icon size={18} />
                </span>
                <span className="rounded-lg bg-black/5 px-2.5 py-1 text-xs font-semibold text-ink-soft">{m.access}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{m.title}</h3>
              <p className="mt-1 text-sm font-semibold text-brand">{m.headline}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {m.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-good" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link to={m.cta.to} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                {m.cta.label} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-2 lg:px-10">
        <div className="gradient-card rounded-lg p-8" style={{ "--g1": "#FFD84D", "--g2": "#7FB8FF", "--glow": "rgba(255,216,77,0.3)" }}>
          <div className="flex items-start gap-3">
            <Coins size={22} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">How credits work</h2>
              <ul className="mt-4 space-y-3">
                {credits.map((c) => (
                  <li key={c} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-good" />
                    {c}
                  </li>
                ))}
              </ul>
              <Link to="/credits" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                See credit packages <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="glass-surface rounded-lg p-8">
          <div className="flex items-start gap-3">
            <Lock size={22} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">What is not included</h2>
              <ul className="mt-4 space-y-3">
                {notIncluded.map((c) => (
                  <li key={c} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-lg bg-ink-soft" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">Your first session, step by step</h2>
        <ol className="mt-10 space-y-4">
          {firstSession.map((step, i) => (
            <li key={step} className="glass-surface flex gap-4 rounded-lg p-5">
              <span className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="pt-1.5 text-sm leading-relaxed text-ink-soft">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 text-center lg:px-10">
        <h2 className="font-display text-3xl font-extrabold text-ink">Ready to start?</h2>
        <p className="mt-3 text-ink-soft">
          Create a free account, open a station, and try the guided self-practice. You can decide
          on AI credits later.
        </p>
        <Link to="/signup" className="gradient-brand mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white">
          Create my free account <ArrowRight size={16} />
        </Link>
        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          KF LearnSmart is a formative self-assessment tool. It is not an official examination
          platform, and AI feedback is not a clinical result or certification.
        </p>
      </section>
    </PageShell>
  );
}
