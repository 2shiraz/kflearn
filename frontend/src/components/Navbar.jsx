import { Link } from "react-router-dom";
import { Bell, Menu, Stethoscope } from "lucide-react";

const links = [
  { label: "Features", to: "/features" },
  { label: "Sample Stations", to: "/sample-stations" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <button type="button" aria-label="Menu" className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-white/70 md:hidden">
          <Menu size={22} />
        </button>
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="gradient-brand flex h-8 w-8 items-center justify-center rounded-[9px] text-white">
            <Stethoscope size={18} strokeWidth={2.5} />
          </span>
          KF LearnSmart
        </Link>

        <ul className="hidden flex-1 items-center justify-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Link to={l.to} className="transition hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink sm:flex">
            <Bell size={17} />
          </span>
          <Link to="/signin" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="gradient-brand rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
          >
            Start Free
          </Link>
        </div>
      </nav>
    </header>
  );
}
