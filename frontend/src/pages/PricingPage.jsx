import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import PageShell from "../components/PageShell";
import { getPublicCreditPackages } from "../lib/api";
import { Character, HealthIcon, MedIcon } from "../site/Illustrations";
import { EXAM_GUIDE_COUNT, HANDOUT_COUNT, HISTORY_TOPIC_COUNT, MCQ_COUNT, OSPE_COUNT, SIGNUP_LABEL, formatCount, plus } from "../site/siteContent";

const included = [
  { icon: "book", tone: "bg-sky-soft text-sky", label: `${plus(MCQ_COUNT)} MCQs with explanations` },
  { icon: "microscope", tone: "bg-mint-soft text-mint", label: `${plus(OSPE_COUNT)} OSPE stations with checklists` },
  { icon: "medicalRecords", tone: "bg-s-accent-soft text-s-accent", label: "Guided self-practice on every OSCE station" },
  { icon: "heart", tone: "bg-coral-soft text-coral", label: `${plus(EXAM_GUIDE_COUNT)} clinical examination guides` },
  { icon: "patient", tone: "bg-sun-soft text-sun", label: `${plus(HISTORY_TOPIC_COUNT)} history-taking guides` },
  { icon: "medicines", tone: "bg-violet-soft text-violet", label: `${plus(HANDOUT_COUNT)} handout notes` },
];

const packPerks = [
  "The AI virtual patient on every OSCE station",
  "AI marking against the examiner checklist",
  "A score, a written summary and the items you missed",
];

// Free account vs. what a pack adds. `true` = included.
const comparison = [
  { label: "MCQ bank with explanations", free: true, pack: true },
  { label: "OSPE stations and checklists", free: true, pack: true },
  { label: "Examination and history-taking guides", free: true, pack: true },
  { label: "Handout notes", free: true, pack: true },
  { label: "Guided self-practice on OSCE stations", free: true, pack: true },
  { label: "AI virtual patient, by voice or text", free: false, pack: true },
  { label: "AI marking with feedback", free: false, pack: true },
];

const pricingFaqs = [
  { q: "Do I need a pack to study?", a: "No. The question banks, OSPE stations, guides, handouts and guided self-practice are all included with a free account." },
  { q: "What does a pack add?", a: "It lets you sit OSCE stations with the AI virtual patient and get AI marking against the station's checklist." },
  { q: "What if an AI assessment doesn't finish?", a: "Nothing is lost. What you spent on it goes straight back to your balance so you can try again." },
];

