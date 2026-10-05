import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, X } from "lucide-react";
import { getCurrentUser } from "../lib/api";
import { useSite } from "../lib/site";

const DAY = 24 * 60 * 60 * 1000;
const DISMISS_KEY = "kf_access_banner";

const longDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long" });

function dismissedFor() {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

// In-app reminder: from 5 days before the pass ends, and every day of the
// grace period. Can be closed for the rest of the visit.
export default function AccessBanner() {
  const site = useSite();
  const access = site.access;
  const [dismissed, setDismissed] = useState(dismissedFor);
  const user = getCurrentUser();
  if (!access?.required || access.unlimited || ["admin", "contributor"].includes(user?.role)) return null;

  const now = Date.now();
  const until = access.until ? new Date(access.until).getTime() : null;
  let message = null;
  let urgent = false;
  if (access.active && until && until - now <= 5 * DAY) {
    message = `Your access ends on ${longDate(until)}.`;
  } else if (access.inGrace && access.graceUntil) {
    const left = Math.max(1, Math.ceil((new Date(access.graceUntil).getTime() - now) / DAY));
    message = `Your access has ended. Renew within ${left} ${left === 1 ? "day" : "days"} to keep using the site.`;
    urgent = true;
  }
  const key = `${access.until}:${urgent}`;
  if (!message || dismissed === key) return null;

  function close() {
    setDismissed(key);
    try {
      sessionStorage.setItem(DISMISS_KEY, key);
    } catch {
      // Storage blocked: closed for this page only.
    }
  }

  return (
    <div role="status" className={`mx-4 mt-20 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm sm:mx-6 sm:mt-4 lg:mx-8 ${urgent ? "bg-coral-soft text-s-ink" : "bg-sun-soft text-s-ink"}`}>
      <Clock3 size={18} strokeWidth={2} className={`shrink-0 ${urgent ? "text-s-miss" : "text-sun"}`} aria-hidden="true" />
      <p className="min-w-0 flex-1">
        {message}{" "}
        <Link to="/subscribe" className="font-semibold text-s-accent hover:underline">Renew now</Link>
      </p>
      <button type="button" onClick={close} aria-label="Close reminder" className="site-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-card/60 hover:text-s-ink">
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
