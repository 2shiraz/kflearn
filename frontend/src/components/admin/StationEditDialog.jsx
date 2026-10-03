import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { getAdminStation, listAdminSpecialties, updateAdminStation } from "../../lib/api";
import { OSCE_CATEGORIES } from "../../lib/osceFilters";
import { PrimaryButton, SecondaryButton } from "../AppPage";
import { AdminDialog, Area, Field, InlineError, Select, ShowAllToggle, Toggle } from "./AdminKit";

const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

function toForm(s) {
  return {
    title: s.title,
    shortDescription: s.shortDescription,
    presentingComplaint: s.presentingComplaint,
    specialtyId: String(s.specialtyId || ""),
    category: s.category || "",
    difficulty: s.difficulty,
    minutes: String(Math.round((s.timeLimitSeconds || 360) / 60)),
    checklistPractice: s.practiceModes.includes("single-player"),
    aiPatient: s.practiceModes.includes("virtual-patient"),
    context: s.candidateInstructions.context,
    patientSummary: s.candidateInstructions.patientSummary,
    tasks: s.candidateInstructions.tasks.join("\n"),
    keyAnswerGuide: s.keyAnswerGuide,
    suggestedCandidateApproach: s.suggestedCandidateApproach.join("\n"),
    examinerInstructions: s.examinerInstructions,
    criticalSafetyErrors: s.criticalSafetyErrors.join("\n"),
    learningNotes: s.learningNotes,
    vivaQuestions: s.vivaQuestions.map((q) => (q.answer ? `${q.question} | ${q.answer}` : q.question)).join("\n"),
    reviewVisibility: { ...s.reviewVisibility },
    checklist: s.checklist.sections.map((sec) => ({
      sectionId: sec.sectionId,
      title: sec.title,
      items: sec.items.map((i) => ({ ...i })),
    })),
  };
}

export const newItem = () => ({ label: "", description: "", marks: 1, critical: false });

