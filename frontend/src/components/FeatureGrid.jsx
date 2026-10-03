import { BarChart3, BookOpen, FileText, MessageSquare, Sparkles, Stethoscope } from "lucide-react";

export const FEATURES = [
  {
    icon: Stethoscope,
    title: "OSCE Station Bank",
    desc: "8 interactive stations across Respiratory, Gynaecology, Gastroenterology and Endocrinology, each with a weighted checklist of critical, major and minor items.",
    style: { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  },
  {
    icon: MessageSquare,
    title: "AI Virtual Patient",
    desc: "Ask questions in your own words. The patient only reveals what you ask, and replies come from that patient's script.",
    style: { "--g1": "#C6A6FF", "--g2": "#E0CBFF", "--glow": "rgba(198,166,255,0.35)" },
  },
  {
    icon: Sparkles,
    title: "AI Checklist Marking",
    desc: "After the session, the AI marks each checklist item and cites evidence from your transcript. The app calculates your score.",
    style: { "--g1": "#7FE3C4", "--g2": "#A8F0DA", "--glow": "rgba(127,227,196,0.35)" },
  },
  {
    icon: BookOpen,
    title: "History & Examination Guides",
    desc: "9 history-taking topics and 12 clinical examination guides with technique, normal and abnormal findings.",
    style: { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  },
  {
    icon: FileText,
    title: "Handouts & MCQ Bank",
    desc: "47 consolidated OSCE handouts and 170 MCQs across five banks, with topic-wise practice mode.",
    style: { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
  },
  {
    icon: BarChart3,
    title: "Attempt History",
    desc: "Every attempt is saved with its score and feedback, so you can review how you have improved over time.",
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
            <div key={f.title} style={f.style} className="gradient-card rounded-lg p-6">
              <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
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
