export function normalizeText(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function keywordScore(question, terms = []) {
  const normalized = normalizeText(question);
  return terms.reduce((score, term) => score + (normalized.includes(normalizeText(term)) ? 1 : 0), 0);
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
