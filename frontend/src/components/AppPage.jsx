// Shared page chrome for signed-in app pages (dashboard, OSCE stations, the
// history-taking guide, admin, ...). Extracted out of OsceStationsPage.jsx so
// new sections can reuse the same sidebar/layout/breadcrumb primitives instead
// of redefining them. Styling follows the public site: the app sits inside the
// .site token scope, cards are rounded-3xl, buttons and chips are pills.
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, ChevronRight, Lock, RotateCw } from "lucide-react";
import Sidebar from "./Sidebar";
import { Character } from "../site/Illustrations";
import { getCurrentUser, logout } from "../lib/api";
import { accessOpen, sectionOpen, useSite } from "../lib/site";
import AccessBanner from "./AccessBanner";
import Watermark from "./Watermark";

function signOut() {
  logout();
  window.location.href = "/signin";
}

// The .site scope plus the app canvas. Also used by pages that mount the
// sidebar themselves (ComingSoonPage).
// The welcome tour runs once on the dashboard after signup. Loaded only when
// it's about to show.
const WelcomeTour = lazy(() => import("./WelcomeTour"));

function TourGate({ active }) {
  if (active !== "dashboard" || !getCurrentUser()?.tourPending) return null;
  return (
    <Suspense fallback={null}>
      <WelcomeTour />
    </Suspense>
  );
}

export function AppFrame({ active, children }) {
  return (
    <div className="site site-app flex min-h-dvh">
      <Sidebar active={active} onLogout={signOut} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AccessBanner />
        {children}
      </div>
      <TourGate active={active} />
      <Watermark active={active} />
    </div>
  );
}

// Sidebar keys the admin can switch off (see Admin > Site access).
const SWITCHABLE_SECTIONS = ["stations", "mcqs", "ospe", "history", "clinical-exam", "handouts", "progress"];

// Pages an account can open without a monthly pass. Everything else (every
// study section and the dashboard) needs one.
const OPEN_WITHOUT_ACCESS = ["settings", "subscribe", "credits", "admin"];

export function RequireUser({ children, active = "stations", adminOnly = false }) {
  const user = getCurrentUser();
  const site = useSite();
  if (!user) {
    window.location.href = "/signin";
    return null;
  }
  if (adminOnly && user.role !== "admin") {
    return (
      <AppFrame active="admin">
        <PageMain>
          <EmptyState character="examiner" tone="coral" title="Admin access is required" body="This area is only open to admin accounts." action={<LinkButton to="/dashboard">Back to dashboard</LinkButton>} />
        </PageMain>
      </AppFrame>
    );
  }
  // No monthly pass: show the paywall instead of the page, so its content is
  // never even requested.
  if (!OPEN_WITHOUT_ACCESS.includes(active) && !accessOpen(site, user)) {
    if (!site.loaded) return <AppFrame active={active}><PageMain /></AppFrame>;
    return (
      <AppFrame active={active}>
        <PageMain>{active === "dashboard" ? <LockedWelcome user={user} /> : <Paywall />}</PageMain>
      </AppFrame>
    );
  }
  // Hold a switchable section back until the switches are known, so it never
  // shows and then disappears. They're cached from sign-in, so this is rare.
  if (SWITCHABLE_SECTIONS.includes(active) && user.role !== "admin" && !site.loaded) {
    return <AppFrame active={active}><PageMain /></AppFrame>;
  }
  if (SWITCHABLE_SECTIONS.includes(active) && !sectionOpen(site, active, user)) {
    return (
      <AppFrame active={active}>
        <PageMain>
          <EmptyState character="examiner" tone="sun" title="This section isn't available right now" body="It has been switched off for the moment. Everything else is open as usual." action={<LinkButton to="/dashboard">Back to dashboard</LinkButton>} />
        </PageMain>
      </AppFrame>
    );
  }
  return <AppFrame active={active}>{children}</AppFrame>;
}

// Column widths: "wide" for grids of cards, "focused" for one task at a time
// (answering a question, a station checklist), "reading" for long guide text.
// The breadcrumb, title and content all sit in the same centred column.
// Narrower widths centre the page content but leave the breadcrumb at the
// usual left edge, so it sits in the same place on every page.
const MAIN_WIDTHS = {
  wide: "",
  reading: "[&>*:not([data-crumbs])]:mx-auto [&>*:not([data-crumbs])]:max-w-4xl",
  focused: "[&>*:not([data-crumbs])]:mx-auto [&>*:not([data-crumbs])]:max-w-3xl",
  split: "[&>*:not([data-crumbs])]:mx-auto [&>*:not([data-crumbs])]:max-w-5xl",
};

export function PageMain({ children, width = "wide" }) {
  // min-w-0 overrides the flex item's default min-width:auto — without it, a wide
  // descendant (e.g. a reference table) forces this whole column wider than the
  // viewport instead of scrolling within its own overflow-x-auto wrapper, which
  // pushes the sidebar+content flex row into a page-wide horizontal scroll.
  // pt-22 clears Sidebar's fixed mobile top bar (only rendered below sm).
  return <main className={`mx-auto w-full min-w-0 max-w-7xl ${MAIN_WIDTHS[width]} flex-1 px-4 pb-12 pt-22 sm:px-6 sm:pt-8 lg:px-8`}>{children}</main>;
}

