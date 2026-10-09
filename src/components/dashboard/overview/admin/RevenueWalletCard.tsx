"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ArrowRight, RefreshCw } from "lucide-react";
import { Bank } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { formatINR, cn } from "@/lib/utils";

/**
 * Master-admin Revenue Wallet card for the overview: TODAY's MDR margin in,
 * commission paid out, and the current Revenue Wallet balance — so the platform
 * owner never has to go hunting for company earnings. Owner-only: the backing
 * endpoint (view=revenue) 403s for non-master roles, so the card renders nothing
 * for anyone else.
 */

type RevenueSummary = {
  accountId: string | null;
  balance: number;
  marginInToday: number;
  commissionOutToday: number;
  netToday: number;
};

export function RevenueWalletCard() {
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/wallet/aggregates?view=revenue");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (res.ok) setData(await res.json());
    } catch {
      /* keep last data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Not the platform owner → nothing to show.
  if (forbidden) return null;

  const netPositive = (data?.netToday ?? 0) >= 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-royal-100 bg-white p-6 shadow-sm">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-royal-500/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-coral-400/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={Bank} tone="royal" size="md" />
          <div>
            <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-ink-900">Revenue Wallet</h3>
            <p className="text-[11px] text-ink-500">Company earnings · today (IST)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={load}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-ink-200 bg-white text-ink-600 transition hover:border-royal-200 hover:text-royal-700 focus-energy"
            aria-label="Refresh revenue wallet"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <Link
            href="/dashboard/admin/revenue"
            className="inline-flex h-9 items-center gap-1 rounded-2xl bg-ink-950 px-3.5 text-xs font-semibold text-white transition hover:bg-ink-800 focus-energy"
          >
            Company Earnings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-inset ring-emerald-100">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
            <ArrowDownRight className="h-3.5 w-3.5" /> Margin In · Today
          </div>
          <p className={cn("mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-emerald-700", !data && "animate-pulse text-emerald-700/40")}>
            {data ? formatINR(data.marginInToday) : "₹ ——"}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50/70 p-4 ring-1 ring-inset ring-rose-100">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-700/80">
            <ArrowUpRight className="h-3.5 w-3.5" /> Commission Out · Today
          </div>
          <p className={cn("mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-rose-600", !data && "animate-pulse text-rose-600/40")}>
            {data ? `−${formatINR(data.commissionOutToday)}` : "₹ ——"}
          </p>
        </div>
        <div className="grain relative overflow-hidden rounded-2xl bg-ink-950 p-4 text-white">
          <div className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
            Wallet Balance
          </div>
          <p className={cn("relative z-10 mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em]", !data && "animate-pulse text-white/40")}>
            {data ? formatINR(data.balance) : "₹ ——"}
          </p>
        </div>
      </div>

      <p className="relative mt-4 text-[11px] text-ink-500">
        Net booked today (margin − commission):{" "}
        <span className={cn("font-semibold tabular-nums", netPositive ? "text-emerald-700" : "text-rose-600")}>
          {data ? formatINR(data.netToday) : "…"}
        </span>{" "}
        · credited to the Revenue Wallet at settlement time.
      </p>
    </section>
  );
}
