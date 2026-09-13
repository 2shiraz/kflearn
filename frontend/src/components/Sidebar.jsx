import { useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, LayoutGrid, ClipboardList, FileQuestion, MessageSquareText, FileText, TrendingUp, Settings, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { getCurrentUser } from "../lib/api";

export const SECTIONS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { key: "history", label: "History Taking Guide", icon: ClipboardList, href: "/history-taking" },
  { key: "clinical-exam", label: "Clinical Examination Guide", icon: Stethoscope, href: "/clinical-examination" },
  { key: "mcqs", label: "MCQs", icon: FileQuestion, href: "/mcqs" },
  { key: "handouts", label: "Handout Notes", icon: FileText, href: "/handout-notes" },
  { key: "stations", label: "OSCE Stations", icon: MessageSquareText, href: "/stations" },
  { key: "progress", label: "Progress", icon: TrendingUp, href: "/progress" },
];

export default function Sidebar({ active = "dashboard", onLogout }) {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const navSections = user?.role === "admin" ? [...SECTIONS, { key: "admin", label: "Admin", icon: ShieldCheck, href: "/admin/stations" }] : SECTIONS;

  const initials = user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "";

  // On phones (< sm) there's no icon rail at all — just a slim fixed top bar
  // with a hamburger that opens the full labelled drawer below. From sm up,
  // the icon rail comes back (icon-only until lg, where labels show too).
  //
  // Hamburger + brand sit left as one lockup (not centered — with an absolute
  // left button, a "centered" title actually centers in the whole bar rather
  // than the space left of it, so it reads as off-balance, not centered). The
  // avatar on the right is what balances the bar, the way Gmail/Slack do it.
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/80 px-4 backdrop-blur-xl sm:hidden">
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-black/5 hover:text-ink">
          <Menu size={21} />
        </button>
        <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
          <span className="gradient-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white">
            <Stethoscope size={15} strokeWidth={2.5} />
          </span>
          <span className="truncate font-display text-[15px] font-bold text-ink">KF LearnSmart</span>
        </Link>
        {initials && (
          <Link to="/settings" aria-label="Settings" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 text-xs font-bold text-ink">
            {initials}
          </Link>
        )}
      </header>

      <aside className="sticky top-0 z-30 hidden h-screen shrink-0 flex-col items-center border-r border-line bg-white/70 py-5 backdrop-blur-xl sm:flex sm:w-20 lg:w-60 lg:items-stretch lg:px-4">
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg text-ink lg:hidden">
          <Menu size={22} />
        </button>
        <Link to="/dashboard" className="mb-8 flex items-center justify-center gap-2 lg:justify-start lg:px-2">
          <span className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-white">
            <Stethoscope size={18} strokeWidth={2.5} />
          </span>
          <span className="hidden font-display text-base font-bold text-ink lg:block">KF LearnSmart</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-2">
          {navSections.map((s) => {
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

      {/* Always mounted (not just when open) so the slide/fade can actually animate —
          conditionally rendering the element would just pop it in/out with no transition. */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
          className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-white p-5 shadow-xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <span className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-white">
                <Stethoscope size={18} strokeWidth={2.5} />
              </span>
              <span className="font-display text-base font-bold text-ink">KF LearnSmart</span>
            </Link>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-black/5 hover:text-ink">
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
            {navSections.map((s) => {
              const isActive = s.key === active;
              return (
                <Link
                  key={s.key}
                  to={s.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive ? "gradient-brand text-white shadow-sm" : "text-ink-soft hover:bg-black/5 hover:text-ink"
                  }`}
                >
                  <s.icon size={19} strokeWidth={2} />
                  {s.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-2 space-y-1.5 border-t border-line pt-3">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                active === "settings" ? "gradient-brand text-white shadow-sm" : "text-ink-soft hover:bg-black/5 hover:text-ink"
              }`}
            >
              <Settings size={19} strokeWidth={2} /> Settings
            </Link>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-ink-soft transition hover:bg-black/5 hover:text-rose-500"
            >
              <LogOut size={19} strokeWidth={2} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
