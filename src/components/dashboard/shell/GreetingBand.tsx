"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, formatINR } from "@/lib/utils";

/**
 * GreetingBand — the dark hero at the top of every role overview.
 *
 * Time-aware greeting with a "Namaste" eyebrow, the date, and a single hero
 * number (wallet / today's earnings / company payin) rendered big in Clash
 * Display with an rAF count-up. Secondary context rides in 2–3 chips.
 *
 * Purely presentational: every value is passed in by the overview that
 * already owns the data.
 */
export type GreetingChip = {
  label: string;
  value: string;
  tone?: "neutral" | "brand" | "accent" | "coral" | "royal" | "amber";
};

const chipTone: Record<NonNullable<GreetingChip["tone"]>, string> = {
  neutral: "bg-white/[0.06] text-ink-100 ring-white/10",
  brand: "bg-brand-500/15 text-brand-100 ring-brand-400/25",
  accent: "bg-accent-500/15 text-accent-100 ring-accent-400/25",
  coral: "bg-coral-500/15 text-coral-100 ring-coral-400/25",
  royal: "bg-royal-500/15 text-royal-100 ring-royal-400/25",
  amber: "bg-amber-500/15 text-amber-100 ring-amber-400/25",
};

function timeGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** rAF-driven count-up from the previous value to `target`. */
function useCountUp(target: number, duration = 900, enabled = true) {
  const [value, setValue] = React.useState(enabled ? 0 : target);
  const fromRef = React.useRef(enabled ? 0 : target);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 4);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const next = from + delta * ease(p);
      setValue(next);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = target;
    };
  }, [target, duration, enabled]);

  return value;
}

export function GreetingBand({
  name,
  eyebrow = "Namaste 🙏",
  subtitle,
  heroLabel,
  heroValue,
  heroFormat = formatINR,
  heroHint,
  chips = [],
  actions,
  loading = false,
  className,
}: {
  /** Full name — only the first word is used. */
  name?: string | null;
  eyebrow?: string;
  /** One short line under the greeting. */
  subtitle?: React.ReactNode;
  heroLabel: string;
  heroValue: number;
  heroFormat?: (n: number) => string;
  /** Tiny caption beneath the hero number. */
  heroHint?: React.ReactNode;
  chips?: GreetingChip[];
  /** Optional right-aligned actions (buttons/links). */
  actions?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const animated = useCountUp(heroValue, 900, !reduce && !loading);
  const firstName = name?.trim().split(/\s+/)[0] || "there";
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "grain relative overflow-hidden rounded-4xl bg-ink-950 text-white shadow-[0_30px_80px_-30px_rgba(7,11,20,0.7)]",
        className
      )}
      aria-label="Overview summary"
    >
      {/* aurora + glow décor */}
      <div
        aria-hidden
        className="aurora-glow pointer-events-none absolute -right-32 -top-40 h-[26rem] w-[26rem] rounded-full"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_100%,rgba(255,255,255,0.05),transparent)]"
      />

      <div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
        {/* Greeting */}
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-300">
            <span className="brand-dot" aria-hidden />
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-4xl">
            {timeGreeting()}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-ink-300">
            {dateLabel}
            {subtitle && <span className="text-ink-500"> · </span>}
            {subtitle}
          </p>
          {actions && <div className="mt-5 flex flex-wrap gap-2">{actions}</div>}
        </div>

        {/* Hero number + chips */}
        <div className="md:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            {heroLabel}
          </p>
          <p
            className={cn(
              "mt-1 font-display text-4xl font-semibold tabular-nums tracking-[-0.03em] md:text-5xl",
              loading && "animate-pulse text-white/30"
            )}
            aria-live="polite"
          >
            {loading ? "₹ ——" : heroFormat(animated)}
          </p>
          {heroHint && <p className="mt-1 text-xs text-ink-400">{heroHint}</p>}
          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2 md:justify-end" aria-label="Highlights">
              {chips.slice(0, 3).map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ring-1 ring-inset",
                    chipTone[c.tone ?? "neutral"]
                  )}
                >
                  <span className="text-ink-300/90">{c.label}</span>
                  <span className="font-display font-semibold tabular-nums">{c.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  );
}
