// Skeleton loaders for the signed-in app. Each preset mirrors the shape of the
// screen it stands in for, so content lands where the placeholder was. The
// shimmer is CSS only (.skeleton in index.css) and stops under reduced motion.

const repeat = (n) => Array.from({ length: n }, (_, i) => i);

export function Skeleton({ className = "", style }) {
  return <div className={`skeleton rounded-full ${className}`} style={style} />;
}

export function SkeletonPanel({ children, className = "" }) {
  return <div className={`site-grid rounded-3xl border border-s-line p-5 sm:p-6 ${className}`}>{children}</div>;
}

// Announces loading once for screen readers; the placeholders themselves are
// hidden. The layout classes go on the inner wrapper, which is the one that
// actually holds the placeholder blocks, so grids and spacing apply to them.
export function SkeletonStatus({ label = "Loading", className = "", children }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={className}>{children}</div>
    </div>
  );
}

function TileBody({ large = false }) {
  return (
    <>
      <Skeleton className="h-14 w-14 rounded-2xl" />
      <Skeleton className={`${large ? "mt-14 h-10 w-32" : "mt-6 h-8 w-24"}`} />
      <Skeleton className="mt-3 h-5 w-48" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
    </>
  );
}

// Dashboard bento: two large tiles, then smaller ones.
export function BentoSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-4 md:grid-cols-6">
      {repeat(5).map((i) => (
        <SkeletonPanel key={i} className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
          <TileBody large={i < 2} />
        </SkeletonPanel>
      ))}
    </SkeletonStatus>
  );
}

export function CardGridSkeleton({ cards = 3, withHeader = false, label }) {
  return (
    <SkeletonStatus label={label} className="space-y-5">
      {withHeader && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-56 max-w-full" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repeat(cards).map((i) => (
          <SkeletonPanel key={i}>
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="mt-6 h-6 w-2/3" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </SkeletonPanel>
        ))}
      </div>
    </SkeletonStatus>
  );
}

// OSCE station browser: search pill and filter button, then either specialty
// tiles (the bank's default view, no chips) or chips and station cards (a
// specialty page).
export function OsceBrowserSkeleton({ variant = "tiles", label }) {
  return (
    <SkeletonStatus label={label}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 w-12 sm:w-28" />
      </div>
      {variant === "cards" && (
        <div className="mt-3 flex gap-2 overflow-hidden">
          {[16, 28].map((w, i) => <Skeleton key={i} className="h-10 shrink-0" style={{ width: `${w * 4}px` }} />)}
        </div>
      )}
      <Skeleton className="mt-6 h-4 w-48" />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repeat(6).map((i) =>
          variant === "tiles" ? (
            <SkeletonPanel key={i} className="min-h-44 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="mt-5 h-6 w-1/2" />
              <Skeleton className="mt-3 h-3.5 w-3/4" />
              <Skeleton className="mt-5 h-4 w-28" />
            </SkeletonPanel>
          ) : (
            <SkeletonPanel key={i} className="p-5 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="mt-4 h-3 w-2/3" />
              <Skeleton className="mt-2.5 h-5 w-4/5" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <div className="mt-4 flex gap-2 border-t border-s-line pt-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            </SkeletonPanel>
          ),
        )}
      </div>
    </SkeletonStatus>
  );
}

function PracticeCard() {
  return (
    <SkeletonPanel>
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-7 w-20" />
      </div>
      <Skeleton className="mt-5 h-6 w-44" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-5 h-12 w-full" />
    </SkeletonPanel>
  );
}

// Station detail: brief on the left (portrait, title, chips, numbered
// tasks), the indigo AI patient card and the self-practice card on the right.
export function DetailSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <SkeletonPanel>
        <div className="flex items-start gap-4">
          <Skeleton className="hidden h-16 w-16 shrink-0 sm:block" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="mt-4 h-9 w-full" />
            <Skeleton className="mt-2 h-9 w-2/3" />
          </div>
        </div>
        <Skeleton className="mt-5 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-4 flex flex-wrap gap-2">
          {[36, 44, 16, 24].map((w, i) => <Skeleton key={i} className="h-7" style={{ width: `${w * 4}px` }} />)}
        </div>
        <div className="mt-6 border-t border-s-line pt-5">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="mt-3 h-4 w-32" />
          <NumberedRows rows={3} />
        </div>
      </SkeletonPanel>
      <div className="space-y-4">
        <div className="rounded-3xl bg-s-accent/90 p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 bg-s-on-accent/25" />
            <Skeleton className="h-6 w-28 bg-s-on-accent/20" />
          </div>
          <Skeleton className="mt-5 h-6 w-44 bg-s-on-accent/25" />
          <Skeleton className="mt-3 h-4 w-full bg-s-on-accent/20" />
          <Skeleton className="mt-2 h-4 w-2/3 bg-s-on-accent/20" />
          <Skeleton className="mt-5 h-11 w-full bg-s-on-accent/30" />
        </div>
        <PracticeCard />
      </div>
    </SkeletonStatus>
  );
}

