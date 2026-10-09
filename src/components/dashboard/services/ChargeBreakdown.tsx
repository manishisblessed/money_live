"use client";

import * as React from "react";
import { cn, formatINR } from "@/lib/utils";

/**
 * ChargeBreakdown — the "bill amount → service charge → GST → total debit"
 * ladder shown once a quote is in page state. Pure display; the page passes
 * the numbers it already fetched.
 */
export function ChargeBreakdown({
  amount,
  amountLabel = "Bill amount",
  serviceCharge,
  gst,
  gstLabel = "GST (18%)",
  totalDebit,
  totalLabel = "Total debit from wallet",
  commission,
  commissionNote = "net of 2% TDS",
  loading,
  className,
  extra,
}: {
  amount: number;
  amountLabel?: React.ReactNode;
  serviceCharge?: number;
  gst?: number;
  gstLabel?: React.ReactNode;
  totalDebit?: number;
  totalLabel?: React.ReactNode;
  commission?: number;
  commissionNote?: React.ReactNode;
  loading?: boolean;
  className?: string;
  /** Extra rows rendered before the total. */
  extra?: { label: React.ReactNode; value: React.ReactNode }[];
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-ink-50/70 p-4 text-sm ring-1 ring-inset ring-ink-200/70",
        loading && "animate-pulse",
        className
      )}
      aria-busy={loading || undefined}
    >
      <Row label={amountLabel} value={formatINR(amount)} />
      {serviceCharge !== undefined && <Row label="Service charge" value={formatINR(serviceCharge)} />}
      {gst !== undefined && gst > 0 && <Row label={gstLabel} value={formatINR(gst)} />}
      {extra?.map((r, i) => <Row key={i} label={r.label} value={r.value} />)}
      {totalDebit !== undefined && (
        <>
          <div className="my-2.5 border-t-2 border-dashed border-ink-200" />
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-semibold text-ink-700">{totalLabel}</span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900 tabular-nums">
              {formatINR(totalDebit)}
            </span>
          </div>
        </>
      )}
      {commission !== undefined && commission > 0 && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-800 ring-1 ring-inset ring-accent-200">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden />
          You earn {formatINR(commission)}
          {commissionNote && <span className="font-medium text-accent-700/80">· {commissionNote}</span>}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-0.5">
      <span className="text-ink-600">{label}</span>
      <span className="font-medium text-ink-900 tabular-nums">{value}</span>
    </div>
  );
}

/**
 * BillCard — the "fetched bill" moment: customer name, due date, big amount.
 */
export function BillCard({
  customerName,
  dueDate,
  amount,
  minAmount,
  maxAmount,
  onChange,
  className,
}: {
  customerName?: string;
  dueDate?: string;
  amount: number;
  minAmount?: number;
  maxAmount?: number;
  /** Optional "Change" action to clear the fetched bill (page-owned). */
  onChange?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-50 via-white to-brand-50/60 p-4 ring-1 ring-inset ring-accent-200",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent-400/20 blur-2xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-700">Bill fetched</p>
          {customerName && (
            <p className="mt-1 truncate text-sm font-semibold text-ink-900">{customerName}</p>
          )}
          {dueDate && <p className="text-xs text-ink-600">Due {dueDate}</p>}
        </div>
        {onChange && (
          <button
            type="button"
            onClick={onChange}
            className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
          >
            Change
          </button>
        )}
      </div>
      <p className="relative mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-900 tabular-nums">
        {formatINR(amount)}
      </p>
      {(minAmount !== undefined || maxAmount !== undefined) && (
        <p className="relative mt-1 text-xs text-ink-600">
          {minAmount !== undefined && <>Minimum due {formatINR(minAmount)}</>}
          {minAmount !== undefined && maxAmount !== undefined && " · "}
          {maxAmount !== undefined && <>Max payable {formatINR(maxAmount)}</>}
        </p>
      )}
    </div>
  );
}
