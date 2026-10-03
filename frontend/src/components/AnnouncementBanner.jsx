import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CircleCheck, Megaphone, X } from "lucide-react";
import { useSite } from "../lib/site";

// Announcements the admin publishes, shown at the top of app pages. Dismissing
// one hides it in this browser until the admin edits it.
const DISMISSED_KEY = "kf_dismissed_announcements";

const TONE = {
  info: { box: "bg-s-accent-soft/70 border-s-accent/15", icon: "text-s-accent", Icon: Megaphone },
  success: { box: "bg-mint-soft border-mint/20", icon: "text-s-good", Icon: CircleCheck },
  warning: { box: "bg-sun-soft border-sun/25", icon: "text-sun", Icon: AlertTriangle },
};

function readDismissed() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || [];
  } catch {
    return [];
  }
}

const stamp = (a) => `${a.id}:${a.updatedAt}`;

export default function AnnouncementBanner() {
  const { announcements } = useSite();
  const [dismissed, setDismissed] = useState(readDismissed);
  const visible = (announcements || []).filter((a) => !dismissed.includes(stamp(a)));
  if (visible.length === 0) return null;

  function dismiss(a) {
    const next = [...dismissed, stamp(a)].slice(-50);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: it stays hidden for this page view only.
    }
  }

  return (
    <div className="mb-6 space-y-2" role="region" aria-label="Announcements">
      {visible.map((a) => {
        const tone = TONE[a.tone] || TONE.info;
        const external = a.linkHref?.startsWith("https://");
        return (
          <div key={a.id} className={`site-rise flex items-start gap-3 rounded-2xl border p-3.5 sm:items-center sm:p-4 ${tone.box}`}>
            <tone.Icon size={18} strokeWidth={2} className={`mt-0.5 shrink-0 sm:mt-0 ${tone.icon}`} aria-hidden="true" />
            <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
              <p className="text-sm leading-relaxed text-s-ink">
                <strong className="font-semibold">{a.title}</strong>
                {a.message && <span className="text-s-mute"> {a.message}</span>}
              </p>
              {a.linkHref && a.linkLabel && (
                external ? (
                  <a href={a.linkHref} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-s-accent hover:underline sm:mt-0 sm:ml-auto">
                    {a.linkLabel} <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                  </a>
                ) : (
                  <Link to={a.linkHref} className="mt-1 inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-s-accent hover:underline sm:mt-0 sm:ml-auto">
                    {a.linkLabel} <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                  </Link>
                )
              )}
            </div>
            <button type="button" onClick={() => dismiss(a)} aria-label={`Dismiss: ${a.title}`} className="site-press -my-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-card/70 hover:text-s-ink">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
