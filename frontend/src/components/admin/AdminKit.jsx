import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

// Small shared pieces for the admin screens, in the app's own style: pill
// buttons, rounded-xl inputs, rounded-3xl panels.
export const fieldClass =
  "mt-2 min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3.5 py-2.5 text-sm font-normal text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent focus:ring-2 focus:ring-s-accent/20";

export function Field({ label, helper, value, onChange, className = "", ...props }) {
  return (
    <label className={`block text-sm font-medium text-s-ink ${className}`}>
      {label}
      {helper && <span className="mt-0.5 block text-xs font-normal text-s-mute">{helper}</span>}
      <input className={fieldClass} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

export function Area({ label, helper, value, onChange, rows = 4, className = "", ...props }) {
  return (
    <label className={`block text-sm font-medium text-s-ink ${className}`}>
      {label}
      {helper && <span className="mt-0.5 block text-xs font-normal text-s-mute">{helper}</span>}
      <textarea className={`${fieldClass} leading-relaxed`} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

export function Select({ label, value, onChange, children, className = "" }) {
  return (
    <label className={`block text-sm font-medium text-s-ink ${className}`}>
      {label}
      <select className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </label>
  );
}

// An on/off row: label and explanation on the left, a switch on the right.
export function Toggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 py-3 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-s-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-s-mute">{description}</span>}
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full bg-s-line transition-colors peer-checked:bg-s-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-s-accent after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-s-card after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export function SavedNote({ children = "Saved" }) {
  return (
    <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-sm font-medium text-s-good">
      <Check size={15} strokeWidth={2.5} aria-hidden="true" /> {children}
    </span>
  );
}

export function InlineError({ children }) {
  if (!children) return null;
  return <p role="alert" className="rounded-2xl bg-coral-soft/60 px-4 py-3 text-sm text-s-miss">{children}</p>;
}

export function SectionHeading({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold tracking-tight text-s-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-s-mute">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Native modal: focus trap, Escape and an inert page behind it for free.
// Rendered into <body> and pinned to the viewport, so it always opens in
// front of the page however far the admin has scrolled. The page behind
// doesn't scroll while it's open.
export function AdminDialog({ open, title, description, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return undefined;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="admin-dialog-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`site fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto overscroll-contain rounded-3xl border border-s-line bg-s-card p-0 text-s-ink shadow-2xl backdrop:bg-s-ink/40 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="admin-dialog-title" className="text-xl font-semibold tracking-tight text-s-ink">{title}</h2>
              {description && <p className="mt-1 text-sm text-s-mute">{description}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="site-press -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-tint hover:text-s-ink">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      )}
    </dialog>,
    document.body,
  );
}

// One-click show or hide for every station review part. `visibility` maps
// each part to true (shown) or false (hidden).
export function ShowAllToggle({ visibility, onChange }) {
  const keys = Object.keys(visibility);
  const shown = keys.filter((k) => visibility[k] !== false).length;
  const allShown = shown === keys.length;
  const setAll = (value) => onChange(Object.fromEntries(keys.map((k) => [k, value])));
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span className="font-chart text-xs text-s-mute">{shown} of {keys.length} shown</span>
      <div className="inline-flex rounded-full border border-s-line bg-s-card p-0.5" role="group" aria-label="Show or hide all review parts">
        <button type="button" aria-pressed={allShown} onClick={() => setAll(true)} className={`site-press min-h-9 rounded-full px-3 text-xs font-semibold ${allShown ? "bg-s-accent text-s-on-accent" : "text-s-mute hover:text-s-ink"}`}>Show all</button>
        <button type="button" aria-pressed={shown === 0} onClick={() => setAll(false)} className={`site-press min-h-9 rounded-full px-3 text-xs font-semibold ${shown === 0 ? "bg-s-ink text-s-on-accent" : "text-s-mute hover:text-s-ink"}`}>Hide all</button>
      </div>
    </div>
  );
}
