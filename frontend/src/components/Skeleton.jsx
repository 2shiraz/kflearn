// Skeleton loaders for the signed-in app. Each preset mirrors the shape of the
// screen it stands in for, so content lands where the placeholder was. The
// shimmer is CSS only (.skeleton in index.css) and stops under reduced motion.

const repeat = (n) => Array.from({ length: n }, (_, i) => i);

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

export function SkeletonPanel({ children, className = "" }) {
  return <div className={`site-grid rounded-3xl border border-s-line p-5 sm:p-6 ${className}`}>{children}</div>;
}

// Announces loading once for screen readers; the placeholders themselves are hidden.
export function SkeletonStatus({ label = "Loading", className = "", children }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">{children}</div>
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

export function DetailSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <SkeletonPanel>
        <Skeleton className="h-4 w-56 max-w-full" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-8 space-y-3 border-t border-s-line pt-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </SkeletonPanel>
      <div className="space-y-4">
        <PracticeCard />
        <PracticeCard />
      </div>
    </SkeletonStatus>
  );
}

export function TwoColumnSkeleton({ leftRows = 6, rightRows = 5, label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <SkeletonPanel>
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="mt-7 grid gap-2">
          {repeat(leftRows).map((i) => (
            <div key={i} className="rounded-2xl border border-s-line bg-s-card p-4">
              <Skeleton className="h-4 w-44 max-w-full" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel>
        <Skeleton className="h-6 w-36" />
        <div className="mt-5 space-y-3">
          {repeat(rightRows).map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

// Virtual patient chat: header with avatar, alternating bubbles, composer.
export function ChatSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SkeletonPanel className="flex h-[calc(100dvh-170px)] min-h-[520px] flex-col overflow-hidden p-0 sm:p-0">
        <div className="flex items-center gap-3 border-b border-s-line p-5">
          <Skeleton className="h-12 w-12" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="mt-2 h-3.5 w-32" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5">
          <Skeleton className="h-12 w-3/5 rounded-3xl rounded-tl-md" />
          <Skeleton className="ml-auto h-11 w-1/2 rounded-3xl rounded-tr-md" />
          <Skeleton className="h-20 w-2/3 rounded-3xl rounded-tl-md" />
          <Skeleton className="ml-auto h-11 w-3/5 rounded-3xl rounded-tr-md" />
        </div>
        <div className="border-t border-s-line p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      </SkeletonPanel>
      <SkeletonPanel>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-7 h-12 w-full" />
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

// Checklist rows beside a score ring, like the landing "Mark like an examiner".
export function ChecklistSkeleton({ rows = 6, label }) {
  return (
    <SkeletonStatus label={label} className="mx-auto grid max-w-4xl gap-5 md:grid-cols-[1fr_220px]">
      <SkeletonPanel>
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 space-y-2.5">
          {repeat(rows).map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-s-line bg-s-card p-4">
              <Skeleton className="h-6 w-6 shrink-0 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="mt-2 h-3.5 w-4/5" />
              </div>
              <Skeleton className="h-6 w-16 shrink-0" />
            </div>
          ))}
        </div>
      </SkeletonPanel>
      <SkeletonPanel className="flex flex-col items-center">
        <Skeleton className="h-32 w-32" />
        <Skeleton className="mt-5 h-4 w-28" />
        <Skeleton className="mt-6 h-12 w-full" />
      </SkeletonPanel>
    </SkeletonStatus>
  );
}

export function ResultsSkeleton({ label }) {
  return (
    <SkeletonStatus label={label} className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <SkeletonPanel className="flex flex-col items-center">
        <Skeleton className="h-36 w-36" />
        <Skeleton className="mt-5 h-4 w-40" />
        <Skeleton className="mt-6 h-12 w-full" />
      </SkeletonPanel>
      <SkeletonPanel>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-7 h-5 w-28" />
        <Skeleton className="mt-3 h-4 w-3/4" />
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

// MCQ / OSPE question cards: stem lines and answer rows.
export function QuestionSkeleton({ count = 2, options = 5, label }) {
  return (
    <SkeletonStatus label={label} className="max-w-3xl space-y-4">
      {repeat(count).map((i) => (
        <SkeletonPanel key={i}>
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-4/5" />
          <div className="mt-6 space-y-2.5">
            {repeat(options).map((j) => (
              <div key={j} className="flex items-center gap-3 rounded-2xl border border-s-line bg-s-card px-4 py-3">
                <Skeleton className="h-7 w-7 shrink-0" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ))}
          </div>
        </SkeletonPanel>
      ))}
    </SkeletonStatus>
  );
}
