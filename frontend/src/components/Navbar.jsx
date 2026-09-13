import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Menu, Stethoscope, X } from "lucide-react";

const links = [
  { label: "Features", to: "/features" },
  { label: "Sample Stations", to: "/sample-stations" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-5 lg:px-8">
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition hover:bg-white/70 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link to="/" className="flex items-center gap-2 whitespace-nowrap font-display text-base font-bold text-ink sm:text-lg">
          <span className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white">
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden h-9 w-9 items-center justify-center rounded-lg bg-ink/5 text-ink sm:flex">
            <Bell size={17} />
          </span>
          <Link to="/signin" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:block">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="gradient-brand whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white transition sm:px-5"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-white/95 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col px-4 py-3 text-sm font-medium text-ink-soft">
            {links.map((l) => (
              <li key={l.label}>
                <Link to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 transition hover:bg-black/5 hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-2">
              <Link to="/signin" onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2.5 transition hover:bg-black/5 hover:text-ink">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
