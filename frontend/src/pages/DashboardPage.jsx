import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Stethoscope, FileText, ClipboardList, ArrowRight } from "lucide-react";
import { getCurrentUser, getDashboardSummary } from "../lib/api";
import { PageMain, RequireUser } from "../components/AppPage";
import { topics as historyGuideTopics } from "../data/historyTakingGuide";
import { stations as examStations } from "../data/clinicalExaminationGuide";

const sections = [
  {
    key: "history", label: "History Taking Guide", href: "/history-taking",
    desc: "Mnemonics, question sets, and differentials for every history-taking station, organised by presenting complaint.",
    staticCount: historyGuideTopics.length, countLabel: "topic", icon: ClipboardList,
    iconStyle: { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
  {
    key: "clinical-exam", label: "Clinical Examination Guide", href: "/clinical-examination",
    desc: "The step-by-step order, mnemonics, and findings for all twelve OSCE examination stations.",
    staticCount: examStations.length, countLabel: "station", icon: Stethoscope,
    iconStyle: { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
  {
    key: "handouts", label: "Handout Notes", href: "/handout-notes",
    desc: "Concise revision notes and downloadable PDFs organised by specialty — ideal for quick review.",
    countKey: "handouts", icon: FileText,
    iconStyle: { "--g1": "#7FB8FF", "--g2": "#C6A6FF", "--glow": "rgba(150,160,255,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
  {
    key: "stations", label: "OSCE Stations", href: "/stations",
    desc: "Practise structured patient consultations for common presenting complaints across all specialties, with AI evaluation and viva questions.",
    countKey: "history", icon: MessageSquareText,
    iconStyle: { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({ loading: true, modules: {}, error: "" });

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = "/signin";
      return;
    }
    setUser(u);
    getDashboardSummary()
      .then((data) => setSummary({ loading: false, modules: data.modules || {}, error: "" }))
      .catch((err) => setSummary({ loading: false, modules: {}, error: err.message }));
  }, []);

  if (!user) return null;

  return (
    <RequireUser active="dashboard">
      <PageMain>
        <div className="flex animate-fade-up flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-soft">Dashboard</p>
            <h1 className="font-display text-4xl font-extrabold text-ink">
              {greeting()}, {user.fullName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-ink-soft">What would you like to practise today?</p>
          </div>

          <div className="glass-surface flex shrink-0 items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-4">
            <span className="gradient-brand flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-white">
              {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink">{user.fullName}</span>
              <span className="block text-xs leading-tight text-ink-soft">{user.email}</span>
            </span>
          </div>
        </div>

        {summary.error && <p className="mt-6 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{summary.error}</p>}
        {summary.loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {sections.map((s, i) => {
              const count = s.staticCount ?? Number(summary.modules?.[s.countKey] || 0);
              const label = s.countLabel || "module";
              return (
                <Link
                  key={s.key}
                  to={s.href}
                  style={{ ...s.iconStyle, animationDelay: `${100 + i * 80}ms` }}
                  className="gradient-card group animate-fade-up block min-h-[172px] rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <span className={`gradient-icon flex h-12 w-12 items-center justify-center rounded-lg ${s.iconText}`}>
                      <s.icon size={20} />
                    </span>
                    <span className={`gradient-pill rounded-lg px-3 py-1 text-xs font-semibold ${s.badgeText}`}>
                      {count} {count === 1 ? label : `${label}s`}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-xl font-extrabold text-ink">{s.label}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
                  <span className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${s.iconText} group-hover:underline`}>
                    Open <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-10 grid animate-pulse grid-cols-1 gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass-surface min-h-[172px] rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-lg bg-slate-200/80" />
            <div className="h-6 w-24 rounded bg-slate-200/70" />
          </div>
          <div className="mt-5 h-6 w-44 rounded bg-slate-200/80" />
          <div className="mt-3 h-4 w-full rounded bg-slate-200/70" />
          <div className="mt-2 h-4 w-3/4 rounded bg-slate-200/70" />
          <div className="mt-5 h-4 w-20 rounded bg-slate-200/80" />
        </div>
      ))}
    </div>
  );
}
