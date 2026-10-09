"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Emoney Modal — Phase 1 redesign.
 *
 * Shape language that differentiates from Nextgen:
 *  · `rounded-3xl` surface with a gradient-tinted header slab.
 *  · Backdrop is a blurred dark layer *plus* a subtle grain overlay for the
 *    premium film-grain feel.
 *  · Opens with a spring + slight scale, closes with a quick ease.
 *  · Backward-compatible API — same props as before, same callers work.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  size = "md",
  className,
  headerClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  headerClassName?: string;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const maxW =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
        ? "max-w-2xl"
        : size === "xl"
          ? "max-w-3xl"
          : "max-w-xl";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto px-4 py-6">
          {/* Backdrop — blurred ink with a touch of grain for premium feel */}
          <motion.button
            type="button"
            aria-label="Close dialog backdrop"
            className="fixed inset-0 grain bg-ink-900/50 backdrop-blur-md"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
            onClick={onClose}
          />
          {/* Panel — spring in, slight scale, Emoney 3xl corners */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    type: "spring",
                    stiffness: 240,
                    damping: 24,
                    mass: 0.9,
                  }
            }
            className={cn(
              "relative z-10 flex w-full max-h-[min(90dvh,720px)] flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-energy",
              maxW,
              className
            )}
          >
            {(title || eyebrow) && (
              <div
                className={cn(
                  // Signature Emoney header slab — tinted energy gradient tail
                  // with the brand-dot in the eyebrow position.
                  "relative flex shrink-0 items-start justify-between gap-4 overflow-hidden px-6 py-5",
                  "bg-gradient-to-br from-brand-50 via-white to-coral-50/40",
                  headerClassName
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-energy-gradient opacity-20 blur-3xl"
                />
                <div className="relative min-w-0">
                  {eyebrow && (
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-700">
                      <span className="brand-dot" />
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <h3 className="mt-1 font-display text-xl font-bold tracking-[-0.02em] text-ink-900">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-xs text-ink-600">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl text-ink-500 transition hover:bg-white/70 hover:text-ink-900 hover:shadow-sm"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {children}
            </div>

            {footer && (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/40 px-6 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
