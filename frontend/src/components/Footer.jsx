import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";

const columns = [
  {
    heading: "Platform",
    links: [
      { label: "Features", to: "/features" },
      { label: "Sample Stations", to: "/sample-stations" },
      { label: "Pricing", to: "/pricing" },
      { label: "About", to: "/about" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Centre", to: "/help" },
      { label: "Report a Bug", to: "/report-bug" },
      { label: "System Status", to: "/status" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Medical Disclaimer", to: "/medical-disclaimer" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white/55 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="gradient-brand flex h-8 w-8 items-center justify-center rounded-[9px] text-white">
                <Stethoscope size={16} strokeWidth={2.5} />
              </span>
              <span className="font-display text-base font-bold text-ink">KF LearnSmart</span>
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              Digital Clinical Skills &amp; OSCE Practice Platform for Pakistani medical students.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold uppercase text-ink-soft">{col.heading}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-ink-soft transition hover:text-brand">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row">
          <p>&copy; 2026 KF LearnSmart. All rights reserved.</p>
          <p>Made for Pakistani medical students</p>
        </div>
      </div>
    </footer>
  );
}
