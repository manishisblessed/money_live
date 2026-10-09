"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Quotes } from "@phosphor-icons/react";
import { testimonials } from "@/lib/data";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Rotating retailer quote for the auth brand panel. Cycles through
 * `testimonials` every `intervalMs`, text only. Purely presentational.
 */
export function RotatingQuote({
  intervalMs = 5000,
  className,
}: {
  intervalMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const count = testimonials.length;

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  const t = testimonials[index % Math.max(count, 1)];
  if (!t) return null;

  return (
    <figure className={cn("relative", className)}>
      <Quotes size={28} weight="duotone" className="text-white/40" aria-hidden />
      <div className="relative mt-3 min-h-[10rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={index}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE }}
          >
            <p className="text-lg font-medium leading-snug text-white/90 xl:text-xl">
              &ldquo;{t.quote}&rdquo;
            </p>
            <figcaption className="mt-5 flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 font-display text-xs font-semibold tracking-wide text-white ring-1 ring-inset ring-white/15"
              >
                {initialsOf(t.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-white">{t.name}</span>
                <span className="block truncate text-white/55">{t.role}</span>
              </span>
            </figcaption>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center gap-1.5" role="tablist" aria-label="Retailer stories">
          {testimonials.map((item, i) => (
            <button
              key={`${item.name}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show story ${i + 1} of ${count}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-energy-gradient-x" : "w-1.5 bg-white/25 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </figure>
  );
}
