import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import { useBranding } from "../lib/branding";
import { usePublicPricing } from "../lib/publicStats";

const UPDATED = "5 October 2026";

// Shared layout for the legal pages: one reading column, a heading per section.
function LegalLayout({ title, intro, sections }) {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:pt-20">
        <h1 className="site-rise text-4xl font-semibold leading-tight text-s-ink md:text-5xl">{title}</h1>
        <p className="site-rise mt-3 font-chart text-sm text-s-mute" style={{ "--rise-delay": "60ms" }}>Last updated {UPDATED}</p>
        <p className="site-rise mt-6 text-lg leading-relaxed text-s-mute" style={{ "--rise-delay": "100ms" }}>{intro}</p>
        <div className="mt-10 space-y-10">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold text-s-ink">{s.heading}</h2>
              {s.body?.map((p) => <p key={p} className="mt-3 leading-relaxed text-s-mute">{p}</p>)}
              {s.list && (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-s-mute marker:text-s-line">
                  {s.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
        <p className="mt-12 border-t border-s-line pt-6 text-sm text-s-mute">
          See also: <Link to="/terms" className="font-medium text-s-accent hover:underline">Terms</Link>,{" "}
          <Link to="/privacy" className="font-medium text-s-accent hover:underline">Privacy policy</Link> and{" "}
          <Link to="/refunds" className="font-medium text-s-accent hover:underline">Refund and cancellation policy</Link>.
        </p>
      </article>
    </PageShell>
  );
}

export function TermsPage() {
  const { siteName } = useBranding();
  const { plan } = usePublicPricing();
  return (
    <LegalLayout
      title="Terms of use"
      intro={`These terms apply when you create an account on ${siteName} or use it. By creating an account you agree to them.`}
      sections={[
        {
          heading: "What the service is",
          body: [
            `${siteName} is a self-practice tool for medical students. It is not affiliated with any examining body. Feedback from the AI patient and AI marking is for practice only and is not a clinical result, diagnosis or certification.`,
          ],
        },
        {
          heading: "Your account",
          list: [
            "An account is for one person. Use your real name and an email address you control.",
            "Keep your password private. You are responsible for activity on your account.",
            "You can be signed in on up to two devices at a time. Signing in on a third device signs out the device that has been signed in longest.",
            "Sharing an account, or selling or lending access to it, is not allowed. Accounts that are shared may be suspended without a refund.",
          ],
        },
        {
          heading: "The monthly access pass",
          list: [
            `The site's study material (OSCE stations, MCQs, OSPE stations, guides and handout notes) is available only with an active monthly access pass.`,
            `Each pass gives ${plan.periodDays} days of access. If you renew before a pass ends, the new days are added after the days you have left. If you renew after it ends, the new days start on the day you renew.`,
            `After a pass ends you keep access for ${plan.graceDays} more days. After that, study material is locked until you renew.`,
            "A pass does not renew by itself and nothing is charged automatically.",
            "The price shown on the Pricing page when you buy is the price you pay. Price changes apply to passes bought after the change.",
          ],
        },
        {
          heading: "AI credits",
          list: [
            "Sessions with the AI virtual patient and AI marking use AI credits, in addition to an active monthly pass.",
            "AI credits are added to your account when you buy a pack, and your balance and history are shown in your account.",
            "If an AI assessment does not finish, the AI credits it used are returned to your balance automatically.",
          ],
        },
        {
          heading: "Using the content",
          body: ["All questions, stations, checklists, guides and notes on the site are for your own study. You may not:"],
          list: [
            "copy, download in bulk, record, photograph or screenshot content in order to share or publish it",
            "use scripts, bots or other automated tools to access or collect content",
            "resell, republish or otherwise distribute any part of the content",
            "try to get around the access pass, the device limit or any security measure",
          ],
        },
        {
          heading: "Suspension and closure",
          body: [
            "We may suspend or close an account that breaks these terms. You can delete your account at any time from Settings, which permanently removes your account and practice history.",
          ],
        },
        {
          heading: "Availability and changes",
          body: [
            "We work to keep the site available and accurate, but we can't promise it will always be uninterrupted or error-free. Content may be added, updated or removed over time.",
            "We may update these terms. The date at the top shows when they last changed, and continuing to use the site after a change means you accept the updated terms.",
          ],
        },
        {
          heading: "Governing law",
          body: ["These terms are governed by the laws of Pakistan."],
        },
      ]}
    />
  );
}

export function PrivacyPage() {
  const { siteName } = useBranding();
  return (
    <LegalLayout
      title="Privacy policy"
      intro={`This explains what ${siteName} collects about you, why, and what you can do about it.`}
      sections={[
        {
          heading: "What we collect",
          list: [
            "Account details: your name, email address and a securely hashed version of your password. We never store your password itself.",
            "Profile details you choose to add, such as your institution, programme and year.",
            "Your practice: station attempts, scores, checklist marks, and your messages to the AI patient.",
            "Voice input: when you use the microphone, the recording is sent for transcription and the text is kept with your attempt. We don't keep the recording.",
            "Purchases: the passes and AI credit packs you buy, and your AI credit balance and history.",
            "Security information: the devices and browsers you sign in from and their IP addresses, used to keep your account safe and to apply the two-device limit.",
          ],
        },
        {
          heading: "How we use it",
          list: [
            "To run your account, unlock the content your pass includes and show your progress.",
            "To answer you as the AI patient and to mark your stations.",
            "To prevent account sharing, misuse and fraud.",
            "To improve stations and content, for example by reviewing questions the AI patient could not answer.",
          ],
          body: ["We don't sell your information and we don't show advertising."],
        },
        {
          heading: "Who else processes it",
          body: [
            "Your messages and voice recordings are sent to the AI providers that power the virtual patient, transcription and marking, only to produce a reply, a transcript or a mark. Our database and servers are run by hosting providers that store data on our behalf.",
          ],
        },
        {
          heading: "Cookies and storage",
          body: [
            "We use a few essential cookies to keep you signed in and to protect forms against misuse. Your browser also stores some preferences, such as a collapsed menu. We don't use advertising or tracking cookies.",
          ],
        },
        {
          heading: "Keeping and deleting your data",
          body: [
            "We keep your information while your account is open. You can delete your account at any time from Settings, which permanently deletes your account, attempts and practice history. Records of purchases may be kept where needed for accounting.",
          ],
        },
        {
          heading: "Security",
          body: [
            "Passwords are hashed, connections are encrypted, and sign-in uses secure cookies. No system is perfectly secure, so please use a strong password that you don't use anywhere else.",
          ],
        },
      ]}
    />
  );
}

export function RefundsPage() {
  const { plan } = usePublicPricing();
  return (
    <LegalLayout
      title="Refund and cancellation policy"
      intro="How cancelling and refunds work for monthly access passes and AI credits."
      sections={[
        {
          heading: "Cancelling",
          body: [
            `Passes don't renew automatically, so there is nothing to cancel. When your ${plan.periodDays} days and the ${plan.graceDays}-day grace period are over, access simply stops until you renew. You won't be charged again unless you choose to renew.`,
          ],
        },
        {
          heading: "Monthly access passes",
          body: [
            "Because the study material is available as soon as a pass starts, passes are not refundable once they begin, including for days you don't use. We will refund a pass if:",
          ],
          list: [
            "you were charged twice, or charged the wrong amount",
            "you paid but the pass was never added to your account",
            "a fault on our side stopped you using the site for a large part of the pass",
          ],
        },
        {
          heading: "AI credits",
          body: [
            "If an AI assessment doesn't finish, its AI credits are returned to your balance automatically. AI credit packs are not refundable once bought, except for duplicate or incorrect charges.",
          ],
        },
        {
          heading: "Suspended accounts",
          body: ["Accounts suspended for breaking the terms, for example by sharing, are not refunded."],
        },
        {
          heading: "Asking for a refund",
          body: [
            "Contact our support team within 14 days of the payment, using the email address on your account. Tell us the date, the amount and what went wrong. Approved refunds are returned to the original payment method.",
          ],
        },
      ]}
    />
  );
}
