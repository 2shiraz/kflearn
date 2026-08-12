import { AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
      <div className="gradient-card flex items-start gap-3 rounded-[18px] px-6 py-4" style={{ "--g1": "#FFD84D", "--g2": "#FF8FCF", "--glow": "rgba(255,216,77,0.3)" }}>
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
        <p className="text-sm leading-relaxed text-amber-900">
          <span className="font-semibold">Medical and AI Disclaimer:</span> KF LearnSmart is a
          self-assessment and preparation platform for educational purposes only. It is not
          affiliated with any official examination body. AI-generated feedback is formative and
          does not constitute a clinical result, diagnosis, or professional assessment.
        </p>
      </div>
    </div>
  );
}
