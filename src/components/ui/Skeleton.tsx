import { cn } from "@/lib/utils";

/**
 * Emoney Skeleton — v2 "Bharat Energy".
 *
 * A brand-tinted shimmer (ink → brand-50 → ink) sweeping left-to-right
 * instead of a flat gray pulse. Server-safe (no hooks) so it can be used from
 * layouts and loading.tsx files.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-ink-100/70",
        "bg-gradient-to-r from-ink-100/80 via-brand-50 to-ink-100/80 bg-[length:200%_100%]",
        "animate-shimmer motion-reduce:animate-pulse",
        className
      )}
      aria-hidden
    />
  );
}

/** Shimmer block tuned for dark surfaces (sidebar, hero bands). */
function DarkSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-r from-white/[0.06] via-white/[0.14] to-white/[0.06] bg-[length:200%_100%]",
        "animate-shimmer motion-reduce:animate-pulse",
        className
      )}
      aria-hidden
    />
  );
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-24" />
      <Skeleton className="mt-2 h-8 w-32" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-24 rounded-2xl" />
      </div>
      <div className="bg-ink-50/60 px-5 py-2.5">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-2.5 flex-1 max-w-[6rem]" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-ink-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn(
                  "h-3.5 flex-1",
                  c === 0 && "max-w-[8rem]",
                  c === cols - 1 && "max-w-[5rem]"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-shell placeholder shown while the dashboard session resolves.
 * Mirrors the v2 shell: a dark 272px sidebar on the left, a light `#f6f7fb`
 * content area with a greeting band and a bento grid of card placeholders.
 */
export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#f6f7fb]">
      {/* Dark sidebar */}
      <aside className="hidden w-[272px] shrink-0 flex-col bg-ink-950 p-4 lg:flex">
        <div className="flex items-center gap-3 px-2 py-2">
          <DarkSkeleton className="h-9 w-9 rounded-xl" />
          <DarkSkeleton className="h-4 w-24" />
        </div>
        <DarkSkeleton className="mt-6 h-11 w-full rounded-2xl" />
        <div className="mt-6 space-y-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <DarkSkeleton className="h-4 w-4 rounded-md" />
              <DarkSkeleton
                className={cn("h-3", i % 3 === 0 ? "w-28" : i % 3 === 1 ? "w-20" : "w-24")}
              />
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-2xl bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <DarkSkeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <DarkSkeleton className="h-3 w-24" />
              <DarkSkeleton className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      </aside>

      {/* Light content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-ink-100/80 bg-white/70 px-4 backdrop-blur md:px-8">
          <Skeleton className="h-10 w-56 rounded-2xl" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">
            {/* Greeting band */}
            <div className="relative overflow-hidden rounded-4xl border border-ink-100 bg-gradient-to-br from-brand-50 via-white to-coral-50/40 p-6 md:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-energy-gradient opacity-10 blur-3xl"
              />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-72 max-w-full" />
              <Skeleton className="mt-3 h-3.5 w-96 max-w-full" />
              <div className="mt-5 flex flex-wrap gap-2">
                <Skeleton className="h-10 w-36 rounded-2xl" />
                <Skeleton className="h-10 w-28 rounded-2xl" />
              </div>
            </div>

            {/* Bento placeholders */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatSkeleton key={i} />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <TableSkeleton rows={6} cols={5} className="lg:col-span-2" />
              <div className="space-y-4">
                <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
                </div>
                <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm">
                  <Skeleton className="h-4 w-28" />
                  <div className="mt-4 space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-3.5 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
