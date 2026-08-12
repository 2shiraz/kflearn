import { BarChart3, BookOpen, MessageSquare, Sparkles, Stethoscope, Users } from "lucide-react";

export const FEATURES = [
  {
    icon: Stethoscope,
    title: "OSCE Station Bank",
    desc: "200+ clinical stations across all major specialties with structured checklists reviewed by clinical educators.",
    style: { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  },
  {
    icon: MessageSquare,
    title: "History Taking Practice",
    desc: "Interactive virtual patient consultations. Ask questions naturally - the patient only reveals what you ask.",
    style: { "--g1": "#C6A6FF", "--g2": "#E0CBFF", "--glow": "rgba(198,166,255,0.35)" },
  },
  {
    icon: BookOpen,
    title: "Examination Guides",
    desc: "Step-by-step guides with annotated technique, normal and abnormal findings, and downloadable PDFs.",
    style: { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  },
  {
    icon: Sparkles,
    title: "AI Virtual Examiner",
    desc: "Evaluates your response against the station checklist using AI. Shows evidence drawn from your own words.",
    style: { "--g1": "#7FE3C4", "--g2": "#A8F0DA", "--glow": "rgba(127,227,196,0.35)" },
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "Track scores over time, identify weak specialties, and generate personalised practice plans.",
    style: { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
  },
  {
    icon: Users,
    title: "Find a Partner",
    desc: "Connect with other students for peer OSCE practice - rotating between examiner and candidate roles.",
    style: { "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(160,150,255,0.35)" },
  },
];

export default function FeatureGrid({ compact = false }) {
  return (
    <section className="app-gradient-bg py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        {!compact && (
          <div className="text-center">
            <h2 className="font-display text-3xl font-extrabold text-ink">Everything you need to prepare</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">
              KF LearnSmart covers the full journey - structured study to exam simulation to
              performance review.
            </p>
          </div>
        )}

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} style={f.style} className="gradient-card rounded-[18px] p-6">
              <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-[13px] text-ink">
                <f.icon size={18} />
              </span>
              <h3 className="mt-4 font-display text-base font-extrabold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
