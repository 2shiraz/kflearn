import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

// Sign in and sign up: the form card, with an optional content panel beside it
// on large screens (below the form on small ones).
export default function AuthShell({ children, footer, aside }) {
  return (
    <div className="site flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      <div className={`w-full ${aside ? "max-w-5xl" : "max-w-md"}`}>
        <Link to="/" className={`mb-8 flex min-h-11 w-fit items-center gap-2.5 ${aside ? "mx-auto lg:mx-0" : "mx-auto"}`} aria-label="KF LearnSmart home">
          <BrandMark />
          <span className="text-base font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
        </Link>
        <div className={aside ? "grid items-center gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-12" : ""}>
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div className="site-rise site-shadow rounded-3xl border border-s-line bg-s-card p-6 sm:p-8">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-s-mute">{footer}</div>}
          </div>
          {aside && <div className="mx-auto w-full max-w-md lg:max-w-none">{aside}</div>}
        </div>
      </div>
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
