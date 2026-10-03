import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import BrandMark from "./BrandMark";
import { SIGNUP_LABEL } from "../site/siteContent";

const links = [
  { label: "Features", to: "/features" },
  { label: "Sample stations", to: "/sample-stations" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

// Full-width sticky bar with a soft frosted background.
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const linkClass = ({ isActive }) =>
    `site-press rounded-full px-3.5 py-2 text-sm font-medium ${
      isActive ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:text-s-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-s-line bg-s-page/85 backdrop-blur-lg">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2.5" aria-label="KF LearnSmart home">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link to="/signin" className="site-press hidden rounded-full px-4 py-3 text-sm font-semibold text-s-ink hover:bg-s-tint lg:block">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="site-press hidden whitespace-nowrap rounded-full bg-s-accent px-4 py-3 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong sm:block"
          >
            {SIGNUP_LABEL}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint lg:hidden"
          >
            {open ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="site-mobile-menu" className="border-t border-s-line bg-s-page lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `flex min-h-12 items-center rounded-xl px-3 text-[15px] font-medium ${isActive ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:bg-s-tint hover:text-s-ink"}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2 border-t border-s-line pt-3">
              <Link to="/signin" className="flex min-h-12 items-center justify-center rounded-full border border-s-line text-sm font-semibold text-s-ink">
                Sign in
              </Link>
              <Link to="/signup" className="flex min-h-12 items-center justify-center rounded-full bg-s-accent px-3 text-center text-sm font-semibold text-s-on-accent">
                {SIGNUP_LABEL}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
