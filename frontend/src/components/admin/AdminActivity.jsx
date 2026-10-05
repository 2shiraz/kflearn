import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getAdminActivity } from "../../lib/api";
import { Panel } from "../AppPage";
import { InlineError, SectionHeading } from "./AdminKit";
import { timeAgo } from "./AdminOverview";

const FIELD_LABELS = {
  role: "role", fullName: "name", suspended: "suspension", amount: "credits", sections: "sections", aiPatient: "AI patient",
  signupsOpen: "signups", welcomeCredits: "signup credits", costs: "costs", packages: "packages", siteName: "site name",
  metaTitle: "title", metaDescription: "description", accent: "theme colour", logo: "logo", status: "status",
  requireSubscription: "monthly access", watermark: "watermark", onlinePayments: "online payments",
};

// Every change made in the admin area, newest first. Secret values such as
// API keys are never stored, only which settings changed.
export default function AdminActivity() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getAdminActivity().then(setRows).catch((err) => setError(err.message));
  }, []);
  return (
    <div className="space-y-5">
      <SectionHeading title="Activity log" description="The last 50 changes made by admins. Only admins can see this, and entries can't be edited or removed." />
      <InlineError>{error}</InlineError>
      <Panel>
        {!rows && !error && <p className="text-sm text-s-mute">Loading...</p>}
        {rows?.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-s-accent-soft text-s-accent" aria-hidden="true"><ShieldCheck size={22} strokeWidth={2} /></span>
            <p className="mt-3 font-medium text-s-ink">Nothing changed yet</p>
          </div>
        )}
        <ol className="divide-y divide-s-line">
          {rows?.map((r) => {
            const fields = (r.fields || []).map((f) => FIELD_LABELS[f]).filter(Boolean);
            return (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0 flex-1 text-sm text-s-ink">
                  {r.action}
                  {fields.length > 0 && <span className="text-s-mute"> ({fields.join(", ")})</span>}
                </span>
                <span className="truncate text-sm text-s-mute">{r.actorEmail}</span>
                <span className="w-24 text-right font-chart text-xs text-s-mute" title={new Date(r.createdAt).toLocaleString()}>{timeAgo(r.createdAt)}</span>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
