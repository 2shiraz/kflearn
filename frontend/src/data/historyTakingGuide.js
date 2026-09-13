// Static content for the History Taking Guide section.
//
// This is reference/study material transcribed from the MBBS History Taking
// study guide (docs/mbbs_history_taking_guide_md.docx). It is intentionally
// NOT stored in the database: it never changes per-user, isn't authored
// through the admin CMS, and has no attempts/scoring attached to it — unlike
// HistoryModule content, it's just a static reference page. Keeping it as a
// bundled data file avoids a network round trip and a loading skeleton for
// content that is the same for every viewer and rarely edited. If this ever
// needs in-app editing by non-developers, it can be migrated into the
// existing admin content model later without changing the page components
// (they only care about this module's exported shape).

export const universalOpening = {
  title: "How to start every history",
  subtitle: "The Universal Opening",
  intro: "Every history station begins the same way. Never skip these three steps:",
  steps: [
    { label: "Introduce yourself", detail: '"Hello, I\'m Dr. X, a Foundation Year doctor."' },
    { label: "Get name & age", detail: '"Could I ask your name and age?"' },
    { label: "Get occupation", detail: '"What do you do for work?"' },
  ],
  closing: 'Then open with: "What has brought you in today?" — always start with an open question.',
};

// The three mnemonics the source guide singles out as appearing in every station.
export const coreMnemonics = [
  {
    id: "socrates",
    name: "SOCRATES",
    subtitle: "For any pain",
    type: "table",
    columns: ["Letter", "Meaning", "Question to ask"],
    rows: [
      ["S", "Site", "Where exactly is the pain? Can you point to it?"],
      ["O", "Onset", "When did it start? Suddenly or gradually?"],
      ["C", "Character", "What does it feel like? Sharp, dull, burning, crushing?"],
      ["R", "Radiation", "Does it spread anywhere?"],
      ["A", "Associated symptoms", "Anything else with the pain?"],
      ["T", "Timing", "How long does it last? Is it constant or does it come and go?"],
      ["E", "Exacerbating / Relieving", "What makes it worse? What makes it better?"],
      ["S", "Severity", "On a scale of 1–10, how bad is it?"],
    ],
  },
  {
    id: "hose-pipers",
    name: "HOSE PIPERS",
    subtitle: "Social history — same in every station",
    type: "table",
    columns: ["Letter", "Meaning", "Ask about"],
    rows: [
      ["H", "Home", "House or flat? Stairs? Who lives with you? Condition of home?"],
      ["O", "Occupation", "Job? Exposures — dust, gas, metals, animals?"],
      ["S", "Smoking", "Do you smoke? How many/day? How many years?"],
      ["E", "Ethanol", "How many units/week? >21 (men) or >14 (women) → ask about dependence"],
      ["P", "Psych", "How is your mood? How are you sleeping?"],
      ["I", "Independence", "Do you need help with dressing, washing, feeding? Carers?"],
      ["P", "Pets", "Any pets at home?"],
      ["E", "Expeditions", "Travel abroad? Africa/Asia/South America? Insect bites?"],
      ["R", "Recreational drugs", 'Use signposting: "I\'m going to ask some sensitive questions..."'],
      ["S", "Sexual history", "Number of partners? Protected sex? HIV risk factors?"],
    ],
  },
  {
    id: "mjthreads",
    name: "MJTHREADS",
    subtitle: "Past medical history — same in every station",
    type: "definitions",
    items: [
      { term: "M", detail: "Myocardial infarction" },
      { term: "J", detail: "Jaundice" },
      { term: "T", detail: "Tuberculosis" },
      { term: "H", detail: "Hypertension / High cholesterol" },
      { term: "R", detail: "Rheumatic fever" },
      { term: "E", detail: "Epilepsy" },
      { term: "A", detail: "Asthma / Angina" },
      { term: "D", detail: "Diabetes" },
      { term: "S", detail: "Stroke" },
    ],
  },
];

