import { useEffect, useRef, useState } from "react";
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
//
// fullscreen: takes the whole screen, with a header holding the title and a
// Close button, and the content scrolling underneath.
// sections: [{ id, label }] for a fullscreen form. Adds a sticky "On this
// page" list beside the form on wide screens that jumps to each section and
// marks the one in view.
// footer: actions pinned in a full-width bar along the bottom (fullscreen).
// dirty: when true, closing (Close, Escape or a click outside) first asks
// whether to discard the unsaved changes. With onSave, that prompt also
// offers to save them (saveLabel) instead.
export function AdminDialog({ open, title, description, onClose, children, wide = false, fullscreen = false, footer = null, sections = null, dirty = false, busy = false, onSave = null, saveLabel = "Save" }) {
  const ref = useRef(null);
  const [confirming, setConfirming] = useState(false);
  const scrollRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const sectionKey = sections?.map((s) => s.id).join(",") || "";

  // Mark the last section whose heading has scrolled past the top edge.
  useEffect(() => {
    const box = scrollRef.current;
    if (!open || !box || !sectionKey) return undefined;
    const ids = sectionKey.split(",");
    const update = () => {
      const top = box.getBoundingClientRect().top + 96;
      let active = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= top) active = id;
      }
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) active = ids[ids.length - 1];
      setCurrent(active);
    };
    update();
    box.addEventListener("scroll", update, { passive: true });
    return () => box.removeEventListener("scroll", update);
  }, [open, sectionKey]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) {
      setConfirming(false);
      return undefined;
    }
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);

  // Leaving the page (reload, closing the tab) with unsaved edits asks too.
  useEffect(() => {
    if (!open || !dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);

  // Scroll only the form area: scrollIntoView would also shift the dialog
  // itself and push the header off screen.
  const jumpTo = (id) => {
    const box = scrollRef.current;
    const el = document.getElementById(id);
    if (!box || !el) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 32;
    box.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose();
  };

  const closeButton = (
    <button type="button" onClick={requestClose} aria-label={fullscreen ? undefined : "Close"} className={fullscreen
      ? "site-press inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-s-line bg-s-card px-4 text-sm font-semibold text-s-ink hover:bg-s-tint"
      : "site-press -mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-tint hover:text-s-ink"}
    >
      <X size={fullscreen ? 16 : 18} strokeWidth={2} aria-hidden={fullscreen} />
      {fullscreen && "Close"}
    </button>
  );

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="admin-dialog-title"
      onCancel={(e) => { e.preventDefault(); if (confirming) setConfirming(false); else requestClose(); }}
      onClick={(e) => e.target === ref.current && !fullscreen && requestClose()}
      className={fullscreen
        ? "site fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-s-page p-0 text-s-ink"
        : `site fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto overscroll-contain rounded-3xl border border-s-line bg-s-card p-0 text-s-ink shadow-2xl backdrop:bg-s-ink/40 backdrop:backdrop-blur-sm`}
    >
      {open && (fullscreen ? (
        <div className="flex h-full flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-s-line bg-s-card px-4 py-3 sm:px-8">
            <div className="min-w-0">
              <h2 id="admin-dialog-title" className="truncate text-lg font-semibold tracking-tight text-s-ink">{title}</h2>
              {description && <p className="hidden truncate text-sm text-s-mute sm:block">{description}</p>}
            </div>
            <div className="flex items-center gap-3">
              {dirty && <span className="hidden font-chart text-xs text-s-mute sm:inline">Unsaved changes</span>}
              {closeButton}
            </div>
          </header>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {sections ? (
              <div className="mx-auto grid max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:px-8">
                <nav aria-label="Sections" className="hidden lg:block">
                  <div className="sticky top-8">
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-s-mute">On this page</p>
                    <ul className="mt-2 space-y-0.5">
                      {sections.map(({ id, label }) => (
                        <li key={id}>
                          <button type="button" onClick={() => jumpTo(id)}
                            aria-current={current === id ? "true" : undefined}
                            className={`site-press w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${current === id ? "bg-s-accent-soft font-semibold text-s-accent-strong" : "text-s-mute hover:bg-s-tint hover:text-s-ink"}`}
                          >{label}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </nav>
                <div className="min-w-0">{children}</div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl px-6 py-6">{children}</div>
            )}
          </div>
          {footer && (
            <footer className="shrink-0 border-t border-s-line bg-s-card">
              <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:justify-end sm:px-8">{footer}</div>
            </footer>
          )}
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="admin-dialog-title" className="text-xl font-semibold tracking-tight text-s-ink">{title}</h2>
              {description && <p className="mt-1 text-sm text-s-mute">{description}</p>}
            </div>
            {closeButton}
          </div>
          <div className="mt-5">{children}</div>
        </div>
      ))}
      {open && confirming && (
        <div className="fixed inset-0 flex items-center justify-center bg-s-ink/40 p-4 backdrop-blur-sm" role="alertdialog" aria-labelledby="discard-title" aria-describedby="discard-body">
          <div className="w-full max-w-md rounded-3xl border border-s-line bg-s-card p-6 shadow-2xl">
            <h3 id="discard-title" className="text-lg font-semibold tracking-tight text-s-ink">Discard unsaved changes?</h3>
            <p id="discard-body" className="mt-1.5 text-sm text-s-mute">{onSave ? `You've made changes that haven't been saved. ${saveLabel} to keep them, or discard them and close.` : "You've made changes that haven't been saved. If you close now they'll be lost."}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setConfirming(false); onClose(); }} className="site-press inline-flex min-h-11 items-center justify-center rounded-full border border-coral/40 bg-s-card px-5 text-sm font-semibold text-s-miss hover:bg-coral-soft">Discard</button>
              <button type="button" autoFocus={!onSave} onClick={() => setConfirming(false)} className={onSave
                ? "site-press inline-flex min-h-11 items-center justify-center rounded-full border border-s-line bg-s-card px-5 text-sm font-semibold text-s-ink hover:bg-s-tint"
                : "site-press inline-flex min-h-11 items-center justify-center rounded-full bg-s-accent px-5 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong"}
              >Keep editing</button>
              {onSave && (
                <button type="button" autoFocus onClick={() => { setConfirming(false); onSave(); }} className="site-press inline-flex min-h-11 items-center justify-center rounded-full bg-s-accent px-5 text-sm font-semibold text-s-on-accent hover:bg-s-accent-strong">{saveLabel}</button>
              )}
            </div>
          </div>
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
