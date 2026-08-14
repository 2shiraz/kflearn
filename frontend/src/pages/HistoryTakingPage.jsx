import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Stethoscope,
  Timer,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  aiAssessHistoryAttempt,
  createAdminHistoryContent,
  createHistoryAttempt,
  endHistoryAttempt,
  getAiStatus,
  getHistoryAttempt,
  getHistoryModule,
  getSinglePlayerContent,
  listAdminHistoryModules,
  listAdminUsers,
  listHistoryAttempts,
  listHistoryModules,
  publishAdminHistoryModule,
  selfAssessHistoryAttempt,
  sendPatientMessage,
  transcribeHistoryAudio,
  updateAiStatus,
} from "../lib/api";
import { getCurrentUser, logout } from "../lib/api";

function RequireUser({ children, active = "history", adminOnly = false }) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/signin";
    return null;
  }
  if (adminOnly && user.role !== "admin") {
    return (
      <div className="app-gradient-bg flex min-h-screen">
        <Sidebar active="admin" onLogout={() => { logout(); window.location.href = "/signin"; }} />
        <PageMain>
          <ErrorMessage message="Admin access is required." />
        </PageMain>
      </div>
    );
  }
  return (
    <div className="app-gradient-bg flex min-h-screen">
      <Sidebar active={active} onLogout={() => { logout(); window.location.href = "/signin"; }} />
      {children}
    </div>
  );
}

function PageMain({ children }) {
  return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 lg:px-8">{children}</main>;
}

function Panel({ children, className = "" }) {
  return <div className={`glass-surface rounded-lg p-5 ${className}`}>{children}</div>;
}

function PrimaryButton({ children, className = "", ...props }) {
  return <button className={`gradient-brand rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

function LinkButton({ children, to, className = "" }) {
  return <Link to={to} className={`gradient-brand inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${className}`}>{children}</Link>;
}

function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-base text-ink-soft">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.to && !isLast ? (
              <Link to={item.to} className="underline decoration-line underline-offset-2 hover:text-ink">{item.label}</Link>
            ) : (
              <span className={isLast ? "font-extrabold text-ink" : ""}>{item.label}</span>
            )}
            {!isLast && <span className="text-ink-soft/70">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

function sectionPath(name) {
  return `/history/section/${encodeURIComponent(name)}`;
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
    <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-extrabold ${urgent ? "border-rose-100 bg-rose-50 text-rose-700" : "border-line bg-white/90 text-ink"}`}>
      <Timer size={16} />
      {formatTime(remainingSeconds)}
    </span>
  );
}

function AiBadge({ children = "AI" }) {
  return (
    <span className="ai-chip inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white">
      <Sparkles size={13} />
      {children}
    </span>
  );
}

function modeLabel(mode) {
  if (mode === "single-player") return "Guided Self-Practice";
  if (mode === "virtual-patient") return "AI Virtual Patient";
  return mode;
}

const CHAT_CHAR_LIMIT = 640;

