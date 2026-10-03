import { useEffect, useRef } from "react";
import { DoorOpen } from "lucide-react";
import { PrimaryButton } from "./AppPage";

// Native modal (focus trap, Escape, inert page behind) warning that leaving
// ends the station without saving it.
export default function LeaveStationDialog({ open, leaving, error, onStay, onLeave, ai = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="leave-station-title"
      aria-describedby="leave-station-body"
      onCancel={(e) => {
        e.preventDefault();
        onStay();
      }}
      onClick={(e) => e.target === ref.current && onStay()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-s-line bg-s-card p-0 text-s-ink shadow-2xl backdrop:bg-s-ink/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-soft text-s-miss" aria-hidden="true">
          <DoorOpen size={22} strokeWidth={2} />
        </span>
        <h2 id="leave-station-title" className="mt-4 text-xl font-semibold tracking-tight text-s-ink">Leave this station?</h2>
        <div id="leave-station-body" className="mt-2 space-y-2 text-sm leading-relaxed text-s-mute">
          <p>Your station isn't finished. If you leave now it ends here and nothing is saved, so it won't appear in your attempts.</p>
          {ai && <p>AI credits already used for this session aren't refunded.</p>}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-coral-soft/60 px-3 py-2 text-sm text-s-miss">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLeave}
            disabled={leaving}
            className="site-press inline-flex min-h-11 items-center justify-center rounded-full border border-coral/40 bg-s-card px-5 text-sm font-semibold text-s-miss hover:bg-coral-soft disabled:opacity-50"
          >
            {leaving ? "Leaving..." : "Leave station"}
          </button>
          <PrimaryButton autoFocus onClick={onStay} disabled={leaving}>Keep practising</PrimaryButton>
        </div>
      </div>
    </dialog>
  );
}
