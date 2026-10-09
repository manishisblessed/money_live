"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  IndianRupee,
  HandCoins,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  UserPlus,
  HandCoins as HandCoinsIcon,
  UsersThree,
  ChartLineUp,
  ClockCounterClockwise,
  Stack,
  Tray,
  Storefront,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GreetingBand } from "@/components/dashboard/shell/GreetingBand";
import { QuickActions, type QuickAction } from "@/components/dashboard/shell/QuickActions";
import { Stagger, StaggerItem, FadeIn } from "@/components/dashboard/shell/Motion";
import { SectionHeader } from "@/components/dashboard/shell/SectionHeader";
import { EmptyState } from "@/components/dashboard/shell/EmptyState";
import type { Session } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

type NetworkRow = {
  id: string;
  name: string;
  shop: string;
  city: string;
  state: string;
  status: string;
  walletBalance: number;
  monthlyTurnover: number;
};

type FundRow = {
  id: string;
  amount: number;
  mode: string;
  utr: string | null;
  status: string;
  requester: { name: string };
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Invite Retailer", href: "/dashboard/network/onboard", icon: UserPlus, tone: "brand" },
  { label: "Approve Funds", href: "/dashboard/funds-request", icon: HandCoinsIcon, tone: "accent" },
  { label: "My Retailers", href: "/dashboard/network", icon: UsersThree, tone: "royal" },
  { label: "Earnings", href: "/dashboard/earnings", icon: ChartLineUp, tone: "coral" },
  { label: "My Plan", href: "/dashboard/my-scheme", icon: Stack, tone: "amber" },
  { label: "Activity", href: "/dashboard/transactions", icon: ClockCounterClockwise, tone: "ink" },
];

