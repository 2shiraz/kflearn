import { useEffect, useState } from "react";
import { getAdminStation, listAdminSpecialties, updateAdminStation } from "../../lib/api";
import { OSCE_CATEGORIES } from "../../lib/osceFilters";
import { PrimaryButton, SecondaryButton } from "../AppPage";
import { AdminDialog, Area, Field, InlineError, Select, Toggle } from "./AdminKit";

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
  };
}

// Edits what students read about a station. The patient script and the
// marking checklist are not edited here.
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

          <section className="space-y-4 border-t border-s-line pt-5">
            <h3 className="font-semibold text-s-ink">Station review</h3>
            <p className="-mt-2 text-sm text-s-mute">Shown to students after they finish the station.</p>
            <Area label="Answer guide" rows={5} maxLength={6000} value={form.keyAnswerGuide} onChange={(v) => set("keyAnswerGuide", v)} />
            <Area label="Suggested approach" helper="One step per line." rows={4} value={form.suggestedCandidateApproach} onChange={(v) => set("suggestedCandidateApproach", v)} />
            <Area label="What examiners look for" rows={3} maxLength={6000} value={form.examinerInstructions} onChange={(v) => set("examinerInstructions", v)} />
            <Area label="Critical safety errors" helper="One per line." rows={3} value={form.criticalSafetyErrors} onChange={(v) => set("criticalSafetyErrors", v)} />
            <Area label="Review notes" rows={3} maxLength={6000} value={form.learningNotes} onChange={(v) => set("learningNotes", v)} />
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
