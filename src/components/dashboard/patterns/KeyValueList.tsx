import * as React from "react";
import { cn } from "@/lib/utils";

export type KeyValueItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Render the value in monospace (ids, refs, codes). */
  mono?: boolean;
  /** Span both columns in `grid` layout. */
  wide?: boolean;
};

/**
 * Emoney KeyValueList — label/value rows for detail panels.
 *
 * `layout="rows"` renders hairline-divided rows (label left, value right);
 * `layout="grid"` renders a two-column tile grid (label above value) which
 * works better for long values and mobile.
 */
export function KeyValueList({
  items,
  layout = "rows",
  dense = false,
  className,
}: {
  items: KeyValueItem[];
  layout?: "rows" | "grid";
  dense?: boolean;
  className?: string;
}) {
  if (layout === "grid") {
    return (
      <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
        {items.map((it, i) => (
          <div
            key={i}
            className={cn(
              "rounded-2xl bg-ink-50/70 px-4 py-3 ring-1 ring-inset ring-ink-100/80",
              it.wide && "sm:col-span-2"
            )}
          >
            <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              {it.label}
            </dt>
            <dd
              className={cn(
                "mt-1 break-words text-sm font-semibold text-ink-900",
                it.mono && "font-mono text-xs font-medium"
              )}
            >
              {it.value ?? <span className="text-ink-300">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn("divide-y divide-ink-100", className)}>
      {items.map((it, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-wrap items-start justify-between gap-x-6 gap-y-1",
            dense ? "py-2" : "py-3"
          )}
        >
          <dt className="text-sm text-ink-500">{it.label}</dt>
          <dd
            className={cn(
              "min-w-0 max-w-full text-right text-sm font-semibold text-ink-900",
              it.mono && "font-mono text-xs font-medium"
            )}
          >
            {it.value ?? <span className="text-ink-300">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
