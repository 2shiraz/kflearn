import { readFileSync } from "node:fs";
import { OsceStation } from "../models/OsceStation.js";
import { PatientScript } from "../models/PatientScript.js";
import { SmartChecklist } from "../models/SmartChecklist.js";
import { Specialty } from "../models/Specialty.js";

const data = JSON.parse(readFileSync(new URL("./git15Stations.data.json", import.meta.url), "utf8"));
const aiNumbers = new Set([1, 2, 3, 4, 6, 7, 8, 9, 10, 13, 14]);
const types = ["counselling", "counselling", "history", "history", "examination", "history", "counselling", "history", "history", "counselling", "emergency", "emergency", "interpretation", "history", "examination"];
const identities = {
  1: { name: "Waqas Ilyas", age: 34, sex: "male" }, 2: { name: "Rizwan Sadiq", age: 41, sex: "male" },
  3: { name: "Sarmad Yousaf", sex: "male" }, 4: { name: "Rabia Hameed", age: 24, sex: "female" },
  5: { name: "Iftikhar Zaman", age: 52, sex: "male" }, 6: { name: "Kashif Rauf", sex: "male", occupation: "Restaurant chef" },
  7: { name: "Samina Toqeer", age: 48, sex: "female" }, 8: { name: "Adeel Farooq", age: 38, sex: "male" },
  9: { name: "Kiran Abbasi", age: 27, sex: "female" }, 10: { name: "Naseem Akhtar", age: 55, sex: "female" },
  11: { name: "Bilal Sarwar", age: 54, sex: "male" }, 12: { name: "Yasir Chaudhry", age: 45, sex: "male" },
  13: { name: "Farah Naveed", age: 46, sex: "female" }, 14: { name: "Amna Riasat", age: 29, sex: "female" },
  15: { name: "Danish Iqbal", age: 22, sex: "male" },
};

