import { ClipboardCheck, Search, Sparkles } from "lucide-react";

const steps = [
  {
    n: "01", icon: Search, title: "Choose a station",
    desc: "Browse 200+ clinical stations across 12 specialties.",
    style: { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  },
  {
    n: "02", icon: ClipboardCheck, title: "Practise with structure",
    desc: "Learn mode studies the ideal sequence. Guided mode walks you through it.",
    style: { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  },
  {
    n: "03", icon: Sparkles, title: "Review AI feedback",
    desc: "See exactly which checklist items you covered, missed, and what to fix.",
    style: { "--g1": "#7FE3C4", "--g2": "#A8F0DA", "--glow": "rgba(127,227,196,0.35)" },
  },
];

export default function HowItWorks() {
  return (
    <section className="app-gradient-bg py-20">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <h2 className="font-display text-3xl font-extrabold text-ink">How KF LearnSmart works</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          A structured system for building clinical skills - from learning the framework to
          simulating exam conditions.
        </p>

        <div className="mt-12 grid gap-6 text-left sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} style={s.style} className="gradient-card rounded-lg p-6">
              <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                <s.icon size={18} />
              </span>
              <p className="mt-4 font-mono text-xs text-ink-soft">{s.n}</p>
              <h3 className="mt-1 font-display text-lg font-extrabold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
