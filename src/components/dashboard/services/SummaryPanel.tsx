"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type SummaryRow = {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Render value in monospace (ids, account numbers, UTRs). */
  mono?: boolean;
  /** Dim the row when the value is still a placeholder. */
  muted?: boolean;
  /** Tint the value — e.g. commission in accent-green. */
  tone?: "default" | "accent" | "coral" | "brand";
};

/**
 * SummaryPanel — receipt-style live preview that sits in the right aside of
 * `ServiceLayout`. Reflects whatever the page's EXISTING form state holds;
 * it never computes money or calls APIs on its own.
 *
 * Anatomy:  header (eyebrow + title + optional status Badge)
 *           ─ ─ dashed divider ─ ─
 *           label / value rows
 *           ─ ─ dashed divider ─ ─
 *           total row in Clash Display
 *           footer slot (chips, helper copy)
 */
export function SummaryPanel({
  eyebrow = "Live preview",
  title,
  status,
  rows,
  total,
  totalLabel = "You pay",
  totalHint,
  footer,
  children,
  className,
  tone = "light",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Optional status pill rendered top-right. */
  status?: { label: React.ReactNode; variant?: BadgeProps["variant"]; dot?: boolean };
  rows: SummaryRow[];
  /** Formatted total (e.g. `formatINR(amount)`); pass `undefined` to hide. */
  total?: React.ReactNode;
  totalLabel?: React.ReactNode;
  totalHint?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** `dark` renders the ink-950 variant used on hero/confirm moments. */
  tone?: "light" | "dark";
}) {
  const reduce = useReducedMotion();
  const dark = tone === "dark";

  return (
    <section
      aria-label="Transaction preview"
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 ring-1",
        dark
          ? "grain bg-ink-950 text-white ring-white/10 shadow-energy"
          : "bg-white text-ink-900 ring-ink-100 shadow-sm",
        className
      )}
    >
      {/* corner glow */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-energy-gradient blur-3xl",
          dark ? "opacity-40" : "opacity-[0.12]"
        )}
      />
      {/* receipt notches */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -left-3 top-[4.75rem] h-6 w-6 rounded-full",
          dark ? "bg-[#f6f7fb]" : "bg-[#f6f7fb]"
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 top-[4.75rem] h-6 w-6 rounded-full bg-[#f6f7fb]"
      />

      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]",
              dark ? "text-white/60" : "text-brand-700"
            )}
          >
            <span className="brand-dot" />
            {eyebrow}
          </p>
          <h3 className="mt-1 truncate font-display text-lg font-semibold tracking-[-0.02em]">
            {title}
          </h3>
        </div>
        {status && (
          <Badge variant={status.variant ?? "default"} dot={status.dot} className="shrink-0">
            {status.label}
          </Badge>
        )}
      </header>

      <Divider dark={dark} />

      <dl className="relative space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline justify-between gap-4 text-sm">
            <dt className={cn("shrink-0", dark ? "text-white/60" : "text-ink-500")}>{r.label}</dt>
            <dd
              className={cn(
                "min-w-0 truncate text-right font-medium",
                r.mono && "font-mono text-[13px]",
                r.muted && (dark ? "text-white/40" : "text-ink-300"),
                !r.muted && r.tone === "accent" && (dark ? "text-accent-300" : "text-accent-700"),
                !r.muted && r.tone === "coral" && (dark ? "text-coral-300" : "text-coral-600"),
                !r.muted && r.tone === "brand" && (dark ? "text-brand-200" : "text-brand-700"),
                !r.muted && (!r.tone || r.tone === "default") && (dark ? "text-white" : "text-ink-900")
              )}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      {total !== undefined && (
        <>
          <Divider dark={dark} />
          <div className="relative flex items-end justify-between gap-4">
            <div>
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.18em]",
                  dark ? "text-white/60" : "text-ink-500"
                )}
              >
                {totalLabel}
              </p>
              {totalHint && (
                <p className={cn("mt-0.5 text-xs", dark ? "text-white/60" : "text-ink-500")}>
                  {totalHint}
                </p>
              )}
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={String(total)}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "font-display text-3xl font-semibold tracking-[-0.03em] tabular-nums",
                  dark ? "text-white" : "gradient-text"
                )}
              >
                {total}
              </motion.p>
            </AnimatePresence>
          </div>
        </>
      )}

      {(footer || children) && (
        <div className="relative mt-5 space-y-3">
          {children}
          {footer}
        </div>
      )}
    </section>
  );
}

function Divider({ dark }: { dark?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "my-4 border-t-2 border-dashed",
        dark ? "border-white/15" : "border-ink-200"
      )}
    />
  );
}

/**
 * InfoChip — small helper pill for the aside (commission, speed, limits).
 * Only pass values the page ALREADY has in state — never invent numbers.
 */
export function InfoChip({
  icon,
  label,
  value,
  tone = "default",
  className,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value?: React.ReactNode;
  tone?: "default" | "accent" | "brand" | "royal" | "coral" | "amber";
  className?: string;
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    default: "bg-white text-ink-700 ring-ink-200",
    accent: "bg-accent-50 text-accent-800 ring-accent-200",
    brand: "bg-brand-50 text-brand-800 ring-brand-200",
    royal: "bg-royal-50 text-royal-800 ring-royal-200",
    coral: "bg-coral-50 text-coral-800 ring-coral-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {icon && <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
      <span className="truncate">{label}</span>
      {value !== undefined && (
        <span className="shrink-0 font-display tabular-nums tracking-tight">{value}</span>
      )}
    </span>
  );
}

/**
 * AsideTips — compact "good to know" list for the aside; replaces the old
 * gradient info boxes.
 */
export function AsideTips({
  title = "Good to know",
  items,
  className,
}: {
  title?: React.ReactNode;
  items: { icon?: React.ReactNode; text: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-white p-5 ring-1 ring-ink-100", className)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink-700">
            <span className="mt-0.5 shrink-0 text-brand-600 [&>svg]:h-4 [&>svg]:w-4">
              {it.icon ?? <span className="mt-1.5 block h-1.5 w-1.5 rounded-full bg-energy-gradient" />}
            </span>
            <span className="min-w-0">{it.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
