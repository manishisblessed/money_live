import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Emoney PageHeader — v2 "Bharat Energy".
 *
 * Server-safe (no hooks) so server-component pages can keep passing a Lucide
 * `icon`. Entrance uses the CSS `animate-fade-up` keyframe, which the global
 * reduced-motion rule neutralises automatically.
 *
 * Backward-compatible: `eyebrow`, `title`, `description`, `actions` keep their
 * meaning. New optional props: `breadcrumbs`, `icon`, `tone`, `meta`.
 */
export type PageHeaderTone = "brand" | "accent" | "royal" | "coral";
export type PageHeaderBreadcrumb = { label: string; href?: string };

const TONE_TILE: Record<PageHeaderTone, string> = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  accent: "bg-accent-50 text-accent-700 ring-accent-100",
  royal: "bg-royal-50 text-royal-600 ring-royal-100",
  coral: "bg-coral-50 text-coral-600 ring-coral-100",
};

const TONE_EYEBROW: Record<PageHeaderTone, string> = {
  brand: "text-brand-700",
  accent: "text-accent-700",
  royal: "text-royal-700",
  coral: "text-coral-700",
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  icon: Icon,
  tone = "brand",
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Optional trail rendered above the eyebrow. Items without `href` render as plain text. */
  breadcrumbs?: PageHeaderBreadcrumb[];
  /** Optional Lucide icon shown in a tinted tile beside the title (hidden on xs). */
  icon?: LucideIcon;
  /** Tints the icon tile + eyebrow. Defaults to brand. */
  tone?: PageHeaderTone;
  /** Chips / small facts row rendered under the description (e.g. Badges). */
  meta?: ReactNode;
}) {
  return (
    <header className="mb-8 animate-fade-up motion-reduce:animate-none">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-500">
            {breadcrumbs.map((b, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={`${b.label}-${i}`} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-ink-300" aria-hidden />}
                  {b.href && !last ? (
                    <Link
                      href={b.href}
                      className="rounded-md px-1 py-0.5 font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
                    >
                      {b.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? "page" : undefined}
                      className={cn("px-1 py-0.5", last ? "font-semibold text-ink-800" : "font-medium")}
                    >
                      {b.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          {Icon && (
            <span
              className={cn(
                "hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset sm:inline-flex",
                TONE_TILE[tone]
              )}
              aria-hidden
            >
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p
                className={cn(
                  "flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]",
                  TONE_EYEBROW[tone]
                )}
              >
                <span className="brand-dot" aria-hidden />
                {eyebrow}
              </p>
            )}
            <h1
              className={cn(
                "font-display text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink-950 md:text-[2rem]",
                eyebrow && "mt-1.5"
              )}
            >
              {title}
            </h1>
            <span
              aria-hidden
              className="mt-3 block h-1 w-12 rounded-full bg-energy-gradient-x"
            />
            {description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">{description}</p>
            )}
            {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
