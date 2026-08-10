import { Timer, CheckCircle2, Circle, CircleDashed, Sparkles } from "lucide-react";

const checklist = [
  { label: "Washes hands", state: "done" },
  { label: "Gains consent", state: "done" },
  { label: "Positions at 45\u00B0", state: "done" },
  { label: "Peripheries", state: "pending" },
  { label: "Radial pulse", state: "done" },
  { label: "JVP", state: "active" },
  { label: "Apex beat", state: "done" },
];

function ChecklistRow({ label, state }) {
  const styles = {
    done: "text-good",
    pending: "text-ink-soft",
    active: "text-warn font-semibold",
  };
  const Icon = state === "done" ? CheckCircle2 : state === "active" ? CircleDashed : Circle;

  return (
    <li className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${state === "active" ? "bg-amber-50" : ""} ${styles[state]}`}>
      <Icon size={16} strokeWidth={2.2} />
      {label}
    </li>
  );
}

export default function StationPreviewCard() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-blue-100">
      <div className="flex items-center justify-between bg-brand px-5 py-3 text-white">
        <span className="text-sm font-semibold">Cardiovascular Examination — Guided Mode</span>
        <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs font-medium">
          <Timer size={13} /> 06:12
        </span>
      </div>

      <div className="grid grid-cols-5 gap-4 p-5">
        <div className="col-span-3 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Patient Scenario</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Mr Bilal Ahmed, 58, presents to the cardiology clinic for review. He has known rheumatic
              heart disease. Please perform a cardiovascular examination and present your findings.
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-500">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Live Transcript
            </p>
            <p className="mt-1 text-sm italic leading-relaxed text-ink-soft">
              "I would begin by washing my hands and introducing myself to Mr Ahmed. With your
              consent, I would like to examine your heart today…"
            </p>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-line bg-surface-alt p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Checklist</p>
          <ul className="space-y-0.5">
            {checklist.map((c) => (
              <ChecklistRow key={c.label} {...c} />
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-4">
        <span className="flex items-center gap-1.5 text-xs font-medium text-good">
          <Sparkles size={14} /> Score improved +13% since last attempt
        </span>
        <div className="rounded-full bg-brand px-4 py-2 text-center text-xs font-semibold text-white">
          Score so far <span className="ml-1 text-sm">9 / 20</span>
        </div>
      </div>
    </div>
  );
}
