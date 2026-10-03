import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Flame, History, Timer, Trophy } from "lucide-react";
import { EmptyState, ErrorMessage, LinkButton, PageHeader, PageMain, Panel, RequireUser } from "../components/AppPage";
import { ProgressSkeleton } from "../components/Skeleton";
import { Chip, ProgressLine, rise, scoreTone } from "../components/StudyKit";
import { listOsceAttempts, listOsceStations } from "../lib/api";
import { displayTitle } from "../lib/osceFilters";
import { mcqSummary, osceSummary, ospeSummary } from "../lib/progress";
import { MedIcon } from "../site/Illustrations";
import { TONES, specialtyLook } from "../site/tones";

const sectionPath = (name) => `/stations/section/${encodeURIComponent(name)}`;
const plural = (n, word) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function ProgressPage() {
  const [state, setState] = useState({ loading: true, attempts: [], stations: [], error: "" });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    // With the OSCE section switched off the station bank answers 403; show
    // the rest of the progress rather than an error.
    const closedAsEmpty = (empty) => (err) => { if (err.code === "SECTION_CLOSED") return empty; throw err; };
    Promise.all([listOsceAttempts(), listOsceStations().catch(closedAsEmpty({ modules: [] }))])
      .then(([attempts, stations]) => setState({ loading: false, attempts: attempts || [], stations: stations.modules || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const osce = useMemo(() => osceSummary(state.attempts, state.stations), [state.attempts, state.stations]);
  const mcq = useMemo(() => mcqSummary(), []);
  const ospe = useMemo(() => ospeSummary(), []);
  const nothingYet = osce.count === 0 && mcq.answered === 0 && ospe.attempted === 0;

  return (
    <RequireUser active="progress">
      <PageMain>
        <PageHeader title="Progress" description="Your scores, coverage and the areas to work on next." />
        {state.loading && <ProgressSkeleton label="Loading your progress" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {!state.loading && !state.error && (nothingYet ? (
          <EmptyState
            character="student-ayesha"
            title="Nothing to show yet"
            body="Mark an OSCE station, answer some MCQs or practise OSPE stations, and your progress will build up here."
            action={<LinkButton to="/stations">Start a station <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></LinkButton>}
          />
        ) : (
          <div className="space-y-10">
            <Overview osce={osce} mcq={mcq} ospe={ospe} />
            {osce.count > 0 && <SpecialtyGrid specialties={osce.specialties} />}
            <div className="grid gap-5 lg:grid-cols-2">
              <MissedItems items={osce.missedItems} attempts={osce.count} />
              <RecentAttempts attempts={osce.recent} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <McqPanel mcq={mcq} />
              <OspePanel ospe={ospe} />
            </div>
            <p className="text-xs text-s-mute">OSCE results come from your marked attempts. MCQ and OSPE practice is saved in this browser, so it won't show on another device.</p>
          </div>
        ))}
      </PageMain>
    </RequireUser>
  );
}

// ---- Overview bento: OSCE score card, three stat tiles and a "focus next" tile ----
function Overview({ osce, mcq, ospe }) {
  const delta = osce.recentAvg !== null && osce.previousAvg !== null ? osce.recentAvg - osce.previousAvg : null;
  return (
    <section aria-label="Overview" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div className="site-rise relative flex flex-col overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent md:col-span-2 lg:row-span-2 sm:p-7">
        <p className="text-sm font-medium text-s-on-accent/80">OSCE average, last {Math.min(osce.count, 10)} stations</p>
        <div className="mt-2 flex items-end gap-3">
          <p className="text-6xl font-semibold tracking-tight">{osce.recentAvg ?? "-"}<span className="text-3xl">{osce.recentAvg !== null ? "%" : ""}</span></p>
          {delta !== null && delta !== 0 && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-s-on-accent/15 px-2.5 py-1 font-chart text-xs">
              {delta > 0 ? <ArrowUpRight size={14} strokeWidth={2.25} aria-hidden="true" /> : <ArrowDownRight size={14} strokeWidth={2.25} aria-hidden="true" />}
              {delta > 0 ? "+" : ""}{delta} vs the 10 before
            </span>
          )}
        </div>
        <Trend values={osce.trend} />
        <div className="mt-auto grid grid-cols-3 gap-3 pt-6 text-sm">
          <Fact icon={Trophy} label="Best" value={osce.best !== null ? `${osce.best}%` : "-"} />
          <Fact icon={Flame} label="Day streak" value={osce.streak} />
          <Fact icon={Timer} label="Minutes practised" value={osce.minutes.toLocaleString()} />
        </div>
      </div>

      <StatTile index={1} icon="stethoscope" tone="indigo" label="OSCE stations done" value={osce.uniqueCount} of={osce.stationTotal}>
        <WeekBars weeks={osce.weeks} />
      </StatTile>
      <StatTile index={2} icon="books" tone="sky" label="MCQs answered" value={mcq.answered} detail={mcq.accuracy !== null ? `${mcq.accuracy}% correct` : "None answered yet"} />
      <StatTile index={3} icon="microscope" tone="mint" label="OSPE stations practised" value={ospe.attempted} detail={ospe.avg !== null ? `${ospe.avg}% checklist average` : "None practised yet"} />
      <FocusTile osce={osce} mcq={mcq} />
    </section>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-s-on-accent/10 p-3">
      <Icon size={15} strokeWidth={2} className="text-s-on-accent/75" aria-hidden="true" />
      <p className="mt-2 text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-xs text-s-on-accent/75">{label}</p>
    </div>
  );
}

// Score trend line (0 to 100) for the last 20 marked stations.
function Trend({ values }) {
  if (values.length < 2) {
    return <p className="mt-6 text-sm text-s-on-accent/75">Mark one more station to see your trend.</p>;
  }
  const w = 320;
  const h = 96;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => [i * step, h - (v / 100) * h]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const last = points[points.length - 1];
  return (
    <figure className="mt-6">
      <svg viewBox={`-4 -6 ${w + 8} ${h + 12}`} className="h-28 w-full" role="img" aria-label={`Scores for your last ${values.length} stations, from ${values[0]}% to ${values[values.length - 1]}%`}>
        <line x1="0" x2={w} y1={h * 0.3} y2={h * 0.3} className="stroke-s-on-accent/25" strokeDasharray="3 5" />
        <polygon points={area} className="fill-s-on-accent/10" />
        <polyline points={line} fill="none" className="stroke-s-on-accent" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={last[0]} cy={last[1]} r="4.5" className="fill-s-on-accent" />
      </svg>
      <figcaption className="mt-1 flex justify-between font-chart text-[11px] text-s-on-accent/70">
        <span>Older</span>
        <span>Dashed line: 70%</span>
        <span>Latest</span>
      </figcaption>
    </figure>
  );
}

function StatTile({ index, icon, tone, label, value, of, detail, children }) {
  const t = TONES[tone];
  return (
    <Panel className="site-rise flex flex-col" style={rise(index)}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${t.soft}`} aria-hidden="true">
        <MedIcon name={icon} size={26} />
      </span>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-s-ink">
        {value.toLocaleString()}
        {of ? <span className="text-base font-medium text-s-mute"> / {of.toLocaleString()}</span> : null}
      </p>
      <p className="text-sm text-s-mute">{label}</p>
      {detail && <p className="mt-3 font-chart text-xs text-s-ink">{detail}</p>}
      {children}
    </Panel>
  );
}

// Stations marked per week, last 8 weeks.
function WeekBars({ weeks }) {
  const max = Math.max(1, ...weeks);
  return (
    <div className="mt-4">
      <div className="flex h-10 items-end gap-1.5" role="img" aria-label={`Stations marked per week, last 8 weeks: ${weeks.join(", ")}`}>
        {weeks.map((n, i) => (
          <span key={i} className={`flex-1 rounded-sm ${n ? "bg-s-accent" : "bg-s-tint"}`} style={{ height: `${Math.max(10, (n / max) * 100)}%` }} />
        ))}
      </div>
      <p className="mt-1.5 font-chart text-[11px] text-s-mute">Per week, last 8 weeks</p>
    </div>
  );
}

// The one or two things worth doing next, picked from the data.
function FocusTile({ osce, mcq }) {
  const suggestions = [];
  const scored = osce.specialties.filter((s) => s.avg !== null).sort((a, b) => a.avg - b.avg);
  const untouched = osce.specialties.filter((s) => s.practised === 0 && s.total > 0);
  if (scored[0] && scored[0].avg < 70) {
    suggestions.push({ to: sectionPath(scored[0].name), title: `Revisit ${scored[0].name}`, body: `Your average there is ${scored[0].avg}%.` });
  } else if (untouched[0]) {
    suggestions.push({ to: sectionPath(untouched[0].name), title: `Start ${untouched[0].name}`, body: `${plural(untouched[0].total, "station")} you haven't tried.` });
  }
  const weak = mcq.weakTopics[0];
  if (weak && weak.accuracy < 70) {
    suggestions.push({
      to: `/mcqs/${weak.yearSlug}/practice?block=${weak.blockSlug}&topic=${weak.topicSlug}`,
      title: `Practise ${weak.name} MCQs`,
      body: `${weak.accuracy}% correct so far.`,
    });
  }
  if (!suggestions.length) {
    suggestions.push({ to: "/stations", title: "Keep the streak going", body: "Try a station you haven't done yet." });
  }
  return (
    <Panel className="site-rise flex flex-col" style={rise(4)}>
      <h2 className="text-base font-semibold tracking-tight text-s-ink">Focus next</h2>
      <ul className="mt-3 space-y-2">
        {suggestions.slice(0, 2).map((s) => (
          <li key={s.title}>
            <Link to={s.to} className="site-press group flex items-center gap-3 rounded-2xl bg-s-tint/60 p-3 hover:bg-s-accent-soft">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-s-ink">{s.title}</span>
                <span className="block text-xs text-s-mute">{s.body}</span>
              </span>
              <ArrowRight size={16} strokeWidth={2} className="shrink-0 text-s-accent transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---- OSCE by specialty ----
function SpecialtyGrid({ specialties }) {
  return (
    <section aria-labelledby="specialty-heading">
      <h2 id="specialty-heading" className="mb-4 text-xl font-semibold tracking-tight text-s-ink">OSCE by specialty</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {specialties.map((s, i) => {
          const look = specialtyLook(s.name, i);
          const t = TONES[look.tone];
          const tone = s.avg !== null ? scoreTone(s.avg) : null;
          return (
            <Link key={s.name} to={sectionPath(s.name)} style={rise(i)} className={`site-rise site-grid site-press flex items-center gap-4 rounded-3xl border border-s-line p-4 ${t.ring}`}>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.soft}`} aria-hidden="true">
                <MedIcon name={look.icon} size={28} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-s-ink">{s.name}</span>
                <ProgressLine value={s.practised} total={s.total} tone={look.tone} caption={`${s.practised} of ${s.total} stations`} />
              </span>
              {tone ? <Chip className={`${tone.chip} shrink-0`}>{s.avg}%</Chip> : <Chip className="shrink-0">New</Chip>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ---- Checklist items missed most ----
function MissedItems({ items, attempts }) {
  return (
    <Panel className="site-rise">
      <h2 className="text-lg font-semibold tracking-tight text-s-ink">Checklist items you miss most</h2>
      <p className="mt-1 text-sm text-s-mute">From your marked OSCE stations.</p>
      {items.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-s-tint/60 p-4 text-sm text-s-mute">
          {attempts ? "No missed items recorded. Nice work." : "Mark a station to see what you tend to miss."}
        </p>
      ) : (
        <ol className="mt-5 space-y-2.5">
          {items.map((m) => (
            <li key={m.item} className="rounded-2xl border border-s-line bg-s-card p-3.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-full bg-coral-soft px-2 py-0.5 font-chart text-xs text-s-miss">x{m.count}</span>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-s-ink">{m.item}</p>
              </div>
              <p className="mt-2 truncate pl-11 text-xs text-s-mute">
                {m.stations.slice(0, 2).map((s, i) => (
                  <span key={s.slug}>
                    {i > 0 && ", "}
                    <Link to={`/stations/${s.slug}`} className="hover:text-s-ink hover:underline">{displayTitle(s.title)}</Link>
                  </span>
                ))}
                {m.stations.length > 2 && ` and ${m.stations.length - 2} more`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

// ---- Recent marked stations ----
function RecentAttempts({ attempts }) {
  return (
    <Panel className="site-rise" style={{ "--rise-delay": "60ms" }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-s-ink">Recent stations</h2>
        <Link to="/stations/attempts" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-s-accent hover:underline">
          <History size={15} strokeWidth={2} aria-hidden="true" /> All attempts
        </Link>
      </div>
      {attempts.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-s-tint/60 p-4 text-sm text-s-mute">Your marked OSCE stations will appear here.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {attempts.map((a) => {
            const look = specialtyLook(a.module.specialty?.name);
            return (
              <li key={a.id}>
                <Link to={`/stations/attempts/${a.id}/results`} className="site-press flex items-center gap-3 rounded-2xl p-2.5 hover:bg-s-tint/60">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[look.tone].soft}`} aria-hidden="true">
                    <MedIcon name={look.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-s-ink">{displayTitle(a.module.title)}</span>
                    <span className="block font-chart text-xs text-s-mute">{formatDate(a.at)} / {a.mode === "virtual-patient" ? "AI patient" : "Self-practice"}</span>
                  </span>
                  <Chip className={`${scoreTone(a.pct).chip} shrink-0`}>{a.pct}%</Chip>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// ---- MCQ ----
function McqPanel({ mcq }) {
  return (
    <Panel className="site-rise">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-soft" aria-hidden="true"><MedIcon name="books" size={24} /></span>
        <h2 className="text-lg font-semibold tracking-tight text-s-ink">MCQs</h2>
      </div>
      <ul className="mt-5 space-y-4">
        {mcq.years.map((y) => (
          <li key={y.slug}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <Link to={`/mcqs/${y.slug}`} className="font-medium text-s-ink hover:underline">{y.name}</Link>
              <span className="font-chart text-xs text-s-mute">{y.answered ? `${Math.round((y.correct / y.answered) * 100)}% correct` : "Not started"}</span>
            </div>
            <ProgressLine value={y.answered} total={y.total} tone="sky" caption={`${y.answered.toLocaleString()} of ${y.total.toLocaleString()} answered`} />
          </li>
        ))}
      </ul>
      {mcq.weakTopics.length > 0 && (
        <div className="mt-6 border-t border-s-line pt-5">
          <h3 className="text-sm font-semibold text-s-ink">Weakest topics</h3>
          <ul className="mt-3 space-y-2">
            {mcq.weakTopics.map((t) => (
              <li key={`${t.yearSlug}-${t.blockSlug}-${t.topicSlug}`}>
                <Link to={`/mcqs/${t.yearSlug}/practice?block=${t.blockSlug}&topic=${t.topicSlug}`} className="site-press group flex items-center gap-3 rounded-2xl bg-s-tint/60 p-3 hover:bg-sky-soft">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-s-ink">{t.name}</span>
                    <span className="block text-xs text-s-mute">{t.yearName}, {t.correct} of {t.answered} correct</span>
                  </span>
                  <Chip className={`${scoreTone(t.accuracy).chip} shrink-0`}>{t.accuracy}%</Chip>
                  <ArrowRight size={15} strokeWidth={2} className="shrink-0 text-sky transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

// ---- OSPE ----
function OspePanel({ ospe }) {
  return (
    <Panel className="site-rise" style={{ "--rise-delay": "60ms" }}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-soft" aria-hidden="true"><MedIcon name="microscope" size={24} /></span>
        <h2 className="text-lg font-semibold tracking-tight text-s-ink">OSPE</h2>
      </div>
      <ul className="mt-5 space-y-4">
        {ospe.years.map((y) => (
          <li key={y.slug}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <Link to={`/ospe/${y.slug}`} className="font-medium text-s-ink hover:underline">{y.name}</Link>
              <span className="font-chart text-xs text-s-mute">{y.avg !== null ? `${y.avg}% checklist average` : "Not started"}</span>
            </div>
            <ProgressLine value={y.attempted} total={y.total} tone="mint" caption={`${y.attempted} of ${y.total} stations practised`} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
