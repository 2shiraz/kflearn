import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck, Stethoscope } from "lucide-react";
import { loginRequest } from "../lib/api";

export default function SigninPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const data = await loginRequest(form);
      sessionStorage.setItem("kf_mock_user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  function handleGoogleClick() {
    setError("Google sign-in isn't connected yet - use email/password for now.");
    setStatus("error");
  }

  return (
    <div className="app-gradient-bg grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-r border-line bg-white/55 px-14 py-12 text-ink backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2">
          <span className="gradient-brand flex h-9 w-9 items-center justify-center rounded-[9px] text-white">
            <Stethoscope size={20} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold">KF LearnSmart</span>
        </div>

        <blockquote className="gradient-card max-w-md rounded-[18px] p-7" style={{ "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(127,139,255,0.35)" }}>
          <p className="font-display text-2xl font-extrabold leading-snug">
            "KF LearnSmart helped me structure my cardiovascular examination properly. The AI
            feedback showed me exactly what I was missing in every attempt."
          </p>
          <footer className="mt-6 flex items-center gap-3">
            <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white">
              FA
            </span>
            <div className="text-sm">
              <p className="font-semibold">Fatima Akhtar</p>
              <p className="text-ink-soft">MBBS Year 5 - AIMC, Lahore</p>
            </div>
          </footer>
        </blockquote>

        <p className="flex items-center gap-2 text-xs text-ink-soft">
          <ShieldCheck size={14} /> Formative assessment only. Not an official examination platform.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="glass-surface w-full max-w-sm rounded-[18px] p-8">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="gradient-brand flex h-8 w-8 items-center justify-center rounded-[9px] text-white">
              <Stethoscope size={18} strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-bold text-ink">KF LearnSmart</span>
          </div>

          <h1 className="font-display text-3xl font-extrabold text-ink">Welcome back</h1>
          <p className="mt-1 text-ink-soft">Sign in to continue practising</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-white/80 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-line bg-white/80 px-4 py-3 pr-11 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {status === "error" && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="gradient-brand flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:opacity-60"
            >
              {status === "loading" && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-sm text-ink-soft">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            className="glass-surface flex w-full items-center justify-center gap-2.5 rounded-full px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-brand hover:underline">
              Create one free
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-ink-soft">
            By signing in you agree to our{" "}
            <a href="/terms" className="underline hover:text-ink">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-ink">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
