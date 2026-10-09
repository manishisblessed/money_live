"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  CircleDollarSign,
  TrendingUp,
  Layers,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { FilterBar, SectionCard, Stagger, StaggerItem } from "@/components/dashboard/patterns";
import { formatINR } from "@/lib/utils";

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to load");
  return r.json();
}

type EarningsResponse = {
  totalEarnings: number;
  totalGross: number;
  totalTds: number;
  totalCredits: number;
  byService: Array<{ service: string; amount: number; count: number }>;
  credits: Array<{
    id: string;
    tier: string;
    amount: number;
    grossAmount: number | null;
    tdsAmount: number;
    service: string;
    txnAmount: number;
    txnRefId: string;
    txnUserId: string;
    customer: string | null;
    createdAt: string;
  }>;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function serviceName(code: string) {
  const map: Record<string, string> = {
    BILL_ELECTRICITY: "Electricity",
    BILL_WATER: "Water",
    BILL_GAS: "Gas",
    BILL_CREDIT_CARD: "Credit Card",
    BILL_EDUCATION: "Education",
    BILL_INSURANCE: "Insurance",
    RECHARGE_MOBILE: "Mobile Recharge",
    RECHARGE_DTH: "DTH Recharge",
    DMT_IMPS: "IMPS",
    DMT_NEFT: "NEFT",
    AEPS_WITHDRAW: "AePS Withdraw",
    PAN_CARD: "PAN Card",
    POS: "POS Settlement",
    QR: "QR Settlement",
    PG: "PG Settlement",
    WALLET_TOPUP: "Wallet Top-up",
  };
  return map[code] ?? code.replace(/_/g, " ");
}

function tierBadge(tier: string) {
  const v: Record<string, "success" | "brand" | "warning" | "default"> = {
    RETAILER: "success",
    DISTRIBUTOR: "brand",
    MASTER: "warning",
    SUPER: "default",
  };
  return <Badge variant={v[tier] ?? "default"}>{tier}</Badge>;
}

export default function EarningsPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const { data, isLoading } = useSWR<EarningsResponse>(
    `/api/network/earnings?${params}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const credits = data?.credits ?? [];
  const pagination = data?.pagination;
  const byService = data?.byService ?? [];

  const cols: Column<(typeof credits)[0]>[] = [
    {
      key: "createdAt",
      header: "Date",
      render: (r) => (
        <span className="text-xs">
          {new Date(r.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    { key: "tier", header: "Tier", render: (r) => tierBadge(r.tier) },
    { key: "service", header: "Service", render: (r) => <span className="text-xs">{serviceName(r.service)}</span> },
    {
      key: "txnAmount",
      header: "Txn Amount",
      align: "right",
      render: (r) => <span className="text-xs text-ink-600">{formatINR(r.txnAmount)}</span>,
    },
    {
      key: "grossAmount",
      header: "Gross",
      align: "right",
      render: (r) => (
        <span className="text-xs text-ink-600">
          {r.grossAmount !== null ? formatINR(r.grossAmount) : "—"}
        </span>
      ),
    },
    {
      key: "tdsAmount",
      header: "TDS (2%)",
      align: "right",
      render: (r) => <span className="text-xs text-rose-600">− {formatINR(r.tdsAmount)}</span>,
    },
    {
      key: "amount",
      header: "Net Credited",
      align: "right",
      render: (r) => <span className="font-semibold text-emerald-700">{formatINR(r.amount)}</span>,
    },
    {
      key: "txnRefId",
      header: "Txn Ref",
      render: (r) => <span className="font-mono text-xs">{r.txnRefId ?? "—"}</span>,
    },
  ];

  const sortedByService = [...byService].sort((a, b) => b.amount - a.amount);
  const topService = sortedByService[0];

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My earnings"
        description="Commission credited to your wallet from every transaction across your network."
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Net earnings (credited)"
            value={data ? formatINR(data.totalEarnings) : "…"}
            icon={CircleDollarSign}
            accent="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="TDS withheld (2%)"
            value={data ? formatINR(data.totalTds) : "…"}
            icon={Download}
            accent="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Total credits"
            value={data ? String(data.totalCredits) : "…"}
            icon={TrendingUp}
            accent="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Active services"
            value={data ? String(byService.length) : "…"}
            icon={Layers}
            accent="violet"
          />
        </StaggerItem>
      </Stagger>

      {/* Service breakdown */}
      {byService.length > 0 && (
        <SectionCard
          eyebrow="Breakdown"
          title="Earnings by service"
          description={
            topService
              ? `${serviceName(topService.service)} is your top earner this period.`
              : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedByService.map((s, i) => {
              const share = data && data.totalEarnings > 0 ? Math.round((s.amount / data.totalEarnings) * 100) : 0;
              return (
                <div
                  key={s.service}
                  className="group relative overflow-hidden rounded-2xl bg-ink-50/60 p-4 ring-1 ring-inset ring-ink-100 transition-colors hover:bg-white hover:ring-brand-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink-900">{serviceName(s.service)}</div>
                      <div className="text-xs text-ink-500">{s.count.toLocaleString("en-IN")} transactions</div>
                    </div>
                    {i === 0 && <Badge variant="energy" size="sm">Top</Badge>}
                  </div>
                  <div className="mt-3 font-display text-xl font-semibold tracking-[-0.02em] text-emerald-700">
                    {formatINR(s.amount)}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-400"
                      style={{ width: `${Math.max(4, share)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-ink-400">{share}% of net earnings</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Filters */}
      <FilterBar
        title="Commission credits"
        count={pagination?.total}
        hint="pick a date range to narrow the list"
      >
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-500">
          From
          <Input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="h-10 w-auto"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-500">
          To
          <Input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="h-10 w-auto"
          />
        </label>
      </FilterBar>

      <DataTable
        columns={cols}
        data={credits}
        loading={isLoading}
        empty="No commission credits yet — they'll land here the moment your first transaction settles."
      />

      {pagination && pagination.totalPages > 1 && (
        <Pagination page={page} pageSize={pagination.pageSize} total={pagination.total} onPageChange={setPage} />
      )}
    </div>
  );
}
