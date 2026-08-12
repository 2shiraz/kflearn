import { Link } from "react-router-dom";
import { Stethoscope, LayoutGrid, ClipboardList, MessageSquareText, FileText, TrendingUp, Settings, LogOut, Menu } from "lucide-react";

export const SECTIONS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { key: "history", label: "History Taking", icon: MessageSquareText, href: "/history-taking" },
  { key: "clinical-exam", label: "Clinical Examination", icon: Stethoscope, href: "/clinical-examination" },
  { key: "handouts", label: "Handout Notes", icon: FileText, href: "/handout-notes" },
  { key: "stations", label: "OSCE Stations", icon: ClipboardList, href: "/stations" },
  { key: "progress", label: "Progress", icon: TrendingUp, href: "/progress" },
];

export default function Sidebar({ active = "dashboard", onLogout }) {
  return (
    <aside className="sticky top-0 flex h-screen w-20 flex-col items-center border-r border-line bg-white/70 py-5 backdrop-blur-xl lg:w-60 lg:items-stretch lg:px-4">
      <button type="button" aria-label="Menu" className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden">
        <Menu size={22} />
      </button>
      <Link to="/dashboard" className="mb-8 flex items-center justify-center gap-2 lg:justify-start lg:px-2">
        <span className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-white">
          <Stethoscope size={18} strokeWidth={2.5} />
        </span>
        <span className="hidden font-display text-base font-bold text-ink lg:block">KF LearnSmart</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-2">
        {SECTIONS.map((s) => {
          const isActive = s.key === active;
          return (
            <Link
              key={s.key}
              to={s.href}
              title={s.label}
              className={`flex items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition lg:justify-start ${
                isActive
                  ? "gradient-brand text-white shadow-sm"
                  : "text-ink-soft hover:bg-white/70 hover:text-ink"
              }`}
            >
              <s.icon size={19} strokeWidth={2} />
              <span className="hidden lg:block">{s.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/settings"
        title="Settings"
        className={`mb-1 flex items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition lg:justify-start ${
          active === "settings" ? "gradient-brand text-white shadow-sm" : "text-ink-soft hover:bg-white/70 hover:text-ink"
        }`}
      >
        <Settings size={19} strokeWidth={2} />
        <span className="hidden lg:block">Settings</span>
      </Link>

      <button
        onClick={onLogout}
        title="Sign out"
        className="flex items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-ink-soft transition hover:bg-white/70 hover:text-rose-500 lg:justify-start"
      >
        <LogOut size={19} strokeWidth={2} />
        <span className="hidden lg:block">Sign out</span>
      </button>
    </aside>
  );
}
