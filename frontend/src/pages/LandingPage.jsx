import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Mic, Minus, Plus, RotateCcw, X } from "lucide-react";
import PageShell from "../components/PageShell";
import { Character, EcgLine, MedIcon, VoiceBars } from "../site/Illustrations";
import {
  SIGNUP_LABEL,
  CHECKLIST_ITEM_MARKS,
  demoChecklist,
  demoPatient,
  faqs,
  plus,
  sampleMcq,
} from "../site/siteContent";
import { usePublicStats, yearCoverage as buildYearCoverage } from "../lib/publicStats";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Specialty colours: each part of the product keeps one colour (see index.css).
const TONES = {
  sky: { soft: "bg-sky-soft", text: "text-sky", ring: "hover:border-sky/40" },
  mint: { soft: "bg-mint-soft", text: "text-mint", ring: "hover:border-mint/40" },
  coral: { soft: "bg-coral-soft", text: "text-coral", ring: "hover:border-coral/40" },
  sun: { soft: "bg-sun-soft", text: "text-sun", ring: "hover:border-sun/40" },
  violet: { soft: "bg-violet-soft", text: "text-violet", ring: "hover:border-violet/40" },
};

export default function LandingPage() {
  return (
    <PageShell>
      <Hero />
      <Library />
      <StationFlow />
      <TryMcq />
      <MarkLikeExaminer />
      <Coverage />
      <Faq />
      <FinalCta />
    </PageShell>
  );
}

/* ================================================================== Hero */

