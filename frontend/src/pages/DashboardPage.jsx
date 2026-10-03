import { useCallback, useEffect, useState } from "react";
import { mcqTotalCount } from "../data/mcqs/catalog";
import { ospeTotalCount } from "../data/ospe";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCurrentUser, getDashboardSummary, listOsceAttempts, listOsceStations } from "../lib/api";
import { ErrorMessage, PageMain, RequireUser } from "../components/AppPage";
import { Skeleton } from "../components/Skeleton";
import { Chip, scoreTone } from "../components/StudyKit";
import { Character, HealthIcon, MedIcon } from "../site/Illustrations";
import { SECTION_LOOK, TONES, specialtyLook } from "../site/tones";
import { plus } from "../site/siteContent";
import { displayTitle } from "../lib/osceFilters";
import { osceSummary } from "../lib/progress";
import { topics as historyGuideTopics } from "../data/historyTakingGuide";
import { stations as examStations } from "../data/clinicalExaminationGuide";
import { handouts } from "../data/handoutNotes";

// Bento order: two large tiles, then three small ones. OSCE stations sit above
// as the featured card.
const sections = [
  {
    key: "mcqs", label: "MCQs", href: "/mcqs", large: true,
    desc: "Single-best-answer questions with explanations, by MBBS year, module and topic.",
    staticCount: mcqTotalCount, countLabel: "questions",
  },
  {
    key: "ospe", label: "OSPE", href: "/ospe", large: true,
    desc: "Practical stations with candidate tasks and the examiner checklist to mark yourself.",
    staticCount: ospeTotalCount, countLabel: "stations",
  },
  {
    key: "clinical-exam", label: "Clinical Exam Guide", href: "/clinical-examination",
    desc: "Step-by-step order, mnemonics and findings, from core systems to MSK and neuro.",
    staticCount: examStations.length, countLabel: "guides",
  },
  {
    key: "history", label: "History Taking Guide", href: "/history-taking",
    desc: "Question sets, mnemonics and differentials, organised by presenting complaint.",
    staticCount: historyGuideTopics.length, countLabel: "topics",
  },
  {
    key: "handouts", label: "Handout Notes", href: "/handout-notes",
    desc: "Features, diagnosis and management for each station, organised by system.",
    staticCount: handouts.length, countLabel: "handouts",
  },
];

// One of the student characters, picked from the name so it stays the same.
const STUDENTS = [
  { name: "student-ayesha", tone: "sky" },
  { name: "student-bilal", tone: "sun" },
  { name: "student-hira", tone: "coral" },
  { name: "student-usman", tone: "mint" },
];
function studentFor(name = "") {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return STUDENTS[sum % STUDENTS.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({ loading: true, modules: {}, error: "" });
  const [osce, setOsce] = useState({ loading: true, attempts: [], stations: [] });

  const loadSummary = useCallback(() => {
    setSummary((s) => ({ ...s, loading: true, error: "" }));
    getDashboardSummary()
      .then((data) => setSummary({ loading: false, modules: data.modules || {}, error: "" }))
      .catch((err) => setSummary({ loading: false, modules: {}, error: err.message }));
  }, []);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = "/signin";
      return;
    }
    setUser(u);
    loadSummary();
    Promise.all([listOsceAttempts(), listOsceStations()])
      .then(([attempts, stations]) => setOsce({ loading: false, attempts: attempts || [], stations: stations?.modules || [] }))
      .catch(() => setOsce({ loading: false, attempts: [], stations: [], failed: true }));
  }, [loadSummary]);

  if (!user) return null;

  const student = studentFor(user.fullName);
  const stationCount = Number(summary.modules?.stations || 0);

  return (
    <RequireUser active="dashboard">
      <PageMain>
        <div className="site-rise flex items-center gap-4">
          <Character name={student.name} size={64} tone={student.tone} className="bob hidden sm:inline-flex" />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">
              {greeting()}, {user.fullName.split(" ")[0]}
            </h1>
            <p className="mt-1.5 text-s-mute">What would you like to practise today?</p>
          </div>
        </div>

        {summary.error && (
          <div className="mt-6">
            <ErrorMessage message={summary.error} onRetry={loadSummary} />
          </div>
        )}

        <FeaturedOsce loading={summary.loading} count={stationCount} osce={osce} />

        <div className="mt-4 grid gap-4 md:grid-cols-6">
          {sections.map((s, i) => (
            <SectionTile key={s.key} section={s} index={i} />
          ))}
        </div>
      </PageMain>
    </RequireUser>
  );
}

// The OSCE card: the call to action on the left, and on the right either the
// student's latest marked stations or, before their first one, three stations
// from different specialties to start with.
function FeaturedOsce({ loading, count, osce }) {
  return (
    <section
      aria-labelledby="featured-osce-title"
      style={{ "--rise-delay": "80ms" }}
      className="site-rise relative mt-8 grid gap-8 overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:items-center"
    >
      <span className="pointer-events-none absolute -bottom-10 -left-10 text-s-on-accent opacity-[0.08]" aria-hidden="true">
        <HealthIcon name="stethoscope" size={220} />
      </span>
      <div className="relative">
        <p className="font-chart text-xs uppercase tracking-wider text-s-on-accent/75">OSCE stations</p>
        <div className="mt-3 min-h-10">
          {loading ? (
            <Skeleton className="h-10 w-28 bg-s-on-accent/20" />
          ) : (
            count > 0 && <p className="text-4xl font-semibold tracking-tight">{plus(count)}</p>
          )}
        </div>
        <h2 id="featured-osce-title" className="mt-1 text-2xl font-semibold tracking-tight">Practise on a patient who talks back</h2>
        <p className="mt-2 max-w-lg leading-relaxed text-s-on-accent/85">
          Run full stations by voice or text, then get marked on the examiner checklist.
        </p>
        <Link to="/stations" className="site-press group mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-s-card px-5 text-sm font-semibold text-s-accent hover:bg-s-tint">
          Start a station <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
      {!osce.failed && <OscePanel osce={osce} />}
    </section>
  );
}

