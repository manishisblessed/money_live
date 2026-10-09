"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { ShieldCheck } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconTile } from "@/components/ui/Icon";
import { ReportActions } from "@/components/dashboard/ReportActions";
import { FilterBar, KeyValueList, PillTabs, StatusChip } from "@/components/dashboard/patterns";
import { formatINR } from "@/lib/utils";

type PayoutStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "REJECTED"
  | "REVERSED";

type Payout = {
  id: string;
  beneficiaryName: string;
  accountLast4: string;
  mode: string;
  amount: number;
  serviceCharge: number;
  gst: number;
  totalDebit: number;
  status: PayoutStatus;
  utr: string | null;
  failureReason: string | null;
  remarks: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
};

type PayoutDetail = Payout & {
  maskedAccount: string;
  ifsc: string | null;
  bulkpeReferenceId: string; // provider reference (stable DB column name)
  bulkpeTxnId: string | null; // provider txn id (stable DB column name)
  makerId: string;
  checker: { id: string; name: string } | null;
  approvedAt: string | null;
  processedAt: string | null;
  completedAt: string | null;
};

const STATUS_VARIANT: Record<PayoutStatus, "success" | "danger" | "warning" | "brand" | "default"> = {
  SUCCESS: "success",
  FAILED: "danger",
  REJECTED: "danger",
  REVERSED: "danger",
  PROCESSING: "brand",
  APPROVED: "brand",
  PENDING_APPROVAL: "warning",
  DRAFT: "default",
};

const FILTER_TABS = [
  { value: "PENDING" as const, label: "Pending only" },
  { value: "ALL" as const, label: "All statuses" },
];

const STATUS_LABEL: Record<PayoutStatus, string> = {
  SUCCESS: "Success",
  FAILED: "Failed",
  REJECTED: "Rejected",
  REVERSED: "Reversed",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  PENDING_APPROVAL: "Pending",
  DRAFT: "Draft",
};

