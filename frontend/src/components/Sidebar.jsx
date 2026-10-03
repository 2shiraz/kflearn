import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, ClipboardList, HeartPulse, LayoutGrid, ListChecks, LogOut, Menu,
  Microscope, NotebookText, ShieldCheck, Stethoscope, TrendingUp, X, Zap,
} from "lucide-react";
import BrandMark from "./BrandMark";
import { UserAvatar } from "../site/Illustrations";
import { getCurrentUser, USER_EVENT } from "../lib/api";
import { useCredits } from "../lib/credits";
import { sectionOpen, useSite } from "../lib/site";

function formatBalance(balance) {
  return balance === null ? "..." : balance.toLocaleString();
}

// Grouped navigation. The first group has no heading; the rest are labelled
// in the expanded sidebar and separated by a hairline when collapsed to icons.
export const SECTIONS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", group: "home" },
  { key: "progress", label: "Progress", href: "/progress", group: "home" },
  { key: "stations", label: "OSCE Stations", href: "/stations", group: "practice" },
  { key: "mcqs", label: "MCQs", href: "/mcqs", group: "practice" },
  { key: "ospe", label: "OSPE", href: "/ospe", group: "practice" },
  { key: "history", label: "History Taking Guide", href: "/history-taking", group: "guides" },
  { key: "clinical-exam", label: "Clinical Exam Guide", href: "/clinical-examination", group: "guides" },
  { key: "handouts", label: "Handout Notes", href: "/handout-notes", group: "guides" },
];

const GROUP_LABELS = { home: "", practice: "Practice", guides: "Guides and notes", admin: "Admin" };

// Plain line icons for navigation, one per item. AI credits get a gold bolt
// with no circle behind it.
const NAV_ICONS = {
  dashboard: LayoutGrid,
  stations: Stethoscope,
  mcqs: ListChecks,
  ospe: Microscope,
  history: ClipboardList,
  "clinical-exam": HeartPulse,
  handouts: NotebookText,
  progress: TrendingUp,
  admin: ShieldCheck,
  credits: Zap,
};

