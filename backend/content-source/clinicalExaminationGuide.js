// Static content for the Clinical Examination Guide section.
//
// Same rationale as historyTakingGuide.js: this is reference/study material
// transcribed from the MBBS Clinical Examinations study guide
// (docs/mbbs_examinations_guide_md.docx). It never changes per-user, isn't
// authored through the admin CMS, and has no attempts/scoring — so it's a
// bundled data file, not a database collection. Rendered by
// ClinicalExaminationPage.jsx via the same shared block components
// (components/GuideBlocks.jsx) that the History Taking Guide uses.

export const universalOpening = {
  title: "How to start every examination",
  subtitle: "Universal opening — same every time",
  steps: [
    { label: "Introduce yourself", detail: "Name and grade" },
    { label: "Elicit name, age, occupation", detail: "" },
    { label: "Explain and gain consent", detail: '"The examination will involve looking at your [body part] and listening to your chest. Is that okay?"' },
    { label: "Ask about pain", detail: '"Before we begin, do you have any pain anywhere?"' },
    { label: "Position the patient correctly", detail: "Angle varies by station — see each station" },
    { label: "Expose appropriately", detail: "Always maintain dignity" },
  ],
  note: "At the bedside, a quick framework for every station: is the patient A – Alert, B – (normal) Body habitus, C – Comfortable at rest?",
};

// The two mnemonics used across every station in this guide — TOP RaCk drives
// the neurological stations, Look/Feel/Move drives every joint (MSK) station.
export const coreMnemonic = {
  id: "top-rack",
  name: "TOP RaCk",
  subtitle: "Motor exam order — use for every neurological motor examination",
  type: "table",
  columns: ["Letter", "Meaning"],
  rows: [
    ["T", "Tone"],
    ["o", "(skip)"],
    ["P", "Power"],
    ["R", "Reflexes"],
    ["a", "(skip)"],
    ["C", "Co-ordination"],
    ["k", "(skip)"],
  ],
  note: "Then always add Sensation after co-ordination.",
};

export const mskFramework = {
  id: "look-feel-move",
  name: "Look, Feel, Move",
  subtitle: "The universal framework for every joint (MSK) examination — always compare both sides",
  type: "list",
  items: [
    "Look: inspect from front, side, and behind — scars, swelling, deformity, muscle wasting, skin changes",
    "Feel: temperature, tenderness, effusions, joint margins — check for pain first and start on the normal side",
    "Move: active movement first, then passive if abnormal, feeling for crepitus",
    "Special tests: joint-specific provocation tests to confirm a suspected diagnosis",
  ],
};

export const masterQuickReference = {
  title: "Master quick-reference",
  subtitle: "Signs and what they mean",
  table: {
    columns: ["Sign", "Condition"],
    rows: [
      ["Clubbing", "Lung cancer, bronchiectasis, cystic fibrosis, cirrhosis, IBD, congenital heart disease, endocarditis"],
      ["Asterixis (flapping tremor)", "CO₂ retention (respiratory), hepatic encephalopathy, uraemia"],
      ["Malar flush", "Mitral stenosis"],
      ["Xanthelasma + corneal arcus", "Hyperlipidaemia"],
      ["Spider naevi >5", "Chronic liver disease"],
      ["Caput medusae", "Portal hypertension"],
      ["Osler's nodes + Janeway lesions", "Infective endocarditis"],
      ["Tracheal deviation toward lesion", "Collapse, fibrosis"],
      ["Tracheal deviation away", "Effusion, tension pneumothorax"],
      ["Stony dull percussion", "Pleural effusion"],
      ["Hyper-resonant percussion", "Pneumothorax"],
      ["Absent ankle jerk", "S1 root, peripheral neuropathy"],
      ["Upgoing plantar", "UMN lesion"],
      ["Tongue deviates to one side", "Hypoglossal nerve palsy — to side of lesion"],
      ["Uvula deviates away", "Glossopharyngeal palsy — away from lesion"],
    ],
  },
};

export const presentationTemplate = {
  title: "Exam presentation template",
  subtitle: "For any examination station",
  text: "Today I examined the [system] of [Mr/Mrs X], a [age]-year-old [occupation]. [General state] — comfortable at rest / dyspnoeic / pale. Peripherally: [hand signs]. Pulse was [rate, rhythm, volume]. [Any arm findings]. On inspection of the [area]: [scars, shape, movement]. On palpation: [apex beat / liver / trachea etc]. On percussion: [note and interpretation]. On auscultation: [sounds, murmurs, breath sounds]. Additional findings: [oedema, lymph nodes, peripheral pulses]. In summary, this is a [age]-year-old [sex] with [key positive findings]. These findings are most consistent with a diagnosis of [most likely diagnosis]. I would wish to exclude [differentials]. I would take a full history, request [investigations], and use this to inform my further management.",
};

export const finalChecklist = {
  title: "Final checklist",
  subtitle: "Before you leave any examination station",
  items: [
    "Introduced, consented, asked about pain, correct position",
    "Full inspection (bedside clues + patient + relevant area)",
    "Hands examined (most stations)",
    "Face examined (most stations)",
    "Area-specific examination completed in order",
    "Additional points (oedema, peripheral pulses, lymph nodes as appropriate)",
    "Thanked patient, offered to help them dress",
    "Requested investigations (BP, O₂ sats, ECG, CXR, urine dipstick)",
    "Structured presentation with differential diagnosis",
  ],
};

