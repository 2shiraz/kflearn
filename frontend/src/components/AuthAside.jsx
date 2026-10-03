import { Character, MedIcon } from "../site/Illustrations";
import {
  EXAM_GUIDE_COUNT,
  HANDOUT_COUNT,
  HISTORY_TOPIC_COUNT,
  MCQ_COUNT,
  OSPE_COUNT,
  plus,
  sampleStations,
} from "../site/siteContent";

// Content for the indigo half of the sign in / sign up split screen. The
// indigo background itself comes from AuthShell.
function AsidePanel({ title, body, children, delay = "120ms" }) {
  return (
    <div className="site-rise" style={{ "--rise-delay": delay }}>
      <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h2>
      {body && <p className="mt-3 max-w-md leading-relaxed text-s-on-accent/80">{body}</p>}
      {children}
    </div>
  );
}

const STATS = [
  { icon: "books", value: plus(MCQ_COUNT), label: "MCQs" },
  { icon: "microscope", value: plus(OSPE_COUNT), label: "OSPE stations" },
  { icon: "anatomical-heart", value: EXAM_GUIDE_COUNT, label: "Examination guides" },
  { icon: "pill", value: HANDOUT_COUNT, label: "Handout notes" },
];

export function SigninAside() {
  const station = sampleStations[0];
  return (
    <AsidePanel title="Your practice is waiting" body="Your stations, questions and progress are right where you left them.">
      <ul className="mt-7 grid grid-cols-2 gap-3">
        {STATS.map((s) => (
          <li key={s.label} className="flex items-center gap-3 rounded-2xl bg-s-on-accent/10 p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-s-on-accent/15" aria-hidden="true">
              <MedIcon name={s.icon} size={26} />
            </span>
            <div className="min-w-0">
              <p className="font-chart text-lg font-semibold leading-tight">{s.value}</p>
              <p className="truncate text-xs text-s-on-accent/75">{s.label}</p>
            </div>
          </li>
        ))}
      </ul>

      <figure className="mt-5 flex items-start gap-4 rounded-2xl bg-s-card p-4 text-s-ink">
        <Character name="patient-maya" size={52} tone="coral" />
        <figcaption className="min-w-0">
          <p className="text-sm font-semibold">{station.title}</p>
          <p className="mt-0.5 text-xs text-s-mute">{station.area}, 8 minutes</p>
          <p className="mt-2 text-sm leading-relaxed text-s-mute">{station.brief}</p>
        </figcaption>
      </figure>
    </AsidePanel>
  );
}

const SIGNUP_POINTS = [
  { icon: "stethoscope", title: "OSCE stations with an AI patient", body: "Take the history by voice or text, then get marked on the examiner's checklist." },
  { icon: "books", title: `${plus(MCQ_COUNT)} MCQs`, body: "Sorted by year and module, from first year to finals." },
  { icon: "microscope", title: `${plus(OSPE_COUNT)} OSPE stations`, body: "Practise against the clock or read through with answers." },
  { icon: "clipboard", title: "Guides and handouts", body: `${HISTORY_TOPIC_COUNT} history topics, ${EXAM_GUIDE_COUNT} examination guides and ${HANDOUT_COUNT} handout notes.` },
];

export function SignupAside() {
  return (
    <AsidePanel title="Everything for your OSCE, OSPE and MCQs" body="One place to practise, from first year to finals.">
      <ul className="mt-7 space-y-3">
        {SIGNUP_POINTS.map((p) => (
          <li key={p.title} className="flex items-start gap-3.5 rounded-2xl bg-s-on-accent/10 p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-s-on-accent/15" aria-hidden="true">
              <MedIcon name={p.icon} size={28} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">{p.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-s-on-accent/80">{p.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-s-on-accent/80">Free to join. Guides, handouts, MCQs and OSPE are always free.</p>
    </AsidePanel>
  );
}
