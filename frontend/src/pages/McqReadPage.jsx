import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, PlayCircle } from "lucide-react";
import { Breadcrumbs, ErrorMessage, PageMain, Panel, RequireUser } from "../components/AppPage";
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

  const title = topic?.name || block?.name || (year ? `${year.name} — all questions` : "MCQs");
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
  if (!year || (blockSlug && !block) || (topicSlug && !topic)) body = <ErrorMessage message="This section was not found." />;
  else if (error) body = <ErrorMessage message={error} />;
  else if (!questions) body = <Panel><p className="text-ink-soft">Loading questions…</p></Panel>;
  else {
    body = (
      <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">
            Questions {start + 1}–{Math.min(start + PAGE_SIZE, questions.length)} of {questions.length}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setHideAnswers((h) => !h); setRevealed({}); }}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-white"
            >
              {hideAnswers ? <Eye size={16} /> : <EyeOff size={16} />}
              {hideAnswers ? "Show all answers" : "Hide answers"}
            </button>
            <Link
              to={practiceHref}
              className="gradient-brand inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
            >
              <PlayCircle size={16} /> Practise these
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {pageQuestions.map((q, i) => {
            const showAnswer = !hideAnswers || revealed[q.id];
            return (
              <Panel key={q.id}>
                <p className="text-xs text-ink-soft">
                  Q{start + i + 1}{!topic && q.topic ? ` · ${q.topic}` : ""}
                </p>
                <p className="mt-1 font-semibold leading-relaxed text-ink">{q.s}</p>
                <ul className="mt-3 space-y-1.5">
                  {q.o.map((option, index) => {
                    const isCorrect = showAnswer && index === q.a;
                    return (
                      <li
                        key={index}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                          isCorrect ? "border-emerald-300 bg-emerald-50 text-ink" : "border-line text-ink-soft"
                        }`}
                      >
                        <span className="font-semibold">{LETTERS[index]})</span>
                        <span className="flex-1">{option}</span>
                        {isCorrect && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />}
                      </li>
                    );
                  })}
                </ul>
                {showAnswer ? (
                  q.e && (
                    <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm leading-relaxed text-ink-soft">
                      <span className="font-semibold text-ink">Explanation: </span>{q.e}
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                    className="mt-3 text-sm font-semibold text-brand hover:underline"
                  >
                    Show answer
                  </button>
                )}
              </Panel>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => goTo(page - 1)}
              className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <span className="text-sm text-ink-soft">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => goTo(page + 1)}
              className="glass-surface inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        )}
      </>
    );
  }

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
