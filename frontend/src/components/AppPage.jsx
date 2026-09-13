// Shared page chrome for signed-in app pages (dashboard, OSCE stations, the
// history-taking guide, admin, ...). Extracted out of HistoryTakingPage.jsx so
// new sections can reuse the same sidebar/layout/breadcrumb primitives instead
// of redefining them.
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getCurrentUser, logout } from "../lib/api";

export function RequireUser({ children, active = "stations", adminOnly = false }) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/signin";
    return null;
  }
  if (adminOnly && user.role !== "admin") {
    return (
      <div className="app-gradient-bg flex min-h-screen">
        <Sidebar active="admin" onLogout={() => { logout(); window.location.href = "/signin"; }} />
        <PageMain>
          <ErrorMessage message="Admin access is required." />
        </PageMain>
      </div>
    );
  }
  return (
    <div className="app-gradient-bg flex min-h-screen">
      <Sidebar active={active} onLogout={() => { logout(); window.location.href = "/signin"; }} />
      {children}
    </div>
  );
}

export function PageMain({ children }) {
  // min-w-0 overrides the flex item's default min-width:auto — without it, a wide
  // descendant (e.g. a reference table) forces this whole column wider than the
  // viewport instead of scrolling within its own overflow-x-auto wrapper, which
  // pushes the sidebar+content flex row into a page-wide horizontal scroll.
  // mt-14 clears Sidebar's fixed mobile header bar (only rendered below sm).
  return <main className="mx-auto mt-14 w-full min-w-0 max-w-7xl flex-1 px-4 py-6 sm:mt-0 sm:px-5 sm:py-8 lg:px-8">{children}</main>;
}

export function Panel({ children, className = "", ...props }) {
  // Same min-w-0 fix, one level down: Panels sit in grids/flex rows of their own
  // (dashboard cards, guide sections) and are just as susceptible.
  return <div className={`glass-surface min-w-0 rounded-lg p-4 sm:p-5 ${className}`} {...props}>{children}</div>;
}

export function PrimaryButton({ children, className = "", ...props }) {
  return <button className={`gradient-brand rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

export function LinkButton({ children, to, className = "" }) {
  return <Link to={to} className={`gradient-brand inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${className}`}>{children}</Link>;
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-base text-ink-soft">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.to && !isLast ? (
              <Link to={item.to} className="underline decoration-line underline-offset-2 hover:text-ink">{item.label}</Link>
            ) : (
              <span className={isLast ? "font-extrabold text-ink" : ""}>{item.label}</span>
            )}
            {!isLast && <span className="text-ink-soft/70">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

export function ErrorMessage({ message }) {
  return <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>;
}
