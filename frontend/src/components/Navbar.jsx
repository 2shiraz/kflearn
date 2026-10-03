import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import BrandMark from "./BrandMark";
import { Character, MedIcon } from "../site/Illustrations";
import {
  EXAM_GUIDE_COUNT,
  HANDOUT_COUNT,
  HISTORY_TOPIC_COUNT,
  MCQ_COUNT,
  OSPE_COUNT,
  SIGNUP_LABEL,
  demoPatient,
  plus,
} from "../site/siteContent";

const links = [
  { label: "Sample stations", to: "/sample-stations" },
  { label: "Pricing", to: "/pricing" },
  { label: "About", to: "/about" },
];

// What's inside, linking to each section of the features page.
const MODULES = [
  { id: "osce", icon: "stethoscope", tone: "bg-s-accent-soft", name: "OSCE stations", note: "AI patient and examiner checklist" },
  { id: "mcqs", icon: "books", tone: "bg-sky-soft", name: "MCQs", note: `${plus(MCQ_COUNT)} questions, first year to finals` },
  { id: "ospe", icon: "microscope", tone: "bg-mint-soft", name: "OSPE", note: `${plus(OSPE_COUNT)} stations with checklists` },
  { id: "clinical-examination", icon: "anatomical-heart", tone: "bg-coral-soft", name: "Clinical exam guide", note: `${EXAM_GUIDE_COUNT} examinations, step by step` },
  { id: "history-taking", icon: "clipboard", tone: "bg-sun-soft", name: "History taking guide", note: `${HISTORY_TOPIC_COUNT} presentations and a framework` },
  { id: "handouts", icon: "pill", tone: "bg-violet-soft", name: "Handout notes", note: `${HANDOUT_COUNT} handouts by system` },
];

// Full-width bar. Transparent over the top of the page, then a frosted
// background and hairline once the page scrolls (watched with an
// IntersectionObserver on a sentinel, not a scroll listener). Desktop links sit
// on a tinted track with a white indicator that slides to the hovered or
// current link. "Features" opens a panel listing every part of the app.
export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Escape and outside clicks close the features panel.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e) => headerRef.current && !headerRef.current.contains(e.target) && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  const solid = scrolled || menuOpen || mobileOpen;

  return (
    <>
      <div ref={sentinel} className="pointer-events-none absolute left-0 top-0 h-2 w-px" aria-hidden="true" />
      <header
        ref={headerRef}
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
          solid ? "border-s-line bg-s-page/85 shadow-[0_8px_24px_-20px_rgba(35,41,110,0.35)] backdrop-blur-lg" : "border-transparent bg-transparent"
        }`}
      >
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2.5" aria-label="KF LearnSmart home">
            <BrandMark size={36} />
            <span className="text-[15px] font-semibold tracking-tight text-s-ink">
              KF <span className="text-s-accent">LearnSmart</span>
            </span>
          </Link>

          <DesktopLinks pathname={pathname} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

          <div className="flex items-center gap-1.5">
            <Link to="/signin" className="site-press hidden rounded-full px-4 py-2.5 text-sm font-semibold text-s-ink hover:bg-s-tint lg:block">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="site-press group hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-s-ink py-2.5 pl-4 pr-3 text-sm font-semibold text-s-on-accent hover:bg-s-accent sm:inline-flex"
            >
              {SIGNUP_LABEL}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-s-on-accent/15 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight size={14} strokeWidth={2.25} aria-hidden="true" />
              </span>
            </Link>
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="site-mobile-menu"
              onClick={() => setMobileOpen((o) => !o)}
              className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-ink hover:bg-s-tint lg:hidden"
            >
              {mobileOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
          </div>
        </nav>

        {menuOpen && <FeaturesPanel onNavigate={() => setMenuOpen(false)} />}
        {mobileOpen && <MobileMenu onNavigate={() => setMobileOpen(false)} />}
      </header>
    </>
  );
}

function DesktopLinks({ pathname, menuOpen, setMenuOpen }) {
  const trackRef = useRef(null);
  const itemRefs = useRef({});
  const [hovered, setHovered] = useState(null);
  const [indicator, setIndicator] = useState(null);

  const activeKey = pathname === "/features" ? "features" : links.find((l) => pathname.startsWith(l.to))?.to || null;
  const target = hovered || (menuOpen ? "features" : activeKey);

  const measure = useCallback(() => {
    const el = target && itemRefs.current[target];
    const track = trackRef.current;
    if (!el || !track) return setIndicator(null);
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [target]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const itemClass = (key) =>
    `relative z-10 flex min-h-10 items-center gap-1 rounded-full px-4 text-sm font-medium transition-colors ${
      target === key ? "text-s-ink" : "text-s-mute hover:text-s-ink"
    }`;

  return (
    <div
      ref={trackRef}
      onMouseLeave={() => setHovered(null)}
      className="relative hidden items-center rounded-full border border-s-line/70 bg-s-tint/70 p-1 lg:flex"
    >
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute bottom-1 top-1 rounded-full bg-s-card shadow-[0_1px_2px_rgba(35,41,110,0.08),0_4px_12px_-6px_rgba(35,41,110,0.25)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ width: indicator.width, transform: `translateX(${indicator.left - 4}px)`, left: 4 }}
        />
      )}
      <button
        ref={(el) => (itemRefs.current.features = el)}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-features-panel"
        onClick={() => setMenuOpen((o) => !o)}
        onMouseEnter={() => setHovered("features")}
        onFocus={() => setHovered("features")}
        onBlur={() => setHovered(null)}
        className={itemClass("features")}
      >
        Features
        <ChevronDown size={15} strokeWidth={2} aria-hidden="true" className={`transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
      </button>
      {links.map((l) => (
        <NavLink
          key={l.to}
          ref={(el) => (itemRefs.current[l.to] = el)}
          to={l.to}
          onMouseEnter={() => setHovered(l.to)}
          onFocus={() => setHovered(l.to)}
          onBlur={() => setHovered(null)}
          className={itemClass(l.to)}
        >
          {l.label}
        </NavLink>
      ))}
    </div>
  );
}

