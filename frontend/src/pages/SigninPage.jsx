import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginRequest } from "../lib/api";
import AuthShell, { FormError, inputClass, primaryButtonClass } from "../components/AuthShell";

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
      await loginRequest(form);
      window.location.href = "/dashboard";
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  return (
    <AuthShell
      footer={
        <>
          New to KF LearnSmart?{" "}
          <Link to="/signup" className="inline-block py-3 font-semibold text-s-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <h1 className="text-2xl font-semibold text-s-ink">Sign in</h1>
      <p className="mt-1.5 text-s-mute">Welcome back. Pick up where you left off.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-s-ink">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-s-ink">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
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
        </div>

        {status === "error" && <FormError>{error}</FormError>}

        <button type="submit" disabled={status === "loading"} className={primaryButtonClass}>
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
