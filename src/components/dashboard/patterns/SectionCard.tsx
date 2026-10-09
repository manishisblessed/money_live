import * as React from "react";
import { cn } from "@/lib/utils";

type Padding = "none" | "sm" | "md" | "lg";

const paddings: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

type Tone = "default" | "brand" | "accent" | "royal" | "coral" | "amber" | "ink";

const tones: Record<Tone, string> = {
  default: "bg-white ring-ink-100",
  brand: "bg-gradient-to-br from-brand-50/80 to-white ring-brand-100",
  accent: "bg-gradient-to-br from-accent-50/80 to-white ring-accent-100",
  royal: "bg-gradient-to-br from-royal-50/80 to-white ring-royal-100",
  coral: "bg-gradient-to-br from-coral-50/80 to-white ring-coral-100",
  amber: "bg-gradient-to-br from-amber-50/80 to-white ring-amber-100",
  ink: "bg-ink-950 text-white ring-ink-900",
};

/**
 * Emoney SectionCard — the standard rounded-3xl surface for dashboard
 * sections. Optional header row (title / description / action) sits above
 * the body with a hairline divider. `padding` controls the body only so
 * tables can go edge-to-edge with `padding="none"`.
 */
export function SectionCard({
  title,
  description,
  action,
  eyebrow,
  icon,
  tone = "default",
  padding = "md",
  className,
  bodyClassName,
  children,
  ...rest
}: Omit<React.HTMLAttributes<HTMLElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Tiny uppercase label above the title. */
  eyebrow?: React.ReactNode;
  /** Usually an `<IconTile />`. Rendered left of the title. */
  icon?: React.ReactNode;
  tone?: Tone;
  padding?: Padding;
  bodyClassName?: string;
}) {
  const hasHeader = title || description || action || eyebrow;
  const isInk = tone === "ink";
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-3xl ring-1 shadow-sm",
        tones[tone],
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 px-5 py-4 md:px-6",
            isInk ? "border-b border-white/10" : "border-b border-ink-100"
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {icon}
            <div className="min-w-0">
              {eyebrow && (
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.18em]",
                    isInk ? "text-white/60" : "text-brand-700"
                  )}
                >
                  {eyebrow}
                </p>
              )}
              {title && (
                <h3
                  className={cn(
                    "font-display text-base font-semibold tracking-[-0.02em] md:text-lg",
                    isInk ? "text-white" : "text-ink-900"
                  )}
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    isInk ? "text-white/70" : "text-ink-500"
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn(paddings[padding], bodyClassName)}>{children}</div>
    </section>
  );
}
