import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, ImagePlus, KeyRound, X } from "lucide-react";
import { useSite } from "../lib/site";
import {
  changePasswordRequest,
  deleteAccountRequest,
  fetchCurrentUser,
  getCurrentUser,
  listMySessions,
  logout,
  signOutDevice,
  signOutEverywhere,
  ROLE_OPTIONS,
  updateProfileRequest,
  YEAR_LEVEL_OPTIONS,
} from "../lib/api";
import { PageHeader, PageMain, Panel, PrimaryButton, RequireUser, SecondaryButton } from "../components/AppPage";
import { FormError, inputClass } from "../components/AuthShell";
import { AVATAR_IDS, UserAvatar } from "../site/Illustrations";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "danger", label: "Delete account" },
];

function formFromUser(user) {
  return {
    fullName: user.fullName || "",
    roleLabel: user.roleLabel || "",
    institution: user.institution || user.profile?.institution || "",
    programme: user.programme || user.profile?.programme || "",
    yearLevel: user.yearLevel || user.profile?.yearLevel || "",
  };
}

export default function SettingsPage() {
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    fetchCurrentUser().then((data) => data?.user && setUser(data.user)).catch(() => {});
  }, []);

  return (
    <RequireUser active="settings">
      <PageMain width="split">
        <PageHeader title="Settings" description="Your profile, password and account." />
        {user && (
          <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <ProfileSummary user={user} onSaved={setUser} />
            <div className="grid min-w-0 gap-6">
              {user.mustChangePassword && (
                <div role="alert" className="site-rise flex items-start gap-3 rounded-3xl bg-sun-soft p-5 text-s-ink">
                  <KeyRound size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-sun" aria-hidden="true" />
                  <p className="leading-relaxed">
                    <span className="font-semibold">You're signed in with a temporary password.</span> Choose your own password under Security below.
                  </p>
                </div>
              )}
              <SubscriptionCard user={user} />
              <ProfileSection key={user.id} user={user} onSaved={setUser} />
              <SecuritySection email={user.email} />
              <DevicesSection />
              <DangerSection isAdmin={user.role === "admin"} />
            </div>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

function ProfileSummary({ user, onSaved }) {
  const [picking, setPicking] = useState(false);
  const subtitle = [user.yearLevel || user.profile?.yearLevel, user.institution || user.profile?.institution].filter(Boolean).join(", ");
  return (
    <aside className="site-rise lg:sticky lg:top-8 lg:self-start">
      <Panel className="flex items-center gap-4 lg:flex-col lg:text-center">
        <div className="relative shrink-0">
          <UserAvatar id={user.avatar} size={72} className="ring-4 ring-s-card" />
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label="Change profile picture"
            title="Change profile picture"
            className="site-press absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-s-card bg-s-ink text-s-on-accent hover:bg-s-accent"
          >
            <ImagePlus size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {/* Beside the avatar (mobile) the text truncates to one line; stacked
            under it in the narrow desktop column it wraps instead. */}
        <div className="min-w-0 flex-1 lg:w-full lg:flex-none">
          <p className="truncate text-lg font-semibold tracking-tight text-s-ink lg:whitespace-normal lg:break-words">{user.fullName}</p>
          <p className="truncate text-sm text-s-mute lg:mt-0.5 lg:whitespace-normal lg:break-words">{subtitle || user.email}</p>
        </div>
      </Panel>
      <nav aria-label="Settings sections" className="mt-4 hidden lg:block">
        <ul className="space-y-1">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-s-mute hover:bg-s-tint/70 hover:text-s-ink">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {picking && <AvatarDialog current={user.avatar} onClose={() => setPicking(false)} onSaved={onSaved} />}
    </aside>
  );
}

// Native modal dialog: focus is trapped inside, Escape closes it, and the
// page behind is inert. Clicking the backdrop also closes it.
function AvatarDialog({ current, onClose, onSaved }) {
  const ref = useRef(null);
  const [selected, setSelected] = useState(current || AVATAR_IDS[0]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (selected === current) return onClose();
    setStatus("saving");
    setError("");
    try {
      const data = await updateProfileRequest({ avatar: selected });
      if (data?.user) onSaved(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="avatar-dialog-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl border border-s-line bg-s-card p-0 text-s-ink shadow-2xl backdrop:bg-s-ink/40 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSave} className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="avatar-dialog-title" className="text-lg font-semibold tracking-tight text-s-ink">Choose a profile picture</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="site-press -m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-s-tint hover:text-s-ink">
            <X size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <fieldset>
          <legend className="sr-only">Avatars</legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {AVATAR_IDS.map((id, i) => {
              const isSelected = selected === id;
              return (
                <label
                  key={id}
                  className={`site-press relative flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-s-accent/40 ${
                    isSelected ? "border-s-accent bg-s-accent-soft" : "border-transparent bg-s-tint/60 hover:border-s-line"
                  }`}
                >
                  <input type="radio" name="avatar" value={id} checked={isSelected} onChange={() => setSelected(id)} className="sr-only" aria-label={`Avatar ${i + 1}`} />
                  <UserAvatar id={id} size={56} className="bg-transparent" />
                  {isSelected && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-s-accent text-s-on-accent" aria-hidden="true">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        {status === "error" && <div className="mt-5"><FormError>{error}</FormError></div>}

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-s-line pt-5">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save"}
          </PrimaryButton>
        </div>
      </form>
    </dialog>
  );
}

function SectionTitle({ id, title, description, danger = false }) {
  return (
    <div className="mb-6">
      <h2 id={id} className={`scroll-mt-24 text-lg font-semibold tracking-tight ${danger ? "text-s-miss" : "text-s-ink"}`}>{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-s-mute">{description}</p>}
    </div>
  );
}

function Saved({ children = "Saved" }) {
  return (
    <span role="status" className="flex items-center gap-1.5 rounded-full bg-mint-soft px-3 py-1.5 text-sm font-medium text-s-good">
      <Check size={15} strokeWidth={2.5} aria-hidden="true" /> {children}
    </span>
  );
}

// ---- Profile: name, role and studies ----
function ProfileSection({ user, onSaved }) {
  const [form, setForm] = useState(() => formFromUser(user));
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function set(field, value) {
    setStatus("idle");
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const data = await updateProfileRequest({
        fullName: form.fullName,
        roleLabel: form.roleLabel,
        profile: { institution: form.institution, programme: form.programme, yearLevel: form.yearLevel },
      });
      if (data?.user) onSaved(data.user);
      setStatus("saved");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  // Keep a saved value that isn't in the list (typed in before the list existed).
  const roleOptions = form.roleLabel && !ROLE_OPTIONS.includes(form.roleLabel) ? [form.roleLabel, ...ROLE_OPTIONS] : ROLE_OPTIONS;
  const yearOptions = form.yearLevel && !YEAR_LEVEL_OPTIONS.includes(form.yearLevel) ? [form.yearLevel, ...YEAR_LEVEL_OPTIONS] : YEAR_LEVEL_OPTIONS;

  return (
    <Panel className="site-rise" style={{ "--rise-delay": "60ms" }}>
      <form onSubmit={handleSave}>
        <SectionTitle id="profile" title="Profile" />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Full name" name="fullName" autoComplete="name" required value={form.fullName} onChange={(v) => set("fullName", v)} />
          <TextField label="Email" name="email" type="email" value={user.email} disabled hint="Your email can't be changed." />
          <SelectField label="Role" name="roleLabel" value={form.roleLabel} options={roleOptions} onChange={(v) => set("roleLabel", v)} />
          <SelectField label="Year or level" name="yearLevel" value={form.yearLevel} options={yearOptions} onChange={(v) => set("yearLevel", v)} />
          <TextField label="Institution" name="institution" autoComplete="organization" value={form.institution} onChange={(v) => set("institution", v)} />
          <TextField label="Programme" name="programme" placeholder="MBBS" value={form.programme} onChange={(v) => set("programme", v)} />
        </div>

        {status === "error" && <div className="mt-6"><FormError>{error}</FormError></div>}

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-s-line pt-6">
          <PrimaryButton type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save changes"}
          </PrimaryButton>
          {status === "saved" && <Saved />}
        </div>
      </form>
    </Panel>
  );
}

// ---- Security: password change ----
const PASSWORD_CHECKS = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "A letter", test: (p) => /[A-Za-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];

function SecuritySection({ email }) {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const rulesMet = PASSWORD_CHECKS.every((c) => c.test(form.newPassword));
  const matches = form.newPassword && form.newPassword === form.confirmPassword;
  const canSubmit = form.currentPassword && rulesMet && matches && status !== "saving";

  function set(field, value) {
    setStatus("idle");
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setError("");
    try {
      await changePasswordRequest({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      setStatus("saved");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  const type = show ? "text" : "password";

  return (
    <Panel className="site-rise" style={{ "--rise-delay": "120ms" }}>
      <form onSubmit={handleSubmit}>
        <SectionTitle id="security" title="Security" description="Changing your password signs you out on every other device." />

        {/* Lets password managers attach the new password to the right account. */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />

        <div className="grid gap-5 sm:max-w-md">
          <TextField label="Current password" name="currentPassword" type={type} autoComplete="current-password" required value={form.currentPassword} onChange={(v) => set("currentPassword", v)} />
          <TextField label="New password" name="newPassword" type={type} autoComplete="new-password" required value={form.newPassword} onChange={(v) => set("newPassword", v)} />
          <TextField
            label="Confirm new password"
            name="confirmPassword"
            type={type}
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={(v) => set("confirmPassword", v)}
            error={form.confirmPassword && !matches ? "Passwords don't match." : ""}
          />
        </div>

        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Password requirements">
          {PASSWORD_CHECKS.map((c) => {
            const ok = c.test(form.newPassword);
            return (
              <li key={c.label} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${ok ? "bg-mint-soft text-s-good" : "bg-s-tint text-s-mute"}`}>
                {ok ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : <X size={13} strokeWidth={2.5} aria-hidden="true" />}
                {c.label}
                <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
              </li>
            );
          })}
        </ul>

        <button type="button" onClick={() => setShow((s) => !s)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-medium text-s-mute hover:text-s-ink">
          {show ? <EyeOff size={16} strokeWidth={2} aria-hidden="true" /> : <Eye size={16} strokeWidth={2} aria-hidden="true" />}
          {show ? "Hide passwords" : "Show passwords"}
        </button>

        {status === "error" && <div className="mt-5"><FormError>{error}</FormError></div>}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-s-line pt-6">
          <PrimaryButton type="submit" disabled={!canSubmit}>
            {status === "saving" ? "Updating..." : "Update password"}
          </PrimaryButton>
          {status === "saved" && <Saved>Password updated</Saved>}
        </div>
      </form>
    </Panel>
  );
}

// ---- Danger zone: account deletion ----
function DangerSection({ isAdmin }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const canDelete = password && confirmText === "DELETE" && status !== "deleting";

  function cancel() {
    setOpen(false);
    setPassword("");
    setConfirmText("");
    setError("");
    setStatus("idle");
  }

  async function handleDelete(e) {
    e.preventDefault();
    if (!canDelete) return;
    setStatus("deleting");
    setError("");
    try {
      await deleteAccountRequest({ password });
      window.location.replace("/");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  return (
    <section aria-labelledby="danger" className="site-rise rounded-3xl border border-coral/35 bg-s-card p-5 sm:p-6" style={{ "--rise-delay": "180ms" }}>
      <SectionTitle
        id="danger"
        danger
        title="Delete account"
        description="Permanently deletes your account, practice history and AI credits. This can't be undone."
      />

      {isAdmin ? (
        <p className="rounded-2xl bg-s-tint/60 p-4 text-sm text-s-mute">Admin accounts can't be deleted from here.</p>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="site-press inline-flex min-h-11 items-center justify-center rounded-full border border-coral/40 bg-s-card px-5 py-2.5 text-sm font-semibold text-s-miss hover:bg-coral-soft"
        >
          Delete my account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="rounded-2xl bg-coral-soft/50 p-4 sm:p-5">
          <div className="grid gap-5 sm:max-w-md">
            <TextField label="Your password" name="deletePassword" type="password" autoComplete="current-password" required value={password} onChange={setPassword} />
            <TextField
              label="Type DELETE to confirm"
              name="deleteConfirm"
              autoComplete="off"
              required
              value={confirmText}
              onChange={setConfirmText}
            />
          </div>

          {status === "error" && <div className="mt-5"><FormError>{error}</FormError></div>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canDelete}
              className="site-press inline-flex min-h-11 items-center justify-center rounded-full bg-s-miss px-5 py-2.5 text-sm font-semibold text-s-on-accent hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "deleting" ? "Deleting..." : "Delete permanently"}
            </button>
            <SecondaryButton onClick={cancel}>Cancel</SecondaryButton>
          </div>
        </form>
      )}
    </section>
  );
}

// ---- Fields ----
function TextField({ label, name, value, onChange, type = "text", placeholder, autoComplete, required = false, disabled = false, hint, error }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-s-ink">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className={`${inputClass} disabled:cursor-not-allowed disabled:bg-s-tint/60 disabled:text-s-mute`}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-s-miss">{error}</p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-s-mute">{hint}</p>
      ) : null}
    </div>
  );
}

function SelectField({ label, name, value, options, onChange }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-s-ink">{label}</label>
      <select id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Select</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

// Where the account's monthly access stands, with a link to the plan.
function SubscriptionCard({ user }) {
  const { access, requireSubscription } = useSite();
  if (["admin", "contributor"].includes(user.role) || access?.unlimited) return null;
  if (!access?.required && !requireSubscription) return null;
  let line = "No monthly access yet.";
  if (access?.active) line = `Active until ${shortDate(access.until)}.`;
  else if (access?.inGrace) line = `Ended on ${shortDate(access.until)}. You can keep using the site until ${shortDate(access.graceUntil)}.`;
  else if (access?.until) line = `Ended on ${shortDate(access.until)}.`;
  return (
    <Panel className="site-rise">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-s-ink">Monthly access</h2>
          <p className="mt-1 text-sm leading-relaxed text-s-mute">{line}</p>
        </div>
        <Link to="/subscribe" className="site-press inline-flex min-h-11 items-center gap-1.5 rounded-full border border-s-line bg-s-card px-4 text-sm font-semibold text-s-ink hover:bg-s-tint">
          {access?.active ? "View plan" : "Get access"} <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </Panel>
  );
}

const seen = (value) => {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 10) return "Active now";
  if (minutes < 60) return `Active ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Active ${hours} h ago`;
  return `Active ${new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
};

// Where this account is signed in. Students can be signed in on two devices;
// signing in on a third signs out the oldest.
function DevicesSection() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    listMySessions().then((d) => setSessions(d.sessions)).catch((err) => setError(err.message));
  }, []);

  async function signOut(id, current) {
    setBusy(id);
    setError("");
    try {
      const d = await signOutDevice(id);
      if (current) {
        logout();
        window.location.href = "/signin";
        return;
      }
      setSessions(d.sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function everywhere() {
    if (!window.confirm("Sign out on every device, including this one?")) return;
    setBusy("all");
    try {
      await signOutEverywhere();
    } catch {
      // Signed out either way.
    }
    logout();
    window.location.href = "/signin";
  }

  return (
    <Panel className="site-rise">
      <h2 className="text-lg font-semibold text-s-ink">Signed-in devices</h2>
      <p className="mt-1 text-sm leading-relaxed text-s-mute">Your account can be signed in on up to two devices. Signing in on another one signs out the device you signed in on longest ago.</p>
      {error && <div className="mt-3"><FormError>{error}</FormError></div>}
      {!sessions && !error && <p className="mt-4 text-sm text-s-mute">Loading devices...</p>}
      {sessions && (
        <ul className="mt-4 divide-y divide-s-line rounded-2xl border border-s-line">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-s-ink">
                  {s.device}
                  {s.current && <span className="ml-2 rounded-full bg-mint-soft px-2 py-0.5 text-xs font-medium text-s-good">This device</span>}
                </span>
                <span className="block text-xs text-s-mute">{seen(s.lastSeenAt)}{s.ip ? `, from ${s.ip}` : ""}</span>
              </span>
              <SecondaryButton onClick={() => signOut(s.id, s.current)} disabled={busy === s.id} className="min-h-10 px-4 text-sm">
                {busy === s.id ? "Signing out..." : "Sign out"}
              </SecondaryButton>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={everywhere} disabled={busy === "all"} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-s-miss hover:underline disabled:opacity-50">
        Sign out everywhere
      </button>
    </Panel>
  );
}
