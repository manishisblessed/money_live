import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Emoney ServicePageHeader — v2 "service hero band".
 *
 * A `rounded-4xl` panel with a soft tinted gradient + film grain, a gradient
 * icon tile, back-link pill, eyebrow, Clash Display title and an `aside` slot
 * for limit / commission chips supplied by the page.
 *
 * Server-safe on purpose: bill-pay and recharge pages are server components
 * that pass Lucide icon functions, so this file must not become a client
 * component.
 */
export type ServicePageTone = "brand" | "accent" | "royal" | "coral" | "energy";

const BAND_BG: Record<ServicePageTone, string> = {
  energy: "from-brand-50 via-white to-coral-50/40",
  brand: "from-brand-50 via-white to-brand-50/40",
  accent: "from-accent-50 via-white to-brand-50/30",
  royal: "from-royal-50 via-white to-coral-50/30",
  coral: "from-coral-50 via-white to-royal-50/30",
};

const TILE_BG: Record<ServicePageTone, string> = {
  energy: "bg-energy-gradient shadow-energy-sm",
  brand: "bg-gradient-to-br from-brand-600 to-brand-400 shadow-glow-brand",
  accent: "bg-gradient-to-br from-accent-600 to-accent-400 shadow-soft",
  royal: "bg-gradient-to-br from-royal-600 to-royal-400 shadow-glow",
  coral: "bg-gradient-to-br from-coral-600 to-coral-400 shadow-glow-coral",
};

const EYEBROW_TEXT: Record<ServicePageTone, string> = {
  energy: "text-brand-700",
  brand: "text-brand-700",
  accent: "text-accent-700",
  royal: "text-royal-700",
  coral: "text-coral-700",
};

export function ServicePageHeader({
  icon: Icon,
  title,
  description,
  back = "/dashboard",
  aside,
  tone = "energy",
  eyebrow,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  back?: string;
  /** Right-hand slot for limit / commission chips, balance pills, etc. */
  aside?: ReactNode;
  /** Tints the band + icon tile. Defaults to the signature energy gradient. */
  tone?: ServicePageTone;
  /** Small uppercase label above the title (e.g. "BBPS · Utilities"). */
  eyebrow?: string;
}) {
  return (
    <section
      className={cn(
        "grain relative mb-8 overflow-hidden rounded-4xl border border-ink-100/80 bg-gradient-to-br p-5 shadow-sm sm:p-6 md:p-8",
        "animate-fade-up motion-reduce:animate-none",
        BAND_BG[tone]
      )}
    >
      {/* Soft gradient blooms */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-energy-gradient opacity-[0.12] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-accent-300 opacity-[0.10] blur-3xl"
      />

      <div className="relative z-[1] flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4 md:gap-5">
          <span
            aria-hidden
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ring-1 ring-inset ring-white/30",
              TILE_BG[tone]
            )}
          >
            <Icon className="h-7 w-7" strokeWidth={1.75} />
          </span>

          <div className="min-w-0">
            <Link
              href={back}
              className="inline-flex items-center gap-1 rounded-full border border-ink-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink-600 shadow-sm backdrop-blur transition hover:border-brand-200 hover:text-brand-700"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden /> Back
            </Link>

            {eyebrow && (
              <p
                className={cn(
                  "mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]",
                  EYEBROW_TEXT[tone]
                )}
              >
                <span className="brand-dot" aria-hidden />
                {eyebrow}
              </p>
            )}

            <h1
              className={cn(
                "font-display text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink-950 md:text-3xl",
                eyebrow ? "mt-1.5" : "mt-3"
              )}
            >
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">{description}</p>
          </div>
        </div>

        {aside && (
          <div className="flex flex-wrap items-center gap-2 md:max-w-sm md:shrink-0 md:justify-end md:pt-1">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