export function HistoryHome() {
  const [state, setState] = useState({ loading: true, modules: [], attempts: [], error: "" });

  useEffect(() => {
    Promise.all([listHistoryModules(), listHistoryAttempts()])
      .then(([modulesData, attemptsData]) => setState({ loading: false, modules: modulesData.modules || [], attempts: attemptsData || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);

  const groups = groupModulesBySpecialty(state.modules);

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank" }]} />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-soft">History Taking</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ink">History bank</h1>
            <p className="mt-2 max-w-2xl text-ink-soft">Choose a published history module, practise with instructions or a virtual patient, then assess your performance.</p>
          </div>
          <Link to="/history/attempts" className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink">
            <History size={16} /> Attempts
          </Link>
        </div>

        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {!state.loading && !state.error && (
          <>
            <div className="mb-4 text-sm text-ink-soft">{state.modules.length} history modules across {groups.length} {groups.length === 1 ? "section" : "sections"}.</div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <Link key={group.name} to={sectionPath(group.name)} className="gradient-card group rounded-lg p-5 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Section</p>
                      <h2 className="text-2xl font-extrabold text-ink">{group.name}</h2>
                    </div>
                    <span className="gradient-icon flex h-10 w-10 items-center justify-center rounded-lg text-ink"><Stethoscope size={18} /></span>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="gradient-pill rounded-lg px-3 py-1.5 text-xs font-semibold text-ink">{group.modules.length} stations</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">Open <ChevronRight size={15} className="transition group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function HistorySectionPage() {
  const { sectionName } = useParams();
  const [state, setState] = useState({ loading: true, modules: [], attempts: [], error: "" });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const decodedSectionName = decodeURIComponent(sectionName || "");

  useEffect(() => {
    Promise.all([listHistoryModules(), listHistoryAttempts()])
      .then(([modulesData, attemptsData]) => setState({ loading: false, modules: modulesData.modules || [], attempts: attemptsData || [], error: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);

  const groups = groupModulesBySpecialty(state.modules);
  const selectedGroup = groups.find((group) => group.name === decodedSectionName);
  const totalPages = selectedGroup ? Math.max(1, Math.ceil(selectedGroup.modules.length / pageSize)) : 1;
  const pagedModules = selectedGroup?.modules.slice((page - 1) * pageSize, page * pageSize) || [];

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: decodedSectionName || "Section" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {!state.loading && !state.error && !selectedGroup && <ErrorMessage message="History section not found." />}
        {!state.loading && !state.error && selectedGroup && (
          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Section</p>
                <h1 className="text-4xl font-extrabold text-ink">{selectedGroup.name}</h1>
                <p className="mt-2 text-ink-soft">Choose a station from this section.</p>
              </div>
              <span className="gradient-pill rounded-lg px-3 py-1.5 text-xs font-semibold text-ink">Page {page} of {totalPages}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedModules.map((module) => (
                <Link key={module.id} to={`/history/${module.slug}`} className="gradient-card rounded-lg p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <span className="gradient-icon flex h-10 w-10 items-center justify-center rounded-lg text-ink"><Stethoscope size={18} /></span>
                    <span className="gradient-pill rounded-lg px-2.5 py-1 text-xs font-semibold text-ink">{module.difficulty}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-ink">{module.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{module.shortDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-soft">
                    <span>{Math.round(module.timeLimitSeconds / 60)} min</span>
                    <span>{module.presentingComplaint}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"><ChevronLeft size={16} /> Previous</button>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">Next <ChevronRight size={16} /></button>
            </div>
          </section>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function HistoryModuleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, module: null, error: "", starting: "" });

  useEffect(() => {
    getHistoryModule(slug)
      .then((module) => setState({ loading: false, module, error: "", starting: "" }))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [slug]);

  async function start(mode) {
    setState((s) => ({ ...s, starting: mode }));
    const data = await createHistoryAttempt({ moduleId: state.module.id, mode });
    if (mode === "single-player") navigate(`/history/${slug}/single-player?attemptId=${data.attempt.id}`);
    else navigate(`/history/attempts/${data.attempt.id}/session`);
  }

  return (
    <RequireUser>
      <PageMain>
        {state.module ? (
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: state.module.specialty?.name || "Section", to: sectionPath(state.module.specialty?.name || "General") }, { label: state.module.title }]} />
        ) : (
          <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Station" }]} />
        )}
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.module && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel>
              <p className="text-sm font-semibold text-ink-soft">{state.module.specialty?.name} / {state.module.presentingComplaint}</p>
              <h1 className="mt-2 text-4xl font-extrabold text-ink">{state.module.title}</h1>
              <p className="mt-3 text-ink-soft">{state.module.shortDescription}</p>
              <CandidateInstructions module={state.module} />
            </Panel>
            <div className="space-y-4">
              <PracticeCard icon={FileText} title="Guided Self-Practice" body="Reveal the patient script and checklist for self-marked practice." onClick={() => start("single-player")} loading={state.starting === "single-player"} />
              <PracticeCard icon={Bot} title="AI Virtual Patient" body="Talk to the patient without seeing hidden facts or checklist answers." onClick={() => start("virtual-patient")} loading={state.starting === "virtual-patient"} ai />
            </div>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

function CandidateInstructions({ module }) {
  const instructions = module.candidateInstructions || {};
  const tasks = (instructions.tasks || []).filter((task) => !task.toLowerCase().includes("examiner may ask"));
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h2 className="text-lg font-bold text-ink">Candidate instructions</h2>
      <p className="mt-2 text-sm text-ink-soft">{instructions.context}</p>
      <p className="mt-2 text-sm text-ink-soft">{instructions.patientSummary}</p>
      <div className="mt-4 space-y-2">
        {tasks.map((task) => (
          <p key={task} className="text-sm font-bold text-ink">{task}</p>
        ))}
      </div>
    </div>
  );
}

function PracticeCard({ icon: Icon, title, body, onClick, loading, ai = false }) {
  return (
    <Panel className={ai ? "ai-panel" : ""}>
      <div className="flex items-start justify-between gap-3">
        <span className={ai ? "ai-icon flex h-10 w-10 items-center justify-center rounded-lg text-white" : "gradient-icon flex h-10 w-10 items-center justify-center rounded-lg text-ink"}><Icon size={18} /></span>
        {ai && <AiBadge>AI powered</AiBadge>}
      </div>
      <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
      <PrimaryButton onClick={onClick} disabled={loading} className={`mt-5 w-full ${ai ? "ai-button" : ""}`}>
        {loading ? "Starting..." : "Start"}
      </PrimaryButton>
    </Panel>
  );
}

export function SinglePlayerHistory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get("attemptId");
  const [state, setState] = useState({ loading: true, content: null, checked: [], notes: "", error: "" });
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
      await endHistoryAttempt(attemptId, { notes: state.notes, elapsedSeconds: timer.elapsedSeconds });
      await selfAssessHistoryAttempt(attemptId, state.checked);
      navigate(`/history/attempts/${attemptId}/results`);
    }
  }

  useEffect(() => {
    if (timer.isExpired && state.content) finish();
  }, [timer.isExpired, state.content]);

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Single player" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.content && (
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <Panel>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-3xl font-extrabold text-ink">{state.content.title}</h1>
                <TimerBadge remainingSeconds={timer.remainingSeconds} />
              </div>
              <CandidateInstructions module={state.content} />
              <h2 className="mt-6 text-lg font-bold text-ink">Patient script</h2>
              <div className="mt-3 grid gap-2">
                {state.content.patientScript.facts.map((fact) => (
                  <div key={fact.factId} className="rounded-lg border border-line bg-white/80 p-3 text-sm">
                    <span className="font-semibold text-ink">{fact.section}: {fact.label}</span>
                    <p className="mt-1 text-ink-soft">{fact.naturalResponse}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <Checklist checklist={state.content.checklist} checked={state.checked} onChange={(checked) => setState((s) => ({ ...s, checked }))} />
              <label className="mt-5 block">
                <span className="text-sm font-semibold text-ink">Notes</span>
                <textarea className="mt-2 min-h-28 w-full rounded-lg border border-line bg-white/80 p-3 text-sm outline-none focus:border-brand" value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))} />
              </label>
              <PrimaryButton onClick={finish} className="mt-4 w-full">End session &amp; score</PrimaryButton>
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
    getHistoryAttempt(attemptId)
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
          const data = await transcribeHistoryAudio(attemptId, blob);
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
    await endHistoryAttempt(attemptId, { elapsedSeconds: timer.elapsedSeconds });
    navigate(`/history/attempts/${attemptId}/self-assessment`);
  }

  useEffect(() => {
    if (timer.isExpired && state.attempt && state.module) endSession();
  }, [timer.isExpired, state.attempt, state.module]);

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Virtual patient" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.attempt && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Panel className="chat-shell flex h-[calc(100vh-170px)] min-h-[560px] flex-col overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-white/90 px-4 py-3 sm:px-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{state.module?.title}</h1>
                    <AiBadge>AI patient</AiBadge>
                  </div>
                  <p className="text-sm text-ink-soft">
                    AI virtual patient{state.voiceMode === "browser" ? " / browser dictation" : state.voiceMode === "groq" ? " / fallback recording" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <label className="glass-surface flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-ink">
                    <input type="checkbox" checked={state.speakPatient} onChange={(e) => setState((s) => ({ ...s, speakPatient: e.target.checked }))} />
                    Speak replies
                  </label>
                  <TimerBadge remainingSeconds={timer.remainingSeconds} />
                </div>
              </div>
              <div className="chat-thread flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-5">
                {state.attempt.messages.length === 0 ? (
                  <div className="m-auto max-w-md text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand shadow-sm"><Bot size={20} /></div>
                    <p className="text-sm font-semibold text-ink-soft">Patient opening</p>
                    <p className="mt-2 rounded-lg border border-line bg-white/95 p-4 text-base font-semibold text-ink shadow-sm">{state.module?.openingStatement}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.attempt.messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}>
                        <div className={`chat-bubble ${message.role === "student" ? "chat-bubble-user" : "chat-bubble-patient"}`}>
                          {message.role === "patient" && <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase text-brand"><Sparkles size={12} /> Patient</span>}
                          <p>{message.finalText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>
              {state.transcript && (
                <div className="mx-3 mb-3 rounded-lg border border-line bg-white/90 p-3 sm:mx-5">
                  <label className="text-xs font-semibold text-ink-soft">Transcript review</label>
                  <textarea className="mt-2 w-full rounded-lg border border-line p-2 text-sm" value={state.transcript} onChange={(e) => setState((s) => ({ ...s, transcript: e.target.value }))} />
                  <PrimaryButton onClick={() => send(state.transcript, "voice", state.transcript)} className="mt-2">Confirm transcript</PrimaryButton>
                </div>
              )}
              <div className="border-t border-line bg-white/90 p-3 sm:p-4">
                <div className="flex items-end gap-2 rounded-lg border border-line bg-white p-2 shadow-sm">
                  <div className="flex-1">
                    <input maxLength={CHAT_CHAR_LIMIT} className="min-h-10 w-full bg-transparent px-2 text-sm outline-none" value={state.text} onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Ask one focused question..." />
                    <p className={`px-2 text-[11px] font-semibold ${state.text.length > CHAT_CHAR_LIMIT - 80 ? "text-rose-600" : "text-ink-soft"}`}>
                      {state.text.length} / {CHAT_CHAR_LIMIT} characters
                    </p>
                  </div>
                  <button aria-label="Record voice question" onClick={toggleRecording} className={`flex h-10 w-10 items-center justify-center rounded-lg border border-line ${state.recording ? "bg-rose-50 text-rose-600" : "bg-white text-ink"}`}>{state.recording ? <Square size={17} /> : <Mic size={17} />}</button>
                  <PrimaryButton onClick={() => send()} disabled={state.sending || state.text.length > CHAT_CHAR_LIMIT} className="h-10 px-3">{state.sending ? "..." : <Send size={16} />}</PrimaryButton>
                </div>
              </div>
            </Panel>
            <Panel>
              <h2 className="text-lg font-bold text-ink">Candidate instructions</h2>
              <CandidateInstructions module={state.module} />
              <PrimaryButton onClick={endSession} className="mt-6 w-full">End Session</PrimaryButton>
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
  const [state, setState] = useState({ loading: true, attempt: null, checklist: null, checked: [], aiLoading: false, error: "" });

  useEffect(() => {
    getHistoryAttempt(attemptId)
      .then((data) => setState((s) => ({ ...s, loading: false, attempt: data.attempt, checklist: data.checklist })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [attemptId]);

  async function selfAssess() {
    await selfAssessHistoryAttempt(attemptId, state.checked);
    navigate(`/history/attempts/${attemptId}/results`);
  }

  async function aiAssess() {
    setState((s) => ({ ...s, aiLoading: true }));
    await aiAssessHistoryAttempt(attemptId);
    navigate(`/history/attempts/${attemptId}/results`);
  }

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Assessment" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.checklist && (
          <Panel className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-extrabold text-ink">Choose assessment</h1>
            <p className="mt-2 text-ink-soft">Mark your own checklist or ask the AI examiner to evaluate the transcript semantically.</p>
            <Checklist checklist={state.checklist} checked={state.checked} onChange={(checked) => setState((s) => ({ ...s, checked }))} />
            <div className="mt-5 flex flex-wrap gap-3">
              <PrimaryButton onClick={selfAssess}>Submit Self Assessment</PrimaryButton>
              <PrimaryButton onClick={aiAssess} disabled={state.aiLoading} className="ai-button inline-flex items-center gap-2"><Sparkles size={16} /> {state.aiLoading ? "Assessing..." : "AI Assessment"}</PrimaryButton>
            </div>
          </Panel>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function HistoryResultPage() {
  const { attemptId } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    getHistoryAttempt(attemptId)
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((err) => setState({ loading: false, data: null, error: err.message }));
  }, [attemptId]);
  const attempt = state.data?.attempt;

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Results" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {attempt && (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <Panel>
              <p className="text-sm font-semibold text-ink-soft">Final score</p>
              <p className="mt-2 text-5xl font-extrabold text-ink">{attempt.finalScore?.percentage ?? 0}%</p>
              <p className="mt-2 text-sm text-ink-soft">{attempt.finalScore?.rawScore ?? 0} / {attempt.finalScore?.maxRawScore ?? 0} raw marks</p>
              {attempt.aiAssessment?.provider && <p className="mt-2 text-xs font-semibold text-ink-soft">{attempt.aiAssessment.provider} / {attempt.aiAssessment.model}</p>}
              <LinkButton to="/history/attempts" className="mt-5 w-full">Attempt history</LinkButton>
            </Panel>
            <Panel>
              <h1 className="text-2xl font-extrabold text-ink">Feedback</h1>
              <p className="mt-2 text-ink-soft">{attempt.feedback?.summary || "No feedback yet."}</p>
              <h2 className="mt-5 font-bold text-ink">Missed items</h2>
              <ul className="mt-2 space-y-2 text-sm text-ink-soft">
                {(attempt.feedback?.missedItems || []).map((item) => <li key={item}>- {item}</li>)}
              </ul>
            </Panel>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

export function AttemptHistoryPage() {
  const [state, setState] = useState({ loading: true, attempts: [], error: "" });
  useEffect(() => {
    listHistoryAttempts()
      .then((attempts) => setState({ loading: false, attempts, error: "" }))
      .catch((err) => setState({ loading: false, attempts: [], error: err.message }));
  }, []);
  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Attempts" }]} />
        <h1 className="mb-5 text-3xl font-extrabold text-ink">Attempt history</h1>
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        <div className="space-y-3">
          {state.attempts.map((attempt) => (
            <Link key={attempt.id} to={`/history/attempts/${attempt.id}/results`} className="glass-surface block rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{attempt.module?.title}</p>
                  <p className="text-sm text-ink-soft">{modeLabel(attempt.mode)} / {attempt.status}</p>
                </div>
                <p className="text-xl font-extrabold text-ink">{attempt.finalScore?.percentage ?? "-"}%</p>
              </div>
            </Link>
          ))}
          {!state.loading && state.attempts.length === 0 && <Panel>No attempts yet.</Panel>}
        </div>
      </PageMain>
    </RequireUser>
  );
}

export function AdminHistoryPage() {
  const [state, setState] = useState({
    loading: true,
    saving: false,
    savingAi: false,
    activeTab: "content",
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
    Promise.all([listAdminHistoryModules(), getAiStatus(), listAdminUsers()])
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
      await createAdminHistoryContent(createAdminPayload(state.form));
      const modules = await listAdminHistoryModules();
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

  async function publish(id) {
    await publishAdminHistoryModule(id);
    const modules = await listAdminHistoryModules();
    setState((s) => ({ ...s, modules, message: "Published." }));
  }

  async function saveAiSettings(e) {
    e.preventDefault();
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
    { id: "content", label: "Content" },
    { id: "ai", label: "AI settings" },
    { id: "users", label: "Users" },
  ];

  return (
    <RequireUser active="admin" adminOnly>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Admin", to: "/admin/history" }, { label: "Console" }]} />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-soft">Admin</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ink">Admin console</h1>
            <p className="mt-2 max-w-2xl text-ink-soft">Manage content, AI inference settings, and user accounts from one place.</p>
          </div>
          <span className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink"><ShieldCheck size={16} /> Admin only</span>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setState((s) => ({ ...s, activeTab: tab.id }))} className={`rounded-lg px-4 py-2 text-sm font-bold ${state.activeTab === tab.id ? "gradient-brand text-white" : "glass-surface text-ink"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
        {!state.loading && state.activeTab === "content" && <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-ink">Add content</h2>
                <p className="mt-1 text-sm text-ink-soft">History stations are supported now. Other content types can fit this section later.</p>
              </div>
              <span className="gradient-pill rounded-lg px-3 py-1.5 text-xs font-bold text-ink">History station</span>
            </div>
            <form onSubmit={createDraft} className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput label="Main section" value={state.form.section} onChange={(value) => updateForm("section", value)} required />
                <TextInput label="Station title" value={state.form.title} onChange={(value) => updateForm("title", value)} required />
                <TextInput label="Slug" value={state.form.slug} onChange={(value) => updateForm("slug", slugify(value))} placeholder="auto-created if blank" />
                <TextInput label="Presenting complaint" value={state.form.presentingComplaint} onChange={(value) => updateForm("presentingComplaint", value)} required />
                <label className="block text-sm font-semibold text-ink">Difficulty
                  <select className="mt-1 w-full rounded-lg border border-line bg-white/90 p-2.5" value={state.form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value)}>
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
              <TextArea label="Patient facts" helper="One per line: Section | Label | Answer. Example: HPC | Duration | Three weeks." value={state.form.patientFacts} onChange={(value) => updateForm("patientFacts", value)} required rows={6} />
              <TextArea label="Checklist items" helper="One per line: Label | Description. Example: Opening | Introduces self and gains consent." value={state.form.checklistItems} onChange={(value) => updateForm("checklistItems", value)} required rows={6} />
              <PrimaryButton type="submit" disabled={state.saving} className="w-full">{state.saving ? "Saving draft..." : "Save draft"}</PrimaryButton>
            </form>
          </Panel>
          <Panel>
            <h2 className="text-xl font-extrabold text-ink">Drafts and modules</h2>
            <div className="mt-3 space-y-2">
              {state.modules.map((module) => (
                <div key={module.id} className="flex items-center justify-between rounded-lg border border-line bg-white/80 p-3">
                  <div><p className="font-semibold text-ink">{module.title}</p><p className="text-xs text-ink-soft">{module.slug}</p></div>
                  <PrimaryButton onClick={() => publish(module.id)} disabled={module.status === "published"}>{module.status === "published" ? "Published" : "Publish"}</PrimaryButton>
                </div>
              ))}
            </div>
          </Panel>
        </div>}
        {!state.loading && state.activeTab === "ai" && (
          <Panel className="ai-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <AiBadge>AI control</AiBadge>
                <h2 className="mt-3 text-2xl font-extrabold text-ink">Inference settings</h2>
                <p className="mt-1 max-w-2xl text-sm text-ink-soft">Controls the provider and models used by virtual patients and AI assessment. API keys are write-only.</p>
              </div>
              <div className="text-right text-xs font-semibold text-ink-soft">
                {(state.aiStatus?.providers || []).map((provider) => (
                  <p key={provider.id}>{provider.label}: {provider.configured ? provider.apiKeyPreview || "configured" : "not configured"}</p>
                ))}
              </div>
            </div>
            <form onSubmit={saveAiSettings} className="mt-6 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm font-semibold text-ink">Default provider
                  <select className="mt-1 w-full rounded-lg border border-line bg-white/90 p-2.5" value={state.aiForm.defaultProvider} onChange={(e) => updateAiForm("defaultProvider", e.target.value)}>
                    <option value="groq">Groq</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </label>
                <TextInput label="Per-message token limit" type="number" min="20" max="2000" value={state.aiForm.maxStudentMessageTokens} onChange={(value) => updateAiForm("maxStudentMessageTokens", value)} />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-lg border border-line bg-white/80 p-4">
                  <h3 className="font-extrabold text-ink">Groq</h3>
                  <div className="mt-3 space-y-3">
                    <TextInput label="Groq API key" type="password" value={state.aiForm.groqApiKey} onChange={(value) => updateAiForm("groqApiKey", value)} placeholder="Leave blank to keep existing" />
                    <TextInput label="Chat model" value={state.aiForm.groqChatModel} onChange={(value) => updateAiForm("groqChatModel", value)} />
                    <TextInput label="Assessment model" value={state.aiForm.groqEvalModel} onChange={(value) => updateAiForm("groqEvalModel", value)} />
                    <TextInput label="Speech-to-text model" value={state.aiForm.groqSttModel} onChange={(value) => updateAiForm("groqSttModel", value)} />
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-white/80 p-4">
                  <h3 className="font-extrabold text-ink">OpenAI</h3>
                  <div className="mt-3 space-y-3">
                    <TextInput label="OpenAI API key" type="password" value={state.aiForm.openaiApiKey} onChange={(value) => updateAiForm("openaiApiKey", value)} placeholder="Leave blank to keep existing" />
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
            <h2 className="text-2xl font-extrabold text-ink">Users</h2>
            <p className="mt-1 text-sm text-ink-soft">{state.users.length} registered accounts.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-ink-soft">
                  <tr>
                    <th className="border-b border-line py-3 pr-3">Name</th>
                    <th className="border-b border-line py-3 pr-3">Email</th>
                    <th className="border-b border-line py-3 pr-3">Role</th>
                    <th className="border-b border-line py-3 pr-3">Profile</th>
                    <th className="border-b border-line py-3 pr-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map((user) => (
                    <tr key={user.id}>
                      <td className="border-b border-line py-3 pr-3 font-semibold text-ink">{user.fullName}</td>
                      <td className="border-b border-line py-3 pr-3 text-ink-soft">{user.email}</td>
                      <td className="border-b border-line py-3 pr-3"><span className="gradient-pill rounded-lg px-2.5 py-1 text-xs font-bold text-ink">{user.role}</span></td>
                      <td className="border-b border-line py-3 pr-3 text-ink-soft">{user.roleLabel || user.profile?.programme || "-"}</td>
                      <td className="border-b border-line py-3 pr-3 text-ink-soft">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </PageMain>
    </RequireUser>
  );
}

function Checklist({ checklist, checked, onChange }) {
  const selected = new Set(checked);
  function toggle(itemId) {
    const next = new Set(selected);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    onChange([...next]);
  }
  return (
    <div className="mt-5 space-y-5">
      {checklist.sections.map((section) => (
        <div key={section.sectionId}>
          <h3 className="font-bold text-ink">{section.title}</h3>
          <div className="mt-2 space-y-2">
            {section.items.map((item) => (
              <label key={item.itemId} className="flex cursor-pointer gap-3 rounded-lg border border-line bg-white/80 p-3 text-sm">
                <input type="checkbox" checked={selected.has(item.itemId)} onChange={() => toggle(item.itemId)} />
                <span><span className="font-semibold text-ink">{item.label}</span><span className="block text-ink-soft">{item.remediationText}</span></span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="glass-surface rounded-lg p-5">
        <div className="h-4 w-32 rounded bg-slate-200/80" />
        <div className="mt-3 h-8 w-72 max-w-full rounded bg-slate-200/80" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-200/70" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="glass-surface rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-slate-200/80" />
              <div className="h-6 w-20 rounded bg-slate-200/70" />
            </div>
            <div className="mt-5 h-6 w-44 rounded bg-slate-200/80" />
            <div className="mt-3 h-4 w-full rounded bg-slate-200/70" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-200/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorMessage({ message }) {
  return <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{message}</div>;
}

function TextInput({ label, value, onChange, ...props }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input className="mt-1 w-full rounded-lg border border-line bg-white/90 p-2.5 outline-none focus:border-brand" value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

function TextArea({ label, helper, value, onChange, rows = 4, ...props }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      {helper && <span className="ml-2 text-xs font-medium text-ink-soft">{helper}</span>}
      <textarea className="mt-1 w-full rounded-lg border border-line bg-white/90 p-2.5 outline-none focus:border-brand" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
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
    const [sectionRaw, labelRaw, answerRaw] = line.split("|").map((part) => part?.trim());
    const section = sectionRaw || "OTHER";
    const label = labelRaw || `Fact ${index + 1}`;
    const answer = answerRaw || "";
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
    const [labelRaw, descriptionRaw] = line.split("|").map((part) => part?.trim());
    const label = labelRaw || `Checklist item ${index + 1}`;
    const description = descriptionRaw || label;
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
