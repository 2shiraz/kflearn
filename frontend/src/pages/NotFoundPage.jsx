import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-alt px-6">
      <div className="text-center">
        <p className="font-display text-5xl font-bold text-brand">404</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">This page isn't built yet</h1>
        <p className="mt-1 text-ink-soft">Check back once this part of KF LearnSmart ships.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Back to home
        </Link>
      </div>
    </div>
  );
}
