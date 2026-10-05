import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Clock3, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { OSCE_CATEGORIES, categoryOf, displayTitle, filterStations, hasVirtualPatient } from "../lib/osceFilters.js";
import { EmptyState } from "./AppPage";
import { inputClass } from "./AuthShell";
import { Chip, Pager, rise } from "./StudyKit";
import { MedIcon } from "../site/Illustrations";
import { TONES, specialtyLook } from "../site/tones";

const PAGE_SIZE = 12;
// Short chip labels so the category row fits on one line on desktop.
const CHIP_LABELS = {
  history: "History",
  counselling: "Counselling",
  examination: "Examination",
  interpretation: "Data interpretation",
  emergency: "Emergencies",
  procedure: "Procedures",
};
const FILTER_KEYS = ["specialty", "mode", "difficulty", "sort"];

export function StationAvailability({ station, compact = false }) {
  const ai = hasVirtualPatient(station);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-chart text-xs ${ai ? "bg-s-accent-soft text-s-accent-strong" : "bg-s-tint text-s-mute"}`}>
      {ai && <Sparkles size={13} strokeWidth={2} aria-hidden="true" />}
      {ai ? (compact ? "AI patient" : "AI virtual patient available") : compact ? "Guided" : "Guided practice only"}
    </span>
  );
}

function categoryLabel(station) {
  return station.categoryLabel || OSCE_CATEGORIES.find(({ value }) => value === categoryOf(station))?.label || "";
}

function StationCard({ station, index }) {
  const look = specialtyLook(station.specialty?.name);
  const tone = TONES[look.tone];
  return (
    <Link
      to={`/stations/${station.slug}`}
      style={rise(index)}
      className={`site-rise site-grid site-press group flex min-w-0 flex-col rounded-3xl border border-s-line p-5 ${tone.ring}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone.soft}`} aria-hidden="true">
          <MedIcon name={look.icon} size={28} />
        </span>
        <StationAvailability station={station} compact />
      </div>
      <p className="mt-4 truncate text-xs text-s-mute">
        {station.specialty?.name || "General"} / {categoryLabel(station)}
      </p>
      <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-s-ink">{displayTitle(station.title)}</h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-s-mute">{station.shortDescription}</p>
      <div className="mt-4 flex items-center gap-2 border-t border-s-line pt-4">
        <Chip><Clock3 size={12} strokeWidth={2} aria-hidden="true" /> {Math.round(station.timeLimitSeconds / 60)} min</Chip>
        {station.difficulty && <Chip className="capitalize">{station.difficulty}</Chip>}
        <ArrowRight size={16} strokeWidth={2} className={`ml-auto shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${tone.text}`} aria-hidden="true" />
      </div>
    </Link>
  );
}

function SelectField({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-s-ink">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} py-2.5 text-sm`}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </div>
  );
}

