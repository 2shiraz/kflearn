import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="app-gradient-bg flex min-h-screen items-center justify-center px-6">
      <div className="gradient-card rounded-lg p-8 text-center" style={{ "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(127,139,255,0.35)" }}>
        <p className="font-display text-5xl font-extrabold text-brand">404</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">This page isn't built yet</h1>
        <p className="mt-1 text-ink-soft">Check back once this part of KF LearnSmart ships.</p>
        <Link to="/" className="gradient-brand mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition">
          Back to home
        </Link>
      </div>
    </div>
  );
}