// Page title block: title, optional description, and actions on the right.
// Always followed by the same gap before the page content.
export function PageHeader({ title, description, actions, className = "" }) {
  return (
    <div className={`site-rise mb-8 flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl leading-relaxed text-s-mute">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className = "", ...props }) {
  // Same min-w-0 fix, one level down: Panels sit in grids/flex rows of their own
  // (dashboard cards, guide sections) and are just as susceptible.
  return <div className={`site-grid min-w-0 rounded-3xl border border-s-line p-5 sm:p-6 ${className}`} {...props}>{children}</div>;
}

const primaryClass =
  "site-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-2.5 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong disabled:pointer-events-none disabled:opacity-50";
const secondaryClass =
  "site-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-s-line bg-s-card px-5 py-2.5 text-sm font-semibold text-s-ink hover:border-s-accent/40 hover:bg-s-tint/60 disabled:pointer-events-none disabled:opacity-50";

export function PrimaryButton({ children, className = "", ...props }) {
  return <button className={`${primaryClass} ${className}`} {...props}>{children}</button>;
}

export function SecondaryButton({ children, className = "", type = "button", ...props }) {
  return <button type={type} className={`${secondaryClass} ${className}`} {...props}>{children}</button>;
}

export function LinkButton({ children, to, className = "", variant = "primary" }) {
  return <Link to={to} className={`${variant === "secondary" ? secondaryClass : primaryClass} ${className}`}>{children}</Link>;
}

// Parent trail only. The page's own title is already its heading, and "Home"
// is the sidebar's Dashboard link, so neither is repeated here. Top-level
// pages end up with no trail and render nothing.
export function Breadcrumbs({ items }) {
  const trail = items.slice(0, -1).filter((item) => item.label !== "Home");
  if (trail.length === 0) return null;
  return (
    <nav data-crumbs aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-s-mute">
      {trail.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 && <ChevronRight size={14} strokeWidth={2} className="text-s-mute/60" aria-hidden="true" />}
          {item.to ? (
            <Link to={item.to} className="-mx-1 rounded-md px-1 py-1 hover:text-s-ink hover:underline">{item.label}</Link>
          ) : (
            <span className="py-1">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// Inline error in coral, with an optional retry.
export function ErrorMessage({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-coral/25 bg-coral-soft/60 p-4 text-sm text-s-miss">
      <AlertCircle size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="site-press inline-flex min-h-11 items-center gap-1.5 rounded-full bg-s-card px-4 font-semibold text-s-miss ring-1 ring-coral/30 hover:bg-coral-soft">
          <RotateCw size={15} strokeWidth={2} aria-hidden="true" /> Try again
        </button>
      )}
    </div>
  );
}

// Friendly empty state with a pixel-art character.
export function EmptyState({ character = "student-ayesha", tone = "indigo", title, body, action, className = "" }) {
  return (
    <div className={`site-grid flex flex-col items-center rounded-3xl border border-s-line px-6 py-12 text-center ${className}`}>
      <Character name={character} size={88} tone={tone} className="bob" />
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-s-ink">{title}</h2>
      {body && <p className="mt-2 max-w-md leading-relaxed text-s-mute">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Shown in place of any study page when the account has no active pass.
function Paywall() {
  return (
    <div className="site-rise mx-auto mt-6 max-w-xl rounded-3xl border border-s-line bg-s-card p-8 text-center sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-s-accent-soft text-s-accent" aria-hidden="true">
        <Lock size={26} strokeWidth={2} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-s-ink">This is part of monthly access</h1>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-s-mute">
        OSCE stations, MCQs, OSPE, the guides and handout notes all unlock with a monthly access pass.
      </p>
      <LinkButton to="/subscribe" className="mt-7">
        Get access <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
      </LinkButton>
    </div>
  );
}

// The dashboard for an account without a pass.
function LockedWelcome({ user }) {
  const first = user?.fullName?.split(" ")[0];
  return (
    <div className="site-rise grid items-center gap-8 rounded-3xl border border-s-line bg-s-card p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{first ? `Welcome, ${first}` : "Welcome"}</h1>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-s-mute">
          Your account is ready. Get monthly access to open every OSCE station, the MCQ bank, OSPE stations, the guides and handout notes.
        </p>
        <LinkButton to="/subscribe" className="mt-7">
          Get access <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </LinkButton>
      </div>
      <div className="hidden -space-x-4 md:flex" aria-hidden="true">
        <Character name="student-ayesha" size={88} tone="sky" className="ring-4 ring-s-card" />
        <Character name="examiner" size={88} tone="mint" className="ring-4 ring-s-card" />
      </div>
    </div>
  );
}
