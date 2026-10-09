"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export type StepRailStep = { readonly label: string };

export interface StepRailProps {
  steps: readonly StepRailStep[];
  /** Zero-based index of the active step. */
  current: number;
  /** Background behind the rail — controls the halo colour around each dot. */
  surface?: "page" | "card";
  /** Show per-step labels under the dots (desktop only). */
  labels?: boolean;
  className?: string;
}

/**
 * "Progress snake" — numbered dots joined by a track whose energy-gradient
 * fill grows to the active step. Purely presentational: the parent owns the
 * step index, order and validation.
 */
export function StepRail({
  steps,
  current,
  surface = "page",
  labels = true,
  className,
}: StepRailProps) {
  const reduce = useReducedMotion();
  const n = steps.length;
  const active = Math.min(Math.max(current, 0), Math.max(n - 1, 0));
  const pct = n > 1 ? (active / (n - 1)) * 100 : 100;
  // Track runs from first dot centre to last dot centre; with equal flex
  // columns each centre sits at (i + 0.5) / n of the width.
  const inset = n > 0 ? `${50 / n}%` : "0%";
  const halo = surface === "card" ? "ring-white" : "ring-[#f6f7fb]";

  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="relative flex items-start">
        <div
          aria-hidden
          className="absolute top-4 h-0.5 -translate-y-1/2 rounded-full bg-ink-200"
          style={{ left: inset, right: inset }}
        >
          <motion.div
            className="relative h-full rounded-full bg-energy-gradient-x"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 22, mass: 0.8 }
            }
          >
            {/* snake head */}
            <span className="absolute -right-1 top-1/2 flex h-2 w-2 -translate-y-1/2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-70 animate-ping-soft" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" />
            </span>
          </motion.div>
        </div>

        {steps.map((s, i) => {
          const state = i < active ? "done" : i === active ? "current" : "todo";
          return (
            <li
              key={`${s.label}-${i}`}
              className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
              aria-current={state === "current" ? "step" : undefined}
            >
              <motion.span
                initial={false}
                animate={
                  reduce
                    ? undefined
                    : { scale: state === "current" ? 1.08 : 1 }
                }
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-xs font-bold ring-4 transition-colors duration-300",
                  halo,
                  state === "done" && "bg-energy-gradient text-white shadow-energy-sm",
                  state === "current" &&
                    "bg-white text-brand-700 shadow-energy-sm outline outline-2 outline-brand-500",
                  state === "todo" && "bg-white text-ink-400 outline outline-1 outline-ink-200"
                )}
              >
                {state === "done" ? (
                  <Check size={14} weight="bold" aria-hidden />
                ) : (
                  <span className="font-display">{i + 1}</span>
                )}
                <span className="sr-only">
                  {state === "done" ? "Completed: " : state === "current" ? "Current: " : ""}
                  {s.label}
                </span>
              </motion.span>
              {labels && (
                <span
                  aria-hidden
                  className={cn(
                    "hidden w-full px-0.5 text-[10px] font-semibold leading-tight lg:block",
                    state === "current"
                      ? "text-ink-900"
                      : state === "done"
                        ? "text-ink-600"
                        : "text-ink-400"
                  )}
                >
                  {s.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p
        className={cn(
          "mt-3 text-center text-xs text-ink-500",
          labels ? "lg:hidden" : ""
        )}
      >
        <span className="font-semibold text-ink-900">
          Step {active + 1} of {n}
        </span>
        {steps[active]?.label ? <> · {steps[active].label}</> : null}
      </p>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   StepPanels — slides the active step panel in/out with AnimatePresence.
   Keyed by `step`; direction follows the index delta.
   ────────────────────────────────────────────────────────────────────── */

export function StepPanels({
  step,
  children,
  className,
}: {
  step: number | string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const prev = useRef(step);
  const dir =
    typeof step === "number" && typeof prev.current === "number"
      ? step >= prev.current
        ? 1
        : -1
      : 1;

  useEffect(() => {
    prev.current = step;
  }, [step]);

  const distance = reduce ? 0 : 28;

  return (
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.div
        key={step}
        custom={dir}
        variants={{
          enter: (d: number) => ({ opacity: 0, x: distance * d }),
          center: { opacity: 1, x: 0 },
          exit: (d: number) => ({ opacity: 0, x: -distance * d }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: reduce ? 0.12 : 0.28, ease: EASE }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
