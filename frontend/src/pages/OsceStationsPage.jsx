import { useCallback, useEffect, useRef, useState } from "react";
import OsceStationBrowser, { StationAvailability } from "../components/OsceStationBrowser";
import LeaveStationDialog from "../components/LeaveStationDialog";
import AdminAccounts from "../components/admin/AdminAccounts";
import AdminAnnouncements from "../components/admin/AdminAnnouncements";
import AdminPricing from "../components/admin/AdminPricing";
import AdminAccess from "../components/admin/AdminAccess";
import StationEditDialog from "../components/admin/StationEditDialog";
import NewStationDialog from "../components/admin/NewStationDialog";
import AdminOverview from "../components/admin/AdminOverview";
import AdminBranding from "../components/admin/AdminBranding";
import AdminActivity from "../components/admin/AdminActivity";
import ImportStationsDialog from "../components/admin/ImportStationsDialog";
import AdminShell from "../components/admin/AdminShell";
import DeleteStationDialog from "../components/admin/DeleteStationDialog";
import { useLeaveStationGuard } from "../hooks/useLeaveStationGuard";
import { OSCE_CATEGORIES, displayTitle } from "../lib/osceFilters.js";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TONES, specialtyLook } from "../site/tones";
import {
  ArrowRight,
  Trash2,
  Check,
  Clock3,
  Coins,
  Eye,
  History,
  Mic,
  Send,
  Search,
  Settings2,
  Users,
  Layers3,
  Plus,
  AlertTriangle,
  Sparkles,
  Square,
  Stethoscope,
  Timer,
  ToggleRight,
  Megaphone,
  Pencil,
  Palette,
  ScrollText,
  FileJson,
  X,
} from "lucide-react";
import { Breadcrumbs, EmptyState, ErrorMessage, LinkButton, PageHeader, PageMain, Panel, PrimaryButton, RequireUser, SecondaryButton } from "../components/AppPage";
import { CardGridSkeleton, ChatSkeleton, ChecklistSkeleton, DetailSkeleton, FormSkeleton, ListSkeleton, OsceBrowserSkeleton, ResultsSkeleton, TwoColumnSkeleton } from "../components/Skeleton";
import { ScoreRing, scoreTone } from "../components/StudyKit";
import { Character, HealthIcon, MedIcon, VoiceBars } from "../site/Illustrations";
import {
  aiAssessOsceAttempt,
  createOsceAttempt,
  endOsceAttempt,
  getAiStatus,
  getOsceAttempt,
  getOsceStation,
  getSinglePlayerContent,
  listAdminOsceStations,
  listAdminUsers,
  listOsceAttempts,
  listOsceStations,
  updateAdminOsceStationStatus,
  selfAssessOsceAttempt,
  sendPatientMessage,
  transcribeOsceAudio,
  updateAiStatus,
  getCurrentUser,
} from "../lib/api";
import { isCreditError, refreshCredits, setCreditBalance, useCredits } from "../lib/credits";

// Shows a spend error; credit errors get a direct link to the packages page.
function SpendError({ error }) {
  if (!error) return null;
  if (!isCreditError(error)) return <div className="mt-3"><ErrorMessage message={error.message} /></div>;
  return (
    <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-sun/25 bg-sun-soft p-4 text-sm text-s-ink">
      <Coins size={18} strokeWidth={2} className="shrink-0 text-sun" aria-hidden="true" />
      <span className="min-w-0 flex-1">{error.message}</span>
      <Link to="/credits" className="site-press inline-flex min-h-11 items-center rounded-full bg-s-card px-4 font-semibold text-s-ink ring-1 ring-sun/30 hover:bg-sun-soft">Get AI credits</Link>
    </div>
  );
}

function sectionPath(name) {
  return `/stations/section/${encodeURIComponent(name)}`;
}

function groupModulesBySpecialty(modules) {
  return modules.reduce((groups, module) => {
    const specialtyName = module.specialty?.name || "General";
    const existing = groups.find((group) => group.name === specialtyName);
    if (existing) existing.modules.push(module);
    else groups.push({ name: specialtyName, modules: [module] });
    return groups;
  }, []);
}

// Patient portrait for a station, picked from its title so it stays stable.
function patientFor(title = "") {
  const sum = [...title].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return sum % 2 ? "patient-maya" : "patient-daniel";
}

