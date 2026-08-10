import PageShell from "../components/PageShell";
import FeatureGrid from "../components/FeatureGrid";

const details = [
  { title: "Smart Checklist Engine", body: "Weighted checklist items — critical, major, minor — aligned with PMDC/CPSP competency descriptors. Every attempt is scored as a composite percentage, and checklists are downloadable as PDF." },
  { title: "Guided & Exam Modes", body: "Learn mode studies the ideal examination sequence step by step. Guided mode times you through a live station with a checklist that updates as you speak or type. Exam mode simulates real conditions with no hints." },
  { title: "Voice or Typed Input", body: "Every station accepts spoken or typed responses. Voice input is transcribed and shown to you before final submission, so nothing gets scored on a mistranscription." },
  { title: "Feedback Coach", body: "After each attempt, get a report on missed items, common mistakes tied to them, and three curated viva questions with model answer outlines." },
];

export default function FeaturesPage() {
  return (
    <PageShell>
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
          <h1 className="font-display text-4xl font-bold text-ink">Built for how OSCEs are actually examined</h1>
          <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
            Every feature maps to a real part of the exam — structured checklists, timed stations,
            and AI feedback grounded in what you actually said.
          </p>
        </div>
      </section>

      <FeatureGrid compact />

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
        <div className="space-y-10">
          {details.map((d) => (
            <div key={d.title} className="border-b border-line pb-10 last:border-0">
              <h2 className="font-display text-xl font-bold text-ink">{d.title}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{d.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
