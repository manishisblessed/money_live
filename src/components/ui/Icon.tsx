"use client";

import * as React from "react";
import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Emoney IconTile — Phase 1 brand treatment for icons.
 *
 * Instead of rendering a bare `lucide` glyph (what Nextgen almost certainly
 * does), every "service / nav / stat" icon in Emoney is wrapped in a tinted
 * rounded tile with a Phosphor duotone glyph on top. This is the single
 * biggest change to the perceived icon silhouette across the whole product.
 *
 * Backward-compatible usage:
 *   import { PhoneCall } from "@phosphor-icons/react";
 *   <IconTile icon={PhoneCall} tone="brand" size="md" />
 *
 * You can also pass any React node via `children` for custom glyphs.
 */
export type IconTone =
  | "brand"
  | "accent"
  | "royal"
  | "coral"
  | "amber"
  | "ink"
  | "energy";

export type IconTileSize = "xs" | "sm" | "md" | "lg" | "xl";

const toneStyles: Record<IconTone, string> = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  accent: "bg-accent-50 text-accent-700 ring-accent-100",
  royal: "bg-royal-50 text-royal-600 ring-royal-100",
  coral: "bg-coral-50 text-coral-600 ring-coral-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  ink: "bg-ink-100 text-ink-700 ring-ink-200",
  energy:
    "bg-energy-gradient text-white ring-white/30 shadow-energy-sm",
};

const sizeStyles: Record<IconTileSize, { tile: string; icon: number }> = {
  xs: { tile: "h-7 w-7 rounded-lg", icon: 14 },
  sm: { tile: "h-8 w-8 rounded-xl", icon: 16 },
  md: { tile: "h-10 w-10 rounded-xl", icon: 20 },
  lg: { tile: "h-12 w-12 rounded-2xl", icon: 24 },
  xl: { tile: "h-14 w-14 rounded-2xl", icon: 28 },
};

export interface IconTileProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** A Phosphor icon component (e.g. `PhoneCall` from `@phosphor-icons/react`). */
  icon?: PhosphorIcon;
  /** Override children — any React node is rendered inside the tile. */
  children?: React.ReactNode;
  tone?: IconTone;
  size?: IconTileSize;
  /** Phosphor weight — Emoney defaults to `duotone` for its distinct silhouette. */
  weight?: IconWeight;
}

export const IconTile = React.forwardRef<HTMLSpanElement, IconTileProps>(
  (
    {
      icon: IconComp,
      children,
      tone = "brand",
      size = "md",
      weight = "duotone",
      className,
      ...rest
    },
    ref
  ) => {
    const dims = sizeStyles[size];
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex shrink-0 items-center justify-center ring-1 ring-inset transition-colors",
          dims.tile,
          toneStyles[tone],
          className
        )}
        {...rest}
      >
        {IconComp ? (
          <IconComp size={dims.icon} weight={weight} aria-hidden />
        ) : (
          children
        )}
      </span>
    );
  }
);
IconTile.displayName = "IconTile";
