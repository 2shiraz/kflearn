import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  Mic,
  Send,
  ShieldCheck,
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
  getHistoryAttempt,
  getHistoryModule,
  getSinglePlayerContent,
  listAdminHistoryModules,
  listHistoryAttempts,
  listHistoryModules,
  publishAdminHistoryModule,
  selfAssessHistoryAttempt,
  sendPatientMessage,
  transcribeHistoryAudio,
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
              <PracticeCard icon={FileText} title="Single Player" body="Reveal the patient script and checklist for self-practice." onClick={() => start("single-player")} loading={state.starting === "single-player"} />
              <PracticeCard icon={Bot} title="Virtual Patient" body="Talk to the patient without seeing hidden facts or checklist answers." onClick={() => start("virtual-patient")} loading={state.starting === "virtual-patient"} />
            </div>
          </div>
        )}
      </PageMain>
    </RequireUser>
  );
}

function CandidateInstructions({ module }) {
  const instructions = module.candidateInstructions || {};
  return (
    <div className="mt-6 border-t border-line pt-5">
      <h2 className="text-lg font-bold text-ink">Candidate instructions</h2>
      <p className="mt-2 text-sm text-ink-soft">{instructions.context}</p>
      <p className="mt-2 text-sm text-ink-soft">{instructions.patientSummary}</p>
      <ul className="mt-4 space-y-2">
        {(instructions.tasks || []).map((task) => (
          <li key={task} className="flex gap-2 text-sm text-ink-soft"><CheckCircle2 size={16} className="mt-0.5 text-good" /> {task}</li>
        ))}
      </ul>
    </div>
  );
}

