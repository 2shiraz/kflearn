import { useEffect, useState } from "react";
import { BadgeCheck, Bot, Coins, Lock, Receipt, Sparkles } from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageMain, Panel, RequireUser } from "../components/AppPage";
import { getCreditTransactions } from "../lib/api";
import { refreshCredits, useCredits } from "../lib/credits";

const REASON_LABELS = {
  "virtual-patient": "AI Virtual Patient session",
  "ai-assessment": "AI Assessment",
  "admin-grant": "Credits added",
  purchase: "Credit package purchase",
};

function describe(row) {
  const label = REASON_LABELS[row.reason] || row.reason;
  return row.type === "refund" ? `Refund — ${label}` : label;
}

function formatPkr(amount) {
  return `PKR ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function CreditsPage() {
  const { balance, pricing } = useCredits();
  const [history, setHistory] = useState({ loading: true, rows: [], error: "" });

  useEffect(() => {
    getCreditTransactions()
      .then((rows) => setHistory({ loading: false, rows, error: "" }))
      .catch((err) => setHistory({ loading: false, rows: [], error: err.message }));
    refreshCredits().catch(() => {});
  }, []);

  const costs = pricing?.costs;
  const packages = pricing?.packages || [];
  const bestValueId = packages.length
    ? packages.reduce((best, pkg) => (pkg.pricePerStationPkr < best.pricePerStationPkr ? pkg : best)).id
    : null;
  const stationsLeft = costs && balance !== null ? Math.floor(balance / costs.fullStation) : null;

  return (
    <RequireUser active="credits">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Credits" }]} />

        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-ink">Credits</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Credits pay for the AI-powered parts of OSCE Stations. Everything else — the guides, handouts, MCQs and guided self-practice — is free.
          </p>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Panel>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-soft"><Coins size={16} /> Your balance</p>
              <p className="mt-2 text-5xl font-extrabold text-ink">{balance === null ? "—" : balance.toLocaleString()}</p>
              <p className="mt-1 text-sm text-ink-soft">credits</p>
              {stationsLeft !== null && (
                <p className="mt-4 rounded-lg border border-line bg-white/70 p-3 text-sm text-ink-soft">
                  Enough for <span className="font-bold text-ink">{stationsLeft.toLocaleString()}</span> full AI station{stationsLeft === 1 ? "" : "s"} with assessment.
                </p>
              )}
            </Panel>

            <Panel>
              <h2 className="text-lg font-bold text-ink">What credits are used for</h2>
              <div className="mt-3 space-y-2 text-sm">
                <CostRow icon={Bot} label="AI Virtual Patient session" detail={costs ? `Up to ${pricing.limits.studentMessagesPerStation} questions per session` : ""} credits={costs?.virtualPatient} />
                <CostRow icon={Sparkles} label="AI Assessment" detail="Refunded automatically if the assessment fails" credits={costs?.aiAssessment} />
                <CostRow icon={BadgeCheck} label="Full AI station" detail="Virtual patient + AI assessment" credits={costs?.fullStation} highlight />
                <CostRow label="Guided self-practice, voice transcription, guides, MCQs, handouts" credits={0} />
              </div>
            </Panel>
          </div>

          <div>
            <h2 className="mb-1 text-lg font-bold text-ink">Credit packages</h2>
            <p className="mb-3 text-sm text-ink-soft">1 credit = PKR {pricing?.creditValuePkr ?? 5}. Online payment is coming soon.</p>
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map((pkg) => (
                <Panel key={pkg.id} className={pkg.id === bestValueId ? "ring-2 ring-brand" : ""}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-extrabold text-ink">{pkg.name}</h3>
                    {pkg.id === bestValueId && <span className="gradient-brand rounded-full px-2.5 py-0.5 text-xs font-bold text-white">Best value</span>}
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-ink">{formatPkr(pkg.pricePkr)}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{pkg.credits.toLocaleString()} credits</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                    <li>{pkg.fullStations} full AI stations</li>
                    <li>{formatPkr(pkg.pricePerStationPkr)} per station</li>
                  </ul>
                  <button type="button" disabled className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-line bg-white/70 px-4 py-2.5 text-sm font-semibold text-ink-soft">
                    <Lock size={14} /> Payments coming soon
                  </button>
                </Panel>
              ))}
            </div>
          </div>

          <Panel>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><Receipt size={18} className="text-ink-soft" /> Credit history</h2>
            {history.error && <ErrorMessage message={history.error} />}
            {history.loading && <p className="mt-3 text-sm text-ink-soft">Loading…</p>}
            {!history.loading && !history.error && history.rows.length === 0 && (
              <p className="mt-3 text-sm text-ink-soft">No credit activity yet.</p>
            )}
            {history.rows.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-white/60">
                      <th className="px-3 py-2 font-bold text-ink">Date</th>
                      <th className="px-3 py-2 font-bold text-ink">Activity</th>
                      <th className="px-3 py-2 text-right font-bold text-ink">Credits</th>
                      <th className="px-3 py-2 text-right font-bold text-ink">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.rows.map((row) => (
                      <tr key={row.id} className="border-b border-line/70 bg-white/40 last:border-b-0">
                        <td className="whitespace-nowrap px-3 py-2 text-ink-soft">{new Date(row.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2 text-ink">{describe(row)}{row.note && row.type === "grant" ? <span className="text-ink-soft"> — {row.note}</span> : null}</td>
                        <td className={`px-3 py-2 text-right font-bold ${row.amount < 0 ? "text-rose-600" : "text-emerald-600"}`}>{row.amount > 0 ? `+${row.amount}` : row.amount}</td>
                        <td className="px-3 py-2 text-right text-ink-soft">{row.balanceAfter.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </PageMain>
    </RequireUser>
  );
}

function CostRow({ icon: Icon = Coins, label, detail, credits, highlight = false }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${highlight ? "border-amber-200 bg-amber-50" : "border-line bg-white/70"}`}>
      <Icon size={16} className="shrink-0 text-ink-soft" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{label}</p>
        {detail && <p className="text-xs text-ink-soft">{detail}</p>}
      </div>
      <span className="shrink-0 font-bold text-ink">{credits === undefined ? "—" : credits === 0 ? "Free" : `${credits} credits`}</span>
    </div>
  );
}
