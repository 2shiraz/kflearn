import mongoose from "mongoose";

function uniqueBy(items, key, label) {
  const values = items.map((item) => item[key]).filter(Boolean);
  return values.length === new Set(values).size || `${label} must be unique.`;
}

const patientFactSchema = new mongoose.Schema(
  {
    factId: { type: String, required: true },
    section: {
      type: String,
      enum: ["PC", "HPC", "PMH", "DH", "FH", "SH", "ROS", "ICE", "RED_FLAG", "OTHER"],
      required: true,
    },
    conceptId: { type: String, required: true },
    label: { type: String, required: true },
    value: { type: String, required: true },
    naturalResponse: { type: String, required: true },
    revealPolicy: {
      type: String,
      enum: ["OPENING", "IF_ASKED", "IF_RELEVANT_QUESTION", "AFTER_SPECIFIC_FACT", "AFTER_EMPATHY"],
      default: "IF_RELEVANT_QUESTION",
    },
    triggerConcepts: [{ type: String }],
    synonyms: [{ type: String }],
    relatedChecklistItemIds: [{ type: String }],
  },
  { _id: false },
);

const patientScriptSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    patientIdentity: {
      name: String,
      age: Number,
      sex: String,
      occupation: String,
      pronouns: String,
    },
    baselineState: {
      generalAppearance: String,
      currentDistress: String,
      communicationAbility: String,
    },
    openingStatement: { type: String, required: true },
    demeanor: {
      general: String,
      anxietyLevel: String,
      cooperation: String,
      verbosity: String,
      healthLiteracy: String,
    },
    facts: {
      type: [patientFactSchema],
      validate: {
        validator: (facts) => uniqueBy(facts, "factId", "factId") === true,
        message: "Patient factId values must be unique.",
      },
    },
    emotionalCues: [
      {
        cueId: String,
        condition: String,
        response: String,
      },
    ],
    patientQuestions: [
      {
        trigger: String,
        question: String,
      },
    ],
    expectedPatientAttitude: { type: String, default: "" },
    unknownFactPolicy: { type: String, default: "If a fact is not provided, say you are not sure or have not noticed. Do not invent details." },
    sourceReferences: [{ type: String }],
    status: { type: String, enum: ["draft", "approved", "published", "archived"], default: "draft" },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const PatientScript = mongoose.model("PatientScript", patientScriptSchema);
