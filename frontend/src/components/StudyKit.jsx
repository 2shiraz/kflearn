// Shared building blocks for the self-study sections (MCQs, OSPE): year and
// topic cards, practice setup, session progress, timers, score ring and
// results. Visual only; each page keeps its own data and progress logic.
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, PlayCircle, RotateCcw, Timer } from "lucide-react";
import { Panel, PrimaryButton, SecondaryButton } from "./AppPage";
import { Character, MedIcon } from "../site/Illustrations";
import { TONES } from "../site/tones";

// Year cards cycle through the palette, like the landing "Coverage" tabs.
export const YEAR_TONES = ["sky", "mint", "coral", "sun", "violet"];
export const rise = (i, step = 50) => ({ "--rise-delay": `${Math.min(i, 10) * step}ms` });

export function Chip({ children, className = "" }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full bg-s-tint px-2.5 py-1 font-chart text-xs text-s-mute ${className}`}>{children}</span>;
}

// Thin progress line with a caption, e.g. "12 of 40 attempted".
export function ProgressLine({ value, total, tone = "indigo", caption }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="mt-4">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-s-tint" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={caption}>
        <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${TONES[tone].solid}`} style={{ width: `${pct}%` }} />
      </div>
      {caption && <p className="mt-1.5 font-chart text-xs text-s-mute">{caption}</p>}
    </div>
  );
}

export function YearCard({ to, name, blocks, count, tone, icon, progress, index }) {
  const t = TONES[tone];
  return (
    <Link to={to} style={rise(index)} className={`site-rise site-grid site-press group relative flex flex-col overflow-hidden rounded-3xl border border-s-line p-6 ${t.ring}`}>
      <div className="relative flex items-start justify-between gap-3">
        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.soft} ${t.text}`} aria-hidden="true">
          <MedIcon name={icon} size={32} />
        </span>
        <Chip>{count}</Chip>
      </div>
      <h2 className="relative mt-5 text-xl font-semibold tracking-tight text-s-ink">{name}</h2>
      <p className="relative mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-s-mute">{blocks}</p>
      <div className="relative">{progress}</div>
      <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-s-ink">
        Open <ArrowRight size={15} strokeWidth={2} className={`${t.text} transition-transform group-hover:translate-x-0.5`} aria-hidden="true" />
      </span>
    </Link>
  );
}

export function SectionHeader({ tone, icon, name, meta, actions, index }) {
  const t = TONES[tone];
  return (
    <div className="site-rise mb-4 flex flex-wrap items-center justify-between gap-3" style={rise(index, 80)}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.soft} ${t.text}`} aria-hidden="true">
          <MedIcon name={icon} size={28} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-s-ink sm:text-2xl">{name}</h2>
          {meta && <p className="mt-0.5 font-chart text-xs text-s-mute">{meta}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// Small pill link used for "Read section" / "Practise section".
export function PillLink({ to, icon: Icon, children, primary = false }) {
  return (
    <Link
      to={to}
      className={`site-press inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
        primary ? "bg-s-accent text-s-on-accent hover:bg-s-accent-strong" : "border border-s-line bg-s-card text-s-ink hover:border-s-accent/40 hover:bg-s-tint/60"
      }`}
    >
      {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />} {children}
    </Link>
  );
}

export function TopicCard({ name, count, tone, icon, done, progress, readTo, practiseTo, index }) {
  const t = TONES[tone];
  return (
    <div style={rise(index)} className={`site-rise site-grid flex flex-col rounded-3xl border border-s-line p-5 transition-colors ${t.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold leading-snug tracking-tight text-s-ink">{name}</h3>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-mint text-s-card" : `${t.soft} ${t.text}`}`} aria-label={done ? "All attempted" : undefined} role={done ? "img" : undefined}>
          {done ? <Check size={18} strokeWidth={2.5} /> : <MedIcon name={icon} size={22} />}
        </span>
      </div>
      <div className="flex-1">{progress}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Chip>{count}</Chip>
        <div className="flex gap-2">
          <PillLink to={readTo} icon={BookOpen}>Read</PillLink>
          <PillLink to={practiseTo} icon={PlayCircle} primary>Practise</PillLink>
        </div>
      </div>
    </div>
  );
}

// A row of pill choices (question count, time per station).
export function ChoicePills({ label, options, value, onChange }) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium text-s-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option.value)}
              className={`site-press min-h-11 rounded-full border px-4 text-sm font-medium ${
                on ? "border-s-accent bg-s-accent-soft text-s-accent-strong" : "border-s-line bg-s-card text-s-mute hover:border-s-accent/40 hover:text-s-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// Switch built on a real checkbox, so keyboard and screen readers work as before.
export function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-s-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className="relative h-6 w-11 shrink-0 rounded-full bg-s-line transition-colors peer-checked:bg-s-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-s-accent after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-s-card after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
        aria-hidden="true"
      />
      {children}
    </label>
  );
}

// Practice setup: a character, what's available, the options, and Start.
export function SetupCard({ character, tone, available, hint, onStart, children }) {
  return (
    <Panel className="site-rise">
      <div className="flex items-center gap-4">
        <Character name={character} size={64} tone={tone} className="bob" />
        <div>
          <p className="text-lg font-semibold tracking-tight text-s-ink">Set up your practice</p>
          <p className="mt-0.5 text-sm text-s-mute">{available}</p>
        </div>
      </div>
      {children}
      {hint && <p className="mt-5 text-sm leading-relaxed text-s-mute">{hint}</p>}
      <PrimaryButton className="mt-6" onClick={onStart}>
        <PlayCircle size={16} strokeWidth={2} aria-hidden="true" /> Start practice
      </PrimaryButton>
    </Panel>
  );
}

// Session progress: "Question 3 of 20" plus a thin bar.
export function StepBar({ label, aside, value, total, tone = "indigo" }) {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-chart text-xs text-s-mute">{label}</span>
        {aside}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-s-tint">
        <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${TONES[tone].solid}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TimerPill({ children, level = "normal" }) {
  const style = level === "over" ? "bg-coral-soft text-s-miss" : level === "warn" ? "bg-sun-soft text-s-ink" : "bg-s-card text-s-ink ring-1 ring-s-line";
  return (
    <span role="timer" className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 font-chart text-sm tabular-nums transition-colors ${style}`}>
      <Timer size={14} strokeWidth={2} aria-hidden="true" /> {children}
    </span>
  );
}

