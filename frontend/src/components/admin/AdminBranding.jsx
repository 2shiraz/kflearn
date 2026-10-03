import { useEffect, useRef, useState } from "react";
import { Check, ImageUp, Trash2 } from "lucide-react";
import { getAdminSettings, updateAdminBranding } from "../../lib/api";
import { ACCENTS, logoUrl, refreshPublicSite } from "../../lib/branding";
import { Panel, PrimaryButton, SecondaryButton } from "../AppPage";
import { Area, Field, InlineError, SavedNote, SectionHeading } from "./AdminKit";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO = 200 * 1024;

// Name, logo, theme colour and the text shown in browser tabs and search
// results.
export default function AdminBranding() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState("");
  const [logo, setLogo] = useState(undefined); // undefined: unchanged, null: remove, string: new data URL
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function load(branding) {
    setForm(branding);
    setSaved(JSON.stringify(branding));
    setLogo(undefined);
  }

  useEffect(() => {
    getAdminSettings().then((d) => { load(d.branding); setStatus("idle"); }).catch((err) => { setError(err.message); setStatus("error"); });
  }, []);

  const dirty = form && (JSON.stringify(form) !== saved || logo !== undefined);
  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setStatus("idle"); };

  function pickLogo(file) {
    setError("");
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) return setError("Use a PNG, JPEG or WebP image. SVG isn't allowed.");
    if (file.size > MAX_LOGO) return setError("The logo must be under 200 KB. A square image around 256 by 256 pixels works best.");
    const reader = new window.FileReader();
    reader.onload = () => { setLogo(reader.result); setStatus("idle"); };
    reader.readAsDataURL(file);
  }

  async function save(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const payload = { siteName: form.siteName, metaTitle: form.metaTitle, metaDescription: form.metaDescription, accent: form.accent };
      if (logo !== undefined) payload.logo = logo;
      const data = await updateAdminBranding(payload);
      load(data.branding);
      setStatus("saved");
      refreshPublicSite();
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  const previewLogo = logo === null ? "/logo.svg" : logo || (form && logoUrl(form));

  return (
    <div className="space-y-5">
      <SectionHeading title="Branding" description="Your name, logo and colour across the site, and how it appears in browser tabs and search results." />
      <InlineError>{error}</InlineError>
      {form && (
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <h3 className="font-semibold text-s-ink">Name and logo</h3>
              <Field className="mt-4" label="Site name" helper="Shown next to the logo in the menu, header and footer." required maxLength={40} value={form.siteName} onChange={(v) => set("siteName", v)} />
              <div className="mt-5 flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-s-line bg-s-page p-2">
                  <img src={previewLogo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </span>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept={LOGO_TYPES.join(",")} className="sr-only" onChange={(e) => { pickLogo(e.target.files?.[0]); e.target.value = ""; }} />
                  <SecondaryButton onClick={() => fileRef.current?.click()}><ImageUp size={16} strokeWidth={2} aria-hidden="true" /> Upload logo</SecondaryButton>
                  {(logo || (logo === undefined && form.logoVersion > 0)) && (
                    <SecondaryButton onClick={() => { setLogo(null); setStatus("idle"); }}><Trash2 size={16} strokeWidth={2} aria-hidden="true" /> Use default</SecondaryButton>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-s-mute">PNG, JPEG or WebP, under 200 KB. A square logo on a transparent background looks best.</p>
            </Panel>

            <Panel>
              <h3 className="font-semibold text-s-ink">Theme colour</h3>
              <p className="mt-0.5 text-sm text-s-mute">Used for buttons, links and highlights.</p>
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7 lg:grid-cols-4 xl:grid-cols-7" role="radiogroup" aria-label="Theme colour">
                {Object.entries(ACCENTS).map(([key, c]) => (
                  <button key={key} type="button" role="radio" aria-checked={form.accent === key} aria-label={c.label} title={c.label} onClick={() => set("accent", key)} className="site-press flex flex-col items-center gap-1.5">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full ring-offset-2 ring-offset-s-card ${form.accent === key ? "ring-2" : ""}`} style={{ background: c.accent, "--tw-ring-color": c.accent }}>
                      {form.accent === key && <Check size={18} strokeWidth={2.5} className="text-white" aria-hidden="true" />}
                    </span>
                    <span className="text-xs text-s-mute">{c.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-s-tint/50 p-3">
                <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: ACCENTS[form.accent].accent }}>Start a station</span>
                <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: ACCENTS[form.accent].soft, color: ACCENTS[form.accent].strong }}>Selected</span>
                <span className="text-sm font-semibold" style={{ color: ACCENTS[form.accent].accent }}>A link</span>
              </div>
            </Panel>
          </div>

          <Panel>
            <h3 className="font-semibold text-s-ink">Browser tab and search results</h3>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <Field label="Page title" helper={`${form.metaTitle.length} / 70. Shown in the browser tab and as the search result heading.`} required maxLength={70} value={form.metaTitle} onChange={(v) => set("metaTitle", v)} />
                <Area label="Description" helper={`${form.metaDescription.length} / 160. The short summary under the title in search results.`} maxLength={160} rows={3} value={form.metaDescription} onChange={(v) => set("metaDescription", v)} />
              </div>
              <div className="self-start rounded-2xl border border-s-line bg-s-card p-4" aria-label="Search result preview">
                <p className="font-chart text-[11px] text-s-mute">Search result preview</p>
                <p className="mt-2 truncate text-lg text-[#1a0dab]">{form.metaTitle || "Page title"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-s-mute">{form.metaDescription || "Add a description so search engines show your own summary."}</p>
              </div>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" disabled={!dirty || status === "saving"}>{status === "saving" ? "Saving..." : "Save branding"}</PrimaryButton>
            {dirty && <SecondaryButton onClick={() => { setForm(JSON.parse(saved)); setLogo(undefined); setError(""); }}>Discard changes</SecondaryButton>}
            {status === "saved" && !dirty && <SavedNote />}
          </div>
        </form>
      )}
      {status === "loading" && <Panel><p className="text-sm text-s-mute">Loading branding...</p></Panel>}
    </div>
  );
}
