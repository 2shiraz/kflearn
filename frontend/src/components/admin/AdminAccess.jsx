import { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSite } from "../../lib/api";
import { refreshSite } from "../../lib/site";
import { Panel, PrimaryButton } from "../AppPage";
import { InlineError, SavedNote, SectionHeading, Toggle } from "./AdminKit";

const SECTION_ROWS = [
  { key: "stations", label: "OSCE stations", description: "The station bank, the AI patient and checklist practice." },
  { key: "mcqs", label: "MCQs", description: "Past paper questions by year." },
  { key: "ospe", label: "OSPE", description: "Practical stations by year." },
  { key: "history", label: "History Taking Guide", description: "Question sets and frameworks." },
  { key: "clinical-exam", label: "Clinical Exam Guide", description: "Examination steps and findings." },
  { key: "handouts", label: "Handout Notes", description: "Topic notes by system." },
  { key: "progress", label: "Progress", description: "Each student's scores and weak areas." },
];

// Which parts of the app students can use. Admins always see everything.
export default function AdminAccess() {
  const [site, setSite] = useState(null);
  const [saved, setSaved] = useState(null);
  const [services, setServices] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminSettings()
      .then((data) => { setSite(data.site); setSaved(data.site); setServices(data.services); setStatus("idle"); })
      .catch((err) => { setError(err.message); setStatus("error"); });
  }, []);

  const dirty = site && saved && JSON.stringify(site) !== JSON.stringify(saved);

  async function save() {
    setStatus("saving");
    setError("");
    try {
      const data = await updateAdminSite(site);
      setSite(data.site);
      setSaved(data.site);
      setStatus("saved");
      refreshSite();
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  }

  const setSection = (key, value) => { setSite((s) => ({ ...s, sections: { ...s.sections, [key]: value } })); setStatus("idle"); };
  const setFlag = (key, value) => { setSite((s) => ({ ...s, [key]: value })); setStatus("idle"); };

  return (
    <div className="space-y-5">
      <SectionHeading title="Site access" description="Choose what students can use. Switched-off sections disappear from their menu and dashboard. You still see everything as an admin." />
      <InlineError>{error}</InlineError>
      {site && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <Panel>
            <h3 className="font-semibold text-s-ink">Sections</h3>
            <div className="mt-2 divide-y divide-s-line">
              {SECTION_ROWS.map((row) => (
                <Toggle key={row.key} label={row.label} description={row.description} checked={site.sections[row.key] !== false} onChange={(v) => setSection(row.key, v)} />
              ))}
            </div>
          </Panel>
          <div className="space-y-5 self-start">
            <Panel className={site.requireSubscription ? "border-s-accent/40" : ""}>
              <h3 className="font-semibold text-s-ink">Monthly access</h3>
              <div className="mt-2 divide-y divide-s-line">
                <Toggle
                  label="Require monthly access"
                  description="When on, students need an active pass (or its grace days) to open any study section."
                  checked={site.requireSubscription}
                  onChange={(v) => setFlag("requireSubscription", v)}
                />
              </div>
              {site.requireSubscription && !saved.requireSubscription && (
                <p role="alert" className="mt-3 rounded-2xl bg-coral-soft p-3 text-sm leading-relaxed text-s-ink">
                  Saving this locks every student without an active pass out of OSCE stations, MCQs, OSPE, the guides, handouts and progress straight away. Admins and contributors keep full access.
                </p>
              )}
              {!site.requireSubscription && saved.requireSubscription && (
                <p role="alert" className="mt-3 rounded-2xl bg-sun-soft p-3 text-sm leading-relaxed text-s-ink">
                  Saving this opens every study section to all students, with or without a pass.
                </p>
              )}
            </Panel>
            <Panel>
              <h3 className="font-semibold text-s-ink">Online payments</h3>
              <div className="mt-2 divide-y divide-s-line">
                <Toggle
                  label="Let students pay online"
                  description="Shows pay buttons on the Monthly access and AI Credits pages. Paid passes and AI credits are added automatically once the payment provider confirms the payment."
                  checked={site.onlinePayments}
                  onChange={(v) => setFlag("onlinePayments", v)}
                />
              </div>
              {services && !services.payments.connected && (
                <p className="mt-3 rounded-2xl bg-s-tint p-3 text-sm leading-relaxed text-s-mute">
                  No payment provider is set up on the server, so pay buttons stay hidden even with this on. You can still record payments by hand on the Revenue tab.
                </p>
              )}
              {services?.payments.test && (
                <p className="mt-3 rounded-2xl bg-sun-soft p-3 text-sm leading-relaxed text-s-ink">
                  Test mode: checkout uses a pretend payment page and no money is taken. Passes and AI credits bought this way are real, so only use it while testing.
                </p>
              )}
            </Panel>
            <Panel>
              <h3 className="font-semibold text-s-ink">Content protection</h3>
              <div className="mt-2 divide-y divide-s-line">
                <Toggle
                  label="Watermark study pages"
                  description="Shows each student's email faintly across OSCE, MCQ, OSPE, guide and handout pages, so a shared screenshot shows whose account it came from."
                  checked={site.watermark}
                  onChange={(v) => setFlag("watermark", v)}
                />
              </div>
            </Panel>
            <Panel>
              <h3 className="font-semibold text-s-ink">Features</h3>
              <div className="mt-2 divide-y divide-s-line">
                <Toggle label="AI patient and AI marking" description="When off, students practise stations with the checklist and mark themselves." checked={site.aiPatient} onChange={(v) => setFlag("aiPatient", v)} />
                <Toggle label="New signups" description="When off, the signup page tells visitors signups are paused." checked={site.signupsOpen} onChange={(v) => setFlag("signupsOpen", v)} />
              </div>
            </Panel>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton type="button" onClick={save} disabled={!dirty || status === "saving"}>{status === "saving" ? "Saving..." : "Save changes"}</PrimaryButton>
              {status === "saved" && !dirty && <SavedNote />}
            </div>
          </div>
        </div>
      )}
      {status === "loading" && <Panel><p className="text-sm text-s-mute">Loading settings...</p></Panel>}
    </div>
  );
}
