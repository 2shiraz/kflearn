import { ArrowRight, GraduationCap } from "lucide-react";
import StationPreviewCard from "./StationPreviewCard";

export default function Hero() {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-brand">
            <GraduationCap size={14} /> Built for Pakistani medical students
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]" style={{ fontFamily: "var(--font-serif)" }}>
            Build clinical confidence before the station begins.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
            Practise OSCE stations, history taking, and clinical examinations with structured
            checklists, AI feedback, and progress tracking — designed for Pakistani medical students.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#"
              className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-brand-dark"
            >
              Start Practising <ArrowRight size={16} />
            </a>
            <a
              href="#"
              className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand"
            >
              Explore Sample Stations
            </a>
          </div>

          <p className="mt-6 max-w-md text-xs leading-relaxed text-ink-soft">
            PHMS is a formative self-assessment tool. Not an official examination platform. AI
            feedback is not a clinical result or certification.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <StationPreviewCard />
        </div>
      </div>
    </section>
  );
}
