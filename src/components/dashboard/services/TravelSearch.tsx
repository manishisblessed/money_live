"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * SearchBand — the dark `rounded-4xl bg-ink-950` search shell used by the
 * travel pages. Pure presentation: the page still owns the form state and
 * `onSubmit`; this just lays the white input tiles out on a dark band.
 */
export function SearchBand({
  eyebrow = "Search",
  title,
  subtitle,
  children,
  footer,
  className,
  ...formProps
}: React.FormHTMLAttributes<HTMLFormElement> & {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-4xl bg-ink-950 p-5 text-white grain sm:p-7",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-energy-gradient opacity-40 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl"
      />
      <form {...formProps} className="relative">
        {(title || subtitle) && (
          <div className="mb-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              <span className="brand-dot" />
              {eyebrow}
            </p>
            {title && (
              <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
          </div>
        )}
        {children}
        {footer && <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/60">{footer}</div>}
      </form>
    </motion.div>
  );
}

/**
 * SearchTile — a white tile that hosts one control on the dark band.
 * Inputs / selects inside render borderless and flush so the tile reads as
 * the field. Pass `htmlFor` to link the micro-label to the control.
 */
export function SearchTile({
  label,
  htmlFor,
  icon,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group/tile rounded-2xl bg-white px-4 py-3 text-ink-900 shadow-sm ring-1 ring-white/10 transition focus-within:shadow-energy-sm focus-within:ring-2 focus-within:ring-royal-300",
        // Flatten any Input / Select / native control dropped inside.
        "[&_input]:h-9 [&_input]:rounded-none [&_input]:border-0 [&_input]:bg-transparent [&_input]:px-0 [&_input]:shadow-none [&_input]:ring-0 [&_input:focus]:shadow-none [&_input:focus]:ring-0 [&_input:focus]:border-0",
        "[&_select]:h-9 [&_select]:rounded-none [&_select]:border-0 [&_select]:bg-transparent [&_select]:px-0 [&_select]:shadow-none [&_select]:ring-0 [&_select:focus]:shadow-none [&_select:focus]:ring-0 [&_select:focus]:border-0",
        "[&_input]:font-display [&_input]:text-base [&_input]:font-semibold [&_select]:font-display [&_select]:text-base [&_select]:font-semibold",
        className
      )}
    >
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500"
      >
        {icon && <span className="text-royal-500 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}
        {label}
      </label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

/**
 * ResultCard — a `rounded-3xl` white card for a search result row/tile with
 * the gradient hover accent used elsewhere in the dashboard.
 */
export function ResultCard({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger index for the entrance animation. */
  index?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-energy-sm",
        className
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-r-full bg-energy-gradient opacity-0 transition-opacity group-hover:opacity-100"
      />
      {children}
    </motion.div>
  );
}
