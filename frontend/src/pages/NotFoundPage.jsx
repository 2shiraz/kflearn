import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Character } from "../site/Illustrations";

export default function NotFoundPage() {
  return (
    <main className="site site-app flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="site-rise site-grid site-shadow w-full max-w-md rounded-3xl border border-s-line p-8 text-center">
        <Character name="student-bilal" size={96} tone="sun" className="bob mx-auto" />
        <p className="mt-5 font-chart text-sm text-s-mute">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-s-ink">We couldn't find that page</h1>
        <p className="mt-2 leading-relaxed text-s-mute">The link may be old, or the page may have moved.</p>
        <Link to="/" className="site-press mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-s-accent px-5 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong">
          <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /> Back to home
        </Link>
      </div>
    </main>
  );
}