function NumberedRows({ rows }) {
  return (
    <div className="mt-4 space-y-3">
      {repeat(rows).map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-6 w-6 shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Guided self-practice: the station brief beside the hidden checklist card.
export function TwoColumnSkeleton({ leftRows = 3, label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <SkeletonPanel>
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="mt-4 h-9 w-full" />
        <Skeleton className="mt-2 h-9 w-1/2" />
        <Skeleton className="mt-4 h-11 w-24" />
        <div className="mt-6 border-t border-s-line pt-5">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="mt-3 h-4 w-32" />
          <NumberedRows rows={leftRows} />
          <div className="mt-5 rounded-2xl border border-s-line p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </div>
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="h-fit">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-s-line p-5">
          <Skeleton className="h-16 w-16" />
          <Skeleton className="mt-4 h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-3/5" />
          <Skeleton className="mt-4 h-11 w-40" />
        </div>
        <Skeleton className="mt-6 h-4 w-16" />
        <Skeleton className="mt-2 h-28 w-full rounded-2xl" />
        <Skeleton className="mt-5 h-11 w-full" />
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

// Virtual patient chat: header with portrait and timer, the patient's opening
// line, the composer; candidate instructions alongside on wide screens.
export function ChatSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SkeletonPanel className="flex h-[calc(100dvh-170px)] min-h-130 flex-col overflow-hidden p-0 sm:p-0">
        <div className="flex items-center gap-3 border-b border-s-line p-4 sm:p-5">
          <Skeleton className="h-12 w-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-2 h-3.5 w-28" />
          </div>
          <Skeleton className="h-11 w-24 shrink-0" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-16 w-full max-w-md rounded-2xl" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="border-t border-s-line p-4">
          <Skeleton className="h-14 w-full" />
          <div className="mt-3 flex justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="hidden h-fit xl:block">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-4 w-32" />
        <NumberedRows rows={3} />
        <Skeleton className="mt-6 h-11 w-full" />
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

// Marking: checklist rows (score select and criterion) beside the score card.
export function ChecklistSkeleton({ rows = 8, label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_270px]">
      <SkeletonPanel>
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-5 w-48" />
        <div className="mt-3 divide-y divide-s-line overflow-hidden rounded-2xl border border-s-line">
          {repeat(rows).map((i) => (
            <div key={i} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
              <Skeleton className="h-10 w-36 shrink-0 rounded-xl" />
              <div className="flex-1 sm:pt-2">
                <Skeleton className="h-4 w-full" />
                {i % 3 === 1 && <Skeleton className="mt-2 h-4 w-2/5" />}
              </div>
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="flex h-fit flex-col items-center">
        <Skeleton className="h-16 w-16" />
        <Skeleton className="mt-5 h-30 w-30" />
        <Skeleton className="mt-6 h-11 w-full" />
        <Skeleton className="mt-2 h-11 w-full" />
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

// Results: score ring card, then examiner feedback with the item list.
export function ResultsSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <SkeletonPanel className="flex h-fit flex-col items-center">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="mt-5 h-36 w-36" />
        <Skeleton className="mt-5 h-6 w-32" />
        <Skeleton className="mt-6 h-11 w-full" />
        <Skeleton className="mt-2 h-11 w-full" />
      </SkeletonPanel>
      <SkeletonPanel>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0" />
          <Skeleton className="h-8 w-56 max-w-full" />
        </div>
        <Skeleton className="mt-5 h-4 w-48" />
        <Skeleton className="mt-6 h-5 w-32" />
        <div className="mt-3 space-y-2">
          {repeat(6).map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-s-line p-4">
              <Skeleton className="h-6 w-6 shrink-0" />
              <Skeleton className={`h-4 ${i % 2 ? "w-2/3" : "w-5/6"}`} />
            </div>
          ))}
        </div>
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

export function ListSkeleton({ rows = 5, label }) {
  return (
    <SkeletonStatus label={label} className="space-y-3">
      {repeat(rows).map((i) => (
        <SkeletonPanel key={i} className="p-4 sm:p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-2 h-4 w-36" />
            </div>
            <Skeleton className="h-8 w-16 shrink-0" />
          </div>
        </SkeletonPanel>
      ))}
    </SkeletonStatus>
  );
}

export function FormSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <SkeletonPanel>
        <Skeleton className="h-7 w-40" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {repeat(6).map((i) => <Skeleton key={i} className="h-11 w-full rounded-xl" />)}
        </div>
        <Skeleton className="mt-5 h-24 w-full rounded-xl" />
        <Skeleton className="mt-5 h-12 w-full" />
      </SkeletonPanel>
      <SkeletonPanel>
        <Skeleton className="h-7 w-48" />
        <div className="mt-4 space-y-3">
          {repeat(5).map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

// MCQ / OSPE question cards: stem lines and answer rows. `toolbar` adds the
// read-mode bar (count on the left, buttons on the right).
export function QuestionSkeleton({ count = 2, options = 5, toolbar = false, label }) {
  return (
    <SkeletonStatus label={label} className="space-y-4">
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
      )}
      {repeat(count).map((i) => (
        <SkeletonPanel key={i}>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-10" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-4/5" />
          <div className="mt-5 space-y-2">
            {repeat(options).map((j) => (
              <div key={j} className="flex items-center gap-3 rounded-2xl border border-s-line bg-s-card px-4 py-3">
                <Skeleton className="h-6 w-6 shrink-0" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
      ))}
    </SkeletonStatus>
  );
}

// Practice setup card (MCQ and OSPE): portrait and heading, the count
// pills, a toggle and the start button.
export function SetupSkeleton({ label }) {
  return (
    <SkeletonStatus label={label}>
      <SkeletonPanel>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        </div>
        <Skeleton className="mt-6 h-4 w-36" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[12, 12, 13, 25].map((w, i) => <Skeleton key={i} className="h-11" style={{ width: `${w * 4}px` }} />)}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Skeleton className="h-6 w-11" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="mt-7 h-11 w-40" />
      </SkeletonPanel>
    </SkeletonStatus>
  );
}