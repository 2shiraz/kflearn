import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HealthIcon } from "../site/Illustrations";
import PageShell from "../components/PageShell";
import { handouts } from "../data/handoutNotes";
import { stations as examStations } from "../data/clinicalExaminationGuide";
import { topics as historyTopics } from "../data/historyTakingGuide";
import { MCQ_COUNT, OSPE_COUNT, SIGNUP_LABEL, formatCount, yearCoverage } from "../site/siteContent";

const TONE = {
  indigo: "bg-s-accent-soft text-s-accent",
  sky: "bg-sky-soft text-sky",
  mint: "bg-mint-soft text-mint",
  coral: "bg-coral-soft text-coral",
  sun: "bg-sun-soft text-sun",
  violet: "bg-violet-soft text-violet",
};
const handoutSystems = [...new Set(handouts.map((h) => h.category))];

const modules = [
  {
    id: "osce",
    icon: "doctor",
    tone: "indigo",
    name: "OSCE stations",
    lead: "History-taking stations with a scripted AI patient, a time limit and an examiner marking checklist.",
    points: [
      "AI virtual patient: ask questions by typing or speaking, and have replies read aloud if you like",
      "The patient only reveals facts you ask about; the checklist stays hidden until you finish",
      "AI assessment scores your transcript item by item and lists what you missed",
      "Guided self-practice shows the script and checklist so you can study a station openly",
      "Mark yourself against the checklist in either mode, and revisit every attempt in your history",
    ],
  },
  {
    id: "mcqs",
    icon: "book",
    tone: "sky",
    name: `${formatCount(MCQ_COUNT)} MCQs`,
    lead: `Single-best-answer questions with explanations for MBBS ${yearCoverage[0].label} to ${yearCoverage[yearCoverage.length - 1].label}.`,
    points: [
      "Browse by year, then module or block, then topic",
      "Read mode shows each question with its answer and explanation",
      "Practice mode: pick how many questions, shuffle them, and check each answer",
      "Your practice scores are saved on your device",
    ],
  },
  {
    id: "ospe",
    icon: "microscope",
    tone: "mint",
    name: `${formatCount(OSPE_COUNT)} OSPE stations`,
    lead: "Specimens and scenarios with candidate tasks and the examiner scoring checklist, for MBBS First to Fourth Year.",
    points: [
      "Organised by year, module or block, and topic",
      "Read mode with the option to hide checklists until you reveal them",
      "Timed practice: attempt the tasks, then tick the checklist to mark yourself",
      "See your result at the end of each practice set",
    ],
  },
  {
    id: "clinical-examination",
    icon: "heart",
    tone: "coral",
    name: "Clinical examination guide",
    lead: `${examStations.length} examinations written as step-by-step technique, from introduction to closing.`,
    chips: examStations.map((s) => s.title.replace(/ Examination$/, "")),
  },
  {
    id: "history-taking",
    icon: "patient",
    tone: "sun",
    name: "History-taking guide",
    lead: `A universal history framework, communication skills and ${historyTopics.length} focused presentations.`,
    chips: historyTopics.map((t) => t.title),
  },
  {
    id: "handouts",
    icon: "medicines",
    tone: "violet",
    name: "Handout notes",
    lead: `${handouts.length} handouts covering introduction, clinical features, diagnosis and management, grouped by system.`,
    chips: handoutSystems,
  },
  {
    id: "credits",
    icon: "medicalRecords",
    tone: "indigo",
    name: "Credits",
    lead: "Credits are only used for the AI features. Everything else on this page is included with a free account.",
    points: [
      "Starting an AI virtual patient session uses credits",
      "Requesting AI assessment uses credits, and they are returned if the assessment fails",
      "Buy a credit package from the pricing page when you need more",
    ],
    link: { to: "/pricing", label: "See credit packages" },
  },
];

export default function FeaturesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <h1 className="site-rise max-w-3xl text-4xl font-semibold leading-tight text-s-ink md:text-5xl">Everything inside KF LearnSmart</h1>
        <p className="site-rise mt-5 max-w-2xl text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "80ms" }}>
          OSCE stations with an AI patient, question banks, OSPE stations and revision guides. Here is what each part does.
        </p>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[14rem_1fr] lg:gap-16 lg:px-8">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 border-l border-s-line">
            {modules.map((m) => (
              <li key={m.id}>
                <a href={`#${m.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-s-mute hover:border-s-accent hover:text-s-ink">
                  {m.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4">
          {modules.map((m) => (
            <section
              key={m.id}
              id={m.id}
              data-reveal
              className="site-grid scroll-mt-24 rounded-3xl border border-s-line p-6 md:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${TONE[m.tone]}`}>
                  <HealthIcon name={m.icon} size={32} />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-s-ink">{m.name}</h2>
                  <p className="mt-2 max-w-2xl leading-relaxed text-s-mute">{m.lead}</p>
                </div>
              </div>

              {m.points && (
                <ul className="mt-6 grid gap-3 md:grid-cols-2">
                  {m.points.map((p, i) => (
                    <li key={p} className={`${m.points.length % 2 === 1 && i === m.points.length - 1 ? "md:col-span-2 " : ""}rounded-2xl bg-s-card px-4 py-3 text-[15px] leading-relaxed text-s-ink shadow-[0_1px_2px_rgba(35,41,110,0.06)]`}>
                      {p}
                    </li>
                  ))}
                </ul>
              )}

              {m.chips && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {m.chips.map((c) => (
                    <li key={c} className={`rounded-full px-3 py-1.5 text-sm text-s-ink ${TONE[m.tone].split(" ")[0]}`}>
                      {c}
                    </li>
                  ))}
                </ul>
              )}

              {m.link && (
                <Link to={m.link.to} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-s-accent hover:underline">
                  {m.link.label} <ArrowRight size={15} strokeWidth={2} />
                </Link>
              )}
            </section>
          ))}

          <div data-reveal className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-s-accent p-6 text-s-on-accent md:flex-row md:items-center md:p-8">
            <p className="text-xl font-semibold">Try it with a free account.</p>
            <Link to="/signup" className="site-press inline-flex items-center gap-2 rounded-full bg-s-on-accent px-6 py-3 text-[15px] font-semibold text-s-accent hover:opacity-90">
              {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
