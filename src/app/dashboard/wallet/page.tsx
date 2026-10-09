"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Loader2,
  FileDown,
  CheckCircle2,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { Lightning, QrCode, ShieldCheck } from "@phosphor-icons/react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Button } from "@/components/ui/Button";
import {
  TransactionResult,
  type TxnResult,
} from "@/components/dashboard/TransactionResult";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import {
  ServiceLayout,
  ServiceCard,
  Field,
  Notice,
} from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { OperatorGrid } from "@/components/dashboard/services/OperatorGrid";
import { PillTabs } from "@/components/dashboard/services/StepHeader";
import { generateRefId, formatINR, cn } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";

type WalletTxn = {
  id: string;
  direction: "CREDIT" | "DEBIT";
  reason: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  refType: string | null;
  refId: string | null;
  createdAt: string;
};

type WalletData = {
  balance: number;
  monthlyIn: number;
  monthlyOut: number;
  recentTxns: WalletTxn[];
};

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
  RENTAL: "POS rental",
};

type PendingTopup = {
  refId: string;
  amount: number;
  paymentUrl?: string;
  upiIntent?: string;
};

type PgChannel = {
  id: string;
  label: string;
  route: string;
  primary: boolean;
  healthy: boolean;
  detail: string;
  checkedAt: string;
};

