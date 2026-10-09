"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function initialsOf(name: string | null | undefined) {
  return (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

/**
 * Emoney ProfileHero — identity header card used on Profile, Performance
 * and Network member detail. Big gradient initials tile, Clash Display
 * name, a row of chips (role / userCode / status), optional meta lines
 * and a right-hand "aside" slot (e.g. wallet balance).
 */
export function ProfileHero({
  name,
  subtitle,
  chips,
  meta,
  aside,
  tone = "energy",
  className,
  children,
}: {
  name: string;
  subtitle?: React.ReactNode;
  /** Badges / StatusChips rendered under the name. */
  chips?: React.ReactNode;
  /** Icon + text lines (email, phone, location…). */
  meta?: React.ReactNode;
  /** Right-hand block, e.g. balance or primary actions. */
  aside?: React.ReactNode;
  tone?: "energy" | "brand" | "accent" | "royal" | "ink";
  className?: string;
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const tile: Record<NonNullable<typeof tone>, string> = {
    energy: "bg-energy-gradient shadow-energy-sm",
    brand: "bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow-brand",
    accent: "bg-gradient-to-br from-accent-500 to-accent-700",
    royal: "bg-gradient-to-br from-royal-500 to-royal-700 shadow-glow",
    ink: "bg-ink-900",
  };

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-ink-100 shadow-sm md:p-8",
        className
      )}
    >
      {/* soft energy wash in the corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-energy-gradient opacity-[0.08] blur-3xl"
      />
      <div className="relative flex flex-wrap items-start gap-5 md:gap-6">
        <div
          className={cn(
            "grid h-20 w-20 shrink-0 place-items-center rounded-3xl font-display text-2xl font-semibold tracking-[-0.02em] text-white md:h-24 md:w-24 md:text-3xl",
            tile[tone]
          )}
          aria-hidden
        >
          {initialsOf(name)}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h2 className="truncate font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 md:text-3xl">
              {name}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          {chips && <div className="flex flex-wrap items-center gap-2">{chips}</div>}
          {meta && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-sm text-ink-600">
              {meta}
            </div>
          )}
        </div>
        {aside && <div className="w-full shrink-0 sm:w-auto sm:text-right">{aside}</div>}
      </div>
      {children}
    </motion.section>
  );
}

/** Small icon + text line for `ProfileHero.meta`. */
export function MetaItem({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {icon && <span className="shrink-0 text-ink-400">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}