function PracticeCard({ icon: Icon, title, body, onClick, loading }) {
  return (
    <Panel>
      <span className="gradient-icon flex h-10 w-10 items-center justify-center rounded-lg text-ink"><Icon size={18} /></span>
      <h3 className="mt-4 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
      <PrimaryButton onClick={onClick} disabled={loading} className="mt-5 w-full">
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

  useEffect(() => {
    getSinglePlayerContent(slug)
      .then((content) => setState((s) => ({ ...s, loading: false, content })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [slug]);

  async function finish() {
    if (attemptId) {
      await endHistoryAttempt(attemptId, { notes: state.notes });
      await selfAssessHistoryAttempt(attemptId, state.checked);
      navigate(`/history/attempts/${attemptId}/results`);
    }
  }

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Single player" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.content && (
          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <Panel>
              <h1 className="text-3xl font-extrabold text-ink">{state.content.title}</h1>
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
              <PrimaryButton onClick={finish} className="mt-4 w-full">Finish &amp; score</PrimaryButton>
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

  useEffect(() => {
    getHistoryAttempt(attemptId)
      .then((data) => setState((s) => ({ ...s, loading: false, attempt: data.attempt, module: data.module })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, [attemptId]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function speak(text) {
    if (!state.speakPatient || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function send(text = state.text, inputType = "typed", originalTranscript = "") {
    if (!text.trim()) return;
    setState((s) => ({ ...s, sending: true, text: "", transcript: "" }));
    try {
      const data = await sendPatientMessage(attemptId, { text, inputType, originalTranscript });
      setState((s) => ({ ...s, sending: false, attempt: data.attempt }));
      speak(data.patientMessage?.text);
    } catch (err) {
      setState((s) => ({ ...s, sending: false, error: err.message }));
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
    await endHistoryAttempt(attemptId);
    navigate(`/history/attempts/${attemptId}/self-assessment`);
  }

  return (
    <RequireUser>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "History bank", to: "/history" }, { label: "Virtual patient" }]} />
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.attempt && (
          <div className="grid min-h-[70vh] gap-5 xl:grid-cols-[1fr_340px]">
            <Panel className="flex flex-col">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-ink">{state.module?.title}</h1>
                  <p className="text-sm text-ink-soft">
                    Virtual patient mode{state.voiceMode === "browser" ? " / browser dictation" : state.voiceMode === "groq" ? " / Groq fallback recording" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <label className="glass-surface flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-ink">
                    <input type="checkbox" checked={state.speakPatient} onChange={(e) => setState((s) => ({ ...s, speakPatient: e.target.checked }))} />
                    Speak replies
                  </label>
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-soft"><Timer size={16} /> Active</span>
                </div>
              </div>
              <div className="flex min-h-[360px] flex-1 flex-col overflow-y-auto pr-1">
                {state.attempt.messages.length === 0 ? (
                  <div className="m-auto max-w-md text-center">
                    <p className="text-sm font-semibold text-ink-soft">Patient opening</p>
                    <p className="mt-2 rounded-lg border border-line bg-white/80 p-4 text-base font-semibold text-ink">{state.module?.openingStatement}</p>
                    <p className="mt-3 text-sm text-ink-soft">Ask your first history question below.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.attempt.messages.map((message) => (
                      <div key={message.id} className={`max-w-[80%] rounded-lg p-3 text-sm ${message.role === "student" ? "ml-auto bg-brand text-white" : "bg-white/90 text-ink"}`}>
                        {message.finalText}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {state.transcript && (
                <div className="mt-3 rounded-lg border border-line bg-white/80 p-3">
                  <label className="text-xs font-semibold text-ink-soft">Transcript review</label>
                  <textarea className="mt-2 w-full rounded-lg border border-line p-2 text-sm" value={state.transcript} onChange={(e) => setState((s) => ({ ...s, transcript: e.target.value }))} />
                  <PrimaryButton onClick={() => send(state.transcript, "voice", state.transcript)} className="mt-2">Confirm transcript</PrimaryButton>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <input className="flex-1 rounded-lg border border-line bg-white/90 px-3 py-2 text-sm outline-none focus:border-brand" value={state.text} onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Type your question..." />
                <button aria-label="Record voice question" onClick={toggleRecording} className={`rounded-lg border border-line px-3 ${state.recording ? "bg-rose-50 text-rose-600" : "bg-white/90 text-ink"}`}>{state.recording ? <Square size={17} /> : <Mic size={17} />}</button>
                <PrimaryButton onClick={() => send()} disabled={state.sending}>{state.sending ? "Sending..." : <Send size={16} />}</PrimaryButton>
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
              <PrimaryButton onClick={aiAssess} disabled={state.aiLoading}>{state.aiLoading ? "Assessing..." : "AI Assessment"}</PrimaryButton>
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
                  <p className="text-sm text-ink-soft">{attempt.mode} / {attempt.status}</p>
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
    modules: [],
    message: "",
    error: "",
    form: {
      section: "Respiratory",
      title: "",
      slug: "",
      presentingComplaint: "",
      shortDescription: "",
      difficulty: "beginner",
      timeLimitMinutes: "8",
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
    listAdminHistoryModules()
      .then((modules) => setState((s) => ({ ...s, loading: false, modules })))
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
  }, []);

  function updateForm(field, value) {
    setState((s) => ({ ...s, form: { ...s.form, [field]: value } }));
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

  return (
    <RequireUser active="admin" adminOnly>
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "Admin", to: "/admin/history" }, { label: "History content" }]} />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-soft">Admin</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ink">History content</h1>
            <p className="mt-2 max-w-2xl text-ink-soft">Add history stations as drafts, then publish when reviewed.</p>
          </div>
          <span className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-ink"><ShieldCheck size={16} /> Admin only</span>
        </div>
        {state.loading && <Loading />}
        {state.error && <ErrorMessage message={state.error} />}
        {state.message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{state.message}</p>}
        {!state.loading && <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
          <Panel>
            <h2 className="text-xl font-extrabold text-ink">Add history station</h2>
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
      timeLimitSeconds: Number(form.timeLimitMinutes || 8) * 60,
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
