import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { faqs } from "../data/faqs";

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
