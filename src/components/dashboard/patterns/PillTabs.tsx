"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PillTab<V extends string = string> = {
  value: V;
  label: React.ReactNode;
  /** Optional count / badge rendered after the label. */
  count?: number | string;
  icon?: LucideIcon;
  disabled?: boolean;
};

/**
 * Emoney PillTabs — controlled segmented tabs with a sliding gradient pill.
 *
 * Fully controlled via `value` / `onChange` so pages keep their existing
 * tab state and gating logic untouched. The active pill animates between
 * tabs with a framer-motion `layoutId`; respects reduced motion.
 */
export function PillTabs<V extends string = string>({
  tabs,
  value,
  onChange,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: {
  tabs: ReadonlyArray<PillTab<V>>;
  value: V;
  onChange: (value: V) => void;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}) {
  const reduce = useReducedMotion();
  const layoutId = React.useId();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-ink-100 shadow-sm",
        className
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={t.disabled}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative isolate inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition-colors focus-energy",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              active ? "text-white" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
              t.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {active && (
              <motion.span
                layoutId={reduce ? undefined : layoutId}
                aria-hidden
                className="absolute inset-0 -z-10 rounded-xl bg-energy-gradient shadow-energy-sm"
                transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.6 }}
              />
            )}
            {Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />}
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={cn(
                  "ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-ink-100 text-ink-600"
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
