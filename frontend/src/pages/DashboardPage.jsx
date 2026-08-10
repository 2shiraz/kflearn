import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, Stethoscope, FileText, ClipboardList, ArrowRight } from "lucide-react";
import { getCurrentUser, logout } from "../lib/api";
import Sidebar from "../components/Sidebar";

const sections = [
  {
    key: "history", label: "History Taking", href: "/history-taking",
    desc: "Practise structured patient consultations for common presenting complaints across all specialties.",
    badge: "30 modules", icon: MessageSquareText,
    iconBg: "bg-indigo-50", iconText: "text-brand", badgeBg: "bg-indigo-50", badgeText: "text-brand",
  },
  {
    key: "clinical-exam", label: "Clinical Examination", href: "/clinical-examination",
    desc: "Step-by-step illustrated examination guides by body system, with downloadable checklists.",
    badge: "12 systems", icon: Stethoscope,
    iconBg: "bg-emerald-50", iconText: "text-emerald-600", badgeBg: "bg-emerald-50", badgeText: "text-emerald-600",
  },
  {
    key: "handouts", label: "Handout Notes", href: "/handout-notes",
    desc: "Concise revision notes and downloadable PDFs organised by specialty — ideal for quick review.",
    badge: "PDF downloads", icon: FileText,
    iconBg: "bg-amber-50", iconText: "text-amber-600", badgeBg: "bg-amber-50", badgeText: "text-amber-600",
  },
  {
    key: "stations", label: "OSCE Stations", href: "/stations",
    desc: "Timed clinical stations with AI evaluation, structured checklists, and viva questions.",
    badge: "200+ stations", icon: ClipboardList,
    iconBg: "bg-violet-50", iconText: "text-violet-600", badgeBg: "bg-violet-50", badgeText: "text-violet-600",
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

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = "/signin";
      return;
    }
    setUser(u);
  }, []);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <Sidebar active="dashboard" onLogout={() => { logout(); window.location.href = "/signin"; }} />

      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">
              {greeting()}, {user.fullName.split(" ")[0]}
            </h1>
            <p className="mt-1 text-ink-soft">What would you like to practise today?</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
              {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-ink">{user.fullName}</span>
              <span className="block text-xs leading-tight text-ink-soft">{user.email}</span>
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {sections.map((s) => (
            <Link key={s.key} to={s.href} className="group rounded-2xl border border-line bg-white p-6 transition hover:border-brand hover:shadow-sm">
              <div className="flex items-start justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.iconBg} ${s.iconText}`}>
                  <s.icon size={20} />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.badgeBg} ${s.badgeText}`}>
                  {s.badge}
                </span>
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-ink">{s.label}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
              <span className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${s.iconText} group-hover:underline`}>
                Open <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
