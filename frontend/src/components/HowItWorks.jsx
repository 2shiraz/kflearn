import { Search, ClipboardCheck, Sparkles } from "lucide-react";

const steps = [
  {
    n: "01", icon: Search, title: "Choose a station",
    desc: "Browse 200+ clinical stations across 12 specialties.",
  },
  {
    n: "02", icon: ClipboardCheck, title: "Practise with structure",
    desc: "Learn mode studies the ideal sequence. Guided mode walks you through it.",
  },
  {
    n: "03", icon: Sparkles, title: "Review AI feedback",
    desc: "See exactly which checklist items you covered, missed, and what to fix.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
        <h2 className="font-display text-3xl font-bold text-ink">How KF LearnSmart works</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          A structured system for building clinical skills — from learning the framework to
          simulating exam conditions.
        </p>

        <div className="mt-12 grid gap-6 text-left sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-brand">
                <s.icon size={18} />
              </span>
              <p className="mt-4 font-mono text-xs text-ink-soft">{s.n}</p>
              <h3 className="mt-1 font-display text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