export function scoreTone(pct) {
  if (pct >= 70) return { ring: "text-mint", chip: "bg-mint-soft text-s-good" };
  if (pct >= 40) return { ring: "text-sun-bright", chip: "bg-sun-soft text-s-ink" };
  return { ring: "text-coral", chip: "bg-coral-soft text-s-miss" };
}

// Progress ring, as on the landing "Mark yourself like the examiner".
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
export function ScoreRing({ pct, tone, children, className = "h-36 w-36" }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="10" className="stroke-s-tint" />
        <circle
          cx="60"
          cy="60"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className={`transition-[stroke-dashoffset] duration-500 ${tone}`}
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - Math.min(100, Math.max(0, pct)) / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

// Results summary: ring, a line of detail, and what to do next.
export function ResultsSummary({ pct, title, detail, onRestart, backTo }) {
  const tone = scoreTone(pct);
  const character = pct >= 70 ? "student-ayesha" : pct >= 40 ? "student-bilal" : "student-hira";
  return (
    <Panel className="site-rise grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
      <ScoreRing pct={pct} tone={tone.ring} className="mx-auto h-36 w-36">
        <span className="text-4xl font-semibold tracking-tight text-s-ink">{pct}%</span>
        <span className="font-chart text-xs text-s-mute">{title}</span>
      </ScoreRing>
      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <Character name={character} size={44} tone={pct >= 70 ? "mint" : pct >= 40 ? "sun" : "coral"} />
          <p className="text-lg font-semibold tracking-tight text-s-ink">
            {pct >= 70 ? "Strong work." : pct >= 40 ? "Getting there." : "Worth another go."}
          </p>
        </div>
        <p className="mt-2 leading-relaxed text-s-mute">{detail}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
          <PrimaryButton onClick={onRestart}>
            <RotateCcw size={16} strokeWidth={2} aria-hidden="true" /> Practise again
          </PrimaryButton>
          <Link to={backTo} className="site-press inline-flex min-h-11 items-center gap-2 rounded-full border border-s-line bg-s-card px-5 text-sm font-semibold text-s-ink hover:border-s-accent/40 hover:bg-s-tint/60">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> Back to sections
          </Link>
        </div>
      </div>
    </Panel>
  );
}

// A checklist row with the landing-style tick box.
export function CheckRow({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-s-page">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-s-accent ${
          checked ? "border-mint bg-mint text-s-card" : "border-s-line bg-s-card"
        }`}
        aria-hidden="true"
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-relaxed text-s-ink">{children}</span>
    </label>
  );
}

export function Pager({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <SecondaryButton disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" /> Previous
      </SecondaryButton>
      <span className="font-chart text-xs text-s-mute">Page {page} of {totalPages}</span>
      <SecondaryButton disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        Next <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </SecondaryButton>
    </div>
  );
}