// The 12 examination stations, in document order.
export const stations = [
  {
    slug: "cardiovascular-examination",
    title: "Cardiovascular Examination",
    category: "Core",
    icon: "HeartPulse",
    summary: "Hands to murmurs — JVP, apex character, the four auscultation areas, and the Duke criteria for endocarditis.",
    meta: { position: "45 degrees", exposure: "Waist upward" },
    order: ["Inspect", "Hands", "Pulse", "Arms", "Face", "Carotid", "JVP", "Chest", "Apex", "Auscultate", "Oedema", "Pulses"],
    sections: [
      {
        heading: "1. General inspection (from foot of bed)",
        intro: "Look for:",
        blocks: [
          {
            type: "list",
            items: [
              "Bedside clues: Heart monitor, GTN spray, fluid restriction signs",
              "Breathing: Comfortable or breathless at rest?",
            ],
          },
          {
            type: "list",
            heading: "Scars",
            items: ["Midline sternotomy = CABG or valve replacement", "Lateral thoracotomy = mitral valvotomy"],
          },
          {
            type: "list",
            items: [
              "Check legs for saphenous vein harvest scars (CABG)",
              "Malar flush: Dusky pink cheeks = mitral stenosis",
              "Audible click = prosthetic heart valve",
            ],
          },
        ],
      },
      {
        heading: "2. Hands",
        intro: "Feel for temperature. Then look for:",
        blocks: [
          {
            type: "table",
            columns: ["Sign", "Meaning"],
            rows: [
              ["Peripheral cyanosis", "Blue nail beds — low O₂ / poor circulation"],
              ["Clubbing", "Endocarditis, cyanotic congenital heart disease, atrial myxoma"],
              ["Splinter haemorrhages", "Infective endocarditis"],
              ["Osler's nodes", "Tender pink nodules on fingertips — endocarditis"],
              ["Janeway lesions", "Painless flat red spots on palms — endocarditis"],
              ["Nicotine stains", "Peripheral vascular disease risk"],
              ["Capillary refill", "Normal < 2 seconds"],
            ],
          },
        ],
      },
      {
        heading: "3. Pulse (radial)",
        intro: "Feel with 3 fingers for 15 seconds × 4 = rate",
        blocks: [
          {
            type: "table",
            columns: ["Finding", "Meaning"],
            rows: [
              ["Normal", "60–100 bpm"],
              ["Tachycardia", "> 100 bpm"],
              ["Bradycardia", "< 60 bpm"],
              ["Regular", "Sinus rhythm"],
              ["Regularly irregular", "2nd degree heart block, sinus arrhythmia"],
              ["Irregularly irregular", "AF or multiple ectopics"],
            ],
          },
          { type: "callout", text: "AF vs Ectopics: Ask patient to touch their toes 10 times — AF persists with increased rate; ectopics disappear (become regular)." },
          {
            type: "list",
            heading: "Pulse volume",
            items: ["Low volume → heart failure, aortic stenosis", "Bounding → thyrotoxicosis, CO₂ retention, aortic regurgitation, sepsis"],
          },
        ],
      },
      {
        heading: "Pulse character (carotid pulse is more accurate)",
        blocks: [
          {
            type: "table",
            columns: ["Character", "Condition"],
            rows: [
              ["Slow-rising / plateau", "Aortic stenosis"],
              ["Collapsing (water-hammer)", "Aortic regurgitation, PDA"],
              ["Bisferiens (double peak)", "AS + AR combined"],
              ["Pulsus alternans", "Left ventricular failure"],
              ["Pulsus paradoxus", "Tamponade, asthma"],
            ],
          },
          {
            type: "list",
            heading: "Testing for a collapsing pulse",
            items: [
              "Ask whether they have any pain or stiffness in their shoulder first",
              "With your hand around their wrist/lower forearm muscle bulk, rapidly raise the patient's arm upwards",
              "You are feeling for a marked bounding sensation — the pulse slapping your hand",
            ],
          },
        ],
      },
      {
        heading: "4. Arms",
        blocks: [
          {
            type: "list",
            items: [
              "Radio-radial delay: Check both radials simultaneously → coarctation (proximal to left subclavian)",
              "Radio-femoral delay: Suggests distal coarctation",
              "BP both arms: Difference >20 mmHg = aortic dissection",
            ],
          },
        ],
      },
      {
        heading: "5. Face",
        blocks: [
          {
            type: "list",
            items: [
              "Eyes: Anaemia (pale conjunctiva), xanthelasma (hyperlipidaemia), corneal arcus",
              "Tongue: Central cyanosis (blue tongue), dental hygiene poor (endocarditis risk), macroglossia (amyloid), high arched palate (Marfan's)",
              "Lens dislocation: Marfan's / homocystinuria",
            ],
          },
        ],
      },
      {
        heading: "6. JVP (jugular venous pressure)",
        blocks: [
          {
            type: "list",
            items: [
              "Position: 45 degrees, head turned to one side",
              "Look for pulsations between the two heads of sternocleidomastoid",
              "Normal JVP ≤ 4 cm above sternal angle",
            ],
          },
          {
            type: "table",
            columns: ["Feature", "JVP", "Carotid"],
            rows: [
              ["Pulsations", "2 per beat", "1 per beat"],
              ["Palpable?", "No", "Yes"],
              ["Pressure at base of neck", "Obliterates JVP", "No effect"],
              ["Inspiration", "Falls", "No change"],
            ],
          },
          { type: "paragraph", text: "Causes of raised JVP — mnemonic PQRST:" },
          {
            type: "definitions",
            items: [
              { term: "P", detail: "Pericardial effusion / PE / Pulmonary hypertension" },
              { term: "Q", detail: "Quantity of fluid (fluid overload)" },
              { term: "R", detail: "Right heart failure" },
              { term: "S", detail: "Superior vena cava obstruction" },
              { term: "T", detail: "Tricuspid regurgitation / Tamponade" },
            ],
          },
          {
            type: "list",
            heading: "Special signs",
            items: [
              "Kussmaul's sign (JVP rises on inspiration) = constrictive pericarditis",
              "Fixed, non-pulsatile raised JVP = SVC obstruction (often bronchial carcinoma)",
            ],
          },
          { type: "paragraph", text: "Hepatojugular reflux: Press abdomen firmly for 15 seconds → persistent JVP rise = right ventricular failure" },
        ],
      },
      {
        heading: "7. Chest palpation",
        intro: "Apex beat: Normally 5th intercostal space, mid-clavicular line",
        blocks: [
          {
            type: "table",
            columns: ["Apex character", "Condition"],
            rows: [
              ["Tapping", "Mitral stenosis"],
              ["Heaving", "Aortic stenosis"],
              ["Thrusting", "Aortic or mitral regurgitation"],
              ["Diffuse, weak", "LV failure, dilated cardiomyopathy"],
              ["Double impulse", "HOCM"],
              ["Displaced laterally", "LV dilatation"],
            ],
          },
          {
            type: "list",
            items: ["Thrills = palpable murmurs (use flat of hand) → AS, VSD", "Parasternal heave (left sternal edge) = right ventricular hypertrophy"],
          },
        ],
      },
      {
        heading: "8. Auscultation — a place to meet",
        intro: "4 areas to listen (in order):",
        blocks: [
          {
            type: "table",
            columns: ["Mnemonic", "Area", "Location", "Best for"],
            rows: [
              ["A", "Aortic", "2nd ICS, right sternal edge", "Aortic stenosis → radiates to carotids"],
              ["P", "Pulmonary", "2nd ICS, left sternal edge", "Pulmonary stenosis"],
              ["T", "Tricuspid", "5th ICS, left sternal edge", "Tricuspid / aortic regurgitation"],
              ["M", "Mitral (apex)", "5th ICS, mid-clavicular line", "Mitral stenosis (bell) / regurgitation (diaphragm)"],
            ],
          },
          {
            type: "list",
            items: [
              "Aortic regurgitation: Lean forward, breath held in expiration, listen at left sternal edge",
              "Mitral stenosis: Roll patient left, breath held in expiration, use bell",
              "Tricuspid: Lean forward, hold breath in inspiration",
            ],
          },
        ],
      },
      {
        heading: "9. Murmur description (6 things to say)",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Timing — Systolic, diastolic, or continuous",
              "Intensity — Levine Grade 1–6 (Grade 4+ has a thrill)",
              "Site — Where loudest",
              "Character — Ejection / pansystolic / decrescendo",
              "Radiation — Carotids (AS), axilla (MR), back (PDA)",
              "Respiration effect — RILE: Right sided louder in Inspiration, Left sided louder in Expiration",
            ],
          },
          { type: "paragraph", text: "Common murmurs quick reference:" },
          {
            type: "table",
            columns: ["Murmur", "Timing", "Best heard", "Radiation", "Position"],
            rows: [
              ["Aortic stenosis (AS)", "Ejection systolic", "Aortic area", "Carotids", "Sitting forward, expiration"],
              ["Aortic regurgitation (AR)", "Early diastolic", "Left sternal edge", "—", "Sitting forward, expiration"],
              ["Mitral stenosis (MS)", "Mid-diastolic", "Apex (bell)", "—", "Left lateral, expiration"],
              ["Mitral regurgitation (MR)", "Pansystolic", "Apex (diaphragm)", "Axilla", "Left lateral"],
              ["VSD", "Pansystolic (harsh)", "Left sternal edge", "—", "—"],
              ["PDA", "Continuous (machinery)", "Left sternal edge", "Back", "—"],
            ],
          },
          { type: "paragraph", text: "Valsalva manoeuvre: louder in HOCM, softer in AS. Squatting: louder in AS, softer in HOCM." },
        ],
      },
      {
        heading: "10. Additional examination",
        blocks: [
          {
            type: "list",
            items: [
              "Lung bases: Crackles = pulmonary oedema; absent = pleural effusion (LV failure)",
              "Sacral oedema: Press lower back",
              "Ankle oedema: Press over ankle — pitting = heart failure, nephrotic, cirrhosis; non-pitting = lymphatic obstruction",
              "Peripheral pulses: Femoral, popliteal, posterior tibial, dorsalis pedis",
              "Abdomen: Pulsatile liver (tricuspid regurgitation), enlarged liver (hepatic congestion), ascites",
            ],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [{ type: "paragraph", text: "Request: BP, O₂ saturations, ECG, CXR, urine dipstick, fundoscopy, observations chart" }],
      },
      {
        heading: "Modified Duke criteria for endocarditis",
        intro: "2 Major / 1 Major + 3 Minor / 5 Minor",
        blocks: [
          { type: "paragraph", text: "MAJOR: Positive blood culture + positive echo" },
          { type: "paragraph", text: "MINOR (PIPER):" },
          {
            type: "definitions",
            items: [
              { term: "P", detail: "Pyrexia >38°C" },
              { term: "I", detail: "Immunological phenomena (glomerulonephritis, Osler's nodes)" },
              { term: "P", detail: "Positive culture (atypical organism)" },
              { term: "E", detail: "Embolic phenomena (Janeway lesions, arterial emboli, stroke)" },
              { term: "R", detail: "Risky patient (IVDU, known cardiac lesion)" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "respiratory-examination",
    title: "Respiratory Examination",
    category: "Core",
    icon: "Wind",
    summary: "Clubbing causes, tactile fremitus, percussion notes, breath sounds, and what sputum colour tells you.",
    meta: { position: "45 degrees", exposure: "Chest fully exposed" },
    order: ["Inspect", "Hands", "Pulse", "Face/neck", "Lymph nodes", "Trachea", "Apex", "Expansion", "Percussion", "Tactile fremitus", "Auscultate", "Vocal resonance", "Repeat back", "Oedema"],
    sections: [
      {
        heading: "1. General inspection",
        intro: "Bedside clues: Oxygen mask, nebuliser, inhalers, sputum pot (note colour), peak flow meter",
        blocks: [
          {
            type: "list",
            items: [
              "Body habitus: Cachectic (cancer), Cushingoid (long-term steroids)",
              "Breathing: Comfortable? Accessory muscle use? Pursed lips (auto-PEEPing in COPD)?",
              "Chest shape: Barrel chest (COPD), pectus excavatum, pectus carinatum",
              "Scars: Thoracotomy scar, operative scars",
              "Chest movements: Asymmetrical expansion?",
              "Respiratory rate: Count 30 seconds × 2. Normal = 16–20/min. Tachypnoea > 20/min",
            ],
          },
        ],
      },
      {
        heading: "2. Hands",
        blocks: [
          {
            type: "table",
            columns: ["Sign", "Meaning"],
            rows: [
              ["Clubbing — ABCDEF", "Asbestosis/Abscess, Bronchiectasis/Bronchial carcinoma, Cystic fibrosis, Decreased O₂, Empyema, Fibrosing alveolitis"],
              ["Peripheral cyanosis", "Blue nails — low O₂"],
              ["CO₂ retention (asterixis)", "Flapping tremor with wrists cocked back"],
              ["Nicotine stains", "Smoking evidence"],
              ["Tremor", "Beta-agonist (salbutamol) use"],
            ],
          },
          {
            type: "list",
            items: ["Check if wrists are painful by light squeeze — indicates pulmonary hypertrophic osteoarthropathy"],
          },
        ],
      },
      {
        heading: "3. Face and neck",
        blocks: [
          {
            type: "list",
            items: [
              "Eyes: Anaemia",
              "Tongue: Central cyanosis",
              "JVP: Raised and pulsatile = cor pulmonale; raised and fixed = SVC obstruction",
              "Oral candidiasis: Inhaled steroid use",
              "Plethoric complexion: Carbon dioxide retention",
              "Butterfly rash: SLE",
            ],
          },
        ],
      },
      {
        heading: "4. Lymph nodes",
        blocks: [{ type: "paragraph", text: "Palpate cervical region and supraclavicular fossa — enlarged = TB, lung cancer" }],
      },
      {
        heading: "5. Trachea",
        intro: "Place index and ring fingers either side, middle finger in centre.",
        blocks: [
          {
            type: "list",
            items: [
              "Central = normal (slight right deviation is normal)",
              "Deviated toward affected side = collapse, fibrosis",
              "Deviated away from affected side = pleural effusion, tension pneumothorax",
            ],
          },
        ],
      },
      {
        heading: "6. Chest expansion",
        intro: "Place hands on chest, thumbs just touching in midline, fingers spread.",
        blocks: [
          {
            type: "list",
            items: ["Ask to breathe normally then deeply", "Normal expansion >5 cm between thumbs", "Unilaterally reduced = same-side pathology"],
          },
        ],
      },
      {
        heading: "7. Percussion",
        intro: "Percuss with middle finger on middle phalanx. Compare left vs right, upper/mid/lower zones.",
        blocks: [
          {
            type: "table",
            columns: ["Note", "Condition"],
            rows: [
              ["Stony dull", "Pleural effusion"],
              ["Dull", "Consolidation, fibrosis, collapse"],
              ["Resonant", "Normal"],
              ["Hyper-resonant", "Pneumothorax, hyperinflation (COPD)"],
            ],
          },
        ],
      },
      {
        heading: "8. Tactile vocal fremitus",
        intro: 'Ulnar border of hand on chest. Ask patient to say "1, 1, 1, 1":',
        blocks: [
          { type: "list", items: ["Increased = consolidation, fibrosis", "Decreased/absent = pneumothorax, COPD, collapse, effusion"] },
        ],
      },
      {
        heading: "9. Auscultation",
        intro: "Ask patient to breathe deeply through mouth. Listen upper/mid/lower zones, compare both sides.",
        blocks: [
          {
            type: "table",
            columns: ["Breath sounds", "Condition"],
            rows: [
              ["Vesicular", "Normal"],
              ["Bronchial breathing", "Consolidation (harsh, equal inspiration/expiration)"],
              ["Absent", "Effusion, pneumothorax, collapse"],
            ],
          },
          { type: "paragraph", text: "Added sounds:" },
          {
            type: "table",
            columns: ["Sound", "Condition"],
            rows: [
              ["Wheeze (rhonchi)", "Asthma, COPD"],
              ["Fine crackles (end-inspiratory)", "Pulmonary fibrosis, pulmonary oedema"],
              ["Coarse crackles (early inspiratory)", "Bronchiectasis, pneumonia, COPD exacerbation"],
              ["Pleural rub", "Pneumonia, pulmonary embolism"],
            ],
          },
        ],
      },
      {
        heading: "10. Vocal resonance",
        intro: 'Ask patient to say "1, 1, 1" while listening:',
        blocks: [
          { type: "list", items: ["Increased = consolidation", "Decreased/absent = effusion, pneumothorax"] },
          { type: "paragraph", text: "Then repeat all: expansion, percussion, auscultation on the back" },
        ],
      },
      {
        heading: "Sputum colours (must know)",
        blocks: [
          {
            type: "table",
            columns: ["Colour", "Suggests"],
            rows: [
              ["Green", "Acute pneumonia, COPD, bronchiectasis"],
              ["Yellow", "Suppurative disease"],
              ["Grey/white", "Chronic smoker"],
              ["Rusty-gold", "Pneumococcal pneumonia"],
              ["Blood-stained", "PE, TB, Goodpasture's"],
              ["Pink, frothy", "Pulmonary oedema"],
              ["Black", "Asbestosis, coal miners"],
            ],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [{ type: "paragraph", text: "Request: BP, O₂ saturations, peak flow, CXR, ECG, sputum for MC&S, cytology, AFB stain" }],
      },
    ],
  },
  {
    slug: "abdominal-examination",
    title: "Abdominal Examination",
    category: "Core",
    icon: "CircleDot",
    summary: "Scars, chronic liver disease signs, Murphy's and Rovsing's signs, and telling the spleen from the left kidney.",
    meta: { position: "Fully flat", exposure: '"Nipples to knees" — maintain dignity' },
    order: ["Inspect", "Hands", "Face", "Chest", "Lymph nodes", "Light palpation", "Deep palpation", "Liver", "Spleen", "Kidneys", "Aorta", "Percuss liver", "Percuss spleen", "Ascites", "Auscultate", "Hernias", "Peripheral pulses"],
    sections: [
      {
        heading: "1. General inspection",
        intro: "Bedside clues: Fluid restriction signs, dialysis unit, catheter bags (note colour/content)",
        blocks: [
          { type: "paragraph", text: "Look for:" },
          {
            type: "list",
            items: [
              "Scars (know your abdominal scar locations)",
              "Distension — flat, scaphoid (sunken), or protuberant",
            ],
          },
          { type: "paragraph", text: "9 Fs of abdominal distension:" },
          {
            type: "definitions",
            items: [
              { term: "F", detail: "Fat" },
              { term: "F", detail: "Faeces" },
              { term: "F", detail: "Fluid" },
              { term: "F", detail: "Flatus" },
              { term: "F", detail: "Fetus" },
              { term: "F", detail: "Full-sized tumour" },
              { term: "F", detail: "Full bladder" },
              { term: "F", detail: "Fibroids" },
              { term: "F", detail: "False pregnancy" },
            ],
          },
          {
            type: "list",
            items: [
              "Stomas (ileostomy/colostomy site)",
              "Visible pulsations or peristalsis",
              "Caput medusae (dilated veins around umbilicus = portal hypertension)",
            ],
          },
          { type: "paragraph", text: "Common abdominal scars:" },
          {
            type: "table",
            columns: ["Scar", "Surgery"],
            rows: [
              ["Midline laparotomy", "Bowel/aorta surgery"],
              ["Right subcostal (Kocher)", "Cholecystectomy"],
              ["Roof-top (bilateral subcostal)", "Liver/bilateral surgery"],
              ["Right iliac fossa (grid iron)", "Appendicectomy"],
              ["Left/right flank", "Renal surgery"],
              ["Pfannenstiel (bikini)", "Pelvic/gynaecological/bladder surgery"],
              ["Left iliac fossa", "Stoma formation"],
            ],
          },
          {
            type: "list",
            heading: "Additional inspection signs",
            items: [
              "Cullen's sign: bruising around the umbilicus (haemorrhagic pancreatitis)",
              "Grey-Turner sign: bruising in the flank (haemorrhagic pancreatitis)",
            ],
          },
        ],
      },
      {
        heading: "2. Hands",
        blocks: [
          {
            type: "table",
            columns: ["Sign", "Meaning"],
            rows: [
              ["Clubbing", "Cirrhosis, IBD, coeliac, cystic fibrosis"],
              ["Leuconychia (white nails)", "Cirrhosis, hypoalbuminaemia"],
              ["Koilonychia (spoon nails)", "Iron deficiency anaemia"],
              ["Tar staining", "History of smoking"],
              ["Palmar erythema", "Chronic liver disease, pregnancy, hyperdynamic circulation"],
              ["Dupuytren's contracture", "Liver cirrhosis (alcoholism), familial"],
              ["Tendon xanthomata", "Hyperlipidaemia"],
              ["Pigmentation of palmar creases", "Addison's disease"],
              ["Finger glucose-monitoring marks", "Diabetes"],
              ["Asterixis (flapping tremor)", "Decompensated hepatic encephalopathy"],
              ["AV fistula scar", "Dialysis patient"],
            ],
          },
        ],
      },
      {
        heading: "3. Face",
        blocks: [
          {
            type: "list",
            items: [
              "Eyes: Jaundice (icteric sclera), anaemia (pale conjunctiva)",
              "Lips: Brown freckles = Peutz-Jeghers syndrome",
              "Mouth/tongue: Central cyanosis, macroglossia (hypothyroid/acromegaly/amyloid), atrophic glossitis (iron/B12 deficiency), aphthous ulcers (Crohn's, coeliac), foetor hepaticus",
            ],
          },
        ],
      },
      {
        heading: "4. Body signs of chronic liver disease",
        blocks: [
          {
            type: "list",
            items: [
              "Spider naevi (>5 is significant)",
              "Gynaecomastia",
              "Loss of body hair (chest and axilla in men)",
              "Caput medusae",
              "Striae (stretch marks)",
            ],
          },
        ],
      },
      {
        heading: "5. Lymph nodes",
        intro: "Palpate: cervical, axillary, femoral",
        blocks: [{ type: "list", items: ["Virchow's node (left supraclavicular fossa) = gastric carcinoma"] }],
      },
      {
        heading: "6. Abdominal palpation",
        intro: "Always face the patient, watch their face for pain.",
        blocks: [
          { type: "paragraph", text: "Before touching: Ask to distend abdomen then suck in — painful = early peritonism. Ask to cough — hernia? Head lift — divarication of rectus?" },
          {
            type: "list",
            heading: "Light palpation",
            items: ["All 9 quadrants, start away from pain.", "Feel for: Tenderness, guarding (muscle contraction), rigidity, rebound tenderness"],
          },
          {
            type: "list",
            heading: "Special signs",
            items: [
              "Murphy's sign: Press right hypochondrium, ask to breathe in → stops = acute cholecystitis (absent in chronic)",
              "Rovsing's sign: Press left iliac fossa → pain felt in right iliac fossa = appendicitis",
            ],
          },
          { type: "paragraph", text: "Deep palpation: Feel for masses — describe size, shape, edge, consistency, resonance, movement with respiration" },
        ],
      },
      {
        heading: "7. Liver (palpate from right iliac fossa)",
        blocks: [
          { type: "list", items: ["Use flat of hand, press inward and upward on inspiration", "Describe: smooth or irregular? Tender? Size in cm below costal margin?"] },
          {
            type: "table",
            columns: ["Finding", "Condition"],
            rows: [
              ["Large, smooth, tender", "Hepatitis, heart failure, early cirrhosis"],
              ["Large, hard, craggy/nodular", "Primary hepatoma or secondaries"],
              ["Small, shrunken", "Late cirrhosis"],
            ],
          },
        ],
      },
      {
        heading: "8. Spleen (palpate from right iliac fossa toward left hypochondrium)",
        blocks: [
          { type: "list", items: ["Spleen must be 2–3× normal size before palpable", "Feel for notch, tenderness, size"] },
          { type: "paragraph", text: "Spleen vs left kidney — how to tell apart:" },
          {
            type: "table",
            columns: ["Feature", "Spleen", "Left kidney"],
            rows: [
              ["Notched edge", "Yes", "No"],
              ["Moves with inspiration", "Early", "Late"],
              ["Percussion over Traube's space", "Dull", "Resonant"],
              ["Can you get above it?", "No (ribs stop you)", "Yes"],
              ["Direction of enlargement", "Toward right iliac fossa", "Downward"],
            ],
          },
        ],
      },
      {
        heading: "9. Kidneys (ballotting)",
        blocks: [{ type: "paragraph", text: "One hand beneath, one on surface → push up on inspiration" }],
      },
      {
        heading: "10. Aorta",
        blocks: [{ type: "paragraph", text: "Place two fingers along midline above umbilicus → expansile pulsation = aneurysm (width >3 cm = dilated)" }],
      },
      {
        heading: "11. Percussion",
        blocks: [
          { type: "list", items: ["Liver: Upper border from 4th ICS; lower from costal margin. Normal height = 10 cm", "Spleen: Same technique"] },
        ],
      },
      {
        heading: "12. Ascites",
        blocks: [
          { type: "paragraph", text: "Shifting dullness: Percuss flank to flank → roll patient → dullness shifts = ascites present" },
          { type: "paragraph", text: "Fluid thrill: Patient's hand on midline; flick one flank, feel other → wave = severe ascites" },
          { type: "paragraph", text: "Causes of ascites:" },
          {
            type: "table",
            columns: ["Transudate (protein <30g/L)", "Exudate (protein >30g/L)"],
            rows: [
              ["Liver cirrhosis", "Malignancy (ovarian, breast)"],
              ["Heart failure", "TB"],
              ["Renal failure (nephrotic)", "Pancreatitis"],
              ["Constrictive pericarditis", "Serositis (SLE)"],
            ],
          },
        ],
      },
      {
        heading: "13. Auscultation",
        blocks: [
          {
            type: "list",
            items: [
              "Bowel sounds: Listen 30 seconds. Normal = 2–3/30 sec. Tinkling = obstruction. Absent = peritonitis/ileus",
              "Aortic bruit = arteriosclerosis / aneurysm",
              "Renal bruit = renal artery stenosis",
              "Hepatic bruit = hepatocellular carcinoma",
            ],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [{ type: "paragraph", text: "Request: PR examination, urine dipstick, inguinal/scrotal exam, observations chart" }],
      },
    ],
  },
  {
    slug: "gals-examination",
    title: "GALS Examination",
    category: "Musculoskeletal",
    icon: "PersonStanding",
    summary: "The 90-second screening exam for Gait, Arms, Legs, and Spine, with the gait-pathology differentials.",
    meta: { exposure: "Down to underwear, maintaining dignity" },
    order: ["Screening questions", "Gait", "Look", "Spine", "Arms", "Legs"],
    sections: [
      {
        heading: "Screening questions",
        intro: "Three questions to ask at the start of the exam:",
        blocks: [
          {
            type: "list",
            items: [
              "Do you have any pain or stiffness in your joints, muscles, or back?",
              "Can you dress yourself without difficulty?",
              "Do you have any difficulty going up or down stairs?",
            ],
          },
        ],
      },
      {
        heading: "Gait",
        blocks: [
          {
            type: "list",
            items: [
              "Ask the patient to walk to the wall, turn around, and walk back",
              "Check for symmetry, smoothness, and step height",
              "Observe the gait cycle (heel strike, toe-off) — is the turn smooth and quick?",
            ],
          },
          { type: "paragraph", text: "Gait pathology:" },
          {
            type: "table",
            columns: ["Gait", "What it can indicate"],
            rows: [
              ["Antalgic gait", "Stance phase abnormally shortened to reduce time on that foot — implies pain in that leg"],
              ["Waddling gait", "Upper body moves forwards, drags lower leg — weakness of proximal pelvic muscles (gluteus)"],
              ["Spastic gait", "Stiffness in the legs, tendency to circumduct the feet — upper motor neuron lesion"],
              ["Fixed flexion / hyperextended knee", "Occurs in polio, as patients have quadriceps wasting"],
              ["High-stepping gait", "Foot-drop due to loss of dorsiflexion — damage to the deep fibular nerve"],
              ["Trendelenburg's gait", "Support the patient's outstretched arms, ask them to stand on one leg — if the unsupported side of the pelvis drops, that's a positive Trendelenburg sign, indicating damage to gluteus medius on the supported side (superior gluteal nerve lesion)"],
            ],
          },
        ],
      },
      {
        heading: "Patient standing — look from front, side, and behind",
        blocks: [
          {
            type: "table",
            columns: ["View", "Area", "What to look for"],
            rows: [
              ["Front", "Posture", "Obvious asymmetry"],
              ["Front", "Shoulder", "Bulk and symmetry"],
              ["Front", "Elbow extension", "Carrying angle (normal is 5–15°)"],
              ["Front", "Leg length", "Leg length inequality"],
              ["Front", "Quadriceps", "Wasting in chronic joint disease"],
              ["Front", "Knees", "Erythema / hyperextension"],
              ["Front", "Ankle", "Swelling and erythema (inflammatory arthritis or sepsis)"],
              ["Front", "Feet", "Hallux valgus; midfoot deformity (flat feet)"],
              ["Side", "Cervical spine", "Hyperlordosis (spondylolisthesis, discitis, osteoporosis)"],
              ["Side", "Thoracic spine", "Hyperkyphosis (Scheuermann's kyphosis)"],
              ["Side", "Lumbar spine", "Hyperlordosis (sacroiliac joint disease)"],
              ["Side", "Foot arches", "Pes planus (flat feet) or pes cavus (high-arched feet)"],
              ["Side", "Toe clawing", "Plantar fascial fibromatosis"],
              ["Behind", "Shoulders", "Tenderness"],
              ["Behind", "Spine", "Scoliosis (S-shaped spine)"],
              ["Behind", "Iliac crest", "ASIS symmetry, pelvic tilt"],
              ["Behind", "Gluteal", "Wasting of gluteal muscles"],
              ["Behind", "Popliteal fossa", "Baker's cyst (non-pulsatile) or popliteal aneurysm (pulsatile)"],
              ["Behind", "Hind-foot", "Thickening of the Achilles' tendon"],
            ],
          },
        ],
      },
      {
        heading: "Spine",
        blocks: [
          {
            type: "list",
            items: [
              "Look at the spine for scoliosis, and from the side for abnormal lordosis/kyphosis",
              "Assess lateral flexion of the cervical spine: ask patient to tilt head to each side, ear towards shoulder",
              "Assess range of movement of the TMJ and deviation of the jaw",
              "Squeeze over the supraspinatus as a trigger point — indicates whether the patient has chronic pain",
              "Schober's test: mark two points over adjacent lumbar vertebral spines, ask patient to touch their toes, and look for expansion on flexion and the marks coming back together on extension (reduced flexion → ankylosing spondylitis)",
            ],
          },
        ],
      },
      {
        heading: "Arms",
        blocks: [
          {
            type: "list",
            items: [
              "Ask the patient to sit on the couch and put their hands behind their head (tests shoulder abduction, external rotation, elbow flexion)",
              "Ask the patient to hold hands out, palms down, fingers outstretched, to test extension of the joints",
              "Assess the backs of the hands for asymmetry, joint swelling, and deformity",
              "Gently squeeze across the metacarpophalangeal joints and assess for discomfort",
              "Ask the patient to turn their hands over so palms face up",
              "Assess muscle bulk of the palms for thenar/hypothenar wasting",
              "Ask the patient to make a fist to test range of movement of the small joints of the fingers",
              "Assess power and precision grip",
            ],
          },
        ],
      },
      {
        heading: "Legs",
        blocks: [
          {
            type: "list",
            items: [
              "Look at the quadriceps muscle bulk and assess for swellings/deformities",
              "Perform a patellar tap for knee effusion",
              "Assess passive flexion and extension of the knee",
              "Assess internal rotation of the hip",
              "Inspect the feet and squeeze the metatarsophalangeal joints to assess for pain — active inflammatory arthropathy",
            ],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Bloods: full blood count, U&Es, ESR, CRP, specific rheumatoid factors, and auto-antibodies." },
          { type: "paragraph", text: "Imaging: AP and lateral radiographs; MRI for soft tissue damage." },
          { type: "paragraph", text: "Special tests: joint aspiration and microscopy for crystals." },
        ],
      },
    ],
  },
  {
    slug: "knee-examination",
    title: "Knee Examination",
    category: "Musculoskeletal",
    icon: "Bone",
    summary: "Varus vs valgus, the lateral bulge and patellar tap tests, and the cruciate, collateral, and meniscal special tests.",
    meta: { position: "Standing to look, reclined to ~45° to feel", exposure: "Trousers removed" },
    order: ["Gait", "Look", "Feel", "Move", "Special tests"],
    sections: [
      {
        heading: "Bedside inspection",
        blocks: [
          { type: "paragraph", text: "Observe the surroundings: mobility aids, Zimmer frame, shoes (heel raises and supports). Look at the patient's hands discreetly — may indicate OA or RA." },
        ],
      },
      {
        heading: "Gait",
        blocks: [
          {
            type: "list",
            items: [
              "Ask the patient to walk to the wall, turn around, and walk back",
              "Check for symmetry, smoothness, and step height",
              "Observe the gait cycle (heel strike, toe-off) — is the turn smooth and quick?",
            ],
          },
          { type: "paragraph", text: "Gait pathology:" },
          {
            type: "table",
            columns: ["Gait", "What it can indicate"],
            rows: [
              ["Antalgic gait", "Stance phase abnormally shortened to reduce time on that foot — implies pain in that leg"],
              ["Ataxic gait", "Unsteady, staggering, uncoordinated walking — cerebellar lesion"],
              ["Festinant gait", "Short, accelerating steps, often on tip-toes — increased muscle tension, commonly Parkinson's disease"],
              ["Fixed flexion / hyperextended knee", "Occurs in polio, as patients have quadriceps wasting"],
              ["High-stepping gait", "Foot-drop due to loss of dorsiflexion — damage to the deep fibular nerve"],
              ["Trendelenburg's gait", "Pelvis drops on the unsupported side when standing on one leg — gluteus medius damage (superior gluteal nerve)"],
            ],
          },
        ],
      },
      {
        heading: "Look — inspect from front, side, and behind",
        blocks: [
          {
            type: "table",
            columns: ["View", "Sign", "What it may indicate"],
            rows: [
              ["Front", "Scars", "Previous surgery"],
              ["Front", "Swelling", "Effusions around the patella: sub- and supra-patellar cysts; psoriatic plaques"],
              ["Front", "Asymmetry / leg length discrepancy", "Growth arrest in childhood; patellar asymmetry"],
              ["Front", "Varus vs valgus", "Varus (more common) — medial compartment osteoarthritis; valgus (more common) — rheumatoid arthritis; also check fixed flexion/hyperextension"],
              ["Front", "Quadriceps bulk", "Wasting (sarcopenia)"],
              ["Side", "Foot deformity", "Pes cavus (high-arched) or pes planus (flat feet)"],
              ["Behind", "Asymmetry", "Check if the iliac crests are level"],
              ["Behind", "Hamstring bulk", "Check for sarcopenia"],
              ["Behind", "Popliteal swelling", "Popliteal aneurysm, Baker's cyst, semimembranosus cyst"],
            ],
          },
        ],
      },
      {
        heading: "Feel (patient reclined to ~45°)",
        blocks: [
          {
            type: "list",
            items: [
              "Temperature: back of hand, medially and laterally, comparing both knees — increased temperature suggests inflammation",
              "Offer to measure apparent and true leg length, and quadriceps circumference if there is asymmetry",
            ],
          },
          {
            type: "list",
            heading: "Effusion tests",
            items: [
              "Lateral bulge test: swipe fluid from the medial knee into the suprapatellar pouch, hold with one hand on the medial side, swipe down into the lateral side with the other — medial sulcus refilling suggests a (small) effusion",
              "Patellar tap: milk fluid down from the suprapatellar pouch (10cm above the patella), then press on the patella with the other hand — a palpable 'tap' on the underlying femur indicates a large effusion",
            ],
          },
          {
            type: "list",
            heading: "Palpate the joint line",
            items: [
              "Patella margins: palpate medial and lateral facets for tenderness and swing the patella side to side",
              "Medial and lateral aspects of the joint line",
              "Quadriceps tendon insertion into the patella — tenderness suggests tendonitis",
              "Tibial tuberosity — tenderness seen in Osgood-Schlatter disease",
              "Head of the fibula — identify any head-of-fibula fractures",
              "With the knee lax at 30°, feel the popliteal fossa",
            ],
          },
        ],
      },
      {
        heading: "Move",
        blocks: [
          {
            type: "list",
            heading: "Active movement",
            items: [
              "Flexion: ask patient to bend the knee as much as possible (normal is 135°)",
              "Extension: ask patient to straighten the leg and extend the knee as much as possible",
              "Check for hyperextension: ask patient to lift the heel off the bed (normal is 5°)",
            ],
          },
          {
            type: "list",
            heading: "Passive movement",
            items: [
              "Passively assess flexion and extension",
              "Hip internal rotation with the knee bent — excludes hip disease",
              "Hyperextension: elevate both legs by the heels and note any hyperextension (>10° is abnormal)",
            ],
          },
        ],
      },
      {
        heading: "Special tests",
        blocks: [
          {
            type: "list",
            heading: "Cruciate ligaments (knee flexed to 90°)",
            items: [
              "Anterior drawer: grasp the upper tibia (fingers in popliteal fossa, thumbs on tibial tuberosity) and pull forwards — abnormal anterior motion indicates ACL laxity",
              "Posterior drawer: push the tibia posteriorly to assess PCL laxity",
            ],
          },
          {
            type: "list",
            heading: "Collateral ligaments (knee extended to 10°)",
            items: ["MCL: apply outward pressure on the foot; LCL: apply inward pressure — movement >5–10° is abnormal"],
          },
          { type: "paragraph", text: "Meniscus: offer McMurray's test to assess for medial and lateral meniscal tears." },
        ],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Examine the neurovascular state of both limbs (pulse, sensation, proprioception) and the joints above and below (hip and ankle)." },
          { type: "paragraph", text: "Imaging: AP and lateral radiographs of the knee." },
        ],
      },
    ],
    examTips: ["McMurray's test assesses meniscal damage but can be painful to perform — warn the patient first."],
  },
  {
    slug: "hip-examination",
    title: "Hip Examination",
    category: "Musculoskeletal",
    icon: "Milestone",
    summary: "Trendelenburg's and Thomas' tests, true vs apparent leg length, and the same gait-pathology differentials as GALS.",
    meta: { exposure: "Trousers removed" },
    order: ["Gait", "Look", "Feel", "Move", "Special tests"],
    sections: [
      {
        heading: "Bedside inspection",
        blocks: [{ type: "paragraph", text: "Observe the surroundings: mobility aids, Zimmer frame, shoes (heel raises and supports)." }],
      },
      {
        heading: "Gait",
        blocks: [
          {
            type: "list",
            items: [
              "Ask the patient to walk to the wall, turn around, and walk back",
              "Check for symmetry, smoothness, and step height",
              "Observe the gait cycle (heel strike, toe-off) — is the turn smooth and quick?",
            ],
          },
          { type: "paragraph", text: "Gait pathology:" },
          {
            type: "table",
            columns: ["Gait", "What it can indicate"],
            rows: [
              ["Antalgic gait", "Stance phase abnormally shortened to reduce time on that foot — implies pain in that leg"],
              ["Waddling gait", "Upper body moves forwards, drags lower leg — weakness of proximal pelvic muscles (gluteus)"],
              ["Spastic gait", "Stiffness in the legs, tendency to circumduct the feet — upper motor neuron lesion"],
              ["Fixed flexion / hyperextended knee", "Occurs in polio, as patients have quadriceps wasting"],
              ["High-stepping gait", "Foot-drop due to loss of dorsiflexion — damage to the deep fibular nerve"],
              ["Trendelenburg's gait", "Pelvis drops on the unsupported side when standing on one leg — gluteus medius damage (superior gluteal nerve)"],
            ],
          },
        ],
      },
      {
        heading: "Patient standing — look from front, side, and behind",
        blocks: [
          {
            type: "table",
            columns: ["View", "Sign", "What it may indicate"],
            rows: [
              ["Front", "Scars", "Previous surgery"],
              ["Front", "Pelvic tilt", "Weakness of muscles on one side"],
              ["Front", "Asymmetry / leg length discrepancy", "Growth arrest in childhood"],
              ["Front", "Quadriceps wasting", "Wasting in chronic joint disease"],
              ["Side", "Foot deformity", "Pes cavus (high-arched) or pes planus (flat feet)"],
              ["Side", "Loss of lumbar lordosis", "Fixed flexion deformity"],
              ["Behind", "Gluteal wasting / scoliosis", "—"],
            ],
          },
          { type: "paragraph", text: "Asymmetry of the pelvic brim (\"dimples of Venus\"): sagittal symmetrical indentations sometimes visible on the lower back, just above the gluteal cleft, created by a short ligament stretching between the posterior superior iliac spine and the skin." },
          {
            type: "list",
            heading: "Trendelenburg's test",
            items: [
              "Stand in front of the patient and ask them to put outstretched hands on your arms for support",
              "Look for weakness of hip abductors and depression on that side — a positive sign (pelvis drops on the opposite side) suggests weakness of the gluteus medius/minimus",
            ],
          },
        ],
      },
      {
        heading: "Feel (patient reclined)",
        blocks: [
          { type: "list", items: ["Assess skin for scars and pigmentation", "Assess muscles for wasting and fasciculation"] },
          {
            type: "table",
            columns: ["Measurement", "How", "Meaning if unequal"],
            rows: [
              ["Apparent leg length", "Umbilicus to medial malleolus, both sides", "Suggests pelvic tilt from spinal/pelvic deformity"],
              ["True leg length", "ASIS to ipsilateral medial malleolus, both sides", "Suggests actual limb shortening (fracture, hip disease)"],
            ],
          },
          {
            type: "list",
            items: [
              "Palpate the anterior hip — temperature, tenderness, joint insertions (inflammation/infection)",
              "Feel for the greater trochanter — thumb on ASIS, move fingers down (trochanteric bursitis)",
            ],
          },
        ],
      },
      {
        heading: "Move",
        blocks: [
          {
            type: "list",
            heading: "Active movement",
            items: ["Place one hand under the lumbar spine to detect masking of hip movement by the spine", "Flexion: bring knee towards chest (normal ROM 120°)"],
          },
          {
            type: "list",
            heading: "Passive movement (roll each leg side to side to make the limb floppy)",
            items: [
              "Flexion: bring knee towards chest (normal ROM 120°)",
              "With hip and knee flexed to 90°: internal rotation (normal 30°), external rotation (normal 40°)",
              "Extension: one hand on the pelvis, lift one leg at a time (normal ROM 10–20°)",
            ],
          },
        ],
      },
      {
        heading: "Special tests",
        blocks: [
          {
            type: "list",
            heading: "Thomas' test — fixed flexion deformity (do not perform on hip replacements — can cause dislocation)",
            items: [
              "Place a hand under the patient's lumbar spine",
              "Ask the patient to bring both knees to their chest to flatten the lumbar lordosis",
              "Ask them to hold one knee and extend the other leg, then repeat on the other side",
              "A fixed flexion deformity prevents the leg from straightening (suggests osteoarthritis); the patient may compensate with increased lumbar lordosis (spine lifting off your hand)",
            ],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Examine the neurovascular state of both limbs, and the joints above and below (spine and knee), and check for hernias." },
          { type: "paragraph", text: "Imaging: AP and lateral radiographs." },
          { type: "paragraph", text: "Special tests: resisted hip flexion, adduction, and sensation of the antero-lateral thigh." },
        ],
      },
    ],
  },
  {
    slug: "shoulder-examination",
    title: "Shoulder Examination",
    category: "Musculoskeletal",
    icon: "Dumbbell",
    summary: "The rotator cuff special tests — empty can, infraspinatus, teres minor, subscapularis, and the scarf test.",
    meta: { exposure: "Shirt removed" },
    order: ["Look", "Feel", "Move", "Special tests"],
    sections: [
      {
        heading: "Look",
        intro: "Inspect the patient from the front, side, and back, asking them to turn as you do so.",
        blocks: [
          {
            type: "table",
            columns: ["View", "Sign", "What it can indicate"],
            rows: [
              ["Front", "Scars", "Previous surgery"],
              ["Front", "Asymmetry of shoulder girdle", "Scoliosis, arthritis, trauma"],
              ["Front", "Swelling", "Inflammatory joint disease"],
              ["Front", "Deltoid wasting", "Axillary nerve injury"],
              ["Front", "Arm position", "Internal rotation indicates posterior shoulder dislocation"],
              ["Behind", "Trapezius muscle bulk", "—"],
              ["Behind", "Back muscle bulk", "Check for sarcopenia"],
              ["Behind", "Winged scapula", "Damage to serratus anterior / long thoracic nerve"],
            ],
          },
        ],
      },
      {
        heading: "Feel",
        intro: "Check for pain first and start on the normal side. Using the back of the hand, check temperature over both shoulders.",
        blocks: [
          {
            type: "list",
            heading: "Assess the shoulder girdle",
            items: [
              "Sternoclavicular joint → along the clavicle → acromioclavicular joint",
              "Palpate the coracoid process",
              "Feel the head of humerus, working around the glenohumeral joint",
              "Start from the spine of scapula, working up to the acromioclavicular joint",
            ],
          },
          {
            type: "list",
            items: [
              "Assess the muscle bulk of supraspinatus, infraspinatus, and deltoid",
              "Ask the patient to flex the biceps and feel the tendon for biceps tendonitis",
            ],
          },
        ],
      },
      {
        heading: "Move",
        blocks: [
          {
            type: "list",
            heading: "Active movement",
            items: [
              "Quick screening test: arms above the head, then behind the back",
              "Neck movements: flexion, extension, turning, and tilting",
              'Flexion: "Can you raise your arm keeping it straight" (normal 180°)',
              "Extension: swing arms back (normal 65°)",
              "Abduction: raise each arm sideways, holding the inferior pole of the scapula",
              "Adduction: move arms across the body (normal 50°)",
              "External rotation: arm flexed to 90°, then turn outwards",
              "Internal rotation: hand on back, reach as far as possible (normal T4–T8)",
            ],
          },
          {
            type: "list",
            heading: "Passive movement (if abnormalities noted on active movement)",
            items: ["Ask the patient to relax and allow you to move the joint freely, feeling for crepitus", "Passively assess flexion, extension, abduction, adduction, external and internal rotation"],
          },
        ],
      },
      {
        heading: "Special tests",
        blocks: [
          {
            type: "list",
            heading: "Supraspinatus — empty can test",
            items: ["Flex the shoulder to 90°, thumbs pointing down, elbow slightly bent, resist a downward push on the ulnar side — tests for weakness/impingement of supraspinatus"],
          },
          { type: "list", heading: "Infraspinatus", items: ["Resisted external rotation in neutral adduction — pain may suggest infraspinatus tendonitis"] },
          { type: "list", heading: "Teres minor", items: ["Position the arm in 90° of abduction, bend the elbow to 90°, and passively externally rotate the shoulder to its maximum"] },
          {
            type: "list",
            heading: "Subscapularis",
            items: [
              "Ask the patient to place the dorsum of their hand on their lower back",
              "Apply light resistance towards their back, then ask them to lift their hand off",
              "Inability to do this indicates subscapularis pathology (tendonitis/tear)",
            ],
          },
          {
            type: "list",
            heading: "Scarf test",
            items: ["Put the patient's hand over their contralateral shoulder — pain over the acromioclavicular joint indicates osteoarthritis"],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Assess functional status and effect on activities of daily living." },
          { type: "paragraph", text: "Examine the joint above and below (cervical spine and elbow), and the neurovascular state of both limbs." },
          { type: "paragraph", text: "Imaging: AP and lateral radiographs of the shoulder." },
        ],
      },
    ],
  },
  {
    slug: "hand-examination",
    title: "Hand Examination",
    category: "Musculoskeletal",
    icon: "Grip",
    summary: "Swan-neck, Boutonnière, and Z-thumb deformities, and Tinel's and Phalen's tests for carpal tunnel syndrome.",
    meta: { exposure: "Sleeves rolled up" },
    order: ["Look", "Feel", "Move", "Special tests"],
    sections: [
      {
        heading: "Look",
        intro: "Ask the patient to stand and inspect from the front, side, and back.",
        blocks: [
          {
            type: "table",
            columns: ["Location", "Sign", "What it may indicate"],
            rows: [
              ["Dorsum of hand", "Scars", "Previous surgery/trauma"],
              ["Dorsum of hand", "Erythema", "Cellulitis, joint sepsis"],
              ["Dorsum of hand", "Skin thinning", "Long-term steroid use"],
              ["Dorsum of hand", "Bouchard's / Heberden's nodes", "Osteoarthritis"],
              ["Dorsum of hand", "Swan-neck / Boutonnière deformity, Z-thumb, ulnar deviation", "Rheumatoid arthritis"],
              ["Dorsum of hand", "Nail pitting / onycholysis", "Psoriasis"],
              ["Palms", "Skin colour, scars", "—"],
              ["Palms", "Thenar/hypothenar wasting", "Carpal tunnel syndrome"],
              ["Elbow", "Psoriatic plaques", "Psoriasis"],
            ],
          },
        ],
      },
      {
        heading: "Feel",
        intro: "Check for pain first and start on the normal side.",
        blocks: [
          {
            type: "list",
            heading: "Palms facing upwards",
            items: [
              "Temperature: back of hand, over wrists and small joints",
              "Radial and ulnar pulses",
              "Thenar/hypothenar eminence bulk",
              "Palmar thickening → Dupuytren's contracture",
            ],
          },
          {
            type: "list",
            heading: "Palms facing downwards",
            items: [
              "Temperature over wrists and small joints",
              "Squeeze the metacarpophalangeal joints",
              "Bimanually palpate the joints: MCP → PIP → DIP → carpometacarpal joint",
              "Palpate the anatomical snuffbox and feel the wrists for tenderness",
            ],
          },
          { type: "list", heading: "Elbows", items: ["Work up from the ulnar border to the elbow, assessing for nodules or psoriatic plaques"] },
          {
            type: "list",
            heading: "Sensation",
            items: [
              "Median nerve — thenar eminence, then index finger",
              "Ulnar nerve — hypothenar eminence, then little finger",
              "Radial nerve — first dorsal web space",
            ],
          },
        ],
      },
      {
        heading: "Move",
        blocks: [
          {
            type: "list",
            heading: "Active / passive movement",
            items: [
              "Flexion: make a fist",
              "Extension: open the fist and splay the fingers",
              "Wrist extension: hands together as if praying",
              "Wrist flexion: backs of the hands together",
              "Repeat all movements passively",
            ],
          },
          {
            type: "list",
            heading: "Motor assessment (against resistance)",
            items: ["Finger extension → radial nerve", "Finger abduction → ulnar nerve", "Thumb abduction → median nerve"],
          },
          {
            type: "list",
            heading: "Function",
            items: ['Power grip: "squeeze my fingers with your hand"', 'Pincer grip: "squeeze my finger between your thumb and index finger"', "Pick up a coin or undo a shirt button"],
          },
        ],
      },
      {
        heading: "Special tests",
        intro: "Both assess for carpal tunnel syndrome.",
        blocks: [
          {
            type: "list",
            heading: "Tinel's test",
            items: ["Tap over the carpal tunnel with your finger", "Tingling in the thumb and radial 2½ fingers suggests median nerve irritation/compression"],
          },
          {
            type: "list",
            heading: "Phalen's test",
            items: ["Ask the patient to hold their wrist in complete, forced flexion for 60 seconds", "Reproduction of carpal tunnel symptoms is a positive test"],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Examine the neurovascular state of the upper limbs and the joint above (elbow)." },
          { type: "paragraph", text: "Imaging: AP and lateral radiographs of the hand." },
        ],
      },
    ],
  },
  {
    slug: "cranial-nerve-examination",
    title: "Cranial Nerve Examination",
    category: "Neurological",
    icon: "Brain",
    summary: "All twelve nerves in order, the AFRO-C mnemonic for CN II, Bell's palsy, and Horner's syndrome.",
    meta: { position: "Sitting at 90 degrees, facing examiner at eye level" },
    sections: [
      {
        heading: "Nerves I–XII in order — use OOTT AFAV GAH",
        blocks: [
          {
            type: "table",
            columns: ["Number", "Nerve", "Key test"],
            rows: [
              ["I", "Olfactory", "Smell — peppermint/coffee"],
              ["II", "Optic — AFRO-C", "Acuity, Fields, Reflexes, Ophthalmoscopy, Colour"],
              ["III/IV/VI", "Oculomotor/Trochlear/Abducens", "Eye movements (H-pattern), pupil reflexes"],
              ["V", "Trigeminal", "Facial sensation (3 areas), motor (mastication)"],
              ["VII", "Facial", "Face expression (raise brows, screw eyes, show teeth, puff cheeks)"],
              ["VIII", "Vestibulocochlear", "Hearing (whisper test), Rinne's, Weber's"],
              ["IX/X", "Glossopharyngeal/Vagus", 'Gag reflex, uvula says "ahh"'],
              ["XI", "Accessory", "Shrug shoulders, turn head against resistance"],
              ["XII", "Hypoglossal", "Tongue protrusion (deviates to side of lesion)"],
            ],
          },
        ],
      },
      {
        heading: "Cranial nerve II — AFRO-C mnemonic",
        blocks: [
          {
            type: "list",
            heading: "A — Visual acuity (Snellen chart)",
            items: [
              "Test each eye separately, glasses on",
              "6/6 = normal. 6/60 = can only read at 6m what normal sees at 60m",
              "Legally blind = no light perception",
            ],
          },
          {
            type: "list",
            heading: "F — Visual fields (confrontation)",
            items: ["Sit opposite, cover opposite eyes, compare fields", "Red pin for blind spot and central scotoma"],
          },
          { type: "paragraph", text: "Visual field defects:" },
          {
            type: "table",
            columns: ["Defect", "Location of lesion"],
            rows: [
              ["Monocular loss", "Ipsilateral retina/optic nerve"],
              ["Bitemporal hemianopia", "Optic chiasm (pituitary adenoma)"],
              ["Homonymous hemianopia", "Optic tract / radiation / cortex (stroke)"],
              ["Upper quadrantanopia", "Lower temporal radiation"],
              ["Lower quadrantanopia", "Upper parietal radiation"],
              ["Homonymous hemianopia with macular sparing", "Occipital cortex (posterior cerebral artery)"],
            ],
          },
          {
            type: "list",
            heading: "R — Reflexes (pupils)",
            items: [
              "Direct & consensual: shine light → both pupils constrict",
              "Swinging light test: sustained constriction? Interrupted = RAPD (Marcus Gunn pupil = optic nerve damage)",
              "Accommodation: fixate far then near → pupils constrict",
            ],
          },
          { type: "paragraph", text: "O — Ophthalmoscopy (state you would perform)" },
          { type: "paragraph", text: "C — Colour vision (Ishihara plates)" },
          {
            type: "list",
            heading: "Visual inattention (parietal screen)",
            items: ["With both eyes open, waggle fingers of right hand, then left, then both together and ask which hand is moving — inattention to one side suggests a contralateral parietal lesion"],
          },
        ],
      },
      {
        heading: "Cranial nerves III/IV/VI — eye movements (H-test)",
        intro: "Move finger in H-shape, ask to follow without moving head.",
        blocks: [
          {
            type: "table",
            columns: ["Palsy", "Eye position", "Cause"],
            rows: [
              ["3rd nerve", "Down and out, dilated pupil, ptosis", "PCA aneurysm, diabetes"],
              ["4th nerve", "Diplopia on downward gaze", "Trauma, diabetes"],
              ["6th nerve", "Cannot abduct (look laterally)", "Raised ICP, CPA lesion"],
            ],
          },
          { type: "paragraph", text: "Internuclear ophthalmoplegia (INO): Cannot adduct ipsilateral eye + contralateral nystagmus = multiple sclerosis" },
        ],
      },
      {
        heading: "Cranial nerve V — trigeminal",
        blocks: [
          { type: "list", items: ["Inspect for temporalis and masseter wasting"] },
          {
            type: "list",
            heading: "Sensory",
            items: ["Use the sternum as a reference. Test supra-orbital notch, maxilla, and chin, comparing both sides, then touch both sides together to assess for sensory inattention (neglect)"],
          },
          {
            type: "list",
            heading: "Motor",
            items: ["Ask patient to clench jaw and feel temporalis and masseter muscle bulk; open and close mouth against resistance"],
          },
          { type: "paragraph", text: "Offer the corneal reflex (afferent Va, efferent VII) and jaw jerk reflex." },
        ],
      },
      {
        heading: "Cranial nerve VII — facial nerve",
        intro: "Upper vs lower motor neurone lesion:",
        blocks: [
          {
            type: "table",
            columns: ["Feature", "Upper MN (stroke)", "Lower MN (Bell's palsy)"],
            rows: [
              ["Forehead", "Spared (bilateral innervation)", "Affected"],
              ["Eye closure", "Normal", "Impaired"],
              ["Lower face", "Weak contralateral", "Weak same side"],
            ],
          },
          { type: "paragraph", text: "Bell's palsy mnemonic — BELL'S:" },
          {
            type: "definitions",
            items: [
              { term: "B", detail: "Blink reflex abnormal" },
              { term: "E", detail: "Earache" },
              { term: "L", detail: "Lacrimation (excess or absent)" },
              { term: "L", detail: "Loss of taste (anterior 2/3 tongue)" },
              { term: "S", detail: "Sudden onset" },
              { term: "'S", detail: "Palsy of all VII muscles ipsilateral" },
            ],
          },
          { type: "paragraph", text: "Ask if sounds are abnormally loud (hyperacusis = damage to stapedius). Offer to check taste sensation over the anterior 2/3 of the tongue (chorda tympani)." },
        ],
      },
      {
        heading: "Cranial nerve VIII — Rinne's and Weber's",
        blocks: [
          { type: "list", items: ["Crude hearing test: rustle fingers in one ear and whisper a number into the other — indicates whether there is a hearing deficit in either ear"] },
          { type: "paragraph", text: "Weber's (tuning fork on forehead): Normally central. Lateralises to:" },
          { type: "list", items: ["Same side = conductive loss that side", "Opposite side = sensorineural loss that side"] },
          { type: "paragraph", text: "Rinne's (mastoid then beside ear): Normally air conduction > bone conduction" },
          { type: "list", items: ["Positive (AC > BC) = Normal / sensorineural loss", "Negative (BC > AC) = Conductive loss on that side"] },
          { type: "callout", text: "Easy rule: Bone conduction should NEVER be louder than air conduction — if it is, that ear has conductive hearing loss." },
          { type: "paragraph", text: "Ask about vertigo/balance and offer Romberg's test, walking on the spot, and the Dix-Hallpike test if there's a history of positional vertigo." },
        ],
      },
      {
        heading: "Cranial nerves IX/X — uvula deviation",
        blocks: [{ type: "list", items: ["Uvula deviates away from the side of the lesion (glossopharyngeal nerve)"] }],
      },
      {
        heading: "Cranial nerve XII — tongue deviation",
        blocks: [
          {
            type: "list",
            items: ["Tongue deviates toward the side of the lesion (hypoglossal)", "Wasting + fasciculation = LMN (motor neurone disease)"],
          },
        ],
      },
      {
        heading: "Horner's syndrome — SAMPLE",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "S", detail: "Sympathetic fibres injured" },
              { term: "A", detail: "Anhydrosis (ipsilateral facial dryness)" },
              { term: "M", detail: "Miosis (pupil constriction)" },
              { term: "P", detail: "Ptosis (drooping eyelid)" },
              { term: "L", detail: "Loss of ciliospinal reflex" },
              { term: "E", detail: "Enophthalmos (sunken eye)" },
            ],
          },
          { type: "paragraph", text: "Causes: Pancoast tumour, carotid dissection, brainstem stroke, cluster headaches" },
        ],
      },
    ],
  },
  {
    slug: "upper-limb-neurological-examination",
    title: "Upper Limb Neurological Examination",
    category: "Neurological",
    icon: "Hand",
    summary: "TOP RaCk applied to the arm — tone, power with root values, reflexes, coordination, and dermatomes.",
    meta: { position: "Sitting upright — always check handedness first" },
    order: ["TOP RaCk", "+ Sensation"],
    sections: [
      {
        heading: "1. Inspection",
        intro: "Inspect resting position, raise arms to look in the axilla, and from behind. Ask the patient to hold out their arms and close their eyes (reveals tremor and involuntary movements) — mnemonic SWIFT-PH:",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "S", detail: "Scars — previous surgery or trauma" },
              { term: "W", detail: "Wasting — loss of innervation to muscles" },
              { term: "I", detail: "Involuntary movements — chorea, myoclonus, athetosis, pseudoathetosis" },
              { term: "F", detail: "Fasciculations — lower motor neurone lesions" },
              { term: "T", detail: "Tremor — fine or coarse; resting tremor in Parkinson's" },
              { term: "P", detail: "Posture — curvature of the spine" },
              { term: "H", detail: "Hypertrophy" },
            ],
          },
          {
            type: "list",
            items: [
              "Pronator drift test: Arms outstretched, palms up, eyes closed → slow pronation = pyramidal weakness (UMN)",
              "Upward drift + rebound = cerebellar disease",
            ],
          },
        ],
      },
      {
        heading: "2. Tone",
        intro: "Passively flex/extend wrists and elbows, supinate/pronate.",
        blocks: [
          {
            type: "table",
            columns: ["Tone", "Lesion"],
            rows: [
              ["Hypotonia", "LMN or cerebellar"],
              ["Spastic (clasp-knife)", "UMN"],
              ["Lead-pipe rigidity", "Extrapyramidal (Parkinson's)"],
              ["Cog-wheel", "Parkinson's tremor + lead-pipe"],
            ],
          },
        ],
      },
      {
        heading: "3. Power — key muscle groups and root values",
        blocks: [
          {
            type: "table",
            columns: ["Movement", "Muscle", "Root"],
            rows: [
              ["Shoulder abduction", "Deltoid", "C5"],
              ["Elbow flexion", "Biceps", "C6"],
              ["Elbow extension", "Triceps", "C7"],
              ["Wrist extension", "Radial nerve muscles", "C7"],
              ["Finger extension", "Extensor digitorum", "C7"],
              ["Finger flexion (grip)", "—", "C8"],
              ["Finger abduction", "Dorsal interossei", "T1 (Ulnar)"],
              ["Thumb abduction", "APB", "T1 (Median)"],
            ],
          },
          { type: "paragraph", text: "MRC power scale: 0 = nothing → 5 = normal (know all 6 grades)" },
        ],
      },
      {
        heading: "4. Reflexes",
        blocks: [
          {
            type: "table",
            columns: ["Reflex", "Root"],
            rows: [
              ["Biceps", "C5, C6"],
              ["Brachioradialis", "C5, C6"],
              ["Triceps", "C7"],
            ],
          },
          { type: "paragraph", text: "Hoffmann's reflex: Flick middle finger nail → thumb flexes = UMN sign" },
          { type: "paragraph", text: "Reflex grading: 0 = absent → 4++ = hyperactive with clonus" },
        ],
      },
      {
        heading: "5. Co-ordination",
        blocks: [
          {
            type: "list",
            items: [
              "Finger-nose test: Past-pointing (dysmetria) + intention tremor = cerebellar",
              "Dysdiadochokinesia: Rapid alternating hand movements — impaired = cerebellar",
            ],
          },
        ],
      },
      {
        heading: "6. Sensation",
        intro: "Always start distally, work proximally, compare both sides.",
        blocks: [
          { type: "paragraph", text: "Two tracts to test:" },
          {
            type: "table",
            columns: ["Tract", "Modalities", "Test"],
            rows: [
              ["Dorsal column", "Light touch, vibration, proprioception", "Cotton wool / 128Hz tuning fork / joint position"],
              ["Spinothalamic", "Pain, temperature", "Pin prick / cold tuning fork"],
            ],
          },
          {
            type: "list",
            heading: "Key dermatomes (upper limb)",
            items: ["C5 = lateral arm", "C6 = thumb and index finger", "C7 = middle finger", "C8 = ring and little finger", "T1 = medial forearm"],
          },
          {
            type: "list",
            heading: "Peripheral nerve sensory areas",
            items: [
              "Median nerve → thenar eminence",
              "Ulnar nerve → hypothenar eminence",
              "Radial nerve → anatomical snuff box (dorsum of hand, base of thumb)",
            ],
          },
          { type: "paragraph", text: "Glove distribution = peripheral neuropathy (diabetes, alcohol)" },
          { type: "paragraph", text: "Froment's test (ulnar palsy): ask the patient to grip a piece of paper between thumb and index finger — loss of adductor pollicis causes the thumb to flex instead." },
        ],
      },
      {
        heading: "UMN vs LMN signs (must know)",
        blocks: [
          {
            type: "table",
            columns: ["Feature", "LMN", "UMN"],
            rows: [
              ["Tone", "Hypotonia", "Spasticity"],
              ["Reflexes", "Reduced/absent", "Brisk/hyperactive"],
              ["Wasting", "Present", "Absent (early)"],
              ["Fasciculations", "Present", "Absent"],
              ["Clonus", "Absent", "Present (>5 beats)"],
              ["Plantars", "Downgoing", "Upgoing (Babinski)"],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "lower-limb-neurological-examination",
    title: "Lower Limb Neurological Examination",
    category: "Neurological",
    icon: "Footprints",
    summary: "Root values for hip-to-toe power, the reflex nursery rhyme, gait patterns, and Romberg's test.",
    meta: { position: "45 degrees, then lying flat", exposure: "From waist down" },
    order: ["TOP RaCk", "+ Sensation", "+ Gait", "+ Romberg's"],
    sections: [
      {
        heading: "Inspection",
        intro: "Look closely for plantar foot wasting, dorsal foot guttering (LMN lesion), and bony deformity (pes cavus) — mnemonic SWIFT-PH:",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "S", detail: "Scars — previous surgery or trauma" },
              { term: "W", detail: "Wasting — loss of innervation to muscles" },
              { term: "I", detail: "Involuntary movements — chorea, myoclonus, athetosis, pseudoathetosis" },
              { term: "F", detail: "Fasciculations — lower motor neurone lesions" },
              { term: "T", detail: "Tremor — fine or coarse; resting tremor in Parkinson's" },
              { term: "P", detail: "Posture — curvature of the spine" },
              { term: "H", detail: "Hypertrophy" },
            ],
          },
        ],
      },
      {
        heading: "1. Power — lower limb root values",
        blocks: [
          {
            type: "table",
            columns: ["Movement", "Muscle", "Root"],
            rows: [
              ["Hip flexion", "Iliopsoas", "L1/2"],
              ["Hip extension", "Gluteus maximus", "S1"],
              ["Knee extension", "Quadriceps", "L3/4"],
              ["Knee flexion", "Hamstrings", "L5, S1"],
              ["Ankle dorsiflexion", "Tibialis anterior", "L4"],
              ["Ankle plantarflexion", "Gastrocnemius/Soleus", "S1"],
              ["Big toe extension", "Extensor hallucis longus", "L5"],
            ],
          },
        ],
      },
      {
        heading: "2. Reflexes — mnemonic \"1234567\"",
        blocks: [
          {
            type: "table",
            columns: ["Rhyme", "Tests"],
            rows: [
              ["One, two, buckle my shoe", "S1, S2 — ankle reflex"],
              ["Three, four, kick the door", "L3, L4 — knee reflex"],
              ["Five, six, pick up sticks", "C5, C6 — biceps + brachioradialis reflex"],
              ["Seven, eight, shut the gate", "C7 — triceps reflex"],
            ],
          },
          { type: "paragraph", text: "Babinski (plantar) response:" },
          {
            type: "list",
            items: [
              "Stroke lateral sole with orange stick",
              "Normal (downgoing) = toes flex (normal adult)",
              "Abnormal (upgoing) = big toe extends + other toes fan = UMN sign",
            ],
          },
          { type: "paragraph", text: "Clonus: Sharply dorsiflex foot → >3–5 beats = UMN" },
        ],
      },
      {
        heading: "3. Co-ordination",
        blocks: [{ type: "list", items: ["Heel-shin test: Run heel down shin smoothly — jerky = cerebellar"] }],
      },
      {
        heading: "4. Gait (very important)",
        intro: "Ask to walk to end of room, turn, return. Then heel-to-toe.",
        blocks: [
          {
            type: "list",
            items: [
              "Stand on toes — tests S1, sciatic nerve power, plantarflexors",
              "Stand on heels — tests L4/5; impaired in foot drop",
            ],
          },
          {
            type: "table",
            columns: ["Gait", "Condition"],
            rows: [
              ["Wide-based", "Cerebellar ataxia"],
              ["Scissor gait", "Spastic diplegia (CP)"],
              ["Festinant (shuffling, small steps)", "Parkinson's disease"],
              ["High-stepping (foot drop)", "Common peroneal nerve palsy, L4/5"],
              ["Antalgic (limping)", "Pain"],
              ["Hemiplegic (arm flexed, leg extended)", "Stroke"],
              ["Waddling", "Proximal myopathy"],
            ],
          },
        ],
      },
      {
        heading: "5. Romberg's test",
        intro: "Stand feet together, eyes open → then eyes closed.",
        blocks: [
          {
            type: "list",
            items: [
              "Positive (falls with eyes closed) = proprioceptive loss (dorsal column), not cerebellar",
              "Cerebellar: Ataxia already present with eyes open — Romberg's negative (or cannot do test)",
            ],
          },
        ],
      },
      {
        heading: "Key dermatomes (lower limb)",
        blocks: [
          {
            type: "list",
            items: [
              "L1 = inner thigh/groin",
              "L2 = anterior thigh proximal",
              "L3 = medial distal thigh",
              "L4 = medial lower leg (shin)",
              "L5 = big toe, dorsum of foot",
              "S1 = little toe, lateral foot, heel",
              "S2 = posterior thigh",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "cerebellar-examination",
    title: "Cerebellar Examination",
    category: "Neurological",
    icon: "Compass",
    summary: "The DANISH-Pastry mnemonic, why signs are ipsilateral, and the differentials from stroke to Wilson's disease.",
    sections: [
      {
        heading: "Mnemonic for what to test: DANISH-Pastry",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "D", detail: "Dysdiadochokinesia — rapid alternating hand movements" },
              { term: "A", detail: "Ataxia — truncal (sitting), gait (walking), limb (arms)" },
              { term: "N", detail: "Nystagmus — fast phase away from lesion in cerebellar" },
              { term: "I", detail: "Intention tremor — finger-nose test" },
              { term: "S", detail: 'Slurred speech — "Baby Hippopotamus", "British Constitution"' },
              { term: "H", detail: "Hypotonia — reduced tone" },
              { term: "Pastry", detail: "Pendular reflexes + Past-pointing" },
            ],
          },
        ],
      },
      {
        heading: "Key points",
        blocks: [
          {
            type: "list",
            items: [
              "Cerebellar signs are IPSILATERAL to the lesion",
              "Nystagmus: fast phase toward the side of the lesion (horizontal nystagmus, maximal at extremes)",
              "Intention tremor: Gets worse as finger approaches target",
              "Dysdiadochokinesia: Cannot do rapid alternating movements smoothly",
              "DANISH: all these signs on the same side as the lesion",
            ],
          },
        ],
      },
      {
        heading: "Differential diagnosis of cerebellar disease",
        blocks: [
          {
            type: "table",
            columns: ["Cause", "Clue"],
            rows: [
              ["Stroke (PICA)", "Unilateral, Wallenberg's syndrome"],
              ["Multiple sclerosis", "Young patient, optic neuritis, bilateral signs"],
              ["Alcohol", "Bilateral, chronic, social history"],
              ["Anti-epileptic drugs (phenytoin)", "Drug history for epilepsy"],
              ["Thiamine deficiency (Wernicke's)", "Confusion + ataxia + ophthalmoplegia"],
              ["Paraneoplastic", "Weight loss, smoker, anti-Yo antibodies"],
              ["Wilson's disease", "Kayser-Fleischer rings, psychiatric features"],
              ["Friedrich's ataxia", "Young patient, pes cavus, family history"],
            ],
          },
          {
            type: "list",
            items: [
              "Unilateral signs: space-occupying lesion (tumour/abscess — a cerebellopontine angle tumour also impairs CN V, VII, VIII and can cause papilloedema) or ischaemia (vertebrobasilar disease)",
              "Bilateral signs: drugs (phenytoin), alcohol, multiple sclerosis, hypothyroidism, trauma",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "speech-examination",
    title: "Speech Examination",
    category: "Special senses & speech",
    icon: "MessageCircle",
    summary: "Telling dysphasia, dysarthria and dysphonia apart, and testing Broca's, Wernicke's, and bulbar palsy.",
    meta: { position: "Sitting upright" },
    sections: [
      {
        heading: "Before you start",
        blocks: [{ type: "paragraph", text: 'First ask: "Are you hard of hearing? Is English your first language?"' }],
      },
      {
        heading: "4 types of speech disorder",
        blocks: [
          {
            type: "table",
            columns: ["Type", "Lesion", "Key feature"],
            rows: [
              ["Broca's (expressive) dysphasia", "Inferior frontal lobe (left)", "Knows what they want to say but can't — frustrated, hesitant"],
              ["Wernicke's (receptive) dysphasia", "Superior temporal lobe (left)", 'Fluent but meaningless "word salad" — unaware of error'],
              ["Conductive dysphasia", "Arcuate fasciculus", "Can speak and understand but CANNOT REPEAT"],
              ["Nominal aphasia", "Diffuse/global", "Cannot name objects (global dementia, stroke)"],
            ],
          },
          { type: "paragraph", text: "Testing each type:" },
          {
            type: "list",
            items: [
              'Wernicke\'s (receptive): "Please put your left index finger on your nose and then your right ear" (3-stage command)',
              "Broca's (expressive): Ask to write a sentence — assess nouns and structure",
              "Nominal: Name objects (watch, pen) or name 5 animals",
              'Conductive: "Repeat after me: No ifs, ands, or buts"',
            ],
          },
        ],
      },
      {
        heading: "Dysarthria (slurred speech — no language problem)",
        intro: "Ask to say:",
        blocks: [
          {
            type: "list",
            items: [
              '"La, la, la" = tongue (CN XII)',
              '"Ma, ma, ma" = lips (CN VII)',
              '"Ka, ka, ka" = palate (CN IX/X)',
              'Then: "Baby Hippopotamus" and "British Constitution"',
            ],
          },
          { type: "paragraph", text: "Staccato speech (each syllable equal emphasis) = cerebellar" },
        ],
      },
      {
        heading: "Dysphonia (voice quality change)",
        intro: "Ask to cough",
        blocks: [
          {
            type: "list",
            items: [
              "Bovine cough = recurrent laryngeal nerve palsy",
              "Quiet voice = Parkinson's disease",
              "Nasal speech = bulbar palsy",
              "Donald Duck voice = pseudobulbar palsy",
              "Hoarse voice = myasthenia gravis, laryngeal nerve palsy",
            ],
          },
        ],
      },
      {
        heading: "Bulbar vs pseudobulbar palsy",
        blocks: [
          {
            type: "table",
            columns: ["Feature", "Bulbar palsy", "Pseudobulbar palsy"],
            rows: [
              ["MN type", "LMN", "UMN"],
              ["Tongue", "Wasted + fasciculations", "Spastic, cannot protrude"],
              ["Speech", "Nasal, slurred", '"Donald Duck" voice'],
              ["Jaw jerk", "Absent", "Brisk"],
              ["Affect", "Normal", "Emotional lability"],
              ["Causes", "MND, Guillain-Barré, brainstem stroke", "Bilateral strokes, MS, MND"],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "eye-examination",
    title: "Eye Examination",
    category: "Special senses & speech",
    icon: "Eye",
    summary: "Visual acuity notation, fundoscopy findings, and grading diabetic and hypertensive retinopathy.",
    meta: { position: "Sitting opposite patient at eye level" },
    order: ["Inspect", "Acuity", "Fields", "Pupils", "Eye movements", "Fundoscopy"],
    sections: [
      {
        heading: "1. Inspection",
        blocks: [
          {
            type: "list",
            items: [
              "Wearing glasses? Nasal indentations?",
              "Symmetry: Ptosis, proptosis, squint?",
              "Pull lower lid down: Pallor (anaemia) or icterus (jaundice)",
            ],
          },
        ],
      },
      {
        heading: "2. Visual acuity (Snellen chart)",
        intro: "Test each eye separately at 6 metres with glasses.",
        blocks: [
          { type: "paragraph", text: "Snellen notation: 6/X where X = distance normal person reads that line" },
          {
            type: "list",
            items: [
              "6/6 = normal",
              "6/60 = very reduced",
              "CF = count fingers",
              "HM = hand movements",
              "PL = light perception only",
              "NLP = no light perception = legally blind",
            ],
          },
          { type: "paragraph", text: "If <6/6 → use pinhole → improves = refractive error (needs glasses)" },
        ],
      },
      {
        heading: "3. Visual fields (confrontation)",
        blocks: [{ type: "paragraph", text: "See Cranial Nerve II in the Cranial Nerve Examination station." }],
      },
      {
        heading: "4. Pupillary reflexes",
        blocks: [{ type: "paragraph", text: "See Cranial Nerve II in the Cranial Nerve Examination station." }],
      },
      {
        heading: "5. Eye movements — H-test",
        blocks: [{ type: "paragraph", text: "See Cranial Nerves III/IV/VI in the Cranial Nerve Examination station." }],
      },
      {
        heading: "6. Fundoscopy",
        blocks: [
          { type: "paragraph", text: "Red reflex: Shine light from 12 inches away at pupil. Absent red reflex = cataract." },
          { type: "paragraph", text: "What to observe on fundoscopy:" },
          {
            type: "table",
            columns: ["Feature", "Normal", "Abnormal"],
            rows: [
              ["Optic disc", "Pink, sharp margins, cup-disc ratio 0.3", "Pale = optic atrophy; blurred margins = papilloedema; ratio >0.5 = glaucoma"],
              ["Vessels", "A:V ratio 2:3", "Nipping, silver/copper wiring = hypertension"],
              ["Retina", "Uniform orange-red", "Haemorrhages, exudates, cotton-wool spots = diabetes/hypertension"],
              ["Macula", "Darker, avascular", "Cherry-red spot = CRAO"],
            ],
          },
          {
            type: "paragraph",
            text: "Diabetic retinopathy: Microaneurysms (first sign), dot-blot haemorrhages, hard exudates, cotton-wool spots, new vessel formation",
          },
          { type: "paragraph", text: "Hypertensive retinopathy (Keith-Wagener grading):" },
          {
            type: "definitions",
            items: [
              { term: "Grade I", detail: "Silver wiring" },
              { term: "Grade II", detail: "AV nipping" },
              { term: "Grade III", detail: "Flame haemorrhages + cotton-wool spots" },
              { term: "Grade IV", detail: "Papilloedema" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "ear-examination",
    title: "Ear Examination",
    category: "Special senses & speech",
    icon: "Ear",
    summary: "Free-field hearing, otoscopy technique, tympanic membrane colours, and conductive vs sensorineural loss.",
    meta: { position: "Sitting upright — examine good ear first" },
    order: ["Inspect", "Hearing test", "Rinne's", "Weber's", "Otoscopy"],
    sections: [
      {
        heading: "1. Inspect pinna and surrounding area",
        blocks: [{ type: "list", items: ["Surgical scars, discharge, lesions, erythema"] }],
      },
      {
        heading: "2. Hearing test (free field)",
        blocks: [
          {
            type: "list",
            items: [
              "Stand behind patient, mask non-tested ear by rubbing fingers",
              "Whisper letters/numbers at arm's length",
              "Repeat 3 times if error",
            ],
          },
        ],
      },
      {
        heading: "3. Rinne's and Weber's",
        blocks: [{ type: "paragraph", text: "See Cranial Nerve VIII in the Cranial Nerve Examination station." }],
      },
      {
        heading: "4. Otoscopy",
        blocks: [
          {
            type: "list",
            items: [
              "Hold like a pen, right hand for right ear",
              "Pull pinna upward and backward",
              "Inspect canal: inflammation, wax, foreign body",
            ],
          },
          { type: "paragraph", text: "Inspect tympanic membrane:" },
          {
            type: "table",
            columns: ["TM colour", "Meaning"],
            rows: [
              ["Pearly grey", "Normal"],
              ["Gold/blue", "Fluid in middle ear (glue ear)"],
              ["White", "Tympanosclerosis (scarring)"],
              ["Red/bulging", "Otitis media"],
            ],
          },
          { type: "paragraph", text: "Note: Malleus, umbo, light reflex, pars tensa, pars flaccida, attic (early cholesteatoma)" },
          { type: "paragraph", text: "Grommet = visible in anteroinferior quadrant (for glue ear)" },
        ],
      },
      {
        heading: "Conductive vs sensorineural hearing loss",
        blocks: [
          {
            type: "table",
            columns: ["Feature", "Conductive", "Sensorineural"],
            rows: [
              ["Weber's", "Lateralises to bad ear", "Lateralises to good ear"],
              ["Rinne's", "BC > AC (negative)", "AC > BC (positive but reduced)"],
              ["Causes", "Wax, OM, otosclerosis", "Noise, aging (presbyacusis), drugs (aminoglycosides), acoustic neuroma, Menière's"],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "nose-examination",
    title: "Nose Examination",
    category: "Special senses & speech",
    icon: "ScanFace",
    summary: "External and internal inspection, sinus palpation, patency testing, and nasopharyngeal carcinoma red flags.",
    meta: { position: "Sitting upright" },
    order: ["Inspect external", "Inspect internal", "Palpate sinuses", "Patency", "Smell"],
    sections: [
      {
        heading: "1. External inspection",
        intro: "Look from front, side, and from behind (for deviation)",
        blocks: [
          {
            type: "list",
            items: [
              "Skin lesions (BCC, melanoma)",
              "Discharge (clear/coloured/blood)",
              "Obvious deviation",
              "Saddle-shaped nose = trauma or granulomatosis with polyangiitis (Wegener's)",
              "Vestibule: raise tip of nose — cartilaginous collapse = cocaine use",
            ],
          },
        ],
      },
      {
        heading: "2. Internal inspection (nasal speculum/otoscope)",
        intro: "Look at: septum, inferior and middle turbinates, mucosa",
        blocks: [
          {
            type: "list",
            items: [
              "Nasal polyps (bilateral = inflammatory, unilateral = biopsy to exclude malignancy)",
              "Perforation, ulceration, active bleeding",
            ],
          },
        ],
      },
      {
        heading: "3. Sinus palpation",
        intro: "Press thumbs over:",
        blocks: [
          { type: "list", items: ["Frontal sinuses (supraorbital)", "Maxillary sinuses (infraorbital) — tenderness = sinusitis"] },
        ],
      },
      {
        heading: "4. Nasal patency",
        blocks: [{ type: "paragraph", text: "Ask to exhale on a cold tongue depressor — condensation from both = both patent" }],
      },
      {
        heading: "5. Smell (CN I)",
        intro: "Use peppermint or coffee — test each nostril separately",
        blocks: [
          {
            type: "list",
            heading: "Loss of smell (anosmia)",
            items: [
              "Unilateral: Nasal polyp, tumour, nasal deviation",
              "Bilateral: Common cold (most common), Parkinson's disease (early symptom), trauma (cribriform plate damage), Kallmann syndrome (congenital)",
            ],
          },
        ],
      },
      {
        heading: "Nasopharyngeal carcinoma — NOSE",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "N", detail: "Neck mass" },
              { term: "O", detail: "Obstructed nasal passage" },
              { term: "S", detail: "Serous otitis media" },
              { term: "E", detail: "Epistaxis or discharge" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "arterial-circulation-examination",
    title: "Arterial Circulation Examination",
    category: "Advanced",
    icon: "Activity",
    summary: "Arterial vs venous ulcers, peripheral pulses, Buerger's test, and reading the ABPI.",
    meta: { position: "Lying flat", exposure: "Both legs fully" },
    order: ["Inspect", "Temperature", "Capillary refill", "Pulses", "Bruits", "Buerger's test", "ABPI"],
    sections: [
      {
        heading: "1. Inspection",
        intro: "Look for arterial changes:",
        blocks: [
          {
            type: "table",
            columns: ["Sign", "Meaning"],
            rows: [
              ["White/blue/purple/black discolouration", "Arterial insufficiency"],
              ["Trophic changes (shiny skin, hair loss, dry skin)", "Chronic ischaemia"],
              ["Gangrene or black patches", "Critical ischaemia"],
              ["Ulcers", "Arterial vs venous"],
              ["Amputated toes", "Advanced PVD"],
            ],
          },
          { type: "paragraph", text: "Check pressure points: Heel, malleoli, first metatarsal head, between toes" },
          { type: "paragraph", text: "Arterial vs venous vs diabetic ulcers:" },
          {
            type: "table",
            columns: ["Feature", "Arterial", "Venous", "Diabetic"],
            rows: [
              ["Why it occurs", "Atherosclerosis", "Venous stasis", "Glycosylation of the extracellular matrix"],
              ["Location", "Toes, heel, pressure points (lateral leg)", "Gaiter area, around the malleoli", "Sole of the foot"],
              ["Edges / base", "Punched-out, regular margins", "Sloping, irregular margins; pale surrounding skin; haemosiderin pigmentation", "Penetrating ulcer on toes"],
              ["Painful", "Yes (severe, better dependent)", "Yes (ache, better with elevation)", "No — reduced sensation"],
              ["Associations", "Cold extremities, trophic changes (shiny skin, hair loss)", "Often peripheral oedema, warm skin", "Reduced sensation in surrounding skin, infected nails (fungal)"],
            ],
          },
        ],
      },
      {
        heading: "2. Temperature",
        blocks: [{ type: "paragraph", text: "Run back of hand from proximal to distal — note where temperature drops" }],
      },
      {
        heading: "3. Capillary refill",
        blocks: [{ type: "paragraph", text: "Press big toe nail for 2 seconds — normal return <2 seconds" }],
      },
      {
        heading: "4. Peripheral pulses (compare both sides)",
        blocks: [
          {
            type: "table",
            columns: ["Pulse", "Location"],
            rows: [
              ["Femoral", "Midpoint inguinal ligament"],
              ["Popliteal", "Back of knee (flex knee, press deep with thumbs)"],
              ["Posterior tibial", "Behind medial malleolus (Pimentel's point)"],
              ["Dorsalis pedis", "First web space, dorsum of foot"],
            ],
          },
        ],
      },
      {
        heading: "5. Auscultation for bruits",
        intro: "Listen over: femoral artery, aorta, renal arteries",
        blocks: [{ type: "list", items: ["Bruit = stenosis/turbulent flow"] }],
      },
      {
        heading: "6. Buerger's test (critical ischaemia)",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Raise legs to 45 degrees — normally stays pink. Pallor on elevation = critical ischaemia. Note the angle at which pallor occurs — Buerger's angle (normal >90°, <20° = critical ischaemia). Ideally hold for 2–3 minutes; a practical shortcut is 4 second intervals for each 10° raised.",
              "Sit patient up with legs hanging down over the edge of the bed. Normal legs turn pink immediately; an ischaemic leg turns pink slowly then becomes dark red/purple after ~2 minutes (reactive hyperaemia from hypoxic vasodilation) — Buerger's positive.",
            ],
          },
        ],
      },
      {
        heading: "7. ABPI (ankle brachial pressure index)",
        blocks: [
          { type: "list", items: ["Measure systolic BP at ankle and arm (Doppler)", "ABPI = ankle systolic / brachial systolic"] },
          {
            type: "table",
            columns: ["ABPI", "Interpretation"],
            rows: [
              [">1.0", "Normal (or calcified vessels — diabetics)"],
              ["0.9–1.0", "Borderline"],
              ["0.5–0.9", "Claudication"],
              ["<0.5", "Critical ischaemia"],
              ["<0.3", "Rest pain / limb threatening"],
            ],
          },
        ],
      },
      {
        heading: "Fontaine classification of PVD",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "Stage I", detail: "Asymptomatic" },
              { term: "Stage II", detail: "Intermittent claudication" },
              { term: "Stage III", detail: "Rest pain" },
              { term: "Stage IV", detail: "Tissue loss (ulceration/gangrene)" },
            ],
          },
        ],
      },
      {
        heading: "Risk factors for peripheral arterial disease",
        blocks: [{ type: "list", items: ["Smoking (most important), diabetes, hypertension, hypercholesterolaemia, family history, obesity"] }],
      },
      {
        heading: "Finish",
        blocks: [{ type: "paragraph", text: "Request: Doppler USS, CT angiography, ABPI, urine dipstick for blood glucose/protein" }],
      },
    ],
  },
  {
    slug: "diabetic-foot-examination",
    title: "Diabetic Foot Examination",
    category: "Advanced",
    icon: "Syringe",
    summary: "Charcot joints, monofilament sensation testing, and the diabetic ulcer pattern on the sole of the foot.",
    meta: { exposure: "Undress from the waist down, underwear on" },
    order: ["Gait", "Legs", "Palpation", "Pulses", "Sensation", "Reflexes"],
    sections: [
      {
        heading: "Bedside inspection",
        blocks: [{ type: "paragraph", text: "Observe the surroundings: walking aids, special footwear, orthotics, blood sugar monitoring." }],
      },
      {
        heading: "Gait",
        blocks: [
          { type: "paragraph", text: "Ask the patient to walk to the wall, turn around, and come back — comment on swing, stance, heel strike, turn cycle, and any other abnormalities." },
          {
            type: "list",
            heading: "Romberg's test",
            items: [
              "Ask the patient to put feet together and close their eyes while standing",
              "Reduced stability with eyes closed (+ve) → proprioceptive/dorsal column dysfunction",
              "Reduced stability with eyes open (-ve) → cerebellar ataxia",
            ],
          },
          { type: "paragraph", text: "Inspect the patient's shoes — soles, padding, worn tread." },
        ],
      },
      {
        heading: "Legs (patient sits with legs outstretched)",
        intro: "Inspect front and back of the legs, comparing sides, and inspect between the toes:",
        blocks: [
          {
            type: "table",
            columns: ["What to look for", "What it can indicate"],
            rows: [
              ["Scars", "Vessel harvesting for previous cardiovascular surgery"],
              ["Colour", "Cyanosis/pallor — peripheral vascular disease"],
              ["Loss of digits", "May indicate previous critical ischaemia/gangrene"],
              ["Ulcers", "Describe margin, colour, wet/dry, and location"],
              ["Skin trophic changes", "Associated with peripheral ischaemia"],
              ["Charcot joint", "Consequence of diabetic neuropathy"],
            ],
          },
          { type: "paragraph", text: "Gross motor assessment: ask the patient to wiggle their toes — indicates paralysis due to ischaemia." },
        ],
      },
      {
        heading: "Palpation",
        blocks: [
          {
            type: "list",
            items: [
              "Temperature: back of the hand, toes upwards, comparing sides",
              "Capillary refill: should be <2s — delayed if poor peripheral circulation",
            ],
          },
        ],
      },
      {
        heading: "Pulses",
        intro: "Poor peripheral pulses suggest ischaemia/poor circulation.",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Femoral pulse",
              "Popliteal pulse",
              "Posterior tibial — 1cm posterior to the medial malleolus of the tibia",
              "Dorsalis pedis — dorsum of foot between the 2nd/3rd cuneiforms",
            ],
          },
        ],
      },
      {
        heading: "Sensation",
        blocks: [
          {
            type: "list",
            ordered: true,
            items: [
              "Monofilament: pulp of hallux, then pulp of 3rd digit, then metatarsophalangeal joints of 1, 3, and 5",
              "Vibration on the distal interphalangeal joint of the hallux",
              "Proprioception of the distal interphalangeal joint of the hallux",
            ],
          },
        ],
      },
      {
        heading: "Reflexes",
        blocks: [{ type: "paragraph", text: "Ankle reflex." }],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Offer a full history, full set of observations, and a peripheral vascular and lower limb neurological examination." },
          { type: "paragraph", text: "Bedside tests: urinalysis + urine albumin:creatinine ratio, blood glucose, fundoscopy, ECG." },
          { type: "paragraph", text: "Bloods: FBC, U&E, albumin:creatinine ratio, HbA1c, lipid profile." },
          { type: "paragraph", text: "Further tests (if required): duplex USS with ABPI, CT or MR angiography." },
        ],
      },
    ],
  },
  {
    slug: "parkinsons-examination",
    title: "Parkinson's Examination",
    category: "Advanced",
    icon: "Waves",
    summary: "Resting vs postural vs kinetic tremor, bradykinesia testing, and the Parkinson-plus red flags.",
    sections: [
      {
        heading: "Focused questions",
        blocks: [
          {
            type: "list",
            items: [
              "What happened when you first presented with this condition? How is it affecting you?",
              "When is your tremor worst?",
              "Do you have any problems with balance or co-ordination, doing up buttons and tying shoelaces, or getting in and out of your car?",
            ],
          },
        ],
      },
      {
        heading: "Bedside inspection",
        blocks: [
          { type: "paragraph", text: "Observe the surroundings for mobility aids. Do they have a resting tremor?" },
        ],
      },
      {
        heading: "Gait",
        intro: "Ask the patient to stand up with arms folded (tests proximal weakness), then walk to the wall, turn around, and come back.",
        blocks: [
          {
            type: "list",
            items: [
              "Check symmetry, smoothness, step height, swing, stance, heel strike, and turn (is it smooth and quick?)",
              "Shuffling gait (reduced stride length)",
              "Hesitant (difficulty initiating and turning)",
              "Festinating (walks faster and faster to avoid falling)",
              "Lack of arm swing (occasionally due to increased tone)",
              "Unsteadiness (tendency to fall forward or backward)",
              "Stooped posture",
            ],
          },
        ],
      },
      {
        heading: "Face",
        blocks: [
          {
            type: "list",
            items: [
              'Face: hypomimia ("mask face" — blank, expressionless, reduced blinking)',
              "Eyes: glabellar tap (tap the forehead — Myerson's sign, a sign of frontal release, is abnormal if it doesn't habituate)",
              "Speech: ask patient to describe the room — hypophonia (soft, faint, slow, hard to understand)",
            ],
          },
        ],
      },
      {
        heading: "Tremors",
        blocks: [
          {
            type: "list",
            items: [
              "Resting tremor: typical 'pill-rolling' appearance, asymmetrical, 4–6 Hz",
              "Postural tremor: occurs maintaining a position against gravity, worsens with active movement",
              "Kinetic tremor: assess with the finger-nose test — simple kinetic tremor stays constant through movement; intention tremor worsens as the patient approaches the target",
            ],
          },
        ],
      },
      {
        heading: "Focused upper limb",
        blocks: [
          {
            type: "list",
            items: [
              "Tone: ask patient to relax so you can passively move them — assess elbow flexion/extension, supinator catch, and wrist flexion/extension/rotation",
              "An activation manoeuvre can accentuate subtle rigidity in early Parkinson's — ask the patient to tap their thigh with the contralateral arm while you test tone",
            ],
          },
          {
            type: "table",
            columns: ["Sign", "Significance"],
            rows: [
              ["Supinator catch", "Indicative of UMN lesions"],
              ["Increased vs decreased tone", "UMN vs LMN lesion"],
              ["Cogwheel rigidity", "Parkinson's disease (extrapyramidal disorders)"],
            ],
          },
          {
            type: "list",
            heading: "Bradykinesia",
            items: [
              "Finger tapping: oppose thumb and forefinger repeatedly, as fast as possible",
              "Hand grip: make a fist and open the hand wide repeatedly, as fast as possible",
              "Pronation/supination: pronate and supinate the hand repeatedly, as fast as possible",
              "Watch for: progressive reduction in speed, progressive reduction in amplitude, asymmetry, slowness initiating movement",
            ],
          },
        ],
      },
      {
        heading: "Focused lower limb",
        blocks: [
          {
            type: "list",
            heading: "Bradykinesia",
            items: ["Toe tap: keep the heel on the ground and tap the toes against the floor while seated, as fast as possible"],
          },
        ],
      },
      {
        heading: "Extras",
        blocks: [
          {
            type: "list",
            items: [
              "Writing: ask the patient to write a sentence and draw a spiral, to assess for asymmetric progressive micrographia",
              "Buttons: ask the patient to undo and do up their top shirt button, to assess dexterity and speed of movement",
            ],
          },
          {
            type: "list",
            heading: "Parkinson-plus syndromes",
            items: [
              "Assess eye movements with the H-test",
              "Problems in up/down gaze → progressive supranuclear palsy",
              "Problems side-to-side with nystagmus → multiple system atrophy",
            ],
          },
        ],
      },
      {
        heading: "Finish",
        blocks: [
          { type: "paragraph", text: "Full set of observations, including lying and standing blood pressure." },
          { type: "paragraph", text: "Perform a cerebellar examination and assess eye movements for progressive supranuclear palsy." },
          { type: "paragraph", text: "Perform a cognitive assessment (e.g. MMSE)." },
        ],
      },
    ],
  },
];

export function getStation(slug) {
  return stations.find((station) => station.slug === slug) || null;
}

export function getAdjacentStations(slug) {
  const index = stations.findIndex((station) => station.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? stations[index - 1] : null,
    next: index < stations.length - 1 ? stations[index + 1] : null,
  };
}
