import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope, Loader2, Eye, EyeOff, ChevronLeft, Check,
  User, Building2, BookOpen, GraduationCap, Target, CalendarClock,
} from "lucide-react";
import { registerRequest, saveProfileDetails, ROLE_OPTIONS, getCurrentUser } from "../lib/api";

const STEP_LABELS = ["Account", "Role", "Profile"];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  const [account, setAccount] = useState({ fullName: "", email: "", password: "" });
  const [role, setRole] = useState("");
  const [profile, setProfile] = useState({
    institution: "", programme: "MBBS", yearLevel: "", targetExam: "", expectedExamDate: "",
  });

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const data = await registerRequest({ ...account, roleLabel: "" }); // role attached at step 2
      sessionStorage.setItem("kf_mock_user", JSON.stringify(data.user));
      setStatus("idle");
      setStep(2);
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  function handleRoleContinue() {
    if (!role) return;
    const user = getCurrentUser();
    if (user) saveProfileDetails(user, { roleLabel: role });
    setStep(3);
  }

  function finishToDashboard(withProfile) {
    const user = getCurrentUser();
    if (user && withProfile) {
      saveProfileDetails(user, profile);
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Stethoscope size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold text-ink">KF LearnSmart</span>
        </Link>

        {/* Step indicator */}
        <div className="relative mb-7 flex items-center justify-between px-1">
          <div className="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-line" />
          <div
            className="absolute left-4 top-1/2 h-0.5 -translate-y-1/2 bg-brand transition-all duration-300"
            style={{ width: `calc(${(Math.min(step, 3) - 1) / (STEP_LABELS.length - 1)} * (100% - 2rem))` }}
          />
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const isDone = n < step;
            const isActive = n === step;
            return (
              <div
                key={label}
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                  isDone ? "bg-brand text-white" : isActive ? "bg-white text-brand ring-2 ring-brand" : "bg-white text-ink-soft ring-1 ring-line"
                }`}
              >
                {isDone ? <Check size={12} /> : n}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <>
            <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
            <p className="mt-1 text-ink-soft">Start practising clinical skills today — free.</p>

            <form onSubmit={handleAccountSubmit} className="mt-6 space-y-4">
              <TextField
                label="Full name" icon={User} placeholder="Dr Ahmed Khan" required
                value={account.fullName}
                onChange={(v) => setAccount((a) => ({ ...a, fullName: v }))}
              />
              <TextField
                label="Email address" icon={undefined} type="email" placeholder="you@example.com" required
                value={account.email}
                onChange={(v) => setAccount((a) => ({ ...a, email: v }))}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={account.password}
                    onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                    className="w-full rounded-lg border border-line bg-surface-alt px-4 py-3 pr-11 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {status === "error" && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
              >
                {status === "loading" && <Loader2 size={16} className="animate-spin" />}
                Continue
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-brand hover:underline">Sign in</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <button onClick={() => setStep(1)} className="mb-3 flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              <ChevronLeft size={16} /> Back
            </button>
            <h1 className="font-display text-2xl font-bold text-ink">Select your role</h1>
            <p className="mt-1 text-ink-soft">This helps us personalise your experience.</p>

            <div className="mt-6 space-y-3">
              {ROLE_OPTIONS.map((opt) => {
                const selected = role === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRole(opt)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                      selected ? "border-brand bg-brand/5 text-brand" : "border-line text-ink hover:border-brand/40"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
                        selected ? "border-brand bg-brand" : "border-line"
                      }`}
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleRoleContinue}
              disabled={!role}
              className="mt-7 w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <button onClick={() => setStep(2)} className="mb-3 flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              <ChevronLeft size={16} /> Back
            </button>
            <h1 className="font-display text-2xl font-bold text-ink">Tell us about your studies</h1>
            <p className="mt-1 text-ink-soft">Optional — you can add or change this later in Settings.</p>

            <div className="mt-6 space-y-4">
              <TextField label="Institution" icon={Building2} placeholder="Allama Iqbal Medical College" value={profile.institution} onChange={(v) => setProfile((p) => ({ ...p, institution: v }))} />
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Programme" icon={BookOpen} placeholder="MBBS" value={profile.programme} onChange={(v) => setProfile((p) => ({ ...p, programme: v }))} />
                <TextField label="Year / Level" icon={GraduationCap} placeholder="Year 4" value={profile.yearLevel} onChange={(v) => setProfile((p) => ({ ...p, yearLevel: v }))} />
              </div>
              <TextField label="Target examination" icon={Target} placeholder="FCPS Part 1" value={profile.targetExam} onChange={(v) => setProfile((p) => ({ ...p, targetExam: v }))} />
              <TextField label="Expected exam date" icon={CalendarClock} placeholder="e.g. March 2027" value={profile.expectedExamDate} onChange={(v) => setProfile((p) => ({ ...p, expectedExamDate: v }))} />
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => finishToDashboard(false)}
                className="flex-1 rounded-lg border border-line px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-brand hover:text-ink"
              >
                Skip for now
              </button>
              <button
                onClick={() => finishToDashboard(true)}
                className="flex-1 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TextField({ label, icon: Icon, value, onChange, type = "text", placeholder, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        {Icon && <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />}
        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-line bg-surface-alt py-3 pr-3.5 text-sm text-ink outline-none placeholder:text-ink-soft/70 focus:border-brand focus:ring-2 focus:ring-blue-100 ${Icon ? "pl-10" : "pl-4"}`}
        />
      </div>
    </label>
  );
}
