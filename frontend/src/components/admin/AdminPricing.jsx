import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getAdminSettings, updateAdminPricing } from "../../lib/api";
import { refreshCredits } from "../../lib/credits";
import { Panel, PrimaryButton, SecondaryButton } from "../AppPage";
import { Field, InlineError, SavedNote, SectionHeading } from "./AdminKit";

const toInt = (value) => (value === "" ? NaN : Number(value));

// AI credit prices: what each AI action costs, the packages on the pricing
// page, and the free credits new accounts start with.
export default function AdminPricing() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  function load(pricing) {
    const next = {
      welcomeCredits: String(pricing.welcomeCredits),
      virtualPatient: String(pricing.costs.virtualPatient),
      aiAssessment: String(pricing.costs.aiAssessment),
      packages: pricing.packages.map((p) => ({ id: p.id, name: p.name, credits: String(p.credits), pricePkr: String(p.pricePkr) })),
    };
    setForm(next);
    setSaved(JSON.stringify(next));
  }

  useEffect(() => {
    getAdminSettings()
      .then((data) => { load(data.pricing); setStatus("idle"); })
      .catch((err) => { setError(err.message); setStatus("error"); });
  }, []);

  const dirty = form && JSON.stringify(form) !== saved;
  const update = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setStatus("idle"); };
  const updatePackage = (index, key, value) => {
    setForm((f) => ({ ...f, packages: f.packages.map((p, i) => (i === index ? { ...p, [key]: value } : p)) }));
    setStatus("idle");
  };

  async function save(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const data = await updateAdminPricing({
        welcomeCredits: toInt(form.welcomeCredits),
        costs: { virtualPatient: toInt(form.virtualPatient), aiAssessment: toInt(form.aiAssessment) },
        packages: form.packages.map((p) => ({ id: p.id, name: p.name, credits: toInt(p.credits), pricePkr: toInt(p.pricePkr) })),
      });
      load(data.pricing);
      setStatus("saved");
      refreshCredits();
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  const fullStation = (toInt(form?.virtualPatient) || 0) + (toInt(form?.aiAssessment) || 0);

  return (
    <div className="mt-6 space-y-5">
      <SectionHeading title="Pricing" description="Changes apply straight away to new sessions, signups and the public pricing page. Past purchases and balances are not changed." />
      <InlineError>{error}</InlineError>
      {form && (
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <h3 className="font-semibold text-s-ink">AI credit costs</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="AI patient session" type="number" min="1" inputMode="numeric" value={form.virtualPatient} onChange={(v) => update("virtualPatient", v)} />
                <Field label="AI marking" type="number" min="1" inputMode="numeric" value={form.aiAssessment} onChange={(v) => update("aiAssessment", v)} />
              </div>
              <p className="mt-4 rounded-2xl bg-s-tint/60 px-4 py-3 text-sm text-s-mute">A full station with AI marking costs <strong className="text-s-ink">{fullStation || 0} AI credits</strong>.</p>
            </Panel>
            <Panel>
              <h3 className="font-semibold text-s-ink">New accounts</h3>
              <Field className="mt-4" label="Free AI credits at signup" helper="Set to 0 to give none." type="number" min="0" inputMode="numeric" value={form.welcomeCredits} onChange={(v) => update("welcomeCredits", v)} />
            </Panel>
          </div>

          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-s-ink">Credit packages</h3>
              <SecondaryButton disabled={form.packages.length >= 8} onClick={() => update("packages", [...form.packages, { name: "", credits: "", pricePkr: "" }])}>
                <Plus size={16} strokeWidth={2} aria-hidden="true" /> Add package
              </SecondaryButton>
            </div>
            {form.packages.length === 0 && <p className="mt-4 rounded-2xl bg-s-tint/60 px-4 py-3 text-sm text-s-mute">No packages. The pricing page will show none until you add one.</p>}
            <div className="mt-4 space-y-3">
              {form.packages.map((pkg, index) => {
                const credits = toInt(pkg.credits);
                const price = toInt(pkg.pricePkr);
                const stations = fullStation && credits ? Math.floor(credits / fullStation) : 0;
                return (
                  <div key={pkg.id || `new-${index}`} className="grid items-end gap-3 rounded-2xl border border-s-line p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <Field label="Name" value={pkg.name} maxLength={40} onChange={(v) => updatePackage(index, "name", v)} />
                    <Field label="AI credits" type="number" min="1" inputMode="numeric" value={pkg.credits} onChange={(v) => updatePackage(index, "credits", v)} />
                    <Field label="Price (PKR)" type="number" min="0" inputMode="numeric" value={pkg.pricePkr} onChange={(v) => updatePackage(index, "pricePkr", v)} />
                    <button type="button" aria-label={`Remove ${pkg.name || "package"}`} onClick={() => update("packages", form.packages.filter((_, i) => i !== index))} className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss">
                      <Trash2 size={17} strokeWidth={2} />
                    </button>
                    {stations > 0 && price >= 0 && (
                      <p className="text-xs text-s-mute sm:col-span-4">About {stations} full stations with AI marking.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton type="submit" disabled={!dirty || status === "saving"}>{status === "saving" ? "Saving..." : "Save pricing"}</PrimaryButton>
            {dirty && <SecondaryButton onClick={() => { setForm(JSON.parse(saved)); setError(""); }}>Discard changes</SecondaryButton>}
            {status === "saved" && !dirty && <SavedNote />}
          </div>
        </form>
      )}
      {status === "loading" && <Panel><p className="text-sm text-s-mute">Loading pricing...</p></Panel>}
    </div>
  );
}
