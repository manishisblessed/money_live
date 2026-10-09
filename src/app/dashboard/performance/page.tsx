"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Store,
  Activity,
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Globe,
  CalendarDays,
} from "lucide-react";
import { ShieldCheck, TreeStructure, ClockCounterClockwise, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import {
  EmptyState,
  KeyValueList,
  MetaItem,
  ProfileHero,
  SectionCard,
  Stagger,
  StaggerItem,
  StatusChip,
} from "@/components/dashboard/patterns";
import { formatINR } from "@/lib/utils";

type PerformanceData = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    shopName: string | null;
    shopAddress: string | null;
    pincode: string | null;
    state: string | null;
    city: string | null;
    walletBalance: number;
    lastLoginLat: number | null;
    lastLoginLng: number | null;
    lastLoginAt: string | null;
    twoFactorEnabled: boolean;
    createdAt: string;
    _count: { transactions: number; wallet: number; children: number };
  };
  parentInfo: { name: string; email: string; phone: string; role: string } | null;
  loginHistory: {
    id: string;
    meta: { lat?: number; lng?: number; accuracy?: number } | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }[];
  stats: {
    totalTransactions30d: number;
    totalAmount30d: number;
    successfulTxns: number;
    failedTxns: number;
    successRate: number;
    networkSize: number;
    walletTransactions: number;
  };
};

function roleVariant(role: string): "royal" | "default" | "coral" | "success" | "brand" {
  switch (role) {
    case "MASTER_ADMIN": return "royal";
    case "ADMIN": return "default";
    case "SUPPORT": return "default";
    case "SUPER_DISTRIBUTOR": return "coral";
    case "MASTER_DISTRIBUTOR": return "success";
    case "DISTRIBUTOR": return "brand";
    default: return "brand";
  }
}