export default function PricingPage() {
  const [state, setState] = useState({ loading: true, packages: [], error: "" });

  useEffect(() => {
    let cancelled = false;
    getPublicCreditPackages()
      .then((data) => !cancelled && setState({ loading: false, packages: data.packages || [], error: "" }))
      .catch(() => !cancelled && setState({ loading: false, packages: [], error: "Packs could not be loaded. Please refresh the page." }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <section className="site-hero border-b border-s-line">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-16 lg:px-8">
          <h1 className="site-rise max-w-3xl text-4xl font-semibold leading-tight text-s-ink md:text-5xl">
            Study free. Add the AI patient when you're ready.
          </h1>
          <p className="site-rise mt-5 max-w-2xl text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "80ms" }}>
            The whole study library comes with a free account. Practice packs unlock the AI virtual patient for exam-style OSCE practice.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <FreePlan />
        <Packs state={state} />
      </section>

      <Comparison />
      <PricingFaq />
    </PageShell>
  );
}

function FreePlan() {
  return (
    <div data-reveal className="site-grid flex flex-col rounded-3xl border border-s-line p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-s-accent">Free account</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-s-ink">PKR 0</p>
        </div>
        <div className="flex -space-x-3" aria-hidden="true">
          <Character name="student-ayesha" size={48} tone="sky" className="ring-4 ring-s-card" />
          <Character name="student-bilal" size={48} tone="sun" className="ring-4 ring-s-card" />
        </div>
      </div>
      <p className="mt-2 text-s-mute">Everything you need to study, for as long as you like.</p>
      <ul className="mt-6 flex-1 space-y-3">
        {included.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-[15px] text-s-ink">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
              <MedIcon name={item.icon} size={24} />
            </span>
            {item.label}
          </li>
        ))}
      </ul>
      <Link
        to="/signup"
        className="site-press mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-3 text-[15px] font-medium text-s-on-accent hover:bg-s-accent-strong"
      >
        {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
      </Link>
    </div>
  );
}

function Packs({ state }) {
  const groupId = useId();
  const [picked, setPicked] = useState(null);
  const packs = state.packages;
  const bestValueId = packs.length
    ? packs.reduce((best, p) => (p.pricePkr / p.credits < best.pricePkr / best.credits ? p : best)).id
    : null;
  const active = packs.find((p) => p.id === picked) || packs[Math.min(1, packs.length - 1)];

  return (
    <div data-reveal className="relative overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent md:p-8">
      <span className="pointer-events-none absolute -right-10 -top-10 text-white/10" aria-hidden="true">
        <HealthIcon name="stethoscope" size={200} />
      </span>

      <div className="relative">
        <p className="text-sm font-medium opacity-80">Practice packs</p>
        <h2 className="mt-2 max-w-md text-2xl font-semibold leading-snug md:text-3xl">Sit OSCE stations with the AI patient</h2>

        {state.loading && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading packs">
            <div className="h-12 animate-pulse rounded-full bg-white/15" />
            <div className="h-36 animate-pulse rounded-2xl bg-white/15" />
          </div>
        )}
        {state.error && <p className="mt-6 rounded-2xl bg-white/15 px-4 py-3 text-sm">{state.error}</p>}

        {active && (
          <>
            <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-white/12 p-1">
              <span id={`${groupId}-label`} className="sr-only">Choose a pack</span>
              {packs.map((p) => {
                const on = p.id === active.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPicked(p.id)}
                    className={`site-press min-h-11 rounded-full px-3 text-sm font-medium transition-colors ${on ? "bg-s-card text-s-accent-strong" : "text-s-on-accent/85 hover:bg-white/10"}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-s-card p-5 text-s-ink md:p-6" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{active.name}</p>
                  <p className="mt-1 font-chart text-sm text-s-mute">{formatCount(active.credits)} credits</p>
                </div>
                {active.id === bestValueId && (
                  <span className="rounded-full bg-mint-soft px-3 py-1 text-xs font-medium text-mint">Best value</span>
                )}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight">
                <span className="mr-1 text-lg font-medium text-s-mute">PKR</span>
                {formatCount(active.pricePkr)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {packPerks.map((perk) => (
                  <li key={perk} className="flex gap-2.5 text-[15px] leading-snug">
                    <Check size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-s-good" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                to="/credits"
                className="site-press mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-3 text-[15px] font-medium text-s-on-accent hover:bg-s-accent-strong"
              >
                Get {active.name} <ArrowRight size={17} strokeWidth={2} />
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-80">One-time purchase. Your balance is always visible in your account.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Comparison() {
  return (
    <section className="border-y border-s-line bg-s-card">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <h2 data-reveal className="text-2xl font-semibold text-s-ink md:text-3xl">What you get</h2>
        <div data-reveal className="mt-8 overflow-hidden rounded-3xl border border-s-line">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 bg-s-tint px-4 py-3 text-sm font-medium text-s-ink sm:grid-cols-[1fr_8rem_8rem] sm:px-6">
            <span>Feature</span>
            <span className="text-center">Free</span>
            <span className="text-center">With a pack</span>
          </div>
          <ul className="divide-y divide-s-line">
            {comparison.map((row) => (
              <li key={row.label} className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 px-4 py-3.5 text-[15px] text-s-ink sm:grid-cols-[1fr_8rem_8rem] sm:px-6">
                <span>{row.label}</span>
                <Mark on={row.free} />
                <Mark on={row.pack} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Mark({ on }) {
  return (
    <span className="flex justify-center">
      {on ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint-soft text-mint">
          <Check size={16} strokeWidth={2.5} aria-label="Included" />
        </span>
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-s-tint text-s-mute">
          <Minus size={16} strokeWidth={2.5} aria-label="Not included" />
        </span>
      )}
    </span>
  );
}

function PricingFaq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <h2 data-reveal className="text-2xl font-semibold text-s-ink md:text-3xl">Pricing questions</h2>
      <div data-reveal className="mt-6 divide-y divide-s-line border-y border-s-line">
        {pricingFaqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex min-h-14 w-full items-center justify-between gap-6 py-4 text-left text-[17px] font-medium text-s-ink"
                >
                  {f.q}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOpen ? "bg-s-accent text-s-on-accent" : "bg-s-tint text-s-mute"}`}>
                    {isOpen ? <Minus size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
                  </span>
                </button>
              </h3>
              {isOpen && <p className="max-w-2xl pb-5 leading-relaxed text-s-mute">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
