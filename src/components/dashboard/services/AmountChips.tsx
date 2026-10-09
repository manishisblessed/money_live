"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, formatINR } from "@/lib/utils";

/**
 * AmountChips — quick-pick amount pills (₹100 / ₹200 / ₹500 / ₹1,000 …).
 *
 * Pages wire `onPick` to their EXISTING amount setter
 * (`onPick={(v) => setAmount(String(v))}`) — the chip never owns the value.
 * Pass the current `value` so the matching chip lights up.
 */
export function AmountChips({
  amounts = [100, 200, 500, 1000],
  value,
  onPick,
  prefix,
  className,
  size = "md",
  render,
  disabled,
}: {
  amounts?: number[];
  /** Current amount from page state (string or number). */
  value?: string | number;
  onPick: (amount: number) => void;
  /** Optional glyph before each label, e.g. "+" for top-ups. */
  prefix?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
  /** Custom chip label (e.g. "Minimum due — ₹500"). */
  render?: (amount: number) => React.ReactNode;
  disabled?: boolean;
}) {
  const reduce = useReducedMotion();
  const current = value === undefined || value === "" ? NaN : Number(value);

  return (
    <div
      role="group"
      aria-label="Quick amounts"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {amounts.map((v) => {
        const active = Number.isFinite(current) && current === v;
        return (
          <motion.button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onPick(v)}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            aria-pressed={active}
            data-active={active ? "true" : undefined}
            className={cn(
              "gradient-ring inline-flex items-center gap-1 rounded-full bg-white font-semibold tabular-nums ring-1 ring-ink-200 transition-colors",
              "hover:text-brand-700 focus-energy disabled:cursor-not-allowed disabled:opacity-50",
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
              active ? "pill-active ring-transparent" : "text-ink-700"
            )}
          >
            {prefix && <span className="text-ink-400">{prefix}</span>}
            {render ? render(v) : formatINR(v)}
          </motion.button>
        );
      })}
    </div>
  );
}
