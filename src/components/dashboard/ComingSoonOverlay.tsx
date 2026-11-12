"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rocket, Clock } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";

/**
 * Blocks the wrapped page content when a service is not yet live.
 * Renders the page blurred + non-interactive with a "Coming Soon" card on top.
 * Used for services like DMT that exist in the codebase but aren't launched yet.
 */
export function ComingSoonOverlay({
  children,
  title = "Coming Soon",
  description = "This service is under development and will be available shortly. Stay tuned!",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative">
      <div
        className="pointer-events-none select-none opacity-20 blur-[3px] grayscale"
        aria-hidden
      >
        {children}
      </div>

      <div className="absolute inset-0 z-10 flex items-start justify-center pt-16">
        <div
          role="alert"
          className="mx-4 w-full max-w-lg rounded-3xl border border-brand-200 bg-white/95 p-8 text-center shadow-energy backdrop-blur-md dark:border-brand-800 dark:bg-ink-900/95"
        >
          <div className="mx-auto flex items-center justify-center gap-2">
            <IconTile icon={Rocket} tone="brand" size="xl" />
          </div>

          <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900 dark:text-white">
            {title}
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600 dark:text-ink-400">
            {description}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
            <Clock weight="duotone" className="h-4 w-4" />
            We&rsquo;re working on it — launching soon!
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-2xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 transition hover:border-ink-300 focus-energy dark:border-ink-700 dark:bg-ink-800 dark:text-ink-200 dark:hover:border-ink-600"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/dashboard/disputes"
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 focus-energy dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100"
            >
              Contact support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