// One patient response for each script cue after the opening; all unprovided
// findings remain unknown, rather than being invented to fill a history template.
const responses = {
  1: ["I haven't had yellow eyes, a swollen tummy, confusion or unexpected weight loss. I've never knowingly used injected drugs or had tattoos. I had unprotected sex with more than one partner in the past and haven't had the hepatitis B vaccine. I'm married, but don't know my wife's hepatitis B status.", "I'm scared of infecting my wife and future children. Does this mean my liver is already failing? Can it be cured?"],
  2: ["I had a blood transfusion during an operation many years ago. I haven't used injected drugs. I'm a little tired but haven't had yellow eyes or a swollen tummy. I don't know of anyone else in my family with this.", "I thought this would be incurable for life, like what I've heard about hepatitis B. Will I need injections forever? Could I infect my family?"],
  3: ["Spicy or fatty food and coffee make it worse, and sometimes acid or food comes back into my mouth. I haven't had trouble swallowing, black stools or unexpected weight loss. I occasionally take ibuprofen for headaches.", "Sometimes the pain starts soon after eating, and sometimes a couple of hours later.", "My friend was diagnosed with stomach cancer, so I'm worried I have that too. I'd like a quick fix without taking tablets long-term."],
  4: ["The pain improves after I open my bowels and I get a lot of bloating. I haven't seen blood, lost weight unexpectedly or had diarrhoea waking me at night. My periods are heavy and painful, and my mother was always an anxious person.", "Wheat doesn't make things particularly worse beyond my general food sensitivity. I haven't had vaginal discharge, pain during sex or unusual trouble with heat or cold.", "I'm frustrated when people say it's just stress. Could something have been missed? Will this ever go away?"],
  6: ["The stools are watery without blood or mucus. I have a mild tummy ache, thirst and a dry mouth, and I'm tired and a little dizzy when I stand. A family member travelling with me has the same illness. I work as a restaurant chef.", "I haven't seen blood or had a high fever or severe tummy pain. I'm still passing some urine.", "Can I have a strong antibiotic to fix it quickly? I'm worried about missing work."],
  7: ["Several relatives who ate the same barbecued meat are ill too. I've passed six to eight watery stools since last night, without blood or a high fever. I'm weak and a little dizzy when I stand.", "I still hoped there was something strong you could give me. Can you explain why an antibiotic wouldn't help?", "I need to recover for my meeting tomorrow. I thought an antibiotic was the strongest treatment for a bacterial illness."],
  8: ["Some stools are pale and greasy and difficult to flush. My knees have been aching a little. I don't currently have red or painful eyes or a rash. I've never had gallbladder surgery and don't know of diabetes or thyroid disease. I'm not sure about the family history.", "I haven't seen blood or had a fever, but some nights I wake needing to open my bowels.", "I'm worried there's something serious in my bowel. I'd like a clear plan rather than just waiting and seeing."],
  9: ["Most stools contain blood and mucus, with cramps low in my tummy. I've had a low fever and feel tired. I haven't had mouth ulcers, pain or discharge around my bottom, and don't smoke. I don't know of bowel disease in my family.", "My knees ache a little, but I haven't had red or painful eyes or skin nodules.", "I'm frightened it could be cancer. Can you tell me exactly which disease I have today?"],
  10: ["My grandson first looked yellow on day three, not the first day. He's breastfeeding well and alert, with normal-coloured stools and no dark urine. He hasn't had a fever or seizures. His mother is Rhesus-negative, received anti-D and tested negative for hepatitis B.", "I'm worried about his liver. Should his mother stop breastfeeding? What should we watch out for?"],
  13: ["My stools have been pale for about a week, with a mild ache under my right ribs. I haven't had a fever, don't know of excessive alcohol use, and haven't recently started medicines, herbs or supplements. I'm not sure about a change in weight.", "I'm worried this is liver cancer. Why am I so itchy, and what happens next?"],
  14: ["I have loose stools most days and have lost some weight without trying. My sibling has a bowel problem that needed a special diet, but I don't know its exact diagnosis. I still eat bread and wheat products.", "I read online that cutting out gluten might help. Should I start today?", "I'm worried something is wrong with my gut long-term. I want a quick fix and was tempted to start a gluten-free diet immediately."],
};
const handoutResponses = {
  1: ["My HBsAg and HBeAg tests are positive, anti-HBc IgM is negative and liver tests are mildly raised. I don't have exact numbers or repeat six-month testing yet.", "I feel well without yellow eyes, fluid in my tummy or confusion. It was found when I donated blood."],
  2: ["I had a transfusion during surgery years ago and only mild tiredness now. I have no known cirrhosis or current yellow eyes.", "The antibody and HCV RNA tests are positive, and liver tests are mildly raised. I haven't been given exact values."],
  3: ["I've had this for several weeks: burning high in my tummy, bloating, wind, nausea and occasional vomiting. I haven't reported weight loss, black stools or persistent vomiting. No mass has been reported in the information supplied.", "I smoke, drink alcohol regularly and like coffee, chocolate and spicy food. I sometimes take over-the-counter ibuprofen for headaches."],
  4: ["It's been five years. The pain improves after opening my bowels, with bloating, looser stools, straining, incomplete emptying and mucus. Eating makes it worse.", "I haven't had bloody stools, diarrhoea waking me at night, fever or unexpected weight loss. My mother was anxious and my periods are heavy and painful."],
  6: ["For two days I've passed three to four watery stools a day, vomited and felt weak. There's no blood or mucus, and someone travelling with me is ill too.", "I'm thirsty with a dry mouth but alert and able to drink. No fever has been documented."],
  7: ["It started within one to six hours of eating the barbecued meat. Other relatives who ate it are ill too.", "I've had six to eight watery stools a day, vomiting and weakness, without bloody stools or a high fever."],
  8: ["It's been three months, with loose stools most days. Some are pale, smell foul and are hard to flush. My joints ache a little and I haven't had a fever.", "I haven't had gallbladder surgery or known diabetes or thyroid disease. I don't know the family history."],
  9: ["For several weeks I've had bloody stools with mucus, cramps low in my tummy, low fever, tiredness and unexpected weight loss.", "I haven't had surgery and don't smoke. I don't know of bowel disease in my family."],
  10: ["He was born at term after an uneventful pregnancy and normal vaginal delivery. The yellow colour started on day three; he is six days old now.", "His bilirubin was raised on day three and falling on day six, but I don't have the actual levels. His mother is Rhesus-negative and he is positive; anti-D was given. She is hepatitis B negative. He's breastfeeding well, otherwise well, and passing normal-coloured urine and stools."],
  13: ["The bilirubin is raised, and alkaline phosphatase and gamma-GT are more raised than ALT and AST. I don't have the actual values.", "My stools are pale, urine dark and skin itchy, with a mild ache under my right ribs. I haven't had a fever or recently started medicines, and don't know of excessive alcohol use."],
  14: ["For months I've been bloated, passing loose stools and feeling tired. Blood tests showed unexplained iron-deficiency anaemia. I've lost a little weight but haven't seen blood in my stool. My sibling has a similar bowel problem.", "I'm still eating a normal diet including gluten."],
};
const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Keep original text in the portable JSON. Correct the published teaching and
// rubric consistently instead of teaching conflicting clinical instructions.
function teachingCopy(original) {
  const station = structuredClone(original);
  const replace = (field, index, value) => { station[field][index] = value; };
  if (station.number === 1) {
    replace("keyAnswerGuide", 4, "Discuss reproductive planning: test and vaccinate his wife if susceptible and arrange maternal HBV screening in pregnancy. Paternal infection alone does not establish maternal infection. Follow the local infant vaccination schedule; if the mother is HBsAg-positive, the newborn needs hepatitis B vaccine and immunoglobulin promptly after birth under the approved prevention pathway.");
    station.sourceNote.push("Perinatal prevention depends on maternal infection status: https://www.cdc.gov/hepatitis-b/hcp/perinatal-provider-overview/");
  }
  if (station.number === 3) {
    replace("learningNotes", 0, "Learning note: Offer lifestyle advice alongside a four-week full-dose PPI trial or H. pylori test-and-treat. Allow a two-week PPI washout before breath or stool antigen testing; treat confirmed infection using the approved local eradication regimen. Assess alarm symptoms and arrange emergency care, suspected-cancer referral or endoscopy according to the symptom combination, age and local/NICE referral criteria, rather than assigning the same urgency to every symptom. Review ongoing NSAID use, persistent unexplained symptoms and cancer anxiety with shared decision-making.");
    replace("keyAnswerGuide", 1, "Screen dysphagia, weight loss, persistent vomiting, GI bleeding and a palpable mass. Act promptly on alarm symptoms, using the appropriate emergency or suspected-cancer/endoscopy pathway for the clinical presentation and age.");
    replace("keyAnswerGuide", 3, "Advise diet, weight management, smoking/alcohol reduction, earlier evening meals and raising the head of the bed alongside a four-week full-dose PPI trial or H. pylori test-and-treat.");
    replace("keyAnswerGuide", 4, "Explain H. pylori breath/stool testing with a two-week PPI washout and eradication if positive. Review persistent symptoms, alarm features and NSAID need; consider specialist assessment/endoscopy through the appropriate pathway. Address cancer anxiety without treating anxiety alone as an automatic endoscopy indication.");
    station.checklist[8].criterion = "Explains appropriate endoscopy/referral indications and urgency using clinical features, age and local criteria; reviews persistent symptoms and NSAID use and addresses cancer anxiety.";
    station.checklist[6].criterion = "Offers an appropriate four-week full-dose PPI trial or H. pylori test-and-treat pathway, including the testing washout when relevant.";
    replace("examinerInstructions", 1, "Accept lifestyle advice alongside a four-week PPI trial or H. pylori test-and-treat, with appropriate washout and clinically indicated referral/endoscopy. Prompted items score at most 1/2.");
    replace("suggestedApproach", 4, "Offer a PPI trial or H. pylori test-and-treat, explaining the testing washout and subsequent review.");
  }
  if (station.number === 6) {
    station.sourceNote.push("Adult supportive care and escalation: https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/ ; food-handler exclusion: https://www.cdc.gov/norovirus/communication-resources/facts-for-food-workers.html");
  }
  if (station.number === 4) {
    replace("learningNotes", 0, "Learning note: NICE CG61 considers IBS with abdominal pain/discomfort relieved by defecation OR associated with altered stool frequency/form, together with at least two supporting features: altered passage, bloating/distension, worsening after food or mucus. Assess cancer warning signs and inflammatory features. FBC, ESR/CRP and coeliac serology are appropriate initial tests when the presentation supports IBS; age alone is not an automatic colonoscopy indication. Match diet/lifestyle advice and antispasmodic, laxative or antimotility treatment to symptoms; consider low-dose tricyclics second-line and psychological treatment for refractory symptoms.");
    replace("examinerInstructions", 0, "Give the handout at the start. Require a positive diagnostic framework: pain relieved by defecation OR associated with altered stool frequency/form, plus at least two supporting features, and appropriate red-flag and differential screening.");
    replace("examinerInstructions", 1, "Accept FBC, ESR/CRP and coeliac serology for this reassuring presentation. Further testing depends on clinical warning signs, uncertainty and the applicable referral pathway, not a blanket age-40 threshold.");
    replace("keyAnswerGuide", 1, "Screen blood in stool, weight loss, fever, nocturnal symptoms, family cancer history and new/persistent bowel changes. Assess age in context using the appropriate cancer pathway, and consider coeliac, gynaecological and thyroid disease.");
    replace("keyAnswerGuide", 2, "Explain IBS as a positive diagnosis. Start with FBC, ESR/CRP and coeliac serology in this presentation; arrange further testing if clinically indicated rather than automatically based on age over 40.");
    station.checklist[2].criterion = "Screens blood in stool, weight loss, fever, nocturnal diarrhoea, family cancer history and new/persistent symptoms, considering age through the appropriate referral pathway.";
    station.criticalSafetyErrors[1] = "Over-investigates routinely without a clinical indication, or fails to investigate relevant warning signs.";
  }
  if (station.number === 7) {
    const hydration = "Assess vital signs, postural symptoms, urine output, clinical hydration and ability to retain oral fluids. Consider same-day assessment for ongoing vomiting and dizziness; use ORS when tolerated and IV fluids/admission when clinical dehydration, inability to drink or instability warrants it. Stool count alone does not determine dehydration severity or admission.";
    replace("keyAnswerGuide", 1, hydration);
    replace("examinerInstructions", 1, hydration);
    station.learningNotes[0] = station.learningNotes[0].replace("significant dehydration/high stool frequency such as this patient's", "clinically significant dehydration, instability or inability to tolerate oral fluids; stool frequency alone does not determine admission");
    station.checklist[3].criterion = "Recognises postural symptoms and ongoing losses, considers same-day clinical assessment, and bases IV fluids/admission on hydration, stability and oral tolerance rather than stool count alone.";
    station.criticalSafetyErrors[1] = "Fails to assess and escalate clinically significant dehydration or inability to retain oral fluids.";
  }
  if (station.number === 10) {
    const early = "For visible jaundice in the first 24 hours, measure serum bilirubin urgently within 2 hours and arrange urgent medical review as soon as possible and within 6 hours.";
    replace("learningNotes", 0, `Learning note: ${early} For visible jaundice after 24 hours, measure bilirubin within 6 hours. Obtain actual bilirubin levels and plot against gestational-age and age-in-hours treatment thresholds; a falling trend alone cannot establish that treatment is unnecessary. Phototherapy/exchange transfusion depend on thresholds and response. Continue breastfeeding with feeding support. An unwell baby, pale stools or dark urine needs prompt paediatric assessment; prolonged jaundice beyond 14 days in term infants or 21 days in preterm infants needs evaluation.`);
    replace("examinerInstructions", 0, "Give the handout at the start. Require exact onset, assessment of the baby, and actual bilirubin values plotted against treatment thresholds. The falling trend is encouraging but does not prove the baby is below threshold; exact values are not supplied.");
    replace("keyAnswerGuide", 0, `Establish onset on day 3, not in the first 24 hours. ${early}`);
    replace("keyAnswerGuide", 2, "The falling day-6 bilirubin trend is encouraging, but obtain actual day-3/day-6 measurements, gestational age and age in hours and compare with treatment thresholds before ruling out treatment.");
    station.keyAnswerGuide[4] = station.keyAnswerGuide[4].replace("always needs same-day assessment", "requires bilirubin measurement within 2 hours and medical review as soon as possible and within 6 hours");
    station.checklist[4].criterion = "Interprets the falling trend as encouraging but obtains actual bilirubin levels and checks treatment thresholds before concluding treatment is unnecessary.";
  }
  if (station.number === 11) {
    const treatment = "Arrange endoscopy immediately AFTER resuscitation if unstable, or within 24 hours otherwise. If variceal bleeding is suspected, give vasoactive treatment and antibiotic prophylaxis per the approved protocol. NICE CG141 does not recommend routine PPI before endoscopy for suspected non-variceal bleeding; give PPI after endoscopy when recent-haemorrhage stigmata warrant it.";
    replace("keyAnswerGuide", 3, treatment);
    station.learningNotes[0] = station.learningNotes[0].replace("and IV proton pump inhibitor therapy and correction of coagulopathy are considered per local protocol", "and coagulopathy is corrected as indicated. Do not routinely give PPI before endoscopy for suspected non-variceal bleeding; give it after endoscopy when haemorrhage stigmata warrant it");
    station.checklist[7].criterion = "Discusses vasoactive treatment and antibiotic prophylaxis for suspected variceal bleeding, and appropriate PPI timing rather than routine pre-endoscopy PPI for suspected non-variceal bleeding.";
  }
  if (station.number === 12) {
    for (const field of ["learningNotes", "examinerInstructions", "keyAnswerGuide"]) station[field] = station[field].map(line => line.replace(/aggressive IV fluid resuscitation|aggressive crystalloid fluid resuscitation|aggressive IV fluids/g, "prompt, individually titrated moderately aggressive isotonic IV hydration with frequent reassessment for perfusion and fluid overload").replace("early ERCP/cholecystectomy planning", "cholecystectomy planning; urgent ERCP is indicated for cholangitis or persistent biliary obstruction rather than routinely for every gallstone case"));
    station.checklist[2].criterion = "Starts prompt, individually titrated isotonic IV hydration with repeated assessment of perfusion, urine output and fluid overload.";
    station.sourceNote.push("Updated fluid strategy: ACG 2024 acute pancreatitis guideline highlights, https://webfiles.gi.org/links/journals/AJG-Clinical-Guidelines-Highlights-Acute-Pancreatitis-2024-FINAL.pdf");
  }
  if (station.number === 15) {
    replace("keyAnswerGuide", 2, "Interpret the findings as high suspicion for appendicitis and arrange prompt surgical assessment. Use risk assessment and imaging according to the surgical/local pathway; selected high-risk patients may proceed without CT, but a classic history is not a blanket reason to prohibit imaging.");
    station.checklist[7].criterion = "Recognises high clinical suspicion and the role of risk assessment and appropriate imaging through the surgical/local pathway, without delaying urgent referral.";
  }
  return station;
}

