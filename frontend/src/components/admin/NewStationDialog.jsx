import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { importAdminStations, listAdminSpecialties } from "../../lib/api";
import { OSCE_CATEGORIES } from "../../lib/osceFilters";
import { PrimaryButton } from "../AppPage";
import { AdminDialog, Area, Field, InlineError, Select, ShowAllToggle, Toggle } from "./AdminKit";
import { ChecklistEditor, newItem } from "./StationEditDialog";

const FACT_SECTIONS = [
  ["PC", "Presenting complaint"], ["HPC", "History of complaint"], ["PMH", "Past medical"], ["DH", "Drugs and allergies"],
  ["FH", "Family"], ["SH", "Social"], ["ROS", "Systems review"], ["ICE", "Ideas, concerns, expectations"],
  ["RED_FLAG", "Red flag"], ["OTHER", "Other"],
];

const REVIEW_FIELDS = [
  ["answerGuide", "Answer guide", { rows: 5, maxLength: 6000 }],
  ["approach", "Suggested approach", { rows: 4, helper: "One step per line." }],
  ["examinerLooksFor", "What examiners look for", { rows: 3, maxLength: 6000 }],
  ["vivaQuestions", "Questions an examiner may ask", { rows: 4, helper: "One per line. Add the answer after a | if you have one: Question | Answer" }],
  ["criticalSafetyErrors", "Critical safety errors", { rows: 3, helper: "One per line." }],
  ["notes", "Review notes", { rows: 3, maxLength: 6000 }],
];

const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const emptyFact = () => ({ section: "HPC", label: "", answer: "" });

const blank = () => ({
  title: "", specialty: "", newSpecialty: "", presentingComplaint: "", shortDescription: "",
  category: "history", difficulty: "intermediate", minutes: "8", checklistPractice: true, aiPatient: true,
  context: "", patientSummary: "", tasks: "",
  patient: { name: "", age: "", sex: "female", occupation: "", demeanor: "", openingStatement: "" },
  facts: [emptyFact(), emptyFact(), emptyFact()],
  checklist: [{ title: "Station checklist", items: [newItem()] }],
  review: { answerGuide: "", approach: "", examinerLooksFor: "", vivaQuestions: "", criticalSafetyErrors: "", notes: "" },
  show: Object.fromEntries(REVIEW_FIELDS.map(([key]) => [key, true])),
});