const inr2 = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PayoutApprovalsPage() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [deciding, setDeciding] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [decisionTarget, setDecisionTarget] = useState<{ row: Payout; action: "approve" | "reject" } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await fetch("/api/payout");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setRows(json.payouts);
    } catch {
      setError("Could not load payout approvals.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function decide(id: string, action: "approve" | "reject", remarks?: string) {
    setDeciding(id);
    try {
      const res = await fetch(`/api/payout/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, remarks }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(typeof json.error === "string" ? json.error : "Action failed");
        return;
      }
      toast.success(action === "approve" ? "Payout approved" : "Payout rejected — funds released back");
      await fetchData();
    } finally {
      setDeciding(null);
    }
  }

  const visible = useMemo(
    () => (filter === "PENDING" ? rows.filter((r) => r.status === "PENDING_APPROVAL") : rows),
    [rows, filter]
  );

  const pendingCount = rows.filter((r) => r.status === "PENDING_APPROVAL").length;

  const reportRows = visible.map((r) => ({
    id: r.id,
    maker: r.user.name,
    beneficiary: r.beneficiaryName,
    account: `****${r.accountLast4}`,
    mode: r.mode,
    amount: r.amount,
    total: r.totalDebit,
    status: STATUS_LABEL[r.status],
    date: new Date(r.createdAt).toLocaleString("en-IN"),
  }));

  const cols: Column<Payout>[] = [
    {
      key: "user",
      header: "Maker",
      render: (r) => (
        <div>
          <div className="font-semibold text-ink-900">{r.user.name}</div>
          <div className="text-xs text-ink-500">{r.user.email}</div>
        </div>
      ),
    },
    {
      key: "beneficiaryName",
      header: "Beneficiary",
      render: (r) => (
        <div>
          <div className="font-semibold text-ink-900">{r.beneficiaryName}</div>
          <div className="font-mono text-xs text-ink-500">****{r.accountLast4} · {r.mode}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (r) => <span className="font-semibold">{formatINR(r.amount)}</span>,
    },
    {
      key: "totalDebit",
      header: "Total debit",
      align: "right",
      render: (r) => <span className="font-semibold">{inr2(r.totalDebit)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <StatusChip status={r.status} variant={STATUS_VARIANT[r.status]} label={STATUS_LABEL[r.status]} size="sm" />
      ),
    },
    {
      key: "actions" as keyof Payout,
      header: "",
      align: "right",
      render: (r) => {
        const busy = deciding === r.id;
        return (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setDetailId(r.id)}
              className="grid h-8 w-8 place-items-center rounded-xl text-ink-600 ring-1 ring-inset ring-ink-100 transition hover:bg-ink-50 focus-energy"
              title="View details"
              aria-label="View details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {r.status === "PENDING_APPROVAL" && (
              <>
                <button
                  onClick={() => setDecisionTarget({ row: r, action: "approve" })}
                  disabled={busy}
                  className="grid h-8 w-8 place-items-center rounded-xl text-emerald-700 ring-1 ring-inset ring-emerald-100 transition hover:bg-emerald-50 disabled:opacity-30 focus-energy"
                  title="Approve"
                  aria-label="Approve"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setDecisionTarget({ row: r, action: "reject" })}
                  disabled={busy}
                  className="grid h-8 w-8 place-items-center rounded-xl text-rose-700 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-50 disabled:opacity-30 focus-energy"
                  title="Reject"
                  aria-label="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Approvals"
        title="Payout approvals"
        description="Network self-withdrawals now auto-approve (a payout debits the requester's own wallet). This queue only holds any earlier requests still awaiting a decision; funds are released back if you reject."
        actions={
          <>
            <ReportActions
              filename="payout-approvals"
              title="JMP eMoney · Payout Approvals"
              subtitle={filter === "PENDING" ? "Pending queue" : "All payouts"}
              columns={[
                { key: "id", header: "Payout ID" },
                { key: "maker", header: "Maker" },
                { key: "beneficiary", header: "Beneficiary" },
                { key: "account", header: "Account" },
                { key: "mode", header: "Mode" },
                { key: "amount", header: "Amount (INR)" },
                { key: "total", header: "Total debit" },
                { key: "status", header: "Status" },
                { key: "date", header: "When" },
              ]}
              rows={reportRows}
            />
            <Button variant="outline" onClick={fetchData} disabled={fetching}>
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <FilterBar
        title={
          <span className="inline-flex items-center gap-2">
            <IconTile icon={ShieldCheck} tone={pendingCount > 0 ? "amber" : "accent"} size="sm" />
            <span>
              {pendingCount} pending approval{pendingCount === 1 ? "" : "s"}
            </span>
          </span>
        }
        hint={fetching ? "Loading…" : `${visible.length} payout${visible.length === 1 ? "" : "s"} shown`}
      >
        <PillTabs
          aria-label="Payout filter"
          size="sm"
          tabs={FILTER_TABS}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
      </FilterBar>

      <DataTable
        columns={cols}
        data={visible}
        loading={fetching}
        empty="Nothing here. The queue is clear."
      />

      {detailId && <DetailDrawer id={detailId} onClose={() => setDetailId(null)} />}

      <ConfirmDialog
        open={decisionTarget !== null}
        onClose={() => setDecisionTarget(null)}
        busy={decisionTarget ? deciding === decisionTarget.row.id : false}
        tone={decisionTarget?.action === "reject" ? "danger" : "default"}
        title={decisionTarget?.action === "reject" ? "Reject this payout?" : "Approve this payout?"}
        description={
          decisionTarget && (
            <>
              {formatINR(decisionTarget.row.amount)} to{" "}
              <span className="font-semibold text-ink-900">{decisionTarget.row.beneficiaryName}</span>
              {decisionTarget.action === "reject"
                ? " — funds will be released back to the maker."
                : " will be released for processing."}
            </>
          )
        }
        confirmLabel={decisionTarget?.action === "reject" ? "Reject" : "Approve"}
        input={{
          label:
            decisionTarget?.action === "reject"
              ? "Reason for rejection (optional)"
              : "Approval remarks (optional)",
          placeholder: "Add a note for the audit trail…",
        }}
        onConfirm={async (remarks) => {
          if (!decisionTarget) return;
          await decide(decisionTarget.row.id, decisionTarget.action, remarks || undefined);
          setDecisionTarget(null);
        }}
      />
    </div>
  );
}

function DetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/payout/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        if (active) setDetail(json.payout);
      } catch {
        if (active) setErr("Could not load payout details.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl ring-1 ring-ink-100 sm:my-3 sm:mr-3 sm:h-[calc(100%-1.5rem)] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Payout</p>
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">Payout details</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 ring-1 ring-inset ring-ink-100 transition hover:bg-ink-50 focus-energy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid flex-1 place-items-center text-ink-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : err ? (
          <div className="m-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 ring-1 ring-inset ring-rose-100">{err}</div>
        ) : detail ? (
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <StatusChip status={detail.status} variant={STATUS_VARIANT[detail.status]} label={STATUS_LABEL[detail.status]} />
              <span className="truncate font-mono text-xs text-ink-500">{detail.bulkpeReferenceId}</span>
            </div>

            <div className="rounded-2xl bg-ink-50/60 p-4 ring-1 ring-inset ring-ink-100">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Beneficiary</p>
              <KeyValueList
                dense
                items={[
                  { label: "Beneficiary", value: detail.beneficiaryName },
                  { label: "Account", value: detail.maskedAccount, mono: true },
                  ...(detail.ifsc ? [{ label: "IFSC", value: detail.ifsc, mono: true }] : []),
                  { label: "Mode", value: detail.mode },
                ]}
              />
            </div>

            <div className="rounded-2xl p-4 ring-1 ring-inset ring-ink-100">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Breakdown</p>
              <KeyValueList
                dense
                items={[
                  { label: "Amount to beneficiary", value: inr2(detail.amount) },
                  { label: "Service charge", value: inr2(detail.serviceCharge) },
                  { label: "GST", value: inr2(detail.gst) },
                ]}
              />
              <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="text-sm font-semibold text-ink-900">Total debit</span>
                <span className="font-display text-xl font-semibold tabular-nums tracking-[-0.02em] gradient-text">
                  {inr2(detail.totalDebit)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl p-4 ring-1 ring-inset ring-ink-100">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Trail</p>
              <KeyValueList
                dense
                items={[
                  { label: "Maker (owner)", value: `${detail.user.name} · ${detail.user.email}` },
                  ...(detail.checker ? [{ label: "Checker", value: detail.checker.name }] : []),
                  ...(detail.utr ? [{ label: "UTR", value: detail.utr, mono: true }] : []),
                  ...(detail.bulkpeTxnId ? [{ label: "Provider txn", value: detail.bulkpeTxnId, mono: true }] : []),
                  ...(detail.failureReason ? [{ label: "Failure reason", value: detail.failureReason }] : []),
                  ...(detail.remarks ? [{ label: "Remarks", value: detail.remarks }] : []),
                  { label: "Created", value: new Date(detail.createdAt).toLocaleString("en-IN") },
                  ...(detail.completedAt
                    ? [{ label: "Completed", value: new Date(detail.completedAt).toLocaleString("en-IN") }]
                    : []),
                ]}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
