"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Network,
  Users,
  IndianRupee,
  TrendingUp,
  KeyRound,
} from "lucide-react";
import {
  UserPlus,
  TreeStructure,
  Key,
  Globe,
  ChartLineUp,
  Stack,
  ClockCounterClockwise,
  UsersThree,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
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
  retailers: number;
  status: string;
  walletBalance: number;
  monthlyTurnover: number;
};

type WhiteLabel = {
  customDomain?: string | null;
  subdomain?: string | null;
  status?: string | null;
};

export function MasterOverview({ session }: { session: Session }) {
  const isSuper = session.role === "super-distributor";
  const childLabel = isSuper ? "master distributors" : "distributors";
  const [children, setChildren] = useState<NetworkRow[]>([]);
  const [wl, setWl] = useState<WhiteLabel | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [netRes, wlRes] = await Promise.all([
        fetch("/api/network"),
        fetch("/api/platform/whitelabel"),
      ]);
      const net = await netRes.json().catch(() => ({}));
      const wlData = await wlRes.json().catch(() => ({}));
      if (Array.isArray(net.users)) setChildren(net.users);
      if (wlData?.profile) setWl(wlData.profile);
      else if (wlData?.customDomain || wlData?.subdomain) setWl(wlData);
    } catch {
      // keep empty live state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalRetailers = children.reduce((s, d) => s + (d.retailers ?? 0), 0);
  const mtdTurnover = children.reduce((s, d) => s + (d.monthlyTurnover ?? 0), 0);
  const domain =
    wl?.customDomain ||
    (wl?.subdomain ? `${wl.subdomain}.emoney.today` : null);

  const quickActions: QuickAction[] = [
    { label: isSuper ? "Invite MD" : "Invite DT", href: "/dashboard/network/onboard", icon: UserPlus, tone: "brand" },
    { label: "My Network", href: "/dashboard/network", icon: TreeStructure, tone: "royal" },
    { label: "Earnings", href: "/dashboard/earnings", icon: ChartLineUp, tone: "accent" },
    { label: "API Keys", href: "/dashboard/api", icon: Key, tone: "amber" },
    { label: "White-label", href: "/dashboard/whitelabel", icon: Globe, tone: "coral" },
    { label: "My Plan", href: "/dashboard/my-scheme", icon: Stack, tone: "ink" },
    { label: "Activity", href: "/dashboard/transactions", icon: ClockCounterClockwise, tone: "ink" },
  ];

  return (
    <div className="space-y-8">
      <GreetingBand
        name={session.name}
        eyebrow={`Namaste 🙏 · ${isSuper ? "Super distributor desk" : "Master distributor desk"}`}
        subtitle={
          loading
            ? "Loading your network…"
            : `${children.length} ${childLabel} · ${totalRetailers} retailers${domain ? " · white-label configured" : ""}`
        }
        heroLabel="Network wallet"
        heroValue={session.walletBalance}
        chips={[
          { label: isSuper ? "MDs" : "DTs", value: loading ? "…" : `${children.length}`, tone: "brand" },
          { label: "Retailers", value: loading ? "…" : totalRetailers.toLocaleString("en-IN"), tone: "royal" },
          { label: "MTD", value: loading ? "…" : formatINR(mtdTurnover), tone: "accent" },
        ]}
        actions={
          <>
            <Link href="/dashboard/api">
              <Button variant="outline" size="sm" className="border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.1]">
                <KeyRound className="h-4 w-4" />
                API keys
              </Button>
            </Link>
            <Link href="/dashboard/network/onboard">
              <Button size="sm">
                Onboard {isSuper ? "master distributor" : "distributor"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
      />

      <QuickActions actions={quickActions} />

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
                label={isSuper ? "Master Distributors" : "Distributors"}
                value={`${children.length}`}
                icon={Network}
                accent="brand"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Retailers (network)"
                value={`${totalRetailers.toLocaleString("en-IN")}`}
                icon={Users}
                accent="violet"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Override Earnings (MTD)"
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
              <Badge variant="coral" size="sm">Live</Badge>
            </div>
            <div className="mt-5">
              <Sparkline
                values={Array.from({ length: 14 }, () => 0)}
                color="#f97606"
                height={80}
              />
            </div>
            {!loading && mtdTurnover === 0 && (
              <p className="mt-3 text-xs text-ink-500">
                No network turnover yet — figures update as live transactions clear.
              </p>
            )}
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <IconTile icon={Globe} tone={domain ? "accent" : "ink"} size="md" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                White-label portal
              </p>
            </div>
            <p className="mt-4 truncate font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
              {domain ?? "Not configured"}
            </p>
            <p className="mt-1 text-sm text-ink-600">
              {domain
                ? "Manage co-branded portal settings for your downline."
                : "Set a custom domain or subdomain for your distributors."}
            </p>
            <Link
              href="/dashboard/whitelabel"
              className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {domain ? "Manage branding" : "Set up branding"}{" "}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </StaggerItem>
      </Stagger>

      <FadeIn delay={0.1}>
        <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-6 py-4">
            <SectionHeader
              size="sm"
              icon={UsersThree}
              tone="brand"
              title={<span className="capitalize">My {childLabel}</span>}
              description={`Direct child ${childLabel} with live wallet & turnover`}
            />
            <Link
              href="/dashboard/network"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
            >
              View tree <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {children.length === 0 && !loading ? (
            <EmptyState
              icon={UserPlus}
              tone="brand"
              title={`No ${childLabel} yet`}
              body="Onboard your first partner to build the network."
              action={
                <Link href="/dashboard/network/onboard">
                  <Button size="sm">
                    Onboard {isSuper ? "master distributor" : "distributor"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">
                      {isSuper ? "Master distributor" : "Distributor"}
                    </th>
                    <th className="px-6 py-3 font-semibold">Region</th>
                    <th className="px-6 py-3 font-semibold">Downline</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Wallet</th>
                    <th className="px-6 py-3 text-right font-semibold">MTD Turnover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 text-ink-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-ink-500">
                        Loading network…
                      </td>
                    </tr>
                  ) : (
                    children.map((d) => (
                      <tr key={d.id} className="transition hover:bg-ink-50/50">
                        <td className="px-6 py-3">
                          <div className="font-semibold text-ink-900">{d.name}</div>
                          <div className="text-xs text-ink-500">
                            {d.shop} · {d.id.slice(0, 10)}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-ink-600">
                          {d.city}, {d.state}
                        </td>
                        <td className="px-6 py-3 font-semibold tabular-nums">{d.retailers}</td>
                        <td className="px-6 py-3">
                          <Badge
                            size="sm"
                            variant={
                              d.status === "Active"
                                ? "success"
                                : d.status === "Pending KYC"
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {d.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold tabular-nums">
                          {formatINR(d.walletBalance)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold tabular-nums text-emerald-700">
                          {formatINR(d.monthlyTurnover)}
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
