import { useCallback, useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download, Plug, Plus, Receipt, Search, Undo2 } from "lucide-react";
import {
  downloadAdminPayments, getAdminRevenue, getAdminSettings, listAdminPayments, listAdminUsers, recordAdminPayment, refundAdminPayment,
} from "../../lib/api";
import { Panel, PrimaryButton, SecondaryButton } from "../AppPage";
import { AdminDialog, Area, Field, InlineError, Select } from "./AdminKit";
import { BarChart, ChartSkeleton, ListSkeletonRows } from "./Charts";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];
const BUCKETS = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
];
const DEFAULT_BUCKET = { 7: "day", 30: "day", 90: "week", 365: "month" };

const METHODS = {
  "bank-transfer": "Bank transfer",
  "mobile-wallet": "Mobile wallet",
  cash: "Cash",
  card: "Card",
  other: "Other",
};
const STATUS = {
  paid: { label: "Paid", className: "bg-mint-soft text-s-good" },
  refunded: { label: "Refunded", className: "bg-coral-soft text-s-miss" },
  pending: { label: "Pending", className: "bg-sun-soft text-s-ink" },
  failed: { label: "Failed", className: "bg-s-tint text-s-mute" },
};

const pkr = (n) => `PKR ${Math.round(n || 0).toLocaleString()}`;
const day = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function bucketLabel(date, bucket) {
  const d = new Date(`${date}T00:00:00Z`);
  if (bucket === "month") return d.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
  const short = d.toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });
  return bucket === "week" ? `Week of ${short}` : short;
}

// Change against the previous period of the same length.
function Change({ now, before, invert = false }) {
  if (!before) return now ? <span className="text-xs text-s-mute">New this period</span> : null;
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="text-xs text-s-mute">Same as before</span>;
  const good = invert ? pct < 0 : pct > 0;
  const Icon = pct > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-s-good" : "text-s-miss"}`}>
      <Icon size={14} strokeWidth={2.25} aria-hidden="true" />{Math.abs(pct)}% <span className="font-normal text-s-mute">vs previous</span>
    </span>
  );
}

function Kpi({ label, value, children, lead = false }) {
  return (
    <div className={`rounded-3xl border p-5 ${lead ? "border-s-accent/30 bg-s-accent-soft/50" : "border-s-line bg-s-card"}`}>
      <p className="text-sm text-s-mute">{label}</p>
      <p className={`mt-1 font-semibold tracking-tight text-s-ink ${lead ? "text-3xl" : "text-2xl"}`}>{value ?? <span className="text-s-mute">...</span>}</p>
      <div className="mt-1 min-h-5">{children}</div>
    </div>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-s-line bg-s-card p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} disabled={o.disabled} onClick={() => onChange(o.id)}
          className={`site-press min-h-9 rounded-full px-3.5 text-sm font-medium disabled:opacity-35 ${value === o.id ? "bg-s-accent text-s-on-accent" : "text-s-mute hover:text-s-ink"}`}
        >{o.label}</button>
      ))}
    </div>
  );
}

