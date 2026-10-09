"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Emoney FilterBar — a calm white bar that wraps a page's existing filter
 * controls. Left slot carries a title + live count, right slot carries
 * actions (refresh / export). Controls go in `children` and flow in the
 * middle. Optional `sticky` keeps it pinned below the topbar on scroll.
 */
export function FilterBar({
  title,
  count,
  hint,
  actions,
  children,
  sticky = false,
  className,
}: {
  title?: React.ReactNode;
  /** Live record count shown next to the title (string allows "1,204 of 5k"). */
  count?: number | string;
  /** Small muted copy under the title. */
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  const hasLead = title || count !== undefined || hint;
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/95 p-3 ring-1 ring-ink-100 shadow-sm backdrop-blur",
        sticky && "sticky top-[4.5rem] z-10",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {hasLead && (
          <div className="flex min-w-0 items-center gap-2 pl-1 pr-2">
            {title && (
              <span className="truncate font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">
                {title}
              </span>
            )}
            {count !== undefined && (
              <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-600">
                {typeof count === "number" ? count.toLocaleString("en-IN") : count}
              </span>
            )}
            {hint && <span className="truncate text-xs text-ink-500">{hint}</span>}
          </div>
        )}
        {children && (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
        )}
        {actions && (
          <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
