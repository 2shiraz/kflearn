import { useEffect, useMemo, useState } from "react";
import { Search, Zap } from "lucide-react";
import {
  adjustAdminUserCredits,
  deleteAdminUser,
  getAdminUser,
  getCurrentUser,
  listAdminUsers,
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
  "welcome-grant": "Welcome credits",
};

const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function AdminAccounts() {
  const me = getCurrentUser();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  const load = () => listAdminUsers()
    .then((data) => { setUsers(data); setStatus("idle"); })
    .catch((err) => { setError(err.message); setStatus("error"); });

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "suspended" ? !u.suspended : roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return [u.fullName, u.email, u.roleLabel, u.profile?.institution].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [users, query, roleFilter]);

  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === "student").length,
    admin: users.filter((u) => u.role === "admin").length,
    suspended: users.filter((u) => u.suspended).length,
  };

  return (
    <div className="space-y-5">
      <SectionHeading title="Accounts" description={`${counts.all} accounts. Open one to rename it, change its role, add or remove AI credits, suspend it or delete it.`} />
      <InlineError>{error}</InlineError>
      <Panel>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
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
                  </span>
                  <span className="block truncate text-sm text-s-mute">{u.email}</span>
                </span>
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
  const [confirmDelete, setConfirmDelete] = useState("");

  useEffect(() => {
    if (!id) return;
    setData(null);
    setError("");
    setSavedNote("");
    setCredit({ amount: "", note: "" });
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

          <section className="space-y-3">
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