// Share of revenue: a plain bar with no track behind it.
function ShareList({ rows, total, label = (r) => r.label, empty }) {
  if (!rows.length) return <p className="mt-4 text-sm text-s-mute">{empty}</p>;
  return (
    <ul className="mt-4 space-y-3.5">
      {rows.map((r) => (
        <li key={r.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-s-ink">{label(r)}</span>
            <span className="shrink-0 font-chart text-xs text-s-mute">{r.payments} / {pkr(r.revenue)}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-s-accent" style={{ width: `${Math.max(2, (r.revenue / Math.max(1, total)) * 100)}%` }} />
        </li>
      ))}
    </ul>
  );
}

// Money: what came in by day, week or month, from which packages and how
// people paid, AI credits sold against those given free, and every payment.
// Payments are recorded by hand for now; a payment processor can add rows to
// the same ledger later.
export default function AdminRevenue() {
  const [days, setDays] = useState(30);
  const [bucket, setBucket] = useState("day");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [refunding, setRefunding] = useState(null);
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setReport(null);
    setError("");
    getAdminRevenue(days, bucket).then(setReport).catch((err) => setError(err.message));
  }, [days, bucket, reload]);

  const pickRange = (d) => { setDays(d); setBucket(DEFAULT_BUCKET[d]); };
  const changed = (message) => { setNotice(message); setReload((n) => n + 1); };

  const c = report?.current;
  const p = report?.previous;
  const points = report?.series.map((row) => ({
    date: row.date,
    count: row.revenue,
    label: bucketLabel(row.date, report.bucket),
    detail: `${row.payments} ${row.payments === 1 ? "payment" : "payments"}${row.refunds ? `, ${pkr(row.refunds)} refunded` : ""}`,
  }));
  const rangeLabel = RANGES.find((r) => r.days === days)?.label.toLowerCase();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-s-ink">Revenue</h2>
          <p className="mt-1 text-sm text-s-mute">Money from AI credit sales, refunds and every payment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => downloadAdminPayments().catch((err) => setError(err.message))}><Download size={16} strokeWidth={2} aria-hidden="true" /> Export CSV</SecondaryButton>
          <PrimaryButton type="button" onClick={() => setRecording(true)}><Plus size={16} strokeWidth={2} aria-hidden="true" /> Record payment</PrimaryButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Time range" options={RANGES.map((r) => ({ id: r.days, label: r.label }))} value={days} onChange={pickRange} />
        <Segmented label="Group by" options={BUCKETS.map((b) => ({ ...b, disabled: b.id === "day" && days === 365 }))} value={bucket} onChange={setBucket} />
      </div>
      <InlineError>{error}</InlineError>
      {notice && <p role="status" className="rounded-2xl bg-mint-soft p-3.5 text-sm text-s-good">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <Kpi lead label={`Net revenue, last ${rangeLabel}`} value={c && pkr(c.net)}>{c && <Change now={c.net} before={p.net} />}</Kpi>
        <Kpi label="Payments" value={c?.payments.toLocaleString()}>{c && <Change now={c.payments} before={p.payments} />}</Kpi>
        <Kpi label="Paying students" value={c?.customers.toLocaleString()}>{c && <span className="text-xs text-s-mute">{c.newCustomers} paying for the first time</span>}</Kpi>
        <Kpi label="Average payment" value={c && pkr(c.averageOrder)}>{c && <Change now={c.averageOrder} before={p.averageOrder} />}</Kpi>
      </div>

      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-s-ink">Sales by {report?.bucket === "month" ? "month" : report?.bucket === "week" ? "week" : "day"}</h3>
          {c && <p className="font-chart text-xs text-s-mute">Gross {pkr(c.gross)} / refunds {pkr(c.refunds)}{c.fees ? ` / fees ${pkr(c.fees)}` : ""}</p>}
        </div>
        <div className="mt-5">
          {points ? <BarChart caption="Revenue per period" label="PKR" points={points} format={(v) => v.toLocaleString()} /> : <ChartSkeleton />}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <h3 className="font-semibold text-s-ink">By package</h3>
          {report ? <ShareList rows={report.byPackage} total={c.gross} empty="No sales in this period." /> : <ListSkeletonRows />}
        </Panel>
        <Panel>
          <h3 className="font-semibold text-s-ink">By payment method</h3>
          {report ? <ShareList rows={report.byMethod} total={c.gross} label={(r) => METHODS[r.id] || r.id} empty="No sales in this period." /> : <ListSkeletonRows />}
        </Panel>
        <Panel>
          <h3 className="font-semibold text-s-ink">AI credits, last {rangeLabel}</h3>
          {report ? (
            <dl className="mt-4 grid grid-cols-2 gap-2">
              {[
                ["Sold", report.credits.sold],
                ["Given free", report.credits.free],
                ["Used", report.credits.used],
                ["Unused, all accounts", report.credits.outstanding],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-s-tint/60 p-3">
                  <dt className="text-xs text-s-mute">{k}</dt>
                  <dd className="mt-0.5 text-xl font-semibold text-s-ink">{v.toLocaleString()}</dd>
                </div>
              ))}
            </dl>
          ) : <ListSkeletonRows />}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <PaymentsList reload={reload} onRefund={setRefunding} />
        <div className="space-y-5">
          <Panel>
            <h3 className="font-semibold text-s-ink">All time</h3>
            {report ? (
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-s-mute">Net revenue</dt><dd className="font-semibold text-s-ink">{pkr(report.lifetime.net)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-s-mute">Payments</dt><dd className="font-chart text-s-ink">{report.lifetime.payments.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-s-mute">Paying students</dt><dd className="font-chart text-s-ink">{report.lifetime.customers.toLocaleString()}</dd></div>
              </dl>
            ) : <ListSkeletonRows />}
          </Panel>
          <Panel>
            <div className="flex items-center gap-2">
              <Plug size={17} strokeWidth={2} className="text-s-mute" aria-hidden="true" />
              <h3 className="font-semibold text-s-ink">Payment provider</h3>
            </div>
            <p className="mt-2 text-sm text-s-mute">
              {report?.provider.connected ? `Connected to ${report.provider.name}. Its payments appear here on their own.` : "None connected. Record each payment you receive and the student gets their AI credits straight away. A provider added later will fill this same list."}
            </p>
          </Panel>
        </div>
      </div>

      <RecordPaymentDialog open={recording} onClose={() => setRecording(false)} onRecorded={(payment) => changed(`Recorded ${pkr(payment.amount)} from ${payment.email}. ${payment.credits.toLocaleString()} AI credits added.`)} />
      <RefundDialog payment={refunding} onClose={() => setRefunding(null)} onRefunded={(payment, removed) => changed(`Refund recorded for ${payment.email}.${removed ? ` ${removed.toLocaleString()} AI credits taken back.` : ""}`)} />
    </div>
  );
}

