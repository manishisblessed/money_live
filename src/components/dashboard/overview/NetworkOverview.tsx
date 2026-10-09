"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  IndianRupee,
  CircleDollarSign,
  Landmark,
  ArrowRight,
} from "lucide-react";
import { TreeStructure, Stack, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/dashboard/shell/SectionHeader";
import { EmptyState } from "@/components/dashboard/shell/EmptyState";
import { Stagger, StaggerItem } from "@/components/dashboard/shell/Motion";
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

type MemberRow = {
  id: string;
  userCode: string | null;
  name: string;
  shop: string;
  role: string;
  city: string;
  state: string;
  status: string;
  walletBalance: number;
  txnCount: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  volume: number;
  commission: number;
};

type NetworkOverview = {
  level: string;
  childLabel: string;
  range: { from: string; to: string };
  summary: {
    totalTransactions: number;
    successCount: number;
    pendingCount: number;
    failedCount: number;
    totalVolume: number;
    totalCommission: number;
    totalMembers: number;
    activeMembers: number;
    payout: ServiceToday;
  };
  serviceBreakdown: ServiceRow[];
  members: MemberRow[];
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

export function NetworkOverview() {
  const today = useMemo(istToday, []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<NetworkOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/network-overview?from=${from}&to=${to}`);
      if (!res.ok) {
        if (res.status === 403) {
          setData(null);
          setError("forbidden");
          return;
        }
        throw new Error(`Request failed (${res.status})`);
      }
      setData((await res.json()) as NetworkOverview);
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

  const childLabel = data?.childLabel ?? "network";
  const isToday = from === today && to === today;

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={TreeStructure}
        tone="royal"
        title="Network Business Overview"
        description={
          <>
            {isToday ? "Today's" : "Selected period's"} transaction activity across your{" "}
            <span className="font-semibold text-ink-700">{childLabel}</span> — each row rolls
            up that member&apos;s entire downline. Volume is{" "}
            <span className="font-semibold text-ink-700">completed</span> business.
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
            title="Couldn't load the network overview"
            body="Give it another go — your network data is safe."
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
                label="Total Transactions"
                value={formatNumber(data.summary.totalTransactions)}
                icon={Activity}
                accent="brand"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Transacting Members"
                value={`${formatNumber(data.summary.activeMembers)} / ${formatNumber(
                  data.summary.totalMembers
                )}`}
                icon={Users}
                accent="violet"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Total Volume"
                value={formatINR(data.summary.totalVolume)}
                icon={IndianRupee}
                accent="emerald"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Commission (network)"
                value={formatINR(data.summary.totalCommission)}
                icon={CircleDollarSign}
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

          <Stagger className="grid gap-4 lg:grid-cols-3">
            {/* Service-wise breakdown */}
            <StaggerItem>
              <div className="h-full rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
                <SectionHeader size="sm" icon={Stack} tone="brand" title="Service-wise breakdown" className="mb-4" />
                <ServiceBreakdownList rows={data.serviceBreakdown} />
              </div>
            </StaggerItem>

            {/* Member-wise table */}
            <StaggerItem className="lg:col-span-2">
              <div className="h-full overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-6 py-4">
                  <SectionHeader
                    size="sm"
                    icon={UsersThree}
                    tone="royal"
                    title="Member-wise activity"
                    description={`Direct ${childLabel} · click a row for full transaction details`}
                  />
                  <Link
                    href="/dashboard/network"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
                  >
                    View network <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {data.members.length === 0 ? (
                  <EmptyState
                    icon={UsersThree}
                    tone="royal"
                    title={`No ${childLabel} yet`}
                    body="Invite your first partner and their activity will roll up here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Member</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                          <th className="px-6 py-3 text-right font-semibold">Txns</th>
                          <th className="px-6 py-3 text-right font-semibold">Volume</th>
                          <th className="px-6 py-3 text-right font-semibold">Commission</th>
                          <th className="px-6 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100 text-ink-800">
                        {data.members.map((m) => (
                          <tr key={m.id} className="group transition hover:bg-ink-50/50">
                            <td className="px-6 py-3">
                              <Link href={`/dashboard/network/${m.id}`} className="block">
                                <div className="font-semibold text-ink-900 group-hover:text-brand-700">
                                  {m.name}
                                </div>
                                <div className="text-xs text-ink-500">
                                  {m.userCode ?? m.id.slice(0, 10)} · {m.city}
                                </div>
                              </Link>
                            </td>
                            <td className="px-6 py-3">
                              <Badge
                                size="sm"
                                variant={
                                  m.status === "Active"
                                    ? "success"
                                    : m.status === "Pending KYC"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {m.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="font-semibold tabular-nums">{formatNumber(m.txnCount)}</div>
                              <div className="text-[11px] text-ink-500">
                                {formatNumber(m.successCount)} ok
                                {m.pendingCount > 0 ? ` · ${formatNumber(m.pendingCount)} pend` : ""}
                                {m.failedCount > 0 ? ` · ${formatNumber(m.failedCount)} fail` : ""}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right font-semibold tabular-nums text-emerald-700">
                              {formatINR(m.volume)}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums text-ink-700">
                              {formatINR(m.commission)}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <Link
                                href={`/dashboard/network/${m.id}`}
                                className="inline-flex items-center text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
                                aria-label={`Open ${m.name}`}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </StaggerItem>
          </Stagger>
        </>
      ) : null}
    </section>
  );
}
