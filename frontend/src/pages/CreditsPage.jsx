import { useCallback, useEffect, useState } from "react";
import { Check, FlaskConical, Minus, Plus, RotateCcw } from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageHeader, PageMain, Panel, PrimaryButton, RequireUser, SecondaryButton } from "../components/AppPage";
import { getCurrentUser } from "../lib/api";
import { beginCheckout, usePaymentOptions } from "../lib/payments";
import { ListSkeleton, Skeleton } from "../components/Skeleton";
import { Character, HealthIcon, MedIcon } from "../site/Illustrations";
import { getCreditTransactions } from "../lib/api";
import { refreshCredits, useCredits } from "../lib/credits";

const REASON_LABELS = {
  "virtual-patient": "AI Virtual Patient session",
  "ai-assessment": "AI Assessment",
  "admin-grant": "AI credits added",
  "welcome-grant": "Welcome credits",
  purchase: "AI credit package purchase",
  "purchase-refund": "Purchase refunded",
  "admin-adjust": "AI credits adjusted",
};

function describe(row) {
  const label = REASON_LABELS[row.reason] || row.reason;
  return row.type === "refund" ? `Refund: ${label}` : label;
}

function formatPkr(amount) {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const USES = [
  { icon: "stethoscope", label: "AI virtual patient sessions", detail: "Take a full history by voice or text." },
  { icon: "medicalRecords", label: "AI assessment", detail: "Marked against the checklist. Refunded automatically if it fails." },
];

export default function CreditsPage() {
  const { balance, pricing } = useCredits();
  const [history, setHistory] = useState({ loading: true, rows: [], error: "" });
  const payments = usePaymentOptions();
  const canBuy = Boolean(payments?.enabled) && !["admin", "contributor"].includes(getCurrentUser()?.role);
  const [buying, setBuying] = useState("");
  const [buyError, setBuyError] = useState("");

  async function buy(id) {
    setBuying(id);
    setBuyError("");
    try {
      await beginCheckout(id);
    } catch (err) {
      setBuyError(err.message);
      setBuying("");
    }
  }

  const loadHistory = useCallback(() => {
    setHistory((h) => ({ ...h, loading: true, error: "" }));
    getCreditTransactions()
      .then((rows) => setHistory({ loading: false, rows, error: "" }))
      .catch((err) => setHistory({ loading: false, rows: [], error: err.message }));
  }, []);

  useEffect(() => {
    loadHistory();
    refreshCredits().catch(() => {});
  }, [loadHistory]);

  const costs = pricing?.costs;
  const packages = pricing?.packages || [];
  // Best value = most credits per rupee (no per-station cost is exposed).
  const bestValueId = packages.length
    ? packages.reduce((best, pkg) => (pkg.credits / pkg.pricePkr > best.credits / best.pricePkr ? pkg : best)).id
    : null;
  const stationsLeft = costs && balance !== null ? Math.floor(balance / costs.fullStation) : null;

  return (
    <RequireUser active="credits">
      <PageMain width="split">
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "AI Credits" }]} />
        <PageHeader
          title="AI Credits"
          description="AI credits are for the AI patient and AI marking. Everything else is part of your monthly pass."
        />

        <div className="grid gap-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="site-rise relative overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent sm:p-7">
              <span className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.08]" aria-hidden="true">
                <HealthIcon name="stethoscope" size={200} />
              </span>
              <p className="relative font-chart text-xs uppercase tracking-wider text-s-on-accent/75">Your balance</p>
              <div className="relative mt-3 min-h-14">
                {balance === null ? (
                  <Skeleton className="h-14 w-36 bg-s-on-accent/20" />
                ) : (
                  <p className="text-5xl font-semibold tracking-tight">
                    {balance.toLocaleString()} <span className="text-lg font-medium text-s-on-accent/80">AI credits</span>
                  </p>
                )}
              </div>
              {stationsLeft !== null && (
                <p className="relative mt-5 inline-flex items-center gap-3 rounded-2xl bg-s-on-accent/12 px-4 py-3 text-sm">
                  <Character name="patient-daniel" size={36} tone="indigo" />
                  <span>
                    Enough for <span className="font-semibold">{stationsLeft.toLocaleString()}</span> full AI station{stationsLeft === 1 ? "" : "s"} with marking.
                  </span>
                </p>
              )}
            </div>

            <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
              <h2 className="text-lg font-semibold tracking-tight text-s-ink">What uses AI credits</h2>
              <ul className="mt-4 space-y-2.5">
                {USES.map((use) => (
                  <li key={use.label} className="flex items-start gap-3 rounded-2xl border border-s-line bg-s-card p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-s-accent-soft text-s-accent" aria-hidden="true">
                      <MedIcon name={use.icon} size={24} />
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block font-medium text-s-ink">{use.label}</span>
                      <span className="block leading-relaxed text-s-mute">{use.detail}</span>
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-3 rounded-2xl bg-mint-soft p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-s-card text-mint" aria-hidden="true">
                    <Check size={20} strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium text-s-ink">Everything else is in your monthly pass</span>
                    <span className="block leading-relaxed text-s-mute">Self-practice, voice typing, guides, handouts, MCQs and OSPE use no AI credits.</span>
                  </span>
                </li>
              </ul>
            </Panel>
          </div>

          {packages.length > 0 && (
            <section>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-s-ink">Practice packs</h2>
                {canBuy && payments.test && (
                  <p className="flex items-center gap-1.5 text-xs text-s-mute">
                    <FlaskConical size={13} strokeWidth={2} aria-hidden="true" /> Test mode. No money is taken.
                  </p>
                )}
              </div>
              {buyError && <div className="mb-4"><ErrorMessage message={buyError} /></div>}
              <div className="grid gap-4 md:grid-cols-3">
                {packages.map((pkg, i) => {
                  const best = pkg.id === bestValueId;
                  const BuyButton = best ? PrimaryButton : SecondaryButton;
                  return (
                    <Panel key={pkg.id} className={`site-rise ${best ? "border-s-accent ring-2 ring-s-accent/30" : ""}`} style={{ "--rise-delay": `${i * 60}ms` }}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold tracking-tight text-s-ink">{pkg.name}</h3>
                        {best && <span className="rounded-full bg-mint-soft px-3 py-1 text-xs font-medium text-s-good">Best value</span>}
                      </div>
                      <p className="mt-4 text-3xl font-semibold tracking-tight text-s-ink">
                        <span className="mr-1 text-base font-medium text-s-mute">PKR</span>
                        {formatPkr(pkg.pricePkr)}
                      </p>
                      <p className="mt-1 font-chart text-sm text-s-mute">{pkg.credits.toLocaleString()} AI credits</p>
                      <p className="mt-4 flex items-center gap-2 text-sm text-s-ink">
                        <Check size={16} strokeWidth={2.25} className="shrink-0 text-s-good" aria-hidden="true" />
                        {pkg.fullStations} full AI stations
                      </p>
                      {canBuy && (
                        <BuyButton type="button" onClick={() => buy(pkg.id)} disabled={Boolean(buying)} className="mt-5 w-full">
                          {buying === pkg.id ? "Opening checkout..." : `Buy ${pkg.name}`}
                        </BuyButton>
                      )}
                    </Panel>
                  );
                })}
              </div>
            </section>
          )}

          <Panel>
            <h2 className="text-lg font-semibold tracking-tight text-s-ink">AI credit history</h2>
            <div className="mt-4">
              {history.error && <ErrorMessage message={history.error} onRetry={loadHistory} />}
              {history.loading && <ListSkeleton rows={3} label="Loading AI credit history" />}
              {!history.loading && !history.error && history.rows.length === 0 && (
                <div className="flex items-center gap-4 rounded-2xl bg-s-tint/60 p-4">
                  <Character name="student-usman" size={48} tone="mint" />
                  <p className="text-sm text-s-mute">No AI credit activity yet. Sessions and top-ups will show here.</p>
                </div>
              )}
              {history.rows.length > 0 && (
                <ul className="divide-y divide-s-line overflow-hidden rounded-2xl border border-s-line bg-s-card">
                  {history.rows.map((row) => {
                    const spent = row.amount < 0;
                    const Icon = row.type === "refund" ? RotateCcw : spent ? Minus : Plus;
                    return (
                      <li key={row.id} className="flex items-center gap-3 px-4 py-3.5">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${spent ? "bg-coral-soft text-s-miss" : "bg-mint-soft text-s-good"}`} aria-hidden="true">
                          <Icon size={16} strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-s-ink">
                            {describe(row)}
                            {row.note && row.type === "grant" ? <span className="font-normal text-s-mute">, {row.note}</span> : null}
                          </p>
                          <p className="font-chart text-xs text-s-mute">{new Date(row.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`font-chart text-sm ${spent ? "text-s-miss" : "text-s-good"}`}>{row.amount > 0 ? `+${row.amount}` : row.amount}</p>
                          <p className="font-chart text-xs text-s-mute">bal {row.balanceAfter.toLocaleString()}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </PageMain>
    </RequireUser>
  );
}
