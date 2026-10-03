export const OSCE_CATEGORIES = [
  { value: "history", label: "History & Clinical Assessment" },
  { value: "counselling", label: "Counselling & Communication" },
  { value: "examination", label: "Clinical Examination" },
  { value: "interpretation", label: "Data & Image Interpretation" },
  { value: "emergency", label: "Emergency Assessment & Management" },
  { value: "procedure", label: "Procedures & Practical Skills" },
];

export function stationCategory(station) {
  if (OSCE_CATEGORIES.some(({ value }) => value === station.category)) return station.category;
  // The lumbar-puncture station was previously classified as an examination.
  if (/procedural/i.test(station.stationFormat || "") || station.slug === "cns-08-meningitis-lumbar-puncture-on-mannequin") return "procedure";
  return OSCE_CATEGORIES.some(({ value }) => value === station.stationType) ? station.stationType : "history";
}

export function stationPracticeOptions(station) {
  // Preserve the original two-mode behaviour of stations authored before modes existed.
  return station.practiceModes?.length ? [...station.practiceModes] : ["single-player", "virtual-patient"];
}
