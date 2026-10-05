import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, CircleCheck, CircleX, Clock3, FlaskConical } from "lucide-react";
import { completeTestCheckout, getCheckout } from "../lib/api";
import { refreshCredits } from "../lib/credits";
import { refreshSite } from "../lib/site";
import { ErrorMessage, LinkButton, PageMain, Panel, PrimaryButton, RequireUser, SecondaryButton } from "../components/AppPage";
import { Skeleton } from "../components/Skeleton";

const pkr = (amount) => `PKR ${Number(amount).toLocaleString()}`;
const POLL_MS = 2000;
const POLL_FOR_MS = 90 * 1000;

function OrderSummary({ checkout }) {
  return (
    <dl className="mt-5 divide-y divide-s-line rounded-2xl border border-s-line text-sm">
      <div className="flex justify-between gap-3 px-4 py-3">
        <dt className="text-s-mute">Item</dt>
        <dd className="text-right font-medium text-s-ink">
          {checkout.packageName}
          {checkout.kind === "subscription" ? `, ${checkout.accessDays} days` : `, ${checkout.credits.toLocaleString()} AI credits`}
        </dd>
      </div>
      <div className="flex justify-between gap-3 px-4 py-3">
        <dt className="text-s-mute">Amount</dt>
        <dd className="font-chart font-semibold text-s-ink">{pkr(checkout.amount)}</dd>
      </div>
    </dl>
  );
}

// Test mode only: stands in for the payment provider's own page. Pay and
// Decline send the result back through the same signed notification a real
// provider would.
export function TestCheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getCheckout(id).then((data) => setCheckout(data.checkout)).catch((err) => setError(err.message));
  }, [id]);

  async function finish(outcome) {
    setBusy(outcome);
    setError("");
    try {
      await completeTestCheckout(id, outcome);
      navigate(`/checkout/return?checkout=${encodeURIComponent(id)}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy("");
    }
  }

  return (
    <RequireUser active="subscribe">
      <PageMain width="focused">
        <Panel className="site-rise mx-auto mt-4 max-w-lg">
          <p className="inline-flex items-center gap-2 rounded-full bg-sun-soft px-3 py-1 text-xs font-medium text-s-ink">
            <FlaskConical size={14} strokeWidth={2} aria-hidden="true" /> Test payment
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-s-ink">Confirm your payment</h1>
          <p className="mt-1.5 leading-relaxed text-s-mute">Test payment. No money is taken. Choose what the payment provider should report.</p>
          {error && <div className="mt-5"><ErrorMessage message={error} /></div>}
          {!checkout && !error && <div className="mt-5 space-y-3"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-2/3" /></div>}
          {checkout && (
            <>
              <OrderSummary checkout={checkout} />
              {checkout.status === "pending" ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <PrimaryButton type="button" onClick={() => finish("paid")} disabled={Boolean(busy)}>
                    {busy === "paid" ? "Paying..." : `Pay ${pkr(checkout.amount)}`}
                  </PrimaryButton>
                  <SecondaryButton onClick={() => finish("failed")} disabled={Boolean(busy)}>
                    {busy === "failed" ? "Declining..." : "Decline"}
                  </SecondaryButton>
                </div>
              ) : (
                <LinkButton to={`/checkout/return?checkout=${encodeURIComponent(id)}`} className="mt-6 w-full">See the result</LinkButton>
              )}
            </>
          )}
        </Panel>
      </PageMain>
    </RequireUser>
  );
}

const RESULT = {
  paid: { icon: CircleCheck, tone: "bg-mint-soft text-s-good", title: "Payment received" },
  failed: { icon: CircleX, tone: "bg-coral-soft text-s-miss", title: "Payment didn't go through", body: "Nothing was charged. You can try again." },
  expired: { icon: CircleX, tone: "bg-coral-soft text-s-miss", title: "This checkout has expired", body: "Nothing was charged. Start again when you're ready." },
  pending: { icon: Clock3, tone: "bg-sun-soft text-sun", title: "Confirming your payment", body: "This usually takes a few seconds. Keep this page open." },
  slow: { icon: Clock3, tone: "bg-sun-soft text-sun", title: "Still confirming your payment", body: "It's taking longer than usual. Your pass or AI credits are added as soon as the payment is confirmed, so you can leave this page and check back. If nothing changes within an hour, contact support with the time you paid." },
};

// Where the payment provider sends the student back. The address itself
// proves nothing: the result shown is the server's, which only changes when
// the provider's signed notification arrives.
export function CheckoutReturnPage() {
  const [params] = useSearchParams();
  const id = params.get("checkout") || "";
  const [checkout, setCheckout] = useState(null);
  const [error, setError] = useState(id ? "" : "This page needs a checkout to show.");
  const [slow, setSlow] = useState(false);
  const refreshed = useRef(false);

  useEffect(() => {
    if (!id) return undefined;
    let live = true;
    let timer;
    const startedAt = Date.now();
    const poll = async () => {
      try {
        const data = await getCheckout(id);
        if (!live) return;
        setCheckout(data.checkout);
        if (data.checkout.status !== "pending") return;
      } catch (err) {
        if (!live) return;
        setError(err.message);
        return;
      }
      if (Date.now() - startedAt > POLL_FOR_MS) setSlow(true);
      timer = setTimeout(poll, Date.now() - startedAt > POLL_FOR_MS ? POLL_MS * 5 : POLL_MS);
    };
    poll();
    return () => { live = false; clearTimeout(timer); };
  }, [id]);

  useEffect(() => {
    if (checkout?.status !== "paid" || refreshed.current) return;
    refreshed.current = true;
    refreshSite();
    refreshCredits().catch(() => {});
  }, [checkout?.status]);

  const state = checkout ? (checkout.status === "pending" && slow ? "slow" : checkout.status) : null;
  const result = state ? RESULT[state] || RESULT.pending : null;
  const subscription = checkout?.kind === "subscription";
  const paidBody = subscription
    ? `${checkout?.accessDays} days of access have been added to your account. A receipt is on its way to your email.`
    : `${checkout?.credits?.toLocaleString()} AI credits have been added to your balance. A receipt is on its way to your email.`;

  return (
    <RequireUser active="subscribe">
      <PageMain width="focused">
        <Panel className="site-rise mx-auto mt-4 max-w-lg">
          {error && <ErrorMessage message={error} />}
          {!error && !checkout && (
            <div className="space-y-3"><Skeleton className="h-12 w-12" /><Skeleton className="h-7 w-2/3" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-5/6" /></div>
          )}
          {result && (
            <div role="status" aria-live="polite">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${result.tone}`} aria-hidden="true">
                <result.icon size={24} strokeWidth={2} />
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-s-ink">{result.title}</h1>
              <p className="mt-1.5 leading-relaxed text-s-mute">{state === "paid" ? paidBody : result.body}</p>
              <OrderSummary checkout={checkout} />
              <div className="mt-6">
                {state === "paid" && (
                  <LinkButton to={subscription ? "/dashboard" : "/credits"} className="w-full">
                    {subscription ? "Go to your dashboard" : "Back to AI credits"} <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                  </LinkButton>
                )}
                {["failed", "expired"].includes(state) && (
                  <LinkButton to={subscription ? "/subscribe" : "/credits"} className="w-full">Try again</LinkButton>
                )}
              </div>
            </div>
          )}
        </Panel>
      </PageMain>
    </RequireUser>
  );
}
