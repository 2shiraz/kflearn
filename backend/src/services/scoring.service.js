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
