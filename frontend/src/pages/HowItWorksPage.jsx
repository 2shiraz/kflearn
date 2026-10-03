import { Link } from "react-router-dom";
import { ArrowRight, Bot, CheckCircle2, Coins, Database, Mic, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import PageShell from "../components/PageShell";
import FAQ from "../components/FAQ";
import { AiPracticeLoop } from "../components/Illustrations";

const helps = [
  {
    who: "Students preparing for OSCEs",
    what: "Practise a full consultation any time, without needing a patient, an examiner or a classmate to role-play.",
  },
  {
    who: "Students who are unsure what to ask",
    what: "Hints come from the checklist after marking, so you learn which questions you skipped and why they matter.",
  },
  {
    who: "Candidates who want fast feedback",
    what: "Get a checklist breakdown within moments of finishing, instead of waiting for the next supervised session.",
  },
  {
    who: "Teachers and supervisors",
    what: "Use the same stations and marking criteria as a shared reference when you discuss performance with students.",
  },
];

const helpGradients = [
  { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  { "--g1": "#7FE3C4", "--g2": "#A8F0DA", "--glow": "rgba(127,227,196,0.35)" },
  { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
];

const exampleExchange = [
  { who: "Student", text: "Can you tell me more about the pain?" },
  { who: "Patient", text: "It's a tight pressure in the centre of my chest, and it comes on when I walk up the stairs." },
  { who: "Student", text: "Does it spread anywhere, and how long does it last?" },
  { who: "Patient", text: "It goes into my left arm sometimes. It lasts about ten minutes and eases when I rest." },
];

const loop = [
  {
    n: "01", title: "Pick a station",
    body: "Choose from 8 interactive OSCE stations across Respiratory, Gynaecology, Gastroenterology and Endocrinology. Each station has a patient scenario, a time limit and a candidate brief.",
    style: { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  },
  {
    n: "02", title: "Choose how to practise",
    body: "Guided self-practice is free: you work through the checklist and mark yourself. The AI virtual patient is a paid session in which the AI plays the patient and marks your performance.",
    style: { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  },
  {
    n: "03", title: "Interview the patient",
    body: "Type your questions, or speak them and check the transcript before sending. The patient answers in character and reveals only what you actually ask about.",
    style: { "--g1": "#C6A6FF", "--g2": "#E0CBFF", "--glow": "rgba(198,166,255,0.35)" },
  },
  {
    n: "04", title: "Get marked",
    body: "When you finish, the AI reviews your transcript against each checklist item and cites the evidence it found. You see what you covered, what you missed, and what to improve.",
    style: { "--g1": "#7FE3C4", "--g2": "#A8F0DA", "--glow": "rgba(127,227,196,0.35)" },
  },
];

const aiRoles = [
  {
    icon: Bot,
    title: "Virtual patient replies",
    ai: "A chat model plays the patient. It is given the patient's script facts and the recent conversation, and returns a reply plus the IDs of the facts it used.",
    guard: "If the AI call fails or returns malformed output, the app answers from the script with rule-based replies, so the session carries on.",
  },
  {
    icon: Mic,
    title: "Voice transcription",
    ai: "Spoken answers are converted to text by a speech-to-text model. You see the transcript and can correct it before it counts.",
    guard: "Typing is always available. Nothing is scored from a transcript you have not reviewed.",
  },
  {
    icon: Sparkles,
    title: "Checklist marking",
    ai: "After the session, an evaluation model scores each checklist item from your transcript only. For each item it must give a score, the evidence it relied on, and a rationale.",
    guard: "The reply must be valid JSON that matches every checklist item. If it is not, the app retries once. If marking still fails, no assessment is saved and the credits are refunded.",
  },
];

const notAi = [
  "Your percentage score. The app applies the item weights (critical 3, major 2, minor 1) to the scores itself.",
  "The station content, checklists and model answers. These are authored and go through a Draft, Approved, Published review before students see them.",
  "The guides, handouts and MCQs. These are standard content pages with no AI involved.",
];

const guardrails = [
  "The patient will not volunteer facts that you have not asked about.",
  "Each question is limited to a set length, and each session has a cap on questions and voice transcriptions.",
  "Each AI-marked item must cite evidence from your words. Vague blanket questions are not given full credit.",
  "AI-backed actions are rate-limited to 60 per account per hour, so one account cannot run up unlimited calls.",
];

const stack = [
  "React and Vite frontend, with routing and a responsive layout for phones and laptops",
  "Node.js and Express API with MongoDB for stations, attempts and credit records",
  "Groq and OpenAI APIs for the virtual patient, voice transcription and marking, with a configured default provider and automatic fallback to the other",
  "Session cookies, CSRF protection, input validation and rate limits on every API route",
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <section className="app-gradient-bg py-16">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-10">
          <span className="gradient-pill inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-ink">
            <Sparkles size={13} /> Transparent by design
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold text-ink">How KF LearnSmart works, and how AI is used</h1>
          <p className="mx-auto mt-4 max-w-2xl text-ink-soft">
            This page covers the full practice loop, exactly where AI is and is not involved, what
            it costs, and what happens to your answers. If something here is unclear, please ask
            before you rely on it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className="gradient-brand flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
              Start practising <ArrowRight size={16} />
            </Link>
            <Link to="/sample-stations" className="glass-surface rounded-lg px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand">
              Try a sample station
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">The practice loop</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          Each station follows the same four steps, whether you practise alone or with the AI.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loop.map((s) => (
            <div key={s.n} style={s.style} className="gradient-card rounded-lg p-6">
              <p className="font-mono text-xs text-ink-soft">{s.n}</p>
              <h3 className="mt-2 font-display text-base font-extrabold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">Where AI is used</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          There are three AI features. Each one has a fallback so a provider outage cannot leave
          you stuck mid-session.
        </p>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {aiRoles.map((r) => (
            <div key={r.title} className="glass-surface rounded-lg p-6">
              <span className="gradient-icon flex h-11 w-11 items-center justify-center rounded-lg text-ink">
                <r.icon size={18} />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-ink">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.ai}</p>
              <p className="mt-3 flex gap-2 text-sm leading-relaxed text-ink">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-good" />
                <span>{r.guard}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <div className="glass-surface rounded-lg p-6 sm:p-8">
          <h2 className="text-center font-display text-2xl font-extrabold text-ink">The AI path, from question to score</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink-soft">
            You stay in control at each step. Marking only runs when you end the session and ask for
            it, and you can review every transcript line before that.
          </p>
          <div className="mt-8 overflow-x-auto">
            <AiPracticeLoop className="mx-auto h-auto min-w-[760px] w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <h2 className="text-center font-display text-3xl font-extrabold text-ink">How AI helps you</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-ink-soft">
          The AI is there to make practice more frequent and more specific, not to replace your
          judgement or your supervisors.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {helps.map((h, i) => (
            <div key={h.who} style={helpGradients[i % helpGradients.length]} className="gradient-card rounded-lg p-6">
              <h3 className="font-display text-base font-extrabold text-ink">{h.who}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{h.what}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16 lg:px-10">
        <div className="glass-surface rounded-lg p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-extrabold text-ink">What a virtual patient exchange looks like</h2>
            <span className="rounded-lg bg-black/5 px-2.5 py-1 text-xs font-semibold text-ink-soft">Illustrative example</span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Station: chest pain on exertion. The patient reveals details only when asked.
          </p>
          <div className="mt-6 space-y-3">
            {exampleExchange.map((line) => (
              <div key={line.text} className={`flex ${line.who === "Student" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                    line.who === "Student" ? "gradient-brand text-white" : "bg-white text-ink ring-1 ring-line"
                  }`}
                >
                  <span className="mb-0.5 block text-[11px] font-bold uppercase opacity-80">{line.who}</span>
                  {line.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-relaxed text-ink-soft">
            When the session is marked, the AI would note the questions covering onset, site,
            radiation and exertional triggers as evidence for those checklist items. Items you did not
            ask about would stay unscored.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 lg:grid-cols-2 lg:px-10">
        <div className="glass-surface rounded-lg p-6">
          <h2 className="font-display text-xl font-extrabold text-ink">What AI does not do</h2>
          <ul className="mt-4 space-y-3">
            {notAi.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                <XCircle size={16} className="mt-0.5 shrink-0 text-ink-soft" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-surface rounded-lg p-6">
          <h2 className="font-display text-xl font-extrabold text-ink">Guardrails built into the AI</h2>
          <ul className="mt-4 space-y-3">
            {guardrails.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-good" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <div className="gradient-card rounded-lg p-8" style={{ "--g1": "#FFD84D", "--g2": "#7FB8FF", "--glow": "rgba(255,216,77,0.3)" }}>
          <div className="flex items-start gap-3">
            <Coins size={22} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">What it costs</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Most of KF LearnSmart is free once you sign in: sample stations, guided self-practice,
                the history and examination guides, handouts and MCQs. The AI features use credits. A
                virtual patient session and an AI marking run each cost a set number of credits, and
                credits are sold in packages. The exact costs and package prices are on the{" "}
                <Link to="/credits" className="font-semibold text-brand hover:underline">Credits page</Link>,
                and that page is the source of truth. If an AI step fails, its credits are refunded
                automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <div className="glass-surface rounded-lg p-8">
          <div className="flex items-start gap-3">
            <Database size={22} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">What happens to your answers</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                <li>Typed and transcribed answers are saved with your attempt so you can review your results later.</li>
                <li>Voice audio is sent to the speech-to-text provider to produce the transcript.</li>
                <li>Your transcript and the station checklist are sent to the AI provider to be processed for the virtual patient or marking.</li>
                <li>Provider API keys are kept on the server and are never sent to your browser.</li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Please avoid entering names or identifying details of real patients. Practice
                scenarios are fictional.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
        <div className="glass-surface rounded-lg p-8">
          <div className="flex items-start gap-3">
            <Sparkles size={22} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">The technology</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                {stack.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <FAQ />
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 text-center lg:px-10">
        <p className="text-sm leading-relaxed text-ink-soft">
          KF LearnSmart is a formative self-assessment tool. It is not an official examination
          platform, and AI feedback is not a clinical result or certification. Always follow your
          supervisors and institution's guidance.
        </p>
      </section>
    </PageShell>
  );
}
