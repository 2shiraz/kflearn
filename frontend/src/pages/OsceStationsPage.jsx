import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
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
  X,
} from "lucide-react";
import { Breadcrumbs, EmptyState, ErrorMessage, LinkButton, PageHeader, PageMain, Panel, PrimaryButton, RequireUser, SecondaryButton } from "../components/AppPage";
import { CardGridSkeleton, ChatSkeleton, ChecklistSkeleton, DetailSkeleton, FormSkeleton, ListSkeleton, ResultsSkeleton, TwoColumnSkeleton } from "../components/Skeleton";
import { ScoreRing, scoreTone } from "../components/StudyKit";
import { Character, HealthIcon, MedIcon, VoiceBars } from "../site/Illustrations";
import { TONES } from "../site/tones";
import { plus } from "../site/siteContent";
import {
  aiAssessOsceAttempt,
  createAdminOsceContent,
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

// Colour and Healthicon for an OSCE section, matched on the specialty name.
// Unknown specialties cycle through the palette so neighbours differ.
const SPECIALTY_LOOKS = [
  [/respir|pulmon|chest/i, { tone: "sky", icon: "lungs" }],
  [/cardi|heart/i, { tone: "coral", icon: "heart" }],
  [/gastr|abdom|hepat|liver/i, { tone: "mint", icon: "stomach" }],
  [/endocr|diabet|haemat|hemat|renal/i, { tone: "sun", icon: "bloodDrop" }],
  [/pharm|drug|prescri/i, { tone: "violet", icon: "medicines" }],
];
const FALLBACK_TONES = ["indigo", "violet", "mint", "sky", "sun", "coral"];
function specialtyLook(name = "", index = 0) {
  const match = SPECIALTY_LOOKS.find(([re]) => re.test(name));
  return match ? match[1] : { tone: FALLBACK_TONES[index % FALLBACK_TONES.length], icon: "stethoscope" };
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
  const [state, setState] = useState({ loading: true, modules: [], attempts: [], error: "" });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    Promise.all([listOsceStations(), listOsceAttempts()])
      .then(([modulesData, attemptsData]) => setState({ loading: false, modules: modulesData.modules || [], attempts: attemptsData || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = groupModulesBySpecialty(state.modules);

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations" }]} />
        <PageHeader
          title="OSCE Stations"
          description="Pick a section, choose a station, then practise with the brief or talk to the virtual patient."
          actions={
            <LinkButton to="/stations/attempts" variant="secondary">
              <History size={16} strokeWidth={2} aria-hidden="true" /> Attempts
            </LinkButton>
          }
        />

        {state.loading && <Loading variant="osce-bank" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {!state.loading && !state.error && groups.length === 0 && (
          <EmptyState character="examiner" tone="mint" title="No stations yet" body="Published OSCE stations will appear here." action={<LinkButton to="/dashboard" variant="secondary">Back to dashboard</LinkButton>} />
        )}
        {!state.loading && !state.error && groups.length > 0 && (
          <>
            <p className="mb-4 text-sm text-s-mute">
              {plus(state.modules.length)} stations across {groups.length} {groups.length === 1 ? "section" : "sections"}.
            </p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group, i) => {
                const look = specialtyLook(group.name, i);
                const t = TONES[look.tone];
                return (
                  <Link
                    key={group.name}
                    to={sectionPath(group.name)}
                    style={{ "--rise-delay": `${i * 50}ms` }}
                    className={`site-rise site-grid site-press group relative flex min-h-44 flex-col overflow-hidden rounded-3xl border border-s-line p-6 ${t.ring}`}
                  >
                    <div className="relative flex items-start justify-between gap-3">
                      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.soft} ${t.text}`} aria-hidden="true">
                        <MedIcon name={look.icon} size={32} />
                      </span>
                      <Chip>{group.modules.length} {group.modules.length === 1 ? "station" : "stations"}</Chip>
                    </div>
                    <h2 className="relative mt-5 flex-1 text-xl font-semibold tracking-tight text-s-ink">{group.name}</h2>
                    <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-s-ink">
                      Open section <ArrowRight size={15} strokeWidth={2} className={`${t.text} transition-transform group-hover:translate-x-0.5`} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function OsceSectionPage() {
  const { sectionName } = useParams();
  const [state, setState] = useState({ loading: true, modules: [], attempts: [], error: "" });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const decodedSectionName = decodeURIComponent(sectionName || "");

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    Promise.all([listOsceStations(), listOsceAttempts()])
      .then(([modulesData, attemptsData]) => setState({ loading: false, modules: modulesData.modules || [], attempts: attemptsData || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = groupModulesBySpecialty(state.modules);
  const groupIndex = groups.findIndex((group) => group.name === decodedSectionName);
  const selectedGroup = groups[groupIndex];
  const totalPages = selectedGroup ? Math.max(1, Math.ceil(selectedGroup.modules.length / pageSize)) : 1;
  const pagedModules = selectedGroup?.modules.slice((page - 1) * pageSize, page * pageSize) || [];
  const look = specialtyLook(decodedSectionName, Math.max(0, groupIndex));
  const t = TONES[look.tone];

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "OSCE Stations", to: "/stations" }, { label: decodedSectionName || "Section" }]} />
        {state.loading && <Loading variant="osce-section" />}
        {state.error && <ErrorMessage message={state.error} onRetry={load} />}
        {!state.loading && !state.error && !selectedGroup && (
          <EmptyState character="student-bilal" tone="sun" title="Section not found" body="This section may have been renamed. Pick one from the station bank." action={<LinkButton to="/stations">Station bank</LinkButton>} />
        )}
        {!state.loading && !state.error && selectedGroup && (
          <section>
            <div className="site-rise mb-8 flex flex-wrap items-center gap-4">
              <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl ${t.soft} ${t.text}`} aria-hidden="true">
                <MedIcon name={look.icon} size={38} />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{selectedGroup.name}</h1>
                <p className="mt-1 text-s-mute">Choose a station from this section.</p>
              </div>
              {totalPages > 1 && <Chip>Page {page} of {totalPages}</Chip>}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedModules.map((module, i) => (
                <Link
                  key={module.id}
                  to={`/stations/${module.slug}`}
                  style={{ "--rise-delay": `${i * 50}ms` }}
                  className={`site-rise site-grid site-press group flex flex-col rounded-3xl border border-s-line p-6 ${t.ring}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Character name={patientFor(module.title)} size={48} tone={look.tone} />
                    {module.difficulty && <Chip className="capitalize">{module.difficulty}</Chip>}
                  </div>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-s-ink">{module.title}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-s-mute">{module.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Chip><Clock3 size={12} strokeWidth={2} aria-hidden="true" /> {Math.round(module.timeLimitSeconds / 60)} min</Chip>
                    {module.presentingComplaint && <Chip>{module.presentingComplaint}</Chip>}
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <SecondaryButton disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} strokeWidth={2} aria-hidden="true" /> Previous</SecondaryButton>
                <SecondaryButton disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next <ChevronRight size={16} strokeWidth={2} aria-hidden="true" /></SecondaryButton>
              </div>
            )}
          </section>
        )}
      </PageMain>
    </RequireUser>
  );
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
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{module.title}</h1>
                </div>
              </div>
              <p className="mt-4 leading-relaxed text-s-mute">{module.shortDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
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
              <SelfPracticeCard onClick={() => start("single-player")} loading={state.starting === "single-player"} />
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
        {state.loading && <Loading variant="single-player" />}
        {state.error && <ErrorMessage message={state.error} onRetry={() => window.location.reload()} />}
        {state.content && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Panel className="site-rise">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-chart text-xs text-s-mute">Guided self-practice</p>
                  <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-s-ink sm:text-3xl">{state.content.title}</h1>
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
                  <h1 className="truncate font-medium text-s-ink sm:text-lg">{state.module?.title}</h1>
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
                <div className="flex items-center gap-2 rounded-full border border-s-line bg-s-card py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-s-accent">
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
              {!!(state.data.module?.learningNotes || state.data.module?.keyAnswerGuide || state.data.module?.examinerInstructions) && (
                <div className="mt-6 border-t border-s-line pt-5">
                  <h2 className="font-semibold text-s-ink">Station review</h2>
                  <StationReview module={state.data.module} />
                </div>
              )}
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
                    <p className="truncate font-medium text-s-ink">{attempt.module?.title || "Station"}</p>
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

export function AdminOscePage() {
  const [stationSearch, setStationSearch] = useState("");
  const [stationFilter, setStationFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    savingAi: false,
    activeTab: "overview",
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
    form: {
      section: "Respiratory",
      title: "",
      slug: "",
      presentingComplaint: "",
      shortDescription: "",
      difficulty: "beginner",
      timeLimitMinutes: "6",
      candidateContext: "",
      patientSummary: "",
      tasks: "",
      patientName: "",
      patientAge: "",
      patientOpening: "",
      patientFacts: "",
      checklistItems: "",
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

  function updateForm(field, value) {
    setState((s) => ({ ...s, form: { ...s.form, [field]: value } }));
  }

  function updateAiForm(field, value) {
    setState((s) => ({ ...s, aiForm: { ...s.aiForm, [field]: value } }));
  }

  async function createDraft(e) {
    e.preventDefault();
    setState((s) => ({ ...s, saving: true, error: "", message: "" }));
    try {
      await createAdminOsceContent(createAdminPayload(state.form));
      const modules = await listAdminOsceStations();
      setShowCreateForm(false);
      setStationFilter("draft");
      setStationSearch("");
      setState((s) => ({
        ...s,
        saving: false,
        modules,
        message: "Draft created.",
        form: {
          ...s.form,
          title: "",
          slug: "",
          presentingComplaint: "",
          shortDescription: "",
          candidateContext: "",
          patientSummary: "",
          tasks: "",
          patientName: "",
          patientAge: "",
          patientOpening: "",
          patientFacts: "",
          checklistItems: "",
        },
      }));
    } catch (err) {
      setState((s) => ({ ...s, saving: false, error: err.message }));
    }
  }

  async function changeStatus(id, status) {
    if (status === "archived" && !window.confirm("Archive this station? It will no longer appear to students.")) return;
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

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers3 },
    { id: "stations", label: "OSCE stations", icon: Stethoscope },
    { id: "ai", label: "AI & models", icon: Settings2 },
    { id: "users", label: "Accounts", icon: Users },
  ];
  const counts = Object.fromEntries(["draft", "approved", "published", "archived"].map((status) => [status, state.modules.filter((station) => station.status === status).length]));
  const visibleStations = state.modules.filter((station) =>
    (stationFilter === "all" || (stationFilter === "review" ? ["draft", "approved"].includes(station.status) : station.status === stationFilter)) &&
    `${station.title} ${station.slug} ${station.specialty?.name || ""}`.toLowerCase().includes(stationSearch.toLowerCase().trim()),
  );
  const visibleUsers = state.users.filter((user) =>
    `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase().trim()),
  );
  const defaultProvider = state.aiStatus?.providers?.find((provider) => provider.id === state.aiStatus.defaultProvider);

  return (
    <RequireUser active="admin" adminOnly>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Admin console" }]} />
        <PageHeader
          title="Admin console"
          description="Stations, AI configuration and accounts in one workspace."
        />
        <nav aria-label="Admin sections" className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" aria-current={state.activeTab === tab.id ? "page" : undefined} onClick={() => setState((s) => ({ ...s, activeTab: tab.id, error: "", message: "" }))} className={`site-press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium ${state.activeTab === tab.id ? "bg-s-accent text-s-on-accent" : "border border-s-line bg-s-card text-s-mute hover:border-s-accent/40 hover:text-s-ink"}`}>
              <tab.icon size={16} strokeWidth={2} aria-hidden="true" /> {tab.label}
            </button>
          ))}
        </nav>
        {state.loading && <Loading variant="admin" />}
        {state.error && <div className="mt-4"><ErrorMessage message={state.error} /></div>}
        {state.message && <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl bg-mint-soft p-3.5 text-sm text-s-good"><Check size={16} strokeWidth={2.5} aria-hidden="true" />{state.message}</p>}
        {!state.loading && state.activeTab === "overview" && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Published stations", value: counts.published, detail: "Visible to students", target: "stations", filter: "published" },
                { label: "Needs review", value: counts.draft + counts.approved, detail: "Draft or approved", target: "stations", filter: "review" },
                { label: "Accounts", value: state.users.length, detail: "Registered users", target: "users" },
                { label: "AI provider", value: defaultProvider?.label || "Not set", detail: defaultProvider?.configured ? "Key configured" : "Key missing", target: "ai" },
              ].map((card) => (
                <button key={card.label} type="button" onClick={() => { if (card.filter) setStationFilter(card.filter); setState((s) => ({ ...s, activeTab: card.target })); }} className="site-grid site-press rounded-3xl border border-s-line p-5 text-left hover:border-s-accent/40">
                  <span className="font-chart text-xs text-s-mute">{card.label}</span>
                  <span className="mt-3 block text-3xl font-semibold tracking-tight text-s-ink">{card.value}</span>
                  <span className="mt-1 block text-sm text-s-mute">{card.detail}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel>
                <h2 className="text-lg font-semibold tracking-tight text-s-ink">Station workflow</h2>
                <p className="mt-1 text-sm text-s-mute">Create a draft, review it, then make it visible to students.</p>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  {Object.entries(counts).map(([status, count]) => <div key={status} className="rounded-2xl bg-s-tint/60 p-3"><p className="text-xl font-semibold text-s-ink">{count}</p><p className="mt-1 text-xs capitalize text-s-mute">{status}</p></div>)}
                </div>
                <button type="button" onClick={() => setState((s) => ({ ...s, activeTab: "stations" }))} className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-s-accent hover:underline">Manage stations <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></button>
              </Panel>
              <Panel>
                <h2 className="text-lg font-semibold tracking-tight text-s-ink">Configuration</h2>
                <p className="mt-1 text-sm text-s-mute">Virtual patient, assessment, and speech-to-text models are configured under AI &amp; models.</p>
                {!defaultProvider?.configured && <p className="mt-4 flex items-start gap-2 rounded-2xl bg-sun-soft p-3.5 text-sm text-s-ink"><AlertTriangle size={17} strokeWidth={2} className="shrink-0 text-sun" aria-hidden="true" /> The default provider has no configured key. AI sessions may be unavailable.</p>}
                <p className="mt-4 text-sm text-s-mute">AI credit prices and usage caps are server configuration. Grants remain CLI-only and are recorded in the AI credit ledger.</p>
                <button type="button" onClick={() => setState((s) => ({ ...s, activeTab: "ai" }))} className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-s-accent hover:underline">Review AI settings <ArrowRight size={15} strokeWidth={2} aria-hidden="true" /></button>
              </Panel>
            </div>
          </div>
        )}
        {!state.loading && state.activeTab === "stations" && <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-2xl font-semibold tracking-tight text-s-ink">OSCE stations</h2><p className="text-sm text-s-mute">Search, review, publish, or archive station content.</p></div>
            <PrimaryButton type="button" onClick={() => setShowCreateForm((open) => !open)}><Plus size={16} strokeWidth={2} aria-hidden="true" /> {showCreateForm ? "Close editor" : "New station"}</PrimaryButton>
          </div>
          <Panel>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <label className="relative"><span className="sr-only">Search stations</span><Search size={17} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" /><input value={stationSearch} onChange={(e) => setStationSearch(e.target.value)} placeholder="Search title, slug, or specialty" className="w-full min-h-11 rounded-xl border border-s-line bg-s-card py-2.5 pl-10 pr-3 text-sm text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent" /></label>
              <label><span className="sr-only">Filter by status</span><select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)} className="w-full min-h-11 rounded-xl border border-s-line bg-s-card p-2.5 text-sm text-s-ink outline-none focus:border-s-accent"><option value="all">All statuses</option><option value="review">Needs review</option>{Object.keys(counts).map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
            </div>
            <div className="mt-4 divide-y divide-s-line">
              {visibleStations.map((station) => (
                <div key={station.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1"><p className="font-semibold text-s-ink">{station.title}</p><p className="break-all text-xs text-s-mute">{station.specialty?.name || "General"} / {station.slug}</p></div>
                  <span className={`rounded-full px-2.5 py-1 font-chart text-xs capitalize ${STATUS_STYLES[station.status] || "bg-s-tint text-s-mute"}`}>{station.status}</span>
                  <label className="sr-only" htmlFor={`station-status-${station.id}`}>Change status for {station.title}</label>
                  <select id={`station-status-${station.id}`} aria-label={`Change status for ${station.title}`} value={station.status} disabled={statusBusyId === station.id} onChange={(e) => changeStatus(station.id, e.target.value)} className="min-h-11 rounded-xl border border-s-line bg-s-card px-3 text-sm text-s-ink outline-none focus:border-s-accent disabled:opacity-50">
                    {Object.keys(counts).map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                  </select>
                </div>
              ))}
              {visibleStations.length === 0 && <p className="py-5 text-center text-sm text-s-mute">No stations match this search.</p>}
            </div>
          </Panel>
          {showCreateForm && <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-s-ink">Create station draft</h2>
                <p className="mt-1 text-sm text-s-mute">Drafts are hidden from students until published. Review the patient facts and checklist before publishing.</p>
              </div>
              <span className="rounded-full bg-s-accent-soft px-3 py-1.5 font-chart text-xs text-s-accent-strong">OSCE station</span>
            </div>
            <form onSubmit={createDraft} className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Main section" value={state.form.section} onChange={(value) => updateForm("section", value)} required />
                <TextInput label="Station title" value={state.form.title} onChange={(value) => updateForm("title", value)} required />
                <TextInput label="Slug" value={state.form.slug} onChange={(value) => updateForm("slug", slugify(value))} placeholder="auto-created if blank" />
                <TextInput label="Presenting complaint" value={state.form.presentingComplaint} onChange={(value) => updateForm("presentingComplaint", value)} required />
                <label className="block text-sm font-medium text-s-ink">Difficulty
                  <select className="mt-2 min-h-11 w-full rounded-xl border border-s-line bg-s-card p-2.5 text-sm font-normal text-s-ink outline-none focus:border-s-accent" value={state.form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
                <TextInput label="Time limit minutes" type="number" min="1" value={state.form.timeLimitMinutes} onChange={(value) => updateForm("timeLimitMinutes", value)} required />
              </div>
              <TextArea label="Short description" value={state.form.shortDescription} onChange={(value) => updateForm("shortDescription", value)} required rows={2} />
              <div className="grid gap-3 md:grid-cols-2">
                <TextArea label="Candidate context" value={state.form.candidateContext} onChange={(value) => updateForm("candidateContext", value)} required rows={3} />
                <TextArea label="Patient summary" value={state.form.patientSummary} onChange={(value) => updateForm("patientSummary", value)} required rows={3} />
              </div>
              <TextArea label="Candidate tasks" helper="One task per line." value={state.form.tasks} onChange={(value) => updateForm("tasks", value)} required rows={4} />
              <div className="grid gap-3 md:grid-cols-3">
                <TextInput label="Patient name" value={state.form.patientName} onChange={(value) => updateForm("patientName", value)} required />
                <TextInput label="Patient age" type="number" min="0" value={state.form.patientAge} onChange={(value) => updateForm("patientAge", value)} required />
                <TextInput label="Patient opening line" value={state.form.patientOpening} onChange={(value) => updateForm("patientOpening", value)} required />
              </div>
              <TextArea label="Patient facts" helper="One per line: Section | Label | Answer. Example: HPC | Duration | Three weeks. Sections: PC, HPC, PMH, DH, FH, SH, ROS, ICE, RED_FLAG, OTHER." value={state.form.patientFacts} onChange={(value) => updateForm("patientFacts", value)} required rows={6} />
              <TextArea label="Checklist items" helper="One per line: Label | Description. Example: Opening | Introduces self and gains consent." value={state.form.checklistItems} onChange={(value) => updateForm("checklistItems", value)} required rows={6} />
              <PrimaryButton type="submit" disabled={state.saving} className="w-full">{state.saving ? "Saving draft..." : "Save draft"}</PrimaryButton>
            </form>
          </Panel>}
        </div>}
        {!state.loading && state.activeTab === "ai" && (
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
        {!state.loading && state.activeTab === "users" && (
          <Panel>
            <h2 className="text-2xl font-semibold tracking-tight text-s-ink">Accounts</h2>
            <p className="mt-1 text-sm text-s-mute">{state.users.length} registered accounts. Account roles and AI credit balances are read-only here; grants use the audited CLI.</p>
            <label className="relative mt-5 block max-w-md"><span className="sr-only">Search accounts</span><Search size={17} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-s-mute" aria-hidden="true" /><input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name, email, or role" className="w-full min-h-11 rounded-xl border border-s-line bg-s-card py-2.5 pl-10 pr-3 text-sm text-s-ink outline-none placeholder:text-s-mute focus:border-s-accent" /></label>
            {/* Phones: one card per user — a 5-column table has no room to breathe below sm. */}
            <div className="mt-5 space-y-2 sm:hidden">
              {visibleUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-s-line bg-s-card p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-s-ink">{user.fullName}</p>
                    <span className="shrink-0 rounded-full bg-s-accent-soft px-2.5 py-1 font-chart text-xs text-s-accent-strong">{user.role}</span>
                  </div>
                  <p className="mt-1 break-all text-s-mute">{user.email}</p>
                  <p className="mt-1 text-s-mute">{user.roleLabel || user.profile?.programme || "-"} / {user.creditBalance} AI credits / Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-s-mute">
                  <tr>
                    <th className="border-b border-s-line py-3 pr-3">Name</th>
                    <th className="border-b border-s-line py-3 pr-3">Email</th>
                    <th className="border-b border-s-line py-3 pr-3">Role</th>
                    <th className="border-b border-s-line py-3 pr-3">Profile</th>
                    <th className="border-b border-s-line py-3 pr-3">AI Credits</th>
                    <th className="border-b border-s-line py-3 pr-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="border-b border-s-line py-3 pr-3 font-semibold text-s-ink">{user.fullName}</td>
                      <td className="border-b border-s-line py-3 pr-3 text-s-mute">{user.email}</td>
                      <td className="border-b border-s-line py-3 pr-3"><span className="rounded-full bg-s-accent-soft px-2.5 py-1 font-chart text-xs text-s-accent-strong">{user.role}</span></td>
                      <td className="border-b border-s-line py-3 pr-3 text-s-mute">{user.roleLabel || user.profile?.programme || "-"}</td>
                      <td className="border-b border-s-line py-3 pr-3 font-semibold text-s-ink">{user.creditBalance}</td>
                      <td className="border-b border-s-line py-3 pr-3 text-s-mute">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleUsers.length === 0 && <p className="py-5 text-center text-sm text-s-mute">No accounts match this search.</p>}
          </Panel>
        )}
      </PageMain>
    </RequireUser>
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

function StationReview({ module }) {
  const guidanceStart = module.facultyNote?.indexOf("Local protocols supersede imported guidance.") ?? -1;
  const practiceGuidance = guidanceStart >= 0 ? module.facultyNote.slice(guidanceStart) : module.facultyNote;
  return (
    <div className="mt-5 space-y-4 text-sm leading-relaxed text-s-mute">
      {!!module.learningNotes && <p className="whitespace-pre-line rounded-2xl border border-s-line bg-s-card p-4"><strong>Review notes:</strong> {module.learningNotes}</p>}
      {!!module.keyAnswerGuide && <p className="whitespace-pre-line"><strong>Answer guide:</strong> {module.keyAnswerGuide}</p>}
      {!!module.examinerInstructions && <p className="whitespace-pre-line"><strong>Examiner guidance:</strong> {module.examinerInstructions}</p>}
      {!!module.suggestedCandidateApproach?.length && <p><strong>Suggested approach:</strong> {module.suggestedCandidateApproach.join(" → ")}</p>}
      {!!module.vivaQuestions?.length && <div><strong>Prompt questions:</strong><ul className="mt-2 list-disc pl-5">{module.vivaQuestions.map(prompt => <li key={prompt.question}>{prompt.question}</li>)}</ul></div>}
      {!!module.expectedCompetencies?.length && <p><strong>Expected competencies:</strong> {module.expectedCompetencies.join(", ")}</p>}
      {!!module.criticalSafetyErrors?.length && <div className="text-coral"><strong>Critical safety errors:</strong><ul className="mt-2 list-disc pl-5">{module.criticalSafetyErrors.map(error => <li key={error}>{error}</li>)}</ul></div>}
      {!!module.assessmentDesign?.length && <p><strong>Assessment rules:</strong> {module.assessmentDesign.join(" ")}</p>}
      {!!practiceGuidance && <p><strong>Practice guidance:</strong> {practiceGuidance}</p>}
      {!!module.globalRatingOptions?.length && <p><strong>Global ratings:</strong> {module.globalRatingOptions.join(" · ")}</p>}
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
                <li key={item.itemId} className="flex items-start gap-3.5 px-4 py-3.5">
                  <select
                    aria-label={`Score: ${item.label}`}
                    className="shrink-0 rounded-lg border border-s-line bg-s-card p-2 text-sm text-s-ink"
                    value={scores[item.itemId] ?? 0}
                    onChange={(event) => onScoreChange(item.itemId, Number(event.target.value))}
                  >
                    {Array.from({ length: item.maxRawScore + 1 }, (_, score) => (
                      <option key={score} value={score}>
                        {score}/{item.maxRawScore} · {score === 0 ? "Omitted" : score === item.maxRawScore ? "Complete" : "Partial"}
                      </option>
                    ))}
                  </select>
                  <span className="min-w-0 flex-1 text-sm leading-relaxed text-s-ink">{item.label}</span>
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
    "osce-bank": <CardGridSkeleton cards={6} label="Loading stations" />,
    "osce-section": <CardGridSkeleton cards={6} withHeader label="Loading stations" />,
    "module-detail": <DetailSkeleton label="Loading station" />,
    "single-player": <TwoColumnSkeleton leftRows={8} rightRows={7} label="Loading station" />,
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

function TextArea({ label, helper, value, onChange, rows = 4, ...props }) {
  return (
    <label className="block text-sm font-medium text-s-ink">
      {label}
      {helper && <span className="mt-0.5 block text-xs font-normal leading-relaxed text-s-mute">{helper}</span>}
      <textarea className={fieldClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitLines(value) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function parsePatientFacts(value, slug) {
  return splitLines(value).map((line, index) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length !== 3 || parts.some((part) => !part)) throw new Error(`Patient fact line ${index + 1} must be: Section | Label | Answer.`);
    const [section, label, answer] = parts;
    if (!["PC", "HPC", "PMH", "DH", "FH", "SH", "ROS", "ICE", "RED_FLAG", "OTHER"].includes(section)) {
      throw new Error(`Patient fact line ${index + 1} has an invalid section. Use PC, HPC, PMH, DH, FH, SH, ROS, ICE, RED_FLAG, or OTHER.`);
    }
    const conceptId = slugify(label) || `fact_${index + 1}`;
    return {
      factId: `${slug}_${conceptId}_${index + 1}`,
      section,
      conceptId,
      label,
      value: answer,
      naturalResponse: answer,
      revealPolicy: "IF_RELEVANT_QUESTION",
      triggerConcepts: [conceptId],
      synonyms: [label],
      relatedChecklistItemIds: [],
    };
  });
}

function parseChecklistItems(value, slug) {
  return splitLines(value).map((line, index) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length !== 2 || parts.some((part) => !part)) throw new Error(`Checklist line ${index + 1} must be: Label | Description.`);
    const [label, description] = parts;
    const itemId = `${slug}_${slugify(label) || `item_${index + 1}`}_${index + 1}`;
    return {
      itemId,
      label,
      description,
      category: "history",
      expectedConcepts: [slugify(label) || itemId],
      relatedFactIds: [],
      weightCategory: "major",
      maxRawScore: 1,
      allowPartial: true,
      criticalSafetyItem: false,
      remediationText: description,
      order: index + 1,
    };
  });
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

function createAdminPayload(form) {
  const slug = form.slug || slugify(form.title);
  const sectionSlug = slugify(form.section);
  const tasks = splitLines(form.tasks);
  const facts = parsePatientFacts(form.patientFacts, slug);
  const checklistItems = parseChecklistItems(form.checklistItems, slug);
  return {
    specialtySlug: sectionSlug,
    specialtyName: form.section,
    module: {
      title: form.title,
      slug,
      presentingComplaint: form.presentingComplaint,
      systemOrTopic: form.section,
      taskTags: ["history", sectionSlug],
      difficulty: form.difficulty,
      shortDescription: form.shortDescription,
      candidateInstructions: {
        context: form.candidateContext,
        patientSummary: form.patientSummary,
        tasks,
        examinationRequired: false,
        additionalInstructions: [],
      },
      timeLimitSeconds: Number(form.timeLimitMinutes || 6) * 60,
    },
    patientScript: {
      name: `${form.patientName} - ${form.title}`,
      slug: `${slug}-patient`,
      openingStatement: form.patientOpening,
      patientIdentity: { name: form.patientName, age: Number(form.patientAge), sex: "", occupation: "", pronouns: "" },
      facts: [
        {
          factId: `${slug}_opening`,
          section: "PC",
          conceptId: "opening_statement",
          label: "Opening Statement",
          value: form.patientOpening,
          naturalResponse: form.patientOpening,
          revealPolicy: "OPENING",
          triggerConcepts: ["opening_statement"],
          synonyms: ["opening statement"],
          relatedChecklistItemIds: [],
        },
        ...facts,
      ],
      status: "draft",
    },
    checklist: {
      title: `${form.title} Checklist`,
      slug: `${slug}-checklist`,
      sourceScoring: { maxRawScore: checklistItems.length, description: "Admin-entered checklist" },
      sections: [{ sectionId: "history_checklist", title: "History checklist", items: checklistItems }],
      status: "draft",
    },
  };
}
