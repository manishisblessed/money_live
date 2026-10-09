"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShieldSlash } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { useSchemeGate } from "@/lib/useSchemeGate";

/**
 * Blocks the wrapped content when the user has no active scheme assigned.
 * Unlike SchemeGateBanner (advisory warning), this prevents interaction
 * entirely — used on transaction pages (BBPS, Payout, Recharges, etc.)
 * so users don't fill out forms only to hit a backend 403.
 */
export function SchemeGateOverlay({ children }: { children: React.ReactNode }) {
  const { blocked, isLoading } = useSchemeGate();

  if (isLoading) return <>{children}</>;
  if (!blocked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-25 blur-[2px]" aria-hidden>
        {children}
      </div>

      <div className="absolute inset-0 z-10 flex items-start justify-center pt-16">
        <div
          role="alert"
          className="mx-4 w-full max-w-lg rounded-3xl border border-amber-200 bg-white/90 p-8 text-center shadow-energy backdrop-blur-md"
        >
          <IconTile icon={ShieldSlash} tone="amber" size="xl" className="mx-auto" />
          <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
            Transactions are paused
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
            Your admin needs to assign you a scheme before you can use this service.
            Ask your admin to activate you — it only takes a minute.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-2xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 transition hover:border-ink-300 focus-energy"
            >
              Back to overview
            </Link>
            <Link
              href="/dashboard/disputes"
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 focus-energy"
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
