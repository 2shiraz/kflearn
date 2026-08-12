import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is KF LearnSmart an official examination platform?",
    a: "No. KF LearnSmart is a formative self-assessment and preparation tool. It does not replace formal OSCE examinations or institutional assessment, and AI feedback is not a clinical result or certification.",
  },
  {
    q: "What specialties are covered?",
    a: "The station bank spans 12 specialties including Medicine, Surgery, and Obstetrics, organised by organ system and topic so you can drill down to exactly what you need.",
  },
  {
    q: "Do I need a good internet connection?",
    a: "No - the platform is built for 3G connections as low as 1 Mbps, with core pages loading in under 3 seconds and compressed illustrations to minimise data use.",
  },
  {
    q: "Can I practise without a microphone?",
    a: "Yes. Every station supports typed input as a full alternative to voice - a microphone is only needed if you choose voice mode.",
  },
  {
    q: "Is there a free version?",
    a: "Yes. The free tier gives you access to a core set of stations and guides. Premium unlocks the full content library and all AI features.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="glass-surface rounded-lg">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <span className="font-semibold text-ink">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-ink-soft transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <p className="px-6 pb-5 text-sm leading-relaxed text-ink-soft">{a}</p>}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="app-gradient-bg py-20">
      <div className="mx-auto max-w-2xl px-6 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">Frequently asked questions</h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <FaqItem
              key={f.q}
              {...f}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
