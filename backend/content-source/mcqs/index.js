// MCQ bank metadata (years -> modules/blocks -> topics). Generated from the
// MBBS1-4 MCQ bank .docx files by tools/parse_mcq_docx.py. Question bodies live in
// mbbs-<year>.json and are loaded on demand so they stay out of the main bundle.
// Static practice content: answers ship to the browser, so don't reuse this for graded exams.
export const mcqYears = [
  {
    "slug": "mbbs-1",
    "year": 1,
    "name": "MBBS First Year",
    "count": 1000,
    "blocks": [
      {
        "slug": "foundation",
        "name": "Foundation Module",
        "count": 200,
        "topics": [
          {
            "slug": "cell-biology-and-genetics",
            "name": "Cell Biology & Genetics",
            "count": 40
          },
          {
            "slug": "bioenergetics-and-enzymes",
            "name": "Bioenergetics & Enzymes",
            "count": 40
          },
          {
            "slug": "general-histology",
            "name": "General Histology",
            "count": 40
          },
          {
            "slug": "general-embryology",
            "name": "General Embryology",
            "count": 40
          },
          {
            "slug": "community-medicine-and-biostatistics-basics",
            "name": "Community Medicine & Biostatistics Basics",
            "count": 40
          }
        ]
      },
      {
        "slug": "blood",
        "name": "Blood Module",
        "count": 200,
        "topics": [
          {
            "slug": "hematopoiesis-and-rbc-physiology",
            "name": "Hematopoiesis & RBC Physiology",
            "count": 40
          },
          {
            "slug": "wbc-physiology-and-immunity",
            "name": "WBC Physiology & Immunity",
            "count": 40
          },
          {
            "slug": "hemostasis-and-coagulation",
            "name": "Hemostasis & Coagulation",
            "count": 40
          },
          {
            "slug": "blood-groups-transfusion-and-anemia",
            "name": "Blood Groups, Transfusion & Anemia",
            "count": 40
          },
          {
            "slug": "lymphatic-system-anatomy-and-histology",
            "name": "Lymphatic System Anatomy & Histology",
            "count": 40
          }
        ]
      },
      {
        "slug": "musculoskeletal-msk",
        "name": "Musculoskeletal (MSK) Module",
        "count": 200,
        "topics": [
          {
            "slug": "upper-limb-anatomy",
            "name": "Upper Limb Anatomy",
            "count": 40
          },
          {
            "slug": "lower-limb-anatomy",
            "name": "Lower Limb Anatomy",
            "count": 40
          },
          {
            "slug": "back-vertebral-column-and-spinal-cord-anatomy",
            "name": "Back, Vertebral Column & Spinal Cord Anatomy",
            "count": 40
          },
          {
            "slug": "bone-joint-and-cartilage-physiology",
            "name": "Bone, Joint & Cartilage Physiology",
            "count": 40
          },
          {
            "slug": "muscle-physiology-and-msk-biochemistry",
            "name": "Muscle Physiology & MSK Biochemistry",
            "count": 40
          }
        ]
      },
      {
        "slug": "cardiovascular-cvs",
        "name": "Cardiovascular (CVS) Module",
        "count": 200,
        "topics": [
          {
            "slug": "heart-anatomy",
            "name": "Heart Anatomy",
            "count": 40
          },
          {
            "slug": "cardiac-physiology",
            "name": "Cardiac Physiology",
            "count": 40
          },
          {
            "slug": "ecg-and-cardiac-electrophysiology",
            "name": "ECG & Cardiac Electrophysiology",
            "count": 40
          },
          {
            "slug": "vascular-physiology-and-bp-regulation",
            "name": "Vascular Physiology & BP Regulation",
            "count": 40
          },
          {
            "slug": "cardiac-histology-embryology-and-biochemistry",
            "name": "Cardiac Histology, Embryology & Biochemistry",
            "count": 40
          }
        ]
      },
      {
        "slug": "respiratory",
        "name": "Respiratory Module",
        "count": 200,
        "topics": [
          {
            "slug": "respiratory-system-anatomy",
            "name": "Respiratory System Anatomy",
            "count": 40
          },
          {
            "slug": "pulmonary-ventilation-and-mechanics",
            "name": "Pulmonary Ventilation & Mechanics",
            "count": 40
          },
          {
            "slug": "gas-exchange-and-transport",
            "name": "Gas Exchange & Transport",
            "count": 40
          },
          {
            "slug": "control-of-respiration-and-regulation",
            "name": "Control of Respiration & Regulation",
            "count": 40
          },
          {
            "slug": "respiratory-histology-acid-base-and-pathophysiology",
            "name": "Respiratory Histology, Acid-Base & Pathophysiology",
            "count": 40
          }
        ]
      }
    ]
  },
  {
    "slug": "mbbs-2",
    "year": 2,
    "name": "MBBS Second Year",
    "count": 1000,
    "blocks": [
      {
        "slug": "git-and-nutrition",
        "name": "GIT & Nutrition Block",
        "count": 200,
        "topics": [
          {
            "slug": "git-anatomy",
            "name": "GIT Anatomy",
            "count": 40
          },
          {
            "slug": "git-physiology",
            "name": "GIT Physiology",
            "count": 40
          },
          {
            "slug": "liver-gallbladder-and-pancreas",
            "name": "Liver, Gallbladder & Pancreas",
            "count": 40
          },
          {
            "slug": "git-histology-and-embryology",
            "name": "GIT Histology & Embryology",
            "count": 40
          },
          {
            "slug": "nutrition-and-metabolism-biochemistry",
            "name": "Nutrition & Metabolism Biochemistry",
            "count": 40
          }
        ]
      },
      {
        "slug": "renal",
        "name": "Renal Block",
        "count": 200,
        "topics": [
          {
            "slug": "renal-anatomy",
            "name": "Renal Anatomy",
            "count": 40
          },
          {
            "slug": "renal-physiology-filtration-reabsorption-secretion",
            "name": "Renal Physiology (Filtration, Reabsorption, Secretion)",
            "count": 40
          },
          {
            "slug": "acid-base-balance-and-renal-regulation",
            "name": "Acid-Base Balance & Renal Regulation",
            "count": 40
          },
          {
            "slug": "renal-histology-and-embryology",
            "name": "Renal Histology & Embryology",
            "count": 40
          },
          {
            "slug": "fluid-electrolyte-and-renal-endocrine-function",
            "name": "Fluid, Electrolyte & Renal Endocrine Function",
            "count": 40
          }
        ]
      },
      {
        "slug": "nervous-system-neurosciences",
        "name": "Nervous System (Neurosciences) Block",
        "count": 200,
        "topics": [
          {
            "slug": "neuroanatomy-brain",
            "name": "Neuroanatomy - Brain",
            "count": 40
          },
          {
            "slug": "neuroanatomy-spinal-cord-and-peripheral-nerves",
            "name": "Neuroanatomy - Spinal Cord & Peripheral Nerves",
            "count": 40
          },
          {
            "slug": "neurophysiology",
            "name": "Neurophysiology",
            "count": 40
          },
          {
            "slug": "neurohistology-and-embryology",
            "name": "Neurohistology & Embryology",
            "count": 40
          },
          {
            "slug": "autonomic-nervous-system-and-higher-functions",
            "name": "Autonomic Nervous System & Higher Functions",
            "count": 40
          }
        ]
      },
      {
        "slug": "special-senses",
        "name": "Special Senses Block",
        "count": 200,
        "topics": [
          {
            "slug": "eye-anatomy-and-visual-pathway",
            "name": "Eye Anatomy & Visual Pathway",
            "count": 40
          },
          {
            "slug": "ear-anatomy-and-vestibular-system",
            "name": "Ear Anatomy & Vestibular System",
            "count": 40
          },
          {
            "slug": "physiology-of-vision",
            "name": "Physiology of Vision",
            "count": 40
          },
          {
            "slug": "physiology-of-hearing-and-balance",
            "name": "Physiology of Hearing & Balance",
            "count": 40
          },
          {
            "slug": "special-senses-histology-and-embryology",
            "name": "Special Senses Histology & Embryology",
            "count": 40
          }
        ]
      },
      {
        "slug": "endocrine-and-reproductive",
        "name": "Endocrine & Reproductive Block",
        "count": 200,
        "topics": [
          {
            "slug": "endocrine-glands-anatomy-and-histology",
            "name": "Endocrine Glands Anatomy & Histology",
            "count": 40
          },
          {
            "slug": "hormone-physiology",
            "name": "Hormone Physiology",
            "count": 40
          },
          {
            "slug": "male-reproductive-anatomy-and-physiology",
            "name": "Male Reproductive Anatomy & Physiology",
            "count": 40
          },
          {
            "slug": "female-reproductive-anatomy-and-physiology",
            "name": "Female Reproductive Anatomy & Physiology",
            "count": 40
          },
          {
            "slug": "reproductive-embryology-and-endocrinology-of-pregnancy",
            "name": "Reproductive Embryology & Endocrinology of Pregnancy",
            "count": 40
          }
        ]
      }
    ]
  },
  {
    "slug": "mbbs-3",
    "year": 3,
    "name": "MBBS Third Year",
    "count": 1000,
    "blocks": [
      {
        "slug": "general-and-systemic-pathology",
        "name": "General & Systemic Pathology Block",
        "count": 200,
        "topics": [
          {
            "slug": "cell-injury-adaptation-and-necrosis",
            "name": "Cell Injury, Adaptation & Necrosis",
            "count": 40
          },
          {
            "slug": "inflammation-healing-and-repair",
            "name": "Inflammation, Healing & Repair",
            "count": 40
          },
          {
            "slug": "neoplasia",
            "name": "Neoplasia",
            "count": 40
          },
          {
            "slug": "hematopathology",
            "name": "Hematopathology",
            "count": 40
          },
          {
            "slug": "systemic-pathology-cardiovascular-and-respiratory",
            "name": "Systemic Pathology (Cardiovascular & Respiratory)",
            "count": 40
          }
        ]
      },
      {
        "slug": "general-and-systemic-pharmacology",
        "name": "General & Systemic Pharmacology Block",
        "count": 200,
        "topics": [
          {
            "slug": "pharmacokinetics-and-pharmacodynamics",
            "name": "Pharmacokinetics & Pharmacodynamics",
            "count": 40
          },
          {
            "slug": "autonomic-nervous-system-pharmacology",
            "name": "Autonomic Nervous System Pharmacology",
            "count": 40
          },
          {
            "slug": "cardiovascular-pharmacology",
            "name": "Cardiovascular Pharmacology",
            "count": 40
          },
          {
            "slug": "antimicrobial-pharmacology",
            "name": "Antimicrobial Pharmacology",
            "count": 40
          },
          {
            "slug": "cns-pharmacology",
            "name": "CNS Pharmacology",
            "count": 40
          }
        ]
      },
      {
        "slug": "microbiology-and-immunology",
        "name": "Microbiology & Immunology Block",
        "count": 200,
        "topics": [
          {
            "slug": "general-bacteriology",
            "name": "General Bacteriology",
            "count": 40
          },
          {
            "slug": "virology",
            "name": "Virology",
            "count": 40
          },
          {
            "slug": "mycology-and-parasitology",
            "name": "Mycology & Parasitology",
            "count": 40
          },
          {
            "slug": "immunology",
            "name": "Immunology",
            "count": 40
          },
          {
            "slug": "clinical-microbiology-and-infection-control",
            "name": "Clinical Microbiology & Infection Control",
            "count": 40
          }
        ]
      },
      {
        "slug": "forensic-medicine-and-toxicology",
        "name": "Forensic Medicine & Toxicology",
        "count": 200,
        "topics": [
          {
            "slug": "forensic-pathology-death-and-postmortem-changes",
            "name": "Forensic Pathology, Death & Postmortem Changes",
            "count": 40
          },
          {
            "slug": "mechanical-and-thermal-injuries",
            "name": "Mechanical & Thermal Injuries",
            "count": 40
          },
          {
            "slug": "forensic-toxicology-poisons",
            "name": "Forensic Toxicology (Poisons)",
            "count": 40
          },
          {
            "slug": "sexual-offences-and-medico-legal-examination",
            "name": "Sexual Offences & Medico-legal Examination",
            "count": 40
          },
          {
            "slug": "medical-jurisprudence-and-ethics",
            "name": "Medical Jurisprudence & Ethics",
            "count": 40
          }
        ]
      },
      {
        "slug": "community-medicine-and-public-health",
        "name": "Community Medicine & Public Health",
        "count": 200,
        "topics": [
          {
            "slug": "epidemiology-and-disease-transmission",
            "name": "Epidemiology & Disease Transmission",
            "count": 40
          },
          {
            "slug": "biostatistics-and-research-methodology",
            "name": "Biostatistics & Research Methodology",
            "count": 40
          },
          {
            "slug": "preventive-medicine-and-immunization",
            "name": "Preventive Medicine & Immunization",
            "count": 40
          },
          {
            "slug": "environmental-and-occupational-health",
            "name": "Environmental & Occupational Health",
            "count": 40
          },
          {
            "slug": "health-systems-and-reproductive-maternal-health",
            "name": "Health Systems & Reproductive/Maternal Health",
            "count": 40
          }
        ]
      }
    ]
  },
  {
    "slug": "mbbs-4",
    "year": 4,
    "name": "MBBS Fourth Year",
    "count": 1000,
    "blocks": [
      {
        "slug": "internal-medicine",
        "name": "Internal Medicine Block",
        "count": 200,
        "topics": [
          {
            "slug": "cardiology",
            "name": "Cardiology",
            "count": 40
          },
          {
            "slug": "respiratory-medicine",
            "name": "Respiratory Medicine",
            "count": 40
          },
          {
            "slug": "gastroenterology-and-hepatology",
            "name": "Gastroenterology & Hepatology",
            "count": 40
          },
          {
            "slug": "nephrology-and-endocrinology",
            "name": "Nephrology & Endocrinology",
            "count": 40
          },
          {
            "slug": "neurology-and-rheumatology",
            "name": "Neurology & Rheumatology",
            "count": 40
          }
        ]
      },
      {
        "slug": "general-surgery",
        "name": "General Surgery Block",
        "count": 200,
        "topics": [
          {
            "slug": "surgical-principles-and-perioperative-care",
            "name": "Surgical Principles & Perioperative Care",
            "count": 40
          },
          {
            "slug": "gi-surgery-esophagus-stomach-and-intestine",
            "name": "GI Surgery (Esophagus, Stomach & Intestine)",
            "count": 40
          },
          {
            "slug": "hepatobiliary-and-pancreatic-surgery",
            "name": "Hepatobiliary & Pancreatic Surgery",
            "count": 40
          },
          {
            "slug": "breast-and-endocrine-surgery",
            "name": "Breast & Endocrine Surgery",
            "count": 40
          },
          {
            "slug": "urology-and-vascular-surgery",
            "name": "Urology & Vascular Surgery",
            "count": 40
          }
        ]
      },
      {
        "slug": "obstetrics-and-gynecology",
        "name": "Obstetrics & Gynecology Block",
        "count": 200,
        "topics": [
          {
            "slug": "antenatal-care",
            "name": "Antenatal Care",
            "count": 40
          },
          {
            "slug": "obstetric-complications-and-labor",
            "name": "Obstetric Complications & Labor",
            "count": 40
          },
          {
            "slug": "gynecological-disorders",
            "name": "Gynecological Disorders",
            "count": 40
          },
          {
            "slug": "gynecological-oncology-and-infections",
            "name": "Gynecological Oncology & Infections",
            "count": 40
          },
          {
            "slug": "infertility-and-family-planning",
            "name": "Infertility & Family Planning",
            "count": 40
          }
        ]
      },
      {
        "slug": "pediatrics",
        "name": "Pediatrics Block",
        "count": 200,
        "topics": [
          {
            "slug": "neonatology",
            "name": "Neonatology",
            "count": 40
          },
          {
            "slug": "growth-development-and-nutrition",
            "name": "Growth, Development & Nutrition",
            "count": 40
          },
          {
            "slug": "pediatric-infectious-diseases",
            "name": "Pediatric Infectious Diseases",
            "count": 40
          },
          {
            "slug": "pediatric-respiratory-and-cardiac-disorders",
            "name": "Pediatric Respiratory & Cardiac Disorders",
            "count": 40
          },
          {
            "slug": "pediatric-gi-renal-and-genetic-disorders",
            "name": "Pediatric GI, Renal & Genetic Disorders",
            "count": 40
          }
        ]
      },
      {
        "slug": "ophthalmology-and-ent",
        "name": "Ophthalmology & ENT Block",
        "count": 200,
        "topics": [
          {
            "slug": "ophthalmology-anterior-segment-and-adnexa",
            "name": "Ophthalmology: Anterior Segment & Adnexa",
            "count": 40
          },
          {
            "slug": "ophthalmology-posterior-segment-and-refractive-disorders",
            "name": "Ophthalmology: Posterior Segment & Refractive Disorders",
            "count": 40
          },
          {
            "slug": "ent-diseases-of-the-ear",
            "name": "ENT: Diseases of the Ear",
            "count": 40
          },
          {
            "slug": "ent-diseases-of-the-nose-and-paranasal-sinuses",
            "name": "ENT: Diseases of the Nose & Paranasal Sinuses",
            "count": 40
          },
          {
            "slug": "ent-diseases-of-the-throat-head-and-neck",
            "name": "ENT: Diseases of the Throat, Head & Neck",
            "count": 40
          }
        ]
      }
    ]
  }
];

