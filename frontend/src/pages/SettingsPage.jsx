import { useEffect, useState } from "react";
import { BookOpen, Building2, CalendarClock, Camera, Check, GraduationCap, Mail, Sparkles, Target, User } from "lucide-react";
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
    setSaved(true);
  }

  const initials = form.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="app-gradient-bg flex min-h-screen">
      <Sidebar active="settings" onLogout={() => { logout(); window.location.href = "/signin"; }} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="gradient-brand flex h-11 w-11 items-center justify-center rounded-lg text-white">
            <User size={20} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Profile &amp; Settings</h1>
            <p className="text-sm text-ink-soft">Manage your account and practice preferences.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="gradient-card h-fit rounded-lg" style={{ "--g1": "#FF8FCF", "--g2": "#7FB8FF", "--glow": "rgba(127,139,255,0.35)" }}>
            <div className="h-16 bg-gradient-to-r from-[#FF8FCF] to-[#7FB8FF]" />
            <div className="px-6 pb-6 text-center">
              <div className="group relative -mt-10 inline-block">
                <span className="gradient-brand flex h-20 w-20 items-center justify-center rounded-lg border-4 border-white text-2xl font-bold text-white shadow-md">
                  {initials}
                </span>
                <button
                  type="button"
                  disabled
                  title="Photo upload isn't wired up yet"
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-lg border-2 border-white bg-ink text-white opacity-60"
                >
                  <Camera size={13} />
                </button>
              </div>

              <p className="mt-3 font-display text-lg font-extrabold text-ink">{form.fullName}</p>
              <p className="text-sm text-ink-soft">{form.yearLevel} - {form.institution}</p>

              <div className="mt-4 flex justify-center gap-2">
                <span className="gradient-pill rounded-lg px-3 py-1 text-xs font-bold text-ink">{form.role}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="glass-surface rounded-lg p-7">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-ink">
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
                className="gradient-brand rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition"
              >
                Save changes
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-good">
                  <Check size={15} /> Saved locally - not yet connected to backend
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-xs text-ink-soft">
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
          className="w-full rounded-lg border border-line bg-white/80 py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />
      </div>
    </label>
  );
}
