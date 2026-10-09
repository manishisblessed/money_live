"use client";

import * as React from "react";
import { RefreshCw, CheckCircle2, Hourglass, XCircle } from "lucide-react";
import { Stack } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { formatINR, formatNumber, cn } from "@/lib/utils";

/**
 * Small presentational pieces shared by the "business summary" sections
 * (NetworkOverview, RetailerBusinessOverview). They receive values + callbacks
 * only — the owning section keeps all state and fetching.
 */

export function DateRangeControl({
  from,
  to,
  today,
  onFrom,
  onTo,
  onReset,
  isToday,
}: {
  from: string;
  to: string;
  today: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onReset: () => void;
  isToday: boolean;
}) {
  return (
    <>
      <div className="flex h-9 items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-3 shadow-sm">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onFrom(e.target.value)}
          className="bg-transparent text-xs font-semibold text-ink-700 outline-none"
          aria-label="From date"
        />
        <span className="text-ink-300">→</span>
        <input
          type="date"
          value={to}
          min={from}
          max={today}
          onChange={(e) => onTo(e.target.value)}
          className="bg-transparent text-xs font-semibold text-ink-700 outline-none"
          aria-label="To date"
        />
      </div>
      {!isToday && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center rounded-2xl border border-ink-200 bg-white px-3 text-xs font-semibold text-ink-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700 focus-energy"
        >
          Today
        </button>
      )}
    </>
  );
}

export function RefreshPill({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-9 items-center gap-1.5 rounded-2xl border border-ink-200 bg-white px-3.5 text-xs font-semibold text-ink-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700 focus-energy disabled:opacity-60"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh
    </button>
  );
}

export function StatusPill({
  tone,
  n,
  label,
}: {
  tone: "emerald" | "amber" | "rose";
  n: number;
  label: string;
}) {
  const tones: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  const Icon = tone === "emerald" ? CheckCircle2 : tone === "amber" ? Hourglass : XCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset",
        tones[tone]
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {formatNumber(n)} {label}
    </span>
  );
}

export type BreakdownRow = {
  service: string;
  label: string;
  amount: number;
  count: number;
  success: number;
  pending: number;
  failed: number;
};

/** Service-wise breakdown list — rows styled as a compact timeline. */
export function ServiceBreakdownList({
  rows,
  emptyText = "No transactions in this period.",
  columns = 1,
}: {
  rows: BreakdownRow[];
  emptyText?: string;
  columns?: 1 | 2;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <IconTile icon={Stack} tone="ink" size="md" />
        <p className="mt-3 text-sm font-semibold text-ink-800">{emptyText}</p>
        <p className="mt-0.5 text-xs text-ink-500">Completed business shows up here as it clears.</p>
      </div>
    );
  }
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <ul className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2")}>
      {rows.map((s) => (
        <li
          key={s.service}
          className="relative overflow-hidden rounded-xl bg-ink-50/70 px-3.5 py-2.5 ring-1 ring-inset ring-ink-100/60"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-800">{s.label}</p>
              <p className="text-[11px] text-ink-500">
                {formatNumber(s.count)} txn · {formatNumber(s.success)} ok
                {s.pending > 0 ? ` · ${formatNumber(s.pending)} pending` : ""}
                {s.failed > 0 ? ` · ${formatNumber(s.failed)} failed` : ""}
              </p>
            </div>
            <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-ink-900">
              {formatINR(s.amount)}
            </span>
          </div>
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 bg-energy-gradient-x opacity-70"
            style={{ width: `${Math.max(4, Math.round((s.amount / max) * 100))}%` }}
          />
        </li>
      ))}
    </ul>
  );
}
