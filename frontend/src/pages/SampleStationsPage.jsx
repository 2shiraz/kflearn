import { Link } from "react-router-dom";
import { ArrowRight, Check, ClipboardCheck, Clock } from "lucide-react";
import { Character, MedIcon } from "../site/Illustrations";
import PageShell from "../components/PageShell";
import { SIGNUP_LABEL, sampleStations } from "../site/siteContent";

// Icon and colour per specialty area.
const AREA = {
  Gastroenterology: { icon: "microbe", tone: "bg-mint-soft text-mint" },
  "Infectious diseases": { icon: "thermometer", tone: "bg-coral-soft text-coral" },
  "Gynaecology and obstetrics": { icon: "pregnant-woman", tone: "bg-violet-soft text-violet" },
};

const included = [
  "Candidate instructions: setting, patient and tasks",
  "A scripted patient for the AI virtual patient",
  "An examiner marking checklist",
  "Guided self-practice with the script and checklist open",
];

export default function SampleStationsPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <h1 className="site-rise max-w-3xl text-4xl font-semibold leading-tight text-s-ink md:text-5xl">Sample OSCE stations</h1>
        <p className="site-rise mt-5 max-w-2xl text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "80ms" }}>
          A selection of stations from the bank, shown with the brief you would read before walking in.
        </p>
      </section>

      <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_22rem] lg:gap-12 lg:px-8">
        <ul className="grid gap-4 md:grid-cols-2">
          {sampleStations.map((s, i) => (
            <li
              key={s.title}
              data-reveal
              style={{ "--reveal-delay": `${(i % 2) * 70}ms` }}
              className={`site-grid flex flex-col rounded-3xl border border-s-line p-6 ${i === 0 || i === sampleStations.length - 1 ? "md:col-span-2" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${AREA[s.area].tone}`}>
                  <MedIcon name={AREA[s.area].icon} size={28} />
                </span>
                <p className="font-chart text-xs text-s-mute">{s.area}</p>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-s-ink">{s.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-s-mute">{s.brief}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-s-line pt-4 text-sm text-s-mute">
                <span className="flex items-center gap-1.5">
                  <Clock size={15} strokeWidth={1.75} aria-hidden="true" /> 8 minutes
                </span>
                <span className="flex items-center gap-1.5">
                  <ClipboardCheck size={15} strokeWidth={1.75} aria-hidden="true" /> {s.kind}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <aside data-reveal className="site-shadow rounded-3xl border border-s-line bg-s-card p-6 lg:sticky lg:top-24">
          <div className="flex -space-x-3">
            <Character name="patient-maya" size={56} tone="indigo" className="ring-4 ring-s-card" />
            <Character name="examiner" size={56} tone="mint" className="ring-4 ring-s-card" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-s-ink">Every station includes</h2>
          <ul className="mt-4 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-s-ink">
                <Check size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-s-good" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-s-mute">
            Guided self-practice is included with a free account.
          </p>
          <Link
            to="/signup"
            className="site-press mt-6 flex items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-3 text-[15px] font-semibold text-s-on-accent hover:bg-s-accent-strong"
          >
            {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}
