import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Check, PlayCircle, Shuffle, X } from "lucide-react";
import { Breadcrumbs, EmptyState, ErrorMessage, LinkButton, PageHeader, PageMain, Panel, PrimaryButton, RequireUser } from "../components/AppPage";
import { QuestionSkeleton } from "../components/Skeleton";
import { Chip, ChoicePills, PillLink, ProgressLine, ResultsSummary, SectionHeader, SetupCard, StepBar, Toggle, TopicCard, YEAR_TONES, YearCard } from "../components/StudyKit";
import { plus } from "../site/siteContent";
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

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---- /mcqs ----
export function McqsHome() {
  const progress = readProgress();
  return (
    <RequireUser active="mcqs">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "MCQs" }]} />
        <PageHeader
          title="MCQs"
          description={`${plus(mcqTotalCount)} single-best-answer questions with explanations. Pick your year to begin.`}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mcqYears.map((year, i) => {
            const p = progressFor(progress, year.year, 0, year.count);
            const tone = YEAR_TONES[i % YEAR_TONES.length];
            return (
              <YearCard
                key={year.slug}
                to={`/mcqs/${year.slug}`}
                name={year.name}
                blocks={year.blocks.map((b) => b.name).join(", ")}
                count={`${plus(year.count)} MCQs`}
                tone={tone}
                icon="book"
                index={i}
                progress={<ProgressLine value={p.answered} total={year.count} tone={tone} caption={`${p.answered} of ${year.count} attempted`} />}
              />
            );
          })}
        </div>
      </PageMain>
    </RequireUser>
  );
}

