import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import PageShell from "../components/PageShell";
import { getCurrentUser } from "../lib/api";
import { usePublicPricing, usePublicStats } from "../lib/publicStats";
import { Character, HealthIcon, MedIcon } from "../site/Illustrations";
import { formatCount, plus } from "../site/siteContent";

const PLAN_CTA = "Get monthly access";

// Signed-in visitors go straight to their subscription page.
const planLink = () => (getCurrentUser() ? "/subscribe" : "/signup");

export default function PricingPage() {
  const pricing = usePublicPricing();
  const stats = usePublicStats();
  const { plan } = pricing;

  return (
    <PageShell>
      <section className="site-hero border-b border-s-line">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-16 lg:px-8">
          <h1 className="site-rise max-w-3xl text-4xl font-semibold leading-tight text-s-ink md:text-5xl">
            One pass for the whole library.
          </h1>
          <p className="site-rise mt-5 max-w-2xl text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "80ms" }}>
            A monthly access pass unlocks every OSCE station, question bank, guide and handout. Add AI credits when you want to practise with the AI patient.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.1fr_1fr] lg:px-8">
        <PlanCard plan={plan} stats={stats} loaded={pricing.loaded} />
        <CreditPacks packages={pricing.packages} loaded={pricing.loaded} />
      </section>

      <HowItWorks plan={plan} />
      <PricingFaq plan={plan} />
    </PageShell>
  );
}

function PlanCard({ plan, stats, loaded }) {
  const included = [
    { icon: "medicalRecords", tone: "bg-s-accent-soft text-s-accent", label: stats.osce.total > 0 ? `${plus(stats.osce.total)} OSCE stations with guided self-practice` : "OSCE stations with guided self-practice" },
    { icon: "book", tone: "bg-sky-soft text-sky", label: `${plus(stats.mcq.total)} MCQs with explanations` },
    { icon: "microscope", tone: "bg-mint-soft text-mint", label: `${plus(stats.ospe.total)} OSPE stations with checklists` },
    { icon: "heart", tone: "bg-coral-soft text-coral", label: `${plus(stats.examGuides.total)} clinical examination guides` },
    { icon: "patient", tone: "bg-sun-soft text-sun", label: `${plus(stats.historyGuides.total)} history-taking guides` },
    { icon: "medicines", tone: "bg-violet-soft text-violet", label: `${plus(stats.handouts.total)} handout notes` },
  ];

  return (
    <div data-reveal className="site-grid site-shadow flex flex-col rounded-3xl border border-s-line p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-s-accent">Monthly access</p>
          <p className={`mt-2 text-4xl font-semibold tracking-tight text-s-ink transition-opacity ${loaded ? "" : "opacity-60"}`}>
            <span className="mr-1 text-lg font-medium text-s-mute">PKR</span>
            {formatCount(plan.pricePkr)}
          </p>
          <p className="mt-1 font-chart text-sm text-s-mute">for {plan.periodDays} days of full access</p>
        </div>
        <div className="flex -space-x-3" aria-hidden="true">
          <Character name="student-ayesha" size={48} tone="sky" className="ring-4 ring-s-card" />
          <Character name="student-bilal" size={48} tone="sun" className="ring-4 ring-s-card" />
        </div>
      </div>
      <ul className="mt-7 flex-1 space-y-3">
        {included.map((item) => (
          <li key={item.icon} className="flex items-center gap-3 text-[15px] text-s-ink">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
              <MedIcon name={item.icon} size={24} />
            </span>
            {item.label}
          </li>
        ))}
      </ul>
      <Link
        to={planLink()}
        className="site-press mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-s-accent px-5 py-3 text-[15px] font-medium text-s-on-accent hover:bg-s-accent-strong"
      >
        {PLAN_CTA} <ArrowRight size={17} strokeWidth={2} />
      </Link>
      <p className="mt-3 text-center text-sm text-s-mute">Doesn't renew by itself. Renew whenever you like.</p>
    </div>
  );
}

const packPerks = [
  "The AI virtual patient on every OSCE station",
  "AI marking against the examiner checklist",
  "A score, a written summary and the items you missed",
];

