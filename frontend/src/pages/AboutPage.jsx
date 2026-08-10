import PageShell from "../components/PageShell";
import { Target, Users2, ShieldCheck, TrendingUp } from "lucide-react";

const principles = [
  { icon: Users2, title: "Accessibility", body: "Built for all Pakistani medical trainees regardless of economic or geographic context — usable on a 3G connection with a basic phone." },
  { icon: ShieldCheck, title: "Clinical relevance", body: "Every station and checklist is aligned with PMDC and CPSP competency frameworks, not generic international content." },
  { icon: Target, title: "Content consistency", body: "A structured governance pipeline moves every station through Draft, Approved, and Published states before it reaches students." },
  { icon: TrendingUp, title: "Scalability", body: "Designed to grow from an MVP into a nationally adopted clinical preparation ecosystem." },
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <h1 className="font-display text-4xl font-bold text-ink">Why KF LearnSmart exists</h1>
          <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
            Pakistan's medical education sector has shifted to competency-based assessment, with
            the OSCE at the heart of it — yet no centralised, locally relevant bank of practice
            stations existed until now. International platforms are built for other contexts, cost
            and bandwidth exclude many students, and structured feedback during informal practice
            is largely absent.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
        <p className="leading-relaxed text-ink-soft">
          KF LearnSmart is a low-cost, web-first platform offering PMDC- and CPSP-aligned OSCE
          stations, history-taking modules, clinical examination guides, and an AI-powered Virtual
          Examiner and Feedback Coach — built specifically for undergraduate MBBS students and
          postgraduate FCPS/MCPS candidates across Pakistan.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {principles.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-brand">
                <p.icon size={18} />
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
