import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { registerRequest, ROLE_OPTIONS } from "../lib/api";
import AuthShell, { FormError, inputClass, primaryButtonClass, secondaryButtonClass } from "../components/AuthShell";

const STEP_LABELS = ["Account", "Role", "Profile"];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const [account, setAccount] = useState({ fullName: "", email: "", password: "" });
  const [role, setRole] = useState("");
  const [profile, setProfile] = useState({
    institution: "", programme: "MBBS", yearLevel: "", targetExam: "", expectedExamDate: "",
  });

  function handleAccountSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("idle");
    setStep(2);
  }

  function handleRoleContinue() {
    if (!role) return;
    setStep(3);
  }

  async function finishToDashboard(withProfile) {
    setStatus("loading");
    setError("");
    try {
      await registerRequest({
        ...account,
        roleLabel: role,
        profile: withProfile ? profile : {},
      });
      window.location.href = "/dashboard";
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  return (
    <AuthShell
      footer={
        step === 1 && (
          <>
            Already have an account?{" "}
            <Link to="/signin" className="inline-block py-3 font-semibold text-s-accent hover:underline">
              Sign in
            </Link>
          </>
        )
      }
    >
      <StepIndicator step={step} />

      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="-ml-1 mt-4 flex min-h-11 items-center gap-1 rounded-full px-1 text-sm font-medium text-s-accent hover:underline"
        >
          <ChevronLeft size={16} strokeWidth={2} /> Back
        </button>
      )}

      {step === 1 && (
        <>
          <h1 className="mt-6 text-2xl font-semibold text-s-ink">Create your account</h1>
          <p className="mt-1.5 text-s-mute">Free, and it takes about a minute.</p>

          <form onSubmit={handleAccountSubmit} className="mt-7 space-y-5">
            <Field
              id="fullName" label="Full name" placeholder="Ahmed Khan" required autoComplete="name"
              value={account.fullName}
              onChange={(v) => setAccount((a) => ({ ...a, fullName: v }))}
            />
            <Field
              id="email" label="Email address" type="email" placeholder="you@example.com" required autoComplete="email"
              value={account.email}
              onChange={(v) => setAccount((a) => ({ ...a, email: v }))}
            />
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-s-ink">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
                  title="At least 8 characters, including a letter and a number."
                  aria-describedby="password-help"
                  placeholder="Create a password"
                  value={account.password}
                  onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                  className={`${inputClass} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-s-mute hover:text-s-ink"
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
                </button>
              </div>
              <p id="password-help" className="text-sm text-s-mute">At least 8 characters, with a letter and a number.</p>
            </div>

            {status === "error" && <FormError>{error}</FormError>}

            <button type="submit" disabled={status === "loading"} className={primaryButtonClass}>
              Continue
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-s-ink">What describes you best?</h1>
          <p className="mt-1.5 text-s-mute">This helps us tailor what you see first.</p>

          <fieldset className="mt-7">
            <legend className="sr-only">Your role</legend>
            <div className="space-y-2.5">
              {ROLE_OPTIONS.map((opt) => {
                const selected = role === opt;
                return (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-[15px] font-medium transition ${
                      selected ? "border-s-accent bg-s-accent-soft text-s-ink" : "border-s-line bg-s-page text-s-ink hover:border-s-accent/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt}
                      checked={selected}
                      onChange={() => setRole(opt)}
                      className="h-4 w-4 accent-s-accent"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button type="button" onClick={handleRoleContinue} disabled={!role} className={`${primaryButtonClass} mt-7`}>
            Continue
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="mt-4 text-2xl font-semibold text-s-ink">Tell us about your studies</h1>
          <p className="mt-1.5 text-s-mute">Optional. You can change this later in Settings.</p>

          <div className="mt-7 space-y-5">
            <Field id="institution" label="Institution" placeholder="Allama Iqbal Medical College" autoComplete="organization" value={profile.institution} onChange={(v) => setProfile((p) => ({ ...p, institution: v }))} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="programme" label="Programme" placeholder="MBBS" value={profile.programme} onChange={(v) => setProfile((p) => ({ ...p, programme: v }))} />
              <Field id="yearLevel" label="Year or level" placeholder="Year 4" value={profile.yearLevel} onChange={(v) => setProfile((p) => ({ ...p, yearLevel: v }))} />
            </div>
            <Field id="targetExam" label="Target examination" placeholder="FCPS Part 1" value={profile.targetExam} onChange={(v) => setProfile((p) => ({ ...p, targetExam: v }))} />
            <Field id="expectedExamDate" label="Expected exam date" placeholder="March 2027" value={profile.expectedExamDate} onChange={(v) => setProfile((p) => ({ ...p, expectedExamDate: v }))} />
          </div>

          {status === "error" && <div className="mt-5"><FormError>{error}</FormError></div>}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => finishToDashboard(false)} disabled={status === "loading"} className={secondaryButtonClass}>
              Skip for now
            </button>
            <button type="button" onClick={() => finishToDashboard(true)} disabled={status === "loading"} className={primaryButtonClass}>
              {status === "loading" ? "Creating account..." : "Finish"}
            </button>
          </div>
        </>
      )}
    </AuthShell>
  );
}

function StepIndicator({ step }) {
  return (
    <div>
      <p className="text-sm font-medium text-s-mute">
        Step {step} of {STEP_LABELS.length}: <span className="text-s-ink">{STEP_LABELS[step - 1]}</span>
      </p>
      <ol className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
        {STEP_LABELS.map((label, i) => (
          <li key={label} className={`h-1 rounded-full ${i < step ? "bg-s-accent" : "bg-s-line"}`} />
        ))}
      </ol>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", placeholder, required = false, autoComplete }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-s-ink">{label}</label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}
