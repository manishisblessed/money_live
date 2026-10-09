"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  IndianRupee,
  Landmark,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Printer,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { ReportActions } from "@/components/dashboard/ReportActions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { TxnPinDialog } from "@/components/security/TxnPinDialog";
import {
  ServiceLayout,
  ServiceCard,
  Field,
  Notice,
  SecureFootnote,
} from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips, InfoChip } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { StepHeader } from "@/components/dashboard/services/StepHeader";
import { ChargeBreakdown } from "@/components/dashboard/services/ChargeBreakdown";
import { formatINR, cn } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Beneficiary = {
  id: string;
  accountLast4: string;
  ifsc: string;
  holderName: string;
  verifiedName: string | null;
  contactMobile: string | null;
  isVerified: boolean;
  verificationStatus: "PENDING" | "SUCCESS" | "FAILED";
  failureReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
};

type ServiceStatus = {
  available: boolean;
  partnerEnabled: boolean;
  adminEnabled: boolean;
  reason: string | null;
  balances: { walletBalance: number; heldBalance: number; spendable: number } | null;
};

type Fee = { base: number; gst: number; total: number; gstPercent: number };

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
  mode: "IMPS";
  amount: number;
  serviceCharge: number;
  gst: number;
  totalDebit: number;
  status: PayoutStatus;
  utr: string | null;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
};

type Balances = { walletBalance: number; heldBalance: number; spendable: number };

type Quote = { serviceCharge: number; gst: number; totalDebit: number; gstPercent: number };

type View = "home" | "process-payout" | "add-beneficiary" | "history";
type WizardStep = "select-account" | "enter-amount" | "confirm" | "result";

// ─────────────────────────────────────────────────────────────────────────────
// Constants + helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<PayoutStatus, "success" | "danger" | "warning" | "brand" | "default"> = {
  SUCCESS: "success",
  FAILED: "danger",
  REJECTED: "danger",
  REVERSED: "danger",
  PROCESSING: "brand",
  APPROVED: "brand",
  PENDING_APPROVAL: "warning",
  DRAFT: "default",
};

const STATUS_LABEL: Record<PayoutStatus, string> = {
  SUCCESS: "Success",
  FAILED: "Failed",
  REJECTED: "Rejected",
  REVERSED: "Reversed",
  PROCESSING: "Processing",
  APPROVED: "Approved",
  PENDING_APPROVAL: "Pending approval",
  DRAFT: "Draft",
};

const inr2 = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_RE = /^\d{9,18}$/;

// ─────────────────────────────────────────────────────────────────────────────
// The page
// ─────────────────────────────────────────────────────────────────────────────

