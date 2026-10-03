import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, ClipboardCheck, Eye, EyeOff, GraduationCap,
  Layers, Microscope, PlayCircle, RotateCcw, Shuffle, Timer,
} from "lucide-react";
import { Breadcrumbs, ErrorMessage, LinkButton, PageMain, Panel, PrimaryButton, RequireUser } from "../components/AppPage";
import { getBlock, getYear, loadStations, ospeTotalCount, ospeYears } from "../data/ospe";

// OSPE section — mirrors the MCQs section (years -> modules/blocks -> topics, with
// Read and Practise modes). Practice is self-marked: the student attempts the
// station, then ticks the examiner checklist items they covered.

// ---- local progress (per browser; practice only, not a graded record) ----
// { [stationId]: fraction of checklist items ticked on the latest attempt, 0..1 }
const PROGRESS_KEY = "kf_ospe_progress";

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveScore(stationId, fraction) {
  const progress = readProgress();
  progress[stationId] = fraction;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // storage full or blocked: practice still works, progress just isn't kept
  }
}

// Station ids look like "ospe1-foundation-7"; prefix filters a year or a block.
function progressFor(progress, prefix, total) {
  let attempted = 0;
  let sum = 0;
  for (const [id, value] of Object.entries(progress)) {
    if (id.startsWith(prefix)) {
      attempted += 1;
      sum += value;
    }
  }
  return { attempted: Math.min(attempted, total), avg: attempted ? Math.round((sum / attempted) * 100) : null };
}

// Topic progress needs the topic's station ids, which only exist once the year file
// is loaded, so the year page loads it once and counts per topic.
function topicProgress(progress, stations) {
  let attempted = 0;
  for (const s of stations) if (progress[s.id] !== undefined) attempted += 1;
  return attempted;
}

