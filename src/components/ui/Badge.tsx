import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Emoney Badge — Phase 1 redesign.
 *
 * Shape language that differentiates from Nextgen:
 *  · Duotone fill — soft tinted background + bold hue text, slightly deeper
 *    than Nextgen's probable pastel-100 chips.
 *  · Optional live `dot` with a soft ping ring (great for "Live", "New",
 *    online-indicators).
 *  · New `energy` variant uses the signature purple→coral gradient fill —
 *    reserved for "Beta" / "AI" / "New-plus" kinds of highlights.
 */
const badgeStyles = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-ink-100/80 text-ink-700 ring-ink-200/70",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warning: "bg-amber-50 text-amber-800 ring-amber-200",
        danger: "bg-rose-50 text-rose-700 ring-rose-200",
        brand: "bg-brand-50 text-brand-700 ring-brand-200",
        accent: "bg-accent-50 text-accent-700 ring-accent-200",
        royal: "bg-royal-50 text-royal-700 ring-royal-200",
        coral: "bg-coral-50 text-coral-700 ring-coral-200",
        /**
         * Signature Emoney "energy" badge — purple→coral gradient fill with
         * white text. Use sparingly for truly-featured items.
         */
        energy:
          "bg-energy-gradient-x text-white ring-white/30 shadow-energy-sm",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {
  /** Shows a soft pulsing dot before the label (great for Live / New). */
  dot?: boolean;
}

const dotColor: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-ink-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  brand: "bg-brand-500",
  accent: "bg-accent-500",
  royal: "bg-royal-500",
  coral: "bg-coral-500",
  energy: "bg-white",
};

export function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ variant, size }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping-soft",
              dotColor[variant ?? "default"]
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              dotColor[variant ?? "default"]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
