import { useEffect, useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import {
  adjustAdminUserCredits,
  deleteAdminUser,
  getAdminUser,
  getCurrentUser,
  grantAdminUserAccess,
  listAdminUsers,
  revokeAdminUserAccess,
  revokeAdminUserSession,
  revokeAllAdminUserSessions,
  setAdminUserPassword,
  updateAdminUser,
} from "../../lib/api";
import { UserAvatar } from "../../site/Illustrations";
import { Panel, PrimaryButton } from "../AppPage";
import { AdminDialog, Field, InlineError, SavedNote, SectionHeading, Select, Toggle } from "./AdminKit";

const ROLE_LABELS = { student: "Student", contributor: "Contributor", admin: "Admin" };
const REASON_LABELS = {
  "virtual-patient": "AI patient session",
  "ai-assessment": "AI marking",
  "admin-grant": "Added by admin",
  "admin-adjust": "Admin adjustment",
  purchase: "Purchase",
  "purchase-refund": "Purchase refunded",
  "welcome-grant": "Welcome credits",
};

const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const DAY = 24 * 60 * 60 * 1000;
const SOURCE_LABELS = { "admin-grant": "Granted by admin", payment: "Payment", processor: "Online payment" };

// "active" | "ending" (within 7 days) | "lapsed" | "none" | "unlimited"
function accessState(u, now = Date.now()) {
  if (u.unlimitedAccess) return "unlimited";
  if (!u.accessUntil) return "none";
  const until = new Date(u.accessUntil).getTime();
  if (until <= now) return "lapsed";
  return until - now <= 7 * DAY ? "ending" : "active";
}

const ACCESS_CHIP = {
  active: "bg-mint-soft text-s-good",
  ending: "bg-sun-soft text-s-ink",
  lapsed: "bg-coral-soft text-s-miss",
  none: "bg-s-tint text-s-mute",
};

function AccessChip({ user }) {
  const state = accessState(user);
  if (state === "unlimited") return null;
  const label = state === "none" ? "No access" : state === "lapsed" ? `Ended ${shortDate(user.accessUntil)}` : `Until ${shortDate(user.accessUntil)}`;
  return <span className={`shrink-0 rounded-full px-2.5 py-1 font-chart text-xs ${ACCESS_CHIP[state]}`}>{label}</span>;
}

export default function AdminAccounts() {
  const me = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  const load = () => listAdminUsers()
    .then((data) => { setUsers(data); setStatus("idle"); })
    .catch((err) => { setError(err.message); setStatus("error"); });

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "suspended" ? !u.suspended : roleFilter !== "all" && u.role !== roleFilter) return false;
      if (accessFilter !== "all") {
        const state = accessState(u);
        if (accessFilter === "active" ? !["active", "ending"].includes(state) : state !== accessFilter) return false;
      }
      if (!q) return true;
      return [u.fullName, u.email, u.roleLabel, u.profile?.institution].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [users, query, roleFilter, accessFilter]);

  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === "student").length,
    admin: users.filter((u) => u.role === "admin").length,
    suspended: users.filter((u) => u.suspended).length,
  };

  return (
    <div className="space-y-5">
      <SectionHeading title="Accounts" description={`${counts.all} accounts. Open one to grant monthly access, rename it, change its role, add or remove AI credits, set a temporary password, suspend it or delete it.`} />
      <InlineError>{error}</InlineError>
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_13rem_13rem]">
          <label className="relative block">
            <span className="sr-only">Search accounts</span>
            <Search size={17} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or college" className="min-h-11 w-full rounded-xl border border-s-line bg-s-card py-2.5 pl-10 pr-3 text-sm text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent" />
          </label>
          <label>
            <span className="sr-only">Filter accounts</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent">
              <option value="all">Everyone ({counts.all})</option>
              <option value="student">Students ({counts.student})</option>
              <option value="contributor">Contributors</option>
              <option value="admin">Admins ({counts.admin})</option>
              <option value="suspended">Suspended ({counts.suspended})</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by monthly access</span>
            <select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)} className="min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent">
              <option value="all">Any access</option>
              <option value="active">Active pass</option>
              <option value="ending">Ending within 7 days</option>
              <option value="lapsed">Ended</option>
              <option value="none">Never had access</option>
            </select>
          </label>
        </div>

        {status === "loading" && <p className="mt-5 text-sm text-s-mute">Loading accounts...</p>}
        <ul className="mt-4 divide-y divide-s-line">
          {visible.map((u) => (
            <li key={u.id}>
              <button type="button" onClick={() => setOpenId(u.id)} className="site-press -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-3 text-left hover:bg-s-tint/60">
                {u.avatar ? <UserAvatar id={u.avatar} size={40} /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-s-accent-soft text-sm font-semibold text-s-accent">{u.fullName?.[0] || "?"}</span>}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-s-ink">{u.fullName}</span>
                    {u.id === me?.id && <span className="font-chart text-xs text-s-mute">you</span>}
                    {u.role !== "student" && <span className="rounded-full bg-s-accent-soft px-2 py-0.5 text-xs font-medium text-s-accent-strong">{ROLE_LABELS[u.role]}</span>}
                    {u.suspended && <span className="rounded-full bg-coral-soft px-2 py-0.5 text-xs font-medium text-s-miss">Suspended</span>}
                    {u.sharingFlag && <span title={`${u.sharingFlag.signIns} sign-ins from ${u.sharingFlag.places} places in 24 hours`} className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-medium text-s-ink">Many sign-ins</span>}
                  </span>
                  <span className="block truncate text-sm text-s-mute">{u.email}</span>
                </span>
                <AccessChip user={u} />
                <span className="hidden items-center gap-1 font-chart text-sm text-s-ink sm:flex"><Zap size={14} strokeWidth={1.75} fill="currentColor" className="text-sun" aria-hidden="true" />{u.creditBalance.toLocaleString()}</span>
                <span className="hidden font-chart text-xs text-s-mute md:block">{shortDate(u.createdAt)}</span>
              </button>
            </li>
          ))}
          {status !== "loading" && visible.length === 0 && <li className="py-6 text-center text-sm text-s-mute">No accounts match.</li>}
        </ul>
      </Panel>

      <AccountDialog id={openId} isSelf={openId === me?.id} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}

function AccountDialog({ id, isSelf, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ fullName: "", role: "student", password: "" });
  const [savedNote, setSavedNote] = useState("");
  const [busy, setBusy] = useState("");
  const [credit, setCredit] = useState({ amount: "", note: "" });
  const [grant, setGrant] = useState({ days: "30", reason: "" });
  const [tempPassword, setTempPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    if (!id) return;
    setData(null);
    setError("");
    setSavedNote("");
    setCredit({ amount: "", note: "" });
    setGrant({ days: "30", reason: "" });
    setTempPassword("");
    setConfirmDelete("");
    getAdminUser(id)
      .then((d) => { setData(d); setProfile({ fullName: d.user.fullName, role: d.user.role, password: "" }); })
      .catch((err) => setError(err.message));
  }, [id]);

  const refresh = async () => {
    const d = await getAdminUser(id);
    setData(d);
    onChanged();
  };

  async function run(key, fn, note) {
    setBusy(key);
    setError("");
    setSavedNote("");
    try {
      await fn();
      await refresh();
      setSavedNote(note);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy("");
    }
  }

  const user = data?.user;
  const amount = Number(credit.amount);

  return (
    <AdminDialog wide open={Boolean(id)} title={user ? user.fullName : "Account"} description={user?.email} onClose={() => !busy && onClose()}>
      {!data && !error && <p className="text-sm text-s-mute">Loading...</p>}
      <InlineError>{error}</InlineError>
      {user && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="AI credits" value={user.creditBalance.toLocaleString()} />
            <Stat label="Stations marked" value={data.markedStations} />
            <Stat label="Joined" value={shortDate(user.createdAt)} />
          </div>
          {savedNote && <SavedNote>{savedNote}</SavedNote>}

          <AccessSection
            data={data}
            grant={grant}
            setGrant={setGrant}
            busy={busy}
            onGrant={(days, reason) => run("grant", () => grantAdminUserAccess(id, { days, reason }), `Added ${days} days of access`).then((ok) => ok && setGrant({ days: "30", reason: "" }))}
            onRevoke={(periodId) => window.confirm("Revoke this period of access?") && run(`revoke-${periodId}`, () => revokeAdminUserAccess(id, periodId), "Access period revoked")}
          />

          <section className="space-y-3 border-t border-s-line pt-5">
            <h3 className="font-semibold text-s-ink">Profile</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name" maxLength={120} value={profile.fullName} onChange={(v) => setProfile((p) => ({ ...p, fullName: v }))} />
              <Select label="Role" value={profile.role} onChange={(v) => setProfile((p) => ({ ...p, role: v }))}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value} disabled={isSelf && value !== "admin"}>{label}</option>)}
              </Select>
            </div>
            {(profile.role === "admin") !== (user.role === "admin") && (
              <div className="space-y-2 rounded-2xl bg-sun-soft/60 p-4">
                <p className="text-sm text-s-ink">{profile.role === "admin" ? "Admins can change every setting, including other accounts." : "This removes their admin access."} Enter your own password to confirm.</p>
                <Field label="Your password" type="password" autoComplete="current-password" value={profile.password} onChange={(v) => setProfile((p) => ({ ...p, password: v }))} />
              </div>
            )}
            <PrimaryButton
              type="button"
              disabled={busy === "profile" || (profile.fullName.trim() === user.fullName && profile.role === user.role) || ((profile.role === "admin") !== (user.role === "admin") && !profile.password)}
              onClick={() => run("profile", () => updateAdminUser(id, { fullName: profile.fullName, role: profile.role, ...(profile.password ? { password: profile.password } : {}) }), "Profile saved").then((ok) => ok && setProfile((p) => ({ ...p, password: "" })))}
            >
              {busy === "profile" ? "Saving..." : "Save profile"}
            </PrimaryButton>
          </section>

          <section className="space-y-3 border-t border-s-line pt-5">
            <h3 className="font-semibold text-s-ink">AI credits</h3>
            <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <Field label="Amount" helper="Use a minus to remove." type="number" inputMode="numeric" value={credit.amount} onChange={(v) => setCredit((c) => ({ ...c, amount: v }))} placeholder="50" />
              <Field label="Note" helper="Shown in their credit history." maxLength={200} value={credit.note} onChange={(v) => setCredit((c) => ({ ...c, note: v }))} placeholder="Paid by bank transfer" />
            </div>
            <PrimaryButton
              type="button"
              disabled={busy === "credits" || !Number.isInteger(amount) || amount === 0}
              onClick={() => run("credits", () => adjustAdminUserCredits(id, { amount, note: credit.note }), amount > 0 ? `Added ${amount} AI credits` : `Removed ${-amount} AI credits`).then((ok) => ok && setCredit({ amount: "", note: "" }))}
            >
              {busy === "credits" ? "Updating..." : amount < 0 ? "Remove credits" : "Add credits"}
            </PrimaryButton>
            {data.transactions.length > 0 && (
              <ul className="divide-y divide-s-line rounded-2xl border border-s-line">
                {data.transactions.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-s-ink">{REASON_LABELS[t.reason] || t.reason}</span>
                      {t.note && <span className="block truncate text-xs text-s-mute">{t.note}</span>}
                    </span>
                    <span className={`font-chart ${t.amount > 0 ? "text-s-good" : "text-s-mute"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
                    <span className="hidden font-chart text-xs text-s-mute sm:block">{shortDate(t.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 border-t border-s-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-s-ink">Signed-in devices</h3>
              {!isSelf && data.sessions?.length > 0 && (
                <button type="button" disabled={busy === "devices"} onClick={() => window.confirm("Sign this account out on every device?") && run("devices", () => revokeAllAdminUserSessions(id), "Signed out everywhere")} className="inline-flex min-h-9 items-center text-sm font-semibold text-s-miss hover:underline disabled:opacity-50">
                  Sign out everywhere
                </button>
              )}
            </div>
            {user.sharingFlag && (
              <p className="rounded-2xl bg-sun-soft p-3 text-sm text-s-ink">
                {user.sharingFlag.signIns} sign-ins from {user.sharingFlag.places} different places in the last 24 hours. This can mean the account is being shared.
              </p>
            )}
            {!data.sessions?.length ? <p className="text-sm text-s-mute">Not signed in anywhere.</p> : (
              <ul className="divide-y divide-s-line rounded-2xl border border-s-line">
                {data.sessions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block text-s-ink">{s.device}</span>
                      <span className="block truncate font-chart text-xs text-s-mute">{s.ip || "Unknown IP"}, last active {shortDate(s.lastSeenAt)}</span>
                    </span>
                    {!isSelf && (
                      <button type="button" disabled={busy === `device-${s.id}`} onClick={() => run(`device-${s.id}`, () => revokeAdminUserSession(id, s.id), "Device signed out")} className="site-press inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-s-mute hover:bg-coral-soft/60 hover:text-s-miss disabled:opacity-40">
                        Sign out
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!isSelf && user.role !== "admin" && (
            <section className="space-y-3 border-t border-s-line pt-5">
              <h3 className="font-semibold text-s-ink">Temporary password</h3>
              <p className="text-sm text-s-mute">For a student who can't sign in. It signs them out everywhere, and they're asked to choose their own password after signing in.</p>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <Field label="New temporary password" helper="At least 8 characters, with a letter and a number." type="text" autoComplete="off" value={tempPassword} onChange={setTempPassword} />
                <PrimaryButton
                  type="button"
                  disabled={busy === "password" || !/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(tempPassword)}
                  onClick={() => run("password", () => setAdminUserPassword(id, tempPassword), "Temporary password set. Share it with them privately.").then((ok) => ok && setTempPassword(""))}
                >
                  {busy === "password" ? "Setting..." : "Set password"}
                </PrimaryButton>
              </div>
              {user.mustChangePassword && <p className="text-xs text-s-mute">They haven't changed their temporary password yet.</p>}
            </section>
          )}

          <section className="border-t border-s-line pt-3">
            <Toggle
              label="Suspend account"
              description={isSelf ? "You can't suspend your own account." : "Signs them out everywhere and blocks sign-in until you turn this off."}
              checked={user.suspended}
              disabled={isSelf || busy === "suspend"}
              onChange={(v) => run("suspend", () => updateAdminUser(id, { suspended: v }), v ? "Account suspended" : "Account restored")}
            />
          </section>

          {!isSelf && (
            <section className="space-y-3 rounded-2xl border border-coral/30 bg-coral-soft/30 p-4">
              <h3 className="font-semibold text-s-miss">Delete account</h3>
              <p className="text-sm text-s-mute">Removes the account, its station attempts and credit history for good. Type <strong className="text-s-ink">{user.email}</strong> to confirm.</p>
              <Field label="Email" value={confirmDelete} onChange={setConfirmDelete} autoComplete="off" />
              <button
                type="button"
                disabled={confirmDelete !== user.email || busy === "delete"}
                onClick={async () => {
                  setBusy("delete");
                  setError("");
                  try {
                    await deleteAdminUser(id, confirmDelete);
                    onChanged();
                    onClose();
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setBusy("");
                  }
                }}
                className="site-press inline-flex min-h-11 items-center justify-center rounded-full bg-s-miss px-5 text-sm font-semibold text-s-on-accent hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {busy === "delete" ? "Deleting..." : "Delete account"}
              </button>
            </section>
          )}
        </div>
      )}
    </AdminDialog>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-s-tint/60 p-4">
      <p className="font-chart text-xs text-s-mute">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-s-ink">{value}</p>
    </div>
  );
}

// Monthly access: where this account stands, grant or extend it, and the
// history of periods with a way to revoke any active one.
function AccessSection({ data, grant, setGrant, busy, onGrant, onRevoke }) {
  const { access, periods = [] } = data;
  const days = Number(grant.days);
  const validDays = Number.isInteger(days) && days >= 1 && days <= 366;
  if (access?.unlimited) {
    return (
      <section className="space-y-2">
        <h3 className="font-semibold text-s-ink">Monthly access</h3>
        <p className="text-sm text-s-mute">Admins and contributors always have full access.</p>
      </section>
    );
  }
  let status = "No monthly access.";
  if (access?.active) status = `Active until ${shortDate(access.until)}.`;
  else if (access?.inGrace) status = `Ended ${shortDate(access.until)}, in grace until ${shortDate(access.graceUntil)}.`;
  else if (access?.until) status = `Ended ${shortDate(access.until)}.`;
  const now = Date.now();
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold text-s-ink">Monthly access</h3>
        <p className="mt-0.5 text-sm text-s-mute">{status}{!access?.required && " The paywall is switched off, so they can use everything for now."}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-end">
        <Field label="Days" type="number" min="1" max="366" inputMode="numeric" value={grant.days} onChange={(v) => setGrant((g) => ({ ...g, days: v }))} />
        <Field label="Reason" helper="Kept with the record." maxLength={200} value={grant.reason} onChange={(v) => setGrant((g) => ({ ...g, reason: v }))} placeholder="Testing" />
        <PrimaryButton type="button" disabled={busy === "grant" || !validDays || !grant.reason.trim()} onClick={() => onGrant(days, grant.reason.trim())}>
          {busy === "grant" ? "Saving..." : access?.active ? "Extend" : "Grant access"}
        </PrimaryButton>
      </div>
      <p className="text-xs text-s-mute">{access?.active ? `Adds the days after ${shortDate(access.until)}.` : "Starts today."}</p>
      {periods.length > 0 && (
        <ul className="divide-y divide-s-line rounded-2xl border border-s-line">
          {periods.slice(0, 8).map((p) => {
            const revoked = Boolean(p.revokedAt);
            const ended = new Date(p.to).getTime() <= now;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1">
                  <span className={`block ${revoked ? "text-s-mute line-through" : "text-s-ink"}`}>{shortDate(p.from)} to {shortDate(p.to)}</span>
                  <span className="block truncate text-xs text-s-mute">{SOURCE_LABELS[p.source] || p.source}{p.reason ? `: ${p.reason}` : ""}{revoked ? `. Revoked ${shortDate(p.revokedAt)}` : ""}</span>
                </span>
                <span className="font-chart text-xs text-s-mute">{p.days} days</span>
                {!revoked && !ended && (
                  <button type="button" disabled={busy === `revoke-${p.id}`} onClick={() => onRevoke(p.id)} className="site-press inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-s-mute hover:bg-coral-soft/60 hover:text-s-miss disabled:opacity-40">
                    Revoke
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