function PaymentsList({ reload, onRefund }) {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(() => {
    setError("");
    listAdminPayments({ status, q: search, page }).then(setData).catch((err) => setError(err.message));
  }, [status, search, page]);
  useEffect(() => { load(); }, [load, reload]);

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-s-ink">Payments {data && <span className="font-chart text-xs font-normal text-s-mute">{data.total.toLocaleString()}</span>}</h3>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Search payments</span>
            <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Email, name or reference" className="min-h-10 w-56 rounded-xl border border-s-line bg-s-card py-2 pl-9 pr-3 text-sm text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="min-h-10 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent">
              <option value="">All statuses</option>
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>
      <InlineError>{error}</InlineError>
      {!data && !error && <ListSkeletonRows />}
      {data && data.payments.length === 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-s-tint/60 p-4 text-sm text-s-mute">
          <Receipt size={20} strokeWidth={1.9} className="shrink-0" aria-hidden="true" />
          {search || status ? "No payments match." : "No payments yet. Use Record payment when a student pays you."}
        </div>
      )}
      {data && data.payments.length > 0 && (
        <div className="-mx-2 mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="text-xs text-s-mute">
                <th className="px-2 pb-2 font-medium">Date</th>
                <th className="px-2 pb-2 font-medium">Student</th>
                <th className="px-2 pb-2 font-medium">Package</th>
                <th className="px-2 pb-2 font-medium">Method</th>
                <th className="px-2 pb-2 text-right font-medium">Amount</th>
                <th className="px-2 pb-2 font-medium">Status</th>
                <th className="px-2 pb-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-s-line">
              {data.payments.map((pay) => (
                <tr key={pay.id} className="align-middle">
                  <td className="whitespace-nowrap px-2 py-3 font-chart text-xs text-s-mute">{pay.paidAt ? day(pay.paidAt) : "-"}</td>
                  <td className="max-w-[14rem] px-2 py-3">
                    <p className="truncate text-s-ink">{pay.email}</p>
                    {pay.reference && <p className="truncate font-chart text-xs text-s-mute">Ref {pay.reference}</p>}
                  </td>
                  <td className="px-2 py-3 text-s-ink">{pay.packageName}<span className="block font-chart text-xs text-s-mute">{pay.credits.toLocaleString()} credits</span></td>
                  <td className="whitespace-nowrap px-2 py-3 text-s-mute">{METHODS[pay.method] || pay.method}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right font-semibold text-s-ink">{pkr(pay.amount)}</td>
                  <td className="px-2 py-3"><span className={`rounded-full px-2.5 py-1 font-chart text-xs ${STATUS[pay.status]?.className}`}>{STATUS[pay.status]?.label || pay.status}</span></td>
                  <td className="px-2 py-3 text-right">
                    {pay.status === "paid" && (
                      <button type="button" onClick={() => onRefund(pay)} className="site-press inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-semibold text-s-mute hover:bg-coral-soft/60 hover:text-s-miss">
                        <Undo2 size={14} strokeWidth={2} aria-hidden="true" /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2 text-sm">
          <SecondaryButton disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>Newer</SecondaryButton>
          <span className="font-chart text-xs text-s-mute">Page {data.page} of {data.pages}</span>
          <SecondaryButton disabled={page >= data.pages} onClick={() => setPage((n) => n + 1)}>Older</SecondaryButton>
        </div>
      )}
    </Panel>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const blankPayment = () => ({ email: "", packageId: "", amount: "", credits: "", method: "bank-transfer", reference: "", paidAt: today(), note: "" });

// A payment received outside the site. Picking a package fills in its price
// and credits; both can be changed for a discount or a custom deal.
function RecordPaymentDialog({ open, onClose, onRecorded }) {
  const [form, setForm] = useState(blankPayment);
  const [packages, setPackages] = useState([]);
  const [emails, setEmails] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(blankPayment());
    setError("");
    getAdminSettings().then((d) => {
      const list = d.pricing?.packages || [];
      setPackages(list);
      if (list[0]) setForm((f) => ({ ...f, packageId: list[0].id, amount: String(list[0].pricePkr), credits: String(list[0].credits) }));
    }).catch(() => {});
    listAdminUsers().then((users) => setEmails(users.map((u) => u.email))).catch(() => {});
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const pickPackage = (id) => {
    const pkg = packages.find((p) => p.id === id);
    setForm((f) => ({ ...f, packageId: id, ...(pkg ? { amount: String(pkg.pricePkr), credits: String(pkg.credits) } : {}) }));
  };
  const dirty = Boolean(form.email || form.reference || form.note);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await recordAdminPayment({
        email: form.email,
        packageId: form.packageId || undefined,
        amount: Number(form.amount),
        credits: Number(form.credits),
        method: form.method,
        reference: form.reference,
        paidAt: form.paidAt,
        note: form.note,
      });
      onRecorded(data.payment);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDialog open={open} wide title="Record a payment" description="For money received by bank transfer, mobile wallet or cash. The student gets the AI credits as soon as you save." onClose={onClose} dirty={dirty} busy={busy}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Student's email" type="email" required list="payment-emails" autoComplete="off" value={form.email} onChange={(v) => set("email", v)} />
        <datalist id="payment-emails">{emails.map((email) => <option key={email} value={email} />)}</datalist>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Package" value={form.packageId} onChange={pickPackage}>
            {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkr(pkg.pricePkr)})</option>)}
            <option value="">Custom amount</option>
          </Select>
          <Select label="Paid by" value={form.method} onChange={(v) => set("method", v)}>
            {Object.entries(METHODS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </Select>
          <Field label="Amount received (PKR)" type="number" min="1" step="1" required value={form.amount} onChange={(v) => set("amount", v)} />
          <Field label="AI credits to add" type="number" min="0" step="1" required value={form.credits} onChange={(v) => set("credits", v)} />
          <Field label="Reference" helper="Bank or wallet transaction ID. Stops the same payment being recorded twice." maxLength={120} value={form.reference} onChange={(v) => set("reference", v)} />
          <Field label="Date received" type="date" max={today()} required value={form.paidAt} onChange={(v) => set("paidAt", v)} />
        </div>
        <Area label="Note" rows={2} maxLength={300} value={form.note} onChange={(v) => set("note", v)} />
        <InlineError>{error}</InlineError>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={busy}>{busy ? "Saving..." : "Record payment"}</PrimaryButton>
        </div>
      </form>
    </AdminDialog>
  );
}

function RefundDialog({ payment, onClose, onRefunded }) {
  const [removeCredits, setRemoveCredits] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setRemoveCredits(true); setNote(""); setError(""); }, [payment?.id]);

  async function refund(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await refundAdminPayment(payment.id, { removeCredits, note });
      onRefunded(data.payment, data.creditsRemoved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDialog open={Boolean(payment)} title="Record a refund" description="Marks this payment as refunded. Send the money back yourself, the same way it was paid." onClose={() => !busy && onClose()}>
      {payment && (
        <form onSubmit={refund} className="space-y-4">
          <div className="rounded-2xl bg-s-tint/60 p-4 text-sm">
            <p className="font-semibold text-s-ink">{pkr(payment.amount)} from {payment.email}</p>
            <p className="mt-0.5 text-s-mute">{payment.packageName}, {payment.credits.toLocaleString()} AI credits, paid {payment.paidAt ? day(payment.paidAt) : ""}</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-s-ink">
            <input type="checkbox" checked={removeCredits} onChange={(e) => setRemoveCredits(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--s-accent)]" />
            <span>Take back the {payment.credits.toLocaleString()} AI credits<span className="block text-s-mute">Only what's still unused in their account is removed.</span></span>
          </label>
          <Field label="Reason" maxLength={120} value={note} onChange={setNote} />
          <InlineError>{error}</InlineError>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <SecondaryButton onClick={onClose} disabled={busy}>Cancel</SecondaryButton>
            <button type="submit" disabled={busy} className="site-press inline-flex min-h-11 items-center justify-center rounded-full bg-s-miss px-5 text-sm font-semibold text-s-on-accent hover:opacity-90 disabled:opacity-40">{busy ? "Saving..." : "Record refund"}</button>
          </div>
        </form>
      )}
    </AdminDialog>
  );
}