// Edits a station: what students read, the marking checklist and which parts
// of the review they see. The AI patient's script is not edited here.
export default function StationEditDialog({ stationId, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stationId) return;
    setForm(null);
    setError("");
    Promise.all([getAdminStation(stationId), listAdminSpecialties()])
      .then(([station, specs]) => {
        const next = toForm(station);
        setForm(next);
        setInitial(JSON.stringify(next));
        setSpecialties(specs);
      })
      .catch((err) => setError(err.message));
  }, [stationId]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const dirty = form && JSON.stringify(form) !== initial;
  const close = () => {
    if (saving) return;
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    onClose();
  };

  async function save(e) {
    e.preventDefault();
    const modes = [form.checklistPractice && "single-player", form.aiPatient && "virtual-patient"].filter(Boolean);
    if (!modes.length) {
      setError("Leave at least one way to practise this station.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateAdminStation(stationId, {
        title: form.title,
        shortDescription: form.shortDescription,
        presentingComplaint: form.presentingComplaint,
        specialtyId: form.specialtyId,
        category: form.category,
        difficulty: form.difficulty,
        timeLimitSeconds: Math.round(Number(form.minutes) * 60),
        practiceModes: modes,
        candidateInstructions: { context: form.context, patientSummary: form.patientSummary, tasks: lines(form.tasks) },
        keyAnswerGuide: form.keyAnswerGuide,
        suggestedCandidateApproach: lines(form.suggestedCandidateApproach),
        examinerInstructions: form.examinerInstructions,
        criticalSafetyErrors: lines(form.criticalSafetyErrors),
        learningNotes: form.learningNotes,
        vivaQuestions: lines(form.vivaQuestions).map((line) => {
          const [question, ...rest] = line.split("|");
          return { question: question.trim(), answer: rest.join("|").trim() };
        }),
        reviewVisibility: form.reviewVisibility,
        ...(form.checklist.length ? {
          checklist: {
            sections: form.checklist.map((sec) => ({
              sectionId: sec.sectionId,
              title: sec.title,
              items: sec.items.map(({ itemId, label, description, marks, weight, critical }) => ({ itemId, label, description, marks: Number(marks), weight, critical })),
            })),
          },
        } : {}),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminDialog wide open={Boolean(stationId)} title="Edit station" description="Changes show to students straight away if the station is published." onClose={close}>
      {!form && !error && <p className="text-sm text-s-mute">Loading station...</p>}
      {!form && <InlineError>{error}</InlineError>}
      {form && (
        <form onSubmit={save} className="space-y-6">
          <section className="space-y-4">
            <h3 className="font-semibold text-s-ink">Basics</h3>
            <Field label="Title" required maxLength={160} value={form.title} onChange={(v) => set("title", v)} />
            <Area label="Short description" helper="Shown on the station card." required maxLength={600} rows={2} value={form.shortDescription} onChange={(v) => set("shortDescription", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Presenting complaint" required maxLength={200} value={form.presentingComplaint} onChange={(v) => set("presentingComplaint", v)} />
              <Select label="Specialty" value={form.specialtyId} onChange={(v) => set("specialtyId", v)}>
                {specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select label="Category" value={form.category} onChange={(v) => set("category", v)}>
                <option value="">Automatic</option>
                {OSCE_CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </Select>
              <Select label="Difficulty" value={form.difficulty} onChange={(v) => set("difficulty", v)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
              <Field label="Time limit (minutes)" type="number" min="1" max="60" required value={form.minutes} onChange={(v) => set("minutes", v)} />
            </div>
            <div className="divide-y divide-s-line rounded-2xl border border-s-line px-4">
              <Toggle label="Checklist practice" description="Students work through the station and mark themselves. Free." checked={form.checklistPractice} onChange={(v) => set("checklistPractice", v)} />
              <Toggle label="AI patient" description="Students talk to the AI patient and can get AI marking. Uses AI credits." checked={form.aiPatient} onChange={(v) => set("aiPatient", v)} />
            </div>
          </section>

          <section className="space-y-4 border-t border-s-line pt-5">
            <h3 className="font-semibold text-s-ink">Candidate instructions</h3>
            <Area label="Context" rows={3} maxLength={2000} value={form.context} onChange={(v) => set("context", v)} />
            <Area label="Patient summary" rows={3} maxLength={2000} value={form.patientSummary} onChange={(v) => set("patientSummary", v)} />
            <Area label="Tasks" helper="One task per line." rows={4} value={form.tasks} onChange={(v) => set("tasks", v)} />
          </section>

          <ChecklistEditor sections={form.checklist} onChange={(next) => set("checklist", next)} />

          <section className="space-y-5 border-t border-s-line pt-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-s-ink">Station review</h3>
                <p className="mt-0.5 text-sm text-s-mute">Shown to students after they finish. Hidden parts are kept for AI marking.</p>
              </div>
              <ShowAllToggle visibility={form.reviewVisibility} onChange={(v) => set("reviewVisibility", v)} />
            </div>
            {[
              ["keyAnswerGuide", "Answer guide", { rows: 5, maxLength: 6000 }],
              ["suggestedCandidateApproach", "Suggested approach", { rows: 4, helper: "One step per line." }],
              ["examinerInstructions", "What examiners look for", { rows: 3, maxLength: 6000 }],
              ["vivaQuestions", "Questions an examiner may ask", { rows: 4, helper: "One per line. Add the answer after a | if you have one: Question | Answer" }],
              ["criticalSafetyErrors", "Critical safety errors", { rows: 3, helper: "One per line." }],
              ["learningNotes", "Review notes", { rows: 3, maxLength: 6000 }],
            ].map(([key, label, props]) => {
              const shown = form.reviewVisibility[key] !== false;
              return (
                <div key={key} className={shown ? "" : "opacity-60"}>
                  <Area label={label} {...props} value={form[key]} onChange={(v) => set(key, v)} />
                  <label className="mt-1.5 inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-s-mute">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--s-accent)]" checked={shown} onChange={(e) => set("reviewVisibility", { ...form.reviewVisibility, [key]: e.target.checked })} />
                    Show to students
                  </label>
                </div>
              );
            })}
          </section>

          <InlineError>{error}</InlineError>
          <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-s-line bg-s-card px-6 py-4 sm:flex-row sm:justify-end">
            <SecondaryButton onClick={close} disabled={saving}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving || !dirty}>{saving ? "Saving..." : "Save station"}</PrimaryButton>
          </div>
        </form>
      )}
    </AdminDialog>
  );
}

// The marking checklist: sections of items. Each item is either a tick
// (1 mark, done or not) or graded (0 up to its marks, partial credit allowed).
// Critical items weigh most in the final percentage.
export function ChecklistEditor({ sections, onChange }) {
  if (!sections.length) return null;
  const total = sections.reduce((sum, s) => sum + s.items.reduce((t, i) => t + (Number(i.marks) || 0), 0), 0);
  const count = sections.reduce((sum, s) => sum + s.items.length, 0);
  const updateSection = (si, patch) => onChange(sections.map((s, i) => (i === si ? { ...s, ...patch } : s)));
  const updateItem = (si, ii, patch) => updateSection(si, { items: sections[si].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) });
  const moveItem = (si, ii, dir) => {
    const items = [...sections[si].items];
    const to = ii + dir;
    if (to < 0 || to >= items.length) return;
    [items[ii], items[to]] = [items[to], items[ii]];
    updateSection(si, { items });
  };

  return (
    <section className="space-y-4 border-t border-s-line pt-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-semibold text-s-ink">Marking checklist</h3>
          <p className="mt-0.5 text-sm text-s-mute">Used for self-marking and AI marking. A tick item is done or not (1 mark). A graded item can earn partial marks.</p>
        </div>
        <span className="rounded-full bg-s-tint px-3 py-1 font-chart text-xs text-s-ink">{count} items / {total} marks</span>
      </div>

      {sections.map((section, si) => (
        <div key={section.sectionId || `new-${si}`} className="space-y-3 rounded-2xl border border-s-line p-4">
          <div className="flex items-end gap-2">
            <Field className="flex-1" label="Section title" maxLength={120} value={section.title} onChange={(v) => updateSection(si, { title: v })} />
            {sections.length > 1 && (
              <button type="button" aria-label={`Remove section ${section.title || si + 1}`} onClick={() => window.confirm("Remove this section and its items?") && onChange(sections.filter((_, i) => i !== si))} className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss">
                <Trash2 size={16} strokeWidth={2} />
              </button>
            )}
          </div>
          <ol className="space-y-2">
            {section.items.map((item, ii) => (
              <li key={item.itemId || `new-${si}-${ii}`} className="rounded-xl bg-s-tint/50 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-3 w-5 shrink-0 text-right font-chart text-xs text-s-mute">{ii + 1}</span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <label className="sr-only" htmlFor={`item-${si}-${ii}`}>Checklist point</label>
                    <input id={`item-${si}-${ii}`} value={item.label} maxLength={300} onChange={(e) => updateItem(si, ii, { label: e.target.value })} placeholder="What the student should do" className="min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent" />
                    <input aria-label="Details (optional)" value={item.description} maxLength={600} onChange={(e) => updateItem(si, ii, { description: e.target.value })} placeholder="Details for the marker (optional)" className="min-h-10 w-full rounded-xl border border-s-line bg-s-card px-3 text-xs text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent" />
                    <div className="flex flex-wrap items-center gap-3">
                      <select aria-label="Marking type" value={item.marks} onChange={(e) => updateItem(si, ii, { marks: Number(e.target.value) })} className="min-h-10 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent">
                        <option value={1}>Tick, 1 mark</option>
                        {[2, 3, 4, 5].map((n) => <option key={n} value={n}>Graded, 0 to {n} marks</option>)}
                      </select>
                      <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-s-ink">
                        <input type="checkbox" className="h-4 w-4 accent-[var(--s-accent)]" checked={item.critical} onChange={(e) => updateItem(si, ii, { critical: e.target.checked })} />
                        Critical safety point
                      </label>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label="Move up" disabled={ii === 0} onClick={() => moveItem(si, ii, -1)} className="flex h-9 w-9 items-center justify-center rounded-full text-s-mute hover:bg-s-card hover:text-s-ink disabled:opacity-30"><ArrowUp size={15} strokeWidth={2} /></button>
                    <button type="button" aria-label="Move down" disabled={ii === section.items.length - 1} onClick={() => moveItem(si, ii, 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-s-mute hover:bg-s-card hover:text-s-ink disabled:opacity-30"><ArrowDown size={15} strokeWidth={2} /></button>
                    <button type="button" aria-label="Remove item" disabled={section.items.length === 1} onClick={() => updateSection(si, { items: section.items.filter((_, j) => j !== ii) })} className="flex h-9 w-9 items-center justify-center rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss disabled:opacity-30"><Trash2 size={15} strokeWidth={2} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => updateSection(si, { items: [...section.items, newItem()] })} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-s-accent hover:underline">
            <Plus size={15} strokeWidth={2} aria-hidden="true" /> Add item
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...sections, { title: "", items: [newItem()] }])} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-s-accent hover:underline">
        <Plus size={15} strokeWidth={2} aria-hidden="true" /> Add section
      </button>
    </section>
  );
}