function formatTime(seconds = 0) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function useCountdown({ limitSeconds = 360, startedAt, enabled = true }) {
  const startRef = useRef(startedAt ? new Date(startedAt).getTime() : Date.now());
  const [remaining, setRemaining] = useState(limitSeconds);

  useEffect(() => {
    startRef.current = startedAt ? new Date(startedAt).getTime() : Date.now();
  }, [startedAt]);

  useEffect(() => {
    if (!enabled) return undefined;
    function tick() {
      const elapsed = Math.max(0, Math.floor((Date.now() - startRef.current) / 1000));
      setRemaining(Math.max(0, limitSeconds - elapsed));
    }
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [enabled, limitSeconds]);

  return {
    remainingSeconds: remaining,
    elapsedSeconds: Math.max(0, limitSeconds - remaining),
    isExpired: enabled && remaining === 0,
  };
}

function TimerBadge({ remainingSeconds }) {
  const urgent = remainingSeconds <= 60;
  return (
    <span
      role="timer"
      aria-label={`Time remaining ${formatTime(remainingSeconds)}`}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 font-chart text-sm transition-colors ${urgent ? "bg-coral-soft text-s-miss" : "bg-s-card text-s-ink ring-1 ring-s-line"}`}
    >
      <Timer size={16} strokeWidth={2} aria-hidden="true" />
      {formatTime(remainingSeconds)}
    </span>
  );
}

function AiBadge({ children = "AI" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-s-accent-soft px-2.5 py-1 font-chart text-xs text-s-accent-strong">
      <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}

function Chip({ children, className = "" }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full bg-s-tint px-2.5 py-1 font-chart text-xs text-s-mute ${className}`}>{children}</span>;
}

function modeLabel(mode) {
  if (mode === "single-player") return "Guided Self-Practice";
  if (mode === "virtual-patient") return "AI Virtual Patient";
  return mode;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const CHAT_CHAR_LIMIT = 640;

export function OsceHome() {
  const [state, setState] = useState({ loading: true, modules: [], error: "" });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    listOsceStations()
      .then((data) => setState({ loading: false, modules: data.modules || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);
  useEffect(() => { load(); }, [load]);
  const groups = groupModulesBySpecialty(state.modules);
  return <RequireUser><PageMain>
    <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations" }]} />
    <PageHeader title="OSCE Stations" description="Find stations by clinical skill, specialty and practice availability." actions={<LinkButton to="/stations/attempts" variant="secondary"><History size={16} aria-hidden="true" /> Attempts</LinkButton>} />
    {state.loading && <Loading variant="osce-bank" />}
    {state.error && <ErrorMessage message={state.error} onRetry={load} />}
    {!state.loading && !state.error && <>
      <OsceStationBrowser stations={state.modules} defaultContent={<>
        <p className="mb-4 text-sm text-s-mute">{state.modules.length} stations across {groups.length} specialties.</p>
        {groups.length === 0 && <EmptyState character="examiner" tone="mint" title="No stations yet" body="Published OSCE stations will appear here." />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group, i) => {
            const look = specialtyLook(group.name, i);
            const tone = TONES[look.tone];
            const aiCount = group.modules.filter((station) => station.aiVirtualPatientAvailable).length;
            return <Link key={group.name} to={sectionPath(group.name)} className={`site-grid site-press group relative flex min-h-44 min-w-0 flex-col overflow-hidden rounded-3xl border border-s-line bg-s-card p-6 ${tone.ring}`}>
              <div className="relative flex items-start justify-between gap-3">
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tone.soft} ${tone.text}`} aria-hidden="true"><MedIcon name={look.icon} size={32} /></span>
                <Chip>{group.modules.length} {group.modules.length === 1 ? "station" : "stations"}</Chip>
              </div>
              <h2 className="relative mt-5 flex-1 text-xl font-semibold tracking-tight text-s-ink">{group.name}</h2>
              <p className="relative mt-2 text-xs text-s-mute">{aiCount ? `${aiCount} with AI virtual patients · ${group.modules.length - aiCount} guided-only` : "Guided practice only"}</p>
              <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-s-ink">Open specialty <ArrowRight size={15} className={tone.text} aria-hidden="true" /></span>
            </Link>;
          })}
        </div>
      </>} />
    </>}
  </PageMain></RequireUser>;
}

export function OsceSectionPage() {
  const { sectionName } = useParams();
  const [state, setState] = useState({ loading: true, modules: [], error: "" });
  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    listOsceStations()
      .then((data) => setState({ loading: false, modules: data.modules || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);
  useEffect(() => { load(); }, [load]);
  const selected = groupModulesBySpecialty(state.modules).find((group) => group.name === sectionName);
  return <RequireUser><PageMain>
    <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: sectionName || "Specialty" }]} />
    <PageHeader title={sectionName || "Specialty"} description="Filter stations in this specialty by clinical skill and practice availability." />
    {state.loading && <Loading variant="osce-section" />}
    {state.error && <ErrorMessage message={state.error} onRetry={load} />}
    {!state.loading && !state.error && (selected
      ? <OsceStationBrowser key={sectionName} stations={selected.modules} specialtyOnly />
      : <EmptyState character="student-bilal" tone="sun" title="Specialty not found" body="Choose a specialty from the station bank." action={<LinkButton to="/stations">Station bank</LinkButton>} />)}
  </PageMain></RequireUser>;
}

export function OsceStationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, module: null, error: "", starting: "", startError: null });
  const { balance, pricing } = useCredits();
  const aiCost = pricing?.costs.virtualPatient;

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    getOsceStation(slug)
      .then((module) => setState({ loading: false, module, error: "", starting: "", startError: null }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function start(mode) {
    setState((s) => ({ ...s, starting: mode, startError: null }));
    try {
      const data = await createOsceAttempt({ stationId: state.module.id, mode });
      if (data.credits) setCreditBalance(data.credits.balance);
      if (mode === "single-player") navigate(`/stations/${slug}/single-player?attemptId=${data.attempt.id}`);
      else navigate(`/stations/attempts/${data.attempt.id}/session`);
    } catch (err) {
      setState((s) => ({ ...s, starting: "", startError: err }));
      if (isCreditError(err)) refreshCredits().catch(() => {});
    }
  }

  const module = state.module;
  const shortfall = aiCost && balance !== null && balance < aiCost;

  return (
    <RequireUser>
      <PageMain>
        {module ? (
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: module.specialty?.name || "Section", to: sectionPath(module.specialty?.name || "General") }, { label: module.title }]} />
        ) : (
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: "Station" }]} />
        )}
        {state.loading && <Loading variant="module-detail" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {module && (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Panel className="site-rise">
              <div className="flex items-start gap-4">
                <Character name={patientFor(module.title)} size={64} tone={specialtyLook(module.specialty?.name).tone} className="hidden sm:inline-flex" />
                <div className="min-w-0">
                  {module.presentingComplaint && <p className="font-chart text-xs text-s-mute">{module.presentingComplaint}</p>}
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{displayTitle(module.title)}</h1>
                </div>
              </div>
              <p className="mt-4 leading-relaxed text-s-mute">{module.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip>{module.categoryLabel}</Chip>
                <StationAvailability station={module} />
                {module.timeLimitSeconds && <Chip><Clock3 size={12} strokeWidth={2} aria-hidden="true" /> {Math.round(module.timeLimitSeconds / 60)} min</Chip>}
                {module.difficulty && <Chip className="capitalize">{module.difficulty}</Chip>}
              </div>
              <CandidateInstructions module={module} />
            </Panel>
            <div className="space-y-4">
              {module.practiceOptions?.includes("virtual-patient") && <VirtualPatientCard
                module={module}
                onClick={() => start("virtual-patient")}
                loading={state.starting === "virtual-patient"}
                shortfall={shortfall ? `You have ${balance} AI credit${balance === 1 ? "" : "s"}.` : ""}
              />}
              {module.practiceOptions?.includes("single-player") && <SelfPracticeCard onClick={() => start("single-player")} loading={state.starting === "single-player"} />}
              {!module.practiceOptions?.includes("virtual-patient") && <p className="text-sm leading-relaxed text-s-mute">This station uses guided self-practice. An AI virtual patient is not available for this station.</p>}
              <SpendError error={state.startError} />
            </div>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

// The station door card: setting, patient and numbered tasks.
function CandidateInstructions({ module, bare = false }) {
  const instructions = module.candidateInstructions || {};
  const tasks = (instructions.tasks || []).filter((task) => !task.toLowerCase().includes("examiner may ask"));
  return (
    <div className={bare ? "" : "mt-6 border-t border-s-line pt-5"}>
      {!bare && <h2 className="text-lg font-semibold tracking-tight text-s-ink">Candidate instructions</h2>}
      {instructions.context && <p className="mt-2 text-sm leading-relaxed text-s-mute">{instructions.context}</p>}
      {instructions.patientSummary && <p className="mt-2 text-sm leading-relaxed text-s-mute">{instructions.patientSummary}</p>}
      {tasks.length > 0 && (
        <ol className="mt-4 space-y-2.5">
          {tasks.map((task, i) => (
            <li key={task} className="flex gap-3 text-sm font-medium leading-relaxed text-s-ink">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-s-accent-soft font-chart text-xs text-s-accent-strong" aria-hidden="true">{i + 1}</span>
              <span className="pt-0.5">{task}</span>
            </li>
          ))}
        </ol>
      )}
      {!!module.candidateHandout?.length && (
        <div className="mt-5 rounded-2xl border border-s-line bg-s-card p-4">
          <h3 className="text-sm font-semibold text-s-ink">Station handout</h3>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-s-mute">
            {module.candidateHandout.map((line, index) => <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function VirtualPatientCard({ module, onClick, loading, shortfall }) {
  return (
    <div className="site-rise relative overflow-hidden rounded-3xl bg-s-accent p-6 text-s-on-accent" style={{ "--rise-delay": "80ms" }}>
      <span className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.08]" aria-hidden="true">
        <HealthIcon name="stethoscope" size={180} />
      </span>
      <div className="relative flex items-center gap-3">
        <span className="relative">
          <Character name={patientFor(module.title)} size={52} tone="indigo" className="ring-4 ring-s-on-accent/20" />
          <span className="absolute -bottom-1 left-1/2 flex h-5 -translate-x-1/2 items-center rounded-full bg-s-card px-1.5 text-s-accent shadow-sm">
            <VoiceBars />
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-s-on-accent/15 px-2.5 py-1 font-chart text-xs">
          <Sparkles size={13} strokeWidth={2} aria-hidden="true" /> Voice or text
        </span>
      </div>
      <h3 className="relative mt-4 text-xl font-semibold tracking-tight">AI virtual patient</h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-s-on-accent/85">Take the history by voice or text. The patient only reveals what you ask about.</p>
      {shortfall ? (
        <p className="relative mt-5 text-sm text-s-on-accent/90">
          {shortfall}{" "}
          <Link to="/credits" className="font-semibold underline underline-offset-2">Get AI credits</Link> to start.
        </p>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={loading}
          className="site-press relative mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-s-card px-5 text-sm font-semibold text-s-accent hover:bg-s-accent-soft disabled:opacity-60"
        >
          {loading ? "Starting..." : <>Talk to the patient <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></>}
        </button>
      )}
    </div>
  );
}

function SelfPracticeCard({ onClick, loading }) {
  return (
    <Panel className="site-rise" style={{ "--rise-delay": "140ms" }}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft text-mint" aria-hidden="true">
          <MedIcon name="medicalRecords" size={28} />
        </span>
        <span className="rounded-full bg-mint-soft px-2.5 py-1 font-chart text-xs text-s-good">Free</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-s-ink">Guided self-practice</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-s-mute">Work through the station script, then reveal the checklist and mark yourself.</p>
      <SecondaryButton onClick={onClick} disabled={loading} className="mt-5 w-full">
        {loading ? "Starting..." : "Start self-practice"}
      </SecondaryButton>
    </Panel>
  );
}

export function SinglePlayerOsce() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get("attemptId");
  const [state, setState] = useState({ loading: true, content: null, checked: [], scores: {}, notes: "", error: "" });
  const [checklistRevealed, setChecklistRevealed] = useState(false);
  const finishRef = useRef(false);
  const timer = useCountdown({ limitSeconds: state.content?.timeLimitSeconds || 360, enabled: Boolean(state.content) });
  const guard = useLeaveStationGuard({ attemptId, active: Boolean(state.content) });

  useEffect(() => {
    getSinglePlayerContent(slug)
      .then((content) => setState((s) => ({ ...s, loading: false, content })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [slug]);

  async function finish() {
    if (finishRef.current) return;
    finishRef.current = true;
    if (attemptId) {
      await endOsceAttempt(attemptId, { notes: state.notes, elapsedSeconds: timer.elapsedSeconds });
      await selfAssessOsceAttempt(attemptId, state.checked, toItemScores(state.scores));
      navigate(`/stations/attempts/${attemptId}/results`);
    }
  }

  useEffect(() => {
    if (timer.isExpired && state.content) finish();
  }, [timer.isExpired, state.content]);

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: "Self-practice" }]} />
        <LeaveStationDialog open={guard.open} leaving={guard.leaving} error={guard.error} onStay={guard.stay} onLeave={guard.leave} />
        {state.loading && <Loading variant="single-player" />}
        {state.error && <ErrorMessage message={state.error} onRetry={() => window.location.reload()} />}
        {state.content && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Panel className="site-rise">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-chart text-xs text-s-mute">Guided self-practice</p>
                  <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-s-ink sm:text-3xl">{displayTitle(state.content.title)}</h1>
                </div>
                <TimerBadge remainingSeconds={timer.remainingSeconds} />
              </div>
              <CandidateInstructions module={state.content} />
              <div className="mt-6 border-t border-s-line pt-5">
                <div className="flex items-center gap-3">
                  <Character name={patientFor(state.content.title)} size={40} tone="indigo" />
                  <h2 className="text-lg font-semibold tracking-tight text-s-ink">{state.content.simulationScript?.length ? "Simulation script" : "Patient script"}</h2>
                </div>
                <div className="mt-4 grid gap-2.5">
                  {state.content.simulationScript?.length ? state.content.simulationScript.map((line, index) => (
                    <div key={`${index}-${line.slice(0, 24)}`} className="rounded-2xl border border-s-line bg-s-card p-4 text-sm leading-relaxed text-s-mute">{line}</div>
                  )) : state.content.patientScript.facts.map((fact) => (
                    <div key={fact.factId} className="rounded-2xl border border-s-line bg-s-card p-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip>{fact.section}</Chip>
                        <span className="font-medium text-s-ink">{fact.label}</span>
                      </div>
                      <p className="mt-2 leading-relaxed text-s-mute">{fact.naturalResponse}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel className="site-rise self-start xl:sticky xl:top-6" style={{ "--rise-delay": "80ms" }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-s-ink">Marking checklist</h2>
                {checklistRevealed && <Chip>{state.checked.length} marked</Chip>}
              </div>
              {checklistRevealed ? (
                <>
                  <Checklist checklist={state.content.checklist} checked={state.checked} scores={state.scores} onChange={(checked) => setState((s) => ({ ...s, checked }))} onScoreChange={(itemId, rawScore) => setState((s) => withScoredItem(s, itemId, rawScore))} />
                  <StationReview module={state.content} />
                </>
              ) : (
                <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-s-line bg-s-card px-5 py-6 text-center">
                  <Character name="examiner" size={64} tone="mint" />
                  <p className="mt-3 text-sm leading-relaxed text-s-mute">
                    Hidden for now so you test yourself properly. Work through the station script first, then reveal the checklist to mark yourself.
                  </p>
                  <SecondaryButton onClick={() => setChecklistRevealed(true)} className="mt-4">
                    <Eye size={16} strokeWidth={2} aria-hidden="true" /> Reveal checklist
                  </SecondaryButton>
                </div>
              )}
              <label className="mt-5 block">
                <span className="text-sm font-medium text-s-ink">Notes</span>
                <textarea className="mt-2 min-h-28 w-full rounded-xl border border-s-line bg-s-card p-3 text-sm text-s-ink outline-none transition-colors focus:border-s-accent" value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))} />
              </label>
              <PrimaryButton onClick={finish} className="mt-4 w-full">End session and score</PrimaryButton>
            </Panel>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function VirtualPatientSession() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, attempt: null, module: null, text: "", sending: false, error: "", recording: false, transcript: "", voiceMode: "", speakPatient: false });
  const mediaRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);
  const endRef = useRef(false);
  const threadEndRef = useRef(null);
  const timer = useCountdown({ limitSeconds: state.module?.timeLimitSeconds || 360, startedAt: state.attempt?.startedAt, enabled: Boolean(state.attempt && state.module) });
  const guard = useLeaveStationGuard({ attemptId, active: state.attempt?.status === "active" });

  useEffect(() => {
    getOsceAttempt(attemptId)
      .then((data) => setState((s) => ({ ...s, loading: false, attempt: data.attempt, module: data.module })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [attemptId]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [state.attempt?.messages?.length]);

  function speak(text) {
    if (!state.speakPatient || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function send(text = state.text, inputType = "typed", originalTranscript = "") {
    const finalText = text.trim();
    if (!finalText) return;
    if (finalText.length > CHAT_CHAR_LIMIT) {
      setState((s) => ({ ...s, error: `Message is too long. Keep each question under ${CHAT_CHAR_LIMIT} characters.` }));
      return;
    }

    const localMessage = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: "student",
      inputType,
      finalText,
      createdAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      sending: true,
      text: "",
      transcript: "",
      error: "",
      attempt: s.attempt
        ? { ...s.attempt, messages: [...(s.attempt.messages || []), localMessage] }
        : s.attempt,
    }));
    try {
      const data = await sendPatientMessage(attemptId, { text: finalText, inputType, originalTranscript });
      setState((s) => ({ ...s, sending: false, attempt: data.attempt }));
      speak(data.patientMessage?.text);
    } catch (err) {
      setState((s) => ({
        ...s,
        sending: false,
        error: err.message,
        attempt: s.attempt
          ? { ...s.attempt, messages: (s.attempt.messages || []).filter((message) => message.id !== localMessage.id) }
          : s.attempt,
      }));
    }
  }

  async function toggleRecording() {
    if (state.recording) {
      recognitionRef.current?.stop();
      mediaRef.current?.stop();
      setState((s) => ({ ...s, recording: false, voiceMode: "" }));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();
        setState((s) => ({ ...s, transcript, recording: false, voiceMode: "" }));
      };
      recognition.onerror = async () => {
        recognitionRef.current = null;
        setState((s) => ({ ...s, recording: false, voiceMode: "" }));
        await startGroqFallbackRecording();
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setState((s) => ({ ...s, recording: false, voiceMode: "" }));
      };
      recognitionRef.current = recognition;
      setState((s) => ({ ...s, recording: true, voiceMode: "browser" }));
      recognition.start();
      return;
    }

    await startGroqFallbackRecording();
  }

  async function startGroqFallbackRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const data = await transcribeOsceAudio(attemptId, blob);
          setState((s) => ({ ...s, transcript: data.transcript || "", recording: false, voiceMode: "" }));
        } catch (err) {
          setState((s) => ({ ...s, error: err.message, recording: false, voiceMode: "" }));
        }
      };
      mediaRef.current = recorder;
      recorder.start();
      setState((s) => ({ ...s, recording: true, voiceMode: "groq" }));
    } catch (err) {
      setState((s) => ({ ...s, error: err.message, recording: false, voiceMode: "" }));
    }
  }

  async function endSession() {
    if (endRef.current) return;
    endRef.current = true;
    await endOsceAttempt(attemptId, { elapsedSeconds: timer.elapsedSeconds });
    navigate(`/stations/attempts/${attemptId}/self-assessment`);
  }

  useEffect(() => {
    if (timer.isExpired && state.attempt && state.module) endSession();
  }, [timer.isExpired, state.attempt, state.module]);

  const patient = patientFor(state.module?.title);
  const nearLimit = state.text.length > CHAT_CHAR_LIMIT - 80;

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: "Virtual patient" }]} />
        <LeaveStationDialog ai open={guard.open} leaving={guard.leaving} error={guard.error} onStay={guard.stay} onLeave={guard.leave} />
        {state.loading && <Loading variant="chat" />}
        {state.error && (
          <div className="mb-4">
            <ErrorMessage message={state.error} onRetry={state.attempt ? undefined : () => window.location.reload()} />
          </div>
        )}
        {state.attempt && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="site-rise site-grid site-shadow flex h-[calc(100dvh-190px)] min-h-[520px] flex-col overflow-hidden rounded-3xl border border-s-line sm:h-[calc(100dvh-150px)]">
              <div className="flex items-center gap-3 border-b border-s-line bg-s-card/90 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
                <span className="relative shrink-0">
                  <Character name={patient} size={52} tone="indigo" />
                  <span className="absolute -bottom-1 left-1/2 flex h-5 -translate-x-1/2 items-center rounded-full bg-s-card px-1.5 text-s-accent shadow-sm">
                    {state.sending ? <VoiceBars /> : <Mic size={12} strokeWidth={2} aria-hidden="true" />}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate font-medium text-s-ink sm:text-lg">{displayTitle(state.module?.title)}</h1>
                  <p className="truncate font-chart text-xs text-s-mute">
                    AI virtual patient{state.voiceMode === "browser" ? " / listening" : state.voiceMode === "groq" ? " / recording" : ""}
                  </p>
                </div>
                <TimerBadge remainingSeconds={timer.remainingSeconds} />
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-5" aria-live="polite">
                {state.attempt.messages.length === 0 ? (
                  <div className="m-auto flex max-w-md flex-col items-center text-center">
                    <p className="font-chart text-xs text-s-mute">The patient opens</p>
                    <p className="mt-3 rounded-2xl rounded-bl-md bg-s-card px-5 py-4 text-left text-[15px] leading-relaxed text-s-ink shadow-sm">{state.module?.openingStatement}</p>
                    <p className="mt-4 text-sm text-s-mute">Ask your first question below, by typing or with the mic.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-[15px] leading-snug">
                    {state.attempt.messages.map((message) =>
                      message.role === "student" ? (
                        <p key={message.id} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-s-accent px-4 py-2.5 text-s-on-accent sm:max-w-[75%]">
                          {message.finalText}
                        </p>
                      ) : (
                        <div key={message.id} className="flex items-end gap-2">
                          <Character name={patient} size={28} tone="indigo" className="hidden sm:inline-flex" />
                          <p className="w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-s-card px-4 py-2.5 text-s-ink shadow-sm sm:max-w-[75%]">{message.finalText}</p>
                        </div>
                      ),
                    )}
                    {state.sending && (
                      <div className="flex items-end gap-2">
                        <Character name={patient} size={28} tone="indigo" className="hidden sm:inline-flex" />
                        <p className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-s-card px-4 py-3.5 shadow-sm" aria-label="The patient is answering">
                          {[0, 1, 2].map((d) => (
                            <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full bg-s-mute" style={{ animationDelay: `${d * 150}ms` }} />
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>

              {state.transcript && (
                <div className="mx-3 mb-3 rounded-2xl border border-s-accent/25 bg-s-accent-soft/60 p-3 sm:mx-5">
                  <label htmlFor="transcript-review" className="flex items-center gap-1.5 text-xs font-medium text-s-accent-strong">
                    <Mic size={13} strokeWidth={2} aria-hidden="true" /> Check what we heard, then send
                  </label>
                  <textarea id="transcript-review" className="mt-2 w-full rounded-xl border border-s-line bg-s-card p-2.5 text-sm text-s-ink outline-none focus:border-s-accent" value={state.transcript} onChange={(e) => setState((s) => ({ ...s, transcript: e.target.value }))} />
                  <PrimaryButton onClick={() => send(state.transcript, "voice", state.transcript)} className="mt-2">Send question</PrimaryButton>
                </div>
              )}

              <div className="border-t border-s-line bg-s-card/90 p-3 sm:p-4">
                <div className="flex items-center gap-2 rounded-full border border-s-line bg-s-card py-1.5 pl-4 pr-1.5 transition-[border-color,box-shadow] duration-200 focus-within:border-s-accent focus-within:ring-4 focus-within:ring-s-accent/12">
                  <label htmlFor="patient-question" className="sr-only">Your question</label>
                  <input
                    id="patient-question"
                    maxLength={CHAT_CHAR_LIMIT}
                    className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] text-s-ink outline-none placeholder:text-s-mute"
                    value={state.text}
                    onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                    placeholder="Ask one focused question..."
                  />
                  <button
                    type="button"
                    aria-label={state.recording ? "Stop recording" : "Record voice question"}
                    aria-pressed={state.recording}
                    onClick={toggleRecording}
                    className={`site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${state.recording ? "bg-coral text-s-on-accent" : "bg-s-tint text-s-ink hover:bg-s-accent-soft"}`}
                  >
                    {state.recording ? <Square size={16} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
                  </button>
                  <button
                    type="button"
                    aria-label="Send question"
                    onClick={() => send()}
                    disabled={state.sending || state.text.length > CHAT_CHAR_LIMIT}
                    className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-s-accent text-s-on-accent hover:bg-s-accent-strong disabled:opacity-50"
                  >
                    <Send size={17} strokeWidth={2} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 px-2 text-xs">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-s-mute">
                    <input type="checkbox" checked={state.speakPatient} onChange={(e) => setState((s) => ({ ...s, speakPatient: e.target.checked }))} className="peer sr-only" />
                    <span className="relative h-5 w-9 shrink-0 rounded-full bg-s-line transition-colors peer-checked:bg-s-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-s-accent after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-s-card after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" aria-hidden="true" />
                    Read replies aloud
                  </label>
                  <span className={`font-chart ${nearLimit ? "text-s-miss" : "text-s-mute"}`}>
                    {state.text.length} / {CHAT_CHAR_LIMIT}
                  </span>
                </div>
              </div>
            </div>

            <Panel className="site-rise self-start xl:sticky xl:top-6" style={{ "--rise-delay": "80ms" }}>
              <h2 className="text-lg font-semibold tracking-tight text-s-ink">Candidate instructions</h2>
              <CandidateInstructions module={state.module} bare />
              <PrimaryButton onClick={endSession} className="mt-6 w-full">End session</PrimaryButton>
            </Panel>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function SelfAssessmentPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, attempt: null, checklist: null, checked: [], scores: {}, aiLoading: false, error: "", spendError: null });
  const guard = useLeaveStationGuard({ attemptId, active: state.attempt?.status === "ended" && !state.aiLoading });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    getOsceAttempt(attemptId)
      .then((data) => setState((s) => ({ ...s, loading: false, attempt: data.attempt, checklist: data.checklist })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [attemptId]);

  useEffect(() => {
    load();
  }, [load]);

  async function selfAssess() {
    try {
      await selfAssessOsceAttempt(attemptId, state.checked, toItemScores(state.scores));
      navigate(`/stations/attempts/${attemptId}/results`);
    } catch (err) {
      setState((s) => ({ ...s, spendError: err }));
    }
  }

  async function aiAssess() {
    setState((s) => ({ ...s, aiLoading: true, spendError: null }));
    try {
      const data = await aiAssessOsceAttempt(attemptId);
      if (Number.isFinite(data.credits?.balance)) setCreditBalance(data.credits.balance);
      navigate(`/stations/attempts/${attemptId}/results`);
    } catch (err) {
      setState((s) => ({ ...s, aiLoading: false, spendError: err }));
      refreshCredits().catch(() => {});
    }
  }

  const allItems = state.checklist?.sections.flatMap((section) => section.items) || [];
  const totalPoints = allItems.reduce((sum, item) => sum + item.maxRawScore, 0);
  const markedPoints = allItems.reduce((sum, item) => sum + (state.scores[item.itemId] ?? (state.checked.includes(item.itemId) ? item.maxRawScore : 0)), 0);
  const tickedPct = totalPoints ? Math.round((markedPoints / totalPoints) * 100) : 0;

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: "Assessment" }]} />
        <LeaveStationDialog ai={state.attempt?.mode === "virtual-patient"} open={guard.open} leaving={guard.leaving} error={guard.error} onStay={guard.stay} onLeave={guard.leave} />
        {state.loading && <Loading variant="assessment" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {state.checklist && (
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_17rem]">
            <Panel className="site-rise">
              <h1 className="text-2xl font-semibold tracking-tight text-s-ink sm:text-3xl">Mark your station</h1>
              <p className="mt-2 leading-relaxed text-s-mute">Tick what you covered, or let the AI examiner read your transcript and mark it for you.</p>
              <Checklist checklist={state.checklist} checked={state.checked} scores={state.scores} onChange={(checked) => setState((s) => ({ ...s, checked }))} onScoreChange={(itemId, rawScore) => setState((s) => withScoredItem(s, itemId, rawScore))} />
            </Panel>
            <Panel className="site-rise flex flex-col items-center text-center md:sticky md:top-6 md:self-start" style={{ "--rise-delay": "80ms" }}>
              <Character name="examiner" size={64} tone="mint" />
              <ScoreRing pct={tickedPct} tone="text-mint" className="mt-4 h-32 w-32">
                <span className="text-3xl font-semibold tracking-tight text-s-ink">{markedPoints}</span>
                <span className="font-chart text-xs text-s-mute">of {totalPoints} points</span>
              </ScoreRing>
              <PrimaryButton onClick={aiAssess} disabled={state.aiLoading} className="mt-6 w-full">
                <Sparkles size={16} strokeWidth={2} aria-hidden="true" /> {state.aiLoading ? "Assessing..." : "AI assessment"}
              </PrimaryButton>
              <SecondaryButton onClick={selfAssess} className="mt-2 w-full">Submit my marking</SecondaryButton>
              <div className="w-full text-left"><SpendError error={state.spendError} /></div>
            </Panel>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function OsceResultPage() {
  const { attemptId } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    getOsceAttempt(attemptId)
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((err) => setState({ loading: false, data: null, error: err.message }));
  }, [attemptId]);

  useEffect(() => {
    load();
  }, [load]);

  const attempt = state.data?.attempt;
  const pct = attempt?.finalScore?.percentage ?? 0;
  const tone = scoreTone(pct);
  const missed = attempt?.feedback?.missedItems || [];

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: "Results" }]} />
        {state.loading && <Loading variant="results" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {attempt && (
          <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Panel className="site-rise flex flex-col items-center text-center lg:self-start">
              <p className="font-chart text-xs text-s-mute">Final score</p>
              <ScoreRing pct={pct} tone={tone.ring} className="mt-4 h-40 w-40">
                <span className="text-4xl font-semibold tracking-tight text-s-ink">{pct}%</span>
                <span className="font-chart text-xs text-s-mute">{attempt.finalScore?.rawScore ?? 0} / {attempt.finalScore?.maxRawScore ?? 0} marks</span>
              </ScoreRing>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Chip>{modeLabel(attempt.mode)}</Chip>
                {attempt.aiAssessment?.provider && <AiBadge>AI marked</AiBadge>}
              </div>
              <LinkButton to="/stations" className="mt-6 w-full">Practise another station</LinkButton>
              <LinkButton to="/stations/attempts" variant="secondary" className="mt-2 w-full">Attempt history</LinkButton>
            </Panel>
            <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
              <div className="flex items-center gap-3">
                <Character name="examiner" size={48} tone="mint" />
                <h1 className="text-2xl font-semibold tracking-tight text-s-ink">Examiner feedback</h1>
              </div>
              <p className="mt-4 leading-relaxed text-s-mute">{attempt.feedback?.summary || "No written feedback for this attempt."}</p>
              <h2 className="mt-6 font-semibold text-s-ink">Missed items</h2>
              {missed.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {missed.map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-s-line bg-s-card p-3.5 text-sm leading-relaxed text-s-ink">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral" aria-hidden="true"><X size={13} strokeWidth={2.5} /></span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 flex items-center gap-3 rounded-2xl bg-mint-soft p-3.5 text-sm text-s-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-s-card" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                  Nothing missed on the checklist.
                </p>
              )}
              {state.data.module && <StationReview module={state.data.module} />}
            </Panel>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function OsceAttemptHistoryPage() {
  const [state, setState] = useState({ loading: true, attempts: [], error: "" });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    listOsceAttempts()
      .then((attempts) => setState({ loading: false, attempts, error: "" }))
      .catch((err) => setState({ loading: false, attempts: [], error: err.message }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: "Attempts" }]} />
        <PageHeader title="Attempt history" description="Every marked station, newest first." />
        {state.loading && <Loading variant="attempts" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {!state.loading && !state.error && state.attempts.length === 0 && (
          <EmptyState character="student-hira" tone="coral" title="No attempts yet" body="Finish and mark a station, and it will show up here with your score." action={<LinkButton to="/stations">Browse stations</LinkButton>} />
        )}
        <ul className="space-y-3">
          {state.attempts.map((attempt, i) => {
            const pct = attempt.finalScore?.percentage;
            const ai = attempt.mode === "virtual-patient";
            return (
              <li key={attempt.id} className="site-rise" style={{ "--rise-delay": `${Math.min(i, 8) * 40}ms` }}>
                <Link to={`/stations/attempts/${attempt.id}/results`} className="site-grid site-press flex items-center gap-4 rounded-3xl border border-s-line p-4 hover:border-s-accent/40">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${ai ? "bg-s-accent-soft text-s-accent" : "bg-mint-soft text-mint"}`} aria-hidden="true">
                    <MedIcon name={ai ? "stethoscope" : "memo"} size={26} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-s-ink">{displayTitle(attempt.module?.title) || "Station"}</p>
                    <p className="mt-0.5 truncate font-chart text-xs text-s-mute">
                      {modeLabel(attempt.mode)} / {attempt.status === "ai-assessed" ? "AI marked" : "Self marked"}{attempt.startedAt ? ` / ${formatDate(attempt.startedAt)}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1.5 font-chart text-sm ${pct == null ? "bg-s-tint text-s-mute" : scoreTone(pct).chip}`}>
                    {pct == null ? "-" : `${pct}%`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PageMain>
    </RequireUser>
  );
}

const STATUS_STYLES = {
  draft: "bg-sun-soft text-s-ink",
  approved: "bg-sky-soft text-s-ink",
  published: "bg-mint-soft text-s-good",
  archived: "bg-s-tint text-s-mute",
};

const time = (value) => (value ? new Date(value).getTime() : 0);
const STATION_SORTS = {
  newest: { label: "Newest first", compare: (a, b) => time(b.createdAt) - time(a.createdAt) },
  updated: { label: "Recently edited", compare: (a, b) => time(b.updatedAt) - time(a.updatedAt) },
  oldest: { label: "Oldest first", compare: (a, b) => time(a.createdAt) - time(b.createdAt) },
  title: { label: "Title A to Z", compare: (a, b) => a.title.localeCompare(b.title) },
  specialty: { label: "Specialty", compare: (a, b) => (a.specialty?.name || "").localeCompare(b.specialty?.name || "") || a.title.localeCompare(b.title) },
};

export function AdminOscePage() {
  const user = getCurrentUser();
  if (user?.role !== "admin") return <RequireUser active="admin" adminOnly />;
  return <AdminConsole />;
}

function AdminConsole() {
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const [stationSearch, setStationSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [stationCategoryFilter, setStationCategoryFilter] = useState("");
  const [stationModeFilter, setStationModeFilter] = useState("");
  const [editStationId, setEditStationId] = useState(null);
  const [deleteStation, setDeleteStation] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [stationSort, setStationSort] = useState("newest");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    savingAi: false,
    modules: [],
    users: [],
    aiStatus: null,
    message: "",
    error: "",
    aiForm: {
      defaultProvider: "groq",
      maxStudentMessageTokens: "160",
      groqApiKey: "",
      groqChatModel: "openai/gpt-oss-20b",
      groqEvalModel: "openai/gpt-oss-20b",
      groqSttModel: "whisper-large-v3-turbo",
      openaiApiKey: "",
      openaiChatModel: "gpt-5.6-luna",
      openaiEvalModel: "gpt-5.6-luna",
    },
  });
  useEffect(() => {
    Promise.all([listAdminOsceStations(), getAiStatus(), listAdminUsers()])
      .then(([modules, aiStatus, users]) => setState((s) => ({
        ...s,
        loading: false,
        modules,
        users,
        aiStatus,
        aiForm: aiStatusToForm(aiStatus),
      })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);

  function updateAiForm(field, value) {
    setState((s) => ({ ...s, aiForm: { ...s.aiForm, [field]: value } }));
  }

  async function changeStatus(id, status, confirmed = false) {
    if (status === "archived" && !confirmed && !window.confirm("Archive this station? It will no longer appear to students.")) return;
    setStatusBusyId(id);
    setState((s) => ({ ...s, error: "", message: "" }));
    try {
      await updateAdminOsceStationStatus(id, status);
      const modules = await listAdminOsceStations();
      setState((s) => ({ ...s, modules, message: `Station ${status}.` }));
    } catch (err) {
      setState((s) => ({ ...s, error: err.message }));
    } finally {
      setStatusBusyId(null);
    }
  }

  async function saveAiSettings(e) {
    e.preventDefault();
    if ((state.aiForm.groqApiKey === "__CLEAR__" || state.aiForm.openaiApiKey === "__CLEAR__") &&
      !window.confirm("Remove the selected API key? Sessions using that provider may stop working.")) return;
    setState((s) => ({ ...s, savingAi: true, error: "", message: "" }));
    try {
      const aiStatus = await updateAiStatus(aiFormToPayload(state.aiForm));
      setState((s) => ({
        ...s,
        savingAi: false,
        aiStatus,
        aiForm: { ...aiStatusToForm(aiStatus), groqApiKey: "", openaiApiKey: "" },
        message: "AI settings saved.",
      }));
    } catch (err) {
      setState((s) => ({ ...s, savingAi: false, error: err.message }));
    }
  }

  // Grouped so the vertical menu reads as: content, people, settings.
  const tabs = [
    { id: "overview", label: "Overview", icon: Layers3, group: "" },
    { id: "stations", label: "OSCE stations", icon: Stethoscope, group: "Content" },
    { id: "announcements", label: "Announcements", icon: Megaphone, group: "Content" },
    { id: "users", label: "Accounts", icon: Users, group: "People" },
    { id: "activity", label: "Activity log", icon: ScrollText, group: "People" },
    { id: "access", label: "Site access", icon: ToggleRight, group: "Settings" },
    { id: "pricing", label: "Pricing", icon: Coins, group: "Settings" },
    { id: "branding", label: "Branding", icon: Palette, group: "Settings" },
    { id: "ai", label: "AI & models", icon: Settings2, group: "Settings" },
  ];
  const activeTab = tabs.some((t) => t.id === tabParam) ? tabParam : "overview";
  // Each section has its own address (/admin/stations, /admin/pricing, ...),
  // so the browser's back button and shared links work.
  const goTo = (tab, filter) => {
    if (filter) setStationFilter(filter);
    navigate(tab === "overview" ? "/admin" : `/admin/${tab}`);
  };
  useEffect(() => {
    setState((s) => (s.error || s.message ? { ...s, error: "", message: "" } : s));
    window.scrollTo({ top: 0 });
  }, [activeTab]);
  const counts = Object.fromEntries(["draft", "approved", "published", "archived"].map((status) => [status, state.modules.filter((station) => station.status === status).length]));
  const visibleStations = state.modules.filter((station) =>
    (!stationCategoryFilter || station.category === stationCategoryFilter) &&
    (!stationModeFilter || station.aiVirtualPatientAvailable === (stationModeFilter === "ai")) &&
    (stationFilter === "all" || (stationFilter === "review" ? ["draft", "approved"].includes(station.status) : station.status === stationFilter)) &&
    `${station.title} ${station.slug} ${station.specialty?.name || ""}`.toLowerCase().includes(stationSearch.toLowerCase().trim()),
  ).sort(STATION_SORTS[stationSort].compare);
  const defaultProvider = state.aiStatus?.providers?.find((provider) => provider.id === state.aiStatus.defaultProvider);

  return (
    <AdminShell tabs={tabs} active={activeTab}>
        {state.loading && <Loading variant="admin" />}
        {state.error && <div className="mb-4"><ErrorMessage message={state.error} /></div>}
        {state.message && <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl bg-mint-soft p-3.5 text-sm text-s-good"><Check size={16} strokeWidth={2.5} aria-hidden="true" />{state.message}</p>}
        {!state.loading && activeTab === "overview" && <AdminOverview counts={counts} defaultProvider={defaultProvider} onNavigate={goTo} />}
        {!state.loading && activeTab === "stations" && <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-2xl font-semibold tracking-tight text-s-ink">OSCE stations</h2><p className="text-sm text-s-mute">Search, edit, review, publish or archive stations.</p></div>
            <div className="flex flex-wrap gap-2">
              <SecondaryButton onClick={() => setShowCreateForm(true)}><Plus size={16} strokeWidth={2} aria-hidden="true" /> Write one</SecondaryButton>
              <PrimaryButton type="button" onClick={() => setImportOpen(true)}><FileJson size={16} strokeWidth={2} aria-hidden="true" /> Import JSON</PrimaryButton>
            </div>
          </div>
          <Panel>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative"><span className="sr-only">Search stations</span><Search size={17} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" /><input value={stationSearch} onChange={(e) => setStationSearch(e.target.value)} placeholder="Search title, slug, or specialty" className="w-full min-h-11 rounded-xl border border-s-line bg-s-card py-2.5 pl-10 pr-3 text-sm text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent" /></label>
              <label><span className="sr-only">Filter by status</span><select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} className="w-full min-h-11 rounded-xl border border-s-line bg-s-card p-2.5 text-sm text-s-ink outline-none focus:border-s-accent"><option value="all">All statuses</option><option value="review">Needs review</option>{Object.keys(counts).map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-s-mute">Sort by<select className="mt-1 min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3 text-s-ink" value={stationSort} onChange={(e) => setStationSort(e.target.value)}>{Object.entries(STATION_SORTS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-sm text-s-mute">Category<select className="mt-1 min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3 text-s-ink" value={stationCategoryFilter} onChange={(e) => setStationCategoryFilter(e.target.value)}><option value="">All categories</option>{OSCE_CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-sm text-s-mute">Practice availability<select className="mt-1 min-h-11 w-full rounded-xl border border-s-line bg-s-card px-3 text-s-ink" value={stationModeFilter} onChange={(e) => setStationModeFilter(e.target.value)}><option value="">All stations</option><option value="ai">AI virtual patient available</option><option value="guided">Guided practice only</option></select></label>
            </div>
            <div className="mt-4 divide-y divide-s-line">
              {visibleStations.map((station) => (
                <div key={station.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1"><p className="font-semibold text-s-ink">{station.title}</p><p className="break-all text-xs text-s-mute">{station.specialty?.name || "General"} / {station.slug}</p><p className="my-1 text-xs text-s-mute">{station.categoryLabel}{station.createdAt && <span> / added {new Date(station.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>}</p><StationAvailability station={station} /></div>
                  <span className={`rounded-full px-2.5 py-1 font-chart text-xs capitalize ${STATUS_STYLES[station.status] || "bg-s-tint text-s-mute"}`}>{station.status}</span>
                  <SecondaryButton onClick={() => setEditStationId(station.id)} className="px-4"><Pencil size={15} strokeWidth={2} aria-hidden="true" /> Edit</SecondaryButton>
                  <label className="sr-only" htmlFor={`station-status-${station.id}`}>Change status for {station.title}</label>
                  <select id={`station-status-${station.id}`} aria-label={`Change status for ${station.title}`} value={station.status} disabled={statusBusyId === station.id} onChange={(e) => changeStatus(station.id, e.target.value)} className="min-h-11 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent disabled:opacity-50">
                    {Object.keys(counts).map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                  </select>
                  <button type="button" onClick={() => setDeleteStation(station)} aria-label={`Delete ${station.title}`} title="Delete station" className="site-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-s-mute hover:bg-coral-soft/60 hover:text-s-miss">
                    <Trash2 size={17} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {visibleStations.length === 0 && <p className="py-5 text-center text-sm text-s-mute">No stations match this search.</p>}
            </div>
          </Panel>
          <NewStationDialog
            open={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onCreated={async (created) => {
              const modules = await listAdminOsceStations();
              setStationFilter("draft");
              setStationSearch("");
              setState((s) => ({ ...s, modules, message: `"${created[0]?.title}" saved as a draft. Review it, then publish.` }));
            }}
          />
        </div>}
        {!state.loading && activeTab === "ai" && (
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <AiBadge>AI control</AiBadge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-s-ink">Inference settings</h2>
                <p className="mt-1 max-w-2xl text-sm text-s-mute">Choose the provider and models for virtual patients, assessment, and voice transcription. API keys are write-only.</p>
              </div>
              <div className="text-right text-xs font-semibold text-s-mute">
                {(state.aiStatus?.providers || []).map((provider) => (
                  <p key={provider.id}>{provider.label}: {provider.configured ? provider.apiKeyPreview || "configured" : "not configured"}</p>
                ))}
              </div>
            </div>
            <form onSubmit={saveAiSettings} className="mt-6 space-y-5">
              <p className="rounded-2xl bg-s-tint/60 p-3.5 text-sm text-s-mute">Changes apply to new AI requests. Removing a saved key does not remove a key supplied through server environment variables.</p>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm font-medium text-s-ink">Default provider
                  <select className="mt-2 min-h-11 w-full rounded-xl border border-s-line bg-s-card p-2.5 text-sm font-normal text-s-ink outline-none focus:border-s-accent" value={state.aiForm.defaultProvider} onChange={(e) => updateAiForm("defaultProvider", e.target.value)}>
                    <option value="groq">Groq</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </label>
                <TextInput label="Per-message token limit" type="number" min="20" max="2000" value={state.aiForm.maxStudentMessageTokens} onChange={(value) => updateAiForm("maxStudentMessageTokens", value)} />
              </div>
              {!(state.aiStatus?.providers || []).find((provider) => provider.id === state.aiForm.defaultProvider)?.configured && !state.aiForm[`${state.aiForm.defaultProvider}ApiKey`] &&
                <p className="flex items-start gap-2 rounded-2xl bg-sun-soft p-3.5 text-sm text-s-ink"><AlertTriangle size={17} strokeWidth={2} className="shrink-0 text-sun" aria-hidden="true" /> This provider has no API key. Add one before using AI sessions.</p>}
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-s-line bg-s-card p-4">
                  <h3 className="font-semibold tracking-tight text-s-ink">Groq</h3>
                  <div className="mt-3 space-y-3">
                    <TextInput label="Groq API key" type="password" autoComplete="new-password" value={state.aiForm.groqApiKey === "__CLEAR__" ? "" : state.aiForm.groqApiKey} onChange={(value) => updateAiForm("groqApiKey", value)} placeholder={state.aiForm.groqApiKey === "__CLEAR__" ? "Removal pending" : "Leave blank to keep existing"} />
                    {state.aiStatus?.providers?.find((provider) => provider.id === "groq")?.configured && <button type="button" onClick={() => updateAiForm("groqApiKey", state.aiForm.groqApiKey === "__CLEAR__" ? "" : "__CLEAR__")} className="min-h-11 text-xs font-medium text-s-miss hover:underline">{state.aiForm.groqApiKey === "__CLEAR__" ? "Undo key removal" : "Remove saved key on save"}</button>}
                    <TextInput label="Chat model" value={state.aiForm.groqChatModel} onChange={(value) => updateAiForm("groqChatModel", value)} />
                    <TextInput label="Assessment model" value={state.aiForm.groqEvalModel} onChange={(value) => updateAiForm("groqEvalModel", value)} />
                    <TextInput label="Speech-to-text model" value={state.aiForm.groqSttModel} onChange={(value) => updateAiForm("groqSttModel", value)} />
                  </div>
                </div>
                <div className="rounded-2xl border border-s-line bg-s-card p-4">
                  <h3 className="font-semibold tracking-tight text-s-ink">OpenAI</h3>
                  <div className="mt-3 space-y-3">
                    <TextInput label="OpenAI API key" type="password" autoComplete="new-password" value={state.aiForm.openaiApiKey === "__CLEAR__" ? "" : state.aiForm.openaiApiKey} onChange={(value) => updateAiForm("openaiApiKey", value)} placeholder={state.aiForm.openaiApiKey === "__CLEAR__" ? "Removal pending" : "Leave blank to keep existing"} />
                    {state.aiStatus?.providers?.find((provider) => provider.id === "openai")?.configured && <button type="button" onClick={() => updateAiForm("openaiApiKey", state.aiForm.openaiApiKey === "__CLEAR__" ? "" : "__CLEAR__")} className="min-h-11 text-xs font-medium text-s-miss hover:underline">{state.aiForm.openaiApiKey === "__CLEAR__" ? "Undo key removal" : "Remove saved key on save"}</button>}
                    <TextInput label="Chat model" value={state.aiForm.openaiChatModel} onChange={(value) => updateAiForm("openaiChatModel", value)} />
                    <TextInput label="Assessment model" value={state.aiForm.openaiEvalModel} onChange={(value) => updateAiForm("openaiEvalModel", value)} />
                  </div>
                </div>
              </div>
              <PrimaryButton type="submit" disabled={state.savingAi}>{state.savingAi ? "Saving..." : "Save AI settings"}</PrimaryButton>
            </form>
          </Panel>
        )}
        {!state.loading && activeTab === "users" && <AdminAccounts />}
        {!state.loading && activeTab === "announcements" && <AdminAnnouncements />}
        {!state.loading && activeTab === "pricing" && <AdminPricing />}
        {!state.loading && activeTab === "access" && <AdminAccess />}
        {!state.loading && activeTab === "branding" && <AdminBranding />}
        {!state.loading && activeTab === "activity" && <AdminActivity />}
        <ImportStationsDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={async (created) => {
            const modules = await listAdminOsceStations();
            setStationFilter("draft");
            setStationSearch("");
            setState((s) => ({ ...s, modules, message: `Imported ${created.length} ${created.length === 1 ? "station" : "stations"} as drafts. Review, then publish.` }));
          }}
        />
        <DeleteStationDialog
          station={deleteStation}
          onClose={() => setDeleteStation(null)}
          onArchive={(station) => changeStatus(station.id, "archived", true)}
          onDeleted={async (station) => {
            const modules = await listAdminOsceStations();
            setState((s) => ({ ...s, modules, message: `"${station.title}" deleted.` }));
          }}
        />
        <StationEditDialog
          stationId={editStationId}
          onClose={() => setEditStationId(null)}
          onSaved={async () => {
            const modules = await listAdminOsceStations();
            setState((s) => ({ ...s, modules, message: "Station saved." }));
          }}
        />
    </AdminShell>
  );
}

const WEIGHT_TAGS = {
  critical: { label: "Critical", className: "bg-coral-soft text-s-miss" },
  major: { label: "Major", className: "bg-s-tint text-s-mute" },
  minor: { label: "Minor", className: "bg-s-tint text-s-mute" },
};

function WeightTag({ weight, className = "" }) {
  const tag = WEIGHT_TAGS[weight];
  if (!tag) return null;
  return <span className={`rounded-full px-2.5 py-1 font-chart text-xs ${tag.className} ${className}`}>{tag.label}</span>;
}

// Checklist rows styled like the landing "Mark yourself like the examiner".
function withScoredItem(state, itemId, rawScore) {
  return {
    ...state,
    scores: { ...state.scores, [itemId]: rawScore },
    checked: rawScore > 0 ? [...new Set([...state.checked, itemId])] : state.checked.filter((id) => id !== itemId),
  };
}

function toItemScores(scores) {
  return Object.entries(scores).map(([itemId, rawScore]) => ({ itemId, rawScore }));
}

// What a student needs after a station: the model answer, the order to work
// in, what examiners reward, self-test prompts and the errors that fail a
// station. Exam-design metadata (circuit timing, rating scales, competency
// tags) and the faculty note stay in the data for marking but aren't shown.
function StationReview({ module }) {
  const hasReview = module.learningNotes || module.keyAnswerGuide || module.examinerInstructions || module.suggestedCandidateApproach?.length;
  if (!hasReview) return null;
  return (
    <div className="mt-6 border-t border-s-line pt-5">
      <h2 className="font-semibold text-s-ink">Station review</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-s-mute">
        {!!module.learningNotes && <p className="whitespace-pre-line rounded-2xl border border-s-line bg-s-card p-4"><strong>Review notes:</strong> {module.learningNotes}</p>}
        {!!module.keyAnswerGuide && <p className="whitespace-pre-line"><strong>Answer guide:</strong> {module.keyAnswerGuide}</p>}
        {!!module.suggestedCandidateApproach?.length && <p><strong>Suggested approach:</strong> {module.suggestedCandidateApproach.join(" → ")}</p>}
        {!!module.examinerInstructions && <p className="whitespace-pre-line"><strong>What examiners look for:</strong> {module.examinerInstructions}</p>}
        {!!module.vivaQuestions?.length && <div><strong>Questions an examiner may ask:</strong><ul className="mt-2 list-disc pl-5">{module.vivaQuestions.map(prompt => <li key={prompt.question}>{prompt.question}</li>)}</ul></div>}
        {!!module.criticalSafetyErrors?.length && <div className="text-coral"><strong>Critical safety errors:</strong><ul className="mt-2 list-disc pl-5">{module.criticalSafetyErrors.map(error => <li key={error}>{error}</li>)}</ul></div>}
      </div>
    </div>
  );
}

function Checklist({ checklist, checked, scores = {}, onChange, onScoreChange }) {
  const selected = new Set(checked);
  function toggle(itemId) {
    const next = new Set(selected);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    onChange([...next]);
  }
  return (
    <div className="mt-5 space-y-6">
      {checklist.sections.map((section) => (
        <div key={section.sectionId}>
          <h3 className="font-semibold text-s-ink">{section.title}</h3>
          <ul className="mt-2.5 divide-y divide-s-line overflow-hidden rounded-2xl border border-s-line bg-s-card">
            {section.items.map((item) => {
              const on = selected.has(item.itemId);
              return item.maxRawScore > 1 ? (
                <li key={item.itemId} className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-3.5">
                  <select
                    aria-label={`Score: ${item.label}`}
                    className="min-h-11 w-full shrink-0 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink sm:order-1 sm:w-auto"
                    value={scores[item.itemId] ?? 0}
                    onChange={(event) => onScoreChange(item.itemId, Number(event.target.value))}
                  >
                    {Array.from({ length: item.maxRawScore + 1 }, (_, score) => (
                      <option key={score} value={score}>
                        {score}/{item.maxRawScore} · {score === 0 ? "Omitted" : score === item.maxRawScore ? "Complete" : "Partial"}
                      </option>
                    ))}
                  </select>
                  <span className="-order-1 min-w-0 flex-1 text-sm leading-relaxed text-s-ink sm:order-2 sm:pt-2.5">{item.label}</span>
                </li>
              ) : (
                <li key={item.itemId}>
                  <label className="flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-s-page">
                    <input type="checkbox" checked={on} onChange={() => toggle(item.itemId)} className="peer sr-only" />
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-s-accent ${
                        on ? "border-mint bg-mint text-s-card" : "border-s-line bg-s-card"
                      }`}
                      aria-hidden="true"
                    >
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-s-ink">{item.label}</span>
                        <WeightTag weight={item.weightCategory} />
                      </span>
                      {item.remediationText && item.remediationText !== item.label && <span className="mt-0.5 block leading-relaxed text-s-mute">{item.remediationText}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Loading({ variant = "cards" }) {
  const variants = {
    "osce-bank": <OsceBrowserSkeleton variant="tiles" label="Loading stations" />,
    "osce-section": <OsceBrowserSkeleton variant="cards" label="Loading stations" />,
    "module-detail": <DetailSkeleton label="Loading station" />,
    "single-player": <TwoColumnSkeleton label="Loading station" />,
    chat: <ChatSkeleton label="Loading the patient" />,
    assessment: <ChecklistSkeleton label="Loading checklist" />,
    results: <ResultsSkeleton label="Loading results" />,
    attempts: <ListSkeleton label="Loading attempts" />,
    admin: <FormSkeleton label="Loading" />,
    cards: <CardGridSkeleton cards={3} />,
  };
  return variants[variant] || variants.cards;
}

const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-s-line bg-s-card p-2.5 text-sm font-normal text-s-ink outline-none transition-colors placeholder:text-s-mute focus:border-s-accent";

function TextInput({ label, value, onChange, ...props }) {
  return (
    <label className="block text-sm font-medium text-s-ink">
      {label}
      <input className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

function aiStatusToForm(status = {}) {
  const groq = status.providers?.find((provider) => provider.id === "groq") || {};
  const openai = status.providers?.find((provider) => provider.id === "openai") || {};
  return {
    defaultProvider: status.defaultProvider || "groq",
    maxStudentMessageTokens: String(status.maxStudentMessageTokens || 160),
    groqApiKey: "",
    groqChatModel: groq.chatModel || "openai/gpt-oss-20b",
    groqEvalModel: groq.evalModel || "openai/gpt-oss-20b",
    groqSttModel: groq.sttModel || "whisper-large-v3-turbo",
    openaiApiKey: "",
    openaiChatModel: openai.chatModel || "gpt-5.6-luna",
    openaiEvalModel: openai.evalModel || "gpt-5.6-luna",
  };
}

function aiFormToPayload(form) {
  return {
    defaultProvider: form.defaultProvider,
    maxStudentMessageTokens: Number(form.maxStudentMessageTokens || 160),
    groqApiKey: form.groqApiKey,
    groqChatModel: form.groqChatModel,
    groqEvalModel: form.groqEvalModel,
    groqSttModel: form.groqSttModel,
    openaiApiKey: form.openaiApiKey,
    openaiChatModel: form.openaiChatModel,
    openaiEvalModel: form.openaiEvalModel,
  };
}

