import { keywordScore, normalizeText, tokenizeText, unique } from "../utils/text.js";

const stopwords = new Set([
  "a", "about", "an", "and", "any", "are", "as", "ask", "asked", "at", "be", "been", "but", "by", "can", "could", "did",
  "do", "does", "for", "from", "had", "has", "have", "having", "he", "her", "him", "his", "how", "i", "if", "in", "is",
  "it", "me", "my", "of", "on", "or", "patient", "she", "so", "that", "the", "their", "this", "to", "was", "we", "were",
  "what", "when", "where", "which", "who", "why", "with", "would", "you", "your",
]);

export function calculateScore(checklist, itemScores = []) {
  const scoresById = new Map(itemScores.map((score) => [score.itemId, Number(score.rawScore || 0)]));
  const weights = checklist.weightConfiguration || { critical: 3, major: 2, minor: 1 };
  let rawScore = 0;
  let maxRawScore = 0;
  let weightedScore = 0;
  let maxWeightedScore = 0;

  for (const section of checklist.sections) {
    for (const item of section.items) {
      const max = Number(item.maxRawScore || 1);
      const raw = Math.min(Math.max(scoresById.get(item.itemId) || 0, 0), max);
      const weight = Number(weights[item.weightCategory] || 1);
      rawScore += raw;
      maxRawScore += max;
      weightedScore += raw * weight;
      maxWeightedScore += max * weight;
    }
  }

  return {
    rawScore,
    maxRawScore,
    weightedScore,
    maxWeightedScore,
    percentage: maxWeightedScore ? Math.round((weightedScore / maxWeightedScore) * 100) : 0,
  };
}

export function assessChecklistFromTranscript(checklist, attempt) {
  const transcript = attempt.messages
    .filter((message) => message.role === "student")
    .map((message) => message.finalText)
    .join("\n");
  const coveredFacts = new Set(attempt.internalCoverage?.factIds || []);
  const coveredConcepts = new Set(attempt.internalCoverage?.conceptIds || []);

  const itemScores = checklist.sections.flatMap((section) =>
    section.items.map((item) => {
      const score = checklistEvidenceScore(item, transcript, coveredFacts, coveredConcepts);
      const maxRawScore = Number(item.maxRawScore || 1);
      const rawScore = score >= 4 ? maxRawScore : 0;
      return {
        itemId: item.itemId,
        rawScore,
        evidence: rawScore ? "Matched against the student's transcript and explored patient facts." : "",
        rationale: rawScore ? "Relevant checklist concept was covered." : "No clear evidence in the transcript.",
      };
    }),
  );

  return {
    itemScores,
    finalScore: calculateScore(checklist, itemScores),
  };
}

export function selfAssessChecklist(checklist, checkedItemIds = []) {
  const checked = new Set(checkedItemIds);
  const itemScores = checklist.sections.flatMap((section) =>
    section.items.map((item) => ({
      itemId: item.itemId,
      rawScore: checked.has(item.itemId) ? item.maxRawScore || 1 : 0,
      evidence: checked.has(item.itemId) ? "Marked by student during self assessment." : "",
    })),
  );
  return {
    itemScores,
    finalScore: calculateScore(checklist, itemScores),
  };
}

function checklistEvidenceScore(item, transcript, coveredFacts, coveredConcepts) {
  const expectedConcepts = item.expectedConcepts || [];
  const relatedFactIds = item.relatedFactIds || [];
  const baseTerms = [
    item.label,
    item.description,
    item.remediationText,
    ...expectedConcepts,
    ...checklistIntentTerms(item),
  ].filter(Boolean);

  let score = 0;
  if (relatedFactIds.some((id) => coveredFacts.has(id))) score += 5;
  if (expectedConcepts.some((concept) => coveredConcepts.has(concept))) score += 4;
  score += keywordScore(transcript, baseTerms) * 2;
  score += contentOverlapScore(transcript, baseTerms);
  return score;
}

