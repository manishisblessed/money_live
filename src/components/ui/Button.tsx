"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Emoney Button — Phase 1 redesign.
 *
 * Shape language that differentiates from Nextgen:
 *  · Squircle corners (rounded-2xl) instead of pill.
 *  · Primary variant uses the signature purple→coral `energy-gradient` and
 *    carries a built-in shine sweep + colored "energy" shadow on hover.
 *  · All variants share a soft focus ring (`focus-energy`) — purple-coral
 *    glow instead of a hard blue outline.
 *  · Trailing SVG icons slide right on hover (preserved from v1).
 *
 * API is intentionally backward-compatible with the previous `Button` —
 * callers keep `variant`, `size`, `isLoading`, `className`, and all native
 * `<button>` props.
 */
const buttonStyles = cva(
  [
    "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-2xl font-semibold will-change-transform select-none isolate overflow-hidden",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out",
    "focus-energy",
    "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out",
    "hover:[&_svg:last-child]:translate-x-0.5",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — signature Emoney energy gradient + colored shadow.
        primary:
          "btn-shine bg-energy-gradient text-white shadow-energy-sm hover:shadow-energy",
        // Secondary — solid ink, calm, for high-density admin UIs.
        secondary:
          "bg-ink-900 text-white hover:bg-ink-800 hover:shadow-soft",
        // Outline — white surface with a gradient ring that lights up on hover.
        outline:
          "gradient-ring border border-ink-200 bg-white text-ink-900 hover:text-ink-900 hover:shadow-soft",
        // Ghost — zero chrome, used in tables & dense admin.
        ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
        // Accent — growth-green CTA, mirrors primary structure.
        accent:
          "btn-shine bg-gradient-to-r from-accent-500 to-accent-400 text-ink-900 shadow-energy-sm hover:shadow-energy",
        // Danger — destructive confirms (sign-out, delete).
        danger:
          "bg-gradient-to-r from-coral-600 to-coral-500 text-white shadow-energy-sm hover:shadow-glow-coral",
        link: "text-brand-700 underline-offset-4 hover:underline hover:translate-y-0",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  isLoading?: boolean;
  /**
   * When true, the button follows the cursor slightly on hover (magnetic
   * microinteraction). Enabled by default on the `primary` and `accent`
   * variants to make headline CTAs feel alive — opt out via `magnetic={false}`.
   */
  magnetic?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      disabled,
      children,
      magnetic,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const localRef = React.useRef<HTMLButtonElement | null>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

    // Magnetic effect defaults on for the "look at me" variants.
    const isMagnetic =
      magnetic ?? (variant === "primary" || variant === "accent" || variant === "danger");

    const handleMove = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onMouseMove?.(e);
        if (!isMagnetic) return;
        if (typeof window !== "undefined") {
          const prefersReduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;
          if (prefersReduce) return;
        }
        const el = localRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        // Cap the magnetic offset — subtle, not jittery.
        const strength = 0.18;
        el.style.transform = `translate3d(${relX * strength}px, ${relY * strength - 2}px, 0)`;
      },
      [isMagnetic, onMouseMove]
    );

    const handleLeave = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onMouseLeave?.(e);
        if (!isMagnetic) return;
        const el = localRef.current;
        if (!el) return;
        el.style.transform = "";
      },
      [isMagnetic, onMouseLeave]
    );

    return (
      <button
        ref={localRef}
        className={cn(buttonStyles({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        {...props}
      >
        {isLoading && (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
