import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import PageShell from "../components/PageShell";

const tiers = [
  {
    name: "Free", price: "PKR 0", period: "forever",
    features: ["Access to 30+ sample stations", "Basic clinical examination guides", "1 AI evaluation per day", "Community Find a Partner access"],
    cta: "Start Free", highlighted: false,
  },
  {
    name: "Premium", price: "PKR 799", period: "/ month",
    features: ["Full 200+ station library", "Unlimited AI Virtual Examiner", "AI Feedback Coach with viva prep", "Progress analytics dashboard", "Downloadable PDF checklists"],
    cta: "Start Premium", highlighted: true,
  },
  {
    name: "Annual", price: "PKR 6,999", period: "/ year",
    features: ["Everything in Premium", "2 months free vs monthly", "Priority support"],
    cta: "Start Annual", highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <PageShell>
      <section className="app-gradient-bg py-16">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h1 className="font-display text-4xl font-extrabold text-ink">Simple, student-friendly pricing</h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">
            Core access stays free. Premium unlocks the full station library and every AI feature.
          </p>
          <p className="gradient-pill mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold text-ink">
            Placeholder pricing - figures below are not final
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              style={t.highlighted ? { "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(127,139,255,0.35)" } : { "--g1": "#7FB8FF", "--g2": "#C6A6FF", "--glow": "rgba(150,160,255,0.28)" }}
              className="gradient-card rounded-[18px] p-8"
            >
              {t.highlighted && (
                <span className="gradient-brand mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-lg font-extrabold text-ink">{t.name}</h2>
              <p className="mt-2">
                <span className="font-display text-3xl font-extrabold text-ink">{t.price}</span>
                <span className="ml-1 text-sm text-ink-soft">{t.period}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                    <Check size={16} className="mt-0.5 shrink-0 text-good" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/signin"
                className={`mt-8 block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                  t.highlighted
                    ? "gradient-brand text-white hover:scale-[1.02]"
                    : "glass-surface text-ink hover:border-brand"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
