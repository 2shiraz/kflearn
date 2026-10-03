import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock3, Search, Settings2, Sparkles } from "lucide-react";
import { OSCE_CATEGORIES, categoryOf, filterStations, hasVirtualPatient } from "../lib/osceFilters.js";

export function StationAvailability({ station }) {
  const ai = hasVirtualPatient(station);
  return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium ${ai ? "bg-s-accent-soft text-s-accent-strong" : "bg-s-tint text-s-mute"}`}>
    {ai && <Sparkles size={13} className="shrink-0" aria-hidden="true" />}
    {ai ? "AI virtual patient available" : "Guided practice only"}
  </span>;
}

export default function OsceStationBrowser({ stations, specialtyOnly = false, defaultContent }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const searchId = useId();
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(params);
  // A specialty page is already scoped, regardless of a copied URL's specialty filter.
  if (specialtyOnly) delete filters.specialty;
  const filtered = filterStations(stations, filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(params.get("page"), 10) || 1));
  const visible = filtered.slice((page - 1) * 12, page * 12);
  const specialties = [...new Set(stations.map((station) => station.specialty?.name).filter(Boolean))].sort();
  const active = ["q", "category", "specialty", "mode", "difficulty", "sort"].some((key) => filters[key]);
  const filterCount = ["category", "specialty", "mode", "difficulty", "sort"].filter((key) => filters[key]).length;
  const showResults = !defaultContent || active || params.get("view") === "search" || params.has("page");
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: key === "q" });
  }
  const inputStyle = "min-h-11 w-full min-w-0 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink";
  function select(label, key, options) {
    return <label className="min-w-0 text-xs font-medium text-s-mute">{label}
      <select aria-label={label} className={`${inputStyle} mt-1.5`} value={filters[key] || ""} onChange={(event) => update(key, event.target.value)}>
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>;
  }
  return <section aria-label="Browse OSCE stations">
    <div className="mb-5">
      <label htmlFor={searchId} className="mb-2 block text-sm font-medium text-s-ink">Search stations</label>
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" />
          <input id={searchId} type="search" className={`${inputStyle} min-h-12 pl-11 pr-3`} placeholder="Search a condition, task or station…" value={filters.q || ""} onChange={(event) => update("q", event.target.value)} />
        </div>
        <button type="button" aria-label={filtersOpen ? "Hide filters" : "Show filters"} title={filtersOpen ? "Hide filters" : "Show filters"} aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => setFiltersOpen((open) => !open)} className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${filtersOpen || filterCount ? "border-s-accent bg-s-accent-soft text-s-accent-strong" : "border-s-line bg-s-card text-s-mute hover:text-s-ink"}`}>
          <Settings2 size={20} aria-hidden="true" />
          {filterCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-s-accent px-1 text-[10px] text-s-on-accent">{filterCount}<span className="sr-only"> active filters</span></span>}
        </button>
      </div>
      <div id={filtersId} hidden={!filtersOpen} className="mt-3 rounded-2xl border border-s-line bg-s-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {select("Category", "category", [["", "All categories"], ...OSCE_CATEGORIES.map(({ value, label }) => [value, `${label} (${stations.filter((station) => categoryOf(station) === value).length})`])])}
        {!specialtyOnly && select("Specialty", "specialty", [["", "All specialties"], ...specialties.map((name) => [name, name])])}
        {select("Practice availability", "mode", [["", "All stations"], ["ai", "AI virtual patient available"], ["guided", "Guided practice only"]])}
        {select("Difficulty", "difficulty", [["", "All difficulties"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]])}
        {select("Sort by", "sort", [["", "Recently updated"], ["title", "Title A–Z"], ["duration", "Shortest duration"]])}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-s-mute">AI sessions require credits; guided practice is free. Category counts cover this station bank before filtering.</p>
      </div>
      {showResults && <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-s-mute" role="status">{filtered.length} of {stations.length} stations</p>
        {(active || defaultContent) && <button type="button" className="min-h-11 px-3 text-sm font-medium text-s-accent-strong" onClick={() => setParams({})}>Clear search & filters</button>}
      </div>}
    </div>
    {!showResults ? defaultContent : <>
    {!visible.length && <p className="rounded-2xl border border-s-line p-6 text-s-mute">No stations match these filters. Try a different search or clear the filters.</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visible.map((station) => <Link key={station.id} to={`/stations/${station.slug}`} className="site-press group flex min-w-0 flex-col rounded-3xl border border-s-line bg-s-card p-5 transition-colors hover:bg-s-tint">
        <div className="mb-3"><StationAvailability station={station} /></div>
        <p className="text-xs font-medium text-s-mute">{station.specialty?.name || "General"} · {station.categoryLabel || OSCE_CATEGORIES.find(({ value }) => value === categoryOf(station))?.label}</p>
        <h2 className="mt-2 break-words text-lg font-semibold tracking-tight text-s-ink">{station.title}</h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-s-mute">{station.shortDescription}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-s-mute">
          <span className="inline-flex items-center gap-1"><Clock3 size={13} aria-hidden="true" />{Math.round(station.timeLimitSeconds / 60)} min</span>
          <span className="capitalize">{station.difficulty}</span>
        </div>
      </Link>)}
    </div>
    {totalPages > 1 && <nav aria-label="Station pages" className="mt-5 flex items-center justify-between gap-2 text-sm text-s-ink">
      <button type="button" className="min-h-11 rounded-xl border border-s-line px-3 disabled:opacity-40" disabled={page === 1} onClick={() => update("page", String(page - 1))}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" className="min-h-11 rounded-xl border border-s-line px-3 disabled:opacity-40" disabled={page === totalPages} onClick={() => update("page", String(page + 1))}>Next</button>
    </nav>}
    </>}
  </section>;
}
