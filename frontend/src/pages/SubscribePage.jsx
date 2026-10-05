import { useEffect, useState } from "react";
import { ArrowRight, Check, CircleCheck, Clock3, FlaskConical, Lock, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "../lib/api";
import { refreshSite, useSite } from "../lib/site";
import { ErrorMessage, LinkButton, PageHeader, PageMain, Panel, PrimaryButton, RequireUser } from "../components/AppPage";
import { beginCheckout, usePaymentOptions } from "../lib/payments";
import { usePublicPricing, usePublicStats } from "../lib/publicStats";
import { MedIcon } from "../site/Illustrations";
import { formatCount, plus } from "../site/siteContent";

const longDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
const DAY = 24 * 60 * 60 * 1000;

// The account's current access, worked out by the server.
function accessStatus(access, user) {
  if (["admin", "contributor"].includes(user?.role) || access?.unlimited) {
    return { tone: "mint", icon: ShieldCheck, title: "Full access", body: "Your account manages the site, so everything is always open." };
  }
  if (!access) return null;
  if (access.active) {
    const days = Math.max(1, Math.ceil((new Date(access.until).getTime() - Date.now()) / DAY));
    return { tone: "mint", icon: CircleCheck, title: `Active until ${longDate(access.until)}`, body: `${days} ${days === 1 ? "day" : "days"} left. Renewing adds days after this date.` };
  }
  if (access.inGrace) {
    return { tone: "sun", icon: Clock3, title: `Ended on ${longDate(access.until)}`, body: `You can keep using the site until ${longDate(access.graceUntil)}. Renew before then to avoid losing access.` };
  }
  if (!access.required) {
    return { tone: "mint", icon: CircleCheck, title: "Everything is open", body: "Your account can use the whole site right now." };
  }
  if (access.until) {
    return { tone: "coral", icon: Lock, title: `Ended on ${longDate(access.until)}`, body: "Renew to open the study material again. Your progress and AI credits are kept." };
  }
  return { tone: "coral", icon: Lock, title: "No monthly access yet", body: "Once your pass is active, every study section opens." };
}

const TONE = {
  mint: "bg-mint-soft text-s-good",
  sun: "bg-sun-soft text-sun",
  coral: "bg-coral-soft text-s-miss",
};

// The monthly access pass: price, length, what it unlocks, and where this
// account stands. New accounts land here after signing up.
export default function SubscribePage() {
  const { plan } = usePublicPricing();
  const site = useSite();
  const user = getCurrentUser();
  // Re-check on arrival so access granted a moment ago shows straight away.
  useEffect(() => { refreshSite(); }, []);
  const status = accessStatus(site.access, user);
  const hasAccess = site.access?.hasAccess || ["admin", "contributor"].includes(user?.role);
  const stats = usePublicStats();
  const payments = usePaymentOptions();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const isStudent = !["admin", "contributor"].includes(user?.role);

  async function pay() {
    setPaying(true);
    setPayError("");
    try {
      await beginCheckout("monthly-access");
    } catch (err) {
      setPayError(err.message);
      setPaying(false);
    }
  }
  const included = [
    { icon: "medicalRecords", tone: "bg-s-accent-soft text-s-accent", label: "OSCE stations with guided self-practice" },
    { icon: "book", tone: "bg-sky-soft text-sky", label: `${plus(stats.mcq.total)} MCQs with explanations` },
    { icon: "microscope", tone: "bg-mint-soft text-mint", label: `${plus(stats.ospe.total)} OSPE stations` },
    { icon: "heart", tone: "bg-coral-soft text-coral", label: "Clinical examination and history-taking guides" },
    { icon: "medicines", tone: "bg-violet-soft text-violet", label: `${plus(stats.handouts.total)} handout notes` },
    { icon: "cardiogram", tone: "bg-sun-soft text-sun", label: "Your progress and attempt history" },
  ];

  return (
    <RequireUser active="subscribe">
      <PageMain width="focused">
        <PageHeader title="Monthly access" description={`One pass unlocks the whole library for ${plan.periodDays} days.`} />
        {status && (
          <div role="status" className="site-rise mb-5 flex items-start gap-4 rounded-3xl border border-s-line bg-s-card p-5 sm:p-6">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TONE[status.tone]}`} aria-hidden="true">
              <status.icon size={22} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-s-ink">{status.title}</p>
              <p className="mt-0.5 leading-relaxed text-s-mute">{status.body}</p>
            </div>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Panel className="site-rise">
            <p className="text-sm font-medium text-s-accent">Monthly access pass</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-s-ink">
              <span className="mr-1 text-lg font-medium text-s-mute">PKR</span>
              {formatCount(plan.pricePkr)}
            </p>
            <p className="mt-1 font-chart text-sm text-s-mute">{plan.periodDays} days of full access</p>
            {payments?.enabled && isStudent && (
              <div className="mt-5">
                <PrimaryButton type="button" onClick={pay} disabled={paying} className="w-full sm:w-auto">
                  {paying ? "Opening checkout..." : site.access?.until ? "Renew access" : "Get monthly access"}
                  {!paying && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
                </PrimaryButton>
                {payments.test && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-s-mute">
                    <FlaskConical size={13} strokeWidth={2} aria-hidden="true" /> Test mode. No money is taken.
                  </p>
                )}
                {payError && <div className="mt-3"><ErrorMessage message={payError} /></div>}
              </div>
            )}
            <ul className="mt-6 space-y-3">
              {included.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-[15px] text-s-ink">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                    <MedIcon name={item.icon} size={24} />
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel className="site-rise self-start" style={{ "--rise-delay": "80ms" }}>
            <h2 className="text-lg font-semibold text-s-ink">How it works</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-s-mute">
              {[
                `Each pass adds ${plan.periodDays} days. Renewing early adds to the days you have left.`,
                `When a pass ends you keep access for ${plan.graceDays} more days to renew.`,
                "The AI patient and AI marking also use AI credits.",
                "One account per student, on up to two devices.",
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <Check size={17} strokeWidth={2.25} className="mt-0.5 shrink-0 text-s-good" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            {hasAccess && (
              <LinkButton to="/dashboard" variant="secondary" className="mt-6 w-full">
                Go to your dashboard <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </LinkButton>
            )}
          </Panel>
        </div>
      </PageMain>
    </RequireUser>
  );
}
