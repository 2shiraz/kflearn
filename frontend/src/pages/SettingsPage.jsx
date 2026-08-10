import { useEffect, useState } from "react";
import { Check, Camera, User, Mail, GraduationCap, Building2, BookOpen, Target, CalendarClock, Sparkles } from "lucide-react";
import { getCurrentUser, logout } from "../lib/api";
import Sidebar from "../components/Sidebar";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      window.location.href = "/signin";
      return;
    }
    setUser(u);
    setForm({
      fullName: u.fullName,
      email: u.email,
      role: u.role === "contributor" ? "Clinical Content Contributor" : "MBBS Student",
      institution: "Allama Iqbal Medical College",
      programme: "MBBS",
      yearLevel: "Year 4",
      targetExam: "FCPS Part 1",
      expectedExamDate: "March 2027",
    });
  }, []);

  if (!user || !form) return null;

  function handleChange(e) {
    setSaved(false);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSave(e) {
    e.preventDefault();
    // Mock only — no PATCH /api/users/me endpoint exists yet (see API_SPEC.md).
    setSaved(true);
  }

  const initials = form.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <Sidebar active="settings" onLogout={() => { logout(); window.location.href = "/signin"; }} />

      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <User size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Profile &amp; Settings</h1>
            <p className="text-sm text-ink-soft">Manage your account and practice preferences.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Profile card */}
          <div className="h-fit overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="h-16 bg-gradient-to-r from-brand to-violet-500" />
            <div className="px-6 pb-6 text-center">
              <div className="group relative -mt-10 inline-block">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-brand to-violet-500 text-2xl font-bold text-white shadow-md">
                  {initials}
                </span>
                <button
                  type="button"
                  disabled
                  title="Photo upload isn't wired up yet"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink text-white opacity-60"
                >
                  <Camera size={13} />
                </button>
              </div>

              <p className="mt-3 font-display text-lg font-bold text-ink">{form.fullName}</p>
              <p className="text-sm text-ink-soft">{form.yearLevel} · {form.institution}</p>

              <div className="mt-4 flex justify-center gap-2">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">{form.role}</span>
              </div>
            </div>
          </div>

          {/* Form card */}
          <form onSubmit={handleSave} className="rounded-2xl border border-line bg-white p-7 shadow-sm">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
              <GraduationCap size={18} className="text-brand" /> Academic profile
            </h2>
            <p className="mt-1 text-sm text-ink-soft">This helps us recommend the right stations and timelines for you.</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field icon={User} label="Full name" name="fullName" value={form.fullName} onChange={handleChange} />
              <Field icon={Mail} label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
              <Field icon={GraduationCap} label="Role" name="role" value={form.role} onChange={handleChange} disabled />
              <Field icon={Building2} label="Institution" name="institution" value={form.institution} onChange={handleChange} />
              <Field icon={BookOpen} label="Programme" name="programme" value={form.programme} onChange={handleChange} />
              <Field icon={GraduationCap} label="Year / Level" name="yearLevel" value={form.yearLevel} onChange={handleChange} />
              <Field icon={Target} label="Target examination" name="targetExam" value={form.targetExam} onChange={handleChange} />
              <Field icon={CalendarClock} label="Expected exam date" name="expectedExamDate" placeholder="e.g. March 2027" value={form.expectedExamDate} onChange={handleChange} />
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-6">
              <button
                type="submit"
                className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:bg-brand-dark"
              >
                Save changes
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 rounded-full bg-good/10 px-3 py-1.5 text-sm font-medium text-good">
                  <Check size={15} /> Saved locally — not yet connected to backend
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-ink-soft ml-auto">
                <Sparkles size={13} /> Used to personalise your dashboard
              </span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, label, name, value, onChange, type = "text", placeholder, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        <Icon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          className="w-full rounded-lg border border-line bg-surface-alt py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
        />
      </div>
    </label>
  );
}
