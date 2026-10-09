import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Emoney Spinner — v2 "energy ring".
 *
 * A conic purple→blue→coral gradient ring (masked to a stroke) that spins,
 * replacing the generic Lucide `Loader2` glyph. Same API as before:
 * `size` (sm | md | lg | page), `className`, `label`.
 */
const sizeMap = {
  sm: "h-3.5 w-3.5 [--ring:2px]",
  md: "h-5 w-5 [--ring:2.5px]",
  lg: "h-8 w-8 [--ring:3px]",
  page: "h-11 w-11 [--ring:3.5px]",
} as const;

const ringStyle: CSSProperties = {
  background:
    "conic-gradient(from 0deg, rgba(124,58,237,0) 0deg, rgba(124,58,237,0.15) 90deg, #7c3aed 200deg, #2563eb 290deg, #f43f5e 360deg)",
  WebkitMask:
    "radial-gradient(farthest-side, transparent calc(100% - var(--ring)), #000 calc(100% - var(--ring) + 0.5px))",
  mask: "radial-gradient(farthest-side, transparent calc(100% - var(--ring)), #000 calc(100% - var(--ring) + 0.5px))",
};

export function Spinner({
  size = "md",
  className,
  label = "Loading",
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "relative inline-block shrink-0 rounded-full animate-spin",
        sizeMap[size],
        className
      )}
      style={ringStyle}
    />
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="relative grid place-items-center">
          <span
            aria-hidden
            className="absolute h-16 w-16 rounded-full bg-energy-gradient opacity-15 blur-xl"
          />
          <Spinner size="page" label={label} />
        </span>
        <p className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-600">
          {label}
        </p>
      </div>
    </div>
  );
}
