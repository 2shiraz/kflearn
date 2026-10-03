import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, Coins, Settings, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import BrandMark from "./BrandMark";
import { HealthIcon } from "../site/Illustrations";
import { SECTION_LOOK, TONES } from "../site/tones";
import { getCurrentUser } from "../lib/api";
import { useCredits } from "../lib/credits";

function formatBalance(balance) {
  return balance === null ? "..." : balance.toLocaleString();
}

export const SECTIONS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { key: "stations", label: "OSCE Stations", href: "/stations" },
  { key: "mcqs", label: "MCQs", href: "/mcqs" },
  { key: "ospe", label: "OSPE", href: "/ospe" },
  { key: "history", label: "History Taking Guide", href: "/history-taking" },
  { key: "clinical-exam", label: "Clinical Examination Guide", href: "/clinical-examination" },
  { key: "handouts", label: "Handout Notes", href: "/handout-notes" },
  { key: "progress", label: "Progress", href: "/progress" },
];

// Icon in a small tinted circle: the section's Healthicon in its specialty
// colour, or a lucide glyph for UI items (dashboard, credits, settings).
function NavIcon({ item, active }) {
  const look = SECTION_LOOK[item.key];
  const tone = TONES[look?.tone || "indigo"];
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        active ? "bg-s-card text-s-accent" : look ? `${tone.soft} ${tone.text}` : "bg-s-tint text-s-mute group-hover:text-s-ink"
      }`}
      aria-hidden="true"
    >
      {look ? <HealthIcon name={look.icon} size={20} /> : <item.icon size={16} strokeWidth={2} />}
    </span>
  );
}

function itemClass(active, compact) {
  return `site-press group flex min-h-11 items-center gap-3 rounded-full p-1.5 pr-3 text-sm font-medium ${
    compact ? "justify-center pr-1.5 lg:justify-start lg:pr-3" : ""
  } ${active ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:bg-s-tint/70 hover:text-s-ink"}`;
}

