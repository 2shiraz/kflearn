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
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8">{children}</main>;
}

export function Panel({ children, className = "", ...props }) {
  return <div className={`glass-surface rounded-lg p-5 ${className}`} {...props}>{children}</div>;
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