function OscePanel({ osce }) {
  const recent = osce.loading ? [] : osceSummary(osce.attempts, []).recent.slice(0, 3);
  const starters = osce.loading || recent.length ? [] : starterStations(osce.stations);
  if (!osce.loading && recent.length === 0 && starters.length === 0) return null;
  const hasHistory = recent.length > 0;

  return (
    <div className="relative rounded-3xl bg-s-card p-4 text-s-ink site-shadow sm:p-5">
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-sm font-semibold">{osce.loading ? <Skeleton className="h-4 w-36" /> : hasHistory ? "Your latest stations" : "Good first stations"}</h3>
        {!osce.loading && (
          <Link to={hasHistory ? "/progress" : "/stations"} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-s-accent hover:underline">
            {hasHistory ? "Progress" : "All stations"} <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        )}
      </div>
      <ul className="mt-1 space-y-1">
        {osce.loading
          ? [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 p-2.5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <span className="flex-1 space-y-2"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/3" /></span>
              </li>
            ))
          : hasHistory
            ? recent.map((a) => (
                <PanelRow
                  key={a.id}
                  to={`/stations/attempts/${a.id}/results`}
                  specialty={a.module.specialty?.name}
                  title={a.module.title}
                  meta={`${new Date(a.at).toLocaleDateString(undefined, { day: "numeric", month: "short" })} / ${a.mode === "virtual-patient" ? "AI patient" : "Self-practice"}`}
                  end={<Chip className={`${scoreTone(a.pct).chip} shrink-0`}>{a.pct}%</Chip>}
                />
              ))
            : starters.map((st) => (
                <PanelRow
                  key={st.slug}
                  to={`/stations/${st.slug}`}
                  specialty={st.specialty?.name}
                  title={st.title}
                  meta={[st.specialty?.name, st.timeLimitSeconds ? `${Math.round(st.timeLimitSeconds / 60)} min` : ""].filter(Boolean).join(" / ")}
                  end={<ArrowRight size={16} strokeWidth={2} className="shrink-0 text-s-mute" aria-hidden="true" />}
                />
              ))}
      </ul>
    </div>
  );
}

function PanelRow({ to, specialty, title, meta, end }) {
  const look = specialtyLook(specialty);
  return (
    <li>
      <Link to={to} className="site-press flex items-center gap-3 rounded-2xl p-2.5 hover:bg-s-tint/60">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[look.tone].soft}`} aria-hidden="true">
          <MedIcon name={look.icon} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{displayTitle(title)}</span>
          {meta && <span className="block truncate font-chart text-xs text-s-mute">{meta}</span>}
        </span>
        {end}
      </Link>
    </li>
  );
}

// One station from each of the three specialties with the most stations.
function starterStations(stations) {
  const bySpecialty = new Map();
  for (const st of stations) {
    const key = st.specialty?.name || "General";
    if (!bySpecialty.has(key)) bySpecialty.set(key, []);
    bySpecialty.get(key).push(st);
  }
  return [...bySpecialty.values()].sort((a, b) => b.length - a.length).slice(0, 3).map((list) => list[0]);
}

function SectionTile({ section: s, index }) {
  const look = SECTION_LOOK[s.key];
  const t = TONES[look.tone];
  return (
    <Link
      to={s.href}
      style={{ "--rise-delay": `${160 + index * 60}ms` }}
      className={`site-rise site-grid site-press group relative flex flex-col overflow-hidden rounded-3xl border border-s-line p-6 ${t.ring} ${s.large ? "md:col-span-3 md:p-7" : "md:col-span-2"}`}
    >
      {s.large ? (
        <span
          className={`absolute -right-10 -top-10 flex h-44 w-44 items-center justify-center rounded-full ${t.soft} ${t.text} transition-transform duration-500 group-hover:scale-105`}
          aria-hidden="true"
        >
          <MedIcon name={look.icon} size={88} className="-translate-x-4 translate-y-4" />
        </span>
      ) : (
        <>
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.soft} ${t.text}`} aria-hidden="true">
            <MedIcon name={look.icon} size={32} />
          </span>
        </>
      )}
      <p className={`relative ${s.large ? "mt-16 text-4xl" : "mt-5 text-3xl"} font-semibold tracking-tight text-s-ink`}>
        {plus(s.staticCount)}
        <span className="ml-2 text-base font-normal tracking-normal text-s-mute">{s.countLabel}</span>
      </p>
      <h2 className="relative mt-1.5 text-lg font-medium text-s-ink">{s.label}</h2>
      <p className="relative mt-1.5 max-w-md flex-1 text-sm leading-relaxed text-s-mute">{s.desc}</p>
      <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-s-ink">
        Open <ArrowRight size={15} strokeWidth={2} className={`${t.text} transition-transform group-hover:translate-x-0.5`} />
      </span>
    </Link>
  );
}
