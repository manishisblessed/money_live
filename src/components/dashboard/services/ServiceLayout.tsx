"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * ServiceLayout — the Emoney v2 two-column shell for every transactional
 * service page (recharge, bill pay, DMT, AePS, payout, …).
 *
 *  · LEFT  = the form area (children). Pages wrap their existing form in
 *            `<ServiceCard>` so the form logic stays untouched.
 *  · RIGHT = a sticky `<aside>` slot for a receipt-style `SummaryPanel`,
 *            commission chips, and helper copy. Stacks under the form on
 *            mobile (grid collapses to one column below `lg`).
 *
 * Purely presentational — it never touches state or network calls.
 */
export function ServiceLayout({
  children,
  aside,
  className,
  asideClassName,
}: {
  children: React.ReactNode;
  /** Right-hand sticky column. Omit to render a single, centered column. */
  aside?: React.ReactNode;
  className?: string;
  asideClassName?: string;
}) {
  const reduce = useReducedMotion();
  const enter = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
      };

  if (!aside) {
    return (
      <motion.div {...enter} className={cn("mx-auto w-full max-w-3xl", className)}>
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start",
        className
      )}
    >
      <motion.div {...enter} className="min-w-0">
        {children}
      </motion.div>
      <motion.aside
        {...(reduce
          ? {}
          : {
              initial: { opacity: 0, y: 16 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] as const },
            })}
        className={cn("min-w-0 space-y-4 lg:sticky lg:top-24", asideClassName)}
      >
        {aside}
      </motion.aside>
    </div>
  );
}

/**
 * ServiceCard — the white "paper" surface every service form sits on.
 * `rounded-3xl bg-white ring-1 ring-ink-100 p-6` per the v2 spec, with an
 * optional eyebrow/title slab so pages can drop their ad-hoc headers.
 */
export function ServiceCard({
  children,
  className,
  title,
  eyebrow,
  description,
  icon,
  action,
  as: Comp = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  /** Usually an `<IconTile />`. */
  icon?: React.ReactNode;
  /** Right-aligned header action (refresh button, badge, …). */
  action?: React.ReactNode;
  /** Render as `form` when the card itself is the form element. */
  as?: "div" | "form" | "section";
} & Omit<React.HTMLAttributes<HTMLElement>, "title">) {
  const hasHeader = title || eyebrow || description || icon || action;
  return (
    <Comp
      className={cn(
        "relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink-100",
        className
      )}
      {...(rest as React.HTMLAttributes<HTMLElement>)}
    >
      {hasHeader && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon}
            <div className="min-w-0">
              {eyebrow && (
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">
                  <span className="brand-dot" />
                  {eyebrow}
                </p>
              )}
              {title && (
                <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-ink-500">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Comp>
  );
}

/**
 * Field — a thin wrapper that gives non-floating inputs (Select, OperatorSelect,
 * date/file inputs) the same uppercase micro-label rhythm as `FloatingInput`
 * so mixed forms read as one family.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  action,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  /** Small control rendered on the right of the label (e.g. a refresh link). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600"
        >
          {label}
          {optional && (
            <span className="font-medium normal-case tracking-normal text-ink-400">
              (optional)
            </span>
          )}
        </label>
        {action}
      </div>
      {children}
      {(hint || error) && (
        <p className={cn("mt-1.5 text-xs", error ? "text-coral-600" : "text-ink-500")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/**
 * Notice — inline status strip used for errors / processing / info inside
 * service forms. Replaces the ad-hoc rose/amber boxes with one voice.
 */
export function Notice({
  tone = "info",
  icon,
  children,
  className,
  action,
}: {
  tone?: "info" | "success" | "warning" | "danger" | "brand";
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    info: "bg-ink-50 text-ink-700 ring-ink-200/70",
    success: "bg-accent-50 text-accent-800 ring-accent-200",
    warning: "bg-amber-50 text-amber-800 ring-amber-200",
    danger: "bg-coral-50 text-coral-700 ring-coral-200",
    brand: "bg-brand-50 text-brand-800 ring-brand-200",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * SecureFootnote — the "confirmed with your PIN / auto-refund" reassurance
 * line under primary CTAs. Centralised so the voice stays consistent.
 */
export function SecureFootnote({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-ink-400",
        className
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
      {children ?? "Confirmed with your transaction PIN · failed transactions auto-refund to your wallet."}
    </p>
  );
}
