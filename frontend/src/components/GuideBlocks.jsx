// Shared content-block renderer for the static study guides (History Taking,
// Clinical Examination, ...). One schema — table / definitions / list /
// paragraph / callout — so every guide page stays visually consistent and
// new guides don't need their own renderer written from scratch.
import { useEffect, useState } from "react";
import { Lightbulb, RotateCcw } from "lucide-react";
import { Panel } from "./AppPage";

export function GuideBlock({ block }) {
  if (block.type === "table") {
    return (
      <>
        {/* Phones: one stacked card per row — avoids hunting for a horizontal scrollbar on a multi-column table. */}
        <div className="mt-3 space-y-2 sm:hidden">
          {block.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="rounded-lg border border-line bg-white/60 p-3 text-sm">
              <p className="font-semibold text-ink">{row[0]}</p>
              {row.slice(1).map((cell, cellIndex) => (
                <p key={cellIndex} className="mt-1 text-ink-soft">
                  <span className="font-medium text-ink">{block.columns[cellIndex + 1]}: </span>
                  {cell}
                </p>
              ))}
            </div>
          ))}
        </div>
        {/* Tablet and up: a real table, room enough that it doesn't need to scroll. */}
        <div className="mt-3 hidden overflow-x-auto rounded-lg border border-line sm:block">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-white/60">
                {block.columns.map((column) => (
                  <th key={column} className="px-3 py-2 font-bold text-ink">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-line/70 bg-white/40 last:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`px-3 py-2 align-top ${cellIndex === 0 ? "font-semibold text-ink" : "text-ink-soft"}`}>{cell}</td>
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
            <div key={`${item.term}-${index}`} className="flex gap-3 rounded-lg border border-line bg-white/60 p-3 text-sm">
              <span className="gradient-brand flex h-7 min-w-7 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-1.5 text-xs font-extrabold text-white">{letter}</span>
              <span className="text-ink-soft">{word && <span className="font-semibold text-ink">{word}: </span>}{item.detail}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <div className="mt-3">
        {block.heading && <p className="mb-1.5 text-sm font-bold text-ink">{block.heading}</p>}
        <ul className={`space-y-1.5 ${block.ordered ? "list-decimal pl-4" : ""}`}>
          {block.items.map((item, index) => (
            <li key={index} className={block.ordered ? "pl-1 text-sm text-ink-soft marker:font-semibold marker:text-ink" : "flex gap-2 text-sm text-ink-soft"}>
              {!block.ordered && <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-soft/60" />}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Inline tip, placed exactly where the source calls it out — as opposed to
  // ExamTips below, which collects a page/topic's tips at the end instead.
  if (block.type === "callout") {
    return (
      <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <Lightbulb size={16} className="mt-0.5 shrink-0" />
        <span>{block.text}</span>
      </div>
    );
  }

  return <p className="mt-3 text-sm text-ink-soft">{block.text}</p>;
}

export function GuideSection({ heading, intro, blocks }) {
  return (
    <div className="mt-5 first:mt-0">
      {heading && <h3 className="font-bold text-ink">{heading}</h3>}
      {intro && <p className="mt-1 text-sm text-ink-soft">{intro}</p>}
      {blocks.map((block, index) => <GuideBlock key={index} block={block} />)}
    </div>
  );
}

export function ExamTips({ tips }) {
  if (!tips || tips.length === 0) return null;
  return (
    <div className="mt-5 space-y-2">
      {tips.map((tip, index) => (
        <div key={index} className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Lightbulb size={16} className="mt-0.5 shrink-0" />
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}

export function JumpNav({ items }) {
  return (
    <nav aria-label="Jump to section" className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="glass-surface rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink"
        >
          {item.label}
        </a>
      ))}
    </nav>
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

  return (
    <Panel id={id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="text-sm text-ink-soft">{subtitle}</p>
        </div>
        <button type="button" onClick={reset} className="glass-surface inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer gap-3 rounded-lg border border-line bg-white/80 p-3 text-sm">
            <input type="checkbox" checked={Boolean(checked[item])} onChange={() => toggle(item)} className="mt-0.5" />
            <span className={checked[item] ? "text-ink-soft line-through" : "text-ink"}>{item}</span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft/80">Saved on this device only — a personal pre-station check, not tracked or scored.</p>
    </Panel>
  );
}
