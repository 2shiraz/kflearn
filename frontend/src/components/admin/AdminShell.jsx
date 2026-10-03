import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowLeft, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import BrandMark from "../BrandMark";
import { ProfilePic, useCachedUser } from "../Sidebar";
import { logout } from "../../lib/api";
import { SiteName } from "../../lib/branding";

function signOut() {
  logout();
  window.location.href = "/signin";
}

// The admin console's own frame: a separate full page with its own menu,
// away from the student sidebar. "Back to site" returns to the dashboard.
// A dark bar along the top and the "Admin" badge make it obvious at a glance
// that this isn't the student site.
// tabs: [{ id, label, icon, group }], linked as /admin/<id>.
export default function AdminShell({ tabs, active, title, description, actions, children }) {
  const user = useCachedUser();
  const [open, setOpen] = useState(false);
  const initials = user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "";

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { setOpen(false); }, [active]);

  const brand = (
    <div className="flex min-h-11 items-center gap-2.5 px-1.5">
      <BrandMark size={32} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[15px] font-semibold tracking-tight text-s-ink"><SiteName /></p>
        <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-s-ink px-2 py-0.5 text-[11px] font-semibold text-s-page">
          <ShieldCheck size={12} strokeWidth={2.25} aria-hidden="true" /> Admin
        </p>
      </div>
    </div>
  );

  const nav = (
    <nav aria-label="Admin sections" className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
      {tabs.map((tab, i) => (
        <div key={tab.id}>
          {tab.group && tab.group !== tabs[i - 1]?.group && <p className="px-3 pb-1 pt-5 text-xs font-medium text-s-mute/80">{tab.group}</p>}
          <NavLink
            to={tab.id === "overview" ? "/admin" : `/admin/${tab.id}`}
            aria-current={active === tab.id ? "page" : undefined}
            className={`site-press flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${active === tab.id ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:bg-s-tint/70 hover:text-s-ink"}`}
          >
            <tab.icon size={18} strokeWidth={1.9} className={active === tab.id ? "text-s-accent" : ""} aria-hidden="true" />
            {tab.label}
          </NavLink>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-3 space-y-1 border-t border-s-line pt-3">
      <Link to="/dashboard" className="site-press flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-s-ink hover:bg-s-tint/70">
        <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" /> Back to site
      </Link>
      <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
        {initials && <ProfilePic user={user} initials={initials} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-s-ink">{user?.fullName}</p>
          <p className="truncate text-xs text-s-mute">{user?.email}</p>
        </div>
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="site-press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-tint hover:text-s-ink">
          <LogOut size={17} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="site site-app min-h-dvh">
      <div className="sticky top-0 z-40 flex h-10 items-center gap-3 bg-s-ink px-4 text-xs text-s-page sm:px-6">
        <ShieldCheck size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate">
          <span className="font-semibold">Admin console</span>
          <span className="hidden opacity-70 sm:inline"> / changes here apply to every student</span>
        </p>
        <Link to="/dashboard" className="hidden min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 font-semibold hover:bg-s-page/15 lg:inline-flex">
          <ArrowLeft size={14} strokeWidth={2.25} aria-hidden="true" /> Back to site
        </Link>
      </div>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-10 hidden h-[calc(100dvh-2.5rem)] flex-col border-r border-s-line bg-s-card px-3 py-4 shadow-[inset_3px_0_0_var(--s-accent)] lg:flex">
        {brand}
        <div className="mt-2 flex min-h-0 flex-1 flex-col">{nav}</div>
        {footer}
      </aside>

      {/* Phones and tablets: a top bar with the menu in a drawer. */}
      <header className="sticky top-10 z-30 flex h-16 items-center gap-2 border-b border-s-line bg-s-page/90 px-2 backdrop-blur-lg lg:hidden">
        <button type="button" aria-label="Open admin menu" aria-expanded={open} aria-controls="admin-drawer" onClick={() => setOpen(true)} className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70">
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <div className="min-w-0 flex-1">{brand}</div>
        <Link to="/dashboard" className="site-press inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-s-line bg-s-card px-3.5 text-sm font-semibold text-s-ink hover:bg-s-tint">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> <span className="hidden sm:inline">Back to site</span><span className="sm:hidden">Site</span>
        </Link>
      </header>
      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <button type="button" aria-label="Close admin menu" tabIndex={-1} onClick={() => setOpen(false)} className={`absolute inset-0 bg-s-ink/30 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
        <div id="admin-drawer" role="dialog" aria-modal="true" aria-label="Admin menu" className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-s-line bg-s-card p-3 shadow-xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between gap-2">
            {brand}
            <button type="button" aria-label="Close admin menu" onClick={() => setOpen(false)} className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70">
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
          {nav}
          {footer}
        </div>
      </div>

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-14 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        {title && (
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-s-ink">{title}</h1>
              {description && <p className="mt-1 max-w-2xl text-sm text-s-mute">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
      </div>
    </div>
  );
}
