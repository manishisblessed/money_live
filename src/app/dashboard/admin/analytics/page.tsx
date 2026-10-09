"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatINR, formatNumber } from "@/lib/utils";
import { RefreshCw, Download } from "lucide-react";
import { ChartBar } from "@phosphor-icons/react";
import { EmptyState, FilterBar, SectionCard, Stagger, StaggerItem } from "@/components/dashboard/patterns";

type ServiceRow = {
  service: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
  volume: number;
  fees: number;
  commission: number;
  gst: number;
};

type TopUser = {
  user: { id: string; name: string; email: string; role: string; shopName: string | null };
  txns: number;
  volume: number;
  commission: number;
};

type Analytics = {
  range: { from: string; to: string };
  totals: { transactions: number; success: number; failed: number; volume: number; successRate: number };
  daily: Array<{ day: string; count: number; volume: number }>;
  services: ServiceRow[];
  topUsers: TopUser[];
};

function Stat({
  label,
  value,
  tone,
  hero,
  sub,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
  hero?: boolean;
  sub?: string;
}) {
  if (hero) {
    return (
      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-ink-950 p-5 text-white ring-1 ring-white/10 shadow-energy-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-energy-gradient opacity-40 blur-3xl" aria-hidden />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{label}</p>
        <div className="relative">
          <p className="font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] sm:text-4xl">{value}</p>
          {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl bg-white p-5 ring-1 ring-ink-100 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
      <div>
        <p
          className={`mt-2 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] ${
            tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-rose-600" : "text-ink-900"
          }`}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p;
  }, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?${params()}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Failed to load analytics");
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxVolume = Math.max(1, ...(data?.daily ?? []).map((d) => d.volume));

  const serviceColumns: Column<ServiceRow>[] = [
    {
      key: "service",
      header: "Service",
      render: (r) => <span className="font-semibold">{r.service.replace(/_/g, " ")}</span>,
    },
    { key: "total", header: "Txns", render: (r) => <span>{formatNumber(r.total)}</span> },
    {
      key: "rate",
      header: "Success rate",
      render: (r) => (
        <Badge variant={r.successRate >= 95 ? "success" : r.successRate >= 80 ? "warning" : "danger"}>
          {r.successRate}%
        </Badge>
      ),
    },
    { key: "volume", header: "Volume", render: (r) => <span className="font-semibold">{formatINR(r.volume)}</span> },
    { key: "fees", header: "Fees earned", render: (r) => <span>{formatINR(r.fees)}</span> },
    { key: "commission", header: "Commission paid", render: (r) => <span>{formatINR(r.commission)}</span> },
    { key: "gst", header: "GST", render: (r) => <span>{r.gst > 0 ? formatINR(r.gst) : "—"}</span> },
  ];

  const topUserColumns: Column<TopUser>[] = [
    {
      key: "user",
      header: "User",
      render: (r) => (
        <div>
          <p className="font-medium text-ink-900">{r.user.name}</p>
          <p className="text-xs text-ink-400">
            {r.user.shopName ? `${r.user.shopName} · ` : ""}
            {r.user.role.toLowerCase().replace(/_/g, " ")}
          </p>
        </div>
      ),
    },
    { key: "txns", header: "Txns", render: (r) => <span>{formatNumber(r.txns)}</span> },
    { key: "volume", header: "Volume", render: (r) => <span className="font-semibold">{formatINR(r.volume)}</span> },
    { key: "commission", header: "Commission earned", render: (r) => <span>{formatINR(r.commission)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Insights"
        title="Business analytics"
        description="Service-wise transaction performance, daily volume trend, and top performers — read-only reporting."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => window.open(`/api/admin/analytics?${params()}&format=csv`, "_blank")}
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/api/admin/analytics?${params()}&format=zip`, "_blank")}
            >
              <Download className="h-4 w-4" /> ZIP
            </Button>
          </>
        }
      />

      <FilterBar
        title="Date range"
        hint={data ? `${data.range.from} → ${data.range.to}` : undefined}
        actions={
          <Button onClick={load} isLoading={loading}>
            <RefreshCw className="h-4 w-4" /> Apply
          </Button>
        }
      >
        <div className="flex items-center gap-2">
          <Label htmlFor="an-from" className="mb-0 text-xs">From</Label>
          <Input id="an-from" type="date" className="h-10 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="an-to" className="mb-0 text-xs">To</Label>
          <Input id="an-to" type="date" className="h-10 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </FilterBar>

      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">{error}</div>
      )}

      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
          <PageSpinner label="Loading analytics…" />
        </div>
      )}

      {data && (
        <>
          {/* KPI bento */}
          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
            <StaggerItem className="col-span-2 row-span-2 xl:col-span-2">
              <Stat
                hero
                label="Volume (success)"
                value={formatINR(data.totals.volume)}
                sub={`${formatNumber(data.totals.success)} successful transactions`}
              />
            </StaggerItem>
            <StaggerItem className="xl:col-span-2">
              <Stat label="Transactions" value={formatNumber(data.totals.transactions)} />
            </StaggerItem>
            <StaggerItem className="xl:col-span-2">
              <Stat
                label="Success rate"
                value={`${data.totals.successRate}%`}
                tone={data.totals.successRate >= 95 ? "good" : undefined}
                sub={data.totals.successRate >= 95 ? "Healthy" : "Below the 95% target"}
              />
            </StaggerItem>
            <StaggerItem className="xl:col-span-2">
              <Stat label="Successful" value={formatNumber(data.totals.success)} tone="good" />
            </StaggerItem>
            <StaggerItem className="xl:col-span-2">
              <Stat label="Failed" value={formatNumber(data.totals.failed)} tone={data.totals.failed > 0 ? "bad" : undefined} />
            </StaggerItem>
          </Stagger>

          {/* Daily volume trend — CSS bars */}
          <SectionCard
            title="Daily success volume"
            description="Successful transaction value per day in the selected range."
          >
            {data.daily.length === 0 ? (
              <EmptyState
                compact
                icon={ChartBar}
                title="Nothing to chart yet"
                description="No successful transactions in this range."
              />
            ) : (
              <div className="flex h-44 items-end gap-1 overflow-x-auto">
                {data.daily.map((d) => (
                  <div key={d.day} className="group relative flex min-w-[14px] flex-1 flex-col items-center justify-end">
                    <div
                      className="w-full rounded-t-md bg-energy-gradient opacity-80 transition group-hover:opacity-100"
                      style={{ height: `${Math.max(3, (d.volume / maxVolume) * 100)}%` }}
                    />
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-[10px] text-white group-hover:block">
                      {d.day} · {formatINR(d.volume)} · {d.count} txns
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.daily.length > 0 && (
              <div className="mt-2 flex justify-between text-[10px] text-ink-400">
                <span>{data.daily[0].day}</span>
                <span>{data.daily[data.daily.length - 1].day}</span>
              </div>
            )}
          </SectionCard>

          <DataTable
            title="Service-wise report"
            description="Volume, fees and commission by service."
            columns={serviceColumns}
            data={data.services}
            loading={loading}
          />

          <DataTable
            title="Top 10 users by volume"
            description="Your biggest movers in this range."
            columns={topUserColumns}
            data={data.topUsers}
            loading={loading}
          />
        </>
      )}
    </div>
  );
}
