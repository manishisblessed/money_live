"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Warning } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { useSchemeGate } from "@/lib/useSchemeGate";

/**
 * Scheme gate banner: network users without an assigned active scheme
 * cannot transact. Shown on every dashboard page until admin assigns a scheme.
 */
export function SchemeGateBanner() {
  const { blocked } = useSchemeGate();

  if (!blocked) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-4 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:flex-row sm:items-center"
    >
      <IconTile icon={Warning} tone="amber" size="lg" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-semibold tracking-[-0.02em] text-ink-900">
          Transactions are paused — no plan assigned yet
        </p>
        <p className="mt-0.5 text-sm text-ink-600">
          Your admin needs to assign you a scheme before payouts, bill payments, settlements
          or any other transaction can go through. Ask your admin to activate you.
        </p>
      </div>
      <Link
        href="/dashboard/disputes"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-ink-950 px-4 text-sm font-semibold text-white transition hover:bg-ink-800 focus-energy"
      >
        Contact support
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
