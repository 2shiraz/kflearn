import { useRef, useState } from "react";
import { Check, ClipboardCopy, FileJson, Upload } from "lucide-react";
import { importAdminStations } from "../../lib/api";
import { PrimaryButton, SecondaryButton } from "../AppPage";
import { AdminDialog, InlineError } from "./AdminKit";

// The prompt an admin pastes into any AI chat together with a station
// document (Word, PDF or plain text). The AI returns JSON in exactly the
// shape the importer checks.
export const AI_PROMPT = `You are converting OSCE station documents into JSON for an OSCE practice website.

I will give you one or more OSCE stations (pasted text or an attached Word/PDF file). Convert every station into the JSON format below.

Rules:
- Reply with ONLY the JSON. No explanation, no markdown fences.
- Output a JSON array, one object per station, even if there is only one station.
- Use only information from my document. Do not invent clinical facts. If something is missing, leave it out or use an empty string.
- "category" must be one of: history, counselling, examination, interpretation, emergency, procedure.
- "difficulty" must be one of: beginner, intermediate, advanced.
- "timeLimitMinutes" is a number (use the document's time, otherwise 8).
- "aiPatient": true for stations where the student talks to a patient (history, counselling). false for examination, procedure or data interpretation stations.
- "patient.facts": everything the patient can say when asked, one fact per item, written in the patient's own words in first person. Include at least 3 facts when aiPatient is true. Each fact's "section" must be one of: PC, HPC, PMH, DH, FH, SH, ROS, ICE, RED_FLAG, OTHER.
- "patient.sex" is "male" or "female".
- "checklist": every marking point from the examiner checklist, in order. "marks" is a whole number (the maximum marks for that point). Set "critical": true only for safety-critical points.
- Keep text plain. No HTML, no markdown.

JSON format:
[
  {
    "title": "Chest pain: focused history",
    "specialty": "Cardiology",
    "category": "history",
    "difficulty": "intermediate",
    "timeLimitMinutes": 8,
    "presentingComplaint": "Chest pain",
    "shortDescription": "One or two sentences describing the station for the station list.",
    "aiPatient": true,
    "candidate": {
      "context": "Where the student is and who they are seeing.",
      "patientSummary": "Name, age and why the patient has come.",
      "tasks": ["Take a focused history", "Explain your differential diagnosis"]
    },
    "patient": {
      "name": "Imran Qureshi",
      "age": 54,
      "sex": "male",
      "occupation": "Shopkeeper",
      "demeanor": "Anxious but cooperative",
      "openingStatement": "Doctor, I've had a tight pain in my chest since this morning.",
      "facts": [
        { "section": "HPC", "label": "Onset", "answer": "It started about two hours ago while I was lifting boxes.", "keywords": ["when", "start", "onset"] },
        { "section": "RED_FLAG", "label": "Radiation", "answer": "It goes into my left arm and jaw." }
      ]
    },
    "checklist": [
      { "label": "Introduces self and confirms patient identity", "description": "", "marks": 1 },
      { "label": "Asks about the character and radiation of the pain", "marks": 2 },
      { "label": "Recognises the need for an urgent ECG", "marks": 2, "critical": true }
    ],
    "review": {
      "answerGuide": "The model answer or key points for this station.",
      "approach": ["Open the consultation", "Characterise the pain", "Screen for red flags", "Summarise and plan"],
      "examinerLooksFor": "What the examiner rewards.",
      "criticalSafetyErrors": ["Fails to consider acute coronary syndrome"],
      "vivaQuestions": [{ "question": "What is your first investigation?", "answer": "A 12-lead ECG within 10 minutes." }],
      "notes": ""
    }
  }
]`;

const EXAMPLE_NOTE = "Paste the JSON the AI gave you, or upload a .json file.";

