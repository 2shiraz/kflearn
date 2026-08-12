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
    iconStyle: { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
  {
    key: "clinical-exam", label: "Clinical Examination", href: "/clinical-examination",
    desc: "Step-by-step illustrated examination guides by body system, with downloadable checklists.",
    badge: "12 systems", icon: Stethoscope,
    iconStyle: { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
  {
    key: "handouts", label: "Handout Notes", href: "/handout-notes",
    desc: "Concise revision notes and downloadable PDFs organised by specialty — ideal for quick review.",
    badge: "PDF downloads", icon: FileText,
    iconStyle: { "--g1": "#7FB8FF", "--g2": "#C6A6FF", "--glow": "rgba(150,160,255,0.35)" },
    iconText: "text-ink", badgeText: "text-brand",
  },
  {
    key: "stations", label: "OSCE Stations", href: "/stations",
    desc: "Timed clinical stations with AI evaluation, structured checklists, and viva questions.",
    badge: "200+ stations", icon: ClipboardList,
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
    <div className="app-gradient-bg flex min-h-screen">
      <Sidebar active="dashboard" onLogout={() => { logout(); window.location.href = "/signin"; }} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8">
        <div className="flex animate-fade-up items-start justify-between gap-4">
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

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {sections.map((s, i) => (
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
                  {s.badge}
                </span>
              </div>
              <h2 className="mt-5 font-display text-xl font-extrabold text-ink">{s.label}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
              <span className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${s.iconText} group-hover:underline`}>
                Open <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
