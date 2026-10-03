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

// Floating pill navbar. The header itself is zero-height and sticky, so the
// pill floats over the top of each page (pages pad their first section to clear
// it) and content scrolls underneath the frosted glass.
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const linkClass = ({ isActive }) =>
    `site-press rounded-full px-3.5 py-2 text-sm font-medium ${
      isActive ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:bg-s-tint/70 hover:text-s-ink"
    }`;

  return (
    <header className="sticky top-0 z-40 h-0">
      <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-5 sm:pt-4">
        <nav
          aria-label="Main"
          className="site-glass flex h-15 items-center justify-between gap-3 rounded-full py-2 pl-2.5 pr-2 sm:pl-3"
        >
          <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-full pr-2" aria-label="KF LearnSmart home">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-s-ink">KF LearnSmart</span>
          </Link>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className={linkClass}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <Link to="/signin" className="site-press hidden rounded-full px-4 py-3 text-sm font-semibold text-s-ink hover:bg-s-tint/70 lg:block">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="site-press hidden whitespace-nowrap rounded-full bg-s-accent px-5 py-3 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong sm:block"
            >
              {SIGNUP_LABEL}
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="site-mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint/70 lg:hidden"
            >
              {open ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
          </div>
        </nav>

        {open && (
          <div id="site-mobile-menu" className="site-glass mt-2 rounded-3xl p-2 lg:hidden">
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      `flex min-h-12 items-center rounded-2xl px-4 text-[15px] font-medium ${isActive ? "bg-s-accent-soft text-s-ink" : "text-s-mute hover:bg-s-tint/70 hover:text-s-ink"}`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li className="mt-1 grid grid-cols-2 gap-2 border-t border-s-line p-2 pt-3">
                <Link to="/signin" className="flex min-h-12 items-center justify-center rounded-full border border-s-line bg-s-card text-sm font-semibold text-s-ink">
                  Sign in
                </Link>
                <Link to="/signup" className="flex min-h-12 items-center justify-center rounded-full bg-s-accent px-3 text-center text-sm font-semibold text-s-on-accent">
                  {SIGNUP_LABEL}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
