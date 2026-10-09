import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Emoney Card — Phase 1 redesign.
 *
 * Shape language that differentiates from Nextgen:
 *  · `rounded-3xl` by default (24px) instead of `rounded-2xl` (16px).
 *  · Default surface still ships with just `shadow-sm` so dense admin tables
 *    stay calm, but a new `interactive` prop opts a card into the Emoney
 *    "lift + colored energy glow" hover microinteraction.
 *  · Optional inner highlight stroke (`inner-ring`) adds a crisp top edge
 *    reminiscent of brushed glass.
 */
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Enables lift + colored energy glow on hover. Default: false. */
    interactive?: boolean;
    /** Adds the subtle inner highlight stroke (good on tinted cards). */
    highlight?: boolean;
  }
>(({ className, interactive, highlight, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-ink-100 bg-white shadow-sm",
      "transition-[transform,box-shadow,border-color] duration-300 ease-out",
      highlight && "shadow-inner-ring",
      interactive &&
        "cursor-pointer hover:-translate-y-1 hover:border-brand-200 hover:shadow-energy",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6 pb-3", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // Clash Display at title scale with Emoney tracking.
      "font-display text-lg font-semibold tracking-[-0.02em] text-ink-900",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-ink-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