// `compact` = the sm..lg icon rail, where labels are hidden.
function NavList({ sections, active, compact, onNavigate }) {
  return (
    <ul className="flex flex-col gap-1">
      {sections.map((s) => {
        const isActive = s.key === active;
        return (
          <li key={s.key}>
            <Link to={s.href} title={compact ? s.label : undefined} aria-current={isActive ? "page" : undefined} onClick={onNavigate} className={itemClass(isActive, compact)}>
              <NavIcon item={s} active={isActive} />
              <span className={`${compact ? "sr-only lg:not-sr-only" : ""} truncate`}>{s.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function AccountLinks({ active, balance, compact, onNavigate, onLogout }) {
  const creditsActive = active === "credits";
  const settingsActive = active === "settings";
  const hide = compact ? "sr-only lg:not-sr-only" : "";
  return (
    <div className="flex flex-col gap-1 border-t border-s-line pt-3">
      <Link to="/credits" title={compact ? `Credits: ${formatBalance(balance)}` : undefined} aria-current={creditsActive ? "page" : undefined} onClick={onNavigate} className={itemClass(creditsActive, compact)}>
        <NavIcon item={{ key: "credits", icon: Coins }} active={creditsActive} />
        <span className={hide}>Credits</span>
        <span className={`${hide} ml-auto font-chart text-xs text-s-mute`}>{formatBalance(balance)}</span>
      </Link>
      <Link to="/settings" title={compact ? "Settings" : undefined} aria-current={settingsActive ? "page" : undefined} onClick={onNavigate} className={itemClass(settingsActive, compact)}>
        <NavIcon item={{ key: "settings", icon: Settings }} active={settingsActive} />
        <span className={hide}>Settings</span>
      </Link>
      <button type="button" title={compact ? "Sign out" : undefined} onClick={onLogout} className={`${itemClass(false, compact)} w-full hover:text-s-miss`}>
        <NavIcon item={{ key: "logout", icon: LogOut }} active={false} />
        <span className={hide}>Sign out</span>
      </button>
    </div>
  );
}

function Initials({ initials, className = "" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-s-accent text-xs font-semibold text-s-on-accent ${className}`}>
      {initials}
    </span>
  );
}

export default function Sidebar({ active = "dashboard", onLogout }) {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const { balance } = useCredits();
  const navSections = user?.role === "admin" ? [...SECTIONS, { key: "admin", label: "Admin", icon: ShieldCheck, href: "/admin/stations" }] : SECTIONS;

  const initials = user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  // Phones (< sm): a full-width top bar like the public navbar, with a menu
  // button that opens the full drawer. sm..lg: an icon rail. lg+: the same
  // rail with labels.
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-s-line bg-s-page/85 backdrop-blur-lg sm:hidden">
        <div className="flex h-16 items-center gap-1.5 px-2">
          <button type="button" aria-label="Open menu" aria-expanded={open} aria-controls="app-drawer" onClick={() => setOpen(true)} className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70">
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <Link to="/dashboard" className="flex min-h-11 min-w-0 flex-1 items-center gap-2">
            <BrandMark size={30} />
            <span className="truncate text-[15px] font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
          </Link>
          <Link to="/credits" aria-label={`Credits: ${formatBalance(balance)}`} className="site-press flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-chart text-xs text-s-ink hover:bg-s-tint/70">
            <Coins size={15} strokeWidth={2} className="text-sun" aria-hidden="true" /> {formatBalance(balance)}
          </Link>
          {initials && (
            <Link to="/settings" aria-label="Settings" className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
              <Initials initials={initials} className="h-9 w-9" />
            </Link>
          )}
        </div>
      </header>

      <aside className="sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-s-line bg-s-card/80 backdrop-blur-lg sm:block sm:w-20 lg:w-64">
        <div className="flex h-full flex-col px-3 py-4">
          <button type="button" aria-label="Open menu" aria-expanded={open} aria-controls="app-drawer" onClick={() => setOpen(true)} className="site-press mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70 lg:hidden">
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <Link to="/dashboard" aria-label="KF LearnSmart dashboard" className="mb-5 flex min-h-11 items-center justify-center gap-2.5 lg:justify-start lg:px-1.5">
            <BrandMark size={34} />
            <span className="hidden text-[15px] font-semibold tracking-tight text-s-ink lg:block">KF LearnSmart</span>
          </Link>

          <nav aria-label="App" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <NavList sections={navSections} active={active} compact />
          </nav>

          {user && (
            <div className="mb-2 hidden items-center gap-3 rounded-2xl bg-s-tint/60 p-2.5 lg:flex">
              <Initials initials={initials} className="h-9 w-9" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-s-ink">{user.fullName}</span>
                <span className="block truncate text-xs text-s-mute">{user.email}</span>
              </span>
            </div>
          )}
          <AccountLinks active={active} balance={balance} compact onLogout={onLogout} />
        </div>
      </aside>

      {/* Always mounted (not just when open) so the slide/fade can actually animate —
          conditionally rendering the element would just pop it in/out with no transition.
          `inert` keeps the closed drawer out of the tab order. */}
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          className={`absolute inset-0 bg-s-ink/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={close}
        />
        <div
          id="app-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-s-line bg-s-card p-3 shadow-xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <Link to="/dashboard" onClick={close} className="flex min-h-11 items-center gap-2.5 px-1.5">
              <BrandMark size={34} />
              <span className="text-[15px] font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
            </Link>
            <button type="button" aria-label="Close menu" onClick={close} className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70">
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          <nav aria-label="App" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <NavList sections={navSections} active={active} onNavigate={close} />
          </nav>

          <AccountLinks active={active} balance={balance} onNavigate={close} onLogout={() => { close(); onLogout(); }} />
        </div>
      </div>
    </>
  );
}
