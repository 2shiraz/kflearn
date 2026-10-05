import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { getCurrentUser, markTourDone } from "../lib/api";
import { MedIcon, UserAvatar } from "../site/Illustrations";
import { TONES } from "../site/tones";

// First-run walkthrough. Each step points at a real sidebar item (matched by
// its data-tour attribute) with a spotlight cut out of a dimmed page, and a
// card beside it explaining what lives there. Steps without a target, or whose
// target isn't on screen (phones hide the sidebar in a drawer), show the card
// centred instead.
const STEPS = [
  {
    id: "welcome",
    title: (name) => `Welcome to KF LearnSmart${name ? `, ${name}` : ""}`,
    body: "Here's a quick look around so you know where everything is. It takes under a minute.",
  },
  {
    id: "dashboard",
    target: ["dashboard"],
    fallback: "menu",
    icons: [{ name: "hospital", tone: "indigo" }],
    title: "Your dashboard",
    body: "Your starting point each day, with every section one click away.",
    mobileBody: "Every section lives in this menu. The dashboard is your starting point each day.",
  },
  {
    id: "stations",
    target: ["stations"],
    icons: [{ name: "stethoscope", tone: "indigo" }],
    title: "OSCE stations",
    body: "Take a history from an AI patient who answers like a real one, by voice or text. Or work through a station with its checklist and mark yourself.",
  },
  {
    id: "papers",
    target: ["mcqs", "ospe"],
    icons: [{ name: "book", tone: "sky" }, { name: "microscope", tone: "mint" }],
    title: "MCQs and OSPE",
    body: "Past paper questions and practical stations, sorted by year. Read them with the answers, or practise and get scored as you go.",
  },
  {
    id: "guides",
    target: ["group-guides"],
    icons: [{ name: "patient", tone: "sun" }, { name: "heart", tone: "coral" }, { name: "medicines", tone: "violet" }],
    title: "Guides and notes",
    body: "History taking, clinical exam steps and handout notes. Revise a topic here before you try its station.",
  },
  {
    id: "progress",
    target: ["progress"],
    icons: [{ name: "chart-increasing", tone: "indigo" }],
    title: "Progress",
    body: "Your scores over time, your weaker specialties and the checklist items you miss most, so you know what to practise next.",
  },
  {
    id: "access",
    target: ["subscribe"],
    icons: [{ name: "memo", tone: "indigo" }],
    title: "Get access",
    body: "A monthly access pass opens every study section. Check your status and the plan from Monthly access in the menu.",
  },
  {
    id: "credits",
    target: ["credits"],
    icons: [{ name: "coin", tone: "sun" }],
    title: "AI credits",
    body: "The AI patient and AI marking use AI credits. Checklist practice, MCQs, OSPE and the guides are all part of your monthly pass.",
  },
  {
    id: "done",
    icons: [{ name: "raised-hand", tone: "mint" }],
    title: "You're all set",
    body: "A good first step is one OSCE station. Pick any topic and give it a go.",
  },
];

const GAP = 18; // space between the spotlight and the card
const EDGE = 16; // minimum distance from the viewport edge
const PAD = 6; // spotlight padding around its target

function isVisible(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth && !el.closest("[inert]");
}

function findTarget(keys) {
  const found = [];
  for (const key of keys) {
    const el = [...document.querySelectorAll(`[data-tour="${key}"]`)].find(isVisible);
    if (el) found.push(el);
  }
  if (found.length === 0) return null;
  found[0].scrollIntoView({ block: "nearest" });
  const rects = found.map((el) => el.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left)) - PAD;
  const top = Math.min(...rects.map((r) => r.top)) - PAD;
  return {
    left,
    top,
    width: Math.max(...rects.map((r) => r.right)) + PAD - left,
    height: Math.max(...rects.map((r) => r.bottom)) + PAD - top,
  };
}

function resolve(step) {
  if (!step.target) return { rect: null, fallback: false };
  const rect = findTarget(step.target);
  if (rect) return { rect, fallback: false };
  const alt = step.fallback ? findTarget([step.fallback]) : null;
  return { rect: alt, fallback: Boolean(alt) };
}

// Where the card goes: beside the spotlight when there's room on the right
// (the sidebar), below it otherwise (the phone top bar), centred with none.
function placeCard(rect, card, view) {
  if (!rect) {
    return { left: (view.w - card.w) / 2, top: Math.max(EDGE, (view.h - card.h) / 2), arrow: null };
  }
  if (rect.left + rect.width + GAP + card.w + EDGE <= view.w) {
    const left = rect.left + rect.width + GAP;
    const top = Math.min(Math.max(rect.top + rect.height / 2 - card.h / 2, EDGE), view.h - card.h - EDGE);
    const y = Math.min(Math.max(rect.top + rect.height / 2 - top, 24), card.h - 24);
    return { left, top, arrow: { side: "left", at: y } };
  }
  const left = Math.min(Math.max(rect.left + rect.width / 2 - card.w / 2, EDGE), view.w - card.w - EDGE);
  const top = rect.top + rect.height + GAP;
  const x = Math.min(Math.max(rect.left + rect.width / 2 - left, 24), card.w - 24);
  return { left, top, arrow: { side: "top", at: x } };
}

