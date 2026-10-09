"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Lock,
  Undo2,
} from "lucide-react";
import { Receipt } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BankLogo } from "@/components/dashboard/BankLogo";
import { EmptyState, FilterBar, SectionCard, StatusChip } from "@/components/dashboard/patterns";
import { cn, formatINR } from "@/lib/utils";
import { downloadCSV, downloadPDF, downloadZIP, type ReportColumn } from "@/lib/reports";

type WalletTxn = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  reason: string;
  amount: number;
  /** Null for reservation memos — a hold/release never moves the balance. */
  balanceAfter: number | null;
  note: string | null;
  refType: string | null;
  refId: string | null;
  createdAt: string;
  /** True for synthetic payout hold/release rows (display-only, no balance impact). */
  memo?: boolean;
  /** Resolved bank/issuer name for logo display on card/bill rows. */
  logo?: string | null;
};

type LedgerData = {
  txns: WalletTxn[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 500;

const REASON_LABELS: Record<string, string> = {
  TOPUP: "Wallet top-up",
  WITHDRAW: "Withdrawal",
  TRANSACTION: "Service txn",
  COMMISSION: "Commission",
  REVERSAL: "Refund / reversal",
  ADJUSTMENT: "Adjustment",
  FUND_TRANSFER_IN: "Fund received",
  FUND_TRANSFER_OUT: "Fund sent",
  FEE: "Fee",
  PENALTY: "Penalty",
  PAYOUT: "Payout",
  PAYOUT_HOLD: "Funds on hold (payout)",
  PAYOUT_RELEASE: "Hold released (payout)",
  SETTLEMENT: "Settlement",
  AEPS_SETTLEMENT: "AePS settlement",
  RENTAL: "POS rental",
  POS_SETTLEMENT: "POS settlement",
  PARENT_PUSH: "Received from parent",
  PARENT_PULL: "Pulled by parent",
  PLATFORM_REVENUE: "Platform revenue",
};

const REASON_OPTIONS = ["All", ...Object.keys(REASON_LABELS)];

export default function LedgerPage() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState("All");
  const [reason, setReason] = useState("All");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        memos: "1",
      });
      if (direction !== "All") params.set("direction", direction);
      if (reason !== "All") params.set("reason", reason);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/wallet/transactions?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, direction, reason, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [direction, reason, q]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const ledgerCols: ReportColumn<WalletTxn>[] = [
    { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleString("en-IN") },
    { key: "direction", header: "Type" },
    { key: "reason", header: "Reason", render: (r) => REASON_LABELS[r.reason] ?? r.reason },
    { key: "note", header: "Description" },
    { key: "refId", header: "Reference" },
    { key: "amount", header: "Amount (INR)", format: "money" },
    { key: "balanceAfter", header: "Balance after (INR)", format: "money" },
  ];

  function exportCsv() {
    if (!data) return;
    downloadCSV(`ledger-page-${page}`, data.txns, ledgerCols);
  }

  function exportPdf() {
    if (!data) return;
    downloadPDF("Wallet Ledger", data.txns, ledgerCols);
  }

  function exportZip() {
    if (!data) return;
    downloadZIP(`ledger-page-${page}`, data.txns, ledgerCols);
  }

  const pager = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={loading || page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </Button>
      <span className="min-w-[4.5rem] text-center text-xs font-medium tabular-nums text-ink-500">
        {data ? `${data.page} / ${totalPages}` : "—"}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={loading || page >= totalPages}
        aria-label="Next page"
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Wallet ledger"
        description="Every credit and debit on your wallet — commissions, transactions, payouts, settlements and holds."
        actions={
          <>
            <Button variant="outline" size="md" onClick={exportCsv} disabled={!data?.txns.length}>
              <FileDown className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="md" onClick={exportPdf} disabled={!data?.txns.length}>
              <FileDown className="h-4 w-4" />
              PDF
            </Button>
            <Button variant="secondary" size="md" onClick={exportZip} disabled={!data?.txns.length}>
              <FileDown className="h-4 w-4" />
              ZIP
            </Button>
          </>
        }
      />

      <FilterBar
        title="Entries"
        count={data ? data.total : undefined}
        hint={data ? `showing ${data.txns.length} on this page` : undefined}
        actions={pager}
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by note or reference…"
            className="pl-10"
            aria-label="Search ledger"
          />
        </div>
        <Select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-36" aria-label="Type">
          {["All", "CREDIT", "DEBIT"].map((d) => (
            <option key={d} value={d}>
              {d === "All" ? "All types" : d}
            </option>
          ))}
        </Select>
        <Select value={reason} onChange={(e) => setReason(e.target.value)} className="w-52" aria-label="Reason">
          {REASON_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r === "All" ? "All reasons" : REASON_LABELS[r] ?? r}
            </option>
          ))}
        </Select>
      </FilterBar>

      <SectionCard padding="none">
        {!data?.txns.length ? (
          loading ? (
            <div className="px-5 py-14 text-center text-sm text-ink-500">Loading your ledger…</div>
          ) : (
            <EmptyState
              icon={Receipt}
              title="No entries match these filters"
              description="Try widening the date range or clearing the type and reason filters."
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-ink-50/70 text-left text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">Balance after</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-ink-800">
                {data.txns.map((t) => (
                  <tr
                    key={t.id}
                    className={cn(
                      "transition-colors",
                      t.memo ? "bg-ink-50/40 hover:bg-ink-50/70" : "hover:bg-brand-50/30"
                    )}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {t.memo ? (
                          <>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                              {t.direction === "DEBIT" ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <Undo2 className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <StatusChip status={t.direction === "DEBIT" ? "HELD" : "RELEASED"} />
                          </>
                        ) : t.direction === "CREDIT" ? (
                          <>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            </span>
                            <StatusChip status="CREDIT" label="CREDIT" />
                          </>
                        ) : (
                          <>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-100">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </span>
                            <StatusChip status="DEBIT" label="DEBIT" />
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {t.logo && <BankLogo name={t.logo} size={32} />}
                        <div className="min-w-0">
                          <div className="font-medium text-ink-900">
                            {REASON_LABELS[t.reason] ?? t.reason}
                          </div>
                          {t.note && <div className="text-xs text-ink-500">{t.note}</div>}
                          {t.refId && <div className="font-mono text-[11px] text-ink-400">{t.refId}</div>}
                        </div>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right font-display text-base font-semibold tabular-nums tracking-[-0.01em]",
                        t.memo
                          ? "text-ink-400"
                          : t.direction === "CREDIT"
                            ? "text-emerald-700"
                            : "text-rose-700"
                      )}
                    >
                      {t.memo ? "" : t.direction === "CREDIT" ? "+" : "−"}
                      {formatINR(t.amount)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-600">
                      {t.balanceAfter == null ? (
                        <span className="text-ink-300" title="A reservation does not change your balance">
                          —
                        </span>
                      ) : (
                        formatINR(t.balanceAfter)
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-ink-500">
                      {new Date(t.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.txns.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-5 py-3">
            <p className="text-xs text-ink-500">
              {data.total.toLocaleString("en-IN")} total entries · page {data.page} of {totalPages}
            </p>
            {pager}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
