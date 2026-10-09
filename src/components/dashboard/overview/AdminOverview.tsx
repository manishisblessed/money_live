"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Banknote,
  ServerCog,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  UsersThree,
  IdentificationBadge,
  Bank,
  Wallet as WalletIcon,
  Power,
  Pulse,
  BookOpenText,
  ChartLineUp,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { GreetingBand } from "@/components/dashboard/shell/GreetingBand";
import { QuickActions, type QuickAction } from "@/components/dashboard/shell/QuickActions";
import { Stagger, StaggerItem, FadeIn } from "@/components/dashboard/shell/Motion";
import type { Session } from "@/lib/auth";
import { formatINR, formatNumber } from "@/lib/utils";
import { CumulativeWalletCard, type CumulativeData, type PartnerFloat } from "./admin/CumulativeWalletCard";
import { RevenueWalletCard } from "./admin/RevenueWalletCard";
import { UserBalancesCard } from "./admin/UserBalancesCard";
import { ProviderWalletsCard } from "./admin/ProviderWalletsCard";
import { DailyUserReportCard } from "./admin/DailyUserReportCard";

type PayoutStats = {
  volumeToday: number;
  countToday: number;
  volumeMonth: number;
  successRate: number | null;
  successCount30: number;
  terminalCount30: number;
  inflight: number;
  daily: number[];
};

type StatsData = {
  activeUsers: number;
  totalUsers: number;
  pendingKyc: number;
  settledToday: number;
  txnsToday: number;
  monthlyGmv: number;
  dailyGmv: number[];
  serviceHealth: { service: string; live: boolean; provider: string }[];
  auditEvents: { id: string; actor: string; action: string; target: string; severity: string; ts: string }[];
  vendorBalanceTotal?: number;
  payout?: PayoutStats;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Users", href: "/dashboard/admin/users", icon: UsersThree, tone: "brand" },
  { label: "KYC Queue", href: "/dashboard/admin/kyc", icon: IdentificationBadge, tone: "coral" },
  { label: "Settlements", href: "/dashboard/admin/settlement-ops", icon: Bank, tone: "accent" },
  { label: "Wallet Ops", href: "/dashboard/admin/wallet-ops", icon: WalletIcon, tone: "royal" },
  { label: "Ledger", href: "/dashboard/admin/ledger", icon: BookOpenText, tone: "amber" },
  { label: "Services", href: "/dashboard/admin/services", icon: Power, tone: "ink" },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: ChartLineUp, tone: "brand" },
  { label: "System", href: "/dashboard/admin/system", icon: Pulse, tone: "accent" },
];

export function AdminOverview({ session }: { session: Session }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [liability, setLiability] = useState<CumulativeData | null>(null);
  const [liabilityLoading, setLiabilityLoading] = useState(true);
  const [providers, setProviders] = useState<PartnerFloat[] | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [providersAsOf, setProvidersAsOf] = useState<Date | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadLiability = useCallback(async () => {
    setLiabilityLoading(true);
    try {
      const r = await fetch("/api/admin/wallet/aggregates?view=cumulative");
      if (r.ok) setLiability(await r.json());
    } catch {
      /* keep last data */
    } finally {
      setLiabilityLoading(false);
    }
  }, []);

  const loadProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const r = await fetch("/api/admin/providers/balances");
      const d = await r.json().catch(() => null);
      if (!r.ok || !Array.isArray(d?.providers)) {
        setProviders([]);
        setProvidersError(d?.error || "Could not load provider balances");
      } else {
        setProviders(d.providers);
        setProvidersError(null);
        setProvidersAsOf(new Date());
      }
    } catch {
      setProviders([]);
      setProvidersError("Could not load provider balances");
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
    loadLiability();
    loadProviders();
  }, [loadLiability, loadProviders]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const livePartners = stats?.serviceHealth.filter((s) => s.live).length ?? 0;
  const totalPartners = stats?.serviceHealth.length ?? 0;

  return (
    <div className="space-y-6">
      <GreetingBand
        name={session.name}
        eyebrow="Namaste 🙏 · Control Tower"
        subtitle={<span className="truncate">Platform admin · {session.email}</span>}
        heroLabel="Settled today"
        heroValue={stats?.settledToday ?? 0}
        heroHint={loading ? "Loading…" : `${formatNumber(stats?.txnsToday ?? 0)} transactions settled today`}
        loading={loading}
        chips={[
          { label: "Active users", value: loading ? "…" : formatNumber(stats?.activeUsers ?? 0), tone: "brand" },
          { label: "KYC queue", value: loading ? "…" : String(stats?.pendingKyc ?? 0), tone: (stats?.pendingKyc ?? 0) > 0 ? "coral" : "neutral" },
          { label: "Partners live", value: loading ? "…" : `${livePartners}/${totalPartners}`, tone: "accent" },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.1]"
              aria-label="Refresh stats"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/dashboard/admin/system">
              <Button variant="outline" size="sm" className="border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                <Activity className="h-3.5 w-3.5" />
                Status
              </Button>
            </Link>
            <Link href="/dashboard/admin/kyc">
              <Button size="sm">
                Review KYC ({stats?.pendingKyc ?? 0})
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <QuickActions actions={QUICK_ACTIONS} />

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                label="Active Users"
                value={formatNumber(stats?.activeUsers ?? 0)}
                delta={`of ${formatNumber(stats?.totalUsers ?? 0)}`}
                trend="up"
                icon={Users}
                accent="brand"
                href="/dashboard/admin/users"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="KYC in Queue"
                value={String(stats?.pendingKyc ?? 0)}
                delta=""
                trend="down"
                icon={ShieldCheck}
                accent="accent"
                href="/dashboard/admin/kyc"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Settled Today"
                value={formatINR(stats?.settledToday ?? 0)}
                delta={`${stats?.txnsToday ?? 0} txns`}
                trend="up"
                icon={Banknote}
                accent="emerald"
                href="/dashboard/admin/settlements"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Partners Live"
                value={`${livePartners} / ${totalPartners}`}
                delta=""
                trend="up"
                icon={ServerCog}
                accent="violet"
                href="/dashboard/admin/services"
              />
            </StaggerItem>
          </>
        )}
      </Stagger>

      {/* ── Revenue Wallet (company earnings) — platform owner only ─── */}
      {session.role === "master-admin" && (
        <FadeIn>
          <RevenueWalletCard />
        </FadeIn>
      )}

      {/* ── Money: cumulative liability + user-wise + provider floats ─── */}
      <FadeIn delay={0.05}>
        <CumulativeWalletCard
          data={liability}
          partners={providers}
          loading={liabilityLoading}
          onRefresh={() => {
            loadLiability();
            loadProviders();
          }}
          refreshing={liabilityLoading || providersLoading}
        />
      </FadeIn>

      <FadeIn delay={0.08}>
        <UserBalancesCard />
      </FadeIn>

      <FadeIn delay={0.1}>
        <ProviderWalletsCard
          providers={providers}
          errorMessage={providersError}
          loading={providersLoading}
          onRefreshAll={loadProviders}
          refreshing={providersLoading}
          asOf={providersAsOf}
        />
      </FadeIn>

      <FadeIn delay={0.12}>
        <DailyUserReportCard />
      </FadeIn>
    </div>
  );
}