export default function WelcomeTour() {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const cardRef = useRef(null);
  const primaryRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState({ rect: null, fallback: false });
  const [card, setCard] = useState({ w: 352, h: 260 });
  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight });

  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const user = getCurrentUser();
  const firstName = user?.fullName?.split(" ")[0] || "";

  // Let the dashboard settle in before dimming it.
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  // Find this step's target, and again whenever the window changes size.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      setView({ w: window.innerWidth, h: window.innerHeight });
      setTarget(resolve(STEPS[index]));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, index]);

  // Track the card's real size so it can be placed without overflowing.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!open || !el) return undefined;
    const update = () => setCard({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const observer = new window.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (open) primaryRef.current?.focus();
  }, [open, index]);

  const finish = useCallback((to) => {
    markTourDone();
    dialogRef.current?.close();
    setOpen(false);
    if (to) navigate(to);
  }, [navigate]);

  const next = useCallback(() => (last ? finish() : setIndex((i) => i + 1)), [last, finish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  function onKeyDown(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      back();
    }
  }

  if (!open) return null;

  const { rect, fallback } = target;
  const place = placeCard(rect, card, view);
  const title = typeof step.title === "function" ? step.title(firstName) : step.title;
  const body = fallback && step.mobileBody ? step.mobileBody : step.body;
  // With no target the spotlight shrinks to a point in the middle, so the
  // whole page stays dimmed and the hole grows out of it on the next step.
  const hole = rect || { left: view.w / 2, top: view.h / 2, width: 0, height: 0 };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      onCancel={(e) => {
        e.preventDefault();
        finish();
      }}
      onKeyDown={onKeyDown}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-s-ink backdrop:bg-transparent"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed rounded-2xl motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] ${rect ? "ring-2 ring-s-card" : ""}`}
        style={{
          left: hole.left,
          top: hole.top,
          width: hole.width,
          height: hole.height,
          boxShadow: "0 0 0 200vmax color-mix(in srgb, var(--s-ink) 52%, transparent)",
        }}
      />

      <section
        ref={cardRef}
        className="fixed w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-s-line bg-s-card shadow-2xl motion-safe:transition-[left,top] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ left: place.left, top: place.top }}
      >
        {place.arrow && (
          <span
            aria-hidden="true"
            className={`absolute h-3.5 w-3.5 rotate-45 bg-s-card ${place.arrow.side === "left" ? "-left-[7px] border-b border-l border-s-line" : "-top-[7px] border-l border-t border-s-line"}`}
            style={place.arrow.side === "left" ? { top: place.arrow.at - 7 } : { left: place.arrow.at - 7 }}
          />
        )}

        <div key={step.id} className="site-rise p-6" style={{ "--rise-delay": "60ms" }}>
          <div className="flex items-start justify-between gap-3">
            <StepArt step={step} avatar={user?.avatar} />
            <button
              type="button"
              onClick={() => finish()}
              aria-label="Skip tour"
              title="Skip tour"
              className="site-press -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-tint/70 hover:text-s-ink"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <h2 id="tour-title" className="mt-4 text-xl font-semibold tracking-tight text-s-ink">{title}</h2>
          <p id="tour-body" className="mt-2 text-[15px] leading-relaxed text-s-mute">{body}</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-s-line px-6 py-4">
          <Dots index={index} />
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button type="button" onClick={back} aria-label="Previous step" className="site-press flex h-11 w-11 items-center justify-center rounded-full border border-s-line text-s-ink hover:bg-s-tint/70">
                <ArrowLeft size={16} strokeWidth={2} />
              </button>
            )}
            {last ? (
              <button ref={primaryRef} type="button" onClick={() => finish("/stations")} className="site-press inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-s-accent px-5 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong">
                Try a station <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : (
              <button ref={primaryRef} type="button" onClick={next} className="site-press inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-s-accent px-5 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong">
                {index === 0 ? "Show me around" : "Next"} <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    </dialog>
  );
}

// The welcome step shows the student's own avatar; the rest show the icons
// of the sections they point at, in each section's colour.
function StepArt({ step, avatar }) {
  if (step.id === "welcome") {
    return avatar ? <UserAvatar id={avatar} size={56} /> : <MedIcon name="health-worker" size={48} />;
  }
  return (
    <div className="flex -space-x-2">
      {step.icons.map((icon) => (
        <span key={icon.name} className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-4 ring-s-card ${TONES[icon.tone].soft}`}>
          <MedIcon name={icon.name} size={32} />
        </span>
      ))}
    </div>
  );
}

function Dots({ index }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="sr-only">Step {index + 1} of {STEPS.length}</span>
      {STEPS.map((s, i) => (
        <span
          key={s.id}
          aria-hidden="true"
          className={`h-1.5 rounded-full motion-safe:transition-all motion-safe:duration-300 ${i === index ? "w-5 bg-s-accent" : i < index ? "w-1.5 bg-s-accent/40" : "w-1.5 bg-s-line"}`}
        />
      ))}
    </div>
  );
}
