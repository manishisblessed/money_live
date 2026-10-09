"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { BankLogo } from "@/components/dashboard/BankLogo";
import { cn } from "@/lib/utils";

export type OperatorGridOption = {
  value: string;
  label: string;
  /** Optional sub-line (e.g. "Prepaid", IFSC). */
  meta?: React.ReactNode;
  /** Optional custom glyph; defaults to a `BankLogo` lookup + initials fallback. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

/**
 * OperatorGrid — tap-to-select tiles for operators / billers / banks / modes.
 *
 * Pages hand it the list they ALREADY hold in state plus their EXISTING
 * selection + setter: `value={operator} onChange={setOperator}`. The selected
 * tile gets the signature `.gradient-ring[data-active]` border.
 */
export function OperatorGrid({
  options,
  value,
  onChange,
  columns = 3,
  className,
  size = "md",
  showLogo = true,
  name,
}: {
  options: OperatorGridOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  size?: "sm" | "md";
  showLogo?: boolean;
  /** Accessible group label. */
  name?: string;
}) {
  const reduce = useReducedMotion();
  const cols: Record<NonNullable<typeof columns>, string> = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-3 sm:grid-cols-5",
  };

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn("grid gap-2.5", cols[columns], className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            whileTap={reduce || o.disabled ? undefined : { scale: 0.97 }}
            data-active={active ? "true" : undefined}
            className={cn(
              "gradient-ring group relative flex min-w-0 items-center gap-3 rounded-xl bg-white text-left ring-1 ring-ink-200 transition-[box-shadow,background-color,transform] duration-200",
              "hover:-translate-y-0.5 hover:shadow-soft focus-energy",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
              size === "sm" ? "px-3 py-2.5" : "px-3.5 py-3",
              active && "bg-gradient-to-br from-royal-50/70 via-white to-coral-50/50 ring-transparent shadow-energy-sm"
            )}
          >
            {showLogo && (
              <span className="shrink-0">
                {o.icon ?? (
                  <BankLogo name={o.label} size={size === "sm" ? 30 : 36} />
                )}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate font-semibold",
                  size === "sm" ? "text-xs" : "text-sm",
                  active ? "text-royal-900" : "text-ink-900"
                )}
              >
                {o.label}
              </span>
              {o.meta && (
                <span className="block truncate text-[11px] text-ink-500">{o.meta}</span>
              )}
            </span>
            <span
              aria-hidden
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-all",
                active
                  ? "bg-energy-gradient text-white shadow-energy-sm"
                  : "bg-ink-100 text-transparent group-hover:bg-ink-200"
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