export const generalApproach = {
  title: "General medical history",
  subtitle: "What to cover in any medical station",
  sections: [
    {
      heading: "History of presenting complaint",
      blocks: [
        {
          type: "list",
          items: [
            'Open question: "What has brought you to hospital today?"',
            "For every symptom ask: When did it start? Getting better or worse? Had it before?",
            "Pain → use SOCRATES",
            "Shortness of breath (SOB) → use ONE RESPS",
          ],
        },
      ],
    },
    {
      heading: "Concerns & impact",
      blocks: [
        {
          type: "list",
          items: [
            '"Do you have any particular worries about your symptoms?"',
            '"How has this affected your daily life and your family?"',
          ],
        },
      ],
    },
    {
      heading: "Associated history",
      blocks: [
        {
          type: "list",
          items: [
            "Past medical history → MJTHREADS",
            "Previous hospital admissions?",
            "Drug history: current medications, over-the-counter drugs, allergies",
            "Family history: similar illnesses? Diabetes? Heart disease?",
            "Social history → HOSE PIPERS",
          ],
        },
      ],
    },
    {
      heading: "Systems review",
      blocks: [
        { type: "paragraph", text: "Ask about all systems at the end:" },
        {
          type: "list",
          items: [
            "Constitutional: weight loss, night sweats, rashes, lumps",
            "Cardiovascular: chest pain, palpitations, leg swelling",
            "Respiratory: SOB, cough, sputum, haemoptysis",
            "Neurological: headaches, fits, weakness, numbness",
            "GI: appetite, vomiting, abdominal pain, bowel changes",
            "Endocrine: menstrual history, hair loss, heat/cold intolerance",
            "GU: frequency, dysuria, haematuria",
            "Musculoskeletal: joint/muscle/bone pain",
          ],
        },
      ],
    },
  ],
  examTip: 'Always finish with — "I\'m going to run through a quick list to make sure I haven\'t missed anything."',
};

