import { HistoryModule } from "../models/HistoryModule.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const sourceReference = "User-provided abdominal pain history content";

export async function seedGynaecologyHistoryStations({ universalGuide }) {
  const gynaecology = await Specialty.findOneAndUpdate(
    { slug: "gynaecology" },
    {
      $set: {
        name: "Gynaecology",
        slug: "gynaecology",
        description: "Gynaecology history-taking modules.",
        icon: "stethoscope",
        order: 2,
        active: true,
      },
    },
    { upsert: true, new: true },
  );

  const station = abdominalPainStation();
  const patientScript = await PatientScript.findOneAndUpdate(
    { slug: station.patientScript.slug },
    { $set: station.patientScript },
    { upsert: true, new: true },
  );
  const checklist = await SmartChecklist.findOneAndUpdate(
    { slug: station.checklist.slug },
    { $set: station.checklist },
    { upsert: true, new: true },
  );
  const module = await HistoryModule.findOneAndUpdate(
    { slug: station.module.slug },
    {
      $set: {
        ...station.module,
        specialtyId: gynaecology._id,
        historyGuideId: universalGuide._id,
        patientScriptId: patientScript._id,
        smartChecklistId: checklist._id,
      },
    },
    { upsert: true, new: true },
  );

  return [module];
}

function abdominalPainStation() {
  const slug = "abdominal-pain-young-woman-gynaecology-history";
  return {
    module: {
      title: "Abdominal Pain History",
      slug,
      presentingComplaint: "Abdominal pain",
      systemOrTopic: "Gynaecology",
      stationType: "history",
      taskTags: ["history", "gynaecology", "abdominal-pain"],
      difficulty: "intermediate",
      timeLimitSeconds: 360,
      shortDescription: "22-year-old woman in the emergency department with abdominal pain.",
      candidateInstructions: {
        context: "You are in the emergency department.",
        patientSummary: "A 22-year-old woman presents with abdominal pain.",
        tasks: ["Take an abdominal pain history."],
        examinationRequired: false,
        additionalInstructions: [],
      },
      examinerInstructions: "",
      keyAnswerGuide: "",
      suggestedCandidateApproach: [],
      learningNotes: "",
      commonMistakes: [],
      keyDifferentials: [],
      vivaQuestions: [],
      sourceReferences: [sourceReference],
      status: "published",
      version: 1,
      createdBy: "seed",
      reviewedBy: "seed",
      publishedAt: new Date(),
    },
    patientScript: {
      name: "22-year-old woman - Abdominal Pain",
      slug: `${slug}-patient`,
      patientIdentity: { name: "", age: 22, sex: "woman", occupation: "history student and part-time retail worker", pronouns: "" },
      baselineState: { generalAppearance: "", currentDistress: "", communicationAbility: "" },
      openingStatement: "I've been having pains in my abdomen.",
      demeanor: { general: "", verbosity: "Only provide details if asked." },
      facts: [
        fact(`${slug}_opening`, "PC", "opening_statement", "Opening Statement", "I've been having pains in my abdomen.", ["opening", "what brought you in"]),
        fact("abdo_pain_site", "HPC", "site", "Site", "The pain is in the right side of my lower abdomen.", ["site", "where", "right iliac fossa", "lower abdomen"]),
        fact("abdo_pain_onset", "HPC", "onset", "Onset", "It came on gradually over the last few hours.", ["onset", "started", "gradual"]),
        fact("abdo_pain_character", "HPC", "character", "Character", "It feels crampy.", ["character", "crampy", "feel"]),
        fact("abdo_pain_radiation", "HPC", "radiation", "Radiation", "It does not radiate. No shoulder tip pain if directly asked.", ["radiation", "spread", "shoulder tip"]),
        fact("abdo_vaginal_bleeding", "HPC", "vaginal_bleeding", "Vaginal bleeding", "There has been a small amount of bleeding from down below. I haven't seen any clots.", ["vaginal bleeding", "bleeding", "clots"]),
        fact("abdo_no_other_bleeding", "HPC", "other_bleeding", "Other bleeding", "No bleeding from other areas.", ["other bleeding", "bleeding elsewhere"]),
        fact("abdo_no_tissue", "HPC", "passage_of_tissue", "Passage of tissue", "No passage of tissue.", ["tissue", "products"]),
        fact("abdo_no_urinary", "HPC", "urinary_symptoms", "Urinary symptoms", "No urinary symptoms.", ["urinary", "dysuria", "frequency"]),
        fact("abdo_no_gi", "HPC", "gastrointestinal_symptoms", "Gastrointestinal symptoms", "No nausea, vomiting, or diarrhoea.", ["nausea", "vomiting", "diarrhoea"]),
        fact("abdo_no_collapse", "RED_FLAG", "dizziness_syncope", "Dizziness or syncope", "No dizziness or syncope.", ["dizziness", "syncope", "faint"]),
        fact("abdo_no_fever", "RED_FLAG", "fever_rigors", "Fever or rigors", "No fever or rigors.", ["fever", "rigors"]),
        fact("abdo_no_reflux", "HPC", "reflux", "Reflux", "No reflux.", ["reflux", "heartburn"]),
        fact("abdo_no_palpitations", "HPC", "palpitations", "Palpitations", "No palpitations.", ["palpitations"]),
        fact("abdo_no_chest_pain", "HPC", "chest_pain", "Chest pain", "No chest pain.", ["chest pain"]),
        fact("abdo_pain_time", "HPC", "time", "Time", "It started a few hours ago. I rang 111 and they told me to come to the hospital. There was no pain prior to this.", ["time", "duration", "111"]),
        fact("abdo_exacerbation_alleviation", "HPC", "exacerbation_alleviation", "Exacerbation and alleviation", "There is no clear exacerbating or relieving factor. I have taken some paracetamol, but it didn't make much difference.", ["worse", "better", "paracetamol", "analgesia"]),
        fact("abdo_severity", "HPC", "severity", "Severity", "The pain is 5 out of 10.", ["severity", "score", "out of 10"]),
        fact("abdo_ideas", "ICE", "ideas", "Ideas", "I'm not sure what the problem is.", ["ideas", "think"]),
        fact("abdo_concerns", "ICE", "concerns", "Concerns", "I'm concerned I might have appendicitis.", ["concerns", "worried", "appendicitis"]),
        fact("abdo_expectations", "ICE", "expectations", "Expectations", "I'd like you to tell me what's causing the pain. If it is appendicitis, will I need an operation?", ["expectations", "operation", "causing"]),
        fact("abdo_menarche_cycles", "PMH", "menstrual_history", "Menstrual history", "My first period was at age 14. I have always had regular periods lasting 5 days, with a cycle every 28 days. They are not particularly heavy and the pain usually settles with paracetamol.", ["periods", "menstrual", "cycle", "menarche"]),
        fact("abdo_lmp", "PMH", "last_menstrual_period", "Last menstrual period", "My last period was nearly 7 weeks ago.", ["last period", "LMP", "menstrual period"]),
        fact("abdo_smear", "PMH", "smear_results", "Smear results", "I haven't had my first smear yet.", ["smear", "cervical screening"]),
        fact("abdo_pregnancy_history", "PMH", "previous_pregnancies", "Previous pregnancies", "No previous pregnancies.", ["pregnancy", "pregnancies", "pregnant"]),
        fact("abdo_sexual_intercourse", "SH", "sexual_intercourse", "Last sexual intercourse", "I have been having sex regularly with my boyfriend. We usually use a condom.", ["sex", "intercourse", "boyfriend", "condom"]),
        fact("abdo_contraception", "SH", "contraception", "Contraception", "I used to take the combined pill, but I haven't picked up a prescription for a few months.", ["contraception", "pill", "COCP"]),
        fact("abdo_sti_history", "SH", "sti_history", "STI history", "I have had chlamydia and gonorrhoea, but they were treated with antibiotics. The last time was about 6 months ago.", ["STI", "chlamydia", "gonorrhoea", "antibiotics"]),
        fact("abdo_medications", "DH", "medications", "Medications", "No, I don't take any medications.", ["medications", "regular prescribed medications"]),
        fact("abdo_allergies", "DH", "allergies", "Drug allergies", "No, I don't think I'm allergic to anything.", ["allergies", "drug allergies"]),
        fact("abdo_family_history", "FH", "family_history", "Family history", "Nil.", ["family history", "family"]),
        fact("abdo_living", "SH", "living_situation", "Living situation", "I live in a terraced house with 3 friends who are all studying at the same university.", ["living", "home", "students"]),
        fact("abdo_occupation", "SH", "occupation", "Occupation", "I'm a history student and I have a Saturday job in a supermarket.", ["occupation", "work", "student", "retail"]),
        fact("abdo_alcohol", "SH", "alcohol", "Alcohol intake", "I would normally drink a few gin and tonics on a night out just once a week.", ["alcohol", "drink"]),
        fact("abdo_smoking", "SH", "smoking", "Smoking", "I have never smoked, it's too expensive.", ["smoking", "smoke"]),
        fact("abdo_drugs", "SH", "illicit_drug_use", "Illicit drug use", "I have never taken any illegal drugs.", ["drugs", "illegal drugs", "illicit"]),
      ],
      emotionalCues: [],
      patientQuestions: [],
      expectedPatientAttitude: "",
      unknownFactPolicy: "If a fact is not supplied in the station script, do not invent details.",
      sourceReferences: [sourceReference],
      status: "published",
      version: 1,
    },
    checklist: {
      title: "Abdominal Pain History Checklist",
      slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: 10, description: "10 checklist rows derived from the provided station content" },
      weightConfiguration: { critical: 3, major: 2, minor: 1 },
      sections: [
        {
          sectionId: "abdominal_pain_history",
          title: "Abdominal pain history",
          items: [
            row("abdo_opening", "Key details and presenting complaint", "Establishes 22-year-old woman in emergency department with abdominal pain", ["opening_statement"], [`${slug}_opening`], "major", 1),
            row("abdo_pain_analysis", "Pain analysis", "Covers site, onset, character, radiation, timing, severity, and exacerbating/alleviating factors", ["site", "onset", "character", "radiation", "time", "severity", "exacerbation_alleviation"], ["abdo_pain_site", "abdo_pain_onset", "abdo_pain_character", "abdo_pain_radiation", "abdo_pain_time", "abdo_severity", "abdo_exacerbation_alleviation"], "major", 2),
            row("abdo_associated_bleeding", "Associated bleeding symptoms", "Asks about vaginal bleeding, clots, bleeding from other areas, and passage of tissue", ["vaginal_bleeding", "other_bleeding", "passage_of_tissue"], ["abdo_vaginal_bleeding", "abdo_no_other_bleeding", "abdo_no_tissue"], "major", 1),
            row("abdo_associated_negatives", "Associated symptom screen", "Asks about urinary, gastrointestinal, fever/rigors, reflux, palpitations, and chest pain symptoms", ["urinary_symptoms", "gastrointestinal_symptoms", "fever_rigors", "reflux", "palpitations", "chest_pain"], ["abdo_no_urinary", "abdo_no_gi", "abdo_no_fever", "abdo_no_reflux", "abdo_no_palpitations", "abdo_no_chest_pain"], "major", 1),
            row("abdo_red_flags", "Red flags", "Asks about dizziness or syncope", ["dizziness_syncope"], ["abdo_no_collapse"], "critical", 1),
            row("abdo_ice", "ICE", "Elicits ideas, concerns, and expectations", ["ideas", "concerns", "expectations"], ["abdo_ideas", "abdo_concerns", "abdo_expectations"], "major", 1),
            row("abdo_gyn_history", "Gynaecological history", "Covers menstrual history, last menstrual period, smear history, and previous pregnancies", ["menstrual_history", "last_menstrual_period", "smear_results", "previous_pregnancies"], ["abdo_menarche_cycles", "abdo_lmp", "abdo_smear", "abdo_pregnancy_history"], "major", 1),
            row("abdo_sexual_history", "Sexual history", "Covers intercourse, contraception, and STI history", ["sexual_intercourse", "contraception", "sti_history"], ["abdo_sexual_intercourse", "abdo_contraception", "abdo_sti_history"], "major", 1),
            row("abdo_drug_family_history", "Drug and family history", "Covers medications, allergies, and family history", ["medications", "allergies", "family_history"], ["abdo_medications", "abdo_allergies", "abdo_family_history"], "major", 1),
            row("abdo_social_history", "Social history", "Covers living situation, occupation, alcohol, smoking, and illicit drug use", ["living_situation", "occupation", "alcohol", "smoking", "illicit_drug_use"], ["abdo_living", "abdo_occupation", "abdo_alcohol", "abdo_smoking", "abdo_drugs"], "major", 1),
          ],
        },
      ],
      version: 1,
      status: "published",
    },
  };
}

function fact(factId, section, conceptId, label, value, synonyms) {
  return {
    factId,
    section,
    conceptId,
    label,
    value,
    naturalResponse: value,
    revealPolicy: factId.endsWith("_opening") ? "OPENING" : "IF_RELEVANT_QUESTION",
    triggerConcepts: [conceptId],
    synonyms,
    relatedChecklistItemIds: [],
  };
}

function row(itemId, label, description, expectedConcepts, relatedFactIds, weightCategory, maxRawScore) {
  return {
    itemId,
    label,
    description,
    category: "history",
    expectedConcepts,
    relatedFactIds,
    weightCategory,
    maxRawScore,
    allowPartial: true,
    criticalSafetyItem: weightCategory === "critical",
    commonMistake: "",
    remediationText: description,
    order: 1,
  };
}