export default function WalletPage() {
  const { session } = useAuth();
  const [data, setData] = useState<WalletData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState("");
  const [payVia, setPayVia] = useState<"page" | "vpa">("page");
  const [vpa, setVpa] = useState("");
  const [channels, setChannels] = useState<PgChannel[]>([]);
  const [channel, setChannel] = useState<string>("");
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingTopup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TxnResult>(null);
  const [stmtPeriod, setStmtPeriod] = useState<"this-month" | "last-month" | "last-90">("this-month");
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function statementUrl(format: "pdf" | "csv") {
    const now = new Date();
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    let from: Date;
    let to: Date = now;
    if (stmtPeriod === "last-month") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (stmtPeriod === "last-90") {
      from = new Date(now.getTime() - 90 * 24 * 3600_000);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return `/api/wallet/statement?from=${iso(from)}&to=${iso(to)}&format=${format}`;
  }

  const fetchWallet = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch("/api/wallet");
      if (res.ok) setData(await res.json());
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      setChannelsLoading(true);
      // Health is served from the shared worker snapshot + short server cache;
      // the refresh button simply re-reads it (no user-triggered probe orders).
      const res = await fetch(`/api/wallet/topup/channels`);
      if (!res.ok) return;
      const d = (await res.json()) as { channels?: PgChannel[] };
      const list = d.channels ?? [];
      setChannels(list);
      if (list.length) {
        const healthy = list.filter((c) => c.healthy);
        const preferred =
          list.find((c) => c.primary && c.healthy) || healthy[0] || list.find((c) => c.primary) || list[0];
        // Keep the user's pick if it's still healthy; otherwise pick the best.
        setChannel((prev) => {
          const kept = list.find((c) => c.id === prev && c.healthy);
          return kept ? prev : preferred.id;
        });
      }
    } catch {
      /* selector just won't render — top-up still works on the default gateway */
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const checkTopup = useCallback(
    async (topup: PendingTopup): Promise<boolean> => {
      try {
        const res = await fetch(`/api/wallet/topup?refId=${encodeURIComponent(topup.refId)}`);
        if (!res.ok) return false;
        const d = (await res.json()) as { status: string };
        if (d.status === "SUCCESS") {
          stopPolling();
          setPending(null);
          setResult({
            refId: topup.refId,
            service: "Wallet top-up",
            amount: topup.amount,
            meta: { Status: "Credited to wallet" },
          });
          fetchWallet();
          return true;
        }
        if (d.status === "FAILED") {
          stopPolling();
          setPending(null);
          setError("Payment failed or expired. No amount was credited — try again.");
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [fetchWallet, stopPolling]
  );

  const startPolling = useCallback(
    (topup: PendingTopup) => {
      stopPolling();
      let attempts = 0;
      pollTimer.current = setInterval(async () => {
        attempts += 1;
        const done = await checkTopup(topup);
        // Give up after ~5 minutes; user can still hit "Check status".
        if (!done && attempts >= 60) stopPolling();
      }, 5000);
    },
    [checkTopup, stopPolling]
  );

  useEffect(() => {
    fetchWallet();
    fetchChannels();
    // Resume a top-up when redirected back from the payment page
    // (?topup=TOPUPXXXX in the callback URL).
    const params = new URLSearchParams(window.location.search);
    const refId = params.get("topup");
    if (refId?.startsWith("TOPUP")) {
      const resumed = { refId, amount: 0 };
      setPending(resumed);
      checkTopup(resumed);
      startPolling(resumed);
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balance = data?.balance ?? session?.walletBalance ?? 0;

  async function submitTopup(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          ...(payVia === "vpa" && vpa ? { vpa } : {}),
          ...(channel ? { channel } : {}),
          idempotencyKey: generateRefId("TOPREQ"),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(typeof d.error === "string" ? d.error : "Could not start the top-up. Try again.");
        return;
      }
      const topup: PendingTopup = {
        refId: d.refId,
        amount: amt,
        paymentUrl: d.paymentUrl,
        upiIntent: d.upiIntent,
      };
      setPending(topup);
      setAmount("");
      if (d.paymentUrl) window.open(d.paymentUrl, "_blank", "noopener");
      startPolling(topup);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const amountNum = Number(amount) || 0;
  const selectedChannel = channels.find((c) => c.id === channel);
  const allChannelsDown = channels.length > 0 && channels.every((c) => !c.healthy);

  const historyColumns: Column<WalletTxn>[] = [
    {
      key: "direction",
      header: "Type",
      render: (t) => (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl ring-1 ring-inset",
              t.direction === "CREDIT"
                ? "bg-accent-50 text-accent-700 ring-accent-100"
                : "bg-coral-50 text-coral-600 ring-coral-100"
            )}
          >
            {t.direction === "CREDIT" ? (
              <ArrowDownLeft className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )}
          </span>
          <Badge size="sm" variant={t.direction === "CREDIT" ? "success" : "danger"}>
            {t.direction}
          </Badge>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Description",
      render: (t) => (
        <div>
          <div className="font-medium text-ink-900">{REASON_LABELS[t.reason] ?? t.reason}</div>
          {t.note && <div className="text-xs text-ink-500">{t.note}</div>}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (t) => (
        <span
          className={cn(
            "font-display text-base font-semibold tabular-nums tracking-[-0.02em]",
            t.direction === "CREDIT" ? "text-accent-700" : "text-coral-700"
          )}
        >
          {t.direction === "CREDIT" ? "+" : "−"}
          {formatINR(t.amount)}
        </span>
      ),
    },
    {
      key: "balanceAfter",
      header: "Balance after",
      align: "right",
      render: (t) => <span className="tabular-nums text-ink-600">{formatINR(t.balanceAfter)}</span>,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (t) => (
        <span className="text-xs text-ink-500">
          {new Date(t.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Wallet}
        title="eMoney Wallet"
        description="Add money in seconds via UPI or cards, and keep an eye on every rupee in and out."
      />

      {/* Balance band + monthly stats */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-4xl bg-ink-950 p-6 text-white grain lg:col-span-2 sm:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-energy-gradient opacity-40 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                <span className="brand-dot" />
                Available balance
              </p>
              <p className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] tabular-nums sm:text-5xl">
                {formatINR(balance)}
              </p>
              <p className="mt-2 text-xs text-white/60">
                Paise-perfect, updated live. Every service debits from here.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchWallet}
              disabled={fetching}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-60 focus-energy"
              title="Refresh balance"
              aria-label="Refresh balance"
            >
              <RefreshCw className={cn("h-4 w-4", fetching && "animate-spin")} />
            </button>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <Badge variant="energy" size="sm" dot>
              Live
            </Badge>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">
              UPI · Cards · Net banking
            </Badge>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">
              Instant credit
            </Badge>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="This month in"
            value={formatINR(data?.monthlyIn ?? 0)}
            icon={ArrowDownLeft}
            tone="accent"
            loading={fetching && !data}
          />
          <StatCard
            label="This month out"
            value={formatINR(data?.monthlyOut ?? 0)}
            icon={ArrowUpRight}
            tone="coral"
            loading={fetching && !data}
          />
        </div>
      </div>

      <ServiceLayout
        className="mb-6"
        aside={
          mode === "add" ? (
            <>
              <SummaryPanel
                title="Top-up preview"
                status={
                  pending
                    ? { label: "Awaiting payment", variant: "warning", dot: true }
                    : amountNum > 0
                      ? { label: "Ready", variant: "accent", dot: true }
                      : { label: "Enter an amount", variant: "default" }
                }
                rows={[
                  {
                    label: "Gateway",
                    value: selectedChannel?.label ?? (channels.length ? "—" : "Default"),
                    muted: !selectedChannel && channels.length > 0,
                  },
                  {
                    label: "Method",
                    value: payVia === "vpa" ? "UPI collect" : "Payment page",
                  },
                  ...(payVia === "vpa"
                    ? [{ label: "UPI ID", value: vpa || "—", mono: true, muted: !vpa }]
                    : []),
                  ...(pending
                    ? [{ label: "Reference", value: pending.refId, mono: true }]
                    : []),
                ]}
                total={formatINR(pending && pending.amount > 0 ? pending.amount : amountNum)}
                totalLabel="Adds to wallet"
                totalHint="No charges on wallet top-ups"
              />
              <AsideTips
                items={[
                  { icon: <Lightning weight="duotone" />, text: "Money lands in your wallet the moment the payment succeeds." },
                  { icon: <QrCode weight="duotone" />, text: "UPI collect sends a request to your UPI app — approve it there." },
                  { icon: <ShieldCheck weight="duotone" />, text: "Failed or expired payments are never debited." },
                ]}
              />
            </>
          ) : (
            <AsideTips
              title="About withdrawals"
              items={[
                { icon: <Lightning weight="duotone" />, text: "Payouts move wallet money to any bank account or UPI ID." },
                { icon: <ShieldCheck weight="duotone" />, text: "Every payout comes with live status and a UTR receipt." },
              ]}
            />
          )
        }
      >
        <ServiceCard>
          <PillTabs
            fill
            layoutId="wallet-mode"
            tabs={[
              { key: "add", label: "Add money", icon: <ArrowDownToLine className="h-4 w-4" /> },
              { key: "withdraw", label: "Withdraw to bank", icon: <ArrowUpFromLine className="h-4 w-4" /> },
            ]}
            value={mode}
            onChange={setMode}
          />

          {mode === "withdraw" ? (
            <div className="mt-5 rounded-3xl bg-ink-50/70 p-6 ring-1 ring-ink-100">
              <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">
                Withdrawals run through Payouts
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Send money from your wallet to any bank account or UPI ID with
                live status tracking and UTR receipts.
              </p>
              <Link href="/dashboard/payout">
                <Button size="lg" className="mt-5 w-full">
                  Go to Payouts
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : pending ? (
            <div className="mt-5 rounded-3xl bg-gradient-to-br from-brand-50 via-white to-royal-50/60 p-6 ring-1 ring-brand-100">
              <div className="flex items-center gap-3">
                <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white text-brand-600 ring-1 ring-brand-100">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">
                    Waiting for your payment…
                  </p>
                  <p className="text-xs text-ink-600">
                    Reference <span className="font-mono">{pending.refId}</span>
                    {pending.amount > 0 && <> · {formatINR(pending.amount)}</>}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-600">
                Your wallet is credited automatically once the payment completes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pending.paymentUrl && (
                  <a href={pending.paymentUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                      Reopen payment page
                    </Button>
                  </a>
                )}
                <Button type="button" variant="outline" onClick={() => checkTopup(pending)}>
                  <RefreshCw className="h-4 w-4" />
                  Check status
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    stopPolling();
                    setPending(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitTopup} className="mt-5 grid gap-5">
              <div>
                <FloatField
                  id="amount"
                  label="Amount (₹)"
                  type="number"
                  required
                  display
                  min={1}
                  max={200000}
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  hint="Up to ₹2,00,000 per top-up"
                />
                <AmountChips
                  className="mt-3"
                  amounts={[500, 1000, 2000, 5000, 10000, 25000]}
                  value={amount}
                  onPick={(v) => setAmount(String(v))}
                />
              </div>

              {channels.length > 0 && (
                <Field
                  label="Payment gateway"
                  error={allChannelsDown ? "All payment gateways are currently unavailable. Please try again shortly." : undefined}
                  action={
                    <button
                      type="button"
                      onClick={() => fetchChannels()}
                      disabled={channelsLoading}
                      className="flex items-center gap-1 text-[11px] font-medium text-ink-500 transition hover:text-brand-600 disabled:opacity-60"
                      title="Refresh gateway status"
                    >
                      <RefreshCw className={cn("h-3 w-3", channelsLoading && "animate-spin")} />
                      Refresh status
                    </button>
                  }
                >
                  <div className="grid grid-cols-2 gap-2">
                    {channels.map((c) => {
                      const active = channel === c.id;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          disabled={!c.healthy}
                          onClick={() => c.healthy && setChannel(c.id)}
                          data-active={active && c.healthy}
                          aria-pressed={active}
                          className={cn(
                            "gradient-ring flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left ring-1 transition focus-energy",
                            !c.healthy
                              ? "cursor-not-allowed bg-ink-50/60 opacity-70 ring-ink-100"
                              : active
                                ? "bg-gradient-to-br from-royal-50/70 via-white to-coral-50/50 shadow-energy-sm ring-transparent"
                                : "bg-white ring-ink-100 hover:ring-ink-200"
                          )}
                        >
                          <span className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-ink-800">
                            {c.healthy ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent-600" />
                            ) : (
                              <Ban className="h-3.5 w-3.5 text-coral-500" />
                            )}
                            {c.label}
                            {c.primary && (
                              <Badge variant="brand" size="sm">
                                Primary
                              </Badge>
                            )}
                          </span>
                          <span className={cn("text-[11px]", c.healthy ? "text-accent-700" : "text-coral-600")}>
                            {c.healthy ? "Available" : c.detail || "Unavailable"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}

              <Field label="Payment method">
                <OperatorGrid
                  name="Payment method"
                  showLogo={false}
                  columns={2}
                  size="sm"
                  options={[
                    { value: "page", label: "Payment page", meta: "UPI / cards / net banking" },
                    { value: "vpa", label: "UPI collect", meta: "Request sent to your VPA" },
                  ]}
                  value={payVia}
                  onChange={(v) => setPayVia(v as "page" | "vpa")}
                />
              </Field>

              {payVia === "vpa" && (
                <FloatField
                  id="vpa"
                  label="Your UPI ID"
                  required
                  mono
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value.trim())}
                  hint="e.g. name@bank — approve the collect request in your UPI app."
                />
              )}

              {error && (
                <Notice tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
                  {error}
                </Notice>
              )}

              <Button type="submit" size="xl" className="w-full" isLoading={loading} disabled={loading}>
                {loading
                  ? "Starting top-up…"
                  : `Add ${amount ? formatINR(Number(amount)) : "money"} to wallet`}
              </Button>
            </form>
          )}
        </ServiceCard>
      </ServiceLayout>

      {/* Wallet transaction history — real data from DB */}
      <DataTable<WalletTxn>
        title="Wallet history"
        description={
          data?.recentTxns.length
            ? `Showing latest ${data.recentTxns.length} entries`
            : "No wallet transactions yet"
        }
        columns={historyColumns}
        data={data?.recentTxns ?? []}
        loading={fetching && !data}
        emptyIcon={Wallet}
        empty="No wallet transactions yet. Your history will show up here."
        action={
          <>
            <select
              value={stmtPeriod}
              onChange={(e) => setStmtPeriod(e.target.value as typeof stmtPeriod)}
              className="h-10 rounded-xl bg-white px-3 text-xs font-medium text-ink-700 ring-1 ring-ink-200 outline-none focus-energy"
              title="Statement period"
            >
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="last-90">Last 90 days</option>
            </select>
            <a href={statementUrl("pdf")} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" size="sm">
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
            </a>
            <a href={statementUrl("csv")} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" size="sm">
                <FileDown className="h-4 w-4" />
                CSV
              </Button>
            </a>
          </>
        }
      />

      <TransactionResult result={result} onClose={() => setResult(null)} />
    </div>
  );
}