// Build a new station in one place: basics, what the candidate is told, the
// AI patient, the marking checklist and the review. Saved as a draft through
// the same checks as JSON import. Only the title is needed to save; the rest
// is checked when the station is published.
export default function NewStationDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState(blank);
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(blank());
    setError("");
    listAdminSpecialties().then((list) => {
      setSpecialties(list);
      setForm((f) => ({ ...f, specialty: f.specialty || list[0]?.name || "__new" }));
    }).catch(() => setForm((f) => ({ ...f, specialty: "__new" })));
  }, [open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setPatient = (key, value) => setForm((f) => ({ ...f, patient: { ...f.patient, [key]: value } }));
  const setFact = (i, patch) => setForm((f) => ({ ...f, facts: f.facts.map((fact, j) => (j === i ? { ...fact, ...patch } : fact)) }));
  const dirty = form.title || form.presentingComplaint || form.tasks || form.facts.some((f) => f.answer);


  async function save(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Give the station a title so you can find it later.");
    if (!form.checklistPractice && !form.aiPatient) return setError("Leave at least one way to practise this station.");
    const specialty = form.specialty === "__new" ? form.newSpecialty.trim() : form.specialty;
    const topic = Object.fromEntries(FACT_SECTIONS);
    const facts = form.facts
      .filter((f) => f.answer.trim())
      .map((f) => ({ ...f, label: f.label.trim() || topic[f.section] }));
    const checklist = form.checklist
      .map((sec) => ({ title: sec.title.trim() || "Station checklist", items: sec.items.filter((i) => i.label.trim()) }))
      .filter((sec) => sec.items.length);
    setSaving(true);
    setError("");
    try {
      const station = {
        title: form.title,
        specialty,
        category: form.category,
        difficulty: form.difficulty,
        timeLimitMinutes: Number(form.minutes),
        presentingComplaint: form.presentingComplaint,
        shortDescription: form.shortDescription,
        aiPatient: form.aiPatient,
        checklistPractice: form.checklistPractice,
        candidate: { context: form.context, patientSummary: form.patientSummary, tasks: lines(form.tasks) },
        patient: {
          ...form.patient,
          age: form.patient.age === "" ? undefined : Number(form.patient.age),
          facts: facts.map((f) => ({ section: f.section, label: f.label, answer: f.answer })),
        },
        checklist: checklist.map((sec) => ({
          title: sec.title,
          items: sec.items.map((i) => ({ label: i.label, description: i.description, marks: Number(i.marks), critical: i.critical })),
        })),
        review: {
          answerGuide: form.review.answerGuide,
          approach: lines(form.review.approach),
          examinerLooksFor: form.review.examinerLooksFor,
          vivaQuestions: lines(form.review.vivaQuestions).map((line) => {
            const [question, ...rest] = line.split("|");
            return { question: question.trim(), answer: rest.join("|").trim() };
          }),
          criticalSafetyErrors: lines(form.review.criticalSafetyErrors),
          notes: form.review.notes,
          show: form.show,
        },
      };
      const data = await importAdminStations([station], false, true);
      onCreated(data.created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminDialog fullscreen open={open} title="Write a station" description="Saved as a draft, hidden from students until you publish it. Only the title is needed to save." onClose={onClose} dirty={Boolean(dirty)} busy={saving}
      saveLabel="Save as draft" onSave={() => document.getElementById("station-new-form")?.requestSubmit()}
      sections={[
        { id: "st-basics", label: "Basics" },
        { id: "st-candidate", label: "Candidate instructions" },
        ...(form.aiPatient ? [{ id: "st-patient", label: "The patient" }] : []),
        { id: "st-checklist", label: "Marking checklist" },
        { id: "st-review", label: "Station review" },
      ]}
      footer={<PrimaryButton type="submit" form="station-new-form" disabled={saving}>{saving ? "Saving..." : "Save as draft"}</PrimaryButton>}
    >
      <form id="station-new-form" onSubmit={save} className="space-y-6">
        <section id="st-basics" className="scroll-mt-8 space-y-4">
          <h3 className="font-semibold text-s-ink">Basics</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Title" required maxLength={160} value={form.title} onChange={(v) => set("title", v)} placeholder="Chest pain: focused history" />
            <Field label="Presenting complaint" maxLength={200} value={form.presentingComplaint} onChange={(v) => set("presentingComplaint", v)} />
          </div>
          <Area label="Short description" helper="Shown on the station card." maxLength={600} rows={2} value={form.shortDescription} onChange={(v) => set("shortDescription", v)} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Select label="Specialty" value={form.specialty} onChange={(v) => set("specialty", v)}>
                {specialties.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                <option value="__new">New specialty...</option>
              </Select>
              {form.specialty === "__new" && <Field label="New specialty name" maxLength={80} value={form.newSpecialty} onChange={(v) => set("newSpecialty", v)} />}
            </div>
            <Select label="Category" value={form.category} onChange={(v) => set("category", v)}>
              {OSCE_CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </Select>
            <Select label="Difficulty" value={form.difficulty} onChange={(v) => set("difficulty", v)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
            <Field label="Time limit (minutes)" type="number" min="1" max="60" required value={form.minutes} onChange={(v) => set("minutes", v)} />
          </div>
          <div className="grid divide-y divide-s-line rounded-2xl border border-s-line px-4 lg:grid-cols-2 lg:gap-8 lg:divide-y-0">
            <Toggle label="Checklist practice" description="Students work through the station and mark themselves. Uses no AI credits." checked={form.checklistPractice} onChange={(v) => set("checklistPractice", v)} />
            <Toggle label="AI patient" description="Students talk to the AI patient and can get AI marking. Needs the patient below." checked={form.aiPatient} onChange={(v) => set("aiPatient", v)} />
          </div>
        </section>

        <section id="st-candidate" className="scroll-mt-8 space-y-4 border-t border-s-line pt-5">
          <h3 className="font-semibold text-s-ink">Candidate instructions</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <Area label="Context" rows={2} maxLength={2000} value={form.context} onChange={(v) => set("context", v)} placeholder="You are an FY1 in the emergency department." />
            <Area label="Patient summary" rows={2} maxLength={2000} value={form.patientSummary} onChange={(v) => set("patientSummary", v)} />
          </div>
          <Area label="Tasks" helper="One task per line." rows={3} value={form.tasks} onChange={(v) => set("tasks", v)} />
        </section>

        {form.aiPatient && (
          <section id="st-patient" className="scroll-mt-8 space-y-4 border-t border-s-line pt-5">
            <div>
              <h3 className="font-semibold text-s-ink">The patient</h3>
              <p className="mt-0.5 text-sm text-s-mute">The AI patient only says what's written here. Write facts in the patient's own words.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Name" maxLength={80} value={form.patient.name} onChange={(v) => setPatient("name", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age" type="number" min="0" max="120" value={form.patient.age} onChange={(v) => setPatient("age", v)} />
                <Select label="Sex" value={form.patient.sex} onChange={(v) => setPatient("sex", v)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </Select>
              </div>
              <Field label="Occupation" maxLength={80} value={form.patient.occupation} onChange={(v) => setPatient("occupation", v)} />
              <Field label="Manner" maxLength={200} value={form.patient.demeanor} onChange={(v) => setPatient("demeanor", v)} placeholder="Anxious but cooperative" />
            </div>
            <Area label="Opening line" rows={2} maxLength={600} value={form.patient.openingStatement} onChange={(v) => setPatient("openingStatement", v)} placeholder="Doctor, I've had a tight pain in my chest since this morning." />
            <div className="space-y-2">
              <p className="text-sm font-medium text-s-ink">Facts the patient can share <span className="font-normal text-s-mute">(at least 3)</span></p>
              <ol className="grid gap-2 xl:grid-cols-2">
                {form.facts.map((fact, i) => (
                  <li key={i} className="grid gap-2 rounded-xl bg-s-tint/50 p-3 sm:grid-cols-[11rem_minmax(0,1fr)_auto]">
                    <select aria-label="Fact topic" value={fact.section} onChange={(e) => setFact(i, { section: e.target.value })} className="min-h-10 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent">
                      {FACT_SECTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <div className="space-y-2">
                      <input aria-label="What it's about" value={fact.label} maxLength={120} onChange={(e) => setFact(i, { label: e.target.value })} placeholder="What it's about, e.g. Onset" className="min-h-10 w-full rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent" />
                      <textarea aria-label="Patient's answer" value={fact.answer} maxLength={1200} rows={2} onChange={(e) => setFact(i, { answer: e.target.value })} placeholder="In the patient's words: It started about two hours ago while I was lifting boxes." className="w-full rounded-xl border border-s-line bg-s-card px-3 py-2 text-sm leading-relaxed text-s-ink outline-none focus:border-s-accent" />
                    </div>
                    <button type="button" aria-label="Remove fact" disabled={form.facts.length === 1} onClick={() => set("facts", form.facts.filter((_, j) => j !== i))} className="flex h-10 w-10 items-center justify-center self-start rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss disabled:opacity-30">
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={() => set("facts", [...form.facts, emptyFact()])} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-s-accent hover:underline">
                <Plus size={15} strokeWidth={2} aria-hidden="true" /> Add fact
              </button>
            </div>
          </section>
        )}

        <ChecklistEditor sections={form.checklist} onChange={(next) => set("checklist", next)} />

        <section id="st-review" className="scroll-mt-8 space-y-5 border-t border-s-line pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-s-ink">Station review</h3>
              <p className="mt-0.5 text-sm text-s-mute">Shown to students after they finish. All optional.</p>
            </div>
            <ShowAllToggle visibility={form.show} onChange={(v) => set("show", v)} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
          {REVIEW_FIELDS.map(([key, label, props]) => (
            <div key={key} className={form.show[key] ? "" : "opacity-60"}>
              <Area label={label} {...props} value={form.review[key]} onChange={(v) => set("review", { ...form.review, [key]: v })} />
              <label className="mt-1.5 inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-s-mute">
                <input type="checkbox" className="h-4 w-4 accent-[var(--s-accent)]" checked={form.show[key]} onChange={(e) => set("show", { ...form.show, [key]: e.target.checked })} />
                Show to students
              </label>
            </div>
          ))}
          </div>
        </section>

        <InlineError>{error}</InlineError>
      </form>
    </AdminDialog>
  );
}
