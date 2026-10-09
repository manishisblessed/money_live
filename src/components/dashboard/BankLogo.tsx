"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { bankLogoPath } from "@/lib/bank-logos";
import { cn } from "@/lib/utils";

/**
 * Bank / credit-card issuer logo tile.
 *
 * Resolves the real self-hosted SVG for an operator name (case-insensitive,
 * tolerant of "CREDIT CARD"/"ONE"/"CARD" noise words — see `lib/bank-logos`)
 * and renders it inside a fixed, white, rounded container with `object-contain`
 * so the artwork is never stretched or distorted.
 *
 * When no logo matches — or the asset fails to load — it degrades to the
 * generic credit-card glyph on the Emoney energy gradient, exactly as
 * required by the fallback spec.
 */
export function BankLogo({
  name,
  size = 42,
  className,
}: {
  /** Raw operator/bank display name from the API (never mutated). */
  name?: string | null;
  /** Square edge length in px. Defaults to 42. */
  size?: number;
  className?: string;
}) {
  const src = bankLogoPath(name);
  const [failed, setFailed] = useState(false);

  // Reset the error state when the resolved logo changes (e.g. list scrolls).
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showLogo = !!src && !failed;
  const radius = size >= 40 ? "rounded-2xl" : size >= 28 ? "rounded-xl" : "rounded-lg";

  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-inset ring-ink-100 shadow-[0_1px_2px_rgba(14,22,38,0.06)]",
        radius,
        className
      )}
      aria-hidden="true"
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: size - 8, height: size - 8 }}
          className="object-contain"
        />
      ) : (
        // Generic fallback — Emoney energy gradient tile with a card glyph.
        <span className="grid h-full w-full place-items-center bg-energy-gradient text-white">
          <CreditCard style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.75} />
        </span>
      )}
    </span>
  );
}

/** Semantic alias for credit-card issuer usage. */
export const CreditCardBankLogo = BankLogo;
