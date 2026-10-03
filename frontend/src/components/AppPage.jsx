// Shared page chrome for signed-in app pages (dashboard, OSCE stations, the
// history-taking guide, admin, ...). Extracted out of OsceStationsPage.jsx so
// new sections can reuse the same sidebar/layout/breadcrumb primitives instead
// of redefining them. Styling follows the public site: the app sits inside the
// .site token scope, cards are rounded-3xl, buttons and chips are pills.
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight, RotateCw } from "lucide-react";
import Sidebar from "./Sidebar";
import { Character } from "../site/Illustrations";
import { getCurrentUser, logout } from "../lib/api";

function signOut() {
  logout();
  window.location.href = "/signin";
}

// The .site scope plus the app canvas. Also used by pages that mount the
// sidebar themselves (ComingSoonPage).
export function AppFrame({ active, children }) {
  return (
    <div className="site site-app flex min-h-dvh">
      <Sidebar active={active} onLogout={signOut} />
      {children}
    </div>
  );
}

export function RequireUser({ children, active = "stations", adminOnly = false }) {
  const user = getCurrentUser();
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
  return <AppFrame active={active}>{children}</AppFrame>;
}

export function PageMain({ children }) {
  // min-w-0 overrides the flex item's default min-width:auto — without it, a wide
  // descendant (e.g. a reference table) forces this whole column wider than the
  // viewport instead of scrolling within its own overflow-x-auto wrapper, which
  // pushes the sidebar+content flex row into a page-wide horizontal scroll.
  // pt-22 clears Sidebar's fixed mobile top bar (only rendered below sm).
  return <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-12 pt-22 sm:px-6 sm:pt-8 lg:px-8">{children}</main>;
}

// Page title block: optional eyebrow (mono label), title, description, and
// actions on the right.
export function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <div className={`site-rise flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="font-chart text-xs uppercase tracking-wider text-s-mute">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{title}</h1>
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

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-s-mute">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {item.to && !isLast ? (
              <Link to={item.to} className="rounded-full px-2 py-1.5 hover:bg-s-tint/70 hover:text-s-ink">{item.label}</Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined} className={isLast ? "px-2 py-1.5 font-medium text-s-ink" : "px-2 py-1.5"}>{item.label}</span>
            )}
            {!isLast && <ChevronRight size={14} strokeWidth={2} className="text-s-mute/60" aria-hidden="true" />}
          </span>
        );
      })}
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
