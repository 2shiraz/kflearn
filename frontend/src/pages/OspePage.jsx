import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Check, ClipboardCheck, Eye, EyeOff, PlayCircle, Shuffle, X } from "lucide-react";
import { Breadcrumbs, EmptyState, ErrorMessage, LinkButton, PageHeader, PageMain, Panel, PrimaryButton, RequireUser, SecondaryButton } from "../components/AppPage";
import { QuestionSkeleton } from "../components/Skeleton";
import { CheckRow, Chip, ChoicePills, Pager, PillLink, ProgressLine, ResultsSummary, SectionHeader, SetupCard, StepBar, TimerPill, Toggle, TopicCard, YEAR_TONES, YearCard, rise, scoreTone } from "../components/StudyKit";
import { MedIcon } from "../site/Illustrations";
import { plus } from "../site/siteContent";
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

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
        <PageHeader
          title="OSPE"
          description={`${plus(ospeTotalCount)} practical stations, each with a specimen or scenario, candidate tasks and the examiner checklist. Pick your year to begin.`}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ospeYears.map((year, i) => {
            const p = progressFor(progress, `ospe${year.year}-`, year.count);
            const tone = YEAR_TONES[(i + 1) % YEAR_TONES.length];
            return (
              <YearCard
                key={year.slug}
                to={`/ospe/${year.slug}`}
                name={year.name}
                blocks={year.blocks.map((b) => b.name).join(", ")}
                count={`${plus(year.count)} stations`}
                tone={tone}
                icon="microscope"
                index={i}
                progress={<ProgressLine value={p.attempted} total={year.count} tone={tone} caption={`${p.attempted} of ${year.count} attempted`} />}
              />
            );
          })}
        </div>
      </PageMain>
    </RequireUser>
  );
}

