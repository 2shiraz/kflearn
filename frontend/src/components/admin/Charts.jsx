import { useId, useState } from "react";
import { LoaderCircle } from "lucide-react";

// Small dependency-free SVG charts for the admin overview. Each one has a
// visually hidden table so screen readers get the same numbers.
const shortDay = (date) => new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" });

function niceMax(values) {
  const max = Math.max(1, ...values);
  const step = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / step) * step;
}

const pointLabel = (p) => p.label || shortDay(p.date);

function HiddenTable({ caption, series }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead><tr><th>Day</th>{series.map((s) => <th key={s.label}>{s.label}</th>)}</tr></thead>
      <tbody>
        {series[0].points.map((p, i) => (
          <tr key={p.date}><td>{pointLabel(p)}</td>{series.map((s) => <td key={s.label}>{s.points[i].count}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

// Lines with a soft area under the first series. series: [{ label, points: [{date, count}], className }]
export function LineChart({ caption, series, height = 180 }) {
  const gradientId = useId();
  const [hover, setHover] = useState(null);
  const n = series[0].points.length;
  const max = niceMax(series.flatMap((s) => s.points.map((p) => p.count)));
  const W = 600;
  const H = height;
  const x = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v) => H - (v / max) * (H - 12) - 4;
  const path = (points) => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join(" ");
  const first = series[0].points;

  return (
    <figure>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-44 w-full overflow-visible" aria-hidden="true"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - rect.left) / rect.width) * (n - 1)))));
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-s-line" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />)}
          <path d={`${path(first)} L${x(n - 1)},${H} L${x(0)},${H} Z`} fill={`url(#${gradientId})`} className={series[0].className} />
          {series.map((s) => (
            <path key={s.label} d={path(s.points)} fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className={s.className} />
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} className="stroke-s-ink/20" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-s-line bg-s-card px-3 py-2 text-xs shadow-lg" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <p className="font-chart text-s-mute">{shortDay(first[hover].date)}</p>
            {series.map((s) => <p key={s.label} className="mt-0.5 whitespace-nowrap text-s-ink"><span className={`font-semibold ${s.className}`}>{s.points[hover].count}</span> {s.label.toLowerCase()}</p>)}
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between font-chart text-[11px] text-s-mute">
        <span>{shortDay(first[0].date)}</span>
        <span>{shortDay(first[n - 1].date)}</span>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-s-mute">
        {series.map((s) => <span key={s.label} className="inline-flex items-center gap-1.5"><span className={`h-0.5 w-4 rounded-full bg-current ${s.className}`} aria-hidden="true" />{s.label}</span>)}
      </figcaption>
      <HiddenTable caption={caption} series={series} />
    </figure>
  );
}

// Vertical bars, one per day (or per point). format turns a value into
// display text, e.g. a price.
export function BarChart({ caption, label, points, format = (v) => v.toLocaleString() }) {
  const max = niceMax(points.map((p) => p.count));
  const [hover, setHover] = useState(null);
  return (
    <figure>
      <div className="relative flex h-44 items-end gap-[3px]" aria-hidden="true" onMouseLeave={() => setHover(null)}>
        {points.map((p, i) => (
          <div key={p.date} className="flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
            <div className={`w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-s-accent" : "bg-s-accent/70"}`} style={{ height: `${Math.max(p.count ? 4 : 1.5, (p.count / max) * 100)}%`, opacity: p.count ? 1 : 0.35 }} />
          </div>
        ))}
        {hover !== null && (
          <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-s-line bg-s-card px-3 py-2 text-xs shadow-lg" style={{ left: `${((hover + 0.5) / points.length) * 100}%` }}>
            <p className="font-chart text-s-mute">{pointLabel(points[hover])}</p>
            <p className="mt-0.5 whitespace-nowrap text-s-ink"><span className="font-semibold">{format(points[hover].count)}</span> {label.toLowerCase()}</p>
            {points[hover].detail && <p className="whitespace-nowrap text-s-mute">{points[hover].detail}</p>}
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between font-chart text-[11px] text-s-mute">
        <span>{pointLabel(points[0])}</span>
        <span>{pointLabel(points[points.length - 1])}</span>
      </div>
      <HiddenTable caption={caption} series={[{ label, points }]} />
    </figure>
  );
}

// A plain loader for the overview panels: a small spinner and "Loading"
// centred in the space the chart or list will take, so nothing jumps when the
// data arrives.
function PanelLoader({ height }) {
  return (
    <div role="status" className={`flex ${height} items-center justify-center gap-2 text-sm text-s-mute`}>
      <LoaderCircle size={18} strokeWidth={2} className="motion-safe:animate-spin text-s-accent" aria-hidden="true" />
      Loading...
    </div>
  );
}

export function ChartSkeleton() {
  return <PanelLoader height="h-52" />;
}

export function ListSkeletonRows() {
  return <PanelLoader height="h-36" />;
}
