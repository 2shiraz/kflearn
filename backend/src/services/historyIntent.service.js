import { keywordScore, normalizeText, unique } from "../utils/text.js";

const conceptSynonyms = {
  duration: ["how long", "when", "start", "started", "duration", "ago"],
  pattern: ["all the time", "constant", "come and go", "comes and goes", "frequency", "often"],
  nocturnal_symptoms: ["night", "sleep", "wake", "wakes", "early morning"],
  triggers: ["trigger", "worse", "bring it on", "exercise", "cold", "dust", "pollen", "season", "work"],
  smoking: ["smoke", "smoking", "cigarette", "vape", "vaping"],
  family_history: ["family", "mother", "father", "parent", "asthma in your family"],
  previous_severity: ["hospital", "admitted", "emergency", "icu", "intensive", "intubated", "breathing tube"],
  atopy: ["eczema", "hay fever", "allergy", "allergies", "atopy"],
  medication: ["medication", "inhaler", "salbutamol", "steroid", "drug"],
  impact: ["affect", "impact", "school", "work", "exercise", "daily"],
  ideas_concerns_expectations: ["worried", "concern", "think", "expect", "idea"],
};

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
  const normalizedQuestion = normalizeText(question);
  const selected = patientScript.facts.filter((fact) => {
    if (fact.revealPolicy === "OPENING") return false;
    const terms = [
      fact.label,
      fact.conceptId,
      ...(fact.triggerConcepts || []),
      ...(fact.synonyms || []),
    ];
    return concepts.includes(fact.conceptId) || terms.some((term) => normalizedQuestion.includes(normalizeText(term)));
  });

  return {
    concepts,
    facts: selected.slice(0, 5),
  };
}
