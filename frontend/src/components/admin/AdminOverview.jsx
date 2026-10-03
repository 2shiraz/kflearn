import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { getAdminActivity, getAdminStats } from "../../lib/api";
import { Panel } from "../AppPage";
import { Skeleton } from "../Skeleton";
import { BarChart, ChartSkeleton, LineChart, ListSkeletonRows } from "./Charts";
import { InlineError } from "./AdminKit";

const RANGES = [7, 30, 90];

export function timeAgo(value) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// The admin's home: how many students are signing up and practising, what
// they practise, and the last changes made in the admin area.
export default function AdminOverview({ counts, defaultProvider, onNavigate }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setStats(null);
    getAdminStats(days).then(setStats).catch((err) => setError(err.message));
  }, [days]);
  useEffect(() => {
    getAdminActivity().then(setActivity).catch(() => setActivity([]));
  }, []);

  const review = (counts.draft || 0) + (counts.approved || 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-s-ink">Overview</h2>
          <p className="mt-1 text-sm text-s-mute">Signups, activity and practice across the site.</p>
        </div>
        <div className="inline-flex rounded-full border border-s-line bg-s-card p-1" role="group" aria-label="Time range">
          {RANGES.map((d) => (
            <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)} className={`site-press min-h-9 rounded-full px-3.5 text-sm font-medium ${days === d ? "bg-s-accent text-s-on-accent" : "text-s-mute hover:text-s-ink"}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>
      <InlineError>{error}</InlineError>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Accounts" value={stats?.users.total} detail={stats && `${stats.users.new} new in ${days} days`} onClick={() => onNavigate("users")} />
        <Kpi label="Active this week" value={stats?.users.active7d} detail={stats && `${stats.users.active24h} today, ${stats.users.active30d} this month`} />
        <Kpi label="Stations practised" value={stats?.practice.attempts} detail={stats && `${stats.practice.aiSessions} with the AI patient`} />
        <Kpi label="AI credits used" value={stats?.credits.spent} detail={stats && `${stats.credits.granted.toLocaleString()} given out`} onClick={() => onNavigate("pricing")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <h3 className="font-semibold text-s-ink">Signups and active students</h3>
          <p className="mt-0.5 text-sm text-s-mute">Active means they started at least one station that day.</p>
          <div className="mt-5">
            {stats ? (
              <LineChart
                caption="Signups and active students per day"
                series={[
                  { label: "Active students", points: stats.series.activeStudents, className: "text-s-accent" },
                  { label: "Signups", points: stats.series.signups, className: "text-mint" },
                ]}
              />
            ) : <ChartSkeleton variant="line" />}
          </div>
        </Panel>
        <Panel>
          <h3 className="font-semibold text-s-ink">Stations started per day</h3>
          <p className="mt-0.5 text-sm text-s-mute">AI patient and checklist practice together.</p>
          <div className="mt-5">
            {stats ? <BarChart caption="Stations started per day" label="Stations" points={stats.series.attempts} /> : <ChartSkeleton variant="bars" />}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel>
          <h3 className="font-semibold text-s-ink">Most practised</h3>
          {!stats ? <ListSkeletonRows rows={5} /> : stats.topStations.length === 0 ? (
            <p className="mt-4 text-sm text-s-mute">No stations practised in this period.</p>
          ) : (
            <ol className="mt-3 space-y-1">
              {stats.topStations.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 rounded-xl py-1.5 text-sm">
                  <span className="w-5 font-chart text-xs text-s-mute">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-s-ink">{s.title}</span>
                  <span className="font-chart text-xs text-s-mute">{s.count}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel>
          <h3 className="font-semibold text-s-ink">Station content</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["published", "draft", "approved", "archived"].map((status) => (
              <button key={status} type="button" onClick={() => onNavigate("stations", status)} className="site-press rounded-2xl bg-s-tint/60 p-3 text-left hover:bg-s-tint">
                <span className="block text-xl font-semibold text-s-ink">{counts[status] || 0}</span>
                <span className="block text-xs capitalize text-s-mute">{status}</span>
              </button>
            ))}
          </div>
          {review > 0 && (
            <button type="button" onClick={() => onNavigate("stations", "review")} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-s-accent hover:underline">
              {review} waiting for review <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          {!defaultProvider?.configured && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sun-soft p-3 text-sm text-s-ink">
              <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-sun" aria-hidden="true" /> The AI provider has no key, so AI sessions won't work.
            </p>
          )}
        </Panel>
        <Panel>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-s-ink">Recent changes</h3>
            <button type="button" onClick={() => onNavigate("activity")} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-s-accent hover:underline">All <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></button>
          </div>
          {!activity ? <ListSkeletonRows rows={4} /> : activity.length === 0 ? (
            <p className="mt-2 text-sm text-s-mute">No admin changes yet.</p>
          ) : (
            <ul className="mt-1 space-y-2.5">
              {activity.slice(0, 5).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="text-s-ink">{a.action}</p>
                  <p className="truncate font-chart text-xs text-s-mute">{a.actorEmail} / {timeAgo(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, detail, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} className={`site-grid rounded-3xl border border-s-line p-5 text-left ${onClick ? "site-press hover:border-s-accent/40" : ""}`}>
      <span className="font-chart text-xs text-s-mute">{label}</span>
      {value === undefined ? <Skeleton className="mt-3 h-9 w-20" /> : <span className="mt-2 block text-3xl font-semibold tracking-tight text-s-ink">{value.toLocaleString()}</span>}
      <span className="mt-1 block min-h-5 text-sm text-s-mute">{detail}</span>
    </Tag>
  );
}