function FeaturesPanel({ onNavigate }) {
  return (
    <div id="site-features-panel" className="hidden border-t border-s-line bg-s-page lg:block">
      <div className="mx-auto grid max-w-7xl gap-8 px-8 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ul className="site-rise grid grid-cols-2 gap-2 xl:grid-cols-3">
          {MODULES.map((m) => (
            <li key={m.id}>
              <Link to={`/features#${m.id}`} onClick={onNavigate} className="group flex items-center gap-3.5 rounded-2xl p-3 transition-colors hover:bg-s-card">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${m.tone} transition-transform duration-300 group-hover:-rotate-6`} aria-hidden="true">
                  <MedIcon name={m.icon} size={30} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-s-ink">{m.name}</span>
                  <span className="block truncate text-xs text-s-mute">{m.note}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/sample-stations"
          onClick={onNavigate}
          className="site-rise group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-s-accent p-5 text-s-on-accent"
          style={{ "--rise-delay": "60ms" }}
        >
          <div className="flex items-center gap-3">
            <Character name="patient-maya" size={44} tone="indigo" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{demoPatient.name}, {demoPatient.age}</p>
              <p className="truncate text-xs text-s-on-accent/75">{demoPatient.station}</p>
            </div>
          </div>
          <p className="mt-4 rounded-2xl rounded-tl-md bg-s-on-accent/12 px-3.5 py-2.5 text-sm leading-relaxed">{demoPatient.opening}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
            See sample stations
            <ArrowRight size={15} strokeWidth={2.25} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function MobileMenu({ onNavigate }) {
  return (
    <div id="site-mobile-menu" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-s-line bg-s-page lg:hidden">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <p className="px-1 text-xs font-medium text-s-mute">Features</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {MODULES.map((m) => (
            <li key={m.id}>
              <Link to={`/features#${m.id}`} onClick={onNavigate} className="flex min-h-12 items-center gap-2.5 rounded-xl bg-s-card p-2.5 text-sm font-medium text-s-ink">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.tone}`} aria-hidden="true">
                  <MedIcon name={m.icon} size={20} />
                </span>
                <span className="min-w-0 truncate">{m.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="mt-4 flex flex-col gap-1 border-t border-s-line pt-3">
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
        </ul>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-s-line pt-3">
          <Link to="/signin" className="flex min-h-12 items-center justify-center rounded-full border border-s-line text-sm font-semibold text-s-ink">
            Sign in
          </Link>
          <Link to="/signup" className="flex min-h-12 items-center justify-center rounded-full bg-s-ink px-3 text-center text-sm font-semibold text-s-on-accent">
            {SIGNUP_LABEL}
          </Link>
        </div>
      </div>
    </div>
  );
}