function ProgressBar({ attempted, total }) {
  const pct = total ? Math.round((attempted / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
        <div className="gradient-brand h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-soft">{attempted} of {total} attempted</p>
    </div>
  );
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Same card palettes as the MCQs and dashboard cards (.gradient-card / .gradient-icon).
const PALETTES = [
  { "--g1": "#7FE0C0", "--g2": "#B0F0DA", "--glow": "rgba(127,224,192,0.35)" },
  { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
  { "--g1": "#C6A6FF", "--g2": "#DCC8FF", "--glow": "rgba(198,166,255,0.35)" },
];
const palette = (i) => PALETTES[i % PALETTES.length];
const stagger = (i) => ({ animationDelay: `${80 + i * 60}ms` });

function CountPill({ children }) {
  return <span className="gradient-pill rounded-lg px-3 py-1.5 text-xs font-semibold text-ink">{children}</span>;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function useStations(yearSlug, blockSlug, topicSlug) {
  const [stations, setStations] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setStations(null);
    setError("");
    loadStations(yearSlug, blockSlug, topicSlug)
      .then((list) => {
        if (!active) return;
        if (!list.length) setError("No stations found for this selection.");
        setStations(list);
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [yearSlug, blockSlug, topicSlug]);
  return { stations, error };
}

// ---- /ospe ----
export function OspeHome() {
  const progress = readProgress();
  return (
    <RequireUser active="ospe">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSPE" }]} />
        <div className="mb-6 animate-fade-up">
          <p className="text-sm font-semibold text-ink-soft">OSPE</p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">Station bank</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            {ospeTotalCount.toLocaleString()} Objective Structured Practical Examination stations — specimen or scenario,
            candidate tasks and examiner checklist. Choose your year to begin.
          </p>
        </div>
        <p className="mb-3 text-sm text-ink-soft">{ospeYears.length} years available.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ospeYears.map((year, i) => {
            const p = progressFor(progress, `ospe${year.year}-`, year.count);
            return (
              <Link
                key={year.slug}
                to={`/ospe/${year.slug}`}
                style={{ ...palette(i), ...stagger(i) }}
                className="gradient-card group flex animate-fade-up flex-col rounded-lg p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Year</p>
                    <h2 className="text-2xl font-extrabold text-ink">{year.name}</h2>
                  </div>
                  <span className="gradient-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <GraduationCap size={18} />
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{year.blocks.map((b) => b.name).join(" · ")}</p>
                <ProgressBar attempted={p.attempted} total={year.count} />
                <div className="mt-4 flex items-center justify-between">
                  <CountPill>{year.count} stations</CountPill>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    Open <ChevronRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </PageMain>
    </RequireUser>
  );
}

// ---- /ospe/:yearSlug ----
export function OspeYearPage() {
  const { yearSlug } = useParams();
  const year = getYear(yearSlug);
  const progress = readProgress();
  const { stations } = useStations(year ? yearSlug : "", "", "");

  if (!year) {
    return (
      <RequireUser active="ospe">
        <PageMain><ErrorMessage message="This year was not found." /></PageMain>
      </RequireUser>
    );
  }

  const byTopic = (blockName, topicName) =>
    (stations || []).filter((s) => s.block === blockName && s.topic === topicName);

  return (
    <RequireUser active="ospe">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSPE", to: "/ospe" }, { label: year.name }]} />
        <div className="mb-6 flex animate-fade-up flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-soft">OSPE</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ink">{year.name}</h1>
            <p className="mt-2 text-ink-soft">Read stations with their examiner checklists, or practise them against the clock and mark yourself.</p>
          </div>
          <LinkButton to={`/ospe/${year.slug}/practice`}>
            <Shuffle className="mr-2 h-4 w-4" /> Mixed practice
          </LinkButton>
        </div>

        <div className="space-y-8">
          {year.blocks.map((block, blockIndex) => {
            const prefix = `ospe${year.year}-${block.slug}-`;
            const bp = progressFor(progress, prefix, block.count);
            return (
              <section key={block.slug} className="animate-fade-up" style={stagger(blockIndex)}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span style={palette(blockIndex)} className="gradient-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink">
                      <Layers size={19} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Section</p>
                      <h2 className="text-2xl font-extrabold text-ink">{block.name}</h2>
                      <p className="text-sm text-ink-soft">
                        {block.count} stations · {block.topics.length} topics
                        {bp.avg !== null ? ` · ${bp.avg}% average checklist score` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/ospe/${year.slug}/read?block=${block.slug}`}
                      className="glass-surface inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                    >
                      <BookOpen size={16} /> Read section
                    </Link>
                    <Link
                      to={`/ospe/${year.slug}/practice?block=${block.slug}`}
                      className="glass-surface inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                    >
                      <PlayCircle size={16} /> Practise section
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {block.topics.map((topic, topicIndex) => {
                    const attempted = topicProgress(progress, byTopic(block.name, topic.name));
                    const query = `block=${block.slug}&topic=${topic.slug}`;
                    const done = attempted === topic.count;
                    return (
                      <div
                        key={topic.slug}
                        style={{ ...palette(blockIndex + topicIndex), ...stagger(topicIndex) }}
                        className="gradient-card group flex animate-fade-up flex-col rounded-lg p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Topic</p>
                            <h3 className="text-lg font-extrabold leading-snug text-ink">{topic.name}</h3>
                          </div>
                          <span className="gradient-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                            {done ? <CheckCircle2 size={18} /> : <Microscope size={18} />}
                          </span>
                        </div>
                        <ProgressBar attempted={attempted} total={topic.count} />
                        <div className="mt-4 flex items-center justify-between gap-2 pt-1 md:mt-auto">
                          <CountPill>{plural(topic.count, "station")}</CountPill>
                          <div className="flex gap-2">
                            <Link
                              to={`/ospe/${year.slug}/read?${query}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/80 px-3 py-1.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
                            >
                              <BookOpen size={14} /> Read
                            </Link>
                            <Link
                              to={`/ospe/${year.slug}/practice?${query}`}
                              className="gradient-brand inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                            >
                              <PlayCircle size={14} /> Practise
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </PageMain>
    </RequireUser>
  );
}

function useSelection() {
  const { yearSlug } = useParams();
  const [params] = useSearchParams();
  const blockSlug = params.get("block") || "";
  const topicSlug = params.get("topic") || "";
  const year = getYear(yearSlug);
  const block = blockSlug ? getBlock(yearSlug, blockSlug) : null;
  const topic = block?.topics.find((t) => t.slug === topicSlug) || null;
  const valid = year && !(blockSlug && !block) && !(topicSlug && !topic);
  return { yearSlug, blockSlug, topicSlug, year, block, topic, valid, query: params.toString() };
}

function StationBody({ station, label }) {
  return (
    <>
      <p className="text-xs text-ink-soft">{label}</p>
      <h2 className="mt-1 text-xl font-extrabold leading-snug text-ink">{station.t}</h2>
      <div className="mt-3 rounded-lg bg-white/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Specimen / Scenario</p>
        <p className="mt-1 leading-relaxed text-ink">{station.sc}</p>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Candidate tasks</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-ink">
        {station.tk.map((task, i) => <li key={i} className="leading-relaxed">{task}</li>)}
      </ol>
    </>
  );
}

// ---- /ospe/:yearSlug/read?block=&topic= ----
// Study mode: every station shown with its examiner checklist. Nothing is scored.
const PAGE_SIZE = 10;

export function OspeRead() {
  const { yearSlug, blockSlug, topicSlug, year, block, topic, valid, query } = useSelection();
  const { stations, error } = useStations(valid ? yearSlug : "", blockSlug, topicSlug);
  const [page, setPage] = useState(1);
  const [hideChecklists, setHideChecklists] = useState(false);
  const [revealed, setRevealed] = useState({});

  useEffect(() => { setPage(1); setRevealed({}); }, [yearSlug, blockSlug, topicSlug]);

  const title = topic?.name || block?.name || (year ? `${year.name} — all stations` : "OSPE");
  const crumbs = [
    { label: "Home", to: "/dashboard" },
    { label: "OSPE", to: "/ospe" },
    ...(year ? [{ label: year.name, to: `/ospe/${year.slug}` }] : []),
    { label: `${title} (read)` },
  ];

  const totalPages = stations ? Math.max(1, Math.ceil(stations.length / PAGE_SIZE)) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageStations = stations ? stations.slice(start, start + PAGE_SIZE) : [];

  function goTo(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let body;
  if (!valid) body = <ErrorMessage message="This section was not found." />;
  else if (error) body = <ErrorMessage message={error} />;
  else if (!stations) body = <Panel><p className="text-ink-soft">Loading stations…</p></Panel>;
  else {
    body = (
      <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Stations {start + 1}–{Math.min(start + PAGE_SIZE, stations.length)} of {stations.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setHideChecklists((h) => !h); setRevealed({}); }}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-white"
            >
              {hideChecklists ? <Eye size={16} /> : <EyeOff size={16} />}
              {hideChecklists ? "Show all checklists" : "Hide checklists"}
            </button>
            <Link
              to={`/ospe/${yearSlug}/practice${query ? `?${query}` : ""}`}
              className="gradient-brand inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
            >
              <PlayCircle size={16} /> Practise these
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {pageStations.map((s) => {
            const show = !hideChecklists || revealed[s.id];
            return (
              <Panel key={s.id}>
                <StationBody station={s} label={`${s.block} · Station ${s.n}${!topic ? ` · ${s.topic}` : ""}`} />
                {show ? (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Examiner scoring checklist</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-ink">
                      {s.ck.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, [s.id]: true }))}
                    className="mt-4 text-sm font-semibold text-brand hover:underline"
                  >
                    Show checklist
                  </button>
                )}
              </Panel>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => goTo(page - 1)}
              className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <span className="text-sm text-ink-soft">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => goTo(page + 1)}
              className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <RequireUser active="ospe">
      <PageMain>
        <Breadcrumbs items={crumbs} />
        <h1 className="mb-5 text-3xl font-extrabold text-ink">{title}</h1>
        {body}
      </PageMain>
    </RequireUser>
  );
}

// ---- /ospe/:yearSlug/practice?block=&topic= ----
const COUNT_OPTIONS = [5, 10, 20, 0]; // 0 = all
const TIME_OPTIONS = [3, 5, 0]; // minutes per station; 0 = untimed

export function OspePractice() {
  const { yearSlug, blockSlug, topicSlug, year, block, topic, valid } = useSelection();
  const { stations: pool, error } = useStations(valid ? yearSlug : "", blockSlug, topicSlug);
  const [config, setConfig] = useState({ count: 5, random: true, minutes: 5 });
  const [session, setSession] = useState(null); // { stations, index, phase: "attempt"|"mark", ticks: {id: [bool]}, marked: [id], finished }

  useEffect(() => { setSession(null); }, [yearSlug, blockSlug, topicSlug]);

  const title = topic?.name || block?.name || (year ? `${year.name} — mixed` : "OSPE");
  const crumbs = [
    { label: "Home", to: "/dashboard" },
    { label: "OSPE", to: "/ospe" },
    ...(year ? [{ label: year.name, to: `/ospe/${year.slug}` }] : []),
    { label: title },
  ];

  function start() {
    const ordered = config.random ? shuffle(pool) : pool;
    const stations = config.count ? ordered.slice(0, config.count) : ordered;
    setSession({ stations, index: 0, phase: "attempt", ticks: {}, marked: [], finished: false, minutes: config.minutes });
  }

  let body;
  if (!valid) body = <ErrorMessage message="This section was not found." />;
  else if (error) body = <ErrorMessage message={error} />;
  else if (!pool) body = <Panel><p className="text-ink-soft">Loading stations…</p></Panel>;
  else if (!session) body = <Setup pool={pool} config={config} setConfig={setConfig} onStart={start} />;
  else if (session.finished) body = <Results session={session} onRestart={() => setSession(null)} backTo={`/ospe/${year.slug}`} />;
  else body = <Runner key={session.index} session={session} setSession={setSession} />;

  return (
    <RequireUser active="ospe">
      <PageMain>
        <Breadcrumbs items={crumbs} />
        <h1 className="mb-5 text-3xl font-extrabold text-ink">{title}</h1>
        {body}
      </PageMain>
    </RequireUser>
  );
}

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold ${selected ? "border-brand bg-brand/10 text-ink" : "border-line text-ink-soft"}`}
    >
      {children}
    </button>
  );
}

function Setup({ pool, config, setConfig, onStart }) {
  return (
    <Panel className="max-w-xl">
      <p className="text-ink-soft">{plural(pool.length, "station")} available.</p>
      <p className="mt-5 text-sm font-semibold text-ink">Number of stations</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COUNT_OPTIONS.filter((n) => n === 0 || n < pool.length).map((n) => (
          <OptionButton key={n} selected={config.count === n} onClick={() => setConfig({ ...config, count: n })}>
            {n === 0 ? `All (${pool.length})` : n}
          </OptionButton>
        ))}
      </div>
      <p className="mt-5 text-sm font-semibold text-ink">Time per station</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TIME_OPTIONS.map((m) => (
          <OptionButton key={m} selected={config.minutes === m} onClick={() => setConfig({ ...config, minutes: m })}>
            {m === 0 ? "Untimed" : `${m} min`}
          </OptionButton>
        ))}
      </div>
      <label className="mt-5 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={config.random} onChange={(e) => setConfig({ ...config, random: e.target.checked })} />
        Shuffle station order
      </label>
      <p className="mt-5 text-sm text-ink-soft">
        For each station, write or say your answers, then open the examiner checklist and tick what you covered.
      </p>
      <PrimaryButton className="mt-6" onClick={onStart}>Start practice</PrimaryButton>
    </Panel>
  );
}

function Countdown({ seconds, running }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!running || left <= 0) return undefined;
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [running, left]);
  const mm = String(Math.floor(left / 60)).padStart(1, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums ${left === 0 ? "bg-rose-100 text-rose-700" : left <= 30 ? "bg-amber-100 text-amber-800" : "bg-white/80 text-ink"}`}>
      <Timer size={14} /> {left === 0 ? "Time's up" : `${mm}:${ss}`}
    </span>
  );
}

function Runner({ session, setSession }) {
  const { stations, index, phase, ticks } = session;
  const s = stations[index];
  const isLast = index === stations.length - 1;
  const marks = ticks[s.id] || s.ck.map(() => false);
  const [notes, setNotes] = useState("");

  function toggle(i) {
    const next = [...marks];
    next[i] = !next[i];
    setSession({ ...session, ticks: { ...ticks, [s.id]: next } });
  }

  function submitMarks() {
    const score = marks.filter(Boolean).length / s.ck.length;
    saveScore(s.id, score);
    const marked = session.marked.includes(s.id) ? session.marked : [...session.marked, s.id];
    const newTicks = { ...ticks, [s.id]: marks };
    if (isLast) setSession({ ...session, ticks: newTicks, marked, finished: true });
    else setSession({ ...session, ticks: newTicks, marked, index: index + 1, phase: "attempt" });
  }

  return (
    <Panel className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
        <span>Station {index + 1} of {stations.length} · {s.topic}</span>
        {session.minutes > 0 && <Countdown seconds={session.minutes * 60} running={phase === "attempt"} />}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
        <div className="gradient-brand h-full" style={{ width: `${((index + (phase === "mark" ? 0.5 : 0)) / stations.length) * 100}%` }} />
      </div>

      <div className="mt-5">
        <StationBody station={s} label={s.block} />
      </div>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-soft" htmlFor={`notes-${s.id}`}>
        Your answers (optional, not saved)
      </label>
      <textarea
        id={`notes-${s.id}`}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        readOnly={phase === "mark"}
        className="mt-1 w-full rounded-lg border border-line bg-white/80 p-3 text-sm text-ink focus:border-brand focus:outline-none"
        placeholder="Write your answer to each task…"
      />

      {phase === "mark" && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-ink">Examiner checklist — tick each point you covered</p>
          <ul className="mt-3 space-y-2">
            {s.ck.map((item, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={marks[i]} onChange={() => toggle(i)} />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-ink">
            {marks.filter(Boolean).length} / {s.ck.length} points
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSession({ ...session, finished: true })}
          className="text-sm font-semibold text-ink-soft underline underline-offset-2"
        >
          End session
        </button>
        {phase === "attempt" ? (
          <PrimaryButton onClick={() => setSession({ ...session, phase: "mark" })}>
            <span className="inline-flex items-center"><ClipboardCheck className="mr-2 h-4 w-4" />Show checklist</span>
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={submitMarks}>
            {isLast ? "Save & see results" : <span className="inline-flex items-center">Save & next station <ArrowRight className="ml-1 h-4 w-4" /></span>}
          </PrimaryButton>
        )}
      </div>
    </Panel>
  );
}

function Results({ session, onRestart, backTo }) {
  const [showAll, setShowAll] = useState(false);
  const marked = session.stations.filter((s) => session.marked.includes(s.id));
  const scored = marked.map((s) => {
    const t = session.ticks[s.id] || [];
    return { s, got: t.filter(Boolean).length, total: s.ck.length, ticks: t };
  });
  const got = scored.reduce((a, x) => a + x.got, 0);
  const total = scored.reduce((a, x) => a + x.total, 0);
  const pct = total ? Math.round((got / total) * 100) : 0;
  const review = useMemo(() => (showAll ? scored : scored.filter((x) => x.got < x.total)), [showAll, scored]);

  return (
    <div className="max-w-3xl space-y-4">
      <Panel>
        <p className="text-sm text-ink-soft">Your checklist score</p>
        <p className="text-4xl font-extrabold text-ink">{pct}%</p>
        <p className="mt-1 text-ink-soft">{got} of {total} checklist points across {plural(marked.length, "station")}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <PrimaryButton onClick={onRestart}><span className="inline-flex items-center"><RotateCcw className="mr-2 h-4 w-4" />Practise again</span></PrimaryButton>
          <Link to={backTo} className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to sections
          </Link>
        </div>
      </Panel>

      {scored.length > 0 && (
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-ink">Review</h2>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show full-mark stations too
            </label>
          </div>
          {review.length === 0 && <p className="mt-3 text-ink-soft">Every checklist point covered — nothing to review.</p>}
          <ol className="mt-3 space-y-4">
            {review.map(({ s, got: g, total: t, ticks }) => (
              <li key={s.id} className="border-t border-line pt-3">
                <p className="font-semibold text-ink">{s.t} <span className="font-normal text-ink-soft">· {g}/{t}</span></p>
                <ul className="mt-1 space-y-1 text-sm">
                  {s.ck.map((item, i) => (
                    <li key={i} className={ticks[i] ? "text-emerald-700" : "text-rose-700"}>
                      {ticks[i] ? "✓" : "✗"} {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
