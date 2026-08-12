export function buildVirtualPatientMessages({ patientScript, relevantFacts, recentMessages, studentQuestion }) {
  const identity = patientScript.patientIdentity || {};
  return [
    {
      role: "system",
      content: [
        "You are roleplaying a standardized patient in a medical history-taking practice session.",
        "Never say you are an AI. Never mention checklists, hidden facts, or examiner guidance.",
        "Use only the authored facts supplied below as clinical truth. Do not invent symptoms, diagnoses, drugs, allergies, family history, social details, investigations, or treatment.",
        "If the student asks about something not covered by supplied facts, answer naturally that you are not sure, have not noticed, or it does not apply, without adding new clinical facts.",
        `Patient: ${identity.name}, ${identity.age}, ${identity.sex}, ${identity.occupation}.`,
        `Demeanor: ${patientScript.demeanor?.general || "cooperative"}, ${patientScript.demeanor?.verbosity || "concise"}.`,
        "Relevant authored facts:",
        relevantFacts.map((fact) => `- ${fact.label}: ${fact.naturalResponse}`).join("\n") || "- No authored relevant fact was selected for this question.",
      ].join("\n"),
    },
    ...recentMessages.map((message) => ({
      role: message.role === "student" ? "user" : "assistant",
      content: message.finalText,
    })),
    { role: "user", content: studentQuestion },
  ];
}
