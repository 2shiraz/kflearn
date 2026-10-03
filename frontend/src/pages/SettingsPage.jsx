import { useEffect, useState } from "react";
import { BookOpen, Building2, CalendarClock, Camera, Check, GraduationCap, Mail, Sparkles, Target, User } from "lucide-react";
import { fetchCurrentUser, getCurrentUser, updateProfileRequest } from "../lib/api";
import { PageHeader, PageMain, PrimaryButton, RequireUser } from "../components/AppPage";
import { FormError, inputClass } from "../components/AuthShell";
import { HealthIcon } from "../site/Illustrations";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = "/signin";
      return;
    }
    applyUser(u);
    fetchCurrentUser().then((data) => {
      if (data?.user) applyUser(data.user);
    }).catch(() => {});
  }, []);

  if (!user || !form) return null;

  function handleChange(e) {
    setSaved(false);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const data = await updateProfileRequest({
        fullName: form.fullName,
        roleLabel: form.role,
        profile: {
          institution: form.institution,
          programme: form.programme,
          yearLevel: form.yearLevel,
          targetExam: form.targetExam,
          expectedExamDate: form.expectedExamDate,
        },
      });
      if (data?.user) applyUser(data.user);
      setSaved(true);
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  function applyUser(nextUser) {
    setUser(nextUser);
    setForm({
      fullName: nextUser.fullName || "",
      email: nextUser.email || "",
      role: nextUser.roleLabel || (nextUser.role === "admin" ? "Admin" : "MBBS Student"),
      institution: nextUser.institution || nextUser.profile?.institution || "",
      programme: nextUser.programme || nextUser.profile?.programme || "",
      yearLevel: nextUser.yearLevel || nextUser.profile?.yearLevel || "",
      targetExam: nextUser.targetExam || nextUser.profile?.targetExam || "",
      expectedExamDate: nextUser.expectedExamDate || nextUser.profile?.expectedExamDate || "",
    });
  }

  const initials = form.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const subtitle = [form.yearLevel, form.institution].filter(Boolean).join(", ");

  return (
    <RequireUser active="settings">
      <PageMain>
        <PageHeader className="mb-8" title="Profile and settings" description="Manage your account and practice details." />

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="site-rise site-grid h-fit overflow-hidden rounded-3xl border border-s-line">
            <div className="relative h-20 bg-linear-to-r from-s-accent-soft via-sky-soft to-mint-soft">
              <span className="pointer-events-none absolute -right-4 -top-4 text-s-accent opacity-[0.12]" aria-hidden="true">
                <HealthIcon name="stethoscope" size={96} />
              </span>
            </div>
            <div className="px-6 pb-6 text-center">
              <div className="relative -mt-10 inline-block">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-s-card bg-s-accent text-2xl font-semibold text-s-on-accent site-shadow">
                  {initials}
                </span>
                <button
                  type="button"
                  disabled
                  title="Photo upload isn't available yet"
                  aria-label="Change photo (not available yet)"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-s-card bg-s-ink text-s-on-accent opacity-60"
                >
                  <Camera size={14} strokeWidth={2} />
                </button>
              </div>

              <p className="mt-3 text-lg font-semibold tracking-tight text-s-ink">{form.fullName}</p>
              {subtitle && <p className="text-sm text-s-mute">{subtitle}</p>}

              <div className="mt-4 flex justify-center">
                <span className="rounded-full bg-s-accent-soft px-3 py-1 font-chart text-xs text-s-accent-strong">{form.role}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="site-rise site-grid rounded-3xl border border-s-line p-6 sm:p-7" style={{ "--rise-delay": "80ms" }}>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-s-ink">
              <GraduationCap size={18} strokeWidth={2} className="text-s-accent" aria-hidden="true" /> Academic profile
            </h2>
            <p className="mt-1 text-sm text-s-mute">This helps us suggest the right stations and timelines for you.</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field icon={User} label="Full name" name="fullName" value={form.fullName} onChange={handleChange} />
              <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} disabled />
              <Field icon={GraduationCap} label="Role" name="role" value={form.role} onChange={handleChange} disabled />
              <Field icon={Building2} label="Institution" name="institution" value={form.institution} onChange={handleChange} />
              <Field icon={BookOpen} label="Programme" name="programme" value={form.programme} onChange={handleChange} />
              <Field icon={GraduationCap} label="Year / Level" name="yearLevel" value={form.yearLevel} onChange={handleChange} />
              <Field icon={Target} label="Target examination" name="targetExam" value={form.targetExam} onChange={handleChange} />
              <Field icon={CalendarClock} label="Expected exam date" name="expectedExamDate" placeholder="e.g. March 2027" value={form.expectedExamDate} onChange={handleChange} />
            </div>

            {status === "error" && <div className="mt-6"><FormError>{error}</FormError></div>}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-s-line pt-6">
              <PrimaryButton type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Saving..." : "Save changes"}
              </PrimaryButton>
              {saved && (
                <span role="status" className="flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-sm font-medium text-s-good">
                  <Check size={15} strokeWidth={2.5} aria-hidden="true" /> Saved
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-s-mute sm:ml-auto">
                <Sparkles size={13} strokeWidth={2} aria-hidden="true" /> Used to personalise your dashboard
              </span>
            </div>
          </form>
        </div>
      </PageMain>
    </RequireUser>
  );
}

function Field({ icon: Icon, label, name, value, onChange, type = "text", placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-s-ink">{label}</span>
      <div className="relative">
        <Icon size={16} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" />
        <input
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:bg-s-tint/60 disabled:text-s-mute`}
        />
      </div>
    </label>
  );
}