function NavIcon({ item, active }) {
  const Icon = NAV_ICONS[item.key];
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
        item.key === "credits" ? "text-sun" : active ? "text-s-accent" : "text-s-mute group-hover:text-s-ink"
      }`}
      aria-hidden="true"
    >
      {item.key === "credits" ? <Icon size={18} strokeWidth={1.75} fill="currentColor" /> : <Icon size={18} strokeWidth={1.9} />}
    </span>
  );
}

// Layout modes: "drawer" (mobile menu, labels always), "rail" (tablet icons,
// labels from lg), "collapsed" (icons only at every size).
const LABEL_CLASS = { drawer: "", rail: "sr-only lg:not-sr-only", collapsed: "sr-only" };
// Icon-only layouts use a centred square so the active highlight is a true
// circle around the icon; the expanded sidebar uses a full-width pill.
const ALIGN_CLASS = {
  drawer: "gap-3 p-1.5 pr-3",
  rail: "mx-auto h-11 w-11 justify-center lg:mx-0 lg:h-auto lg:w-auto lg:justify-start lg:gap-3 lg:p-1.5 lg:pr-3",
  collapsed: "mx-auto h-11 w-11 justify-center",
};

function itemClass(active, mode) {
  return `site-press group flex min-h-11 items-center rounded-full text-sm font-medium ${ALIGN_CLASS[mode]} ${
    active ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:bg-s-tint/70 hover:text-s-ink"
  }`;
}

// Group heading: text in the expanded sidebar, a short hairline in icon-only
// layouts so the groups still read as separate.
const GROUP_TEXT_CLASS = { drawer: "block", rail: "hidden lg:block", collapsed: "hidden" };
const GROUP_RULE_CLASS = { drawer: "hidden", rail: "lg:hidden", collapsed: "" };

function NavList({ sections, active, mode, onNavigate }) {
  const groups = [];
  for (const s of sections) {
    const group = s.group || "home";
    const last = groups[groups.length - 1];
    if (last && last.key === group) last.items.push(s);
    else groups.push({ key: group, items: [s] });
  }
  return (
    <div className="flex flex-col">
      {groups.map((g, gi) => {
        const label = GROUP_LABELS[g.key];
        const headingId = `nav-group-${g.key}`;
        return (
          <div key={g.key} data-tour={`group-${g.key}`} role="group" aria-labelledby={label ? headingId : undefined} className={gi > 0 ? "mt-2" : ""}>
            {gi > 0 && (
              <>
                <p id={headingId} className={`${GROUP_TEXT_CLASS[mode]} px-3 pb-1.5 pt-3 text-xs font-medium text-s-mute/80`}>{label}</p>
                <span className={`${GROUP_RULE_CLASS[mode]} mx-auto my-2 block h-px w-6 bg-s-line`} aria-hidden="true" />
              </>
            )}
            <ul className="flex flex-col gap-1">
              {g.items.map((s) => {
                const isActive = s.key === active;
                return (
                  <li key={s.key}>
                    <Link to={s.href} data-tour={s.key} title={mode !== "drawer" ? s.label : undefined} aria-current={isActive ? "page" : undefined} onClick={onNavigate} className={itemClass(isActive, mode)}>
                      <NavIcon item={s} active={isActive} />
                      <span className={`${LABEL_CLASS[mode]} truncate`}>{s.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// Account row layouts. Expanded: one row with avatar, name and email (the
// Settings link) and a sign-out icon beside it. Icon-only: the avatar, then
// the sign-out icon under it.
const PROFILE_ROW_CLASS = {
  drawer: "flex items-center gap-1",
  rail: "flex flex-col items-center gap-1 lg:flex-row lg:gap-1",
  collapsed: "flex flex-col items-center gap-1",
};
const PROFILE_LINK_CLASS = {
  drawer: "min-w-0 flex-1 gap-3 rounded-2xl p-1.5 pr-2",
  rail: "h-11 w-11 justify-center rounded-full lg:h-auto lg:w-auto lg:min-w-0 lg:flex-1 lg:justify-start lg:gap-3 lg:rounded-2xl lg:p-1.5 lg:pr-2",
  collapsed: "h-11 w-11 justify-center rounded-full",
};

function AccountLinks({ active, balance, mode, user, initials, onNavigate, onLogout }) {
  const creditsActive = active === "credits";
  const settingsActive = active === "settings";
  const hide = LABEL_CLASS[mode];
  const compact = mode !== "drawer";
  return (
    <div className="flex flex-col gap-1 pt-3">
      <Link to="/credits" data-tour="credits" title={compact ? `AI credits: ${formatBalance(balance)}` : undefined} aria-current={creditsActive ? "page" : undefined} onClick={onNavigate} className={itemClass(creditsActive, mode)}>
        <NavIcon item={{ key: "credits" }} active={creditsActive} />
        <span className={hide}>AI Credits</span>
        <span className={`${hide} ml-auto font-chart text-xs text-s-mute`}>{formatBalance(balance)}</span>
      </Link>
      <div className={PROFILE_ROW_CLASS[mode]}>
        <Link
          to="/settings"
          data-tour="settings"
          title={compact ? "Settings" : undefined}
          aria-label={user ? `Settings, signed in as ${user.fullName}` : "Settings"}
          aria-current={settingsActive ? "page" : undefined}
          onClick={onNavigate}
          className={`site-press group flex min-h-11 items-center ${PROFILE_LINK_CLASS[mode]} ${settingsActive ? "bg-s-accent-soft" : "hover:bg-s-tint/70"}`}
        >
          <ProfilePic user={user} initials={initials} />
          <span className={`${hide} min-w-0 flex-1`}>
            <span className="block truncate text-sm font-medium text-s-ink">{user?.fullName || "Settings"}</span>
            <span className="block truncate text-xs text-s-mute">{user?.email ? user.email : "Profile and password"}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
          title="Sign out"
          className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss"
        >
          <LogOut size={18} strokeWidth={1.9} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// The chosen avatar, or initials for a cached user saved before avatars existed.
function ProfilePic({ user, initials }) {
  if (user?.avatar) return <UserAvatar id={user.avatar} size={36} />;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-s-accent text-xs font-semibold text-s-on-accent">
      {initials}
    </span>
  );
}

// Re-read the cached user when Settings saves a new name or avatar.
function useCachedUser() {
  const [user, setUser] = useState(getCurrentUser);
  useEffect(() => {
    const onChange = () => setUser(getCurrentUser());
    window.addEventListener(USER_EVENT, onChange);
    return () => window.removeEventListener(USER_EVENT, onChange);
  }, []);
  return user;
}

// Desktop collapse preference, kept per browser. Read once on mount so the
// sidebar doesn't flash open on every page change.
const COLLAPSE_KEY = "kf_sidebar_collapsed";
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Sidebar({ active = "dashboard", onLogout }) {
  const user = useCachedUser();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { balance } = useCredits();
  const site = useSite();
  const openSections = SECTIONS.filter((s) => sectionOpen(site, s.key, user));
  const navSections = user?.role === "admin" ? [...openSections, { key: "admin", label: "Admin", href: "/admin/stations", group: "admin" }] : openSections;

  const initials = user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        // Storage blocked: the toggle still works for this page.
      }
      return !c;
    });
  }

  const railMode = collapsed ? "collapsed" : "rail";

  // Phones (< sm): a full-width top bar like the public navbar, with a menu
  // button that opens the full drawer. sm..lg: an icon rail. lg+: the same
  // rail with labels, which can be collapsed back to icons.
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-s-line bg-s-page/85 backdrop-blur-lg sm:hidden">
        <div className="flex h-16 items-center gap-1.5 px-2">
          <button type="button" data-tour="menu" aria-label="Open menu" aria-expanded={open} aria-controls="app-drawer" onClick={() => setOpen(true)} className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70">
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <Link to="/dashboard" className="flex min-h-11 min-w-0 flex-1 items-center gap-2">
            <BrandMark size={30} />
            <span className="truncate text-[15px] font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
          </Link>
          <Link to="/credits" data-tour="credits" aria-label={`AI credits: ${formatBalance(balance)}`} className="site-press flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-chart text-xs text-s-ink hover:bg-s-tint/70">
            <Zap size={16} strokeWidth={1.75} fill="currentColor" className="text-sun" aria-hidden="true" /> {formatBalance(balance)}
          </Link>
          {initials && (
            <Link to="/settings" aria-label="Settings" className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
              <ProfilePic user={user} initials={initials} />
            </Link>
          )}
        </div>
      </header>

      <aside className={`sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-s-line bg-s-card/80 backdrop-blur-lg motion-safe:transition-[width] motion-safe:duration-300 sm:block sm:w-20 ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
        {/* Collapse handle: a small round button on the sidebar's right edge,
            halfway down. The visible circle is 24px; the hit area is 44px. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="group absolute -right-5.5 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center lg:flex"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-s-line bg-s-card text-s-mute shadow-sm transition-colors group-hover:border-s-accent/40 group-hover:text-s-ink" aria-hidden="true">
            {collapsed ? <ChevronRight size={14} strokeWidth={2.25} /> : <ChevronLeft size={14} strokeWidth={2.25} />}
          </span>
        </button>

        <div className="flex h-full flex-col px-3 py-4">
          <button type="button" aria-label="Open menu" aria-expanded={open} aria-controls="app-drawer" onClick={() => setOpen(true)} className="site-press mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70 lg:hidden">
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <Link to="/dashboard" aria-label="KF LearnSmart dashboard" className={`mb-5 flex min-h-11 items-center justify-center gap-2.5 ${collapsed ? "" : "lg:justify-start lg:px-1.5"}`}>
            <BrandMark size={34} />
            <span className={`hidden whitespace-nowrap text-[15px] font-semibold tracking-tight text-s-ink ${collapsed ? "" : "lg:block"}`}>KF LearnSmart</span>
          </Link>

          <nav aria-label="App" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <NavList sections={navSections} active={active} mode={railMode} />
          </nav>

          <AccountLinks active={active} balance={balance} mode={railMode} user={user} initials={initials} onLogout={onLogout} />
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
            <NavList sections={navSections} active={active} mode="drawer" onNavigate={close} />
          </nav>

          <AccountLinks active={active} balance={balance} mode="drawer" user={user} initials={initials} onNavigate={close} onLogout={() => { close(); onLogout(); }} />
        </div>
      </div>
    </>
  );
}
