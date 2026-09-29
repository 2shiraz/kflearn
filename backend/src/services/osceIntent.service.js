import { keywordMatches, keywordScore, normalizeText, tokenizeText, unique } from "../utils/text.js";

const conceptSynonyms = {
  opening_statement: ["what brought you in", "what happened", "tell me what happened", "problem today", "presenting complaint"],
  onset: ["when", "start", "started", "begin", "began", "come on", "came on", "onset", "sudden", "gradual", "how long", "duration", "ago"],
  timing: ["how many times", "how often", "frequency", "time course", "again", "since", "timeline"],
  duration: ["how long", "when", "start", "started", "duration", "ago"],
  pattern: ["all the time", "constant", "come and go", "comes and goes", "frequency", "often", "intermittent"],
  character: ["what like", "look like", "describe", "character", "colour", "color", "amount", "volume", "severity", "how bad", "pain like"],
  radiation: ["radiate", "radiation", "spread", "go anywhere"],
  associated_symptoms: ["associated", "other symptoms", "anything else", "nausea", "vomiting", "fever", "dizzy", "faint", "chest pain", "shortness of breath", "bowels", "urine"],
  nocturnal_symptoms: ["night", "sleep", "wake", "wakes", "early morning"],
  triggers: ["trigger", "worse", "better", "relief", "bring it on", "set it off", "exercise", "cold", "dust", "pollen", "season", "work"],
  previous_episodes: ["before", "previous", "ever happened", "happened before", "first time"],
  medical_history: ["medical history", "past medical", "diagnosed", "condition", "illness", "disease", "problems"],
  surgery: ["surgery", "operation", "procedure"],
  medication: ["medication", "medicine", "tablets", "prescribed", "inhaler", "salbutamol", "steroid", "drug"],
  allergies: ["allergy", "allergies", "allergic", "reaction"],
  family_history: ["family", "mother", "father", "parent", "runs in the family"],
  social_history: ["home", "live", "living", "support", "work", "job", "occupation", "student"],
  smoking: ["smoke", "smoking", "cigarette", "vape", "vaping"],
  alcohol: ["alcohol", "drink", "drinking", "beer", "wine", "vodka", "units"],
  recreational_drugs: ["recreational drugs", "illegal drugs", "drugs", "cocaine", "cannabis"],
  previous_severity: ["hospital", "admitted", "emergency", "icu", "intensive", "intubated", "breathing tube"],
  atopy: ["eczema", "hay fever", "allergy", "allergies", "atopy"],
  impact: ["affect", "impact", "school", "work", "exercise", "daily"],
  ideas: ["idea", "ideas", "think", "cause", "causing", "why", "what do you think"],
  concerns: ["concern", "concerns", "worried", "worry", "scared", "fear", "frightened", "most worried"],
  expectations: ["expect", "expectations", "hoping", "want", "would you like", "what do you want"],
};

const sectionSynonyms = {
  PC: ["presenting complaint", "problem today", "what brought you in", "what happened"],
  HPC: ["history of presenting complaint", "symptoms", "associated", "onset", "timing", "character", "severity", "trigger"],
  PMH: ["past medical", "medical history", "diagnosed", "condition", "disease", "surgery", "operation", "stomach problems", "liver disease"],
  DH: ["drug history", "medication", "medicine", "tablets", "allergy", "allergies", "allergic", "prescribed", "over the counter"],
  FH: ["family history", "family", "mother", "father", "parents", "siblings", "runs in the family"],
  SH: ["social history", "home", "live", "living", "work", "job", "occupation", "smoking", "alcohol", "drugs", "support"],
  ROS: ["systems review", "other systems", "anything else"],
  ICE: ["ideas", "concerns", "expectations", "think", "worried", "expect", "hoping", "want"],
  RED_FLAG: ["red flag", "dizzy", "faint", "collapse", "chest pain", "shortness of breath", "weak"],
  OTHER: ["key details", "age", "name", "occupation"],
};

const stopwords = new Set([
  "a", "about", "an", "and", "any", "are", "as", "at", "be", "been", "but", "by", "can", "could", "did", "do", "does",
  "for", "from", "had", "has", "have", "having", "he", "her", "him", "his", "how", "i", "if", "in", "is", "it", "me",
  "might", "my", "of", "on", "or", "our", "she", "so", "that", "the", "there", "this", "to", "was", "we", "were", "what",
  "when", "where", "which", "who", "why", "with", "would", "you", "your",
]);

export function detectConcepts(question, facts = []) {
  const matches = [];
  for (const [concept, synonyms] of Object.entries(conceptSynonyms)) {
    if (keywordScore(question, synonyms) > 0) {
      matches.push(concept);
    }
  }

  for (const fact of facts) {
    const terms = [fact.label, fact.conceptId, ...(fact.synonyms || []), ...(fact.triggerConcepts || [])];
    if (keywordScore(question, terms) > 0) {
      matches.push(fact.conceptId);
    }
  }

  return unique(matches);
}

export function selectRelevantFacts(question, patientScript) {
  const concepts = detectConcepts(question, patientScript.facts);
  const ranked = patientScript.facts.map((fact) => ({
    fact,
    score: scoreFact(question, fact, concepts),
  })).filter(({ fact, score }) => {
    if (fact.revealPolicy === "OPENING") return false;
    return score >= 2;
  }).sort((a, b) => b.score - a.score);

  return {
    concepts,
    facts: ranked.slice(0, 5).map(({ fact }) => fact),
  };
}

function scoreFact(question, fact, concepts) {
  const directTerms = [
    fact.label,
    fact.conceptId,
    ...(fact.triggerConcepts || []),
    ...(fact.synonyms || []),
  ];
  const contentTerms = [fact.value, fact.naturalResponse];
  const sectionTerms = sectionSynonyms[fact.section] || [];

  let score = 0;
  score += keywordScore(question, directTerms) * 4;
  score += keywordScore(question, sectionTerms) * 2;
  score += contentOverlapScore(question, [...directTerms, ...contentTerms]);

  if (concepts.includes(fact.conceptId)) score += 4;
  if ((fact.triggerConcepts || []).some((concept) => concepts.includes(concept))) score += 3;

  return score;
}

function contentOverlapScore(question, values) {
  const questionTokens = meaningfulTokens(question);
  if (questionTokens.length === 0) return 0;

  const haystackTokens = new Set(meaningfulTokens(values.join(" ")));
  const overlap = questionTokens.filter((token) => haystackTokens.has(token)).length;
  const phraseBonus = values.some((value) => {
    const normalizedValue = normalizeText(value);
    return questionTokens.some((token) => token.length > 4 && keywordMatches(normalizedValue, token));
  }) ? 1 : 0;

  return overlap + phraseBonus;
}

function meaningfulTokens(text) {
  return unique(tokenizeText(text).filter((token) => token.length > 2 && !stopwords.has(token)));
}
