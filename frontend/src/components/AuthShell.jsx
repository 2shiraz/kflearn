import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

// Centred single-card layout for sign in and sign up.
export default function AuthShell({ children, footer }) {
  return (
    <div className="site flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-8 flex min-h-11 items-center gap-2.5" aria-label="KF LearnSmart home">
        <BrandMark />
        <span className="text-base font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
      </Link>
      <div className="site-shadow w-full max-w-md rounded-3xl border border-s-line bg-s-card p-6 sm:p-8">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-s-mute">{footer}</div>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-s-line bg-s-page px-4 py-3 text-[15px] text-s-ink outline-none transition placeholder:text-s-mute focus:border-s-accent focus:ring-2 focus:ring-s-accent/25";

export const primaryButtonClass =
  "site-press flex w-full items-center justify-center rounded-full bg-s-accent px-5 py-3 text-[15px] font-semibold text-s-on-accent hover:bg-s-accent-strong disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "site-press flex w-full items-center justify-center rounded-full border border-s-line bg-s-card px-5 py-3 text-[15px] font-semibold text-s-ink hover:border-s-accent disabled:cursor-not-allowed disabled:opacity-60";

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl border border-s-miss/30 bg-s-miss/10 px-4 py-3 text-sm text-s-miss">
      {children}
    </p>
  );
}
