import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Lock } from "lucide-react";
import { Character, HealthIcon } from "../site/Illustrations";
import PageShell from "../components/PageShell";
import { getPublicCreditPackages } from "../lib/api";
import { EXAM_GUIDE_COUNT, HANDOUT_COUNT, HISTORY_TOPIC_COUNT, MCQ_COUNT, OSPE_COUNT, SIGNUP_LABEL, formatCount } from "../site/siteContent";


const included = [
  { icon: "book", tone: "bg-sky-soft text-sky", label: `${formatCount(MCQ_COUNT)} MCQs with explanations` },
  { icon: "microscope", tone: "bg-mint-soft text-mint", label: `${formatCount(OSPE_COUNT)} OSPE stations with checklists` },
  { icon: "medicalRecords", tone: "bg-s-accent-soft text-s-accent", label: "Guided self-practice on every OSCE station" },
  { icon: "heart", tone: "bg-coral-soft text-coral", label: `${EXAM_GUIDE_COUNT} clinical examination guides` },
  { icon: "patient", tone: "bg-sun-soft text-sun", label: `${HISTORY_TOPIC_COUNT} history-taking guides` },
  { icon: "medicines", tone: "bg-violet-soft text-violet", label: `${HANDOUT_COUNT} handout notes` },
];

const creditUses = [
  { character: "patient-daniel", tone: "indigo", title: "AI virtual patient", body: "Interview the scripted patient by voice or text, with the checklist hidden." },
  { character: "examiner", tone: "mint", title: "AI assessment", body: "Your transcript is marked against the station checklist, with a summary and missed items." },
  { icon: "cardiogram", title: "Refunded on failure", body: "If an assessment cannot finish, its credits go back to your balance." },
];

export default function PricingPage() {
  const [state, setState] = useState({ loading: true, packages: [], error: "" });

  useEffect(() => {
    let cancelled = false;
    getPublicCreditPackages()
      .then((data) => !cancelled && setState({ loading: false, packages: data.packages || [], error: "" }))
      .catch(() => !cancelled && setState({ loading: false, packages: [], error: "Credit packages could not be loaded. Please refresh the page." }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <h1 className="site-rise max-w-3xl text-4xl font-semibold leading-tight text-s-ink md:text-5xl">Free to study. Credits for the AI.</h1>
        <p className="site-rise mt-5 max-w-2xl text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "80ms" }}>
          A free account includes the full study library. Buy credits only when you want to practise with the AI virtual patient.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:px-8">
        <div data-reveal className="site-grid site-shadow rounded-3xl border border-s-line p-6 md:p-8">
          <p className="text-sm font-semibold text-s-accent">Free account</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-s-ink">PKR 0</p>
          <p className="mt-2 text-s-mute">Everything you need to study, with no time limit.</p>
          <ul className="mt-6 space-y-3">
            {included.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-[15px] text-s-ink">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                  <HealthIcon name={item.icon} size={24} />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
          <Link
            to="/signup"
            className="site-press mt-8 flex items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-3 text-[15px] font-semibold text-s-on-accent hover:bg-s-accent-strong"
          >
            {SIGNUP_LABEL} <ArrowRight size={17} strokeWidth={2} />
          </Link>
        </div>

        <div data-reveal className="rounded-3xl border border-s-line bg-s-tint p-6 md:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-s-accent text-s-on-accent">
              <HealthIcon name="medicalRecords" size={28} />
            </span>
            <div>
              <p className="font-semibold text-s-ink">Credit packages</p>
              <p className="text-sm text-s-mute">One-time purchase. Credits stay in your account.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3" aria-busy={state.loading}>
            {state.loading &&
              [0, 1, 2].map((i) => <div key={i} className="h-18 animate-pulse rounded-xl bg-s-card" aria-hidden="true" />)}
            {state.error && <p className="rounded-xl bg-s-card px-4 py-3 text-sm text-s-miss">{state.error}</p>}
            {state.packages.map((pkg, i) => (
              <div
                key={pkg.id}
                className={`flex items-center justify-between gap-4 rounded-xl border bg-s-card px-5 py-4 ${i === 1 ? "border-s-accent" : "border-s-line"}`}
              >
                <div>
                  <p className="font-semibold text-s-ink">{pkg.name}</p>
                  <p className="text-sm text-s-mute">{formatCount(pkg.credits)} credits</p>
                </div>
                <p className="text-xl font-semibold tracking-tight text-s-ink">PKR {formatCount(pkg.pricePkr)}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 flex items-center gap-2 text-sm text-s-mute">
            <Lock size={15} strokeWidth={1.75} aria-hidden="true" /> Online payment is coming soon.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16 sm:px-6 lg:px-8 lg:py-20">
        <h2 data-reveal className="text-2xl font-semibold text-s-ink md:text-3xl">What credits are used for</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
          {creditUses.map((u, i) => (
            <div key={u.title} data-reveal style={{ "--reveal-delay": `${i * 60}ms` }} className={i === 0 ? "md:border-r md:border-s-line md:pr-6" : ""}>
              {u.character ? (
                <Character name={u.character} size={56} tone={u.tone} />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-soft text-violet">
                  <HealthIcon name={u.icon} size={30} />
                </span>
              )}
              <p className="mt-4 font-semibold text-s-ink">{u.title}</p>
              <p className="mt-1.5 leading-relaxed text-s-mute">{u.body}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-10 flex items-start gap-2 text-sm text-s-mute">
          <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-s-good" aria-hidden="true" />
          Your balance and history of credit use are shown in your account after you sign in.
        </p>
      </section>
    </PageShell>
  );
}