function formatRole(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/performance")
      .then((res) => res.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load performance data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="page" label="Loading performance data…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        bordered
        tone="coral"
        icon={WarningCircle}
        title="Couldn't load your performance"
        description={error || "Something went wrong. Please refresh and try again."}
      />
    );
  }

  const { user, parentInfo, loginHistory, stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Performance"
        description="Your account at a glance — identity, 30-day activity, security posture and recent logins."
      />

      <ProfileHero
        name={user.name}
        subtitle={user.shopName ?? undefined}
        chips={
          <>
            <Badge variant={roleVariant(user.role)}>{formatRole(user.role)}</Badge>
            <StatusChip status={user.status} />
          </>
        }
        meta={
          <>
            <MetaItem icon={<Mail className="h-3.5 w-3.5" />}>{user.email}</MetaItem>
            <MetaItem icon={<Phone className="h-3.5 w-3.5" />}>{user.phone}</MetaItem>
            {user.city && (
              <MetaItem icon={<MapPin className="h-3.5 w-3.5" />}>
                {user.city}, {user.state}
              </MetaItem>
            )}
            {user.shopName && (
              <MetaItem icon={<Store className="h-3.5 w-3.5" />}>
                {user.shopName} {user.shopAddress && `· ${user.shopAddress}`} {user.pincode && `· ${user.pincode}`}
              </MetaItem>
            )}
            <MetaItem icon={<CalendarDays className="h-3.5 w-3.5" />} className="text-ink-400">
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </MetaItem>
          </>
        }
        aside={
          <div className="rounded-2xl bg-ink-950 px-5 py-4 text-left text-white sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Wallet balance</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
              {formatINR(user.walletBalance)}
            </p>
          </div>
        }
      />

      {/* Quick Stats */}
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            icon={Activity}
            label="Transactions (30d)"
            value={stats.totalTransactions30d.toLocaleString("en-IN")}
            accent="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={TrendingUp}
            label="Turnover (30d)"
            value={formatINR(stats.totalAmount30d)}
            accent="emerald"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={CheckCircle2}
            label="Success rate"
            value={`${stats.successRate}%`}
            delta={`${stats.successfulTxns} passed · ${stats.failedTxns} failed`}
            trend={stats.failedTxns > stats.successfulTxns ? "down" : "up"}
            accent="accent"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            icon={Users}
            label="Network size"
            value={stats.networkSize.toLocaleString("en-IN")}
            delta={`${stats.walletTransactions} wallet txns`}
            accent="violet"
          />
        </StaggerItem>
      </Stagger>

      {/* Security & upline */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          icon={<IconTile icon={ShieldCheck} tone={user.twoFactorEnabled ? "accent" : "coral"} size="sm" />}
          title="Security status"
          description="How well your account is protected."
        >
          <KeyValueList
            items={[
              {
                label: "Two-factor auth",
                value: user.twoFactorEnabled ? (
                  <Badge variant="success" dot>
                    <CheckCircle2 className="h-3 w-3" /> Enabled
                  </Badge>
                ) : (
                  <Badge variant="danger">
                    <XCircle className="h-3 w-3" /> Disabled
                  </Badge>
                ),
              },
              {
                label: "Last login location",
                value: (
                  <span className="inline-flex items-center gap-1 text-ink-600">
                    <Globe className="h-3.5 w-3.5" />
                    {user.lastLoginLat && user.lastLoginLng
                      ? `${user.lastLoginLat.toFixed(4)}, ${user.lastLoginLng.toFixed(4)}`
                      : "Not available"}
                  </span>
                ),
              },
              {
                label: "Last login time",
                value: (
                  <span className="inline-flex items-center gap-1 text-ink-600">
                    <Clock className="h-3.5 w-3.5" />
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN") : "N/A"}
                  </span>
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          icon={<IconTile icon={TreeStructure} tone="royal" size="sm" />}
          title={parentInfo ? "Upline / parent" : "Account hierarchy"}
          description={parentInfo ? "Who manages your account." : "Where you sit in the network."}
        >
          {parentInfo ? (
            <KeyValueList
              items={[
                { label: "Name", value: parentInfo.name },
                { label: "Role", value: <Badge variant={roleVariant(parentInfo.role)}>{formatRole(parentInfo.role)}</Badge> },
                { label: "Contact", value: parentInfo.phone },
                { label: "Email", value: parentInfo.email },
              ]}
            />
          ) : (
            <EmptyState
              compact
              tone="royal"
              icon={TreeStructure}
              title="You're a top-level account"
              description="No upline assigned."
            />
          )}
        </SectionCard>
      </div>

      {/* Login History */}
      <SectionCard
        icon={<IconTile icon={ClockCounterClockwise} tone="brand" size="sm" />}
        title="Recent login activity"
        description="The last devices and locations that signed in to your account."
        padding="none"
      >
        {loginHistory.length === 0 ? (
          <EmptyState compact title="No login history yet" description="Future sign-ins will be listed here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-ink-50/70 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date &amp; time</th>
                  <th className="px-5 py-3 font-semibold">IP address</th>
                  <th className="px-5 py-3 font-semibold">Location (lat, lng)</th>
                  <th className="px-5 py-3 font-semibold">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loginHistory.map((entry) => {
                  const meta = entry.meta as { lat?: number; lng?: number } | null;
                  const ua = entry.userAgent || "Unknown";
                  const shortDevice = ua.length > 50 ? ua.slice(0, 50) + "..." : ua;
                  return (
                    <tr key={entry.id} className="transition-colors hover:bg-brand-50/30">
                      <td className="whitespace-nowrap px-5 py-3 text-ink-800">
                        {new Date(entry.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-ink-600">
                        {entry.ip || "—"}
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {meta?.lat && meta?.lng
                          ? `${meta.lat.toFixed(4)}, ${meta.lng.toFixed(4)}`
                          : "—"}
                      </td>
                      <td className="max-w-[240px] truncate px-5 py-3 text-xs text-ink-500" title={ua}>
                        {shortDevice}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
