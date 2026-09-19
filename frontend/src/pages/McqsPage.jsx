import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronRight, FileQuestion, GraduationCap, Layers, PlayCircle, RotateCcw, Shuffle, XCircle } from "lucide-react";
import { Breadcrumbs, ErrorMessage, LinkButton, PageMain, Panel, PrimaryButton, RequireUser } from "../components/AppPage";
import { getBlock, getYear, loadQuestions, mcqTotalCount, mcqYears } from "../data/mcqs/catalog";

// ---- local progress (per browser; practice only, not a graded record) ----
const PROGRESS_KEY = "kf_mcq_progress";

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAnswer(questionId, correct) {
  const progress = readProgress();
  progress[questionId] = correct ? 1 : 0;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // storage full or blocked: practice still works, progress just isn't kept
  }
}

// Question ids look like "y1-q37"; count answered/correct for one year's id range.
function progressFor(progress, yearNumber, fromIndex, count) {
  let answered = 0;
  let correct = 0;
  for (let n = fromIndex + 1; n <= fromIndex + count; n += 1) {
    const value = progress[`y${yearNumber}-q${n}`];
    if (value !== undefined) {
      answered += 1;
      correct += value;
    }
  }
  return { answered, correct };
}

function ProgressBar({ answered, total }) {
  const pct = total ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
        <div className="gradient-brand h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-soft">{answered} of {total} attempted</p>
    </div>
  );
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Card colour palettes — same --g1/--g2/--glow variables the dashboard and
// station-bank cards use with .gradient-card / .gradient-icon.
const PALETTES = [
  { "--g1": "#FF8FCF", "--g2": "#FFB3E0", "--glow": "rgba(255,143,207,0.35)" },
  { "--g1": "#7FB8FF", "--g2": "#A6D0FF", "--glow": "rgba(127,184,255,0.35)" },
  { "--g1": "#FFD84D", "--g2": "#FFE38A", "--glow": "rgba(255,216,77,0.35)" },
  { "--g1": "#C6A6FF", "--g2": "#DCC8FF", "--glow": "rgba(198,166,255,0.35)" },
  { "--g1": "#7FE0C0", "--g2": "#B0F0DA", "--glow": "rgba(127,224,192,0.35)" },
];
const palette = (i) => PALETTES[i % PALETTES.length];
const stagger = (i) => ({ animationDelay: `${80 + i * 60}ms` });

function CountPill({ children }) {
  return <span className="gradient-pill rounded-lg px-3 py-1.5 text-xs font-semibold text-ink">{children}</span>;
}