// The nine presenting-complaint / station-specific topics, in document order.
export const topics = [
  {
    slug: "rheumatological-history",
    title: "Rheumatological History",
    icon: "Bone",
    summary: "Five extra questions after SOCRATES, extra-articular red flags, and the GROSS past-history mnemonic.",
    sections: [
      {
        heading: "The rheumatology focus: 5 extra questions",
        intro: "After the standard pain history (SOCRATES), always add:",
        blocks: [
          {
            type: "table",
            columns: ["Question", "Why it matters"],
            rows: [
              ["Stiffness — morning or evening? Gets worse or better?", "Morning stiffness >1 hr → Rheumatoid Arthritis"],
              ["Swelling — constant or comes and goes?", "Persistent = inflammatory"],
              ["Distribution — mono/oligo/polyarticular? Symmetrical?", "RA = symmetrical polyarticular"],
              ["Function — can you dress, comb hair, cook, climb stairs?", "Assesses disability"],
              ["Extra-articular features (see below)", "Points to specific diagnosis"],
            ],
          },
        ],
      },
      {
        heading: "Extra-articular features to ask",
        blocks: [
          {
            type: "list",
            items: [
              "Fingers go white in cold (Raynaud's)?",
              "Dry eyes (Sjögren's)?",
              "Bloody diarrhoea (IBD)?",
              "Urethral discharge (Reiter's / reactive arthritis)?",
              "Rash, hair loss, photosensitivity (SLE)?",
            ],
          },
        ],
      },
      {
        heading: "Past medical history extras for rheumatology",
        intro: "Use GROSS in addition to MJTHREADS:",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "G", detail: "Gout" },
              { term: "R", detail: "Rheumatoid arthritis" },
              { term: "O", detail: "Osteoarthritis" },
              { term: "S", detail: "SLE" },
              { term: "S", detail: "Sarcoidosis" },
            ],
          },
        ],
      },
      {
        heading: "Drug history extra",
        blocks: [{ type: "paragraph", text: "Ask about diuretics (can cause gout) and hydralazine (can cause SLE-like syndrome)." }],
      },
      {
        heading: "Family history extra",
        blocks: [{ type: "paragraph", text: "Ask about psoriasis (linked to psoriatic arthritis)." }],
      },
      {
        heading: "Sexual history extra (rheumatology specific)",
        blocks: [
          {
            type: "list",
            items: [
              "Pregnancies and miscarriages (important in antiphospholipid syndrome / SLE)",
              "Recent STI symptoms (important in reactive arthritis)",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "chest-pain",
    title: "Chest Pain",
    icon: "HeartPulse",
    summary: "SOCRATES for cardiac vs pleuritic vs aortic pain, cardiac risk factors, and the differentials examiners expect.",
    sections: [
      {
        heading: "Use SOCRATES for chest pain",
        intro: "Critical questions to not miss:",
        blocks: [
          {
            type: "list",
            items: [
              "Site: Central/retrosternal → cardiac. Lateral, pleuritic → PE or pneumonia.",
              "Radiation: Left arm/jaw → ACS. Back/between shoulder blades → aortic dissection.",
              "Character: Crushing → ACS. Tearing → dissection. Sharp on breathing → PE/pericarditis.",
              "Relieving factors: GTN relieves angina. Sitting forward relieves pericarditis.",
              "Exacerbating: Exercise → angina. Deep breath → PE/pleurisy. Eating → oesophageal/GORD.",
            ],
          },
        ],
      },
      {
        heading: "Cardiac risk factors to always ask",
        blocks: [
          {
            type: "list",
            items: ["Diabetes, smoking, hypertension, high cholesterol, family history of IHD, obesity, stress, lack of exercise"],
          },
        ],
      },
      {
        heading: "Differential diagnoses — know these",
        blocks: [
          {
            type: "table",
            columns: ["Diagnosis", "Key features"],
            rows: [
              ["Angina / ACS", "Central crushing pain, radiation to left arm/jaw, relieved by GTN (angina) or not (ACS)"],
              ["Pericarditis", "Retrosternal, worse lying down, better sitting forward and leaning forward"],
              ["Pulmonary Embolus (PE)", "Pleuritic (worse on inspiration), tachycardia, recent travel/surgery/immobility"],
              ["Aortic Dissection", "Tearing pain, radiates to back, BP difference between arms >20 mmHg"],
              ["Musculoskeletal", "Reproducible on palpation/movement"],
            ],
          },
        ],
      },
      {
        heading: "Past medical history extra",
        blocks: [{ type: "paragraph", text: "Ask about previous DVTs or PEs." }],
      },
    ],
    examTips: [
      "PE risk factors: prolonged bed rest, surgery, OCP, pregnancy, thrombophilia (Factor V Leiden, antiphospholipid syndrome), long-haul flights.",
    ],
  },
  {
    slug: "breathlessness",
    title: "Breathlessness",
    icon: "Wind",
    summary: "The ONE RESPS mnemonic for dyspnoea, heart-failure vs respiratory clues, and the AAAA PPPP differentials.",
    sections: [
      {
        heading: "Use ONE RESPS mnemonic for dyspnoea",
        blocks: [
          {
            type: "table",
            columns: ["Letter", "Meaning", "Question"],
            rows: [
              ["O", "Onset", "When did it start? Always there or comes and goes?"],
              ["N", "Nature", "Constant or episodic?"],
              ["E", "Exercise", "How far can you walk? How far before? Stairs?"],
              ["R", "Relieving", "What makes it better? Resting? Inhalers?"],
              ["E", "Exacerbating", "Worse lying flat (orthopnoea)? Allergen?"],
              ["S", "Sleep", "Wakes you at night (PND — paroxysmal nocturnal dyspnoea)?"],
              ["P", "Pillows", "How many pillows? Has this increased?"],
              ["S", "Symptoms", "Cough? Wheeze? Chest pain? Fever? Ankle swelling?"],
            ],
          },
        ],
      },
      {
        heading: "Key questions for breathlessness",
        blocks: [
          {
            type: "list",
            items: [
              "Orthopnoea (worse lying flat) → Heart failure",
              "PND (wakes from sleep breathless) → Heart failure",
              "Ankle swelling → Heart failure",
              "Wheeze → Asthma/COPD",
              "Haemoptysis + weight loss → Lung cancer/TB",
              "Occupational exposure → Asbestos (mesothelioma), coal dust (pneumoconiosis)",
            ],
          },
        ],
      },
      {
        heading: "Differential diagnoses — AAAA PPPP",
        blocks: [
          {
            type: "list",
            items: ["Airway obstruction", "Angina pectoris", "Anxiety", "Asthma", "Pneumonia", "Pneumothorax", "Pulmonary oedema", "Pulmonary embolus"],
          },
        ],
      },
      {
        heading: "Supporting features to distinguish causes",
        blocks: [
          {
            type: "list",
            items: [
              "Asthma: episodic wheeze, cough worse at night, atopy history, allergen trigger",
              "COPD: chronic productive cough, significant smoking history, recurrent chest infections",
              "Pulmonary oedema: orthopnoea, PND, ankle oedema, frothy sputum, cardiac history",
              "Pneumonia: fever, productive cough, pleuritic chest pain, green/yellow sputum",
              "Lung cancer: smoker, weight loss, haemoptysis, hoarse voice, Horner's syndrome",
            ],
          },
        ],
      },
    ],
    examTips: ["In this station, if the patient is a coal miner, always ask specifically about occupational exposures — especially asbestos and coal dust."],
  },
  {
    slug: "loss-of-consciousness",
    title: "Loss of Consciousness (LOC)",
    icon: "Zap",
    summary: "Before/during/after phases, and telling seizure, syncope, and postural hypotension apart.",
    sections: [
      {
        heading: "Divide into three phases: before, during, after",
        blocks: [
          {
            type: "list",
            heading: "Before the episode",
            items: [
              "What were you doing? (standing? exerting? straining? coughing?)",
              "Any warning? Did you know it was coming?",
              "Chest pain or palpitations beforehand?",
              "Visual aura (zigzag/flashing lights)?",
              "Nausea, sweating, dizziness, feeling lightheaded?",
            ],
          },
          {
            type: "list",
            heading: "During the episode",
            items: [
              "How long were you unconscious?",
              "Did anyone witness it?",
              "Any shaking / jerking of limbs?",
              "Did you wet yourself (urinary incontinence)?",
              "Did you bite your tongue?",
            ],
          },
          {
            type: "list",
            heading: "After the episode",
            items: [
              "How did you feel when you woke up?",
              "Confused / drowsy afterwards (post-ictal state → epilepsy)?",
              "Headache?",
              "How much do you remember?",
            ],
          },
        ],
      },
      {
        heading: "Has it happened before?",
        blocks: [{ type: "paragraph", text: "Always ask whether this has happened before, and if so, how often and in what circumstances." }],
      },
      {
        heading: "Differential diagnoses",
        blocks: [
          {
            type: "table",
            columns: ["Diagnosis", "Key features"],
            rows: [
              ["Grand mal seizure", "Sudden onset, witnessed jerking, tongue bite, urinary incontinence, post-ictal drowsiness 30–60 min"],
              ["Vasovagal syncope", "Presyncope warning (nausea, sweating, lightheadedness), patient protects themselves falling, instant recovery when supine"],
              ["Cardiac syncope", "Sudden without warning, may injure themselves, chest pain/palpitations before, slow recovery"],
              ["Postural hypotension", "On standing from sitting/lying, history of antihypertensive drugs"],
            ],
          },
        ],
      },
    ],
    examTips: ["Ask about driving — legal requirement to inform the DVLA if epilepsy is diagnosed (a common exam discussion point)."],
  },
  {
    slug: "headaches",
    title: "Headaches",
    icon: "Brain",
    summary: "SOCRATES for headache, thunderclap and red-flag features, and telling SAH, migraine, tension and cluster apart.",
    sections: [
      {
        heading: "Use SOCRATES for headaches",
        intro: "Critical extra questions:",
        blocks: [
          {
            type: "list",
            items: [
              "Any neck stiffness / photophobia / phonophobia? → Meningitis/SAH",
              'Worst headache of your life, sudden onset ("thunderclap")? → Subarachnoid haemorrhage (SAH)',
              "Visual disturbance / scalp tenderness / jaw pain on chewing (jaw claudication)? → Temporal arteritis",
              "Worse in morning, worse with coughing/bending → Raised intracranial pressure",
              "Unilateral with nausea, vomiting, photophobia, preceded by aura (zigzag lights)? → Migraine",
              'Very severe, unilateral, "ice-pick" pain behind one eye, watery eye, runny nose → Cluster headache',
            ],
          },
        ],
      },
      {
        heading: "Dietary triggers (migraine)",
        blocks: [{ type: "paragraph", text: "Always ask: cheese, chocolate, yoghurt, tea, coffee, red wine" }],
      },
      {
        heading: "Special extras",
        blocks: [
          {
            type: "list",
            items: ["Recent head injury?", "Any weakness, numbness, or speech changes → space-occupying lesion", "Relation to menstrual cycle → catamenial migraine"],
          },
        ],
      },
      {
        heading: "Differential diagnoses",
        blocks: [
          {
            type: "table",
            columns: ["Type", "Key clue"],
            rows: [
              ["SAH", '"Worst headache of my life", sudden, occipital'],
              ["Migraine", "Unilateral, throbbing, aura, nausea, photophobia, lasts hours"],
              ["Tension", "Bilateral, band-like, stress-related, no other features"],
              ["Cluster", "Unilateral, severe, behind one eye, tears, nasal congestion, in clusters"],
              ["Temporal arteritis", ">60 years, palpable temporal artery, jaw claudication, ESR raised, amaurosis fugax"],
              ["Raised ICP", "Morning headache, vomiting without nausea, visual changes, papilloedema"],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "general-surgical-history",
    title: "General Surgical History",
    icon: "Scissors",
    summary: "Lump, vomiting and bowel-habit questions, plus what vomit colour and stool appearance actually suggest.",
    sections: [
      {
        heading: "Pain",
        blocks: [{ type: "paragraph", text: "Use SOCRATES (constant vs. colicky — important surgically)." }],
      },
      {
        heading: "Lump",
        blocks: [
          {
            type: "list",
            items: ["When first noticed? Where? Getting bigger?", "Painful to touch? Lumps elsewhere?"],
          },
        ],
      },
      {
        heading: "Vomiting",
        blocks: [
          { type: "list", items: ["How much and how often?", "Colour of vomit?"] },
          {
            type: "table",
            columns: ["Vomit colour", "Suggests"],
            rows: [
              ["Bile-coloured", "Small bowel obstruction"],
              ["Faeculent", "Large bowel/distal small bowel obstruction"],
              ["Blood-red", "Oesophageal varices, gastric/duodenal ulcers"],
              ["Coffee ground", "Bleeding from stomach"],
            ],
          },
        ],
      },
      {
        heading: "Bowels",
        blocks: [
          { type: "list", items: ["Frequency? Change in bowel habit?", "Blood in stool? What type?"] },
          {
            type: "table",
            columns: ["Stool appearance", "Suggests"],
            rows: [
              ["Dark tarry (melaena)", "Upper GI bleed (stomach, duodenum, oesophagus)"],
              ["Pale, bulky, difficult to flush", "Fat malabsorption — coeliac, chronic pancreatitis"],
              ["Fresh red, painless, on toilet paper", "Haemorrhoids"],
              ["Fresh red, painful", "Anal fissure"],
              ["Blood mixed with stool", "Colorectal cancer, UC, diverticulitis"],
            ],
          },
        ],
      },
      {
        heading: "Surgical history",
        blocks: [{ type: "paragraph", text: "Previous operations? Any anaesthetic reactions?" }],
      },
      {
        heading: "Family history extra",
        blocks: [{ type: "paragraph", text: "Colorectal cancer? Adenomatous polyposis?" }],
      },
    ],
  },
  {
    slug: "urological-history-haematuria",
    title: "Urological History (Haematuria)",
    icon: "Droplet",
    summary: "The BONDS mnemonic for blood in the urine, the PIS mnemonic for LUTS, and occupational bladder-cancer risk.",
    sections: [
      {
        heading: "Use BONDS mnemonic for haematuria",
        blocks: [
          {
            type: "table",
            columns: ["Letter", "Meaning", "Question"],
            rows: [
              ["B", "Blood (amount)", "How much blood? Any clots?"],
              ["O", "Onset", "When did you first notice it?"],
              ["N", "Number", "How many times has it happened?"],
              ["D", "Duration", "Is it always there or comes and goes?"],
              ["S", "Stream (when)", "At the beginning, middle, or end of the stream?"],
            ],
          },
          { type: "paragraph", text: "When in stream: Start = urethral | Throughout = bladder/kidneys | End = bladder neck/prostate" },
        ],
      },
      {
        heading: "PIS mnemonic for full urological history",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "P — Pain", detail: "abdominal pain, loin/back pain (kidney stones, metastatic disease)" },
              { term: "I — Infection", detail: "frequency, dysuria, nocturia, urgency" },
              { term: "S — Stream", detail: "hesitancy, poor flow, dribbling, incomplete emptying" },
            ],
          },
        ],
      },
      {
        heading: "Occupational exposure (key for this station)",
        blocks: [
          {
            type: "list",
            items: [
              "Retired printer → ask about aniline dyes and rubber exposure (bladder cancer risk)",
              "Also ask about smoking (bladder cancer risk)",
            ],
          },
        ],
      },
      {
        heading: "Differential diagnoses for haematuria",
        blocks: [
          {
            type: "table",
            columns: ["Diagnosis", "Key clues"],
            rows: [
              ["Bladder cancer", "Painless haematuria, smoker, occupational exposure to dyes"],
              ["UTI", "Dysuria, frequency, urgency, fever"],
              ["Renal stones", "Severe colicky loin-to-groin pain, small amounts of blood"],
              ["Renal cell carcinoma", "Loin pain, haematuria, abdominal mass (classic triad)"],
              ["Prostatitis / BPH", "Storage LUTS (frequency, urgency, nocturia) + voiding LUTS (hesitancy, poor flow)"],
              ["Glomerulonephritis", "HTN, oedema, recent URTI, frothy urine"],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "abdominal-pain",
    title: "Abdominal Pain",
    icon: "CircleDot",
    summary: "SOCRATES for the abdomen, pain by location, GET SMASHED for pancreatitis causes, and Charcot's triad.",
    sections: [
      {
        heading: "Use SOCRATES for abdominal pain",
        intro: "Critical extra questions:",
        blocks: [
          {
            type: "list",
            items: [
              "Nausea/vomiting? Relation to food?",
              "Jaundice? (yellow skin or eyes)",
              "Change in bowel habit? Blood in stool?",
              "Change in urine colour?",
              "Weight loss / anorexia?",
              "Gynaecological history in women (LMP, vaginal discharge, dyspareunia)",
            ],
          },
        ],
      },
      {
        heading: "Differential diagnoses by location",
        blocks: [
          {
            type: "table",
            columns: ["Region", "Likely diagnosis"],
            rows: [
              ["Right iliac fossa", "Appendicitis"],
              ["Right upper quadrant", "Biliary colic, cholecystitis, cholangitis"],
              ["Epigastric", "Peptic ulcer, pancreatitis, GORD"],
              ["Left lower quadrant", "Diverticulitis, bowel cancer"],
              ["Central / periumbilical", "Appendicitis (early), small bowel obstruction"],
              ["Loin → groin", "Renal colic (ureteric stones)"],
            ],
          },
        ],
      },
      {
        heading: "Acute pancreatitis causes — GET SMASHED",
        blocks: [
          {
            type: "definitions",
            items: [
              { term: "G", detail: "Gallstones" },
              { term: "E", detail: "Ethanol" },
              { term: "T", detail: "Trauma" },
              { term: "S", detail: "Steroids" },
              { term: "M", detail: "Mumps" },
              { term: "A", detail: "Autoimmune" },
              { term: "S", detail: "Scorpion sting" },
              { term: "H", detail: "Hyperlipidaemia / hypercalcaemia" },
              { term: "E", detail: "ERCP" },
              { term: "D", detail: "Drugs" },
            ],
          },
        ],
      },
      {
        heading: "Charcot's triad (cholangitis)",
        blocks: [{ type: "paragraph", text: "Right upper quadrant pain + Jaundice + Fever" }],
      },
    ],
  },
  {
    slug: "breast-lump",
    title: "Breast Lump",
    icon: "Ribbon",
    summary: "Lump, pain and discharge questions, breast-cancer risk factors, and the fibroadenoma-vs-cyst-vs-abscess differentials.",
    sections: [
      {
        heading: "The lump",
        blocks: [
          {
            type: "list",
            items: [
              "When/how was it noticed? Which breast?",
              "Size? Texture (smooth vs. craggy/irregular)?",
              "Associated skin changes? Peau d'orange? Nipple inversion?",
              "Trauma?",
              "Changed over time? Other lumps?",
            ],
          },
        ],
      },
      {
        heading: "Pain",
        blocks: [
          { type: "list", items: ["Any pain? Unilateral or bilateral?", "Is it related to menstrual cycle?"] },
        ],
      },
      {
        heading: "Discharge",
        blocks: [
          {
            type: "list",
            items: [
              "Any nipple discharge? Colour?",
              "Blood-stained → cancer/intraductal papilloma",
              "Yellow/green → infection",
              "Milky (non-lactating) → hyperprolactinaemia",
            ],
          },
        ],
      },
      {
        heading: "Menstrual & hormonal history",
        blocks: [
          {
            type: "list",
            items: ["LMP? Regular periods?", "Children? Breastfeeding?", "Oral contraceptive pill? HRT use?", "Could you be pregnant?"],
          },
        ],
      },
      {
        heading: "Risk factors for breast cancer (must know)",
        blocks: [
          {
            type: "list",
            items: [
              "Age, female sex",
              "First-degree relative with breast cancer",
              "BRCA1 / BRCA2 gene mutations",
              "Early menarche / late menopause",
              "First pregnancy after age 30 / nulliparity",
              "HRT (especially combined)",
              "Obesity, alcohol use, radiation exposure",
            ],
          },
        ],
      },
      {
        heading: "Differential diagnoses",
        blocks: [
          {
            type: "table",
            columns: ["Diagnosis", "Key features"],
            rows: [
              ["Breast cancer", "Hard, irregular, craggy, fixed, skin changes, axillary nodes, painless"],
              ["Fibroadenoma", 'Young woman (<30), smooth, mobile "breast mouse", not fixed, no skin changes'],
              ["Cyst", "Fluctuant, may vary with menstrual cycle, smooth"],
              ["Abscess", "Red, hot, tender, fever, most common in lactating women"],
            ],
          },
        ],
      },
      {
        heading: "Metastatic features to ask about",
        blocks: [{ type: "paragraph", text: "Bone pain (metastases), jaundice (liver), SOB (lung/pleural)" }],
      },
    ],
  },
];

export const communicationSkills = {
  title: "Communication skills",
  subtitle: "Quick reference — scored in every station",
  table: {
    columns: ["Domain", "What the examiner wants to see"],
    rows: [
      ["Rapport", "Eye contact, warm tone, attentive listening"],
      ["Responds", 'Acknowledge patient\'s emotions — "I understand that must be very worrying"'],
      ["Fluency", 'No jargon — say "heart attack" not "myocardial infarction" to the patient'],
      ["Summarise", 'At the end: "So just to check I have that right..." and summarise back'],
    ],
  },
  signposting: {
    heading: "Signposting before sensitive questions",
    intro: "Before recreational drugs or sexual history, always say:",
    quote: "I'm going to ask you some questions that some people find sensitive, but they are important given the symptoms you've described. Is that okay?",
  },
};

export const presentationTemplate = {
  title: "Exemplar presentation template",
  text: "This is [Name], a [Age]-year-old [occupation] with a background of [past medical history], who presents with [main complaint] for [duration]. The [symptom] is [character], located in [site], radiating to [radiation]. It is made worse by [exacerbating factors] and relieved by [relieving factors]. Associated symptoms include [list]. [Patient name] is concerned about [patient's concern]. On social history, they [smoke/do not smoke], drink [X] units/week, and live [home situation]. The findings are most consistent with [most likely diagnosis]. However, I would wish to exclude [differentials].",
};

export const masterChecklist = {
  title: "Master checklist",
  subtitle: "Before you leave the station",
  items: [
    "Introduced yourself, got name, age, occupation",
    "Used an open question to start",
    "Covered SOCRATES for pain / ONE RESPS for SOB",
    "Asked about concerns and impact on life",
    "MJTHREADS for past medical history",
    "Drug history (including OTC) + allergies",
    "Family history",
    "HOSE PIPERS for social history (with signposting before R and S)",
    "Systems review",
    "Summarised back to patient",
    "Presented with differential diagnosis",
  ],
};

export const closingNote =
  "This guide covers all history-taking stations from the OSCE book. Memorise SOCRATES, MJTHREADS, and HOSE PIPERS — they appear in every station. The station-specific additions are the extras that separate a good mark from an excellent one.";

export function getTopic(slug) {
  return topics.find((topic) => topic.slug === slug) || null;
}

export function getAdjacentTopics(slug) {
  const index = topics.findIndex((topic) => topic.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? topics[index - 1] : null,
    next: index < topics.length - 1 ? topics[index + 1] : null,
  };
}