export default function ImportStationsDialog({ open, onClose, onImported }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  function reset() {
    setText("");
    setPreview(null);
    setError("");
    setBusy("");
  }

  function parse() {
    // AI replies sometimes wrap JSON in ``` fences; strip them.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error("That isn't valid JSON. Copy the AI's whole reply, from the first [ to the last ].");
    }
  }

  async function check() {
    setError("");
    setPreview(null);
    setBusy("check");
    try {
      const data = await importAdminStations(parse(), true);
      setPreview(data.preview);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function runImport() {
    setError("");
    setBusy("import");
    try {
      const data = await importAdminStations(parse(), false);
      onImported(data.created);
      reset();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy automatically. Select the prompt text and copy it by hand.");
    }
  }

  return (
    <AdminDialog wide open={open} title="Import stations from JSON" description="Turn a station from a Word or PDF document into a draft in a few minutes." onClose={() => !busy && onClose()}>
      <div className="space-y-6">
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            ["Copy the prompt", "It tells the AI exactly what format to use."],
            ["Ask any AI chat", "Paste the prompt into ChatGPT, Claude or Gemini, then attach or paste your station document."],
            ["Paste the reply here", "Check it, then import. Stations arrive as drafts for you to review and publish."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl bg-s-tint/60 p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-s-accent text-xs font-semibold text-s-on-accent">{i + 1}</span>
              <p className="mt-2 text-sm font-semibold text-s-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-s-mute">{body}</p>
            </li>
          ))}
        </ol>

        <details className="group rounded-2xl border border-s-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm font-semibold text-s-ink">The AI prompt</span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-s-mute group-open:hidden">Show</span>
              <SecondaryButton onClick={(e) => { e.preventDefault(); copyPrompt(); }} className="min-h-9 px-4 py-1.5">
                {copied ? <><Check size={15} strokeWidth={2.5} aria-hidden="true" /> Copied</> : <><ClipboardCopy size={15} strokeWidth={2} aria-hidden="true" /> Copy prompt</>}
              </SecondaryButton>
            </span>
          </summary>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap border-t border-s-line px-4 py-3 font-chart text-xs leading-relaxed text-s-mute">{AI_PROMPT}</pre>
        </details>

        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <label htmlFor="import-json" className="text-sm font-medium text-s-ink">Station JSON</label>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 900 * 1024) return setError("That file is too big. Import fewer stations at a time.");
              setText(await file.text());
              setPreview(null);
            }} />
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-s-accent hover:underline">
              <Upload size={15} strokeWidth={2} aria-hidden="true" /> Upload .json
            </button>
          </div>
          <textarea
            id="import-json"
            value={text}
            onChange={(e) => { setText(e.target.value); setPreview(null); }}
            rows={9}
            spellCheck={false}
            placeholder={EXAMPLE_NOTE}
            className="mt-2 w-full rounded-xl border border-s-line bg-s-page p-3.5 font-chart text-xs leading-relaxed text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent focus:ring-2 focus:ring-s-accent/20"
          />
        </div>

        <InlineError>{error}</InlineError>

        {preview && (
          <div className="rounded-2xl border border-mint/30 bg-mint-soft/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-s-ink"><FileJson size={16} strokeWidth={2} className="text-s-good" aria-hidden="true" /> Ready to import {preview.length} {preview.length === 1 ? "station" : "stations"}</p>
            <ul className="mt-3 space-y-2">
              {preview.map((p, i) => (
                <li key={`${p.title}-${i}`} className="rounded-xl bg-s-card px-3.5 py-2.5 text-sm">
                  <p className="font-medium text-s-ink">{p.title}</p>
                  <p className="mt-0.5 text-xs text-s-mute">
                    {p.specialty} / {p.category} / {p.tasks} tasks / {p.checklistItems} checklist points ({p.marks} marks) / {p.aiPatient ? `AI patient with ${p.facts} facts` : "checklist practice only"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton onClick={onClose} disabled={Boolean(busy)}>Cancel</SecondaryButton>
          {preview ? (
            <PrimaryButton type="button" onClick={runImport} disabled={busy === "import"}>{busy === "import" ? "Importing..." : `Import as ${preview.length === 1 ? "draft" : "drafts"}`}</PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={check} disabled={!text.trim() || busy === "check"}>{busy === "check" ? "Checking..." : "Check JSON"}</PrimaryButton>
          )}
        </div>
      </div>
    </AdminDialog>
  );
}
