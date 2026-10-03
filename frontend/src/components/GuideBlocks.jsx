// Shared content-block renderer for the static study guides (History Taking,
// Clinical Examination, Handout Notes). One schema — table / definitions / list /
// paragraph / callout — so every guide page stays visually consistent and
// new guides don't need their own renderer written from scratch. Also holds the
// page furniture those guides share (header, topic cards, prev/next).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Lightbulb, ListChecks, RotateCcw } from "lucide-react";
import { EmptyState, LinkButton, Panel, SecondaryButton } from "./AppPage";
import { CheckRow, rise } from "./StudyKit";
import { Character } from "../site/Illustrations";
import { TONES } from "../site/tones";

export function GuideBlock({ block }) {
  if (block.type === "table") {
    return (
      <>
        {/* Phones: one stacked card per row — avoids hunting for a horizontal scrollbar on a multi-column table. */}
        <div className="mt-3 space-y-2 sm:hidden">
          {block.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="rounded-2xl border border-s-line bg-s-card p-4 text-sm">
              <p className="font-medium text-s-ink">{row[0]}</p>
              {row.slice(1).map((cell, cellIndex) => (
                <p key={cellIndex} className="mt-1.5 leading-relaxed text-s-mute">
                  <span className="font-medium text-s-ink">{block.columns[cellIndex + 1]}: </span>
                  {cell}
                </p>
              ))}
            </div>
          ))}
        </div>
        {/* Tablet and up: a real table, room enough that it doesn't need to scroll. */}
        <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-s-line bg-s-card sm:block">
          <table className="w-full min-w-105 text-left text-sm">
            <thead>
              <tr className="bg-s-tint/70">
                {block.columns.map((column) => (
                  <th key={column} className="px-4 py-2.5 font-medium text-s-ink">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-s-line">
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`px-4 py-2.5 align-top leading-relaxed ${cellIndex === 0 ? "font-medium text-s-ink" : "text-s-mute"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (block.type === "definitions") {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {block.items.map((item, index) => {
          // Most terms are a bare letter ("M"); a few spell out the word too
          // ("P — Pain") — split those so the badge always shows just the letter.
          const [letter, word] = item.term.split("—").map((part) => part.trim());
          return (
            <div key={`${item.term}-${index}`} className="flex gap-3 rounded-2xl border border-s-line bg-s-card p-3.5 text-sm">
              <span className="flex h-8 min-w-8 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-s-accent px-2 text-sm font-semibold text-s-on-accent">{letter}</span>
              <span className="leading-relaxed text-s-mute">{word && <span className="font-medium text-s-ink">{word}: </span>}{item.detail}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <div className="mt-3">
        {block.heading && <p className="mb-2 text-sm font-medium text-s-ink">{block.heading}</p>}
        <ul className={`space-y-2 ${block.ordered ? "list-decimal pl-5" : ""}`}>
          {block.items.map((item, index) => (
            <li key={index} className={block.ordered ? "pl-1 text-sm leading-relaxed text-s-mute marker:font-chart marker:text-xs marker:text-s-accent" : "flex gap-2.5 text-sm leading-relaxed text-s-mute"}>
              {!block.ordered && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-s-accent/50" aria-hidden="true" />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Inline tip, placed exactly where the source calls it out — as opposed to
  // ExamTips below, which collects a page/topic's tips at the end instead.
  // `items` renders a bulleted list inside the box (e.g. a source's own
  // "Important considerations" box); `text` renders a single line.
  if (block.type === "callout") {
    return (
      <TipBox>
        {block.items ? (
          <ul className="space-y-1.5">
            {block.items.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-s-ink/50" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span>{block.text}</span>
        )}
      </TipBox>
    );
  }

  return <p className="mt-3 text-sm leading-relaxed text-s-mute">{block.text}</p>;
}

function TipBox({ children }) {
  return (
    <div className="mt-3 flex gap-3 rounded-2xl bg-sun-soft p-4 text-sm leading-relaxed text-s-ink">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-s-card text-sun" aria-hidden="true">
        <Lightbulb size={15} strokeWidth={2} />
      </span>
      <div className="min-w-0 pt-0.5">{children}</div>
    </div>
  );
}

export function GuideSection({ heading, intro, blocks }) {
  return (
    <div className="mt-6 first:mt-0">
      {heading && <h3 className="font-semibold tracking-tight text-s-ink">{heading}</h3>}
      {intro && <p className="mt-1 text-sm leading-relaxed text-s-mute">{intro}</p>}
      {blocks.map((block, index) => <GuideBlock key={index} block={block} />)}
    </div>
  );
}

export function ExamTips({ tips }) {
  if (!tips || tips.length === 0) return null;
  return (
    <div className="mt-5 space-y-2">
      {tips.map((tip, index) => (
        <TipBox key={index}>{tip}</TipBox>
      ))}
    </div>
  );
}

// Section shortcuts. Scrolls sideways on phones instead of stacking six rows of pills.
export function JumpNav({ items }) {
  return (
    <nav aria-label="Jump to section" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="site-press inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-s-line bg-s-card px-4 text-sm font-medium text-s-mute hover:border-s-accent/40 hover:text-s-ink"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Guide home header: title block on the left, a character on the right.
export function GuideHero({ eyebrow, title, description, character, tone }) {
  return (
    <div className="site-rise mb-6 flex items-center justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && <p className="font-chart text-xs uppercase tracking-wider text-s-mute">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-relaxed text-s-mute">{description}</p>}
      </div>
      <Character name={character} size={88} tone={tone} className="bob hidden shrink-0 sm:inline-flex" />
    </div>
  );
}

// Detail page header: the topic icon in a tinted tile, then title and summary.
export function GuideTitle({ icon: Icon, tone, eyebrow, title, summary }) {
  const t = TONES[tone];
  return (
    <div className="site-rise mb-6 flex items-start gap-4">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${t.soft} ${t.text}`} aria-hidden="true">
        <Icon size={26} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        {eyebrow && <p className="font-chart text-xs text-s-mute">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-s-ink sm:text-3xl">{title}</h1>
        {summary && <p className="mt-1.5 max-w-2xl leading-relaxed text-s-mute">{summary}</p>}
      </div>
    </div>
  );
}

export function SectionHeading({ children, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-s-ink">{children}</h2>
      {description && <p className="mt-1 text-sm text-s-mute">{description}</p>}
    </div>
  );
}

export function PanelHeading({ icon: Icon, title, subtitle }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-s-ink">
        {Icon && <Icon size={18} strokeWidth={2} className="text-s-accent" aria-hidden="true" />}
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-sm text-s-mute">{subtitle}</p>}
    </div>
  );
}

// Link card for a guide topic, station or handout.
export function GuideCard({ to, icon: Icon, tone, title, summary, cta = "Read guide", index = 0 }) {
  const t = TONES[tone];
  return (
    <Link to={to} style={rise(index, 40)} className={`site-rise site-grid site-press group flex flex-col rounded-3xl border border-s-line p-5 ${t.ring}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${t.soft} ${t.text}`} aria-hidden="true">
        <Icon size={22} strokeWidth={2} />
      </span>
      <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-s-ink">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-s-mute">{summary}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-s-ink">
        {cta} <ArrowRight size={15} strokeWidth={2} className={`${t.text} transition-transform group-hover:translate-x-0.5`} aria-hidden="true" />
      </span>
    </Link>
  );
}

// Numbered steps, e.g. the universal opening.
export function NumberedSteps({ steps }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((step, index) => (
        <li key={step.label} className="flex gap-3 rounded-2xl border border-s-line bg-s-card p-3.5 text-sm leading-relaxed">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-s-accent-soft font-chart text-xs text-s-accent-strong" aria-hidden="true">{index + 1}</span>
          <span className="pt-0.5">
            <span className="font-medium text-s-ink">{step.label}</span>
            {step.detail && <span className="text-s-mute">: {step.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

// Quoted script or template text.
export function QuoteBox({ children }) {
  return <p className="mt-3 rounded-2xl border-l-4 border-s-accent/40 bg-s-tint/60 p-4 text-sm italic leading-relaxed text-s-ink">{children}</p>;
}

// Previous / all / next links at the foot of a guide page.
export function PrevNext({ prev, next, base, allLabel }) {
  const pill = "site-press inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-s-line bg-s-card px-4 text-sm font-medium text-s-ink hover:border-s-accent/40 hover:bg-s-tint/60";
  return (
    <nav aria-label="More guides" className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <div>
        {prev && (
          <Link to={`${base}/${prev.slug}`} className={pill}>
            <ArrowLeft size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" /> <span className="truncate">{prev.title}</span>
          </Link>
        )}
      </div>
      <Link to={base} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-s-mute hover:bg-s-tint/70 hover:text-s-ink">
        <ListChecks size={15} strokeWidth={2} aria-hidden="true" /> {allLabel}
      </Link>
      <div className="sm:text-right">
        {next && (
          <Link to={`${base}/${next.slug}`} className={pill}>
            <span className="truncate">{next.title}</span> <ArrowRight size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </nav>
  );
}

export function GuideNotFound({ what, backTo, backLabel }) {
  return (
    <EmptyState
      character="student-bilal"
      tone="sun"
      title={`We couldn't find that ${what}`}
      body="It may have been renamed. Pick it again from the list."
      action={<LinkButton to={backTo}>{backLabel}</LinkButton>}
    />
  );
}

// A "before you leave the station" checklist a student can tick through.
// storageKey scopes it per guide (each guide's checklist is independent) —
// this is a personal, per-device convenience only, never synced or scored.
export function ChecklistWidget({ id, title, subtitle, items, storageKey }) {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // Ignore unreadable/corrupt storage — the checklist just starts unticked.
    }
  }, [storageKey]);

  function toggle(item) {
    setChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Best-effort only — this is a personal convenience, not real state.
      }
      return next;
    });
  }

  function reset() {
    setChecked({});
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }

  const done = items.filter((item) => checked[item]).length;

  return (
    <Panel id={id} className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Character name="examiner" size={48} tone="mint" />
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-s-ink">{title}</h2>
            <p className="text-sm text-s-mute">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="rounded-full bg-mint-soft px-3 py-1.5 font-chart text-xs text-s-good">{done} / {items.length}</span>
          <SecondaryButton onClick={reset}>
            <RotateCcw size={15} strokeWidth={2} aria-hidden="true" /> Reset
          </SecondaryButton>
        </div>
      </div>
      <ul className="mt-4 divide-y divide-s-line overflow-hidden rounded-2xl border border-s-line bg-s-card">
        {items.map((item) => (
          <li key={item}>
            <CheckRow checked={Boolean(checked[item])} onChange={() => toggle(item)}>
              <span className={checked[item] ? "text-s-mute line-through" : ""}>{item}</span>
            </CheckRow>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-s-mute">Saved on this device only. A personal pre-station check, not tracked or scored.</p>
    </Panel>
  );
}
