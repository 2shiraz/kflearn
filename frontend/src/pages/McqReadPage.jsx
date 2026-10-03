import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Check, Eye, EyeOff, PlayCircle } from "lucide-react";
import { Breadcrumbs, EmptyState, ErrorMessage, LinkButton, PageMain, Panel, RequireUser, SecondaryButton } from "../components/AppPage";
import { QuestionSkeleton } from "../components/Skeleton";
import { Chip, Pager, PillLink, rise } from "../components/StudyKit";
import { getBlock, getYear, loadQuestions } from "../data/mcqs/catalog";

// ---- /mcqs/:yearSlug/read?block=&topic= ----
// Study mode: every question shown with its correct answer and explanation.
// Nothing here is scored or written to progress — reading isn't attempting.
const PAGE_SIZE = 20;
const LETTERS = "ABCDE";

export function McqRead() {
  const { yearSlug } = useParams();
  const [params] = useSearchParams();
  const blockSlug = params.get("block") || "";
  const topicSlug = params.get("topic") || "";
  const year = getYear(yearSlug);
  const block = blockSlug ? getBlock(yearSlug, blockSlug) : null;
  const topic = block?.topics.find((t) => t.slug === topicSlug) || null;

  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hideAnswers, setHideAnswers] = useState(false);
  const [revealed, setRevealed] = useState({}); // per-question reveal when answers are hidden

  useEffect(() => {
    let active = true;
    setQuestions(null);
    setPage(1);
    setRevealed({});
    loadQuestions(yearSlug, blockSlug, topicSlug)
      .then((qs) => {
        if (!active) return;
        if (!qs.length) setError("No questions found for this selection.");
        setQuestions(qs);
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [yearSlug, blockSlug, topicSlug]);

  const title = topic?.name || block?.name || (year ? `${year.name}, all questions` : "MCQs");
  const query = params.toString();
  const practiceHref = `/mcqs/${yearSlug}/practice${query ? `?${query}` : ""}`;
  const crumbs = [
    { label: "Home", to: "/dashboard" },
    { label: "MCQs", to: "/mcqs" },
    ...(year ? [{ label: year.name, to: `/mcqs/${year.slug}` }] : []),
    { label: `${title} (read)` },
  ];

  const totalPages = questions ? Math.max(1, Math.ceil(questions.length / PAGE_SIZE)) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageQuestions = questions ? questions.slice(start, start + PAGE_SIZE) : [];

  function goTo(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let body;
  if (!year || (blockSlug && !block) || (topicSlug && !topic)) {
    body = (
      <EmptyState
        character="student-bilal"
        tone="sun"
        title="We couldn't find that section"
        body="It may have moved. Pick it again from the list."
        action={<LinkButton to={year ? `/mcqs/${year.slug}` : "/mcqs"}>Back to sections</LinkButton>}
      />
    );
  } else if (error) body = <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  else if (!questions) body = <QuestionSkeleton label="Loading questions" />;
  else {
    body = (
      <>
        <div className="mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <p className="font-chart text-xs text-s-mute">
            Questions {start + 1}-{Math.min(start + PAGE_SIZE, questions.length)} of {questions.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => { setHideAnswers((h) => !h); setRevealed({}); }}>
              {hideAnswers ? <Eye size={16} strokeWidth={2} aria-hidden="true" /> : <EyeOff size={16} strokeWidth={2} aria-hidden="true" />}
              {hideAnswers ? "Show all answers" : "Hide answers"}
            </SecondaryButton>
            <PillLink to={practiceHref} icon={PlayCircle} primary>Practise these</PillLink>
          </div>
        </div>

        <div className="max-w-3xl space-y-4">
          {pageQuestions.map((q, i) => {
            const showAnswer = !hideAnswers || revealed[q.id];
            return (
              <Panel key={q.id} className="site-rise" style={rise(i, 40)}>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip className="bg-sky-soft text-s-ink">Q{start + i + 1}</Chip>
                  {!topic && q.topic && <Chip>{q.topic}</Chip>}
                </div>
                <p className="mt-3 leading-relaxed text-s-ink">{q.s}</p>
                <ul className="mt-4 space-y-2">
                  {q.o.map((option, index) => {
                    const isCorrect = showAnswer && index === q.a;
                    return (
                      <li
                        key={index}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-sm ${
                          isCorrect ? "border-mint bg-mint-soft text-s-ink" : "border-s-line bg-s-card text-s-mute"
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-s-tint font-chart text-xs text-s-mute">
                          {isCorrect ? <Check size={13} strokeWidth={2.5} className="text-mint" aria-label="Correct answer" /> : LETTERS[index]}
                        </span>
                        <span className="flex-1">{option}</span>
                      </li>
                    );
                  })}
                </ul>
                {showAnswer ? (
                  q.e && (
                    <div className="mt-4 rounded-2xl bg-s-tint/70 p-4 text-sm leading-relaxed text-s-mute">
                      <span className="font-medium text-s-ink">Explanation: </span>{q.e}
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                    className="site-press mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-sky-soft px-4 text-sm font-medium text-s-ink hover:bg-s-accent-soft"
                  >
                    <Eye size={15} strokeWidth={2} aria-hidden="true" /> Show answer
                  </button>
                )}
              </Panel>
            );
          })}
        </div>

        <div className="max-w-3xl">
          <Pager page={page} totalPages={totalPages} onPage={goTo} />
        </div>
      </>
    );
  }

  return (
    <RequireUser active="mcqs">
      <PageMain>
        <Breadcrumbs items={crumbs} />
        <h1 className="site-rise mb-6 text-2xl font-semibold tracking-tight text-s-ink sm:text-3xl">{title}</h1>
        {body}
      </PageMain>
    </RequireUser>
  );
}
