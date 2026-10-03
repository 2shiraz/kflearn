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
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminSettings()
      .then((data) => { setSite(data.site); setSaved(data.site); setStatus("idle"); })
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
