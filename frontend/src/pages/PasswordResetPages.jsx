import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { forgotPasswordRequest, resetPasswordRequest } from "../lib/api";
import { SigninAside } from "../components/AuthAside";
import AuthShell, { FormError, inputClass, primaryButtonClass } from "../components/AuthShell";

const backToSignin = (
  <>
    Remembered it?{" "}
    <Link to="/signin" className="inline-block py-3 font-semibold text-s-accent hover:underline">Sign in</Link>
  </>
);

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await forgotPasswordRequest(email);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  return (
    <AuthShell aside={<SigninAside />} footer={backToSignin}>
      {status === "sent" ? (
        <div role="status">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft text-s-good" aria-hidden="true">
            <MailCheck size={24} strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-s-ink">Check your email</h1>
          <p className="mt-1.5 leading-relaxed text-s-mute">
            If <span className="font-medium text-s-ink">{email}</span> has an account, we've sent it a link to choose a new password. The link works for 30 minutes.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-s-mute">Nothing arrived? Check your spam folder, or wait a couple of minutes and ask again.</p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-s-ink">Forgot your password?</h1>
          <p className="mt-1.5 text-s-mute">Enter your account's email and we'll send you a link to choose a new one.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-s-ink">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
            </div>
            {status === "error" && <FormError>{error}</FormError>}
            <button type="submit" disabled={status === "loading"} className={primaryButtonClass}>
              {status === "loading" ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  // Read once, then taken out of the address bar so the link doesn't linger
  // in history or get sent to other sites as a referrer.
  const [token] = useState(() => params.get("token") || "");
  useEffect(() => {
    if (window.location.search) window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await resetPasswordRequest({ token, password });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <AuthShell aside={<SigninAside />} footer={backToSignin}>
        <h1 className="text-2xl font-semibold text-s-ink">This link isn't complete</h1>
        <p className="mt-1.5 leading-relaxed text-s-mute">Open the link from your email again, or ask for a new one.</p>
        <Link to="/forgot-password" className={`${primaryButtonClass} mt-7`}>Get a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell aside={<SigninAside />} footer={backToSignin}>
      {status === "done" ? (
        <div role="status">
          <h1 className="text-2xl font-semibold text-s-ink">Password changed</h1>
          <p className="mt-1.5 leading-relaxed text-s-mute">You've been signed out on every device. Sign in with your new password.</p>
          <Link to="/signin" className={`${primaryButtonClass} mt-7`}>Sign in</Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-s-ink">Choose a new password</h1>
          <p className="mt-1.5 text-s-mute">At least 8 characters, with a letter and a number.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-s-ink">New password</label>
              <div className="relative">
                <input id="password" name="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pr-14`} />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-s-mute hover:text-s-ink">
                  {show ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                </button>
              </div>
            </div>
            {status === "error" && (
              <FormError>
                {error}{" "}
                {/expired|isn't valid/.test(error) && <Link to="/forgot-password" className="font-semibold underline">Get a new link</Link>}
              </FormError>
            )}
            <button type="submit" disabled={status === "loading"} className={primaryButtonClass}>
              {status === "loading" ? "Saving..." : "Save new password"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