function checklistIntentTerms(item) {
  const text = normalizeText(`${item.label || ""} ${item.description || ""} ${item.remediationText || ""}`);
  const terms = [];

  if (text.includes("wash") || text.includes("ppe")) terms.push("wash hands", "hand hygiene", "ppe", "sanitise", "sanitize");
  if (text.includes("introduces")) terms.push("i am", "i'm", "im", "doctor", "my name is", "one of the doctors");
  if (text.includes("confirm") && (text.includes("name") || text.includes("birth"))) terms.push("confirm your name", "date of birth", "dob", "confirm your age", "your age");
  if (text.includes("explains") || text.includes("take a history")) terms.push("ask you some questions", "take a history", "what happened today");
  if (text.includes("consent")) terms.push("is that okay", "is that ok", "okay", "consent");
  if (text.includes("open question") || text.includes("presenting complaint")) terms.push("what brought you", "tell me what happened", "what happened", "brought you in");
  if (text.includes("onset")) terms.push("when", "start", "started", "begin", "began", "came on");
  if (text.includes("time course") || text.includes("timeline")) terms.push("how many times", "how often", "again", "timeline", "since");
  if (text.includes("character") || text.includes("volume")) terms.push("look like", "bright red", "dark", "clots", "streaks", "how much", "amount", "volume");
  if (text.includes("associated")) terms.push("associated symptoms", "abdominal pain", "melaena", "black stools", "dizzy", "faint", "syncope", "chest pain", "fever", "diarrhoea");
  if (text.includes("trigger")) terms.push("trigger", "set it off", "alcohol", "binge", "worse", "better");
  if (text.includes("gastrointestinal symptoms")) terms.push("weight loss", "nausea", "jaundice", "fatigue", "bowels", "diarrhoea", "reflux");
  if (text.includes("ideas") || text.includes("concerns") || text.includes("expectations")) terms.push("think", "causing", "worried", "concerned", "hoping", "expect", "want");
  if (text.includes("summarises") || text.includes("summarising")) terms.push("summarise", "summarize", "to summarise", "to summarize", "missed");
  if (text.includes("other body systems")) terms.push("other symptoms", "anything else", "systems", "chest pain", "shortness of breath", "urinary");
  if (text.includes("conditions") || text.includes("pre existing") || text.includes("medical diagnoses")) terms.push("medical history", "liver disease", "stomach problems", "diagnosed", "conditions", "surgery", "operations");
  if (text.includes("medications") || text.includes("over the counter")) terms.push("medications", "medicines", "tablets", "aspirin", "ibuprofen", "blood thinners", "over the counter");
  if (text.includes("allergies")) terms.push("allergies", "allergic", "reaction");
  if (text.includes("family history")) terms.push("family history", "runs in the family", "parents", "mother", "father");
  if (text.includes("social context")) terms.push("home", "live", "living", "support", "who do you live", "social");
  if (text.includes("smoking")) terms.push("smoke", "smoking", "cigarettes", "pack year", "vape");
  if (text.includes("alcohol")) terms.push("alcohol", "drink", "drinking", "units", "vodka", "wine", "beer");
  if (text.includes("recreational")) terms.push("recreational drugs", "illegal drugs", "drugs", "cannabis", "cocaine");
  if (text.includes("occupation")) terms.push("occupation", "work", "job", "employed", "unemployed");
  if (text.includes("thanks")) terms.push("thank you", "thanks");
  if (text.includes("active listening")) terms.push("sorry", "that sounds", "i understand", "thank you");
  if (text.includes("signposting")) terms.push("next", "now", "going to ask", "move on");

  return terms;
}

function contentOverlapScore(transcript, values) {
  const transcriptTokens = new Set(meaningfulTokens(transcript));
  if (transcriptTokens.size === 0) return 0;
  return meaningfulTokens(values.join(" ")).filter((token) => transcriptTokens.has(token)).length;
}

function meaningfulTokens(text) {
  return unique(tokenizeText(text).filter((token) => token.length > 2 && !stopwords.has(token)));
}
