import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";
import { HealthIcon } from "../site/Illustrations";
import { SiteName } from "../lib/branding";

// Sign in and sign up. With `aside`, a vertical split screen on large
// screens: an indigo content half on the left and the form on the right. On
// small screens the form comes first and the indigo section follows it.
export default function AuthShell({ children, footer, aside }) {
  const form = (
    <div className="w-full max-w-md">
      <Link to="/" className={`mb-8 flex min-h-11 w-fit items-center gap-2.5 ${aside ? "lg:hidden" : "mx-auto"}`} aria-label="KF LearnSmart home">
        <BrandMark />
        <span className="text-base font-semibold tracking-tight text-s-ink"><SiteName /></span>
      </Link>
      <div className={`site-rise ${aside ? "" : "site-shadow rounded-3xl border border-s-line bg-s-card p-6 sm:p-8"}`}>{children}</div>
      {footer && <div className={`mt-6 text-sm text-s-mute ${aside ? "" : "text-center"}`}>{footer}</div>}
    </div>
  );

  if (!aside) {
    return <div className="site flex min-h-dvh flex-col items-center justify-center px-4 py-12">{form}</div>;
  }

  return (
    <div className="site grid min-h-dvh bg-s-card lg:grid-cols-2">
      <main className="flex items-center justify-center px-4 py-10 sm:px-8 lg:order-2 lg:px-12">{form}</main>

      <section className="relative overflow-hidden bg-s-accent text-s-on-accent lg:order-1">
        <span className="pointer-events-none absolute -bottom-16 -right-16 opacity-[0.07]" aria-hidden="true">
          <HealthIcon name="stethoscope" size={300} />
        </span>
        <div className="relative mx-auto flex h-full max-w-xl flex-col px-6 py-10 sm:px-10 lg:py-12">
          <Link to="/" className="hidden min-h-11 w-fit items-center gap-2.5 lg:flex" aria-label="KF LearnSmart home">
            <img src="/logo-white.svg" alt="" width={36} height={36} />
            <span className="text-base font-semibold tracking-tight"><SiteName /></span>
          </Link>
          <div className="lg:my-auto lg:py-12">{aside}</div>
        </div>
      </section>
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