function NotFound({ backTo, backLabel }) {
  return (
    <EmptyState
      character="student-bilal"
      tone="sun"
      title="We couldn't find that section"
      body="It may have moved. Pick it again from the list."
      action={<LinkButton to={backTo}>{backLabel}</LinkButton>}
    />
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
        <PageMain><NotFound backTo="/ospe" backLabel="All years" /></PageMain>
      </RequireUser>
    );
  }

  const byTopic = (blockName, topicName) =>
    (stations || []).filter((s) => s.block === blockName && s.topic === topicName);

  return (
    <RequireUser active="ospe">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSPE", to: "/ospe" }, { label: year.name }]} />
        <PageHeader
          title={year.name}
          description="Read stations with their examiner checklists, or practise against the clock and mark yourself."
          actions={
            <LinkButton to={`/ospe/${year.slug}/practice`}>
              <Shuffle size={16} strokeWidth={2} aria-hidden="true" /> Mixed practice
            </LinkButton>
          }
        />

        <div className="space-y-10">
          {year.blocks.map((block, blockIndex) => {
            const prefix = `ospe${year.year}-${block.slug}-`;
            const bp = progressFor(progress, prefix, block.count);
            const tone = YEAR_TONES[(blockIndex + 1) % YEAR_TONES.length];
            return (
              <section key={block.slug}>
                <SectionHeader
                  tone={tone}
                  icon="microscope"
                  index={blockIndex}
                  name={block.name}
                  meta={`${plural(block.count, "station")} / ${plural(block.topics.length, "topic")}${bp.avg !== null ? ` / ${bp.avg}% average checklist score` : ""}`}
                  actions={
                    <>
                      <PillLink to={`/ospe/${year.slug}/read?block=${block.slug}`} icon={BookOpen}>Read section</PillLink>
                      <PillLink to={`/ospe/${year.slug}/practice?block=${block.slug}`} icon={PlayCircle}>Practise section</PillLink>
                    </>
                  }
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {block.topics.map((topic, topicIndex) => {
                    const attempted = topicProgress(progress, byTopic(block.name, topic.name));
                    const query = `block=${block.slug}&topic=${topic.slug}`;
                    return (
                      <TopicCard
                        key={topic.slug}
                        name={topic.name}
                        count={plural(topic.count, "station")}
                        tone={tone}
                        icon="microscope"
                        index={topicIndex}
                        done={attempted === topic.count}
                        progress={<ProgressLine value={attempted} total={topic.count} tone={tone} caption={`${attempted} of ${topic.count} attempted`} />}
                        readTo={`/ospe/${year.slug}/read?${query}`}
                        practiseTo={`/ospe/${year.slug}/practice?${query}`}
                      />
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

// The station card: specimen or scenario, then numbered candidate tasks.
function StationBody({ station, label }) {
  return (
    <>
      <p className="font-chart text-xs text-s-mute">{label}</p>
      <h2 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight text-s-ink">{station.t}</h2>
      <div className="mt-4 flex gap-3 rounded-2xl bg-mint-soft/70 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-s-card text-mint" aria-hidden="true">
          <MedIcon name="microscope" size={24} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-s-ink">Specimen or scenario</p>
          <p className="mt-1 leading-relaxed text-s-ink">{station.sc}</p>
        </div>
      </div>
      <p className="mt-5 text-sm font-medium text-s-ink">Candidate tasks</p>
      <ol className="mt-2.5 space-y-2.5">
        {station.tk.map((task, i) => (
          <li key={i} className="flex gap-3 leading-relaxed text-s-ink">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-s-accent-soft font-chart text-xs text-s-accent-strong" aria-hidden="true">{i + 1}</span>
            <span>{task}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function ChecklistBox({ title, children }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-mint/30 bg-s-card">
      <p className="flex items-center gap-2 bg-mint-soft px-4 py-3 text-sm font-medium text-s-ink">
        <ClipboardCheck size={16} strokeWidth={2} className="text-mint" aria-hidden="true" /> {title}
      </p>
      {children}
    </div>
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

  const title = topic?.name || block?.name || (year ? `${year.name}, all stations` : "OSPE");
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
  if (!valid) body = <NotFound backTo={year ? `/ospe/${year.slug}` : "/ospe"} backLabel="Back to sections" />;
  else if (error) body = <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  else if (!stations) body = <QuestionSkeleton options={4} label="Loading stations" />;
  else {
    body = (
      <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-chart text-xs text-s-mute">
            Stations {start + 1}-{Math.min(start + PAGE_SIZE, stations.length)} of {stations.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => { setHideChecklists((h) => !h); setRevealed({}); }}>
              {hideChecklists ? <Eye size={16} strokeWidth={2} aria-hidden="true" /> : <EyeOff size={16} strokeWidth={2} aria-hidden="true" />}
              {hideChecklists ? "Show all checklists" : "Hide checklists"}
            </SecondaryButton>
            <PillLink to={`/ospe/${yearSlug}/practice${query ? `?${query}` : ""}`} icon={PlayCircle} primary>Practise these</PillLink>
          </div>
        </div>

        <div className="max-w-3xl space-y-4">
          {pageStations.map((s, i) => {
            const show = !hideChecklists || revealed[s.id];
            return (
              <Panel key={s.id} className="site-rise" style={rise(i, 40)}>
                <StationBody station={s} label={`${s.block} / Station ${s.n}${!topic ? ` / ${s.topic}` : ""}`} />
                {show ? (
                  <ChecklistBox title="Examiner scoring checklist">
                    <ul className="divide-y divide-s-line">
                      {s.ck.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 px-4 py-3 text-sm leading-relaxed text-s-ink">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-s-card" aria-hidden="true">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </ChecklistBox>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, [s.id]: true }))}
                    className="site-press mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-mint-soft px-4 text-sm font-medium text-s-ink hover:bg-s-accent-soft"
                  >
                    <Eye size={15} strokeWidth={2} aria-hidden="true" /> Show checklist
                  </button>
                )}
              </Panel>
            );
          })}
        </div>

        <div className="max-w-3xl">
          <Pager page={page} totalPages={totalPages} onPage={goTo} />
        </div>
      </>
    );
  }

  return (
    <RequireUser active="ospe">
      <PageMain width="focused">
        <Breadcrumbs items={crumbs} />
        <h1 className="site-rise mb-8 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{title}</h1>
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

  const title = topic?.name || block?.name || (year ? `${year.name}, mixed practice` : "OSPE");
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
  if (!valid) body = <NotFound backTo={year ? `/ospe/${year.slug}` : "/ospe"} backLabel="Back to sections" />;
  else if (error) body = <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  else if (!pool) body = <QuestionSkeleton count={1} options={4} label="Loading stations" />;
  else if (!session) body = <Setup pool={pool} config={config} setConfig={setConfig} onStart={start} />;
  else if (session.finished) body = <Results session={session} onRestart={() => setSession(null)} backTo={`/ospe/${year.slug}`} />;
  else body = <Runner key={session.index} session={session} setSession={setSession} />;

  return (
    <RequireUser active="ospe">
      <PageMain width="focused">
        <Breadcrumbs items={crumbs} />
        <h1 className="site-rise mb-8 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{title}</h1>
        {body}
      </PageMain>
    </RequireUser>
  );
}

function Setup({ pool, config, setConfig, onStart }) {
  const countOptions = COUNT_OPTIONS.filter((n) => n === 0 || n < pool.length).map((n) => ({ value: n, label: n === 0 ? `All (${pool.length})` : String(n) }));
  const timeOptions = TIME_OPTIONS.map((m) => ({ value: m, label: m === 0 ? "Untimed" : `${m} min` }));
  return (
    <SetupCard
      character="examiner"
      tone="mint"
      available={`${plural(pool.length, "station")} available.`}
      hint="For each station, write or say your answers, then open the examiner checklist and tick what you covered."
      onStart={onStart}
    >
      <ChoicePills label="Number of stations" options={countOptions} value={config.count} onChange={(count) => setConfig({ ...config, count })} />
      <ChoicePills label="Time per station" options={timeOptions} value={config.minutes} onChange={(minutes) => setConfig({ ...config, minutes })} />
      <div className="mt-4">
        <Toggle checked={config.random} onChange={(random) => setConfig({ ...config, random })}>Shuffle station order</Toggle>
      </div>
    </SetupCard>
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
    <TimerPill level={left === 0 ? "over" : left <= 30 ? "warn" : "normal"}>
      {left === 0 ? "Time's up" : `${mm}:${ss}`}
    </TimerPill>
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

  const ticked = marks.filter(Boolean).length;

  return (
    <Panel className="site-rise md:p-8">
      <StepBar
        label={`Station ${index + 1} of ${stations.length} / ${s.topic}`}
        aside={session.minutes > 0 && <Countdown seconds={session.minutes * 60} running={phase === "attempt"} />}
        value={index + (phase === "mark" ? 0.5 : 0)}
        total={stations.length}
        tone="mint"
      />

      <div className="mt-6">
        <StationBody station={s} label={s.block} />
      </div>

      <label className="mt-5 block text-sm font-medium text-s-ink" htmlFor={`notes-${s.id}`}>
        Your answers <span className="font-normal text-s-mute">(optional, not saved)</span>
      </label>
      <textarea
        id={`notes-${s.id}`}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        readOnly={phase === "mark"}
        className="mt-2 w-full rounded-xl border border-s-line bg-s-card p-3 text-sm text-s-ink outline-none transition-colors placeholder:text-s-mute focus:border-s-accent read-only:bg-s-tint/50"
        placeholder="Write your answer to each task..."
      />

      {phase === "mark" && (
        <ChecklistBox title="Examiner checklist. Tick each point you covered.">
          <ul className="divide-y divide-s-line">
            {s.ck.map((item, i) => (
              <li key={i}>
                <CheckRow checked={marks[i]} onChange={() => toggle(i)}>{item}</CheckRow>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-s-line bg-s-page px-4 py-3">
            <span className="text-sm text-s-mute">Points covered</span>
            <span aria-live="polite" className="font-chart text-sm text-s-ink">{ticked} / {s.ck.length}</span>
          </div>
        </ChecklistBox>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSession({ ...session, finished: true })}
          className="min-h-11 rounded-full px-3 text-sm font-medium text-s-mute hover:bg-s-tint/70 hover:text-s-ink"
        >
          End session
        </button>
        {phase === "attempt" ? (
          <PrimaryButton onClick={() => setSession({ ...session, phase: "mark" })}>
            <ClipboardCheck size={16} strokeWidth={2} aria-hidden="true" /> Show checklist
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={submitMarks}>
            {isLast ? "Save and see results" : <>Save and next station <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></>}
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
      <ResultsSummary
        pct={pct}
        title="checklist"
        detail={`${got} of ${total} checklist points across ${plural(marked.length, "station")}.`}
        onRestart={onRestart}
        backTo={backTo}
      />

      {scored.length > 0 && (
        <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-s-ink">Review</h2>
            <Toggle checked={showAll} onChange={setShowAll}>Show full-mark stations too</Toggle>
          </div>
          {review.length === 0 && (
            <p className="mt-3 flex items-center gap-3 rounded-2xl bg-mint-soft p-3.5 text-sm text-s-ink">
              <Check size={16} strokeWidth={2.5} className="text-mint" aria-hidden="true" /> Every checklist point covered. Nothing to review.
            </p>
          )}
          <ol className="mt-4 space-y-3">
            {review.map(({ s, got: g, total: t, ticks }) => (
              <li key={s.id} className="rounded-2xl border border-s-line bg-s-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium leading-snug text-s-ink">{s.t}</p>
                  <Chip className={`shrink-0 ${scoreTone(t ? Math.round((g / t) * 100) : 0).chip}`}>{g}/{t}</Chip>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {s.ck.map((item, i) => (
                    <li key={i} className={`flex gap-2 ${ticks[i] ? "text-s-good" : "text-s-miss"}`}>
                      {ticks[i] ? <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-label="Covered" /> : <X size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-label="Missed" />}
                      <span>{item}</span>
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
