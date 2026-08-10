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
    <div className="flex min-h-screen bg-surface-alt">
      <Sidebar active={sectionKey} onLogout={() => { logout(); window.location.href = "/signin"; }} />
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-ink-soft">This section isn't built yet — coming in the next pass.</p>
          <Link to="/dashboard" className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