function NotFound({ backTo, backLabel }) {
  return (
    <EmptyState
      character="student-bilal"
      tone="sun"
      title="We couldn't find that section"
      body="It may have moved. Pick it again from the list."
      action={<LinkButton to={backTo}>{backLabel}</LinkButton>}
    />
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
        <PageMain><NotFound backTo="/mcqs" backLabel="All years" /></PageMain>
      </RequireUser>
    );
  }

  let offset = 0;
  return (
    <RequireUser active="mcqs">
      <PageMain>
        <Breadcrumbs items={[{ label: "Home", to: "/dashboard" }, { label: "MCQs", to: "/mcqs" }, { label: year.name }]} />
        <PageHeader
          title={year.name}
          description="Read a topic with answers and explanations, or practise it and check yourself."
          actions={
            <LinkButton to={`/mcqs/${year.slug}/practice`}>
              <Shuffle size={16} strokeWidth={2} aria-hidden="true" /> Mixed practice
            </LinkButton>
          }
        />

        <div className="space-y-10">
          {year.blocks.map((block, blockIndex) => {
            const blockStart = offset;
            const bp = progressFor(progress, year.year, blockStart, block.count);
            let topicOffset = blockStart;
            offset += block.count;
            const tone = YEAR_TONES[blockIndex % YEAR_TONES.length];
            return (
              <section key={block.slug}>
                <SectionHeader
                  tone={tone}
                  icon="book"
                  index={blockIndex}
                  name={block.name}
                  meta={`${block.count} MCQs / ${block.topics.length} topics${bp.answered ? ` / ${Math.round((bp.correct / bp.answered) * 100)}% correct so far` : ""}`}
                  actions={
                    <>
                      <PillLink to={`/mcqs/${year.slug}/read?block=${block.slug}`} icon={BookOpen}>Read section</PillLink>
                      <PillLink to={`/mcqs/${year.slug}/practice?block=${block.slug}`} icon={PlayCircle}>Practise section</PillLink>
                    </>
                  }
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {block.topics.map((topic, topicIndex) => {
                    const tp = progressFor(progress, year.year, topicOffset, topic.count);
                    topicOffset += topic.count;
                    const query = `block=${block.slug}&topic=${topic.slug}`;
                    return (
                      <TopicCard
                        key={topic.slug}
                        name={topic.name}
                        count={`${topic.count} MCQs`}
                        tone={tone}
                        icon="book"
                        index={topicIndex}
                        done={tp.answered === topic.count}
                        progress={<ProgressLine value={tp.answered} total={topic.count} tone={tone} caption={`${tp.answered} of ${topic.count} attempted`} />}
                        readTo={`/mcqs/${year.slug}/read?${query}`}
                        practiseTo={`/mcqs/${year.slug}/practice?${query}`}
                      />
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
const LETTERS = "ABCDE";

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

  const title = topic?.name || block?.name || (year ? `${year.name}, mixed practice` : "MCQs");
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
  if (!year || (blockSlug && !block) || (topicSlug && !topic)) body = <NotFound backTo={year ? `/mcqs/${year.slug}` : "/mcqs"} backLabel="Back to sections" />;
  else if (error) body = <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  else if (!pool) body = <QuestionSkeleton count={1} label="Loading questions" />;
  else if (!session) body = <Setup pool={pool} config={config} setConfig={setConfig} onStart={start} />;
  else if (session.finished) body = <Results session={session} onRestart={() => setSession(null)} backTo={`/mcqs/${year.slug}`} />;
  else body = <Runner session={session} setSession={setSession} />;

  return (
    <RequireUser active="mcqs">
      <PageMain width="focused">
        <Breadcrumbs items={crumbs} />
        <h1 className="site-rise mb-8 text-3xl font-semibold tracking-tight text-s-ink sm:text-4xl">{title}</h1>
        {body}
      </PageMain>
    </RequireUser>
  );
}

function Setup({ pool, config, setConfig, onStart }) {
  const options = COUNT_OPTIONS.filter((n) => n === 0 || n < pool.length).map((n) => ({ value: n, label: n === 0 ? `All (${pool.length})` : String(n) }));
  return (
    <SetupCard character="student-ayesha" tone="sky" available={`${pool.length} questions available.`} onStart={onStart}>
      <ChoicePills label="Number of questions" options={options} value={config.count} onChange={(count) => setConfig({ ...config, count })} />
      <div className="mt-4">
        <Toggle checked={config.random} onChange={(random) => setConfig({ ...config, random })}>Shuffle question order</Toggle>
      </div>
    </SetupCard>
  );
}

// Answer option, styled like the landing "Try one" card.
function OptionButton({ index, text, state, disabled, onClick }) {
  const styles = {
    idle: "border-s-line bg-s-card hover:border-s-accent/60",
    chosen: "border-s-accent bg-s-accent-soft",
    correct: "border-mint bg-mint-soft",
    wrong: "border-coral bg-coral-soft",
    dim: "border-s-line bg-s-card opacity-60",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={state === "chosen"}
      onClick={onClick}
      className={`site-press flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] leading-snug text-s-ink ${styles[state]}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-chart text-xs ${state === "chosen" ? "bg-s-accent text-s-on-accent" : "bg-s-tint text-s-mute"}`}>
        {state === "correct" ? <Check size={14} strokeWidth={2.5} className="text-mint" /> : state === "wrong" ? <X size={14} strokeWidth={2.5} className="text-coral" /> : LETTERS[index]}
      </span>
      <span className="flex-1">{text}</span>
    </button>
  );
}

function Runner({ session, setSession }) {
  const { questions, index, answers, revealed } = session;
  const q = questions[index];
  const chosen = answers[q.id];
  const isLast = index === questions.length - 1;
  const correct = chosen === q.a;

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

  function optionState(i) {
    if (!revealed) return chosen === i ? "chosen" : "idle";
    if (i === q.a) return "correct";
    if (chosen === i) return "wrong";
    return "dim";
  }

  return (
    <Panel key={q.id} className="site-rise md:p-8">
      <StepBar
        label={`Question ${index + 1} of ${questions.length}`}
        aside={q.topic && <Chip>{q.topic}</Chip>}
        value={index + (revealed ? 1 : 0)}
        total={questions.length}
        tone="sky"
      />

      <p className="mt-6 text-lg leading-relaxed text-s-ink">{q.s}</p>

      <div className="mt-6 space-y-2.5">
        {q.o.map((option, i) => (
          <OptionButton key={i} index={i} text={option} state={optionState(i)} disabled={revealed} onClick={() => choose(i)} />
        ))}
      </div>

      {revealed && (
        <div aria-live="polite" className={`mt-5 rounded-2xl px-4 py-4 ${correct ? "bg-mint-soft" : "bg-coral-soft"}`}>
          <p className="font-medium text-s-ink">{correct ? "Correct. Nicely done." : `Not quite. The answer is ${LETTERS[q.a]}.`}</p>
          {q.e && <p className="mt-1.5 leading-relaxed text-s-ink/80">{q.e}</p>}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSession({ ...session, finished: true })}
          className="min-h-11 rounded-full px-3 text-sm font-medium text-s-mute hover:bg-s-tint/70 hover:text-s-ink"
        >
          End session
        </button>
        {revealed ? (
          <PrimaryButton onClick={next}>
            {isLast ? "See results" : <>Next <ArrowRight size={16} strokeWidth={2} aria-hidden="true" /></>}
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
      <ResultsSummary
        pct={pct}
        title="correct"
        detail={`${correct.length} correct out of ${attempted.length} attempted.`}
        onRestart={onRestart}
        backTo={backTo}
      />

      {attempted.length > 0 && (
        <Panel className="site-rise" style={{ "--rise-delay": "80ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-s-ink">Review</h2>
            <Toggle checked={showAll} onChange={setShowAll}>Show correct answers too</Toggle>
          </div>
          {review.length === 0 && (
            <p className="mt-3 flex items-center gap-3 rounded-2xl bg-mint-soft p-3.5 text-sm text-s-ink">
              <Check size={16} strokeWidth={2.5} className="text-mint" aria-hidden="true" /> No mistakes to review.
            </p>
          )}
          <ol className="mt-4 space-y-3">
            {review.map((q) => {
              const picked = session.answers[q.id];
              return (
                <li key={q.id} className="rounded-2xl border border-s-line bg-s-card p-4">
                  <p className="font-medium leading-relaxed text-s-ink">{q.s}</p>
                  {picked !== q.a && (
                    <p className="mt-2 flex gap-2 text-sm text-s-miss">
                      <X size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <span>Your answer: {LETTERS[picked]}. {q.o[picked]}</span>
                    </p>
                  )}
                  <p className="mt-1.5 flex gap-2 text-sm text-s-good">
                    <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Correct: {LETTERS[q.a]}. {q.o[q.a]}</span>
                  </p>
                  {q.e && <p className="mt-2 text-sm leading-relaxed text-s-mute">{q.e}</p>}
                </li>
              );
            })}
          </ol>
        </Panel>
      )}
    </div>
  );
}