function Hero() {
  const stats = usePublicStats();
  return (
    <section className="site-hero overflow-hidden border-b border-s-line">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pb-14 pt-8 sm:px-6 md:pb-20 md:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:px-8 lg:pb-28">
        <div>
          <p className="site-rise inline-flex items-center gap-2 rounded-full bg-sky-soft px-3.5 py-1.5 text-sm font-medium text-s-ink">
            <MedIcon name="stethoscope" size={18} className="text-sky" />
            For MBBS, FCPS and MCPS students
          </p>
          <h1
            className="site-rise mt-6 text-[2.35rem] font-semibold leading-[1.1] text-s-ink sm:text-5xl lg:text-[3.6rem]"
            style={{ "--rise-delay": "60ms" }}
          >
            Practise on a patient who{" "}
            <span className="relative inline-block whitespace-nowrap">
              talks back.
              <EcgLine className="absolute -bottom-3 left-0 h-4 w-full text-coral" />
            </span>
          </h1>
          <p className="site-rise mt-8 max-w-lg text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "120ms" }}>
            Run full OSCE stations by voice or text, get marked on the examiner checklist, and drill {plus(stats.mcq.total)} MCQs.
          </p>
          <div className="site-rise mt-9 grid gap-3 sm:flex sm:flex-wrap sm:items-center" style={{ "--rise-delay": "180ms" }}>
            <Link
              to="/signup"
              className="site-press inline-flex items-center justify-center gap-2 rounded-full bg-s-accent px-6 py-3.5 text-[15px] font-medium text-s-on-accent shadow-[0_10px_24px_-12px_rgba(59,63,216,0.8)] hover:bg-s-accent-strong"
            >
              {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
            </Link>
            <Link
              to="/sample-stations"
              className="site-press inline-flex items-center justify-center gap-2 rounded-full bg-sky-soft px-6 py-3.5 text-[15px] font-medium text-s-ink hover:bg-[#cfe5ff]"
            >
              <MedIcon name="medicalRecords" size={18} className="text-sky" />
              See sample stations
            </Link>
          </div>
        </div>

        <div className="site-rise relative" style={{ "--rise-delay": "140ms" }}>
          <span className="bob absolute -right-4 -top-9 z-10 hidden h-14 w-14 items-center justify-center rounded-2xl bg-coral-soft text-coral shadow-sm sm:flex">
            <MedIcon name="heart" size={30} />
          </span>
          <span
            className="bob absolute -bottom-10 -left-5 z-10 hidden h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-mint shadow-sm sm:flex"
            style={{ animationDelay: "1.2s" }}
          >
            <MedIcon name="lungs" size={30} />
          </span>
          <PatientDemo />
        </div>
      </div>
    </section>
  );
}

// Scripted preview of the AI virtual patient, using lines from a real station.
function PatientDemo() {
  const [asked, setAsked] = useState([]);
  const [pending, setPending] = useState(null);
  const timer = useRef(null);
  const logRef = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [asked, pending]);

  function ask(i) {
    if (pending !== null || asked.includes(i)) return;
    setAsked((a) => [...a, i]);
    setPending(i);
    timer.current = setTimeout(() => setPending(null), prefersReducedMotion() ? 0 : 950);
  }

  function reset() {
    clearTimeout(timer.current);
    setAsked([]);
    setPending(null);
  }

  const remaining = demoPatient.questions.map((q, i) => ({ ...q, i })).filter((q) => !asked.includes(q.i));
  const done = remaining.length === 0 && pending === null;
  const areas = new Set(asked.map((i) => demoPatient.questions[i].area));

  return (
    <div className="site-grid site-shadow relative overflow-hidden rounded-3xl border border-s-line">
      <div className="flex items-center gap-4 border-b border-s-line bg-s-card/90 px-5 py-4">
        <span className="relative">
          <Character name="patient-maya" alt={`Pixel-art portrait of the virtual patient, ${demoPatient.name}`} size={56} tone="indigo" />
          <span className="absolute -bottom-1 left-1/2 flex h-5 -translate-x-1/2 items-center rounded-full bg-s-card px-1.5 text-s-accent shadow-sm">
            {pending !== null ? <VoiceBars /> : <Mic size={12} strokeWidth={2} aria-hidden="true" />}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-s-ink">
            {demoPatient.name}, {demoPatient.age}
          </p>
          <p className="truncate font-chart text-xs text-s-mute">
            {demoPatient.station} / {demoPatient.setting}
          </p>
        </div>
        {asked.length > 0 && (
          <button
            type="button"
            onClick={reset}
            aria-label="Restart the demo"
            className="site-press flex h-9 w-9 items-center justify-center rounded-full text-s-mute hover:bg-s-tint hover:text-s-ink"
          >
            <RotateCcw size={16} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div ref={logRef} aria-live="polite" className="h-52 space-y-3 overflow-y-auto sm:h-64 px-5 py-5 text-[15px] leading-snug">
        <PatientBubble>{demoPatient.opening}</PatientBubble>
        {asked.map((i) => (
          <div key={i} className="space-y-3">
            <p className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-s-accent px-4 py-2.5 text-s-on-accent">
              {demoPatient.questions[i].ask}
            </p>
            {pending === i ? (
              <p className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-s-card px-4 py-3.5 shadow-sm" aria-label="The patient is answering">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-s-mute" style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </p>
            ) : (
              <PatientBubble>{demoPatient.questions[i].reply}</PatientBubble>
            )}
          </div>
        ))}
        {done && (
          <div className="rounded-2xl border border-mint/30 bg-mint-soft px-4 py-3 text-sm text-s-ink">
            <p className="font-medium">
              You covered {areas.size} of the {demoChecklist.length} checklist areas.
            </p>
            <p className="mt-1 text-s-mute">The full station also covers your diagnosis, tests, referral and her worry about cancer.</p>
          </div>
        )}
      </div>

      <div className="border-t border-s-line bg-s-card/90 px-5 py-4">
        {done ? (
          <Link
            to="/signup"
            className="site-press flex items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-3 text-[15px] font-medium text-s-on-accent hover:bg-s-accent-strong"
          >
            {SIGNUP_LABEL} <ArrowRight size={16} strokeWidth={2} />
          </Link>
        ) : (
          <>
            <p className="mb-2.5 text-xs font-medium text-s-mute">Try it: ask the patient a question</p>
            <div className="flex flex-wrap gap-2">
              {remaining.map((q) => (
                <button
                  key={q.i}
                  type="button"
                  onClick={() => ask(q.i)}
                  disabled={pending !== null}
                  className="site-press min-h-11 rounded-full border border-s-accent/25 bg-s-accent-soft px-4 py-2.5 text-sm font-medium text-s-accent-strong hover:border-s-accent disabled:opacity-50"
                >
                  {q.ask}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PatientBubble({ children }) {
  return <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-s-card px-4 py-2.5 text-s-ink shadow-sm">{children}</p>;
}

/* =============================================================== Library */

function Library() {
  const stats = usePublicStats();
  return (
    <section id="library" className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-24">
      <div data-reveal className="max-w-2xl">
        <h2 className="text-3xl font-semibold leading-tight text-s-ink md:text-[2.6rem]">Everything for exam season, in one bag</h2>
        <p className="mt-4 text-lg leading-relaxed text-s-mute">Organised by MBBS year, module and topic, so you always know where to start.</p>
      </div>

      {/* 5 items, 5 cells: two large tiles, then three. One column under md. */}
      <div className="mt-10 grid gap-4 md:grid-cols-6">
        <LibraryTile
          className="md:col-span-3"
          tone="sky"
          icon="book"
          stat={plus(stats.mcq.total)}
          title="MCQs with explanations"
          body="First Year to Final Year. Read a topic with answers open, or run a shuffled practice set."
          to="/features#mcqs"
          large
        />
        <LibraryTile
          className="md:col-span-3"
          tone="mint"
          icon="microscope"
          stat={plus(stats.ospe.total)}
          title="OSPE stations"
          body="Specimens and scenarios with candidate tasks and the examiner checklist to mark yourself."
          to="/features#ospe"
          large
        />
        <LibraryTile
          className="md:col-span-2"
          tone="coral"
          icon="heart"
          stat={plus(stats.examGuides.total)}
          title="Examination guides"
          body="Step-by-step technique, from cardiovascular to cranial nerves."
          to="/features#clinical-examination"
        />
        <LibraryTile
          className="md:col-span-2"
          tone="sun"
          icon="patient"
          stat={plus(stats.historyGuides.total)}
          title="History-taking guides"
          body="A universal framework plus chest pain, breathlessness, headache and more."
          to="/features#history-taking"
        />
        <LibraryTile
          className="md:col-span-2"
          tone="violet"
          icon="medicines"
          stat={plus(stats.handouts.total)}
          title="Handout notes"
          body={`Features, diagnosis and management across ${stats.handouts.systems.length || 7} body systems.`}
          to="/features#handouts"
        />
      </div>
    </section>
  );
}

function LibraryTile({ className = "", tone, icon, stat, title, body, to, large = false }) {
  const t = TONES[tone];
  return (
    <Link
      to={to}
      data-reveal
      className={`site-grid site-press group relative flex flex-col overflow-hidden rounded-3xl border border-s-line p-6 md:p-7 ${t.ring} ${className}`}
    >
      {large ? (
        <span
          className={`absolute -right-10 -top-10 flex h-48 w-48 items-center justify-center rounded-full ${t.soft} ${t.text} transition-transform duration-500 group-hover:scale-105`}
          aria-hidden="true"
        >
          <MedIcon name={icon} size={96} className="-translate-x-4 translate-y-4" />
        </span>
      ) : (
        <>
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.soft} ${t.text}`}>
            <MedIcon name={icon} size={32} />
          </span>
        </>
      )}
      <p className={`${large ? "mt-20 text-5xl" : "mt-6 text-4xl"} relative font-semibold tracking-tight text-s-ink`}>{stat}</p>
      <p className="relative mt-1.5 text-lg font-medium text-s-ink">{title}</p>
      <p className="relative mt-2 max-w-md leading-relaxed text-s-mute">{body}</p>
      <span className={`relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium ${t.text}`}>
        What's inside <ArrowRight size={15} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/* ========================================================== Station flow */

const flow = [
  { icon: "medicalRecords", tone: "sky", title: "Read the brief", body: "The setting, the patient and your tasks, like the card on the station door." },
  { character: "patient-daniel", tone: "coral", title: "Work the station", body: "Talk to the patient by voice or text. They only reveal what you ask about." },
  { character: "examiner", tone: "mint", title: "Get marked", body: "AI assessment checks your transcript against the station's checklist." },
  { icon: "cardiogram", tone: "violet", title: "Review and repeat", body: "See your score, a summary and the items you missed. Every attempt is saved." },
];

function StationFlow() {
  return (
    <section className="border-y border-s-line bg-s-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-24">
        <div data-reveal className="max-w-2xl">
          <h2 className="text-3xl font-semibold leading-tight text-s-ink md:text-[2.6rem]">A whole OSCE station, any time you like</h2>
          <p className="mt-4 text-lg leading-relaxed text-s-mute">No partner to play the patient, no examiner to find. Just you, the brief and the clock.</p>
        </div>

        <ol className="relative mt-12 grid gap-6 md:grid-cols-4 md:gap-4">
          <span className="absolute left-[12%] right-[12%] top-11 hidden border-t-2 border-dashed border-s-line md:block" aria-hidden="true" />
          {flow.map((step, i) => {
            const t = TONES[step.tone];
            return (
              <li key={step.title} data-reveal style={{ "--reveal-delay": `${i * 80}ms` }} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                {step.character ? (
                  <Character name={step.character} size={88} tone={step.tone} className="ring-4 ring-s-card" />
                ) : (
                  <span className={`flex h-22 w-22 shrink-0 items-center justify-center rounded-full ring-4 ring-s-card ${t.soft} ${t.text}`}>
                    <MedIcon name={step.icon} size={44} />
                  </span>
                )}
                <div className="md:mt-4">
                  <h3 className="text-lg font-medium text-s-ink">{step.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-s-mute md:mx-auto md:max-w-60">{step.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div data-reveal className="mt-14 grid gap-3 md:grid-cols-2">
          <ModeCard
            tone="sun"
            icon="medicalRecords"
            title="Guided self-practice"
            tag="Study mode"
            body="The patient script and checklist are open. Study the station, then tick off what you covered."
          />
          <ModeCard
            tone="indigo"
            icon="doctor"
            title="AI virtual patient"
            tag="Exam mode"
            body="Facts and checklist stay hidden. Interview the patient, then choose AI assessment or mark yourself."
          />
        </div>
      </div>
    </section>
  );
}

function ModeCard({ tone, icon, title, tag, body }) {
  const isIndigo = tone === "indigo";
  return (
    <div className={`flex flex-col gap-3 rounded-3xl p-6 sm:flex-row sm:items-start sm:gap-5 md:p-7 ${isIndigo ? "bg-s-accent-soft" : "bg-sun-soft"}`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-s-card ${isIndigo ? "text-s-accent" : "text-sun"}`}>
        <MedIcon name={icon} size={28} />
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-lg font-medium text-s-ink">{title}</h3>
          <span className="rounded-full bg-s-card px-2.5 py-0.5 font-chart text-xs text-s-mute">{tag}</span>
        </div>
        <p className="mt-2 leading-relaxed text-s-mute">{body}</p>
      </div>
    </div>
  );
}

/* =============================================================== Try MCQ */

function TryMcq() {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;
  const correct = picked === sampleMcq.answer;
  const letter = (i) => String.fromCharCode(65 + i);

  return (
    <section className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-12 md:py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8 lg:py-24">
      <div data-reveal className="lg:sticky lg:top-28">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-soft text-sky">
          <MedIcon name="cardiogram" size={32} />
        </span>
        <h2 className="mt-6 text-3xl font-semibold leading-tight text-s-ink md:text-[2.6rem]">Got a minute? Try one.</h2>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-s-mute">
          A real question from the bank. Pick an answer to see the explanation, the same way practice mode shows it.
        </p>
        <Link to="/features#mcqs" className="mt-4 inline-flex min-h-11 items-center gap-1.5 font-medium text-s-accent hover:underline">
          How the MCQ bank works <ArrowRight size={16} strokeWidth={2} />
        </Link>
      </div>

      <div data-reveal className="site-grid site-shadow rounded-3xl border border-s-line p-5 md:p-8">
        <p className="font-chart text-xs text-s-mute">{sampleMcq.where}</p>
        <p className="mt-3 text-lg leading-relaxed text-s-ink">{sampleMcq.stem}</p>
        <ul className="mt-6 space-y-2.5">
          {sampleMcq.options.map((opt, i) => {
            const isAnswer = i === sampleMcq.answer;
            const isPicked = i === picked;
            let state = "border-s-line bg-s-card hover:border-s-accent/60";
            if (answered && isAnswer) state = "border-mint bg-mint-soft";
            else if (answered && isPicked) state = "border-coral bg-coral-soft";
            else if (answered) state = "border-s-line bg-s-card opacity-60";
            return (
              <li key={opt}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => setPicked(i)}
                  className={`site-press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] text-s-ink ${state}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-s-tint font-chart text-xs text-s-mute">
                    {answered && isAnswer ? (
                      <Check size={14} strokeWidth={2.5} className="text-mint" />
                    ) : answered && isPicked ? (
                      <X size={14} strokeWidth={2.5} className="text-coral" />
                    ) : (
                      letter(i)
                    )}
                  </span>
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
        {answered && (
          <div aria-live="polite" className={`mt-5 rounded-2xl px-4 py-4 ${correct ? "bg-mint-soft" : "bg-coral-soft"}`}>
            <p className="font-medium text-s-ink">{correct ? "Correct. Nicely done." : `Not quite. The answer is ${letter(sampleMcq.answer)}.`}</p>
            <p className="mt-1.5 leading-relaxed text-s-ink/80">{sampleMcq.explanation}</p>
            <button type="button" onClick={() => setPicked(null)} className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-s-accent hover:underline">
              <RotateCcw size={14} strokeWidth={2} /> Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ================================================ Mark like an examiner */

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function MarkLikeExaminer() {
  const [checked, setChecked] = useState(() => new Set());
  const total = demoChecklist.length * CHECKLIST_ITEM_MARKS;
  const score = checked.size * CHECKLIST_ITEM_MARKS;
  const pct = Math.round((score / total) * 100);

  function toggle(i) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <section className="bg-s-tint">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-24">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <Character name="examiner" size={72} tone="mint" className="mx-auto" />
          <h2 className="mt-5 text-3xl font-semibold leading-tight text-s-ink md:text-[2.6rem]">Mark yourself like the examiner</h2>
          <p className="mt-4 text-lg leading-relaxed text-s-mute">
            This is the real checklist for the inflammatory bowel disease station. Tick what you would have covered. Each item is worth 2 marks.
          </p>
        </div>

        <div data-reveal className="site-shadow mx-auto mt-10 grid max-w-5xl overflow-hidden rounded-3xl border border-s-line bg-s-card md:grid-cols-[1fr_17rem]">
          <ul className="divide-y divide-s-line">
            {demoChecklist.map((item, i) => {
              const on = checked.has(i);
              return (
                <li key={item.label}>
                  <label className="flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-s-page md:px-6">
                    <input type="checkbox" checked={on} onChange={() => toggle(i)} className="peer sr-only" />
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-s-accent ${
                        on ? "border-mint bg-mint text-s-card" : "border-s-line bg-s-card"
                      }`}
                      aria-hidden="true"
                    >
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="flex-1">
                      <span className="font-medium text-s-ink">{item.label}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-s-mute">{item.detail}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="site-grid flex flex-col items-center justify-center gap-4 border-t border-s-line px-6 py-8 text-center md:border-l md:border-t-0">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_R}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className={`transition-[stroke-dashoffset] duration-500 ${pct >= 70 ? "text-mint" : pct >= 40 ? "text-sun-bright" : "text-coral"}`}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - pct / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold tracking-tight text-s-ink">{pct}%</span>
                <span className="font-chart text-xs text-s-mute">
                  {score} / {total} marks
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-s-mute" aria-live="polite">
              {checked.size === 0
                ? "Tick an item to start scoring."
                : checked.size === demoChecklist.length
                  ? "Every item covered."
                  : `${demoChecklist.length - checked.size} of ${demoChecklist.length} items still to cover.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================== Coverage */

const YEAR_TONES = ["sky", "mint", "coral", "sun", "violet"];

function Coverage() {
  const yearCoverage = buildYearCoverage(usePublicStats());
  const [active, setActive] = useState(0);
  const baseId = useId();
  const year = yearCoverage[active];
  const tone = TONES[YEAR_TONES[active % YEAR_TONES.length]];

  function onKeyDown(e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + yearCoverage.length) % yearCoverage.length;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-24">
      <div data-reveal className="max-w-2xl">
        <h2 className="text-3xl font-semibold leading-tight text-s-ink md:text-[2.6rem]">Find your year</h2>
        <p className="mt-4 text-lg leading-relaxed text-s-mute">See the modules waiting for you in the question banks.</p>
      </div>

      {!year && (
        <div className="mt-8 space-y-4" aria-busy="true" aria-label="Loading years">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-11 w-28 animate-pulse rounded-full bg-s-tint" />)}
          </div>
          <div className="h-48 animate-pulse rounded-3xl bg-s-tint" />
        </div>
      )}
      {/* No data-reveal here: this appears after the counts load, after the
          page's reveal observer has already run. */}
      {year && (
      <div className="mt-8">
        <div role="tablist" aria-label="MBBS year" onKeyDown={onKeyDown} className="flex gap-2 overflow-x-auto pb-2">
          {yearCoverage.map((y, i) => (
            <button
              key={y.year}
              id={`${baseId}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={i === active}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`site-press min-h-11 shrink-0 rounded-full px-5 py-2.5 text-sm font-medium ${
                i === active ? "bg-s-ink text-s-card" : "border border-s-line bg-s-card text-s-mute hover:text-s-ink"
              }`}
            >
              {y.label}
            </button>
          ))}
        </div>

        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active}`}
          className="site-grid mt-4 grid gap-4 rounded-3xl border border-s-line p-5 md:grid-cols-2 md:p-8"
        >
          <CoverageColumn tone={tone} icon="book" label="MCQs" count={year.mcqCount} blocks={year.mcqBlocks} />
          {year.ospeCount > 0 ? (
            <CoverageColumn tone={tone} icon="microscope" label="OSPE stations" count={year.ospeCount} blocks={year.ospeBlocks} />
          ) : (
            <div className="rounded-2xl bg-s-card p-5 leading-relaxed text-s-mute">
              <p className="font-medium text-s-ink">OSPE stations</p>
              <p className="mt-2">The OSPE bank covers First to Fourth Year. In Final Year, lean on the OSCE stations and clinical guides.</p>
            </div>
          )}
        </div>
      </div>
      )}
    </section>
  );
}

function CoverageColumn({ tone, icon, label, count, blocks }) {
  return (
    <div className="rounded-2xl bg-s-card p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.soft} ${tone.text}`}>
          <MedIcon name={icon} size={24} />
        </span>
        <p className="text-lg font-medium text-s-ink">
          {plus(count)} {label}
        </p>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {blocks.map((b) => (
          <li key={b} className={`rounded-full px-3 py-1.5 text-sm text-s-ink ${tone.soft}`}>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =================================================================== FAQ */

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="border-t border-s-line bg-s-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:py-16 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-8 lg:py-24">
        <div data-reveal>
          <div className="flex -space-x-3">
            <Character name="student-ayesha" size={56} tone="sky" className="ring-4 ring-s-card" />
            <Character name="student-bilal" size={56} tone="sun" className="ring-4 ring-s-card" />
            <Character name="student-hira" size={56} tone="coral" className="ring-4 ring-s-card" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold leading-tight text-s-ink md:text-[2.6rem]">Questions students ask</h2>
        </div>
        <div data-reveal className="divide-y divide-s-line border-y border-s-line">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left text-[17px] font-medium text-s-ink"
                  >
                    {f.q}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOpen ? "bg-s-accent text-s-on-accent" : "bg-s-tint text-s-mute"}`}>
                      {isOpen ? <Minus size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
                    </span>
                  </button>
                </h3>
                {isOpen && <p className="max-w-2xl pb-6 leading-relaxed text-s-mute">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================= Final CTA */

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-24">
      <div data-reveal className="relative overflow-hidden rounded-3xl bg-s-accent px-6 py-14 text-s-on-accent md:px-14 md:py-16">
        <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 gap-3 lg:flex" aria-hidden="true">
          <span className="bob mt-16 flex h-20 w-20 items-center justify-center rounded-3xl bg-coral-soft text-coral">
            <MedIcon name="heart" size={44} />
          </span>
          <span className="bob flex h-20 w-20 items-center justify-center rounded-3xl bg-sun-soft text-sun" style={{ animationDelay: "0.8s" }}>
            <MedIcon name="stethoscope" size={44} />
          </span>
          <span className="bob mt-24 flex h-20 w-20 items-center justify-center rounded-3xl bg-mint-soft text-mint" style={{ animationDelay: "1.6s" }}>
            <MedIcon name="lungs" size={44} />
          </span>
        </div>
        <div className="relative max-w-xl">
          <h2 className="text-3xl font-semibold leading-tight md:text-[2.6rem]">Your next OSCE starts here</h2>
          <p className="mt-4 text-lg leading-relaxed opacity-90">
            Every OSCE station, question bank, guide and handout, unlocked with one monthly access pass.
          </p>
          <Link
            to="/signup"
            className="site-press mt-8 inline-flex items-center gap-2 rounded-full bg-s-card px-6 py-3.5 text-[15px] font-medium text-s-accent-strong hover:bg-sun-soft"
          >
            {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
