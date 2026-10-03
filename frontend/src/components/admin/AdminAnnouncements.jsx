import { useEffect, useState } from "react";
import { AlertTriangle, CircleCheck, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  listAdminAnnouncements,
  updateAdminAnnouncement,
} from "../../lib/api";
import { refreshSite } from "../../lib/site";
import { Panel, PrimaryButton, SecondaryButton } from "../AppPage";
import { AdminDialog, Area, Field, InlineError, SectionHeading, Select, Toggle } from "./AdminKit";

const TONE_LOOK = {
  info: { label: "Information", Icon: Megaphone, chip: "bg-s-accent-soft text-s-accent-strong" },
  success: { label: "Good news", Icon: CircleCheck, chip: "bg-mint-soft text-s-good" },
  warning: { label: "Important", Icon: AlertTriangle, chip: "bg-sun-soft text-s-ink" },
};

const EMPTY = { title: "", message: "", tone: "info", linkLabel: "", linkHref: "", active: true, endsAt: "" };

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

function statusOf(a) {
  if (!a.active) return { label: "Hidden", className: "bg-s-tint text-s-mute" };
  if (a.endsAt && new Date(a.endsAt) <= new Date()) return { label: "Ended", className: "bg-s-tint text-s-mute" };
  return { label: "Live", className: "bg-mint-soft text-s-good" };
}

// Banners shown at the top of every student's dashboard.
export default function AdminAnnouncements() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // { id?, ...form }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => listAdminAnnouncements()
    .then((data) => { setRows(data); setStatus("idle"); })
    .catch((err) => { setError(err.message); setStatus("error"); });

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const { id, ...form } = editing;
    // The end date is inclusive: the banner stays up for the whole day.
    const payload = { ...form, endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null };
    try {
      if (id) await updateAdminAnnouncement(id, payload);
      else await createAdminAnnouncement(payload);
      setEditing(null);
      await load();
      refreshSite();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(a) {
    setError("");
    try {
      await updateAdminAnnouncement(a.id, { active: !a.active });
      await load();
      refreshSite();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(a) {
    if (!window.confirm(`Delete "${a.title}"? This can't be undone.`)) return;
    setError("");
    try {
      await deleteAdminAnnouncement(a.id);
      await load();
      refreshSite();
    } catch (err) {
      setError(err.message);
    }
  }

  const set = (key, value) => setEditing((f) => ({ ...f, [key]: value }));

  return (
    <div className="mt-6 space-y-5">
      <SectionHeading
        title="Announcements"
        description="Short messages at the top of every student's dashboard, such as exam dates, new stations or downtime. Up to three live ones show at once."
        actions={<PrimaryButton type="button" onClick={() => { setFormError(""); setEditing({ ...EMPTY }); }}><Plus size={16} strokeWidth={2} aria-hidden="true" /> New announcement</PrimaryButton>}
      />
      <InlineError>{error}</InlineError>

      <Panel>
        {status === "loading" && <p className="text-sm text-s-mute">Loading announcements...</p>}
        {status !== "loading" && rows.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-s-accent-soft text-s-accent" aria-hidden="true"><Megaphone size={22} strokeWidth={2} /></span>
            <p className="mt-3 font-medium text-s-ink">No announcements yet</p>
            <p className="mt-1 max-w-sm text-sm text-s-mute">Post one to tell every student about an exam date, new content or planned downtime.</p>
          </div>
        )}
        <ul className="divide-y divide-s-line">
          {rows.map((a) => {
            const look = TONE_LOOK[a.tone] || TONE_LOOK.info;
            const state = statusOf(a);
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${look.chip}`} aria-hidden="true"><look.Icon size={18} strokeWidth={2} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-s-ink">{a.title}</p>
                  {a.message && <p className="mt-0.5 line-clamp-2 text-sm text-s-mute">{a.message}</p>}
                  <p className="mt-1 font-chart text-xs text-s-mute">
                    {a.endsAt ? `Until ${new Date(a.endsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "No end date"}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 font-chart text-xs ${state.className}`}>{state.label}</span>
                <SecondaryButton onClick={() => toggle(a)} className="px-4">{a.active ? "Hide" : "Show"}</SecondaryButton>
                <button type="button" aria-label={`Edit ${a.title}`} onClick={() => { setFormError(""); setEditing({ id: a.id, title: a.title, message: a.message, tone: a.tone, linkLabel: a.linkLabel, linkHref: a.linkHref, active: a.active, endsAt: toDateInput(a.endsAt) }); }} className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-mute hover:bg-s-tint hover:text-s-ink"><Pencil size={16} strokeWidth={2} /></button>
                <button type="button" aria-label={`Delete ${a.title}`} onClick={() => remove(a)} className="site-press flex h-11 w-11 items-center justify-center rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss"><Trash2 size={16} strokeWidth={2} /></button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <AdminDialog open={Boolean(editing)} title={editing?.id ? "Edit announcement" : "New announcement"} onClose={() => !saving && setEditing(null)}>
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Title" required maxLength={100} value={editing.title} onChange={(v) => set("title", v)} placeholder="Mock OSCE on Friday" />
            <Area label="Message" helper="Optional. Keep it to a sentence or two." maxLength={500} rows={3} value={editing.message} onChange={(v) => set("message", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Style" value={editing.tone} onChange={(v) => set("tone", v)}>
                {Object.entries(TONE_LOOK).map(([value, look]) => <option key={value} value={value}>{look.label}</option>)}
              </Select>
              <Field label="Ends on" helper="Optional. Hidden after this day." type="date" value={editing.endsAt} onChange={(v) => set("endsAt", v)} />
              <Field label="Button text" helper="Optional." maxLength={40} value={editing.linkLabel} onChange={(v) => set("linkLabel", v)} placeholder="Practise now" />
              <Field label="Button link" helper="A page like /stations, or an https:// link." maxLength={300} value={editing.linkHref} onChange={(v) => set("linkHref", v)} placeholder="/stations" />
            </div>
            <div className="border-t border-s-line">
              <Toggle label="Show to students" checked={editing.active} onChange={(v) => set("active", v)} />
            </div>
            <InlineError>{formError}</InlineError>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={() => setEditing(null)} disabled={saving}>Cancel</SecondaryButton>
              <PrimaryButton type="submit" disabled={saving || !editing.title.trim()}>{saving ? "Saving..." : editing.id ? "Save changes" : "Post announcement"}</PrimaryButton>
            </div>
          </form>
        )}
      </AdminDialog>
    </div>
  );
}
