import { Stethoscope, MessageSquare, BookOpen, Sparkles, BarChart3, Users } from "lucide-react";

export const FEATURES = [
  {
    icon: Stethoscope, title: "OSCE Station Bank",
    desc: "200+ clinical stations across all major specialties with structured checklists reviewed by clinical educators.",
  },
  {
    icon: MessageSquare, title: "History Taking Practice",
    desc: "Interactive virtual patient consultations. Ask questions naturally — the patient only reveals what you ask.",
  },
  {
    icon: BookOpen, title: "Examination Guides",
    desc: "Step-by-step guides with annotated technique, normal and abnormal findings, and downloadable PDFs.",
  },
  {
    icon: Sparkles, title: "AI Virtual Examiner",
    desc: "Evaluates your response against the station checklist using AI. Shows evidence drawn from your own words.",
  },
  {
    icon: BarChart3, title: "Progress Analytics",
    desc: "Track scores over time, identify weak specialties, and generate personalised practice plans.",
  },
  {
    icon: Users, title: "Find a Partner",
    desc: "Connect with other students for peer OSCE practice — rotating between examiner and candidate roles.",
  },
];

export default function FeatureGrid({ compact = false }) {
  return (
    <section className="bg-[#1B2033] py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        {!compact && (
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-white">Everything you need to prepare</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/60">
              KF LearnSmart covers the full journey — structured study to exam simulation to
              performance review.
            </p>
          </div>
        )}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand">
                <f.icon size={18} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
