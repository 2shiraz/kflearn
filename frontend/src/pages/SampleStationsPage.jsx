import { Award, Clock } from "lucide-react";
import PageShell from "../components/PageShell";

const sampleStations = [
  { title: "Cardiovascular Examination", specialty: "Medicine", marks: "10-mark", time: "8 min", vignette: "Mr Bilal Ahmed, 58, known rheumatic heart disease, presents for cardiology review." },
  { title: "Abdominal History Taking", specialty: "Surgery", marks: "5-mark", time: "6 min", vignette: "Take a focused history from a patient with 3 days of right iliac fossa pain." },
  { title: "Respiratory Examination", specialty: "Medicine", marks: "10-mark", time: "8 min", vignette: "Perform a respiratory examination on a patient with a two-week cough." },
  { title: "Obstetric History", specialty: "Obstetrics & Gynaecology", marks: "5-mark", time: "6 min", vignette: "Take an antenatal history from a patient at 28 weeks gestation." },
  { title: "Thyroid Examination", specialty: "Medicine", marks: "5-mark", time: "6 min", vignette: "Examine this patient's neck swelling and present your findings." },
  { title: "Knee Examination", specialty: "Orthopaedics", marks: "10-mark", time: "8 min", vignette: "Assess this patient's knee pain following a sporting injury." },
];

const gradients = [
  { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  { "--g1": "#C6A6FF", "--g2": "#E0CBFF", "--glow": "rgba(198,166,255,0.35)" },
  { "--g1": "#7FE3C4", "--g2": "#A8F0DA", "--glow": "rgba(127,227,196,0.35)" },
  { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
  { "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(160,150,255,0.35)" },
];

export default function SampleStationsPage() {
  return (
    <PageShell>
      <section className="app-gradient-bg py-16">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-10">
          <h1 className="font-display text-4xl font-extrabold text-ink">Sample OSCE stations</h1>
          <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
            A preview from the 200+ station bank, organised by specialty and mark format - the
            same structure you'll see on exam day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sampleStations.map((s, i) => (
            <div key={s.title} style={gradients[i % gradients.length]} className="gradient-card rounded-[18px] p-6">
              <span className="gradient-pill inline-block rounded-full px-2.5 py-1 text-xs font-bold text-ink">
                {s.specialty}
              </span>
              <h3 className="mt-3 font-display text-lg font-extrabold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.vignette}</p>
              <div className="mt-4 flex items-center gap-4 text-xs font-medium text-ink-soft">
                <span className="flex items-center gap-1"><Clock size={13} /> {s.time}</span>
                <span className="flex items-center gap-1"><Award size={13} /> {s.marks}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
