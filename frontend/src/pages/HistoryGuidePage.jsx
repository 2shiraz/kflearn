import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bone,
  Brain,
  CircleDot,
  Droplet,
  HeartPulse,
  Lightbulb,
  ListChecks,
  MessageCircle,
  RotateCcw,
  Ribbon,
  Scissors,
  ScrollText,
  Wind,
  Zap,
} from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageMain, Panel, RequireUser } from "../components/AppPage";
import {
  communicationSkills,
  coreMnemonics,
  generalApproach,
  getAdjacentTopics,
  getTopic,
  masterChecklist,
  presentationTemplate,
  topics,
  universalOpening,
} from "../data/historyTakingGuide";

const TOPIC_ICONS = { Bone, HeartPulse, Wind, Zap, Brain, Scissors, Droplet, CircleDot, Ribbon };

function TopicIcon({ name, ...props }) {
  const Icon = TOPIC_ICONS[name] || ScrollText;
  return <Icon {...props} />;
}

// One renderer for every content block type used across the guide (tables,
// bullet lists, letter/meaning definitions, and plain paragraphs), so the
// home page and every topic page stay visually consistent for free.
function GuideBlock({ block }) {
  if (block.type === "table") {
    return (
      <>
        {/* Phones: one stacked card per row — avoids hunting for a horizontal scrollbar on a 3-column table. */}
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
              <span className="gradient-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white">{letter}</span>
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
        <ul className="space-y-1.5">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-soft/60" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <p className="mt-3 text-sm text-ink-soft">{block.text}</p>;
}

function GuideSection({ heading, intro, blocks }) {
  return (
    <div className="mt-5 first:mt-0">
      {heading && <h3 className="font-bold text-ink">{heading}</h3>}
      {intro && <p className="mt-1 text-sm text-ink-soft">{intro}</p>}
      {blocks.map((block, index) => <GuideBlock key={index} block={block} />)}
    </div>
  );
}

function ExamTips({ tips }) {
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

function JumpNav({ items }) {
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

const CHECKLIST_STORAGE_KEY = "kf_guide_master_checklist";

function MasterChecklistWidget() {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // Ignore unreadable/corrupt storage — the checklist just starts unticked.
    }
  }, []);

  function toggle(item) {
    setChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Best-effort only — this is a personal convenience, not real state.
      }
      return next;
    });
  }

  function reset() {
    setChecked({});
    try {
      localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }

  return (
    <Panel id="master-checklist">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">{masterChecklist.title}</h2>
          <p className="text-sm text-ink-soft">{masterChecklist.subtitle}</p>
        </div>
        <button type="button" onClick={reset} className="glass-surface inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {masterChecklist.items.map((item) => (
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

export function HistoryGuideHome() {
  return (
    <RequireUser active="history">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide" }]} />

        <div className="mb-6">
          <p className="text-sm font-semibold text-ink-soft">Static reference</p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">History Taking Guide</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            The mnemonics, question sets, and differentials to run a focused history in any OSCE station.
          </p>
        </div>

        <JumpNav
          items={[
            { href: "#universal-opening", label: "Universal opening" },
            { href: "#core-mnemonics", label: "Core mnemonics" },
            { href: "#general-approach", label: "General approach" },
            { href: "#by-presentation", label: "By presenting complaint" },
            { href: "#communication-skills", label: "Communication skills" },
            { href: "#presentation-template", label: "Presentation template" },
            { href: "#master-checklist", label: "Master checklist" },
          ]}
        />

        <div className="grid gap-5">
          <Panel id="universal-opening">
            <h2 className="text-lg font-bold text-ink">{universalOpening.title}</h2>
            <p className="text-sm text-ink-soft">{universalOpening.subtitle}</p>
            <p className="mt-3 text-sm text-ink-soft">{universalOpening.intro}</p>
            <ol className="mt-3 space-y-2">
              {universalOpening.steps.map((step, index) => (
                <li key={step.label} className="flex gap-3 rounded-lg border border-line bg-white/80 p-3 text-sm">
                  <span className="gradient-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white">{index + 1}</span>
                  <span><span className="font-semibold text-ink">{step.label}</span> — <span className="text-ink-soft">{step.detail}</span></span>
                </li>
              ))}
            </ol>
            <ExamTips tips={[universalOpening.closing]} />
          </Panel>

          <div id="core-mnemonics">
            <h2 className="mb-3 text-lg font-bold text-ink">Core mnemonics</h2>
            <p className="mb-3 -mt-2 text-sm text-ink-soft">These three appear in every single station — memorise them first.</p>
            <div className="grid gap-5">
              {coreMnemonics.map((mnemonic) => (
                <Panel key={mnemonic.id}>
                  <h3 className="font-display text-xl font-extrabold text-ink">{mnemonic.name}</h3>
                  <p className="text-sm text-ink-soft">{mnemonic.subtitle}</p>
                  <GuideBlock block={mnemonic} />
                </Panel>
              ))}
            </div>
          </div>

          <Panel id="general-approach">
            <h2 className="text-lg font-bold text-ink">{generalApproach.title}</h2>
            <p className="text-sm text-ink-soft">{generalApproach.subtitle}</p>
            {generalApproach.sections.map((section) => (
              <GuideSection key={section.heading} {...section} />
            ))}
            <ExamTips tips={[generalApproach.examTip]} />
          </Panel>

          <div id="by-presentation">
            <h2 className="mb-1 text-lg font-bold text-ink">By presenting complaint</h2>
            <p className="mb-3 text-sm text-ink-soft">Station-specific extras on top of the core mnemonics above.</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topic) => (
                <Link key={topic.slug} to={`/history-taking/${topic.slug}`} className="gradient-card group block rounded-lg p-5">
                  <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                    <TopicIcon name={topic.icon} size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{topic.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{topic.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:underline">
                    Read guide <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <Panel id="communication-skills">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-ink-soft" />
              <h2 className="text-lg font-bold text-ink">{communicationSkills.title}</h2>
            </div>
            <p className="text-sm text-ink-soft">{communicationSkills.subtitle}</p>
            <GuideBlock block={{ type: "table", ...communicationSkills.table }} />
            <div className="mt-4 rounded-lg border border-line bg-white/60 p-3">
              <p className="text-sm font-bold text-ink">{communicationSkills.signposting.heading}</p>
              <p className="mt-1 text-sm text-ink-soft">{communicationSkills.signposting.intro}</p>
              <p className="mt-2 text-sm italic text-ink">"{communicationSkills.signposting.quote}"</p>
            </div>
          </Panel>

          <Panel id="presentation-template">
            <div className="flex items-center gap-2">
              <ScrollText size={18} className="text-ink-soft" />
              <h2 className="text-lg font-bold text-ink">{presentationTemplate.title}</h2>
            </div>
            <p className="mt-3 rounded-lg border border-line bg-white/60 p-4 text-sm italic leading-relaxed text-ink-soft">{presentationTemplate.text}</p>
          </Panel>

          <MasterChecklistWidget />
        </div>
      </PageMain>
    </RequireUser>
  );
}

export function HistoryGuideTopic() {
  const { topicSlug } = useParams();
  const topic = getTopic(topicSlug);

  if (!topic) {
    return (
      <RequireUser active="history">
        <PageMain>
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide", to: "/history-taking" }, { label: "Not found" }]} />
          <ErrorMessage message="That guide topic doesn't exist." />
          <Link to="/history-taking" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
            <ArrowLeft size={14} /> Back to the guide
          </Link>
        </PageMain>
      </RequireUser>
    );
  }

  const { prev, next } = getAdjacentTopics(topicSlug);

  return (
    <RequireUser active="history">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History Taking Guide", to: "/history-taking" }, { label: topic.title }]} />

        <div className="mb-6 flex items-start gap-4">
          <span className="gradient-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-ink">
            <TopicIcon name={topic.icon} size={26} />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-ink">{topic.title}</h1>
            <p className="mt-1 max-w-2xl text-ink-soft">{topic.summary}</p>
          </div>
        </div>

        <Panel>
          {topic.sections.map((section) => (
            <GuideSection key={section.heading} {...section} />
          ))}
          <ExamTips tips={topic.examTips} />
        </Panel>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <Link to={`/history-taking/${prev.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              <ArrowLeft size={14} /> {prev.title}
            </Link>
          ) : <span />}
          <Link to="/history-taking" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <ListChecks size={14} /> All topics
          </Link>
          {next ? (
            <Link to={`/history-taking/${next.slug}`} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
              {next.title} <ArrowRight size={14} />
            </Link>
          ) : <span />}
        </div>
      </PageMain>
    </RequireUser>
  );
}
