import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionIntro — editorial heading block for secondary marketing pages.
 * Distinct from the home page's pill-eyebrow `SectionHeading`: a brand-dot
 * eyebrow, an oversized Clash Display title and an optional side slot for a
 * CTA or counter.
 */
export function SectionIntro({
  eyebrow,
  title,
  description,
  aside,
  dark = false,
  className
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned slot (buttons, counters) on desktop. */
  aside?: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 md:mb-16 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="max-w-3xl">
        {eyebrow && (
          <span
            className={cn(
              "inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em]",
              dark ? "text-white/60" : "text-royal-700"
            )}
          >
            <span className="brand-dot" aria-hidden />
            {eyebrow}
          </span>
        )}
        <h2
          className={cn(
            "mt-4 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-5xl",
            dark ? "text-white" : "text-ink-950"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed md:text-lg",
              dark ? "text-white/65" : "text-ink-600"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
