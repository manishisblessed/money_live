"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimation, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Segmented numeric PIN input — one box per digit, auto-advance, backspace
 * to previous, paste-aware, digits masked like a card terminal.
 *
 * Presentation: squircle boxes, energy ring on the active box, digits flip in,
 * and the whole row shakes when `error` flips to true.
 */
export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  disabled = false,
  masked = true,
  id = "pin",
  error = false,
  className,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  masked?: boolean;
  id?: string;
  /** When it turns true the row shakes and boxes tint coral. Presentation only. */
  error?: boolean;
  className?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const rowControls = useAnimation();
  const prevError = useRef(false);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (error && !prevError.current && !reduce) {
      rowControls.start({
        x: [0, -8, 8, -6, 6, -3, 3, 0],
        transition: { duration: 0.45, ease: "easeInOut" },
      });
    }
    prevError.current = error;
  }, [error, reduce, rowControls]);

  function commit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  }

  function handleChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const chars = value.split("");
    chars[i] = digit;
    const next = chars.join("").slice(0, length);
    commit(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Never let Enter bubble into an enclosing form (the dialog may be
      // rendered inside one); a complete PIN submits via onComplete instead.
      e.preventDefault();
      if (value.length === length) onComplete?.(value);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.split("");
      if (chars[i]) {
        chars[i] = "";
        commit(chars.join(""));
      } else if (i > 0) {
        chars[i - 1] = "";
        commit(chars.join(""));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    commit(pasted);
    const filled = Math.min(pasted.replace(/\D/g, "").length, length) - 1;
    if (filled >= 0) refs.current[Math.min(filled, length - 1)]?.focus();
  }

  return (
    <motion.div
      animate={rowControls}
      className={cn("flex justify-center gap-2 sm:gap-3", className)}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, i) => {
        const digit = value[i] ?? "";
        const isActive = focusIdx === i && !disabled;
        const filled = digit.length > 0;
        return (
          <div key={i} className="relative">
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={i === 0 ? id : undefined}
              type={masked ? "password" : "text"}
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              disabled={disabled}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={() => setFocusIdx(i)}
              onBlur={() => setFocusIdx((cur) => (cur === i ? null : cur))}
              aria-label={`PIN digit ${i + 1}`}
              aria-invalid={error || undefined}
              className={cn(
                "peer h-12 w-10 rounded-2xl border bg-white text-center text-transparent caret-brand-600 outline-none sm:h-14 sm:w-12",
                "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
                "disabled:cursor-not-allowed disabled:bg-ink-50",
                error
                  ? "border-coral-300 bg-coral-50/40"
                  : filled
                    ? "border-ink-300"
                    : "border-ink-200",
                isActive && !error && "border-brand-500 ring-2 ring-brand-500 shadow-energy-sm",
                isActive && error && "border-coral-500 ring-2 ring-coral-400"
              )}
            />
            {/* Visual digit overlay — the real value lives in the input above. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <AnimatePresence initial={false}>
                {filled && (
                  <motion.span
                    key={masked ? "dot" : digit}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, rotateX: -80, y: 4 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, rotateX: 80, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformPerspective: 400 }}
                    className={cn(
                      "absolute font-display text-xl font-semibold sm:text-2xl",
                      disabled ? "text-ink-400" : error ? "text-coral-700" : "text-ink-900"
                    )}
                  >
                    {masked ? "•" : digit}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}