export function DistributorOverview({ session }: { session: Session }) {
  const [retailers, setRetailers] = useState<NetworkRow[]>([]);
  const [pending, setPending] = useState<FundRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [netRes, fundRes] = await Promise.all([
        fetch("/api/network"),
        fetch("/api/fund-request"),
      ]);
      const net = await netRes.json().catch(() => ({}));
      const funds = await fundRes.json().catch(() => ({}));
      if (Array.isArray(net.users)) setRetailers(net.users);
      if (Array.isArray(funds.requests)) {
        setPending(
          funds.requests.filter(
            (f: FundRow) => f.status === "PENDING" || f.status === "Pending"
          )
        );
      }
    } catch {
      // keep empty live state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mtdTurnover = retailers.reduce((s, r) => s + (r.monthlyTurnover ?? 0), 0);
  const firstName = session.name?.split(" ")[0] ?? "Your";

  return (
    <div className="space-y-8">
      <GreetingBand
        name={session.name}
        eyebrow="Namaste 🙏 · Distributor desk"
        subtitle={
          loading ? "Loading your network…" : `${retailers.length} retailers · ${formatINR(mtdTurnover)} this month`
        }
        heroLabel="Network wallet"
        heroValue={session.walletBalance}
        chips={[
          { label: "Retailers", value: loading ? "…" : `${retailers.length}`, tone: "brand" },
          { label: "MTD", value: loading ? "…" : formatINR(mtdTurnover), tone: "accent" },
          { label: "Pending", value: loading ? "…" : `${pending.length}`, tone: pending.length > 0 ? "coral" : "neutral" },
        ]}
        actions={
          <>
            <Link href="/dashboard/network/onboard">
              <Button variant="outline" size="sm" className="border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                <Users className="h-4 w-4" />
                Onboard retailer
              </Button>
            </Link>
            <Link href="/dashboard/funds-request">
              <Button size="sm">
                Approve funds
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      />

      <QuickActions actions={QUICK_ACTIONS} />

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StaggerItem>
              <StatCard
                label="Active Retailers"
                value={`${retailers.length}`}
                icon={Users}
                accent="brand"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Network Wallet"
                value={formatINR(session.walletBalance)}
                icon={HandCoins}
                accent="violet"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Override Earnings"
                value={formatINR(0)}
                icon={IndianRupee}
                accent="emerald"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Network Turnover (MTD)"
                value={formatINR(mtdTurnover)}
                icon={TrendingUp}
                accent="accent"
              />
            </StaggerItem>
          </>
        )}
      </Stagger>

      <Stagger className="grid gap-4 lg:grid-cols-3">
        <StaggerItem className="lg:col-span-2">
          <div className="h-full rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Network turnover · last 14 days
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                  {formatINR(mtdTurnover)}
                </p>
              </div>
              <Badge variant="royal" size="sm">Live</Badge>
            </div>
            <div className="mt-5">
              <Sparkline
                values={Array.from({ length: 14 }, () => 0)}
                color="#7c3aed"
                height={80}
              />
            </div>
            {!loading && mtdTurnover === 0 && (
              <p className="mt-3 text-xs text-ink-500">
                No turnover yet — updates as retailers process live transactions.
              </p>
            )}
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
            <SectionHeader
              size="sm"
              icon={Tray}
              tone={pending.length > 0 ? "coral" : "ink"}
              title="Pending fund requests"
              description={loading ? "…" : `${pending.length} waiting for review`}
            />
            {pending.length === 0 && !loading ? (
              <EmptyState
                compact
                icon={Tray}
                tone="ink"
                title="Inbox is clear"
                body="New fund requests from your retailers will show up here."
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {pending.slice(0, 3).map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-ink-50/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {f.requester?.name ?? "Retailer"}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {f.mode}
                        {f.utr ? ` · ${f.utr}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-display text-sm font-semibold tabular-nums text-ink-900">
                        {formatINR(f.amount)}
                      </span>
                      <Link
                        href="/dashboard/funds-request"
                        className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 transition hover:bg-emerald-600 hover:text-white"
                        aria-label="Review"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/dashboard/funds-request"
                        className="grid h-7 w-7 place-items-center rounded-lg bg-coral-50 text-coral-700 ring-1 ring-inset ring-coral-100 transition hover:bg-coral-600 hover:text-white"
                        aria-label="Review"
                      >
                        <XCircle className="h-4 w-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/dashboard/funds-request"
              className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </StaggerItem>
      </Stagger>

      <FadeIn delay={0.1}>
        <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-6 py-4">
            <SectionHeader
              size="sm"
              icon={Storefront}
              tone="brand"
              title="Top retailers"
              description="Sorted by monthly turnover"
            />
            <Link
              href="/dashboard/network"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
            >
              Manage all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {retailers.length === 0 && !loading ? (
            <EmptyState
              icon={UserPlus}
              tone="brand"
              title={`${firstName}, your network starts here`}
              body="Onboard your first retailer to start seeing live transactions roll in."
              action={
                <Link href="/dashboard/network/onboard">
                  <Button size="sm">
                    Onboard retailer <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Retailer</th>
                    <th className="px-6 py-3 font-semibold">City</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Wallet</th>
                    <th className="px-6 py-3 text-right font-semibold">MTD Turnover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 text-ink-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-ink-500">
                        Loading retailers…
                      </td>
                    </tr>
                  ) : (
                    [...retailers]
                      .sort((a, b) => b.monthlyTurnover - a.monthlyTurnover)
                      .map((r) => (
                        <tr key={r.id} className="transition hover:bg-ink-50/50">
                          <td className="px-6 py-3">
                            <div className="font-semibold text-ink-900">{r.name}</div>
                            <div className="text-xs text-ink-500">
                              {r.shop} · {r.id.slice(0, 10)}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-ink-600">
                            {r.city}, {r.state}
                          </td>
                          <td className="px-6 py-3">
                            <Badge
                              size="sm"
                              variant={
                                r.status === "Active"
                                  ? "success"
                                  : r.status === "Pending KYC"
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-right font-semibold tabular-nums">
                            {formatINR(r.walletBalance)}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold tabular-nums text-emerald-700">
                            {formatINR(r.monthlyTurnover)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
