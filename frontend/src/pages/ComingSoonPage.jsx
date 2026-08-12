import { Link } from "react-router-dom";
import { getCurrentUser, logout } from "../lib/api";
import Sidebar from "../components/Sidebar";

export default function ComingSoonPage({ sectionKey, title }) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/signin";
    return null;
  }

  return (
    <div className="app-gradient-bg flex min-h-screen">
      <Sidebar active={sectionKey} onLogout={() => { logout(); window.location.href = "/signin"; }} />
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="gradient-card rounded-[18px] p-8 text-center" style={{ "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(127,139,255,0.35)" }}>
          <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-2 text-ink-soft">This section isn't built yet - coming in the next pass.</p>
          <Link to="/dashboard" className="gradient-brand mt-6 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