function CreditPacks({ packages, loaded }) {
  const groupId = useId();
  const [picked, setPicked] = useState(null);
  const bestValueId = packages.length
    ? packages.reduce((best, p) => (p.pricePkr / p.credits < best.pricePkr / best.credits ? p : best)).id
    : null;
  const active = packages.find((p) => p.id === picked) || packages[Math.min(1, packages.length - 1)];

  return (
    <div data-reveal className="relative overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent md:p-8">
      <span className="pointer-events-none absolute -right-10 -top-10 text-white/10" aria-hidden="true">
        <HealthIcon name="stethoscope" size={200} />
      </span>

      <div className="relative">
        <p className="text-sm font-medium opacity-80">AI credit packs</p>
        <h2 className="mt-2 max-w-md text-2xl font-semibold leading-snug md:text-3xl">Practise with the AI patient</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed opacity-85">Used alongside an active monthly pass. Unused AI credits stay in your account.</p>

        {!loaded && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading packs">
            <div className="h-12 animate-pulse rounded-full bg-white/15" />
            <div className="h-36 animate-pulse rounded-2xl bg-white/15" />
          </div>
        )}
        {loaded && !active && <p className="mt-6 rounded-2xl bg-white/15 px-4 py-3 text-sm">AI credit packs aren't on sale right now.</p>}

        {loaded && active && (
          <>
            <div role="radiogroup" aria-labelledby={`${groupId}-label`} className="mt-6 grid gap-1 rounded-full bg-white/12 p-1" style={{ gridTemplateColumns: `repeat(${packages.length}, minmax(0, 1fr))` }}>
              <span id={`${groupId}-label`} className="sr-only">Choose a pack</span>
              {packages.map((p) => {
                const on = p.id === active.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPicked(p.id)}
                    className={`site-press min-h-11 truncate rounded-full px-3 text-sm font-medium transition-colors ${on ? "bg-s-card text-s-accent-strong" : "text-s-on-accent/85 hover:bg-white/10"}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-s-card p-5 text-s-ink md:p-6" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{active.name}</p>
                  <p className="mt-1 font-chart text-sm text-s-mute">{formatCount(active.credits)} AI credits</p>
                </div>
                {active.id === bestValueId && (
                  <span className="rounded-full bg-mint-soft px-3 py-1 text-xs font-medium text-mint">Best value</span>
                )}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight">
                <span className="mr-1 text-lg font-medium text-s-mute">PKR</span>
                {formatCount(active.pricePkr)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {packPerks.map((perk) => (
                  <li key={perk} className="flex gap-2.5 text-[15px] leading-snug">
                    <Check size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-s-good" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-sm opacity-80">One-time purchase. Your balance is always visible in your account.</p>
          </>
        )}
      </div>
    </div>
  );
}

function HowItWorks({ plan }) {
  const points = [
    { icon: "memo", tone: "bg-sky-soft text-sky", title: `${plan.periodDays} days per pass`, body: `Each pass adds ${plan.periodDays} days. Renew early and the new days go on top of the ones you have left.` },
    { icon: "reminder-ribbon", tone: "bg-sun-soft text-sun", title: `${plan.graceDays} extra days to renew`, body: `When a pass ends you keep access for ${plan.graceDays} more days, with a reminder to renew. Your progress is always kept.` },
    { icon: "person-standing", tone: "bg-mint-soft text-mint", title: "One person, two devices", body: "Each account is for one student, signed in on up to two devices at a time." },
  ];
  return (
    <section className="border-y border-s-line bg-s-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <h2 data-reveal className="text-2xl font-semibold text-s-ink md:text-3xl">How your pass works</h2>
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {points.map((p, i) => (
            <li key={p.title} data-reveal style={{ "--reveal-delay": `${i * 70}ms` }} className="flex gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${p.tone}`}>
                <MedIcon name={p.icon} size={28} />
              </span>
              <div>
                <h3 className="text-lg font-medium text-s-ink">{p.title}</h3>
                <p className="mt-1.5 leading-relaxed text-s-mute">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PricingFaq({ plan }) {
  const [open, setOpen] = useState(0);
  const faqs = [
    { q: "What does the monthly pass include?", a: "Every OSCE station with guided self-practice, the MCQ bank, OSPE stations, the clinical examination and history-taking guides, handout notes and your progress tracking." },
    { q: "What needs AI credits?", a: "Only sessions with the AI virtual patient and AI marking. They use AI credits on top of an active monthly pass. If an AI assessment doesn't finish, the AI credits go straight back to your balance." },
    { q: "Does the pass renew by itself?", a: `No. Each pass gives you ${plan.periodDays} days and nothing is charged automatically. Renew before it ends and the new days are added to the ones you have left. Renew after it ends and the new ${plan.periodDays} days start that day.` },
    { q: "What happens when my pass ends?", a: `You keep full access for ${plan.graceDays} more days so you have time to renew. After that the library locks until you renew. Your attempts, scores and AI credits stay in your account.` },
    { q: "Can I share my account?", a: "No. Each account is for one student and can be signed in on up to two devices at a time. Signing in on a third device signs out the oldest one. Shared accounts may be suspended." },
  ];
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <h2 data-reveal className="text-2xl font-semibold text-s-ink md:text-3xl">Pricing questions</h2>
      <div data-reveal className="mt-6 divide-y divide-s-line border-y border-s-line">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q}>
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex min-h-14 w-full items-center justify-between gap-6 py-4 text-left text-[17px] font-medium text-s-ink"
                >
                  {f.q}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isOpen ? "bg-s-accent text-s-on-accent" : "bg-s-tint text-s-mute"}`}>
                    {isOpen ? <Minus size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
                  </span>
                </button>
              </h3>
              {isOpen && <p className="max-w-2xl pb-5 leading-relaxed text-s-mute">{f.a}</p>}
            </div>
          );
        })}
      </div>
      <p data-reveal className="mt-6 text-sm text-s-mute">
        Refunds are covered in our <Link to="/refunds" className="font-medium text-s-accent hover:underline">refund and cancellation policy</Link>.
      </p>
    </section>
  );
}