export default function PayoutPage() {
  const [view, setView] = useState<View>("home");
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<Payout[]>([]);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [fetching, setFetching] = useState(true);

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [fetchingBenes, setFetchingBenes] = useState(true);
  const [fee, setFee] = useState<Fee | null>(null);

  const [service, setService] = useState<ServiceStatus | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  const [showNoAccountModal, setShowNoAccountModal] = useState(false);

  const verifiedBenes = useMemo(() => beneficiaries.filter((b) => b.isVerified), [beneficiaries]);

  // ── Fetchers ───────────────────────────────────────────────────────────────

  const fetchPayouts = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/payout");
      if (!res.ok) throw new Error("Failed to fetch payouts");
      const json = await res.json();
      setRows(json.payouts as Payout[]);
      setBalances(json.balances as Balances);
    } catch {
      setError("Could not load payouts.");
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchBenes = useCallback(async () => {
    try {
      setFetchingBenes(true);
      const res = await fetch("/api/payout/beneficiaries");
      if (!res.ok) throw new Error("Failed to fetch beneficiaries");
      const json = await res.json();
      setBeneficiaries(json.beneficiaries as Beneficiary[]);
      setFee(json.fee as Fee);
    } catch {
      // silent: the UI shows the "no accounts" state naturally
    } finally {
      setFetchingBenes(false);
    }
  }, []);

  const fetchService = useCallback(async () => {
    try {
      setLoadingService(true);
      const res = await fetch("/api/payout/service-status");
      if (!res.ok) throw new Error();
      const json = (await res.json()) as ServiceStatus;
      setService(json);
      if (json.balances) setBalances(json.balances);
    } catch {
      setService({
        available: false,
        partnerEnabled: false,
        adminEnabled: false,
        reason: null,
        balances: null,
      });
    } finally {
      setLoadingService(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
    fetchBenes();
    fetchService();
  }, [fetchPayouts, fetchBenes, fetchService]);

  const refreshAll = useCallback(() => {
    fetchPayouts();
    fetchBenes();
    fetchService();
  }, [fetchPayouts, fetchBenes, fetchService]);

  const handleStartPayout = () => {
    if (verifiedBenes.length === 0) {
      setShowNoAccountModal(true);
      return;
    }
    setError(null);
    setView("process-payout");
  };

  // ── Report rows for CSV/PDF/XLSX ──────────────────────────────────────────
  const reportRows = rows.map((r) => ({
    id: r.id,
    beneficiary: r.beneficiaryName,
    account: `****${r.accountLast4}`,
    mode: r.mode,
    amount: r.amount,
    charge: r.serviceCharge,
    gst: r.gst,
    total: r.totalDebit,
    status: STATUS_LABEL[r.status],
    utr: r.utr ?? "—",
    date: new Date(r.createdAt).toLocaleString("en-IN"),
  }));

  const cols: Column<Payout>[] = [
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
      render: (r) => (
        <div className="text-right">
          <div className="font-semibold">{inr2(r.totalDebit)}</div>
          <div className="text-[11px] text-ink-500">+{inr2(r.serviceCharge + r.gst)} fees</div>
        </div>
      ),
    },
    {
      key: "utr",
      header: "UTR",
      render: (r) =>
        r.utr ? <span className="font-mono text-xs">{r.utr}</span> : <span className="text-xs text-ink-400">—</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <div>
          <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
          {r.status === "FAILED" && r.failureReason && (
            <div className="mt-1 max-w-[200px] truncate text-[11px] text-rose-600" title={r.failureReason}>
              {r.failureReason}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "When",
      render: (r) => (
        <span className="whitespace-nowrap text-xs text-ink-500">
          {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payouts"
        title="Send a payout"
        description="Disburse to any verified bank account via IMPS. The beneficiary receives the full amount; service charge + 18% GST are added on top of your debit."
        actions={
          <>
            <ServicePill loading={loadingService} status={service} onRefresh={fetchService} />
            <Button variant="outline" onClick={refreshAll} disabled={fetching}>
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {rows.length > 0 && (
              <ReportActions
                filename="payouts"
                title="JMP eMoney · Payouts"
                subtitle="My payouts"
                columns={[
                  { key: "id", header: "Payout ID" },
                  { key: "beneficiary", header: "Beneficiary" },
                  { key: "account", header: "Account" },
                  { key: "mode", header: "Mode" },
                  { key: "amount", header: "Amount (INR)" },
                  { key: "charge", header: "Service charge" },
                  { key: "gst", header: "GST" },
                  { key: "total", header: "Total debit" },
                  { key: "status", header: "Status" },
                  { key: "utr", header: "UTR" },
                  { key: "date", header: "When" },
                ]}
                rows={reportRows}
              />
            )}
          </>
        }
      />

      {/* Wallet snapshot — always visible */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Spendable" value={balances ? formatINR(balances.spendable) : "—"} icon={Wallet} tone="accent" />
        <StatCard label="Wallet balance" value={balances ? formatINR(balances.walletBalance) : "—"} icon={Landmark} tone="brand" />
        <StatCard label="On hold" value={balances ? formatINR(balances.heldBalance) : "—"} icon={Lock} tone="royal" />
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <Notice
              tone="danger"
              icon={<AlertCircle className="h-4 w-4" />}
              action={
                <button onClick={() => setError(null)} aria-label="Dismiss" className="text-coral-400 transition hover:text-coral-600">
                  <XCircle className="h-4 w-4" />
                </button>
              }
            >
              {error}
            </Notice>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HOME ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <HeroCard
                title="New payout"
                subtitle="Send money to a verified bank account via IMPS"
                cta={verifiedBenes.length > 0 ? `${verifiedBenes.length} verified · Ready to use` : "Add a beneficiary first"}
                icon={Send}
                tone="energy"
                onClick={handleStartPayout}
              />
              <HeroCard
                title="Add bank account"
                subtitle="Verify via penny-drop & save to your beneficiary book"
                cta={fee ? `${inr2(fee.total)} · One-time per account` : "One-time verification fee"}
                icon={Plus}
                tone="accent"
                onClick={() => {
                  setError(null);
                  setView("add-beneficiary");
                }}
              />
            </div>

            {/* Beneficiary list */}
            <BeneficiaryList
              beneficiaries={beneficiaries}
              loading={fetchingBenes}
              onRefresh={fetchBenes}
              onDelete={async (id) => {
                await fetch(`/api/payout/beneficiaries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
                fetchBenes();
              }}
              onRecheck={async (id) => {
                const res = await fetch("/api/payout/beneficiaries", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id }),
                });
                const data = await res.json();
                if (data.beneficiary) {
                  setBeneficiaries((prev) => prev.map((b) => (b.id === id ? data.beneficiary : b)));
                }
              }}
            />

            {/* Quick jump to history */}
            {rows.length > 0 && (
              <button
                onClick={() => setView("history")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-ink-100 transition hover:ring-brand-300 focus-energy"
              >
                <Clock className="h-4 w-4" />
                View {rows.length} recent payout{rows.length !== 1 ? "s" : ""}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}

        {view === "process-payout" && (
          <motion.div
            key="process"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <BackButton onClick={() => setView("home")} />
            <ProcessPayoutWizard
              beneficiaries={verifiedBenes}
              spendable={balances?.spendable ?? 0}
              onDone={() => {
                setView("home");
                refreshAll();
              }}
              onError={setError}
              onRefresh={refreshAll}
            />
          </motion.div>
        )}

        {view === "add-beneficiary" && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <BackButton onClick={() => setView("home")} />
            <AddBeneficiaryPanel
              fee={fee}
              onDone={() => {
                setView("home");
                fetchBenes();
                fetchService();
              }}
              onError={setError}
            />
          </motion.div>
        )}

        {view === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <BackButton onClick={() => setView("home")} />
            <DataTable
              title={`${rows.length} payout${rows.length === 1 ? "" : "s"}`}
              columns={cols}
              data={rows}
              loading={fetching}
              empty="No payouts yet. Send one to see it here."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* No-account modal shown when user tries to start a payout with no verified beneficiaries */}
      <AnimatePresence>
        {showNoAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 px-4 backdrop-blur"
            onClick={() => setShowNoAccountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-energy"
              onClick={(e) => e.stopPropagation()}
            >
              <IconTile tone="amber" size="xl" className="mx-auto">
                <AlertTriangle className="h-7 w-7" />
              </IconTile>
              <h3 className="mt-4 text-center font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                No verified bank account yet
              </h3>
              <p className="mt-1 text-center text-sm text-ink-500">
                You need to add and verify a bank account before sending a payout. A one-time
                penny-drop verification fee of {fee ? inr2(fee.total) : "₹4 + GST"} applies.
              </p>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowNoAccountModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowNoAccountModal(false);
                    setView("add-beneficiary");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add account
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ServicePill({
  loading,
  status,
  onRefresh,
}: {
  loading: boolean;
  status: ServiceStatus | null;
  onRefresh: () => void;
}) {
  const active = status?.available;
  return (
    <Badge
      variant={loading ? "default" : active ? "success" : "danger"}
      dot={!loading && Boolean(active)}
      className="h-9 px-3"
    >
      {loading ? "Checking service…" : active ? "Service active" : status?.reason || "Service unavailable"}
      <button
        onClick={onRefresh}
        aria-label="Refresh service status"
        className="ml-0.5 rounded-full p-0.5 opacity-70 transition hover:bg-white/70 hover:opacity-100"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      </button>
    </Badge>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink-600 ring-1 ring-ink-100 transition hover:text-ink-900 hover:ring-ink-200 focus-energy"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}

function HeroCard({
  title,
  subtitle,
  cta,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: IconTone;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-ink-100 transition-shadow hover:shadow-energy-sm focus-energy"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-energy-gradient opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20" />
      <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-ink-50 text-ink-400 ring-1 ring-ink-100 transition group-hover:bg-ink-950 group-hover:text-white">
        <ChevronRight className="h-4 w-4" />
      </span>
      <div className="relative">
        <IconTile tone={tone} size="xl" className="mb-4 transition-transform group-hover:scale-105">
          <Icon className="h-7 w-7" />
        </IconTile>
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">{title}</h3>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
          <Sparkles className="h-3 w-3 text-royal-500" />
          {cta}
        </div>
      </div>
    </motion.button>
  );
}

function BeneficiaryList({
  beneficiaries,
  loading,
  onRefresh,
  onRecheck,
  onDelete,
}: {
  beneficiaries: Beneficiary[];
  loading: boolean;
  onRefresh: () => void;
  onRecheck: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading && beneficiaries.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-sm text-ink-500 shadow-sm ring-1 ring-ink-100">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
        Loading saved accounts…
      </div>
    );
  }

  if (beneficiaries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-8 text-center shadow-sm">
        <IconTile tone="brand" size="xl" className="mx-auto">
          <CreditCard className="h-6 w-6" />
        </IconTile>
        <p className="mt-3 font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">No saved bank accounts yet</p>
        <p className="mt-1 text-xs text-ink-500">Add one to start sending payouts — verification takes a few seconds.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink-100">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.02em] text-ink-950">
          <IconTile tone="accent" size="sm">
            <ShieldCheck className="h-4 w-4" />
          </IconTile>
          Bank accounts ({beneficiaries.length})
        </h3>
        <button
          onClick={onRefresh}
          aria-label="Refresh"
          className="rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-energy"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <ul className="divide-y divide-ink-100 border-t border-ink-100">
        {beneficiaries.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-brand-50/30">
            <div className="flex items-center gap-3">
              <IconTile tone={b.isVerified ? "brand" : "amber"} size="md">
                <Building2 className="h-5 w-5" />
              </IconTile>
              <div>
                <p className="text-sm font-semibold text-ink-900">{b.verifiedName || b.holderName}</p>
                <p className="font-mono text-xs text-ink-500">****{b.accountLast4} · {b.ifsc}</p>
                {!b.isVerified && (
                  <p
                    className={`mt-0.5 text-[11px] ${
                      b.verificationStatus === "PENDING" ? "text-amber-600" : "text-rose-600"
                    }`}
                  >
                    {b.verificationStatus === "PENDING"
                      ? "Verification pending at bank — use Re-check"
                      : b.failureReason || "Verification failed — delete and re-add"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {b.isVerified ? (
                <Badge variant="success">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === b.id}
                  onClick={async () => {
                    setBusyId(b.id);
                    try {
                      await onRecheck(b.id);
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  {busyId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Re-check
                </Button>
              )}
              <button
                onClick={async () => {
                  if (!confirm("Delete this beneficiary?")) return;
                  await onDelete(b.id);
                }}
                aria-label="Delete beneficiary"
                className="rounded-full p-2 text-ink-400 transition hover:bg-coral-50 hover:text-coral-600 focus-energy"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Process payout wizard: select-account → enter-amount → confirm → result
// ─────────────────────────────────────────────────────────────────────────────

type PayoutResult = {
  id: string;
  beneficiaryName: string;
  accountLast4: string;
  amount: number;
  serviceCharge: number;
  gst: number;
  totalDebit: number;
  status: PayoutStatus;
  createdAt: string;
  utr?: string | null;
  failureReason?: string | null;
  reference?: string | null;
};

const TERMINAL_STATUSES: PayoutStatus[] = ["SUCCESS", "FAILED", "REJECTED", "REVERSED"];
const isTerminalStatus = (s: PayoutStatus) => TERMINAL_STATUSES.includes(s);

function ProcessPayoutWizard({
  beneficiaries,
  spendable,
  onDone,
  onError,
  onRefresh,
}: {
  beneficiaries: Beneficiary[];
  spendable: number;
  onDone: () => void;
  onError: (msg: string | null) => void;
  onRefresh?: () => void;
}) {
  const [step, setStep] = useState<WizardStep>("select-account");
  const [selected, setSelected] = useState<Beneficiary | null>(null);
  const [amount, setAmount] = useState("1000");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PayoutResult | null>(null);
  const idemKey = useRef<string>(crypto.randomUUID());

  const amountNum = Number(amount) || 0;

  useEffect(() => {
    if (step !== "enter-amount") return;
    if (!amountNum || amountNum <= 0) {
      setQuote(null);
      return;
    }
    let active = true;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/payout/quote?amount=${amountNum}&mode=IMPS`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as Quote;
        if (active) setQuote(json);
      } catch {
        if (active) setQuote(null);
      } finally {
        if (active) setQuoting(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [amountNum, step]);

  const insufficient = useMemo(
    () => quote != null && quote.totalDebit > spendable,
    [quote, spendable]
  );

  async function submitWithPin(pin: string): Promise<string | null> {
    if (!selected) return "No beneficiary selected";
    setSubmitting(true);
    try {
      const nonceRes = await fetch("/api/security/nonce");
      if (!nonceRes.ok) throw new Error("Could not start a secure session. Please retry.");
      const { nonce } = (await nonceRes.json()) as { nonce: string };

      const res = await fetch("/api/payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idemKey.current,
          "x-submit-nonce": nonce,
          "x-txn-pin": pin,
        },
        body: JSON.stringify({
          mode: "IMPS",
          amount: amountNum,
          beneficiaryId: selected.id,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.txnPin) return typeof json.error === "string" ? json.error : "PIN verification failed";
        const fieldErrors = json.error?.fieldErrors as Record<string, string[]> | undefined;
        const firstField = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined;
        const msg =
          typeof json.error === "string"
            ? json.error
            : (json.error?.formErrors?.[0] as string | undefined) ?? firstField ?? "Failed to submit payout";
        throw new Error(msg);
      }
      const data = await res.json();
      idemKey.current = crypto.randomUUID();
      setPinOpen(false);
      setResult({
        ...data.payout,
        reference: data.payout.id,
      });
      setStep("result");
      return null;
    } catch (err) {
      setPinOpen(false);
      onError(err instanceof Error ? err.message : "Failed to submit");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  const WIZARD_STEPS = [
    { key: "select-account", label: "Account" },
    { key: "enter-amount", label: "Amount" },
    { key: "confirm", label: "Confirm" },
    { key: "result", label: "Done" },
  ];

  /** Sticky right-hand receipt preview — pure display of the wizard's state. */
  const aside = (
    <>
      <SummaryPanel
        title="Payout preview"
        status={
          step === "confirm"
            ? { label: "Awaiting PIN", variant: "warning", dot: true }
            : selected && quote && !insufficient
              ? { label: "Ready to send", variant: "accent", dot: true }
              : { label: "In progress", variant: "default" }
        }
        rows={[
          { label: "To", value: selected ? selected.verifiedName || selected.holderName : "—", muted: !selected },
          { label: "Account", value: selected ? `•••• ${selected.accountLast4}` : "—", mono: true, muted: !selected },
          { label: "IFSC", value: selected?.ifsc ?? "—", mono: true, muted: !selected },
          { label: "Mode", value: "IMPS · instant", tone: "brand" },
          ...(amountNum > 0
            ? [
                { label: "Beneficiary receives", value: inr2(amountNum) },
                { label: "Service charge", value: quote ? inr2(quote.serviceCharge) : "—", muted: !quote },
                { label: `GST${quote ? ` (${quote.gstPercent}%)` : ""}`, value: quote ? inr2(quote.gst) : "—", muted: !quote },
              ]
            : []),
        ]}
        total={quote ? inr2(quote.totalDebit) : amountNum > 0 ? inr2(amountNum) : undefined}
        totalLabel="You pay"
        totalHint={quoting ? "Updating charges…" : "Held on submit, debited on success"}
        footer={
          <InfoChip
            tone={insufficient ? "coral" : "accent"}
            icon={<Wallet className="h-3.5 w-3.5" />}
            label="Spendable"
            value={inr2(spendable)}
          />
        }
      />
      <AsideTips
        items={[
          { icon: <Zap className="h-4 w-4" />, text: "IMPS lands in the beneficiary's account within seconds, 24×7." },
          { icon: <ShieldCheck className="h-4 w-4" />, text: "Every payout is confirmed with your transaction PIN and comes with a UTR." },
        ]}
      />
    </>
  );

  if (step === "select-account") {
    return (
      <ServiceLayout aside={aside}>
        <ServiceCard
          icon={<IconTile tone="energy" size="lg"><CreditCard className="h-5 w-5" /></IconTile>}
          eyebrow="Step 1 of 3"
          title="Select bank account"
          description="Choose a verified beneficiary to send the payout to."
        >
          <StepHeader className="mb-5" layoutId="payout-steps" steps={WIZARD_STEPS} current={step} />
          <ul className="grid gap-2">
            {beneficiaries.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => {
                    setSelected(b);
                    setStep("enter-amount");
                  }}
                  className="gradient-ring group flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-ink-100 transition hover:ring-ink-200 focus-energy"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile tone="brand" size="md">
                      <Building2 className="h-5 w-5" />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{b.verifiedName || b.holderName}</p>
                      <p className="font-mono text-xs text-ink-500">****{b.accountLast4} · {b.ifsc}</p>
                    </div>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-50 text-ink-400 transition group-hover:bg-ink-950 group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ServiceCard>
      </ServiceLayout>
    );
  }

  if (step === "enter-amount" && selected) {
    return (
      <ServiceLayout aside={aside}>
        <ServiceCard
          icon={<IconTile tone="energy" size="lg"><IndianRupee className="h-5 w-5" /></IconTile>}
          eyebrow="Step 2 of 3"
          title="Payout details"
          description="Enter the amount — charges are quoted live before you confirm."
        >
          <div className="grid gap-5">
            <StepHeader layoutId="payout-steps" steps={WIZARD_STEPS} current={step} />

            <div className="flex items-center gap-3 rounded-2xl bg-brand-50/60 p-3 ring-1 ring-brand-100">
              <IconTile tone="brand" size="sm">
                <Building2 className="h-4 w-4" />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{selected.verifiedName || selected.holderName}</p>
                <p className="font-mono text-xs text-brand-800">****{selected.accountLast4} · {selected.ifsc}</p>
              </div>
              <button
                onClick={() => setStep("select-account")}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:ring-brand-300 focus-energy"
              >
                Change
              </button>
            </div>

            <div>
              <FloatField
                id="payout-amount"
                label="Amount (₹)"
                type="number"
                display
                inputMode="decimal"
                value={amount}
                min={1}
                onChange={(e) => setAmount(e.target.value)}
              />
              <AmountChips
                className="mt-3"
                amounts={[500, 1000, 2000, 5000, 10000]}
                value={amount}
                onPick={(v) => setAmount(String(v))}
              />
            </div>

            <Field label="Transfer mode">
              <div className="grid grid-cols-3 gap-2">
                <ModeChip active label="IMPS (instant)" icon={<Zap className="h-3.5 w-3.5" />} />
                <ModeChip disabled label="NEFT" note="Coming soon" />
                <ModeChip disabled label="RTGS" note="Coming soon" />
              </div>
            </Field>

            {amountNum > 0 && (
              <ChargeBreakdown
                amount={amountNum}
                amountLabel="Beneficiary receives"
                serviceCharge={quote?.serviceCharge}
                gst={quote?.gst}
                gstLabel={`GST${quote ? ` (${quote.gstPercent}%)` : ""}`}
                totalDebit={quote?.totalDebit}
                totalLabel="Total debit"
                loading={quoting}
              />
            )}

            {insufficient && (
              <Notice tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
                Total debit exceeds your spendable balance.
              </Notice>
            )}

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setStep("select-account")}>
                Back
              </Button>
              <Button
                size="lg"
                onClick={() => setStep("confirm")}
                disabled={!quote || insufficient || amountNum <= 0}
              >
                Review & confirm
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ServiceCard>
      </ServiceLayout>
    );
  }

  if (step === "confirm" && selected) {
    return (
      <ServiceLayout aside={aside}>
        <ServiceCard
          icon={<IconTile tone="energy" size="lg"><CheckCircle2 className="h-5 w-5" /></IconTile>}
          eyebrow="Step 3 of 3"
          title="Confirm payout"
          description="Review carefully — this cannot be undone once approved."
        >
          <div className="grid gap-5">
            <StepHeader layoutId="payout-steps" steps={WIZARD_STEPS} current={step} />

            <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-6 text-white grain">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-energy-gradient opacity-40 blur-3xl"
              />
              <div className="relative">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  <span className="brand-dot" />
                  Beneficiary receives
                </p>
                <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em] tabular-nums">{inr2(amountNum)}</p>
                {quote && (
                  <p className="mt-2 text-xs text-white/60">
                    You pay {inr2(quote.totalDebit)} (₹{quote.serviceCharge} charge + ₹{quote.gst} GST)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoTile label="Beneficiary" value={selected.verifiedName || selected.holderName} />
              <InfoTile label="Account" value={`****${selected.accountLast4}`} mono />
              <InfoTile label="IFSC" value={selected.ifsc} mono />
              <InfoTile label="Mode" value="IMPS (instant)" />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="ghost" className="sm:w-32" onClick={() => setStep("enter-amount")}>
                Back
              </Button>
              <Button size="xl" className="flex-1" onClick={() => setPinOpen(true)}>
                <Send className="h-4 w-4" />
                Confirm & send {quote ? inr2(quote.totalDebit) : ""}
              </Button>
            </div>
            <SecureFootnote>Confirmed with your transaction PIN · funds are held on submit and debited only on success.</SecureFootnote>
          </div>

          <TxnPinDialog
            open={pinOpen}
            title="Confirm payout"
            detail={`IMPS · ${selected.verifiedName || selected.holderName}`}
            amount={quote?.totalDebit ?? amountNum}
            busy={submitting}
            onConfirm={submitWithPin}
            onCancel={() => !submitting && setPinOpen(false)}
          />
        </ServiceCard>
      </ServiceLayout>
    );
  }

  if (step === "result" && result) {
    return <PayoutReceipt result={result} onDone={onDone} onRefresh={onRefresh} />;
  }

  return null;
}

function ModeChip({
  active,
  disabled,
  label,
  icon,
  note,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  icon?: React.ReactNode;
  note?: string;
}) {
  return (
    <div
      data-active={active}
      className={cn(
        "gradient-ring flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2.5 text-xs font-semibold ring-1",
        active
          ? "bg-gradient-to-br from-royal-50/70 via-white to-coral-50/50 text-ink-900 shadow-energy-sm ring-transparent"
          : disabled
            ? "bg-ink-50 text-ink-400 ring-ink-100"
            : "bg-white text-ink-700 ring-ink-200"
      )}
    >
      <span className="inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      {note && <span className="text-[10px] font-normal opacity-70">{note}</span>}
    </div>
  );
}

function InfoTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl bg-ink-50/70 p-3.5 ring-1 ring-ink-100">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold text-ink-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt view (WhatsApp / Copy / Download / Print)
// ─────────────────────────────────────────────────────────────────────────────

function PayoutReceipt({
  result,
  onDone,
  onRefresh,
}: {
  result: PayoutResult;
  onDone: () => void;
  onRefresh?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { session } = useAuth();
  const payBy = session?.userCode
    ? `Pay by emoney by RT Code - ${session.userCode}`
    : "Pay by emoney";

  // A payout is disbursed asynchronously (approval → worker → provider), so the
  // status returned at submit time is almost always non-terminal. Poll the live
  // record until it settles so the receipt reflects the true outcome instead of
  // being frozen on "processing".
  const [live, setLive] = useState<PayoutResult>(result);
  const settled = isTerminalStatus(live.status);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (settled) return;
    let active = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~2 min at 3s cadence
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/payout/${live.id}`);
        if (res.ok && active) {
          const json = await res.json();
          const p = json.payout as Partial<PayoutResult> & { status: PayoutStatus };
          setLive((prev) => ({
            ...prev,
            status: p.status,
            utr: p.utr ?? prev.utr,
            failureReason: p.failureReason ?? prev.failureReason,
            totalDebit: typeof p.totalDebit === "number" ? p.totalDebit : prev.totalDebit,
          }));
          if (isTerminalStatus(p.status)) {
            onRefreshRef.current?.(); // refresh wallet snapshot (held → spendable)
            return;
          }
        }
      } catch {
        // transient — keep polling until the attempt cap
      }
      if (active && attempts < MAX_ATTEMPTS) timer = setTimeout(poll, 3000);
    };

    timer = setTimeout(poll, 3000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [settled, live.id]);

  const isSuccess = live.status === "SUCCESS";
  const isFailed =
    live.status === "FAILED" || live.status === "REJECTED" || live.status === "REVERSED";
  const isPolling = !settled;

  const headerGradient = isSuccess
    ? "from-emerald-500 to-emerald-700"
    : isFailed
    ? "from-rose-500 to-rose-700"
    : "from-amber-500 to-amber-600";

  const summaryText = `Payout Receipt
Status: ${STATUS_LABEL[live.status]}
Amount: ₹${live.amount.toFixed(2)}
Beneficiary: ${live.beneficiaryName}
Account: ****${live.accountLast4}
Mode: IMPS
${live.utr ? `UTR: ${live.utr}\n` : ""}Reference: ${live.reference || live.id}
Charges (incl. GST): ₹${(live.serviceCharge + live.gst).toFixed(2)}
Date: ${new Date(live.createdAt).toLocaleString("en-IN")}

${payBy}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-glow"
    >
      <div className={`bg-gradient-to-br ${headerGradient} p-6 text-center text-white`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, delay: 0.1 }}
          className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur"
        >
          {isSuccess ? <CheckCircle2 className="h-9 w-9" /> : isFailed ? <XCircle className="h-9 w-9" /> : <Clock className="h-9 w-9" />}
        </motion.div>
        <h3 className="font-display text-xl font-bold">
          {isSuccess ? "Payout successful" : isFailed ? "Payout failed" : "Payout processing"}
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/80">
          {isPolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {live.status === "PENDING_APPROVAL"
            ? "Awaiting approval by the checker"
            : live.status === "APPROVED"
            ? "Processing your payout"
            : live.status === "PROCESSING"
            ? "Sending to the bank…"
            : STATUS_LABEL[live.status]}
        </p>
        <p className="mt-3 font-display text-3xl font-bold">{inr2(live.amount)}</p>
      </div>

      <div className="p-6">
        {/* A failed/rejected/reversed payout returns the held amount to the wallet.
            Make that explicit so the retailer never thinks the money is lost. */}
        {isFailed && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-800">Amount returned to your wallet</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {inr2(live.totalDebit)} has been released back to your spendable balance — no money
                left your wallet.
              </p>
              {live.failureReason && (
                <p className="mt-1 text-xs text-rose-600">Reason: {live.failureReason}</p>
              )}
            </div>
          </div>
        )}

        <div className="mb-5 border-t-2 border-dashed border-ink-200" />

        <div className="space-y-2">
          <ReceiptRow label="Status" value={STATUS_LABEL[live.status]} strong />
          <ReceiptRow label="Beneficiary" value={live.beneficiaryName} />
          <ReceiptRow label="Account" value={`****${live.accountLast4}`} mono />
          <ReceiptRow label="Mode" value="IMPS" />
          {live.utr && <ReceiptRow label="UTR" value={live.utr} mono copy />}
          <ReceiptRow label="Reference" value={live.reference || live.id} mono copy />
          <ReceiptRow label="Amount" value={inr2(live.amount)} />
          <ReceiptRow label="Service charge" value={inr2(live.serviceCharge)} />
          <ReceiptRow label={`GST (18%)`} value={inr2(live.gst)} />
          <ReceiptRow label="Total debit" value={inr2(live.totalDebit)} strong />
          <ReceiptRow
            label="Date"
            value={new Date(live.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </div>

        <div className="my-5 border-t-2 border-dashed border-ink-200" />

        <p className="mb-4 text-center text-sm font-semibold text-emerald-600">{payBy}</p>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Share receipt</p>
        <div className="grid grid-cols-4 gap-2">
          <ShareBtn
            icon={<MessageCircle className="h-5 w-5" />}
            label="WhatsApp"
            color="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, "_blank")}
          />
          <ShareBtn
            icon={copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            label={copied ? "Copied!" : "Copy"}
            color="bg-brand-50 text-brand-700 hover:bg-brand-100"
            onClick={async () => {
              await navigator.clipboard.writeText(summaryText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          />
          <ShareBtn
            icon={<Download className="h-5 w-5" />}
            label="Download"
            color="bg-violet-50 text-violet-700 hover:bg-violet-100"
            onClick={() => {
              const blob = new Blob([summaryText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `payout_${live.reference || live.id}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
          <ShareBtn
            icon={<Printer className="h-5 w-5" />}
            label="Print"
            color="bg-ink-100 text-ink-800 hover:bg-ink-200"
            onClick={() => printReceipt(live, summaryText, headerGradient, payBy)}
          />
        </div>

        {isPolling && (
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Tracking live status — this updates automatically.
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
  strong,
  copy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  copy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-2 last:border-b-0">
      <span className="text-sm text-ink-500">{label}</span>
      <span className="flex items-center gap-1.5">
        <span
          className={`text-sm ${mono ? "font-mono" : ""} ${strong ? "font-bold text-ink-900" : "font-semibold text-ink-800"}`}
        >
          {value}
        </span>
        {copy && (
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            aria-label="Copy"
            className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </span>
    </div>
  );
}

function ShareBtn({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl p-3 text-[11px] font-semibold transition-colors ${color}`}
    >
      {icon}
      {label}
    </button>
  );
}

function printReceipt(result: PayoutResult, text: string, gradient: string, payBy: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
<html>
  <head>
    <title>Payout Receipt · ${result.reference || result.id}</title>
    <style>
      body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; max-width: 420px; margin: 24px auto; padding: 20px; color: #111827; }
      .head { text-align: center; padding: 24px; border-radius: 16px; color: #fff; background: linear-gradient(135deg, ${gradient.includes("emerald") ? "#10b981, #047857" : gradient.includes("rose") ? "#ef4444, #b91c1c" : "#f59e0b, #d97706"}); }
      .amt { font-size: 28px; font-weight: 800; margin-top: 8px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
      .lab { color: #6b7280; }
      .val { font-weight: 600; }
      .div { border-top: 2px dashed #e5e7eb; margin: 16px 0; }
      .foot { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 20px; }
    </style>
  </head>
  <body>
    <div class="head">
      <div style="font-weight:700">JMP eMoney · Payout</div>
      <div class="amt">₹${result.amount.toFixed(2)}</div>
    </div>
    <div class="div"></div>
    ${text
      .split("\n")
      .slice(1)
      .map((line) => {
        const [lab, ...rest] = line.split(":");
        if (!lab || rest.length === 0) return "";
        return `<div class="row"><span class="lab">${lab.trim()}</span><span class="val">${rest.join(":").trim()}</span></div>`;
      })
      .join("")}
    <div class="div"></div>
    <div class="foot"><div style="font-weight:600;color:#059669;margin-bottom:4px">${payBy}</div>JMP eMoney · Payout Receipt</div>
  </body>
</html>`);
  printWindow.document.close();
  printWindow.print();
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-beneficiary panel (with penny-drop) + celebration overlay
// ─────────────────────────────────────────────────────────────────────────────

function AddBeneficiaryPanel({
  fee,
  onDone,
  onError,
}: {
  fee: Fee | null;
  onDone: () => void;
  onError: (msg: string | null) => void;
}) {
  const [accNumber, setAccNumber] = useState("");
  const [confirmAcc, setConfirmAcc] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<
    | null
    | {
        kind: "success";
        beneficiary: Beneficiary;
      }
    | {
        kind: "pending";
        message: string;
      }
    | {
        kind: "failed";
        message: string;
      }
  >(null);
  const [countdown, setCountdown] = useState(3);

  const namesMatch = accNumber && confirmAcc && accNumber === confirmAcc;
  const canSubmit =
    !submitting &&
    ACCOUNT_RE.test(accNumber) &&
    accNumber === confirmAcc &&
    IFSC_RE.test(ifsc) &&
    holderName.trim().length >= 3 &&
    /^\d{10}$/.test(contactMobile);

  // Celebration countdown
  useEffect(() => {
    if (outcome?.kind !== "success") return;
    if (countdown <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [outcome, countdown, onDone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    setOutcome(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payout/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: accNumber,
          confirmAccountNumber: confirmAcc,
          ifsc: ifsc.toUpperCase(),
          holderName: holderName.trim(),
          contactMobile,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const fieldErrors = data.error?.fieldErrors as Record<string, string[]> | undefined;
        const firstField = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined;
        const msg =
          typeof data.error === "string" ? data.error : (data.error?.formErrors?.[0] as string | undefined) ?? firstField ?? "Failed to verify";
        throw new Error(msg);
      }

      const bene = data.beneficiary as Beneficiary;
      if (bene.isVerified) {
        setOutcome({ kind: "success", beneficiary: bene });
        setCountdown(3);
      } else if (bene.verificationStatus === "PENDING") {
        setOutcome({
          kind: "pending",
          message: data.pendingMessage || "Verification in progress. Use Re-check from the account list to poll.",
        });
      } else {
        setOutcome({
          kind: "failed",
          message: bene.failureReason || "Verification failed. Please double-check the details and try again.",
        });
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to verify");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ServiceLayout
        aside={
          <>
            {/* Live card preview */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative overflow-hidden rounded-3xl bg-ink-950 p-5 text-white grain"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-energy-gradient opacity-40 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-brand-400/25 blur-3xl" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    <span className="brand-dot" />
                    Bank account
                  </span>
                  <Banknote className="h-5 w-5 text-white/60" />
                </div>
                <div className="mb-5 font-display text-xl font-semibold tracking-[0.12em] tabular-nums">
                  {accNumber ? accNumber.match(/.{1,4}/g)?.join(" ") : "•••• •••• •••• ••••"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Holder</p>
                    <p className="truncate text-sm font-semibold">{holderName || "Account holder"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">IFSC</p>
                    <p className="font-mono text-sm">{ifsc || "XXXX0000000"}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <AsideTips
              title="How it works"
              items={[
                { icon: <IndianRupee className="h-4 w-4" />, text: `${fee ? inr2(fee.total) : "₹4 + GST"} debited from wallet` },
                { icon: <Send className="h-4 w-4" />, text: "₹1 sent via IMPS to your account" },
                { icon: <BadgeCheck className="h-4 w-4" />, text: "Bank confirms the beneficiary name" },
                { icon: <Sparkles className="h-4 w-4" />, text: "Account verified & ready for payouts" },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={handleSubmit}
          icon={<IconTile tone="accent" size="lg"><ShieldCheck className="h-5 w-5" /></IconTile>}
          eyebrow="Penny-drop verification"
          title="Add & verify bank account"
          description={
            <>
              We&apos;ll send <strong>₹1</strong> via IMPS to confirm the account is real.{" "}
              <strong>{fee ? inr2(fee.total) : "₹4 + GST"}</strong> is debited from your wallet as a one-time verification fee.
            </>
          }
        >
          <div className="grid gap-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FloatField
                id="bene-acc"
                label="Account number *"
                mono
                inputMode="numeric"
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={18}
                hint="9–18 digits"
                required
              />
              <FloatField
                id="bene-acc-confirm"
                label="Confirm account number *"
                mono
                inputMode="numeric"
                value={confirmAcc}
                onChange={(e) => setConfirmAcc(e.target.value.replace(/\D/g, ""))}
                maxLength={18}
                required
                error={confirmAcc && !namesMatch ? "Account numbers do not match." : undefined}
                hint={namesMatch ? "Account numbers match" : "Re-enter account number"}
                className={namesMatch ? "[&>p]:text-accent-700" : undefined}
              />
              <FloatField
                id="bene-ifsc"
                label="IFSC *"
                mono
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={11}
                hint="e.g. HDFC0001234"
                required
              />
              <FloatField
                id="bene-holder"
                label="Account holder name *"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                hint="As per passbook"
                required
              />
            </div>

            <FloatField
              id="bene-mobile"
              label="Contact mobile *"
              type="tel"
              mono
              inputMode="numeric"
              value={contactMobile}
              onChange={(e) => setContactMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              hint="10-digit mobile"
              required
              className="max-w-xs"
            />

            {outcome?.kind === "pending" && (
              <Notice tone="warning" icon={<Clock className="h-4 w-4" />}>
                <p className="font-semibold">Verification in progress</p>
                <p className="text-xs">{outcome.message}</p>
              </Notice>
            )}
            {outcome?.kind === "failed" && (
              <Notice tone="danger" icon={<XCircle className="h-4 w-4" />}>
                <p className="font-semibold">Verification failed</p>
                <p className="text-xs">{outcome.message}</p>
                <ul className="mt-2 list-disc pl-4 text-xs">
                  <li>Confirm the account number from your passbook / cheque</li>
                  <li>Confirm the IFSC matches the branch (not the bank code)</li>
                  <li>Confirm the account is active and not closed/frozen</li>
                </ul>
              </Notice>
            )}

            <Button type="submit" size="xl" className="w-full" isLoading={submitting} disabled={!canSubmit}>
              <ShieldCheck className="h-4 w-4" />
              Verify & add account{fee ? ` (${inr2(fee.total)})` : ""}
            </Button>
          </div>
        </ServiceCard>
      </ServiceLayout>

      {/* Celebration overlay */}
      <AnimatePresence>
        {outcome?.kind === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink-900/60 p-4 backdrop-blur"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 200 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-glow"
            >
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                  >
                    <Sparkles className="h-3 w-3 text-white/80" />
                  </motion.div>
                ))}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.2 }}
                  className="absolute -bottom-10 left-1/2 grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full border-4 border-emerald-500 bg-white shadow-glow"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </motion.div>
              </div>
              <div className="px-6 pt-14 pb-6 text-center">
                <h3 className="font-display text-2xl font-bold text-ink-900">Verification successful!</h3>
                <p className="mt-1 text-sm text-ink-500">Your bank account is ready to receive payouts.</p>

                {outcome.beneficiary.verifiedName && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                    <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                      <BadgeCheck className="h-3 w-3" />
                      Verified by bank
                    </div>
                    <p className="font-display text-lg font-bold text-ink-900">{outcome.beneficiary.verifiedName}</p>
                    <p className="mt-0.5 font-mono text-xs text-ink-500">
                      ****{outcome.beneficiary.accountLast4} · {outcome.beneficiary.ifsc}
                    </p>
                  </div>
                )}

                <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Redirecting in {countdown}s…
                </p>

                <Button size="lg" className="mt-4 w-full" onClick={onDone}>
                  Go to payouts
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
