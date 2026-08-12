export function normalizeText(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function stemToken(token = "") {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("es") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 4) return token.slice(0, -1);
  return token;
}

export function tokenizeText(text = "") {
  return normalizeText(text).split(" ").filter(Boolean).map(stemToken);
}

export function keywordMatches(question, term) {
  const normalizedQuestion = normalizeText(question);
  const normalizedTerm = normalizeText(term);
  if (!normalizedQuestion || !normalizedTerm) return false;

  const questionTokens = new Set(tokenizeText(question));
  const termTokens = tokenizeText(term);
  if (termTokens.length === 0) return false;
  if (termTokens.length === 1) return questionTokens.has(termTokens[0]);
  if (normalizedQuestion.includes(normalizedTerm)) return true;
  return termTokens.every((token) => questionTokens.has(token));
}

export function keywordScore(question, terms = []) {
  return terms.reduce((score, term) => score + (keywordMatches(question, term) ? 1 : 0), 0);
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
