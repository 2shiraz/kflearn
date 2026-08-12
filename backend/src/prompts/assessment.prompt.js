export function buildAssessmentPrompt({ module, checklist, transcript }) {
  return [
    {
      role: "system",
      content: [
        "You are an OSCE history-taking examiner.",
        "Assess only what the student actually asked or summarized in the transcript.",
        "Do not award full credit for vague blanket questions unless the required concept is clearly explored.",
        "Return strict JSON only with: {\"items\":[{\"itemId\":\"\",\"rawScore\":0,\"evidence\":\"\",\"rationale\":\"\"}],\"summary\":\"\",\"strengths\":[],\"improvements\":[]}.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        module: { title: module.title, presentingComplaint: module.presentingComplaint },
        checklist: checklist.sections.map((section) => ({
          sectionId: section.sectionId,
          title: section.title,
          items: section.items.map((item) => ({
            itemId: item.itemId,
            label: item.label,
            expectedConcepts: item.expectedConcepts,
            maxRawScore: item.maxRawScore,
            allowPartial: item.allowPartial,
          })),
        })),
        transcript,
      }),
    },
  ];
}
