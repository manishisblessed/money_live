"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { BankLogo } from "@/components/dashboard/BankLogo";
import type { Transaction } from "@/lib/data";
import { cn, formatINR } from "@/lib/utils";

const statusVariant: Record<
  Transaction["status"],
  "success" | "warning" | "danger"
> = {
  Success: "success",
  Pending: "warning",
  Failed: "danger",
};

const th =
  "whitespace-nowrap border-y border-ink-100 bg-ink-50/60 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500";
const td = "whitespace-nowrap border-b border-ink-100 px-5 py-3";
const firstTd =
  "relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-r-full before:bg-energy-gradient before:opacity-0 before:transition-opacity before:duration-200 before:content-[''] group-hover:before:opacity-100";

/**
 * Emoney TransactionsTable — v2 look, same data contract.
 * Pending rows get a live `dot` badge; bank/issuer artwork comes from
 * `BankLogo`; loading renders shimmer rows; empty state is retailer-first.
 */
export function TransactionsTable({
  data = [],
  showHeader = true,
  loading = false,
  showCommission = true,
}: {
  data?: Transaction[];
  showHeader?: boolean;
  loading?: boolean;
  /** Hide the Commission column (e.g. for retailers, where the settlement-rail
   *  commission on a txn belongs to the upline, not the retailer). */
  showCommission?: boolean;
}) {
  const colCount = showCommission ? 7 : 6;

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-ink-950 md:text-lg">
              Recent transactions
            </h3>
            <p className="mt-0.5 text-xs text-ink-500">
              {loading
                ? "Fetching the latest…"
                : data.length === 0
                  ? "No transactions yet"
                  : `Showing latest ${data.length} entries`}
            </p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            View all <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        {!loading && data.length === 0 ? (
          <div className="px-5 py-14">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <span className="relative">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-2xl bg-brand-200 opacity-40 blur-xl"
                />
                <IconTile icon={Receipt} tone="brand" size="xl" className="relative" />
              </span>
              <p className="mt-4 font-display text-base font-semibold tracking-[-0.01em] text-ink-900">
                Nothing here yet
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                Your first payment is one tap away — completed transactions will land here.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>Txn ID</th>
                <th scope="col" className={th}>Service</th>
                <th scope="col" className={th}>Customer</th>
                <th scope="col" className={cn(th, "text-right")}>Amount</th>
                {showCommission && (
                  <th scope="col" className={cn(th, "text-right")}>Commission</th>
                )}
                <th scope="col" className={th}>Status</th>
                <th scope="col" className={th}>Date</th>
              </tr>
            </thead>
            <tbody className="text-ink-800">
              {loading
                ? Array.from({ length: 5 }).map((_, r) => (
                    <tr key={`sk-${r}`}>
                      {Array.from({ length: colCount }).map((_, c) => (
                        <td key={c} className={td}>
                          {c === 1 ? (
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-7 w-7 rounded-xl" />
                              <Skeleton className="h-3.5 w-24" />
                            </div>
                          ) : (
                            <Skeleton
                              className={cn(
                                "h-3.5",
                                c === 0 ? "w-24" : c === 3 || c === 4 ? "ml-auto w-16" : "w-20"
                              )}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                : data.map((t) => (
                    <tr key={t.id} className="group transition-colors hover:bg-brand-50/30">
                      <td className={cn(td, firstTd, "font-mono text-xs text-ink-600")}>{t.id}</td>
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          {t.logo && <BankLogo name={t.logo} size={28} />}
                          <span className="font-medium text-ink-900">{t.service}</span>
                        </div>
                      </td>
                      <td className={cn(td, "text-ink-600")}>{t.customer}</td>
                      <td className={cn(td, "text-right font-semibold tabular-nums text-ink-950")}>
                        {formatINR(t.amount)}
                      </td>
                      {showCommission && (
                        <td className={cn(td, "text-right font-medium tabular-nums text-accent-700")}>
                          +{formatINR(t.commission)}
                        </td>
                      )}
                      <td className={td}>
                        <Badge
                          variant={statusVariant[t.status]}
                          size="sm"
                          dot={t.status === "Pending"}
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className={cn(td, "text-xs text-ink-500")}>{t.date}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
