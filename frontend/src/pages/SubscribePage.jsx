import { ArrowRight, Check } from "lucide-react";
import { LinkButton, PageHeader, PageMain, Panel, RequireUser } from "../components/AppPage";
import { usePublicPricing, usePublicStats } from "../lib/publicStats";
import { MedIcon } from "../site/Illustrations";
import { formatCount, plus } from "../site/siteContent";

// The monthly access pass: price, length and what it unlocks. New accounts
// land here after signing up. The account's access status is added in the
// next step of the rollout.
export default function SubscribePage() {
  const { plan } = usePublicPricing();
  const stats = usePublicStats();
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
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Panel className="site-rise">
            <p className="text-sm font-medium text-s-accent">Monthly access pass</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-s-ink">
              <span className="mr-1 text-lg font-medium text-s-mute">PKR</span>
              {formatCount(plan.pricePkr)}
            </p>
            <p className="mt-1 font-chart text-sm text-s-mute">{plan.periodDays} days of full access</p>
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
            <LinkButton to="/dashboard" variant="secondary" className="mt-6 w-full">
              Go to your dashboard <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </LinkButton>
          </Panel>
        </div>
      </PageMain>
    </RequireUser>
  );
}