export const mcqTotalCount = mcqYears.reduce((sum, y) => sum + y.count, 0);

const loaders = {
  "mbbs-1": () => import("./mbbs-1.json"),
  "mbbs-2": () => import("./mbbs-2.json"),
  "mbbs-3": () => import("./mbbs-3.json"),
  "mbbs-4": () => import("./mbbs-4.json"),
};

export function getYear(yearSlug) {
  return mcqYears.find((y) => y.slug === yearSlug) || null;
}

export function getBlock(yearSlug, blockSlug) {
  return getYear(yearSlug)?.blocks.find((b) => b.slug === blockSlug) || null;
}

// Returns questions for a whole year, one block, or one topic: [{ id, s, o, a, e, topic }]
export async function loadQuestions(yearSlug, blockSlug, topicSlug) {
  const load = loaders[yearSlug];
  if (!load) throw new Error("Unknown year.");
  const data = (await load()).default;
  const year = getYear(yearSlug);
  const out = [];
  for (const block of year.blocks) {
    if (blockSlug && block.slug !== blockSlug) continue;
    for (const topic of block.topics) {
      if (topicSlug && topic.slug !== topicSlug) continue;
      for (const q of data[`${block.slug}/${topic.slug}`] || []) out.push({ ...q, topic: topic.name, block: block.name });
    }
  }
  return out;
}
