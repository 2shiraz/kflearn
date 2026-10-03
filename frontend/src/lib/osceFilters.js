export const OSCE_CATEGORIES = [
  { value: "history", label: "History & Clinical Assessment" },
  { value: "counselling", label: "Counselling & Communication" },
  { value: "examination", label: "Clinical Examination" },
  { value: "interpretation", label: "Data & Image Interpretation" },
  { value: "emergency", label: "Emergency Assessment & Management" },
  { value: "procedure", label: "Procedures & Practical Skills" },
];

export function categoryOf(station) {
  return station.category || station.stationType || "history";
}

export function hasVirtualPatient(station) {
  return station.aiVirtualPatientAvailable ?? (station.practiceOptions || ["single-player", "virtual-patient"]).includes("virtual-patient");
}

export function filterStations(stations, filters = {}) {
  const query = (filters.q || "").trim().toLowerCase();
  return stations.filter((station) => {
    if (filters.category && categoryOf(station) !== filters.category) return false;
    if (filters.specialty && station.specialty?.name !== filters.specialty) return false;
    if (filters.difficulty && station.difficulty !== filters.difficulty) return false;
    if (filters.mode === "ai" && !hasVirtualPatient(station)) return false;
    if (filters.mode === "guided" && hasVirtualPatient(station)) return false;
    const searchable = [station.title, station.shortDescription, station.presentingComplaint, station.specialty?.name, ...(station.taskTags || [])].join(" ").toLowerCase();
    return !query || query.split(/\s+/).every((word) => searchable.includes(word));
  }).sort((a, b) => {
    if (filters.sort === "duration") return a.timeLimitSeconds - b.timeLimitSeconds || a.title.localeCompare(b.title);
    if (filters.sort === "title") return a.title.localeCompare(b.title);
    return 0;
  });
}