// ---- /mcqs ----
export function McqsHome() {
  const progress = readProgress();
  return (
    <RequireUser active="mcqs">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "MCQs" }]} />
        <div className="mb-6 animate-fade-up">
          <p className="text-sm font-semibold text-ink-soft">MCQs</p>
          <h1 className="mt-1 text-4xl font-extrabold text-ink">Question bank</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            {mcqTotalCount.toLocaleString()} single-best-answer questions with explanations. Choose your year to begin.
          </p>
        </div>
        <p className="mb-3 text-sm text-ink-soft">{mcqYears.length} years available.</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mcqYears.map((year, i) => {
            const p = progressFor(progress, year.year, 0, year.count);
            return (
              <Link
                key={year.slug}
                to={`/mcqs/${year.slug}`}
                style={{ ...palette(i), ...stagger(i) }}
                className="gradient-card group flex animate-fade-up flex-col rounded-lg p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Year</p>
                    <h2 className="text-2xl font-extrabold text-ink">{year.name}</h2>
                  </div>
                  <span className="gradient-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <GraduationCap size={18} />
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{year.blocks.map((b) => b.name).join(" · ")}</p>
                <ProgressBar answered={p.answered} total={year.count} />
                <div className="mt-4 flex items-center justify-between">
                  <CountPill>{year.count.toLocaleString()} MCQs</CountPill>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                    Open <ChevronRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </PageMain>
    </RequireUser>
  );
}

// ---- /mcqs/:yearSlug ----
export function McqYearPage() {
  const { yearSlug } = useParams();
  const year = getYear(yearSlug);
  const progress = readProgress();

  if (!year) {
    return (
      <RequireUser active="mcqs">
        <PageMain><ErrorMessage message="This year was not found." /></PageMain>
      </RequireUser>
    );
  }

  let offset = 0;
  return (
    <RequireUser active="mcqs">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "MCQs", to: "/mcqs" }, { label: year.name }]} />
        <div className="mb-6 flex animate-fade-up flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-soft">MCQs</p>
            <h1 className="mt-1 text-4xl font-extrabold text-ink">{year.name}</h1>
            <p className="mt-2 text-ink-soft">Read a topic with answers and explanations, or practise it and check yourself.</p>
          </div>
          <LinkButton to={`/mcqs/${year.slug}/practice`}>
            <Shuffle className="mr-2 h-4 w-4" /> Mixed practice
          </LinkButton>
        </div>

        <div className="space-y-8">
          {year.blocks.map((block, blockIndex) => {
            const blockStart = offset;
            const bp = progressFor(progress, year.year, blockStart, block.count);
            let topicOffset = blockStart;
            offset += block.count;
            return (
              <section key={block.slug} className="animate-fade-up" style={stagger(blockIndex)}>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      style={palette(blockIndex)}
                      className="gradient-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink"
                    >
                      <Layers size={19} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Section</p>
                      <h2 className="text-2xl font-extrabold text-ink">{block.name}</h2>
                      <p className="text-sm text-ink-soft">
                        {block.count} MCQs · {block.topics.length} topics
                        {bp.answered ? ` · ${Math.round((bp.correct / bp.answered) * 100)}% correct so far` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/mcqs/${year.slug}/read?block=${block.slug}`}
                      className="glass-surface inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                    >
                      <BookOpen size={16} /> Read section
                    </Link>
                    <Link
                      to={`/mcqs/${year.slug}/practice?block=${block.slug}`}
                      className="glass-surface inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
                    >
                      <PlayCircle size={16} /> Practise section
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {block.topics.map((topic, topicIndex) => {
                    const tp = progressFor(progress, year.year, topicOffset, topic.count);
                    topicOffset += topic.count;
                    const query = `block=${block.slug}&topic=${topic.slug}`;
                    const done = tp.answered === topic.count;
                    return (
                      <div
                        key={topic.slug}
                        style={{ ...palette(blockIndex + topicIndex), ...stagger(topicIndex) }}
                        className="gradient-card group flex animate-fade-up flex-col rounded-lg p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Topic</p>
                            <h3 className="text-lg font-extrabold leading-snug text-ink">{topic.name}</h3>
                          </div>
                          <span className="gradient-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                            {done ? <CheckCircle2 size={18} /> : <FileQuestion size={18} />}
                          </span>
                        </div>
                        <ProgressBar answered={tp.answered} total={topic.count} />
                        <div className="mt-4 flex items-center justify-between gap-2 pt-1 md:mt-auto">
                          <CountPill>{topic.count} MCQs</CountPill>
                          <div className="flex gap-2">
                            <Link
                              to={`/mcqs/${year.slug}/read?${query}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/80 px-3 py-1.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
                            >
                              <BookOpen size={14} /> Read
                            </Link>
                            <Link
                              to={`/mcqs/${year.slug}/practice?${query}`}
                              className="gradient-brand inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                            >
                              <PlayCircle size={14} /> Practise
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </PageMain>
    </RequireUser>
  );
}

// ---- /mcqs/:yearSlug/practice?block=&topic= ----
const COUNT_OPTIONS = [10, 20, 40, 0]; // 0 = all

export function McqPractice() {
  const { yearSlug } = useParams();
  const [params] = useSearchParams();
  const blockSlug = params.get("block") || "";
  const topicSlug = params.get("topic") || "";
  const year = getYear(yearSlug);
  const block = blockSlug ? getBlock(yearSlug, blockSlug) : null;
  const topic = block?.topics.find((t) => t.slug === topicSlug) || null;

  const [pool, setPool] = useState(null);
  const [error, setError] = useState("");
  const [config, setConfig] = useState({ count: 20, random: true });
  const [session, setSession] = useState(null); // { questions, index, answers: {id: optionIndex}, revealed }

  useEffect(() => {
    let active = true;
    setPool(null);
    setSession(null);
    loadQuestions(yearSlug, blockSlug, topicSlug)
      .then((qs) => {
        if (!active) return;
        if (!qs.length) setError("No questions found for this selection.");
        setPool(qs);
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [yearSlug, blockSlug, topicSlug]);

  const title = topic?.name || block?.name || (year ? `${year.name} — mixed` : "MCQs");
  const crumbs = [
    { label: "Home", to: "/dashboard" },
    { label: "MCQs", to: "/mcqs" },
    ...(year ? [{ label: year.name, to: `/mcqs/${year.slug}` }] : []),
    { label: title },
  ];

  function start() {
    const ordered = config.random ? shuffle(pool) : pool;
    const questions = config.count ? ordered.slice(0, config.count) : ordered;
    setSession({ questions, index: 0, answers: {}, checked: [], revealed: false, finished: false });
  }

  let body;
  if (!year || (blockSlug && !block) || (topicSlug && !topic)) body = <ErrorMessage message="This section was not found." />;
  else if (error) body = <ErrorMessage message={error} />;
  else if (!pool) body = <Panel><p className="text-ink-soft">Loading questions…</p></Panel>;
  else if (!session) body = <Setup pool={pool} config={config} setConfig={setConfig} onStart={start} />;
  else if (session.finished) body = <Results session={session} onRestart={() => setSession(null)} backTo={`/mcqs/${year.slug}`} />;
  else body = <Runner session={session} setSession={setSession} />;

  return (
    <RequireUser active="mcqs">
      <PageMain>
        <Breadcrumbs items={crumbs} />
        <h1 className="mb-5 text-3xl font-extrabold text-ink">{title}</h1>
        {body}
      </PageMain>
    </RequireUser>
  );
}

function Setup({ pool, config, setConfig, onStart }) {
  return (
    <Panel className="max-w-xl">
      <p className="text-ink-soft">{pool.length} questions available.</p>
      <p className="mt-5 text-sm font-semibold text-ink">Number of questions</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COUNT_OPTIONS.filter((n) => n === 0 || n < pool.length).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setConfig({ ...config, count: n })}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${config.count === n ? "border-brand bg-brand/10 text-ink" : "border-line text-ink-soft"}`}
          >
            {n === 0 ? `All (${pool.length})` : n}
          </button>
        ))}
      </div>
      <label className="mt-5 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={config.random} onChange={(e) => setConfig({ ...config, random: e.target.checked })} />
        Shuffle question order
      </label>
      <PrimaryButton className="mt-6" onClick={onStart}>Start practice</PrimaryButton>
    </Panel>
  );
}

function Runner({ session, setSession }) {
  const { questions, index, answers, revealed } = session;
  const q = questions[index];
  const chosen = answers[q.id];
  const isLast = index === questions.length - 1;

  function choose(optionIndex) {
    if (revealed) return;
    setSession({ ...session, answers: { ...answers, [q.id]: optionIndex } });
  }

  function check() {
    saveAnswer(q.id, chosen === q.a);
    setSession({ ...session, revealed: true, checked: [...session.checked, q.id] });
  }

  function next() {
    if (isLast) setSession({ ...session, finished: true });
    else setSession({ ...session, index: index + 1, revealed: false });
  }

  return (
    <Panel className="max-w-3xl">
      <div className="flex items-center justify-between text-sm text-ink-soft">
        <span>Question {index + 1} of {questions.length}</span>
        <span>{q.topic}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
        <div className="gradient-brand h-full" style={{ width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <p className="mt-5 text-lg font-semibold leading-relaxed text-ink">{q.s}</p>

      <div className="mt-4 space-y-2">
        {q.o.map((option, i) => {
          let style = "border-line bg-white/60 hover:bg-white";
          if (!revealed && chosen === i) style = "border-brand bg-brand/10";
          if (revealed && i === q.a) style = "border-emerald-400 bg-emerald-50";
          if (revealed && chosen === i && i !== q.a) style = "border-rose-400 bg-rose-50";
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => choose(i)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-ink ${style}`}
            >
              <span className="font-bold">{"ABCDE"[i]}.</span>
              <span className="flex-1">{option}</span>
              {revealed && i === q.a && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
              {revealed && chosen === i && i !== q.a && <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className={`mt-4 rounded-lg border p-4 text-sm ${chosen === q.a ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
          <p className="font-bold text-ink">
            {chosen === q.a ? "Correct." : `Incorrect — the answer is ${"ABCDE"[q.a]}.`}
          </p>
          <p className="mt-1 text-ink">{q.e}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSession({ ...session, finished: true })}
          className="text-sm font-semibold text-ink-soft underline underline-offset-2"
        >
          End session
        </button>
        {revealed ? (
          <PrimaryButton onClick={next}>
            {isLast ? "See results" : <span className="inline-flex items-center">Next <ArrowRight className="ml-1 h-4 w-4" /></span>}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={check} disabled={chosen === undefined}>Check answer</PrimaryButton>
        )}
      </div>
    </Panel>
  );
}

function Results({ session, onRestart, backTo }) {
  const [showAll, setShowAll] = useState(false);
  const attempted = session.questions.filter((q) => session.checked.includes(q.id));
  const correct = attempted.filter((q) => session.answers[q.id] === q.a);
  const pct = attempted.length ? Math.round((correct.length / attempted.length) * 100) : 0;
  const review = useMemo(
    () => (showAll ? attempted : attempted.filter((q) => session.answers[q.id] !== q.a)),
    [showAll, attempted, session.answers],
  );

  return (
    <div className="max-w-3xl space-y-4">
      <Panel>
        <p className="text-sm text-ink-soft">Your score</p>
        <p className="text-4xl font-extrabold text-ink">{pct}%</p>
        <p className="mt-1 text-ink-soft">{correct.length} correct out of {attempted.length} attempted</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <PrimaryButton onClick={onRestart}><span className="inline-flex items-center"><RotateCcw className="mr-2 h-4 w-4" />Practise again</span></PrimaryButton>
          <Link to={backTo} className="inline-flex items-center rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to sections
          </Link>
        </div>
      </Panel>

      {attempted.length > 0 && (
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink">Review</h2>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show correct answers too
            </label>
          </div>
          {review.length === 0 && <p className="mt-3 text-ink-soft">No mistakes to review.</p>}
          <ol className="mt-3 space-y-4">
            {review.map((q) => {
              const picked = session.answers[q.id];
              return (
                <li key={q.id} className="border-t border-line pt-3">
                  <p className="font-semibold text-ink">{q.s}</p>
                  {picked !== q.a && <p className="mt-1 text-sm text-rose-700">Your answer: {"ABCDE"[picked]}. {q.o[picked]}</p>}
                  <p className="mt-1 text-sm text-emerald-700">Correct: {"ABCDE"[q.a]}. {q.o[q.a]}</p>
                  <p className="mt-1 text-sm text-ink-soft">{q.e}</p>
                </li>
              );
            })}
          </ol>
        </Panel>
      )}
    </div>
  );
}