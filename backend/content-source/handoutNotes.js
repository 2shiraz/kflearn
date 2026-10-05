// OSCE Station Handouts — a static revision collection for final-year MBBS
// students. Each handout follows the same repeating pattern: Introduction,
// Core Concepts, Clinical Features, Diagnosis, Management, Important
// Management Considerations, Key Takeaways. Pakistan-oriented edition.

export const aboutThisCollection = {
  title: "How to Use This Collection",
  subtitle: "47 consolidated OSCE station handouts",
  points: [
    "Each handout follows the same repeating pattern: Introduction, Core Concepts, Clinical Features, Diagnosis, Management, Important Management Considerations, Key Takeaways.",
    "This edition uses safe, Pakistan-appropriate principles and points to local protocols where precision varies.",
    "Drug doses are included only where an immediate, widely standardised OSCE action is important. Always follow the current local formulary, antimicrobial policy, National TB Control Programme, maternity protocol and emergency pathway.",
  ],
  disclaimer: "For supervised undergraduate learning and examination preparation. Not a substitute for local hospital protocols or senior clinical review.",
};

export const handouts = [
  // ───────────────────────── Cardiovascular ─────────────────────────
  {
    slug: "acute-chest-pain-assessment",
    title: "Acute Chest Pain Assessment",
    category: "Cardiovascular",
    summary: "Identifying a time-critical cause of chest pain through a focused history and early ECG.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Acute chest pain may be cardiac, respiratory, vascular, gastrointestinal, musculoskeletal or neurological. The OSCE priority is to identify a time-critical cause while taking a focused history." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Use site, onset, character, radiation, associated symptoms, timing, aggravating/relieving factors and severity.",
          "Life-threatening differentials include acute coronary syndrome, aortic dissection, pulmonary embolism, tension pneumothorax and pericarditis.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Cardiac: pressure or crushing pain, radiation, sweating, nausea or dyspnoea.",
          "Pulmonary/pleural: breathlessness, pleuritic pain, haemoptysis or recent immobility.",
          "Red flags: haemodynamic instability, syncope, neurological deficit, unequal pulses, hypoxaemia or severe ongoing pain.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess ABC, vital signs and oxygen saturation.",
          "Perform focused cardiovascular and respiratory examination.",
          "Obtain a 12-lead ECG promptly; add troponin and imaging according to the suspected cause.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Call for senior/emergency help if unstable.",
          "Give condition-specific first aid only after rapid assessment; do not delay transfer for a prolonged history.",
          "Use continuous monitoring and arrange urgent hospital evaluation for suspected acute coronary syndrome or another emergency.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not dismiss pain as indigestion or musculoskeletal until dangerous causes have been considered.",
          "Use local emergency pathways and document symptom onset/last known well precisely.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Start with stability, not a long differential.",
          "ECG and vital signs are early priorities.",
          "Safety-net all patients whose diagnosis remains uncertain.",
        ] }],
      },
    ],
  },
  {
    slug: "acute-myocardial-infarction-emergency-management",
    title: "Acute Myocardial Infarction: Emergency Management",
    category: "Cardiovascular",
    summary: "Rapid recognition, antiplatelet therapy when safe, and urgent reperfusion-pathway transfer.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Acute myocardial infarction is myocardial injury caused by acute ischaemia. Rapid recognition, antiplatelet therapy when safe and urgent reperfusion-pathway transfer can save myocardium and life." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Think acute coronary syndrome in persistent central pressure or crushing pain.",
          "Primary PCI is preferred where available; fibrinolysis is a protocol-led alternative when timely PCI is not possible.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Pain may radiate to the arm, neck, jaw or back.",
          "Sweating, nausea, vomiting, dyspnoea, syncope or a sense of impending doom may occur.",
          "Atypical presentations are common in older adults, women and people with diabetes.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess ABC, vital signs and cardiac rhythm.",
          "Record a 12-lead ECG within minutes and repeat if initially non-diagnostic.",
          "Send troponin and baseline blood tests without delaying transfer.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Activate the emergency/ACS pathway and arrange monitored transfer.",
          "Give chewable aspirin 300 mg if no allergy or active bleeding, according to protocol.",
          "Give oxygen only for hypoxaemia or respiratory distress; provide nitrates/analgesia only when appropriate and haemodynamically safe.",
          "Ensure rapid cardiology assessment for reperfusion.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not reassure on the basis of one normal ECG.",
          "Document exact onset time, contraindications and treatment given.",
          "Avoid implying that routine thrombolysis should be performed outside an equipped protocol.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Recognize, ECG, aspirin when safe, and transfer.",
          "Oxygen is not routine.",
          "Reperfusion decisions belong to the emergency cardiology pathway.",
        ] }],
      },
    ],
  },
  {
    slug: "angina-and-suspected-acute-coronary-syndrome",
    title: "Angina and Suspected Acute Coronary Syndrome",
    category: "Cardiovascular",
    summary: "Differentiating stable angina from ACS, and the essentials of secondary prevention.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Angina is transient myocardial ischaemia; pain at rest, crescendo symptoms or reduced effort tolerance may indicate acute coronary syndrome. The OSCE tests risk recognition as much as long-term prevention." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Stable angina is predictable with exertion and relieved by rest or nitrate.",
          "Rest pain, prolonged pain or rapidly worsening frequency/severity requires emergency assessment.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Central pressure/crushing discomfort may radiate to neck or left arm.",
          "Sweating, vomiting and breathlessness increase concern.",
          "Risk factors include smoking, hypertension, diabetes, dyslipidaemia and family history.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check pulse, blood pressure and cardiovascular findings.",
          "Obtain urgent ECG and troponin for suspected ACS.",
          "For stable symptoms, assess lipids, glucose/HbA1c, renal function and consider functional/anatomical testing through cardiology.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Treat suspected ACS as an emergency.",
          "For stable angina, teach sublingual GTN use and when to seek emergency help.",
          "Address smoking, diet, activity, blood pressure and diabetes.",
          "Use antiplatelet, high-intensity statin and anti-anginal medicines according to diagnosis, contraindications and local protocol; refer if uncontrolled.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Warn about nitrate-related dizziness and the dangerous interaction with PDE5 inhibitors.",
          "Replace UK driving rules with advice to follow the relevant Pakistani licensing authority and clinician guidance.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Differentiate stable symptoms from ACS.",
          "Explain correct GTN safety-netting.",
          "Secondary prevention is essential, not optional.",
        ] }],
      },
    ],
  },
  {
    slug: "post-myocardial-infarction-counselling",
    title: "Post-Myocardial Infarction Counselling",
    category: "Cardiovascular",
    summary: "Individualised recovery advice covering rehabilitation, activity, and psychosocial support.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Recovery after myocardial infarction includes cardiac rehabilitation, risk reduction, medicine adherence and psychosocial support. Advice should be individualized to ventricular function, symptoms, treatment and occupation." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Explain the event in plain language and check understanding.",
          "Cardiac rehabilitation combines graded exercise, education and risk-factor management.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Ask about recurrent chest pain, breathlessness, palpitations, syncope and exercise tolerance.",
          "Screen for low mood, anxiety and fear of activity.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Review discharge diagnosis, ECG/echo findings, revascularization and planned follow-up.",
          "Check blood pressure, lipids, glucose and medicine tolerance as scheduled.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Encourage gradual activity through cardiac rehabilitation.",
          "Discuss return to work, travel and driving individually rather than using rigid timelines.",
          "Sexual activity may resume when clinically stable and able to tolerate moderate exertion.",
          "Reinforce smoking cessation, healthy diet, weight management and adherence.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Never combine nitrates with sildenafil or another PDE5 inhibitor.",
          "New/rest chest pain, syncope or acute dyspnoea needs emergency assessment.",
          "Involve family with patient consent.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Rehabilitation is both physical and psychological.",
          "Avoid one-size-fits-all recovery dates.",
          "Nitrate–PDE5 inhibitor counselling is mandatory.",
        ] }],
      },
    ],
  },
  {
    slug: "counselling-on-medicines-after-myocardial-infarction",
    title: "Counselling on Medicines After Myocardial Infarction",
    category: "Cardiovascular",
    summary: "Explaining post-MI medicines, adverse-effect safety-netting, and why not to self-discontinue.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Post-MI medicines reduce recurrent ischaemic events and support ventricular function. Students should explain purpose, common adverse effects, monitoring and what not to stop abruptly." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Common groups include antiplatelet therapy, high-intensity statin, beta-blocker and ACE inhibitor/ARB when indicated.",
          "Short-acting nitrate treats angina symptoms but does not replace emergency review for persistent pain.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: ["Assess bleeding, dizziness, cough, bradycardia, muscle symptoms and adherence."] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check blood pressure, pulse, renal function/electrolytes and lipids as appropriate.",
          "Confirm the exact discharge regimen and intended antiplatelet duration.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Explain each medicine using generic names and a written schedule.",
          "For chest pain, sit down, use prescribed sublingual nitrate and follow the emergency plan if pain persists.",
          "Report black stool, major bleeding, severe muscle pain, fainting or facial/tongue swelling urgently.",
          "Do not change dual antiplatelet therapy without cardiology advice.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Aspirin maintenance and dual-antiplatelet duration vary by event and intervention.",
          "Avoid obsolete fixed regimens; follow the cardiology discharge plan.",
          "Nitrates and PDE5 inhibitors must not be combined.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Link each medicine to a purpose.",
          "Teach adverse-effect safety-netting.",
          "Never encourage self-discontinuation.",
        ] }],
      },
    ],
  },
  {
    slug: "hypertension",
    title: "Hypertension",
    category: "Cardiovascular",
    summary: "Confirming the diagnosis with accurate, repeated measurement, and treating overall risk.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Hypertension is usually asymptomatic but increases cardiovascular, renal, retinal and cerebrovascular risk. Diagnosis requires accurate, repeated measurement rather than a single elevated reading." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Distinguish primary hypertension from secondary causes suggested by young age, abrupt onset, resistant hypertension or characteristic symptoms.",
          "Total cardiovascular risk and comorbidity influence treatment.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Often no symptoms; headache alone is non-specific.",
          "Ask about end-organ symptoms, medicines, sleep apnoea, renal disease, endocrine symptoms and pregnancy possibility.",
          "Severe BP with acute neurological, cardiac, renal or retinal injury is an emergency.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Measure correctly with suitable cuff; repeat and use home/ambulatory monitoring where available.",
          "Assess urine protein, creatinine/electrolytes, glucose/HbA1c, lipids, ECG and fundi as indicated.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Reduce salt, stop tobacco, maintain healthy weight, exercise and improve diet.",
          "Choose an ACE inhibitor/ARB, calcium-channel blocker or thiazide-like diuretic according to age, pregnancy potential, kidney disease and other indications.",
          "Titrate and combine medicines stepwise; review adherence before labelling resistant hypertension.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "ACE inhibitors/ARBs are contraindicated in pregnancy and require renal/potassium monitoring.",
          "Discuss sexual adverse effects sensitively and offer alternatives rather than stopping therapy.",
          "Use locally adopted targets and protocols.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Confirm before diagnosing.",
          "Treat overall risk and end-organ damage.",
          "Adherence and follow-up are lifelong priorities.",
        ] }],
      },
    ],
  },
  {
    slug: "atrial-fibrillation-initial-management",
    title: "Atrial Fibrillation: Initial Management",
    category: "Cardiovascular",
    summary: "Stability first, then rate/rhythm strategy and stroke prevention.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Atrial fibrillation causes an irregular atrial rhythm and increases stroke and heart-failure risk. Management begins with haemodynamic stability, then rate/rhythm strategy and thromboembolism prevention." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Unstable AF requires urgent synchronized cardioversion.",
          "Stable AF needs symptom control, cause assessment and stroke/bleeding risk evaluation.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Palpitations, dyspnoea, fatigue, dizziness or chest discomfort.",
          "Pulse is irregularly irregular; some patients are asymptomatic.",
          "Red flags: hypotension, ongoing ischaemia, pulmonary oedema or syncope.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Confirm with 12-lead ECG.",
          "Check electrolytes, thyroid function, renal/liver function and echocardiography as indicated.",
          "Assess stroke and bleeding risk with an accepted tool.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "If unstable, resuscitate and cardiovert urgently.",
          "If stable, use beta-blocker or rate-limiting calcium-channel blocker when appropriate; rhythm control is individualized.",
          "Offer anticoagulation according to stroke risk: a DOAC is often preferred, except in mechanical valves or significant mitral stenosis where a vitamin K antagonist is used.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Digoxin is not routine first-line for active patients and needs careful selection.",
          "Cardioversion timing and anticoagulation require protocol-led assessment.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Stability comes first.",
          "ECG confirms the diagnosis.",
          "Stroke prevention is central to long-term care.",
        ] }],
      },
    ],
  },

  // ───────────────────────── Respiratory ─────────────────────────
  {
    slug: "asthma",
    title: "Asthma",
    category: "Respiratory",
    summary: "Inhaler technique, trigger review, and a written action plan.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Asthma is a variable inflammatory airway disorder causing episodic symptoms and variable airflow limitation. Good OSCE performance includes inhaler technique, trigger review and an action plan." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Symptoms vary over time and may worsen at night, with exercise, infection or exposure.",
          "Inhaled corticosteroid-containing treatment is central; SABA-only management is unsafe.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Wheeze, breathlessness, chest tightness and cough.",
          "Severe attack signs include inability to speak, exhaustion, silent chest, cyanosis, low oxygen saturation or reduced consciousness.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess respiratory rate, pulse, oxygen saturation, work of breathing and chest findings.",
          "Demonstrate peak flow: stand, reset, full inspiration, tight seal and one hard fast blow; record best of three.",
          "Confirm variable airflow limitation with spirometry/bronchodilator response or serial peak flow.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "During an attack, give inhaled rapid bronchodilator via spacer/nebulizer and oxygen to target saturation; add systemic steroid and urgent transfer according to severity.",
          "For maintenance, use an inhaled corticosteroid-containing regimen and step up/down after checking technique and adherence.",
          "Provide a written action plan and smoking/trigger advice.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Rinse mouth after inhaled corticosteroid.",
          "Check technique at every review.",
          "Hospital-level features or poor response need urgent escalation.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Recognize severity early.",
          "Controller treatment must contain inhaled corticosteroid.",
          "Technique and action planning are examinable skills.",
        ] }],
      },
    ],
  },
  {
    slug: "approach-to-breathlessness",
    title: "Approach to Breathlessness",
    category: "Respiratory",
    summary: "Classifying onset and checking stability to make the differential safer and faster.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Breathlessness is a symptom with respiratory, cardiac, metabolic, haematological and psychological causes. Classifying onset and checking stability makes the differential safer and faster." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Acute: asthma, pulmonary embolism, pneumothorax, pneumonia, pulmonary oedema, foreign body or metabolic acidosis.",
          "Chronic: COPD, heart failure, TB, anaemia, obesity, thyroid disease or deconditioning.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Ask onset, progression, exercise tolerance, orthopnoea/PND, wheeze, cough, fever, chest pain and haemoptysis.",
          "Red flags: hypoxaemia, exhaustion, hypotension, altered mental state, unilateral absent breath sounds or stridor.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess ABC and full vital signs.",
          "Focused respiratory and cardiovascular examination; look for anaemia, oedema and DVT signs.",
          "Select ECG, chest X-ray, blood count, glucose/ketones and other tests according to the differential.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Stabilize first: oxygen when hypoxaemic, monitoring, IV access and senior help.",
          "Treat the identified cause; do not label anxiety until organic emergencies are excluded.",
          "Escalate rapidly for severe or unexplained breathlessness.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Pregnancy, TB exposure, immobility and occupational exposure may change the differential.",
          "Safety-net if no firm diagnosis is reached.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Time course narrows the differential.",
          "Vital signs define urgency.",
          "Avoid premature reassurance.",
        ] }],
      },
    ],
  },
  {
    slug: "chronic-obstructive-pulmonary-disease",
    title: "Chronic Obstructive Pulmonary Disease",
    category: "Respiratory",
    summary: "Diagnosis, inhaler care, exacerbation recognition, and prevention.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "COPD causes persistent airflow obstruction, usually after tobacco or biomass exposure. The station integrates diagnosis, inhaler care, exacerbation recognition and prevention." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Consider COPD in adults with chronic dyspnoea, cough or sputum plus exposure.",
          "Grade functional limitation and ask about exacerbations.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Progressive exertional dyspnoea, chronic cough, sputum and wheeze.",
          "Red flags/alternatives: haemoptysis, weight loss, fever, clubbing, sudden pain or disproportionate hypoxaemia.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Confirm with post-bronchodilator spirometry when stable.",
          "Assess oxygen saturation, BMI, chest X-ray, blood count and eosinophils as indicated.",
          "Consider ECG/echo, alpha-1 antitrypsin testing or TB assessment when appropriate.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Stop tobacco/biomass exposure; offer vaccination, activity and pulmonary rehabilitation.",
          "Use short- and long-acting inhaled bronchodilators; add inhaled corticosteroid only for appropriate exacerbation/eosinophil profiles.",
          "Exacerbation: increase bronchodilation, consider short systemic steroid and antibiotics only when bacterial features/protocol indicate.",
          "Admit for severe respiratory distress, confusion, cyanosis, acidosis or poor home support.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Teach inhaler technique and a written exacerbation plan.",
          "Long-term oxygen requires formal assessment; do not prescribe from a single reading.",
          "Theophylline is not routine first-line therapy.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Spirometry confirms stable COPD.",
          "Smoking cessation and rehabilitation are core treatment.",
          "Recognize exacerbation severity and admit when needed.",
        ] }],
      },
    ],
  },
  {
    slug: "community-acquired-pneumonia",
    title: "Community-Acquired Pneumonia",
    category: "Respiratory",
    summary: "Severity assessment combining clinical judgement, oxygenation, and a validated score.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Community-acquired pneumonia is an acute infection of lung parenchyma. Severity assessment combines clinical judgement, oxygenation and a validated score such as CRB-65/CURB-65." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Typical organisms and resistance vary; antibiotic choice follows local policy.",
          "Scores support but do not replace clinical judgement.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Fever, cough, purulent or rusty sputum, pleuritic pain and dyspnoea.",
          "Confusion, respiratory rate at least 30/min, hypotension, hypoxaemia or sepsis suggest severe disease.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check full vital signs and oxygen saturation; examine for focal crackles/bronchial breathing.",
          "Chest X-ray and blood tests for admitted/uncertain cases; sputum/blood cultures when severe or treatment failure.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Give oxygen for hypoxaemia, fluids and antipyretic/analgesia as needed.",
          "Start empiric antibiotics promptly according to local CAP policy, allergy, pregnancy and resistance data.",
          "Admit if severe, hypoxaemic, unable to take oral therapy or socially unsafe; reassess if not improving within 48–72 hours.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Consider TB in persistent cough, weight loss, haemoptysis or epidemiological risk.",
          "Avoid routine broad-spectrum antibiotics for every mild case.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Assess severity before deciding location of care.",
          "Use local antibiotic guidance.",
          "Non-response requires review of diagnosis and complications.",
        ] }],
      },
    ],
  },
  {
    slug: "pulmonary-tuberculosis",
    title: "Pulmonary Tuberculosis",
    category: "Respiratory",
    summary: "Diagnosis, notification, contact assessment, and adherence support under the National TB Control Programme.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Tuberculosis is endemic in Pakistan and should be considered in prolonged respiratory or constitutional symptoms. Diagnosis, notification, contact assessment and adherence support should follow the National TB Control Programme." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Pulmonary TB spreads by airborne particles.",
          "Drug susceptibility and programme protocols determine the regimen.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Cough, fever, night sweats, weight loss, reduced appetite and haemoptysis.",
          "Look for severe respiratory compromise, massive haemoptysis or CNS symptoms.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Collect sputum for rapid molecular testing and microscopy/culture according to programme guidance.",
          "Chest X-ray supports assessment but does not confirm TB alone.",
          "Offer HIV testing with consent and evaluate contacts/comorbidities.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Use standard multidrug therapy under the TB programme; support adherence and monitor toxicity.",
          "Counsel cough hygiene, ventilation and household contact screening.",
          "Escalate for drug resistance, pregnancy, liver disease, severe illness or treatment failure.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Isoniazid may cause neuropathy; rifampicin discolours body fluids and has interactions; ethambutol can affect vision; pyrazinamide may cause hepatotoxicity/hyperuricaemia.",
          "Never use monotherapy for active TB.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Confirm bacteriologically whenever possible.",
          "Treat and register through the programme.",
          "Contact tracing and adherence are part of management.",
        ] }],
      },
    ],
  },
  {
    slug: "obstructive-sleep-apnoea",
    title: "Obstructive Sleep Apnoea",
    category: "Respiratory",
    summary: "Recurrent upper-airway collapse causing unrefreshing sleep and cardiovascular/road-safety risk.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Obstructive sleep apnoea causes recurrent upper-airway collapse during sleep. It produces unrefreshing sleep and important cardiovascular, occupational and road-safety risks." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Risk rises with obesity, craniofacial/upper-airway factors and sedatives.",
          "Use a validated screening tool; do not rely on one neck measurement.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Loud snoring, witnessed apnoeas, choking, morning headache and daytime sleepiness.",
          "Ask about near-misses, resistant hypertension and impaired concentration.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Record BMI, blood pressure and upper-airway features.",
          "Arrange sleep testing: home respiratory polygraphy or polysomnography according to availability and complexity.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Weight reduction, side sleeping and avoidance of alcohol/sedatives may help.",
          "CPAP is standard for clinically significant OSA; mandibular advancement devices suit selected patients.",
          "Refer for ENT/maxillofacial review when structural disease is suspected.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Advise against driving or hazardous work while dangerously sleepy; follow local licensing rules.",
          "Treat comorbid hypertension, diabetes and cardiovascular disease.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Witnessed apnoea plus sleepiness is a key clue.",
          "Sleep testing confirms severity.",
          "Address road and workplace safety explicitly.",
        ] }],
      },
    ],
  },

  // ───────────────────────── Endocrine & Metabolic ─────────────────────────
  {
    slug: "hypothyroidism",
    title: "Hypothyroidism",
    category: "Endocrine & Metabolic",
    summary: "Diagnosing deficient thyroid hormone action and titrating levothyroxine safely.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Hypothyroidism is deficient thyroid hormone action, commonly primary thyroid failure. It is usually diagnosed with thyroid function tests and treated with carefully titrated levothyroxine." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Primary hypothyroidism usually shows high TSH and low free T4.",
          "Older adults and patients with ischaemic heart disease need cautious initiation.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Fatigue, weight gain, cold intolerance, constipation, dry skin/hair, hoarse voice and low mood.",
          "Bradycardia, slow-relaxing reflexes and non-pitting oedema may occur.",
          "Myxoedema coma is an emergency.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Order TSH and free T4; consider thyroid antibodies, lipids, blood count and sodium when relevant.",
          "Review medicines and causes; assess pregnancy status.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Give levothyroxine once daily with consistent timing; separate from iron/calcium.",
          "Start low and titrate slowly in older/IHD patients.",
          "Recheck TSH after dose changes, then periodically when stable.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not use a beta-blocker to mask overtreatment; reduce/examine the levothyroxine dose.",
          "Pregnancy requires early specialist-led dose review.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Confirm biochemically.",
          "Start cautiously in IHD.",
          "Monitoring prevents under- and over-treatment.",
        ] }],
      },
    ],
  },
  {
    slug: "hyperthyroidism",
    title: "Hyperthyroidism",
    category: "Endocrine & Metabolic",
    summary: "Recognising thyrotoxicosis and counselling safely about antithyroid therapy.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Hyperthyroidism causes excess thyroid hormone action. Students should recognize thyrotoxicosis, identify Graves disease/other causes and counsel safely about antithyroid therapy." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Treatment options are antithyroid medicines, radioactive iodine or surgery.",
          "Symptom control and definitive therapy depend on cause, age, pregnancy and comorbidity.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Weight loss despite appetite, heat intolerance, tremor, palpitations, diarrhoea and anxiety.",
          "Tachycardia, goitre, lid signs and proximal weakness.",
          "Thyroid storm — fever, delirium and cardiovascular collapse — is an emergency.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "TSH is suppressed with raised free T4/T3.",
          "ECG for arrhythmia; antibodies and imaging as indicated to define cause.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Use a beta-blocker for symptoms if safe; a rate-limiting calcium-channel blocker may be used when contraindicated.",
          "Carbimazole/methimazole or PTU is selected according to pregnancy and specialist protocol.",
          "Definitive radioactive iodine or surgery requires specialist assessment.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Fever or sore throat on an antithyroid drug: stop it and obtain urgent clinical review/CBC for agranulocytosis.",
          "Radioactive iodine is contraindicated in pregnancy and breastfeeding.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Recognize thyroid storm.",
          "Antithyroid-drug safety counselling is essential.",
          "Definitive treatment is individualized.",
        ] }],
      },
    ],
  },
  {
    slug: "type-2-diabetes-mellitus",
    title: "Type 2 Diabetes Mellitus",
    category: "Endocrine & Metabolic",
    summary: "Diagnosis, cardiovascular-risk reduction, and screening for microvascular complications.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Type 2 diabetes is chronic hyperglycaemia from insulin resistance and relative insulin deficiency. Care combines diagnosis, cardiovascular-risk reduction and screening for microvascular complications." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Diagnosis uses locally adopted plasma glucose or HbA1c criteria; confirm an asymptomatic result.",
          "Targets and medicines are individualized.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Polyuria, polydipsia, weight loss, blurred vision and recurrent infection; many patients are asymptomatic.",
          "Acute illness, ketosis, dehydration or altered consciousness requires urgent assessment.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check HbA1c/glucose, renal function, urine albumin, lipids and blood pressure.",
          "Examine feet and arrange retinal screening; assess neuropathy, kidney disease and cardiovascular risk.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Support healthy diet, regular activity, weight management and tobacco cessation.",
          "Metformin is common first-line if suitable; add agents based on cardiovascular/renal benefit, hypoglycaemia risk, cost and local availability.",
          "Educate on sick-day rules, foot care and monitoring; review at regular intervals.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not copy UK driving rules; advise compliance with local authority and safe glucose management.",
          "Vaccination should follow Pakistan/local adult schedules and risk.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Diagnose accurately.",
          "Treat risk, not glucose alone.",
          "Foot, eye and kidney screening are core care.",
        ] }],
      },
    ],
  },
  {
    slug: "hypoglycaemia",
    title: "Hypoglycaemia",
    category: "Endocrine & Metabolic",
    summary: "Treating according to consciousness, then reviewing the cause to prevent recurrence.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Hypoglycaemia is a low glucose level that can cause neurological injury. Immediate treatment depends on consciousness and ability to swallow, followed by review of the cause." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Common causes: insulin/sulfonylurea, missed meal, exercise, alcohol, renal impairment or dosing error.",
          "Adrenergic symptoms may be masked by beta-blockers.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: ["Sweating, tremor, hunger, palpitations, dizziness, behaviour change, confusion, seizure or coma."] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check capillary glucose immediately, but treat first if strongly suspected and testing is delayed.",
          "Review timing of food, medicine, renal function and recurrence.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "If conscious and able to swallow: give 15–20 g fast-acting carbohydrate, recheck after 15 minutes and repeat if still low; then give a longer-acting snack/meal.",
          "If impaired consciousness: nothing by mouth; place safely, call for help and give glucagon or IV glucose per protocol.",
          "Observe longer and seek medical review after sulfonylurea-related events.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Teach family recognition and glucagon where prescribed; consider medical identification.",
          "After immediate carbohydrate treatment, review and adjust the causative regimen rather than relying on extra sugar to prevent recurrence.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Treat according to consciousness.",
          "Recheck glucose.",
          "Always prevent recurrence by finding the cause.",
        ] }],
      },
    ],
  },
  {
    slug: "diabetic-foot-assessment-and-care",
    title: "Diabetic Foot Assessment and Care",
    category: "Endocrine & Metabolic",
    summary: "A structured examination that identifies risk before ulceration and detects limb-threatening disease early.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Diabetic foot disease results from neuropathy, ischaemia, pressure and infection. A structured examination identifies risk before ulceration and detects limb-threatening disease early." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Inspect, palpate pulses, test sensation and assess footwear.",
          "Classify risk and arrange follow-up accordingly.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Dry cracked skin, callus, deformity, loss of hair, ulcer or colour change.",
          "Red flags: spreading erythema, pus, fever, gangrene, cold/pulseless foot, deep ulcer, crepitus or severe pain.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Inspect soles and between toes; palpate dorsalis pedis/posterior tibial pulses.",
          "Test protective sensation with a 10-g monofilament at standard plantar sites and vibration with a 128-Hz tuning fork; assess temperature, capillary refill and deformity.",
          "For ulcer: document size/depth, probe-to-bone when trained, infection and perfusion; order imaging/labs as indicated.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Urgently refer infected, ischaemic, gangrenous or deep ulcers to a multidisciplinary diabetic-foot/surgical team.",
          "Off-load pressure, debride where appropriate, optimize glucose and treat infection according to severity/local culture policy.",
          "Teach daily inspection, careful washing/drying, moisturising away from toe spaces and properly fitting shoes.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Never walk barefoot or use blades/chemicals on callus.",
          "Loss of pain does not mean the foot is safe.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Examine vascular and neurological status.",
          "Red flags need urgent referral.",
          "Prevention depends on daily self-inspection and footwear.",
        ] }],
      },
    ],
  },
  {
    slug: "gestational-diabetes-mellitus",
    title: "Gestational Diabetes Mellitus",
    category: "Endocrine & Metabolic",
    summary: "Hyperglycaemia first diagnosed in pregnancy, managed through a coordinated antenatal pathway.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Gestational diabetes is hyperglycaemia first diagnosed during pregnancy. It increases maternal and fetal risk but outcomes improve with coordinated antenatal care and glucose control." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Risk factors include previous GDM, macrosomic infant, obesity and family history.",
          "Screening timing and OGTT thresholds follow the locally adopted obstetric protocol.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Usually asymptomatic; polyuria or recurrent infection is non-specific.",
          "Assess for hypertension and fetal growth concerns.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Use a 75-g OGTT at the recommended gestation; screen earlier in high-risk women and repeat if needed.",
          "Do not diagnose from a single random value without protocol criteria.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Coordinate care with obstetrics/diabetes team.",
          "Use individualized nutrition, safe activity and self-monitoring.",
          "Start metformin or insulin when lifestyle measures do not achieve target, according to local maternity protocol.",
          "Plan fetal surveillance, timing of delivery and postpartum glucose reassessment.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid oral agents not established as safe in pregnancy.",
          "Counsel about future type 2 diabetes risk and long-term lifestyle follow-up.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Use pregnancy-specific criteria.",
          "Treat through a multidisciplinary pathway.",
          "Postpartum testing must not be forgotten.",
        ] }],
      },
    ],
  },

  // ───────────────────────── Gastrointestinal & Hepatobiliary ─────────────────────────
  {
    slug: "approach-to-viral-hepatitis",
    title: "Approach to Viral Hepatitis",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Matching transmission route to targeted serology, prevention, and referral.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Viral hepatitis ranges from acute self-limited illness to chronic liver disease. The station emphasizes transmission, targeted serology, prevention and referral rather than memorizing one drug list." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Hepatitis A and E are mainly faeco-oral; B and C spread through blood/body fluids.",
          "Hepatitis B is vaccine-preventable; hepatitis C is curable with direct-acting antivirals.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Fatigue, anorexia, nausea, right upper quadrant discomfort, dark urine and jaundice.",
          "Red flags: confusion, bleeding, hypoglycaemia, rapidly rising INR or severe vomiting.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check liver panel, bilirubin, INR and targeted viral markers.",
          "Use HBV DNA or HCV RNA to confirm active chronic infection when indicated.",
          "Ultrasound and fibrosis assessment support chronic disease staging.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Supportive care for uncomplicated acute A/E; admit suspected acute liver failure.",
          "Refer chronic B/C for staging and antiviral treatment under specialist/national programme guidance.",
          "Vaccinate for hepatitis B, ensure safe injections/blood and counsel household/sexual contacts as appropriate.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid alcohol and unnecessary hepatotoxic medicines.",
          "Pregnancy changes hepatitis E risk and HBV transmission-prevention planning.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Match tests to the virus.",
          "Recognize acute liver failure.",
          "Prevention and linkage to treatment are examinable.",
        ] }],
      },
    ],
  },
  {
    slug: "dyspepsia-and-gord",
    title: "Dyspepsia and Gastro-oesophageal Reflux Disease",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Identifying alarm features and using a rational test-and-treat approach.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Dyspepsia includes epigastric pain, early satiety or postprandial fullness; GORD commonly causes heartburn and regurgitation. The task is to identify alarm features and use a rational test-and-treat approach." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Consider ulcer disease, GORD, medicines and malignancy.",
          "H. pylori testing is useful when appropriate and requires correct timing around acid suppression/antibiotics.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Epigastric discomfort, heartburn, regurgitation, bloating and nausea.",
          "Alarm features: dysphagia, bleeding/anaemia, persistent vomiting, mass, jaundice or unintentional weight loss.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Perform abdominal examination and check for anaemia/jaundice.",
          "Test for H. pylori or arrange endoscopy according to age, alarm features, family history and local pathway.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Reduce trigger foods if personally relevant, stop tobacco, avoid late meals and address obesity.",
          "Offer a time-limited PPI trial; review response and step down when possible.",
          "Treat confirmed H. pylori using a locally recommended regimen based on resistance/allergy.",
          "Urgently refer alarm features or GI bleeding.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not assume chest burning is gastrointestinal until cardiac features are excluded.",
          "Long-term PPI need should be reviewed.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Ask for alarm features.",
          "Use H. pylori testing correctly.",
          "Review rather than continuing indefinite empirical therapy.",
        ] }],
      },
    ],
  },
  {
    slug: "irritable-bowel-syndrome",
    title: "Irritable Bowel Syndrome",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "A positive clinical diagnosis after checking alarm features and limited tests.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "IBS is a disorder of gut–brain interaction with abdominal pain related to defecation and altered stool pattern. A positive clinical diagnosis is appropriate after checking alarm features and limited tests." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Classify constipation-, diarrhoea- or mixed-predominant pattern.",
          'Stress can modify symptoms but IBS is not "imagined."',
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Recurrent abdominal pain, bloating and altered stool form/frequency.",
          "Red flags: bleeding, weight loss, nocturnal symptoms, fever, anaemia, mass or family history of bowel cancer/IBD.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Focused examination; FBC and coeliac serology are common initial tests, with CRP/other tests as indicated.",
          "Endoscopy is based on alarm features and age/risk, not an automatic age-40 rule.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Explain the diagnosis positively and agree realistic goals.",
          "Regular meals, activity, individualized fibre and a food/symptom diary may help; avoid excessively restrictive diets without dietetic support.",
          "Use soluble fibre for constipation, loperamide for diarrhoea and antispasmodic/peppermint oil for pain when suitable.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Reassess if the pattern changes or red flags develop.",
          "Psychological therapy is a valid option when symptoms persist and access allows.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Make a positive diagnosis after red-flag screening.",
          "Individualize diet and symptom therapy.",
          "Changing symptoms require reassessment.",
        ] }],
      },
    ],
  },
  {
    slug: "constipation",
    title: "Constipation",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Separating functional disease from medicine effects, metabolic causes, obstruction, and malignancy.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Constipation is reduced frequency, hard stool, straining or incomplete evacuation. Evaluation separates functional disease from medicine effects, metabolic causes, obstruction and malignancy." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Review diet, fluid, mobility, toileting and constipating medicines.",
          "Alarm features determine urgency.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Hard/infrequent stool, straining and incomplete emptying.",
          "Red flags: bleeding, weight loss, anaemia, vomiting/distension, mass, acute onset or family history of colorectal cancer.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Abdominal examination and rectal examination when indicated and consented.",
          "Use blood tests, colon evaluation or imaging according to alarm features and suspected cause.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Treat the cause; improve fibre gradually, fluids and activity where appropriate.",
          "Use bulk-forming, osmotic or stimulant laxatives according to stool type, comorbidity and response.",
          "For faecal impaction, use a specific disimpaction regimen and review precipitating factors.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid magnesium laxatives in significant renal impairment.",
          "Opioid users often need prophylactic laxatives.",
          "Persistent/new constipation with red flags needs referral, not repeated laxatives.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Look for medicines and alarm features.",
          "Match the laxative to the problem.",
          "Reassess failure rather than escalating indefinitely.",
        ] }],
      },
    ],
  },
  {
    slug: "acute-and-chronic-diarrhoea",
    title: "Acute and Chronic Diarrhoea",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Assessing dehydration and duration first, then the broader differential for persistent symptoms.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Diarrhoea is managed first by assessing dehydration and duration. Acute infection is common, while persistent symptoms require evaluation for inflammatory, malabsorptive, endocrine and medicine-related causes." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Acute is usually infectious; chronic/persistent disease has a broader differential.",
          "Stool frequency alone does not define severity — circulation and hydration matter.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Watery or bloody stool, abdominal pain, vomiting and fever.",
          "Red flags: shock, severe dehydration, blood, high fever, severe pain, immunocompromise or reduced urine output.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess vital signs, hydration and abdominal findings.",
          "Stool culture/PCR, ova/parasites, blood tests and coeliac/IBD work-up are selected by duration, travel, blood and severity.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Give ORS prepared exactly to the packet volume; continue feeding/breastfeeding.",
          "Use IV fluids for shock or inability to drink.",
          "Avoid routine antibiotics; select only for defined indications and local guidance.",
          "Treat the underlying cause in chronic diarrhoea.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid loperamide in dysentery, high fever, suspected C. difficile or toxic colitis.",
          "Use infection-control and safe-water advice.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Hydration assessment is first.",
          "Bloody diarrhoea changes management.",
          "Persistent symptoms need a cause, not repeated empirical antibiotics.",
        ] }],
      },
    ],
  },
  {
    slug: "travellers-diarrhoea-and-acute-gastroenteritis",
    title: "Traveller's Diarrhoea and Acute Gastroenteritis",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Correct oral rehydration, and avoiding unnecessary antimicrobials.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Traveller's diarrhoea and food-borne gastroenteritis usually improve with oral rehydration. Management must avoid unsafe ORS mixing and unnecessary antimicrobials." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Incubation, food/water exposure and blood/fever help narrow the cause.",
          "Most uncomplicated watery diarrhoea is self-limited.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Watery stool, cramps, nausea/vomiting and lethargy.",
          "Blood, high fever, shock, severe dehydration or persistent symptoms are red flags.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess hydration and travel/food/antibiotic exposure.",
          "Send stool studies for severe, bloody, prolonged or outbreak-associated illness.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Use ORS mixed with the exact water volume printed on the packet.",
          "Continue light food and breastfeeding; use antiemetic selectively.",
          "Reserve antibiotics for severe/invasive disease or specific indications using local resistance guidance.",
          "Admit if shock, severe dehydration or oral intake failure.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid loperamide in bloody diarrhoea or high fever.",
          "Hand hygiene, safe water and food practices prevent spread.",
          "Do not use ciprofloxacin automatically because resistance and contraindications vary.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Correct ORS preparation is critical.",
          "Most cases do not need antibiotics.",
          "Blood, fever or dehydration demands reassessment.",
        ] }],
      },
    ],
  },
  {
    slug: "ibd-ulcerative-colitis-vs-crohn-disease",
    title: "Inflammatory Bowel Disease: Ulcerative Colitis versus Crohn Disease",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Comparing distribution, depth, and complications between UC and Crohn disease.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Inflammatory bowel disease includes ulcerative colitis and Crohn disease. A comparison station tests distribution, depth, complications and the need for specialist confirmation." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Ulcerative colitis begins in the rectum and extends continuously through colon mucosa.",
          "Crohn disease may affect any GI segment with skip lesions and transmural inflammation.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "UC: bloody diarrhoea, urgency and tenesmus.",
          "Crohn: abdominal pain, diarrhoea, weight loss, perianal disease and obstruction/fistulae.",
          "Both may have extra-intestinal eye, skin, joint or hepatobiliary disease.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check blood count, CRP/ESR, albumin and stool infection/calprotectin where available.",
          "Colonoscopy with biopsies confirms diagnosis; imaging assesses small bowel/complications.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Refer to gastroenterology for induction and maintenance therapy.",
          "Acute severe colitis needs admission, IV therapy and surgical involvement.",
          "Avoid NSAIDs when possible; support vaccination, nutrition and cancer surveillance.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Smoking worsens Crohn disease; it must never be recommended as UC treatment.",
          "Toxic megacolon, perforation or severe bleeding are emergencies.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Distribution and depth distinguish the conditions.",
          "Exclude infection before escalation.",
          "Severe colitis needs hospital care.",
        ] }],
      },
    ],
  },
  {
    slug: "neonatal-jaundice",
    title: "Neonatal Jaundice",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Timing and bilirubin level determine urgency — first-day jaundice is pathological until proven otherwise.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Neonatal jaundice is common, but timing and bilirubin level determine urgency. Any jaundice in the first 24 hours is pathological until proven otherwise." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Assess gestational age, age in hours and feeding.",
          "Phototherapy/exchange thresholds use hour-specific nomograms and risk factors.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Yellow sclera/skin, poor feeding or sleepiness.",
          "Red flags: onset under 24 hours, pallor, fever, lethargy, high-pitched cry, dark urine/pale stool or rapidly deepening jaundice.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Measure serum/transcutaneous bilirubin; do not rely on visual assessment alone.",
          "Check blood group/DAT, haemoglobin/reticulocytes, infection and G6PD as indicated.",
          "Conjugated jaundice requires urgent evaluation.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Continue effective breastfeeding and provide lactation support.",
          "Use hospital phototherapy when the age-specific threshold is reached; exchange transfusion is specialist emergency treatment.",
          "Treat haemolysis, infection or another cause.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          'Do not recommend sunlight, arbitrary "UV sessions," or stopping breastfeeding as a diagnostic test.',
          "Kernicterus prevention depends on timely measurement and referral.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "First-day jaundice is urgent.",
          "Use age-in-hours bilirubin thresholds.",
          "Support feeding while treating the cause.",
        ] }],
      },
    ],
  },
  {
    slug: "gallstone-disease-biliary-colic-and-acute-cholecystitis",
    title: "Gallstone Disease: Biliary Colic and Acute Cholecystitis",
    category: "Gastrointestinal & Hepatobiliary",
    summary: "Fever, jaundice, and systemic illness determine urgency and complications.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Gallstones may cause transient biliary colic or persistent inflammation in acute cholecystitis. Fever, jaundice and systemic illness determine urgency and complications." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Biliary colic is episodic pain without systemic inflammation.",
          "Persistent RUQ pain, fever and Murphy sign suggest cholecystitis.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "RUQ/epigastric pain may radiate to right shoulder after fatty food.",
          "Jaundice/dark urine/pale stool suggests obstruction; fever plus jaundice raises concern for cholangitis.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Examine abdomen and vital signs.",
          "Ultrasound is first-line; check FBC, CRP, LFTs and lipase.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Use an NSAID for analgesia if safe; add antiemetic and fluids as needed.",
          "Admit suspected cholecystitis/cholangitis; give antibiotics only for infection according to local policy.",
          "Arrange surgical review for laparoscopic cholecystectomy; urgent biliary decompression may be needed in cholangitis.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid pethidine for analgesia, and reserve ciprofloxacin for culture-directed indications rather than routine use.",
          "Hypotension, confusion or sepsis needs immediate escalation.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Separate colic from inflammation.",
          "Ultrasound is the key initial test.",
          "Cholangitis is an emergency.",
        ] }],
      },
    ],
  },

  // ───────────────────────── Renal & Urology ─────────────────────────
  {
    slug: "acute-cystitis-in-a-young-woman",
    title: "Acute Cystitis in a Young Woman",
    category: "Renal & Urology",
    summary: "Considering pregnancy, pyelonephritis, and STI before routine treatment.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Acute cystitis causes lower urinary symptoms without systemic illness. Pregnancy, pyelonephritis and sexually transmitted infection must be considered before routine treatment." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Common symptoms are dysuria, frequency and urgency.",
          "Vaginal discharge/irritation makes an STI or vaginitis more likely.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Suprapubic discomfort and cloudy urine may occur.",
          "Fever, rigors, flank pain, vomiting or pregnancy requires broader assessment.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Urinalysis supports diagnosis; culture is important in pregnancy, recurrence, treatment failure or atypical/severe illness.",
          "Take a sexual history and STI tests sensitively when indicated.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Encourage normal hydration and simple analgesia.",
          "Use a short-course antibiotic selected by pregnancy status, renal function, allergy and local antibiogram.",
          "Refer/admit suspected pyelonephritis, sepsis or obstruction.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Post-coital voiding is low-risk advice; cranberry is optional prevention, not treatment.",
          "Do not assume symptoms prove partner infidelity.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Exclude upper UTI and pregnancy.",
          "Culture selected patients.",
          "Use local resistance guidance.",
        ] }],
      },
    ],
  },
  {
    slug: "benign-prostatic-hyperplasia",
    title: "Benign Prostatic Hyperplasia",
    category: "Renal & Urology",
    summary: "Quantifying bother, identifying complications, and excluding infection, neurological disease, and cancer.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "BPH commonly causes lower urinary tract symptoms in older men. Assessment should quantify bother, identify complications and exclude infection, neurological disease and prostate cancer." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Voiding symptoms: hesitancy, weak stream, intermittency and straining.",
          "Storage symptoms: frequency, urgency and nocturia.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Ask retention, haematuria, recurrent infection, back pain and weight loss.",
          "Red flags: palpable bladder, renal impairment, fever or neurological deficit.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Abdominal, neurological and consented digital rectal examination.",
          "Urinalysis, renal function and post-void residual where indicated.",
          "Discuss PSA limitations and shared decision; it is not diagnostic alone.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Reduce evening fluids/caffeine and review contributing medicines.",
          "Offer a selective alpha-blocker for bothersome symptoms; add 5-alpha-reductase inhibitor for appropriate enlarged prostate.",
          "Catheterize/refer urgently for retention; surgical options include TURP or alternatives.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Warn alpha-blockers can cause postural dizziness.",
          "Haematuria, recurrent infection, stones or renal damage need urological review.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Classify storage and voiding symptoms.",
          "PSA requires shared interpretation.",
          "Retention is an urgent complication.",
        ] }],
      },
    ],
  },
  {
    slug: "renal-colic",
    title: "Renal Colic",
    category: "Renal & Urology",
    summary: "Analgesia and identifying infected obstruction or threatened renal function as immediate priorities.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Renal colic is acute ureteric obstruction, usually by a stone. Analgesia and identification of infected obstruction or threatened renal function are immediate priorities." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Pain classically moves from loin to groin and the patient may be restless.",
          "Fever with obstruction is a urological emergency.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Severe colicky flank pain, nausea/vomiting and haematuria.",
          "Red flags: fever/sepsis, solitary kidney, anuria, pregnancy, uncontrolled pain or renal impairment.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Urinalysis, pregnancy test when relevant, renal function and blood count.",
          "Non-contrast CT KUB is highly sensitive; ultrasound is preferred in pregnancy/children and useful where CT is unavailable.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Give an NSAID first-line if safe; use alternative analgesia/antiemetic and fluids as needed.",
          "Do not force excessive fluids during acute obstruction.",
          "Urgently decompress infected obstruction; refer large/obstructing stones or failed conservative care.",
          "After recovery, advise normal high fluid intake and stone analysis/metabolic evaluation for recurrence.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid pethidine for analgesia.",
          "Antibiotics are not indicated without infection.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Treat pain promptly.",
          "Fever plus obstruction is an emergency.",
          "Imaging and follow-up prevent renal damage.",
        ] }],
      },
    ],
  },

  // ───────────────────────── Musculoskeletal & Rheumatology ─────────────────────────
  {
    slug: "approach-to-common-joint-pain",
    title: "Approach to Common Joint Pain",
    category: "Musculoskeletal & Rheumatology",
    summary: "Pattern recognition across mechanical, inflammatory, crystal-related, and infective causes.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Joint pain may be mechanical, inflammatory, crystal-related or infective. Pattern recognition directs focused examination and safe investigation." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Osteoarthritis: activity pain, short stiffness and bony enlargement.",
          "Rheumatoid arthritis: symmetric small-joint synovitis and prolonged morning stiffness.",
          "Gout: sudden severe monoarthritis; ankylosing spondylitis: inflammatory back pain.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Ask onset, number/distribution of joints, stiffness duration, rash, eye/GI/GU symptoms and medicines.",
          "A hot swollen joint with fever or systemic illness is septic until excluded.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Examine look–feel–move and function; check extra-articular signs.",
          "Aspirate an acute hot joint for microscopy, crystals and culture before antibiotics when feasible.",
          "Use inflammatory markers, urate, RF/anti-CCP and imaging selectively.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Septic arthritis needs urgent drainage and IV antibiotics.",
          "Treat gout, OA and inflammatory arthritis according to their specific pathways.",
          "Early rheumatology referral is important for persistent synovitis.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Serum urate alone does not diagnose an acute attack.",
          "NSAID risk assessment is essential.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Pattern narrows the differential.",
          "A hot swollen joint is an emergency.",
          "Persistent synovitis needs early specialist care.",
        ] }],
      },
    ],
  },
  {
    slug: "mechanical-neck-pain",
    title: "Mechanical Neck Pain",
    category: "Musculoskeletal & Rheumatology",
    summary: "Screening for neurological, traumatic, and systemic causes while staying active.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Mechanical neck pain is common and usually improves with activity, ergonomics and time. The station must screen for neurological, traumatic and systemic causes." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Common contributors include posture, muscle strain and degenerative change.",
          "Routine immobilization is not recommended.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Local pain/stiffness may radiate to shoulder or arm.",
          "Red flags: major trauma, fever, cancer, weight loss, progressive weakness, gait disturbance, bladder symptoms or severe unremitting pain.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Inspect posture, palpate, assess active movement and perform upper-limb neurological examination.",
          "Imaging is not routine without red flags or persistent neurological findings.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Reassure, encourage normal activity and correct ergonomics.",
          "Use paracetamol or NSAID only if suitable; consider physiotherapy/exercise.",
          "Urgently refer suspected cord compression, infection, fracture or malignancy.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid routine cervical collars because prolonged use can delay recovery.",
          "Safety-net new weakness, clumsiness, gait change or sphincter symptoms.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Screen red flags and neurology.",
          "Stay active.",
          "Do not image or immobilize routinely.",
        ] }],
      },
    ],
  },
  {
    slug: "low-back-pain-and-sciatica",
    title: "Low Back Pain and Sciatica",
    category: "Musculoskeletal & Rheumatology",
    summary: "The OSCE priority is detecting cauda equina syndrome, fracture, infection, cancer, and major neurological deficit.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Most acute low back pain is non-specific and improves with activity. The OSCE priority is detecting cauda equina syndrome, fracture, infection, cancer and major neurological deficit." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Sciatica is radicular leg pain, often below the knee.",
          "Routine early imaging does not improve uncomplicated pain.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Mechanical pain follows movement/lifting and improves with rest.",
          "Red flags: urinary retention/incontinence, saddle sensory loss, bilateral weakness, fever, cancer, trauma, steroid use or weight loss.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Observe gait; inspect/palpate; test lumbar movement, straight-leg raise and lower-limb power/reflexes/sensation.",
          "Urgent MRI is indicated for suspected cauda equina or serious pathology.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Encourage activity and early return to usual function; avoid bed rest.",
          "Use analgesia tailored to GI, renal and cardiovascular risk; consider physiotherapy.",
          "Urgently refer cauda equina/progressive deficit; review persistent radicular pain for specialist options.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not use opioids routinely or order plain X-rays for uncomplicated early pain.",
          "Give clear return precautions.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Red flags decide urgency.",
          "Activity beats bed rest.",
          "Imaging is selective.",
        ] }],
      },
    ],
  },
  {
    slug: "rickets-and-osteomalacia",
    title: "Rickets and Osteomalacia",
    category: "Musculoskeletal & Rheumatology",
    summary: "Defective bone mineralization in children versus adults, and investigating the cause.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Rickets is defective mineralization of growing bone; osteomalacia is defective mineralization in adults. Vitamin D deficiency is common, but renal, liver, malabsorption and phosphate disorders must be considered." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Children develop deformity/growth problems; adults develop bone pain and proximal weakness.",
          "Biochemical patterns vary with cause.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Rachitic rosary, bowed legs, delayed growth/teething or wrist widening.",
          "Adults: diffuse bone pain, waddling gait and difficulty rising.",
          "Hypocalcaemic spasm, seizure or stridor is urgent.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check calcium, phosphate, alkaline phosphatase, vitamin D, PTH and renal/liver profile.",
          "Use X-rays and further metabolic/genetic testing when indicated.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Give oral vitamin D and calcium in age- and severity-appropriate doses under local paediatric/endocrine protocol.",
          "Treat malabsorption, renal or liver disease and provide safe sunlight/diet advice.",
          "Correct symptomatic hypocalcaemia urgently in hospital.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not advise drinking an injectable preparation.",
          "Avoid unmonitored high-dose therapy because toxicity is possible.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Differentiate child and adult disease.",
          "Investigate the cause, not vitamin D alone.",
          "Use oral protocol-based replacement.",
        ] }],
      },
    ],
  },
  {
    slug: "frozen-shoulder",
    title: "Frozen Shoulder",
    category: "Musculoskeletal & Rheumatology",
    summary: "Painful global restriction of active and passive glenohumeral movement, often diabetes-associated.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Frozen shoulder causes painful global restriction of active and passive glenohumeral movement. It is associated with diabetes and may have a prolonged course." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "External rotation is especially restricted.",
          "Exclude rotator cuff disease, arthritis, cervical radiculopathy and referred pain.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Progressive pain, night pain and difficulty dressing or combing hair.",
          "Red flags: trauma, fever, hot joint, unexplained weight loss or neurovascular deficit.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Inspect, palpate and compare active with passive range; examine neck and neurovascular status.",
          "X-ray may exclude arthritis or other pathology when presentation is atypical.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Explain the phased, often slow recovery.",
          "Use analgesia if safe, supervised stretching/physiotherapy and activity within tolerance.",
          "Consider image-guided intra-articular corticosteroid early for selected patients; refer refractory severe restriction.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Optimize diabetes control.",
          "Avoid forceful painful manipulation outside specialist care.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Both active and passive movement are restricted.",
          "Recovery is gradual.",
          "Education and exercises are core.",
        ] }],
      },
    ],
  },
  {
    slug: "carpal-tunnel-syndrome",
    title: "Carpal Tunnel Syndrome",
    category: "Musculoskeletal & Rheumatology",
    summary: "Median nerve compression at the wrist — typical nocturnal sensory symptoms guide diagnosis.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Carpal tunnel syndrome is median nerve compression at the wrist. Typical nocturnal sensory symptoms and examination guide diagnosis; pregnancy-associated disease often improves postpartum." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Median distribution: thumb, index, middle and radial half of ring finger.",
          "Thenar weakness indicates more advanced disease.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Nocturnal tingling/numbness, dropping objects and relief by shaking the hand.",
          "Look for thenar wasting; consider cervical radiculopathy and peripheral neuropathy.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Use Phalen and Tinel as supportive, not definitive, tests.",
          "Nerve-conduction studies help atypical, severe or pre-operative cases.",
          "Check diabetes/thyroid disease when clinically indicated.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Use a neutral-position night splint and activity/ergonomic modification.",
          "Consider local corticosteroid injection for persistent symptoms.",
          "Refer for surgical decompression if thenar weakness, severe conduction abnormality or failed conservative care.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid NSAIDs in pregnancy unless specifically advised; paracetamol is generally preferred when needed.",
          "Progressive weakness needs timely referral.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Recognize median distribution.",
          "Night splint first for mild disease.",
          "Weakness changes urgency.",
        ] }],
      },
    ],
  },
  {
    slug: "gout",
    title: "Gout",
    category: "Musculoskeletal & Rheumatology",
    summary: "A first hot swollen joint must be assessed for septic arthritis before assuming gout.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Gout is inflammatory arthritis caused by monosodium urate crystals. A first hot swollen joint must be assessed for septic arthritis before assuming gout." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Podagra is classic but other joints can be affected.",
          "Serum urate may be normal during an acute flare.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Sudden severe red, hot, swollen joint; triggers may include alcohol, illness, dehydration or diuretics.",
          "Fever/systemic illness or immunosuppression raises concern for sepsis.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Aspirate uncertain/first severe monoarthritis for crystals, Gram stain and culture.",
          "Check renal function, urate and comorbid cardiovascular/metabolic risk.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Treat a flare with an NSAID, low-dose colchicine or corticosteroid according to contraindications.",
          "Offer urate-lowering therapy for recurrent flares, tophi, CKD or other indications; start low, titrate to target and give flare prophylaxis.",
          "Review weight, alcohol, diet and urate-raising medicines.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not use unvalidated high-dose corticosteroid regimens — select dose and route according to local protocol.",
          "Do not stop established allopurinol during a flare; initiation timing can follow specialist/local protocol.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Exclude septic arthritis.",
          "Choose one safe anti-inflammatory strategy.",
          "Long-term care treats urate to target.",
        ] }],
      },
    ],
  },
  {
    slug: "knee-osteoarthritis",
    title: "Knee Osteoarthritis",
    category: "Musculoskeletal & Rheumatology",
    summary: "A clinical syndrome of activity-related pain — core treatment is exercise, not cartilage supplements.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Knee osteoarthritis is a clinical syndrome of activity-related pain, stiffness and functional limitation. Core treatment is exercise and weight management, not cartilage supplements." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Diagnosis is often clinical in adults with typical mechanical symptoms.",
          "Imaging is reserved for atypical features or procedural planning.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Pain worse with activity, brief morning stiffness, crepitus and reduced movement.",
          "Red flags: hot swollen joint, prolonged stiffness, trauma, locking, night pain or systemic symptoms.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess gait, alignment, effusion, tenderness, range and ligament/meniscal signs when relevant.",
          "Use X-ray only if diagnosis is uncertain, rapid progression or surgery considered.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Offer strengthening/aerobic exercise and weight reduction when overweight.",
          "Use topical NSAID first where appropriate; consider paracetamol or oral NSAID only after risk assessment.",
          "Walking aid, physiotherapy and selected intra-articular steroid may help; refer for arthroplasty when severe.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not claim glucosamine regenerates cartilage.",
          "Protect stomach, kidneys and cardiovascular system when using oral NSAIDs.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Clinical diagnosis is common.",
          "Exercise is treatment.",
          "Escalate based on pain and function, not X-ray alone.",
        ] }],
      },
    ],
  },
  {
    slug: "osteoporosis",
    title: "Osteoporosis",
    category: "Musculoskeletal & Rheumatology",
    summary: "Combining fracture history, clinical risk factors, and DXA — not a T-score alone.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Osteoporosis is reduced bone strength causing fragility fractures. Assessment combines fracture history, clinical risk factors and DXA rather than relying on a T-score alone." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "A T-score at or below −2.5 supports osteoporosis in appropriate adults.",
          "A prior fragility hip/vertebral fracture may justify treatment without waiting for DXA.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Usually silent until fracture; height loss, kyphosis or acute back pain may indicate vertebral fracture.",
          "Risk factors include age, menopause, steroids, low weight, smoking, alcohol and endocrine/renal disease.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Use a fracture-risk tool and DXA when indicated.",
          "Check calcium, vitamin D, renal function and secondary causes.",
          "Image suspected vertebral fracture.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Use weight-bearing/resistance exercise, falls prevention, tobacco cessation and adequate dietary calcium/vitamin D.",
          "Oral bisphosphonate is common first-line if appropriate; take fasting with water and remain upright.",
          "Consider injectable/other agents through specialist pathways for high risk or intolerance.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Check renal function, oesophageal contraindications and dental issues before therapy.",
          "Review adherence and duration; do not continue indefinitely without reassessment.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Find fragility fractures.",
          "Correct reversible risks.",
          "Bisphosphonate counselling prevents harm.",
        ] }],
      },
    ],
  },
  {
    slug: "rheumatoid-arthritis",
    title: "Rheumatoid Arthritis",
    category: "Musculoskeletal & Rheumatology",
    summary: "Persistent synovitis needs prompt rheumatology referral and disease-modifying treatment.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Rheumatoid arthritis is a systemic inflammatory polyarthritis that can cause early irreversible damage. Persistent synovitis needs prompt rheumatology referral and disease-modifying treatment." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Typically symmetric small-joint inflammation with prolonged morning stiffness.",
          "NSAIDs relieve pain but do not prevent joint damage.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "MCP/PIP/wrist pain and swelling, fatigue and functional difficulty.",
          "Late deformities include ulnar deviation and swan-neck changes; extra-articular lung, eye and vascular disease may occur.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Examine tender/swollen joints and function.",
          "Check FBC, ESR/CRP, RF and anti-CCP; obtain baseline renal/liver tests and imaging.",
          "Negative serology does not exclude RA.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Refer early; start a conventional DMARD — often methotrexate if suitable — under specialist care.",
          "Use short bridging steroid only when indicated; offer physiotherapy, occupational therapy, vaccination and cardiovascular-risk care.",
          "Biologics are specialist escalation after appropriate screening.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Methotrexate requires pregnancy avoidance, monitoring and folic acid; counsel about infection.",
          "Do not treat with diclofenac alone.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Early synovitis means early referral.",
          "DMARDs prevent damage.",
          "Monitor both medicines and systemic risk.",
        ] }],
      },
    ],
  },

  // ───────────────────────── Neurology ─────────────────────────
  {
    slug: "approach-to-headache",
    title: "Approach to Headache",
    category: "Neurology",
    summary: "Recognising secondary emergencies before classifying a primary headache.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Headache assessment aims to recognize secondary emergencies before classifying a primary headache. Onset, neurological signs and systemic context are more important than memorizing long mnemonics." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Primary: migraine, tension-type and cluster headache.",
          "Secondary: infection, haemorrhage, glaucoma, hypertension in specific contexts, tumour, medication overuse and tropical illness.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: ["Red flags: thunderclap onset, fever/neck stiffness, focal deficit, seizure, altered consciousness, papilloedema, cancer/immunosuppression, pregnancy/postpartum or new headache after age 50."] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check vital signs, neurological exam, fundoscopy and temporal arteries/eyes as indicated.",
          "Urgent CT/CTA, lumbar puncture or other testing follows the suspected emergency and senior pathway.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Stabilize and urgently refer red-flag headache.",
          "For a primary headache, explain diagnosis, address triggers and use condition-specific acute/preventive therapy.",
          "Consider malaria/dengue/other infections in the appropriate Pakistani epidemiological context.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not diagnose sinus headache without supportive nasal/sinus features.",
          "Frequent analgesic use may perpetuate headache.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Red flags first.",
          "Use epidemiology and examination.",
          "Primary headache treatment follows classification.",
        ] }],
      },
    ],
  },
  {
    slug: "migraine",
    title: "Migraine",
    category: "Neurology",
    summary: "A recurrent neurovascular headache — diagnosis is clinical after excluding secondary red flags.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Migraine is a recurrent neurovascular headache, often unilateral and throbbing, with nausea and sensory sensitivity. Diagnosis is clinical after excluding secondary red flags." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Migraine may occur with or without aura.",
          "A diary identifies frequency, triggers and medicine overuse.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Moderate/severe headache aggravated by activity, nausea/vomiting, photophobia and phonophobia.",
          "Typical aura develops gradually and is reversible; sudden persistent neurological deficit requires emergency assessment.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Neurological examination should be normal between attacks.",
          "Image only for red flags, atypical pattern or abnormal examination.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Acute: early paracetamol or NSAID when safe; add a triptan for suitable patients; antiemetic may help.",
          "Avoid opioids.",
          "Consider prevention for frequent/disabling attacks; options include propranolol, topiramate or amitriptyline according to comorbidity and protocol.",
          "Promote regular sleep/meals, hydration and trigger management.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Topiramate and valproate have major pregnancy risks; valproate should not be used for migraine prevention in pregnancy potential.",
          "Limit acute medicines to reduce medication-overuse headache.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Exclude red flags.",
          "Treat early and avoid opioids.",
          "Choose prophylaxis around comorbidity and pregnancy.",
        ] }],
      },
    ],
  },
  {
    slug: "other-primary-headache-syndromes",
    title: "Other Primary Headache Syndromes",
    category: "Neurology",
    summary: "Cluster, tension-type, and trigeminal neuralgia — distinctive patterns that avoid inappropriate migraine treatment.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Cluster, tension-type and trigeminal neuralgia have distinctive patterns. Correct classification avoids inappropriate migraine treatment and identifies patients needing specialist review." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Cluster: severe unilateral orbital pain with autonomic signs in bouts.",
          "Tension-type: bilateral pressing pain without major migrainous features.",
          "Trigeminal neuralgia: brief electric-shock facial pain triggered by touch/chewing.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Cluster may cause tearing, nasal congestion and restlessness.",
          "Trigeminal neuralgia red flags include sensory loss, bilateral symptoms or young age.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Perform neurological and cranial-nerve examination; examine eyes, mouth and temporal arteries when relevant.",
          "MRI/specialist evaluation is appropriate for trigeminal neuralgia or atypical cluster presentation.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Cluster attack: high-flow oxygen and subcutaneous/intranasal triptan through an appropriate plan; verapamil prevention requires ECG monitoring.",
          "Tension-type: lifestyle, simple analgesia used sparingly and prevention for frequent disease.",
          "Trigeminal neuralgia: carbamazepine/oxcarbazepine with monitoring and specialist follow-up.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Avoid opioids and excessive analgesics.",
          "Red-eye headache may be acute glaucoma, not cluster.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Pattern is diagnostic.",
          "Cluster needs rapid specific therapy.",
          "Neurological abnormalities require imaging/referral.",
        ] }],
      },
    ],
  },
  {
    slug: "febrile-seizures",
    title: "Febrile Seizures",
    category: "Neurology",
    summary: "Immediate safety, timing, and meningitis/sepsis assessment in a young child with fever.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "A febrile seizure occurs in a young child with fever without CNS infection or another defined cause. Immediate safety, timing and meningitis/sepsis assessment are central." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Simple seizures are generalized, brief and do not recur within 24 hours; complex features increase evaluation needs.",
          "Antipyretics improve comfort but do not reliably prevent recurrence.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Generalized stiffening/jerking with fever and recovery.",
          "Red flags: prolonged/focal/recurrent seizure, persistent altered consciousness, neck stiffness, non-blanching rash, bulging fontanelle or very young age.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess ABC, glucose, temperature, capillary refill and source of fever.",
          "Investigations depend on age, appearance, complex features and suspected infection; lumbar puncture is not routine for every simple event.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Protect from injury, place in recovery position, time the seizure, do not restrain and put nothing in the mouth.",
          "Call emergency help for a seizure lasting 5 minutes or more; give prescribed buccal midazolam/rectal diazepam per protocol.",
          "Treat the cause of fever and support fluids/comfort.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not use tepid sponging to prevent seizures.",
          "Teach parents recurrence first aid and when to seek urgent care.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Time and protect.",
          "Exclude CNS infection.",
          "Antipyretics are for comfort, not seizure prevention.",
        ] }],
      },
    ],
  },
  {
    slug: "epilepsy-in-adults-initial-management-and-counselling",
    title: "Epilepsy in Adults: Initial Management and Counselling",
    category: "Neurology",
    summary: "One event does not establish the diagnosis — witness history, cause assessment, and specialist review.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "Epilepsy is a tendency to recurrent unprovoked seizures; one event does not automatically establish the diagnosis. Safe initial care requires witness history, reversible-cause assessment and specialist review." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Classify focal versus generalized onset when possible.",
          "Antiseizure medicine choice depends on seizure type, comorbidity, sex/pregnancy potential and interactions.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Ask aura, movements, awareness, tongue bite, injury, incontinence, duration and post-ictal state.",
          "Red flags: status epilepticus, new focal deficit, pregnancy, infection, head injury or persistent low consciousness.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Check glucose and metabolic/toxic triggers; ECG can detect mimics.",
          "Arrange specialist EEG/MRI according to presentation; normal tests do not alone exclude epilepsy.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "For a convulsion: protect, recovery position after jerking, time it and seek emergency help at 5 minutes.",
          "Do not start long-term medicine without diagnostic review unless an emergency/specialist plan indicates.",
          "Counsel adherence, sleep, alcohol, bathing/swimming, heights/machinery and local driving rules.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Discuss contraception and pregnancy before prescribing; valproate has major fetal risk and strict restrictions.",
          "Sudden withdrawal can provoke seizures.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "First aid is simple and timed.",
          "Diagnosis needs specialist classification.",
          "Pregnancy and safety counselling are mandatory.",
        ] }],
      },
    ],
  },
  {
    slug: "transient-ischaemic-attack-and-acute-stroke",
    title: "Transient Ischaemic Attack and Acute Stroke",
    category: "Neurology",
    summary: "Sudden focal neurological dysfunction requiring urgent assessment — a risk score must never delay referral.",
    sections: [
      {
        heading: "Introduction",
        blocks: [{ type: "paragraph", text: "TIA and stroke present with sudden focal neurological dysfunction. Every suspected event requires urgent assessment; a risk score must never delay referral." }],
      },
      {
        heading: "Core Concepts",
        blocks: [{ type: "list", items: [
          "Use FAST and establish exact onset/last-known-well time.",
          "Stroke mimics include hypoglycaemia, seizure and migraine, but must be assessed urgently.",
        ] }],
      },
      {
        heading: "Clinical Features",
        blocks: [{ type: "list", items: [
          "Face droop, arm weakness, speech disturbance, visual loss, ataxia or hemisensory loss.",
          "Red flags include reduced consciousness, severe headache/vomiting or rapidly worsening deficit.",
        ] }],
      },
      {
        heading: "Diagnosis",
        blocks: [{ type: "list", items: [
          "Assess ABC, glucose, vital signs and focused NIHSS-style neurology.",
          "Urgent non-contrast CT brain distinguishes haemorrhage; vascular imaging and ECG identify treatable causes.",
          "Do not use ABCD2 to postpone TIA review.",
        ] }],
      },
      {
        heading: "Management",
        blocks: [{ type: "list", items: [
          "Activate the stroke pathway immediately for thrombolysis/thrombectomy eligibility.",
          "Do not give aspirin in suspected acute stroke until haemorrhage is excluded; then antiplatelet treatment follows protocol.",
          "TIA needs specialist assessment ideally within 24 hours and immediate secondary-prevention planning.",
          "Manage AF, blood pressure, diabetes, lipids and tobacco long-term.",
        ] }],
      },
      {
        heading: "Important Management Considerations",
        blocks: [{ type: "callout", items: [
          "Do not acutely lower BP routinely unless a protocol indication exists.",
          "Swallow screen before oral food, fluid or medicine.",
        ] }],
      },
      {
        heading: "Key Takeaways",
        blocks: [{ type: "list", ordered: true, items: [
          "Time last-known-well.",
          "Image urgently before antiplatelet in acute stroke.",
          "TIA is an emergency warning, not a routine appointment.",
        ] }],
      },
    ],
  },
];

export const CATEGORY_ORDER = [
  "Cardiovascular",
  "Respiratory",
  "Endocrine & Metabolic",
  "Gastrointestinal & Hepatobiliary",
  "Renal & Urology",
  "Musculoskeletal & Rheumatology",
  "Neurology",
];

export function getHandout(slug) {
  return handouts.find((handout) => handout.slug === slug);
}

export function getAdjacentHandouts(slug) {
  const index = handouts.findIndex((handout) => handout.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? handouts[index - 1] : null,
    next: index < handouts.length - 1 ? handouts[index + 1] : null,
  };
}
