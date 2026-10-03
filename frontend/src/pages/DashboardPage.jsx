import { useCallback, useEffect, useState } from "react";
import { mcqTotalCount } from "../data/mcqs/catalog";
import { ospeTotalCount } from "../data/ospe";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCurrentUser, getDashboardSummary } from "../lib/api";
import { ErrorMessage, PageMain, RequireUser } from "../components/AppPage";
import { Skeleton } from "../components/Skeleton";
import { Character, HealthIcon, MedIcon, VoiceBars } from "../site/Illustrations";
import { SECTION_LOOK, TONES } from "../site/tones";
import { plus } from "../site/siteContent";
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

        <FeaturedOsce loading={summary.loading} count={stationCount} />

        <div className="mt-4 grid gap-4 md:grid-cols-6">
          {sections.map((s, i) => (
            <SectionTile key={s.key} section={s} index={i} />
          ))}
        </div>
      </PageMain>
    </RequireUser>
  );
}

// The OSCE card: the virtual patient mid-conversation, like the landing hero.
function FeaturedOsce({ loading, count }) {
  return (
    <Link
      to="/stations"
      style={{ "--rise-delay": "80ms" }}
      className="site-rise site-press group relative mt-8 grid overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center md:gap-8"
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
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Practise on a patient who talks back</h2>
        <p className="mt-2 max-w-lg leading-relaxed text-s-on-accent/85">
          Run full stations by voice or text, then get marked on the examiner checklist.
        </p>
        <span className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-s-card px-5 text-sm font-semibold text-s-accent">
          Start a station <ArrowRight size={16} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="relative mt-8 hidden rounded-3xl bg-s-card p-4 text-s-ink site-shadow sm:block md:mt-0" aria-hidden="true">
        <div className="flex items-center gap-3">
          <Character name="patient-daniel" size={44} tone="indigo" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Daniel Reed, 54</p>
            <p className="flex items-center gap-1.5 text-xs text-s-mute">
              <VoiceBars className="text-s-accent" /> Speaking
            </p>
          </div>
        </div>
        <p className="mt-3 rounded-3xl rounded-tl-md bg-s-tint px-4 py-3 text-sm leading-relaxed">
          I suddenly became short of breath this morning, and it hurts when I breathe in.
        </p>
        <p className="ml-auto mt-2 w-fit rounded-3xl rounded-tr-md bg-s-accent px-4 py-2.5 text-sm text-s-on-accent">
          When did this start?
        </p>
      </div>
    </Link>
  );
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
