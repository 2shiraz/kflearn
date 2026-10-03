import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Character, HealthIcon } from "../site/Illustrations";
import PageShell from "../components/PageShell";
import { ROLE_OPTIONS } from "../lib/api";
import {
  EXAM_GUIDE_COUNT,
  HANDOUT_COUNT,
  HISTORY_TOPIC_COUNT,
  MCQ_COUNT,
  OSPE_COUNT,
  SIGNUP_LABEL,
  plus,
} from "../site/siteContent";

const stats = [
  { value: plus(MCQ_COUNT), label: "MCQs" },
  { value: plus(OSPE_COUNT), label: "OSPE stations" },
  { value: plus(EXAM_GUIDE_COUNT), label: "Examination guides" },
  { value: plus(HISTORY_TOPIC_COUNT), label: "History-taking guides" },
  { value: plus(HANDOUT_COUNT), label: "Handout notes" },
];

const problems = [
  {
    icon: "patient",
    tone: "bg-sun-soft text-sun",
    title: "OSCE practice needs a patient and an examiner",
    body: "Rehearsing an OSCE station usually means finding a partner to play the patient and someone to mark you. The AI virtual patient and checklist let you practise alone, at any hour.",
  },
  {
    icon: "medicalRecords",
    tone: "bg-coral-soft text-coral",
    title: "Feedback is hard to come by",
    body: "Informal practice rarely tells you what you missed. Each station is marked against its own checklist, so you see exactly which items you covered.",
  },
  {
    icon: "book",
    tone: "bg-sky-soft text-sky",
    title: "Revision material is scattered",
    body: "MCQs, OSPE stations, examination technique and condition notes usually live in different places. Here they sit together, organised by year, module and topic.",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pt-36">
        <div>
          <h1 className="site-rise text-4xl font-semibold leading-tight text-s-ink md:text-5xl">A study partner for clinical exams</h1>
          <p className="site-rise mt-5 max-w-xl text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "80ms" }}>
            KF LearnSmart helps medical students in Pakistan prepare for OSCE, OSPE and written exams, with an AI patient for practising OSCE stations.
          </p>
          <div className="site-rise mt-8" style={{ "--rise-delay": "140ms" }}>
            <p className="text-sm font-semibold text-s-ink">Built for</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ROLE_OPTIONS.filter((r) => r !== "Other Medical Learner").map((r) => (
                <li key={r} className="rounded-full border border-s-line bg-s-card px-3.5 py-1.5 text-sm text-s-mute">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <AboutIllustration />
      </section>

      <section className="border-y border-s-line bg-s-card">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-12 sm:px-6 md:grid-cols-5 lg:px-8">
          {stats.map((s, i) => (
            <div key={s.label} data-reveal style={{ "--reveal-delay": `${i * 50}ms` }} className="md:border-l md:border-s-line md:pl-6 md:first:border-l-0 md:first:pl-0">
              <dt className="text-sm text-s-mute">{s.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-s-ink">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 data-reveal className="max-w-2xl text-3xl font-semibold leading-tight text-s-ink md:text-4xl">Why it exists</h2>
        <div className="mt-10 space-y-4">
          {problems.map((p) => (
            <div key={p.title} data-reveal className="site-grid grid gap-4 rounded-3xl border border-s-line p-6 md:grid-cols-[3.5rem_1fr_1.4fr] md:items-center md:gap-8 md:p-8">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${p.tone}`}>
                <HealthIcon name={p.icon} size={30} />
              </span>
              <h3 className="text-lg font-semibold text-s-ink">{p.title}</h3>
              <p className="leading-relaxed text-s-mute">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-s-tint">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div data-reveal>
            <h2 className="text-3xl font-semibold leading-tight text-s-ink md:text-4xl">How the AI is used</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-s-mute">
              AI is used in two places, both tied to a station's own script and checklist.
            </p>
          </div>
          <ul className="space-y-6">
            <li data-reveal className="flex gap-4">
              <Character name="patient-daniel" size={48} tone="indigo" />
              <div>
                <p className="font-semibold text-s-ink">The virtual patient</p>
                <p className="mt-1 leading-relaxed text-s-mute">Answers from the station's patient script, and is instructed not to invent facts the script leaves out.</p>
              </div>
            </li>
            <li data-reveal className="flex gap-4">
              <Character name="examiner" size={48} tone="mint" />
              <div>
                <p className="font-semibold text-s-ink">The assessment</p>
                <p className="mt-1 leading-relaxed text-s-mute">Marks your transcript against the station's weighted checklist and lists the items you missed.</p>
              </div>
            </li>
            <li data-reveal className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral"><HealthIcon name="stethoscope" size={26} /></span>
              <div>
                <p className="font-semibold text-s-ink">What it is not</p>
                <p className="mt-1 leading-relaxed text-s-mute">
                  KF LearnSmart is not affiliated with any examining body. AI feedback is for practice, not a clinical result or certification.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div data-reveal className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-s-line bg-s-card p-6 md:flex-row md:items-center md:p-10">
          <p className="max-w-lg text-2xl font-semibold leading-snug text-s-ink">See the library for yourself.</p>
          <Link to="/signup" className="site-press inline-flex items-center gap-2 rounded-full bg-s-accent px-6 py-3.5 text-[15px] font-semibold text-s-on-accent hover:bg-s-accent-strong">
            {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

// Graph-paper card with the student and patient characters and a few medical symbols.
function AboutIllustration() {
  const icons = [
    { name: "heart", tone: "bg-coral-soft text-coral", pos: "left-4 top-4 sm:left-6 sm:top-6" },
    { name: "lungs", tone: "bg-sky-soft text-sky", pos: "right-4 top-6 sm:right-8 sm:top-10" },
    { name: "microscope", tone: "bg-mint-soft text-mint", pos: "left-6 bottom-4 sm:left-10 sm:bottom-8" },
    { name: "medicines", tone: "bg-violet-soft text-violet", pos: "right-4 bottom-6 sm:right-6 sm:bottom-12" },
  ];
  return (
    <div className="site-rise site-grid site-shadow relative aspect-4/3 w-full overflow-hidden rounded-3xl border border-s-line" style={{ "--rise-delay": "120ms" }} aria-hidden="true">
      {icons.map((ic, i) => (
        <span key={ic.name} className={`bob absolute flex h-11 w-11 items-center justify-center rounded-2xl sm:h-16 sm:w-16 ${ic.tone} ${ic.pos}`} style={{ animationDelay: `${i * 0.7}s` }}>
          <HealthIcon name={ic.name} size={36} className="h-6 w-6 sm:h-9 sm:w-9" />
        </span>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid origin-center scale-[0.62] grid-cols-3 items-end gap-3 sm:scale-100">
          <Character name="student-ayesha" size={92} tone="sky" />
          <Character name="patient-daniel" size={124} tone="indigo" />
          <Character name="student-bilal" size={92} tone="sun" />
        </div>
      </div>
    </div>
  );
}
