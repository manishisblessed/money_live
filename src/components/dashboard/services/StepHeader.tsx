"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
};

/**
 * StepHeader — step pills with a sliding `layoutId` highlight.
 *
 * Driven entirely by the page's EXISTING step state: `current` is the active
 * key; everything before it (in `steps` order) renders as done. Optional
 * `onSelect` lets completed steps act as back-links (pages decide).
 */
export function StepHeader({
  steps,
  current,
  onSelect,
  className,
  layoutId = "service-step-pill",
}: {
  steps: StepItem[];
  current: string;
  onSelect?: (key: string) => void;
  className?: string;
  layoutId?: string;
}) {
  const reduce = useReducedMotion();
  const currentIdx = Math.max(0, steps.findIndex((s) => s.key === current));

  return (
    <nav aria-label="Progress" className={cn("relative", className)}>
      <ol className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-ink-100/70 p-1.5">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const clickable = done && !!onSelect;
          return (
            <li key={s.key} className="relative min-w-0 flex-1">
              <button
                type="button"
                onClick={clickable ? () => onSelect?.(s.key) : undefined}
                disabled={!clickable}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors focus-energy",
                  active ? "text-white" : done ? "text-ink-800" : "text-ink-400",
                  clickable && "hover:text-brand-700",
                  !clickable && "cursor-default"
                )}
              >
                {active && (
                  <motion.span
                    layoutId={layoutId}
                    aria-hidden
                    className="absolute inset-0 rounded-xl bg-energy-gradient shadow-energy-sm"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 36 }
                    }
                  />
                )}
                <span
                  className={cn(
                    "relative grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                    active
                      ? "bg-white/20 text-white"
                      : done
                        ? "bg-accent-500 text-white"
                        : "bg-white text-ink-400 ring-1 ring-ink-200"
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="relative truncate">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * PillTabs — the same sliding-highlight treatment for peer tabs (not steps):
 * bill categories, QR streams, POS views. Pages keep their existing
 * `activeTab` state and pass it in.
 */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  layoutId = "service-pill-tab",
  fill = false,
  size = "md",
}: {
  tabs: { key: T; label: React.ReactNode; icon?: React.ReactNode; badge?: React.ReactNode }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  layoutId?: string;
  /** Stretch tabs to fill the row. */
  fill?: boolean;
  size?: "sm" | "md";
}) {
  const reduce = useReducedMotion();
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-2xl bg-ink-100/70 p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-colors focus-energy",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              fill && "flex-1",
              active ? "text-ink-900" : "text-ink-500 hover:text-ink-800"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-ink-200/60"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                }
              />
            )}
            {t.icon && (
              <span
                className={cn(
                  "relative [&>svg]:h-4 [&>svg]:w-4",
                  active ? "text-brand-600" : "text-ink-400"
                )}
              >
                {t.icon}
              </span>
            )}
            <span className="relative">{t.label}</span>
            {t.badge && <span className="relative">{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
