import { HistoryGuide } from "../models/HistoryGuide.js";
import { HistoryModule } from "../models/HistoryModule.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";
import { seedRespiratoryPdfHistoryStations } from "./respiratoryPdfHistory.seed.js";

export async function seedHistoryContent() {
  const respiratory = await Specialty.findOneAndUpdate(
    { slug: "respiratory" },
    {
      $set: {
        name: "Respiratory",
        slug: "respiratory",
        description: "Respiratory history-taking and clinical reasoning modules.",
        icon: "stethoscope",
        order: 1,
        active: true,
      },
    },
    { upsert: true, new: true },
  );

  const universalGuide = await HistoryGuide.findOneAndUpdate(
    { slug: "universal-history-taking-framework" },
    {
      $set: {
        title: "Universal History Taking Framework",
        slug: "universal-history-taking-framework",
        type: "universal",
        overview: "Reusable structure for opening a consultation, exploring the presenting complaint, and covering core history domains.",
        sections: [
          {
            id: "opening",
            title: "Universal opening",
            description: "Start every history safely and professionally.",
            items: [
              { conceptId: "introduce_self", heading: "Introduce yourself", explanation: "Introduce your name and role.", exampleQuestions: ["Hello, my name is..."] },
              { conceptId: "patient_identity", heading: "Confirm patient details", explanation: "Ask the patient's name, age, and occupation.", exampleQuestions: ["Can I confirm your name and age?", "What do you do for work?"] },
              { conceptId: "open_question", heading: "Open question", explanation: "Begin with an open question.", exampleQuestions: ["What has brought you in today?"] },
            ],
          },
          {
            id: "standard_framework",
            title: "Standard history framework",
            description: "Core sections for a complete history.",
            items: ["PC", "HPC", "PMH", "DH", "FH", "SH", "ROS", "Impact", "Ideas", "Concerns", "Expectations", "Summarization"].map((name) => ({
              conceptId: name.toLowerCase().replaceAll(" ", "_"),
              heading: name,
              explanation: name,
              exampleQuestions: [],
            })),
          },
          {
            id: "communication",
            title: "Communication skills",
            description: "Consultation behaviors assessed across histories.",
            items: ["rapport", "open_question", "active_listening", "responds_to_emotion", "plain_language", "signposting", "sensitive_history_permission", "summarization", "checking_understanding", "closure"].map((conceptId) => ({
              conceptId,
              heading: conceptId.replaceAll("_", " "),
              explanation: conceptId === "sensitive_history_permission"
                ? "Signpost sensitive questions and ask permission before proceeding."
                : "Reusable communication concept.",
              exampleQuestions: conceptId === "sensitive_history_permission"
                ? ["I'm going to ask you some questions that some people find sensitive, but they are important given the symptoms you've described. Is that okay?"]
                : [],
            })),
          },
        ],
        frameworks: [
          {
            name: "SOCRATES",
            acronym: "SOCRATES",
            items: [
              "S - Site: Where exactly is the pain?",
              "O - Onset: When did it start? Suddenly or gradually?",
              "C - Character: What does it feel like?",
              "R - Radiation: Does it spread anywhere?",
              "A - Associated symptoms: Anything else with the pain?",
              "T - Timing: How long does it last? Is it constant or does it come and go?",
              "E - Exacerbating / Relieving: What makes it worse? What makes it better?",
              "S - Severity: How severe is it?",
            ],
          },
          {
            name: "HOSE PIPERS",
            acronym: "HOSE PIPERS",
            items: [
              "H - Home: Home situation, stairs, who lives with patient.",
              "O - Occupation: Job and relevant occupational exposures.",
              "S - Smoking: Smoking amount/duration.",
              "E - Ethanol: Alcohol history.",
              "P - Psychological: Mood and sleep.",
              "I - Independence: Activities of daily living and carers.",
              "P - Pets: Relevant animal exposure.",
              "E - Expeditions: Travel history.",
              "R - Recreational drugs: Ask sensitively.",
              "S - Sexual history: Ask sensitively and when relevant.",
            ],
          },
          {
            name: "MJTHREADS",
            acronym: "MJTHREADS",
            items: [
              "M - Myocardial infarction",
              "J - Jaundice",
              "T - Tuberculosis",
              "H - Hypertension / high cholesterol",
              "R - Rheumatic fever",
              "E - Epilepsy",
              "A - Asthma / angina",
              "D - Diabetes",
              "S - Stroke",
            ],
          },
        ],
        redFlags: [],
        differentials: [],
        commonMistakes: [],
        sourceReferences: ["Seeded from PHMS History Taking prompt."],
        status: "published",
        version: 1,
        createdBy: "seed",
        publishedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  const breathlessnessGuide = await HistoryGuide.findOneAndUpdate(
    { slug: "breathlessness-one-resps" },
    {
      $set: {
        title: "Breathlessness History Guide",
        slug: "breathlessness-one-resps",
        type: "presenting-complaint",
        specialtyId: respiratory._id,
        presentingComplaint: "Breathlessness",
        overview: "Breathlessness-focused history using ONE RESPS and standard respiratory review.",
        sections: [
          {
            id: "one_resps",
            title: "ONE RESPS",
            description: "Focused breathlessness history framework.",
            items: [
              { conceptId: "onset", heading: "O - Onset", explanation: "When did it start? Always there or does it come and go?", exampleQuestions: ["When did it start?", "Is it always there or does it come and go?"] },
              { conceptId: "nature", heading: "N - Nature", explanation: "Clarify the patient's description of breathlessness.", exampleQuestions: ["Can you describe the breathing problem?"] },
              { conceptId: "exercise_tolerance", heading: "E - Exercise tolerance", explanation: "Baseline and current exercise capacity.", exampleQuestions: ["How far can you walk now compared with before?"] },
              { conceptId: "rate", heading: "R - Rate/progression", explanation: "Progression over time.", exampleQuestions: ["Is it becoming more frequent or severe?"] },
              { conceptId: "exacerbating_relieving", heading: "E - Exacerbating/relieving", explanation: "Triggers and relieving factors.", exampleQuestions: ["What makes it worse?", "What helps?"] },
              { conceptId: "severity", heading: "S - Severity", explanation: "Functional severity and acute danger.", exampleQuestions: ["Have you needed emergency treatment?"] },
              { conceptId: "pattern", heading: "P - Pattern", explanation: "Timing, nocturnal symptoms, episodic or persistent pattern.", exampleQuestions: ["Does it wake you at night?"] },
              { conceptId: "symptoms", heading: "S - Symptoms", explanation: "Associated cough, wheeze, sputum, chest pain, haemoptysis.", exampleQuestions: ["Any cough or wheeze?"] },
            ],
          },
          {
            id: "ros",
            title: "Review of systems",
            description: "Reusable systems review prompts.",
            items: [
              "Constitutional: weight loss, night sweats, rashes, lumps",
              "Cardiovascular: chest pain, palpitations, leg swelling",
              "Respiratory: breathlessness, cough, sputum, haemoptysis",
              "Neurological: headache, seizures/fits, weakness, numbness",
              "Gastrointestinal: appetite, vomiting, abdominal pain, bowel changes",
              "Endocrine: menstrual history, hair changes, heat/cold intolerance",
              "Genitourinary: frequency, dysuria, haematuria",
              "Musculoskeletal: joint pain, muscle pain, bone pain",
            ].map((text, index) => ({
              conceptId: `ros_${index + 1}`,
              heading: text.split(":")[0],
              explanation: text,
              exampleQuestions: [],
            })),
          },
        ],
        frameworks: [
          {
            name: "ONE RESPS",
            acronym: "ONE RESPS",
            items: ["Onset", "Nature", "Exercise tolerance", "Rate/progression", "Exacerbating/relieving", "Severity", "Pattern", "Symptoms"],
          },
        ],
        status: "published",
        version: 1,
        createdBy: "seed",
        publishedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  const patientScript = await PatientScript.findOneAndUpdate(
    { slug: "maya-khan-breathlessness-asthma" },
    {
      $set: {
        name: "Maya Khan - Breathlessness",
        slug: "maya-khan-breathlessness-asthma",
        patientIdentity: {
          name: "Maya Khan",
          age: 19,
          sex: "female",
          occupation: "university student",
          pronouns: "she/her",
        },
        baselineState: {
          generalAppearance: "Comfortable at rest",
          currentDistress: "Mildly anxious about recurrent breathlessness",
          communicationAbility: "Able to speak in full sentences",
        },
        openingStatement: "I've been getting episodes where I feel short of breath and wheezy.",
        demeanor: {
          general: "polite and cooperative",
          anxietyLevel: "mild",
          cooperation: "good",
          verbosity: "answers what is asked without volunteering hidden details",
          healthLiteracy: "basic",
        },
        facts: [
          fact("asthma_opening", "PC", "presenting_complaint", "Presenting complaint", "Episodes of breathlessness and wheeze", "I've been getting episodes where I feel short of breath and wheezy.", "OPENING", ["main problem", "presenting complaint"]),
          fact("asthma_duration", "HPC", "duration", "Duration", "Four months", "About four months.", "IF_RELEVANT_QUESTION", ["how long", "duration", "when started", "onset"]),
          fact("asthma_pattern", "HPC", "pattern", "Pattern", "Comes and goes three or four times a week; normal between episodes", "It comes and goes, maybe three or four times a week, and I feel normal between episodes.", "IF_RELEVANT_QUESTION", ["all the time", "constant", "frequency", "come and go"]),
          fact("asthma_nocturnal_symptoms", "HPC", "nocturnal_symptoms", "Nocturnal symptoms", "Often worse at night or early morning", "It's often worse at night or early in the morning.", "IF_RELEVANT_QUESTION", ["night", "sleep", "wake", "early morning"]),
          fact("asthma_triggers", "HPC", "triggers", "Triggers", "Exercise, cold air, dust, and spring pollen can trigger symptoms", "Exercise, cold air, dust, and spring pollen seem to bring it on.", "IF_RELEVANT_QUESTION", ["trigger", "exercise", "cold", "dust", "pollen", "season"]),
          fact("asthma_previous_severity", "HPC", "previous_severity", "Previous severity", "No emergency attendance, admission, ICU, or intubation", "No, I've never needed emergency treatment, admission, ICU, or a breathing tube for it.", "IF_RELEVANT_QUESTION", ["hospital", "emergency", "admission", "icu", "intubation", "breathing tube"]),
          fact("asthma_atopy", "PMH", "atopy", "Atopy", "Has hay fever and mild eczema", "I get hay fever, and I had mild eczema when I was younger.", "IF_RELEVANT_QUESTION", ["eczema", "hay fever", "allergy", "atopy"]),
          fact("asthma_family_history", "FH", "family_history", "Family history", "Mother has asthma", "My mother has asthma.", "IF_RELEVANT_QUESTION", ["family", "mother", "parents", "asthma in family"]),
          fact("asthma_vaping", "SH", "smoking", "Smoking and vaping", "No cigarettes; vapes socially", "I don't smoke cigarettes, but I do vape socially sometimes.", "IF_RELEVANT_QUESTION", ["smoking", "smoke", "cigarette", "vape", "vaping"]),
          fact("asthma_medication", "DH", "medication", "Medication", "Uses a friend's blue inhaler occasionally with relief", "I've used a friend's blue inhaler a couple of times and it helped, but I haven't been prescribed one.", "IF_RELEVANT_QUESTION", ["medicine", "medication", "inhaler", "drug", "treatment"]),
          fact("asthma_impact", "ICE", "impact", "Impact", "Avoiding sports and worried about exams", "I've stopped playing sports as much, and I'm worried it will affect my exams.", "IF_RELEVANT_QUESTION", ["impact", "affect", "sports", "school", "exam"]),
          fact("asthma_pets_unknown", "SH", "pets", "Pets", "No authored pet exposure", "I don't keep any pets at home.", "IF_RELEVANT_QUESTION", ["pets", "cat", "dog", "birds"]),
        ],
        emotionalCues: [
          { cueId: "anxiety_about_breathing", condition: "Asked about concerns", response: "I'm worried it might become serious when I'm away from home." },
        ],
        patientQuestions: [
          { trigger: "closure", question: "Do you think this could be asthma?" },
        ],
        expectedPatientAttitude: "Cooperative but does not volunteer unasked clinical details.",
        unknownFactPolicy: "If asked about non-authored clinically meaningful details, say you are not sure or have not noticed. Do not invent exposures.",
        sourceReferences: ["Seeded Maya asthma history case."],
        status: "published",
        version: 1,
      },
    },
    { upsert: true, new: true },
  );

  const checklist = await SmartChecklist.findOneAndUpdate(
    { slug: "asthma-breathlessness-eight-item-checklist" },
    {
      $set: {
        title: "Asthma Breathlessness History Checklist",
        slug: "asthma-breathlessness-eight-item-checklist",
        sourceScoring: { maxRawScore: 8, description: "8 one-mark checklist rows" },
        weightConfiguration: { critical: 3, major: 2, minor: 1 },
        sections: [
          {
            sectionId: "hpc",
            title: "History of presenting complaint",
            items: [
              item("duration", "Clarifies duration/onset", ["duration"], ["asthma_duration"], "major", "Ask when symptoms started."),
              item("pattern", "Clarifies episodic pattern and frequency", ["pattern"], ["asthma_pattern"], "major", "Do not assume breathlessness is constant."),
              item("nocturnal", "Explores night waking/early morning symptoms", ["nocturnal_symptoms"], ["asthma_nocturnal_symptoms"], "critical", "Night symptoms are important asthma-control history."),
              item("triggers", "Explores relevant triggers", ["triggers"], ["asthma_triggers"], "major", "Explore specific trigger domains rather than only asking 'any triggers?'."),
              item("previous_severity", "Assesses previous emergency attendance/admission/ICU/intubation", ["previous_severity"], ["asthma_previous_severity"], "critical", "Assess dangerous previous exacerbations."),
            ],
          },
          {
            sectionId: "background",
            title: "Background history",
            items: [
              item("atopy", "Asks about atopy/allergies", ["atopy"], ["asthma_atopy"], "minor", "Ask about hay fever, eczema, and allergy history."),
              item("family_history", "Asks about family history of asthma/atopy", ["family_history"], ["asthma_family_history"], "minor", "Family history supports atopic/asthma pattern."),
              item("smoking_vaping", "Asks smoking and vaping sensitively", ["smoking"], ["asthma_vaping"], "major", "Ask about vaping as well as cigarettes."),
            ],
          },
        ],
        version: 1,
        status: "published",
      },
    },
    { upsert: true, new: true },
  );

  const module = await HistoryModule.findOneAndUpdate(
    { slug: "breathlessness-young-adult-asthma" },
    {
      $set: {
        title: "Breathlessness in a Young Adult",
        slug: "breathlessness-young-adult-asthma",
        specialtyId: respiratory._id,
        presentingComplaint: "Breathlessness",
        systemOrTopic: "Asthma",
        stationType: "history",
        taskTags: ["history", "respiratory", "diagnostic-planning"],
        difficulty: "beginner",
        timeLimitSeconds: 480,
        shortDescription: "Take a focused respiratory history from a young adult with episodic breathlessness and wheeze.",
        candidateInstructions: {
          context: "You are a medical student in a GP clinic.",
          patientSummary: "Maya Khan is a 19-year-old university student presenting with recurrent breathlessness.",
          tasks: [
            "Take a focused history of her breathlessness.",
            "Explore relevant respiratory symptoms, risk factors, and impact.",
            "Summarize your findings and explain your next steps.",
          ],
          examinationRequired: false,
          additionalInstructions: ["You do not need to perform a physical examination."],
        },
        historyGuideId: breathlessnessGuide._id,
        patientScriptId: patientScript._id,
        smartChecklistId: checklist._id,
        examinerInstructions: "Assess respiratory history structure, asthma control features, red flags, and communication.",
        keyAnswerGuide: "Episodic breathlessness/wheeze for four months, nocturnal/early morning symptoms, triggers, no severe previous admissions, atopy, family history, and social vaping.",
        suggestedCandidateApproach: ["Open question", "ONE RESPS", "Past medical and drug history", "Family and social history", "ICE and impact", "Summarize"],
        learningNotes: "Consider asthma in a young patient with episodic wheeze, nocturnal symptoms, and trigger-related breathlessness.",
        commonMistakes: ["Not asking about night waking", "Not asking about vaping", "Assuming trigger history is complete after one vague question"],
        keyDifferentials: ["Asthma", "Anxiety/panic episodes", "Vocal cord dysfunction", "Anaemia"],
        vivaQuestions: [
          { question: "What features support asthma in this history?", modelAnswerOutline: "Episodic wheeze/breathlessness, nocturnal symptoms, triggers, atopy and family history." },
          { question: "What severity features must be explored?", modelAnswerOutline: "Emergency attendance, admissions, ICU/intubation, current functional limitation and reliever use." },
        ],
        sourceReferences: ["Seeded PHMS respiratory history case."],
        status: "published",
        version: 1,
        createdBy: "seed",
        reviewedBy: "seed",
        publishedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );

  const respiratoryPdfHistoryModules = await seedRespiratoryPdfHistoryStations({ respiratory, breathlessnessGuide });

  return { respiratory, universalGuide, breathlessnessGuide, patientScript, checklist, module, respiratoryPdfHistoryModules };
}

function fact(factId, section, conceptId, label, value, naturalResponse, revealPolicy, synonyms = []) {
  return {
    factId,
    section,
    conceptId,
    label,
    value,
    naturalResponse,
    revealPolicy,
    triggerConcepts: [conceptId],
    synonyms,
    relatedChecklistItemIds: [],
  };
}

function item(itemId, label, expectedConcepts, relatedFactIds, weightCategory, remediationText) {
  return {
    itemId,
    label,
    description: label,
    category: "history",
    expectedConcepts,
    relatedFactIds,
    weightCategory,
    maxRawScore: 1,
    allowPartial: true,
    criticalSafetyItem: weightCategory === "critical",
    commonMistake: "",
    remediationText,
    order: 1,
  };
}
