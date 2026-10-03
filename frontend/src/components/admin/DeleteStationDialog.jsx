import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminStation } from "../../lib/api";
import { AdminDialog, Field, InlineError } from "./AdminKit";

// Deletes a station for good: the station, its AI patient, its checklist and
// every student attempt at it. The admin types the title to confirm.
// Archiving is offered as the gentler option.
export default function DeleteStationDialog({ station, onClose, onDeleted, onArchive }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTyped("");
    setError("");
  }, [station?.id]);

  const matches = station && typed.trim() === station.title.trim();

  async function remove(e) {
    e.preventDefault();
    if (!matches) return;
    setBusy(true);
    setError("");
    try {
      await deleteAdminStation(station.id, typed.trim());
      onDeleted(station);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const attempts = station?.attempts || 0;

  return (
    <AdminDialog open={Boolean(station)} title="Delete station" description="This can't be undone." onClose={() => !busy && onClose()}>
      {station && (
        <form onSubmit={remove} className="space-y-4">
          <div className="rounded-2xl border border-coral/30 bg-coral-soft/30 p-4 text-sm text-s-ink">
            <p className="font-semibold">{station.title}</p>
            <p className="mt-2 text-s-mute">Deleting removes, for good:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-s-mute">
              <li>the station, its checklist and its AI patient</li>
              <li>{attempts === 0 ? "no student attempts (nobody has practised it yet)" : <><strong className="text-s-ink">{attempts.toLocaleString()} student {attempts === 1 ? "attempt" : "attempts"}</strong> and their scores</>}</li>
            </ul>
            {station.status !== "archived" && (
              <p className="mt-3 text-s-mute">
                Only want students to stop seeing it?{" "}
                <button type="button" onClick={() => { onArchive(station); onClose(); }} className="font-semibold text-s-accent hover:underline">Archive it instead</button>
              </p>
            )}
          </div>
          <Field label={<>Type <strong>{station.title}</strong> to confirm</>} value={typed} onChange={setTyped} autoComplete="off" />
          <InlineError>{error}</InlineError>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={busy} className="site-press inline-flex min-h-11 items-center justify-center rounded-full border border-s-line bg-s-card px-5 text-sm font-semibold text-s-ink hover:bg-s-tint">Cancel</button>
            <button type="submit" disabled={!matches || busy} className="site-press inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-s-miss px-5 text-sm font-semibold text-s-on-accent hover:opacity-90 disabled:pointer-events-none disabled:opacity-40">
              <Trash2 size={16} strokeWidth={2} aria-hidden="true" /> {busy ? "Deleting..." : "Delete for good"}
            </button>
          </div>
        </form>
      )}
    </AdminDialog>
  );
}