// Search and a filters panel over a paged grid of station cards. Category
// chips appear once results are showing (not on the default view). Every filter lives in the URL so results can be shared and survive
// back/forward. `defaultContent` shows instead of results until the student
// searches or filters (the OSCE home uses it for the specialty tiles).
export default function OsceStationBrowser({ stations, specialtyOnly = false, defaultContent }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const panelId = useId();
  const searchId = useId();
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(params);
  // A specialty page is already scoped, regardless of a copied URL's specialty filter.
  if (specialtyOnly) delete filters.specialty;

  const filtered = filterStations(stations, filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.get("page"), 10) || 1));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const specialties = [...new Set(stations.map((s) => s.specialty?.name).filter(Boolean))].sort();
  const panelCount = FILTER_KEYS.filter((key) => filters[key]).length;
  const active = Boolean(filters.q || filters.category || panelCount);
  const showResults = !defaultContent || active || params.has("page");

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key === "q" });
  }

  const categories = OSCE_CATEGORIES.map((c) => ({ ...c, count: stations.filter((s) => categoryOf(s) === c.value).length })).filter((c) => c.count > 0);

  return (
    <section aria-label="Browse OSCE stations">
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <label htmlFor={searchId} className="sr-only">Search stations</label>
          <div className="relative min-w-0 flex-1">
            <Search size={18} strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" />
            <input
              id={searchId}
              type="search"
              value={filters.q || ""}
              onChange={(e) => update("q", e.target.value)}
              placeholder="Search stations"
              className="min-h-12 w-full rounded-full border border-s-line bg-s-card pl-11 pr-4 text-[15px] text-s-ink outline-none transition placeholder:text-s-mute focus:border-s-accent focus:ring-2 focus:ring-s-accent/25"
            />
          </div>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={panelId}
            onClick={() => setFiltersOpen((open) => !open)}
            className={`site-press relative inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
              filtersOpen || panelCount ? "border-s-accent bg-s-accent-soft text-s-accent-strong" : "border-s-line bg-s-card text-s-ink hover:border-s-accent/40"
            }`}
          >
            <SlidersHorizontal size={17} strokeWidth={2} aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sr-only sm:hidden">Filters</span>
            {panelCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-s-accent px-1 font-chart text-[11px] text-s-on-accent">
                {panelCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
        </div>

        {showResults && <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Category">
          {[{ value: "", label: "All", count: stations.length }, ...categories].map((c) => {
            const on = (filters.category || "") === c.value;
            return (
              <button
                key={c.value || "all"}
                type="button"
                title={c.value ? c.label : undefined}
                aria-pressed={on}
                onClick={() => update("category", c.value)}
                className={`site-press inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium ${
                  on ? "border-s-accent bg-s-accent-soft text-s-accent-strong" : "border-s-line bg-s-card text-s-mute hover:border-s-accent/40 hover:text-s-ink"
                }`}
              >
                {CHIP_LABELS[c.value] || c.label}
                <span className={`font-chart text-xs ${on ? "text-s-accent-strong/70" : "text-s-mute/80"}`}>{c.count}</span>
              </button>
            );
          })}
        </div>}

        <div id={panelId} hidden={!filtersOpen} className="site-grid rounded-3xl border border-s-line p-5">
          <div className={`grid gap-4 sm:grid-cols-2 ${specialtyOnly ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {!specialtyOnly && (
              <SelectField label="Specialty" value={filters.specialty || ""} onChange={(v) => update("specialty", v)} options={[["", "All specialties"], ...specialties.map((n) => [n, n])]} />
            )}
            <SelectField
              label="Practice"
              value={filters.mode || ""}
              onChange={(v) => update("mode", v)}
              options={[["", "All stations"], ["ai", "With AI patient"], ["guided", "Guided practice only"]]}
            />
            <SelectField
              label="Difficulty"
              value={filters.difficulty || ""}
              onChange={(v) => update("difficulty", v)}
              options={[["", "Any difficulty"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]]}
            />
            <SelectField
              label="Sort by"
              value={filters.sort || ""}
              onChange={(v) => update("sort", v)}
              options={[["", "Recently updated"], ["title", "Title, A to Z"], ["duration", "Shortest first"]]}
            />
          </div>
          <p className="mt-4 text-xs text-s-mute">Guided practice is part of your monthly pass. AI patient sessions use AI credits.</p>
        </div>

        {showResults && (
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-s-mute" role="status">
              <span className="font-semibold text-s-ink">{filtered.length}</span> of {stations.length} stations
            </p>
            {(active || defaultContent) && (
              <button type="button" onClick={() => setParams({})} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-s-accent hover:bg-s-accent-soft">
                <X size={15} strokeWidth={2} aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {!showResults ? (
        defaultContent
      ) : (
        <>
          {!visible.length && (
            <EmptyState character="examiner" tone="mint" title="No stations match" body="Try a different search, or clear the filters to see every station." />
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((station, i) => <StationCard key={station.id} station={station} index={i} />)}
          </div>
          <Pager page={page} totalPages={totalPages} onPage={(p) => update("page", String(p))} />
        </>
      )}
    </section>
  );
}