export function buildGit15StationBundles() {
  if (data.stations.length !== 15 || data.metadata.assessmentDesign.length !== 6) throw new Error("Incomplete GIT station data.");
  return data.stations.map((original, index) => {
    const station = teachingCopy(original);
    if (station.number !== index + 1 || station.time !== "8 minutes" || station.checklist.length !== 10) throw new Error(`Incomplete GIT station ${station.number}.`);
    const slug = `git-${String(station.number).padStart(2, "0")}-${slugify(station.title)}`;
    const interactive = aiNumbers.has(station.number);
    const opening = station.simulationScript[0].match(/[“"]([^”"]+)[”"]/)?.[1] || station.simulationScript[0];
    const makeFact = (value, response, label, section, factIndex, policy = "IF_RELEVANT_QUESTION") => ({
      factId: `${slug}-fact-${factIndex + 1}`, conceptId: slugify(label).replaceAll("-", "_"), section, label, value,
      naturalResponse: response, revealPolicy: policy, triggerConcepts: [], synonyms: [], relatedChecklistItemIds: [],
    });
    if (interactive && (responses[station.number].length !== station.simulationScript.length - 1 || handoutResponses[station.number].length !== station.candidateHandout.length)) throw new Error(`Incomplete GIT dialogue ${station.number}.`);
    const facts = interactive ? [
      makeFact(station.simulationScript[0], opening, "Opening concern", "PC", 0, "OPENING"),
      ...station.simulationScript.slice(1).map((line, i) => makeFact(line, responses[station.number][i], line.startsWith("ICE:") ? "Ideas, concerns and expectations" : `History and responses ${i + 1}`, line.startsWith("ICE:") ? "ICE" : "HPC", i + 1)),
      ...station.candidateHandout.map((line, i) => makeFact(line, handoutResponses[station.number][i], `Case information ${i + 1}`, "OTHER", station.simulationScript.length + i)),
    ] : station.simulationScript.map((line, i) => makeFact(line, line, `Simulation cue ${i + 1}`, "OTHER", i));
    const module = {
      title: station.title, slug, presentingComplaint: opening, systemOrTopic: station.primaryCompetency,
      stationType: types[index], stationFormat: station.format, practiceModes: interactive ? ["single-player", "virtual-patient"] : ["single-player"],
      taskTags: ["git-15", "gastroenterology", types[index]], difficulty: [11, 12, 15].includes(station.number) ? "advanced" : "intermediate",
      timeLimitSeconds: 480, shortDescription: station.candidateInstructions[0],
      candidateInstructions: { context: station.format, patientSummary: "", tasks: station.candidateInstructions, examinationRequired: ["examination", "emergency"].includes(types[index]), additionalInstructions: [station.time, station.analyticScore] },
      candidateHandout: station.candidateHandout, simulationScript: station.simulationScript,
      examinerInstructions: station.examinerInstructions.join("\n"), keyAnswerGuide: station.keyAnswerGuide.join("\n"),
      suggestedCandidateApproach: station.suggestedApproach, learningNotes: station.learningNotes.join("\n"), expectedCompetencies: station.expectedCompetencies,
      criticalSafetyErrors: station.criticalSafetyErrors, globalRatingOptions: station.globalRating,
      assessmentDesign: data.metadata.assessmentDesign, facultyNote: data.metadata.facultyNote, facultySourceNote: station.sourceNote,
      commonMistakes: [], keyDifferentials: [], vivaQuestions: station.promptQuestions.map(question => ({ question, modelAnswerOutline: "" })),
      sourceReferences: ["GIT_OSCE_15_Stations.pdf"], status: "published", version: 1, createdBy: "seed", reviewedBy: "seed", publishedAt: new Date("2026-10-03T00:00:00.000Z"),
    };
    const patientScript = {
      name: `${station.title} — simulation`, slug: `${slug}-script`, patientIdentity: identities[station.number],
      baselineState: { communicationAbility: station.number === 10 ? "Grandmother discussing her six-day-old grandson; she is the respondent, not the baby." : "Respond as the named patient when interactive." },
      openingStatement: opening, demeanor: { general: station.simulationScript[0], verbosity: "Only disclose supplied details relevant to the question." }, facts,
      emotionalCues: [], patientQuestions: [], expectedPatientAttitude: station.number === 10 ? "You are Naseem Akhtar, the grandmother. Speak about your grandson and his mother, never as the baby or as if the baby's symptoms are yours." : interactive ? "Respond naturally as this patient using only the supplied case facts." : "Simulator cues for guided practice; no AI patient session.",
      unknownFactPolicy: "Say you do not know if a detail is not supplied. Do not invent positives, negatives, examination findings, numeric test values, medicine doses or demographic details. Unreported is not the same as denied.",
      sourceReferences: module.sourceReferences, status: "published", version: 1,
    };
    const checklist = {
      title: `${station.title} — analytic checklist`, slug: `${slug}-checklist`, sourceScoring: { maxRawScore: 20, description: data.metadata.assessmentDesign.slice(0, 2).join(" ") },
      weightConfiguration: { critical: 1, major: 1, minor: 1 }, sections: [{ sectionId: `${slug}-analytic`, title: "Analytic checklist (20 points)", items: station.checklist.map(({ order, criterion }) => ({
        itemId: `${slug}-criterion-${order}`, label: criterion, description: criterion, category: types[index], expectedConcepts: [criterion], relatedFactIds: [], weightCategory: "major", maxRawScore: 2, allowPartial: true, criticalSafetyItem: false, remediationText: criterion, order,
      })) }], status: "published", version: 1,
    };
    return { source: station, module, patientScript, checklist };
  });
}

export async function seedGit15OsceStations() {
  const specialty = await Specialty.findOneAndUpdate({ slug: "gastroenterology" }, { $setOnInsert: { name: "Gastroenterology", slug: "gastroenterology", description: "Gastroenterology OSCE stations.", icon: "stethoscope", order: 4, active: true } }, { upsert: true, new: true, runValidators: true });
  const stations = [];
  for (const bundle of buildGit15StationBundles()) {
    const script = await PatientScript.findOneAndUpdate({ slug: bundle.patientScript.slug }, { $set: bundle.patientScript }, { upsert: true, new: true, runValidators: true });
    const checklist = await SmartChecklist.findOneAndUpdate({ slug: bundle.checklist.slug }, { $set: bundle.checklist }, { upsert: true, new: true, runValidators: true });
    stations.push(await OsceStation.findOneAndUpdate({ slug: bundle.module.slug }, { $set: { ...bundle.module, specialtyId: specialty._id, patientScriptId: script._id, smartChecklistId: checklist._id } }, { upsert: true, new: true, runValidators: true }));
  }
  return stations;
}
