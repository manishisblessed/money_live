"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Emoney Pagination — v2 pill style.
 *
 * Prev / Next are `rounded-2xl` pills, page numbers render as a compact
 * window (1 … 4 5 6 … 20) with the active page in solid ink. API unchanged:
 * `page`, `pageSize`, `total`, `onPageChange`, `className`.
 */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2)
    [totalPages - 1, totalPages - 2, totalPages - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const pillBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200 focus-energy disabled:pointer-events-none disabled:opacity-40";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1 && total <= pageSize) return null;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const window = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink-100 bg-white px-4 py-3 text-sm text-ink-600 shadow-sm",
        className
      )}
    >
      <p className="text-xs sm:text-sm">
        Showing{" "}
        <span className="font-semibold tabular-nums text-ink-900">{from.toLocaleString("en-IN")}</span>
        –<span className="font-semibold tabular-nums text-ink-900">{to.toLocaleString("en-IN")}</span>{" "}
        of <span className="font-semibold tabular-nums text-ink-900">{total.toLocaleString("en-IN")}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className={cn(pillBase, "border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {window.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-ink-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  pillBase,
                  "tabular-nums",
                  p === page
                    ? "bg-ink-950 text-white shadow-soft"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>
        <span className="rounded-2xl bg-ink-950 px-3 py-1.5 text-xs font-semibold tabular-nums text-white sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className={cn(pillBase, "border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50")}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
