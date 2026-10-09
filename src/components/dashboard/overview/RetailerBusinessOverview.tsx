"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  IndianRupee,
  Activity,
  CircleDollarSign,
  Landmark,
  Clock,
} from "lucide-react";
import { ChartPieSlice, Stack, WarningCircle } from "@phosphor-icons/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/dashboard/shell/SectionHeader";
import { EmptyState } from "@/components/dashboard/shell/EmptyState";
import { Stagger, StaggerItem, FadeIn } from "@/components/dashboard/shell/Motion";
import {
  DateRangeControl,
  RefreshPill,
  StatusPill,
  ServiceBreakdownList,
} from "@/components/dashboard/shell/OverviewBits";
import { formatINR, formatNumber } from "@/lib/utils";

type ServiceToday = {
  amount: number;
  pendingAmount: number;
  failedAmount: number;
  count: number;
  success: number;
  pending: number;
  failed: number;
};

type ServiceRow = { service: string; label: string } & ServiceToday;

type MyBusiness = {
  range: { from: string; to: string };
  total: ServiceToday;
  serviceBreakdown: ServiceRow[];
  summary: {
    successCount: number;
    pendingCount: number;
    failedCount: number;
    totalVolume: number;
    totalCommission: number;
    payout: ServiceToday;
    pendingSettlement: number;
  };
};

/**
 * IST "today" as YYYY-MM-DD. IST is a fixed UTC+05:30 offset (no DST), so adding
 * the offset to the epoch and reading the UTC date parts yields the IST wall date
 * regardless of the browser's own timezone.
 */
function istToday(): string {
  const istMs = Date.now() + (5 * 60 + 30) * 60 * 1000;
  return new Date(istMs).toISOString().slice(0, 10);
}

export function RetailerBusinessOverview() {
  const today = useMemo(istToday, []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<MyBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/my-business-overview?from=${from}&to=${to}`);
      if (!res.ok) {
        if (res.status === 403) {
          setData(null);
          setError("forbidden");
          return;
        }
        throw new Error(`Request failed (${res.status})`);
      }
      setData((await res.json()) as MyBusiness);
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  if (error === "forbidden") return null;

  const isToday = from === today && to === today;

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={ChartPieSlice}
        tone="accent"
        title={isToday ? "Today's Business" : "Business Summary"}
        description={
          <>
            Your transaction activity across all services. Volume is{" "}
            <span className="font-semibold text-ink-700">completed</span> business; pending &amp;
            failed are counted separately.
          </>
        }
        actions={
          <>
            <DateRangeControl
              from={from}
              to={to}
              today={today}
              isToday={isToday}
              onFrom={setFrom}
              onTo={setTo}
              onReset={() => {
                setFrom(today);
                setTo(today);
              }}
            />
            <RefreshPill onClick={load} loading={loading} />
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatSkeleton key={i} className="rounded-3xl" />
          ))}
        </div>
      ) : error === "load" ? (
        <div className="rounded-3xl border border-dashed border-coral-200 bg-coral-50/40">
          <EmptyState
            compact
            icon={WarningCircle}
            tone="coral"
            title="Couldn't load your business summary"
            body="Give it another go — nothing has been lost."
            action={
              <button onClick={load} className="text-sm font-semibold text-coral-700 underline-offset-4 hover:underline">
                Try again
              </button>
            }
          />
        </div>
      ) : data ? (
        <>
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StaggerItem>
              <StatCard
                label="Total Business"
                value={formatINR(data.summary.totalVolume)}
                icon={IndianRupee}
                accent="brand"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Transactions"
                value={formatNumber(data.total.count)}
                icon={Activity}
                accent="violet"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Commission Earned"
                value={formatINR(data.summary.totalCommission)}
                icon={CircleDollarSign}
                accent="emerald"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Pending Settlement"
                value={formatINR(data.summary.pendingSettlement)}
                icon={Clock}
                accent="accent"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Payouts (outflow)"
                value={formatINR(data.summary.payout.amount)}
                icon={Landmark}
                accent="accent"
              />
            </StaggerItem>
          </Stagger>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill tone="emerald" n={data.summary.successCount} label="Success" />
            <StatusPill tone="amber" n={data.summary.pendingCount} label="Pending" />
            <StatusPill tone="rose" n={data.summary.failedCount} label="Failed" />
          </div>

          <FadeIn delay={0.08}>
            <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
              <SectionHeader size="sm" icon={Stack} tone="brand" title="Service-wise breakdown" className="mb-4" />
              <ServiceBreakdownList
                rows={data.serviceBreakdown}
                columns={2}
                emptyText="No transactions yet — your first customer is one tap away."
              />
            </div>
          </FadeIn>
        </>
      ) : null}
    </section>
  );
}
