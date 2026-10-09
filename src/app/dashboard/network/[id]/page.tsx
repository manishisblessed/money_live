"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Wallet,
  TrendingUp,
  CalendarDays,
  CircleDollarSign,
  Users,
  History,
  Activity as ActivityIcon,
  Layers,
  Info,
  CreditCard,
  Send,
  ClipboardCheck,
  FileText,
  Mail,
  Phone,
  MapPin,
  Store,
} from "lucide-react";
import { Stack, Storefront, TreeStructure, WarningCircle, Pulse, FileText as FileTextPh } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { UplineChain } from "@/components/dashboard/UplineChain";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import {
  EmptyState,
  KeyValueList,
  MetaItem,
  PillTabs,
  ProfileHero,
  SectionCard,
  Stagger,
  StaggerItem,
  StatusChip,
} from "@/components/dashboard/patterns";
import { formatINR } from "@/lib/utils";
import { SERVICE_FAMILIES, familyOf, type ServiceFamily } from "@/lib/scheme/constants";
import {
  OnboardingProgressView,
  type OnboardingProgress,
} from "@/components/network/OnboardingProgressView";
import { KycDetailView, type KycDetailData } from "@/components/kyc/KycDetailView";

type Detail = {
  user: {
    id: string;
    userCode: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    shop: string;
    city: string;
    state: string;
    joined: string;
    walletBalance: number;
    schemeId: string | null;
    schemeName: string | null;
    parent: { id: string; name: string; role: string } | null;
    downline: number;
  };
  stats: {
    turnoverToday: number;
    turnoverMtd: number;
    turnoverLifetime: number;
    commissionMtd: number;
    commissionLifetime: number;
    txnCount: number;
  };
};

type Txn = {
  id: string;
  service: string;
  amount: number;
  status: "Success" | "Pending" | "Failed";
  date: string;
  customer: string;
  commission: number;
};

type ActivityRow = {
  id: string;
  action: string;
  label: string;
  entity: string | null;
  bySelf: boolean;
  meta: unknown;
  ip: string | null;
  date: string;
};

type RateType = "FLAT" | "PERCENT";
type Slab = {
  id: string;
  service: string;
  provider: string | null;
  minAmount: number;
  maxAmount: number;
  chargeType: RateType;
  chargeValue: number;
  commissionType: RateType;
  commissionValue: number;
};
type MdrSlab = {
  id: string;
  serviceKind: string;
  paymentMode: string;
  company: string | null;
  cardType: string | null;
  brandType: string | null;
  classification: string | null;
  minAmount: number;
  maxAmount: number;
  mdrType: RateType;
  mdrValue: number;
  mdrValueT0: number;
  commissionType: RateType;
  commission: number;
};
type Scheme = {
  id: string;
  name: string;
  description: string | null;
  slabCount: number;
  mdrSlabCount: number;
  slabs?: Slab[];
  mdrSlabs?: MdrSlab[];
};

type Tab = "onboarding" | "kyc" | "transactions" | "activity" | "scheme";

const fmtRate = (type: RateType, value: number) =>
  type === "PERCENT" ? `${(value * 100).toFixed(2)}%` : `₹${value}`;
const fmtServiceRate = (_type: RateType, value: number) => `₹${value}`;
const fmtBand = (min: number, max: number) =>
  `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;

function groupByFamily(slabs: Slab[]): Array<readonly [ServiceFamily, Slab[]]> {
  const map = new Map<string, Slab[]>();
  for (const s of slabs) {
    const fam = familyOf(s.service).key;
    (map.get(fam) ?? map.set(fam, []).get(fam)!).push(s);
  }
  return SERVICE_FAMILIES.filter((f) => map.has(f.key)).map(
    (f) =>
      [
        f,
        (map.get(f.key) ?? []).sort(
          (a, b) => a.service.localeCompare(b.service) || a.minAmount - b.minAmount
        ),
      ] as const
  );
}

const FAMILY_ICONS: Record<string, typeof CreditCard> = { BBPS: CreditCard, PAYOUT: Send };

const TABS: { value: Tab; label: string; icon: typeof History }[] = [
  { value: "onboarding", label: "Onboarding", icon: ClipboardCheck },
  { value: "kyc", label: "Documents & KYC", icon: FileText },
  { value: "transactions", label: "Transactions", icon: History },
  { value: "activity", label: "Activity", icon: ActivityIcon },
  { value: "scheme", label: "Scheme", icon: Layers },
];

const prettyRole = (r: string) => r.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function NetworkMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("transactions");

  const [txns, setTxns] = useState<Txn[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [acts, setActs] = useState<ActivityRow[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [schemeLoading, setSchemeLoading] = useState(false);
  const [schemeError, setSchemeError] = useState<string | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [kyc, setKyc] = useState<KycDetailData | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/network/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load this account.");
        setDetail(null);
      } else {
        setDetail(data);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTxns = useCallback(async () => {
    setTxnLoading(true);
    try {
      const res = await fetch(`/api/network/${id}/transactions?limit=100`);
      const data = await res.json();
      setTxns(data.data ?? []);
    } catch {
      // silent
    } finally {
      setTxnLoading(false);
    }
  }, [id]);

  const loadActs = useCallback(async () => {
    setActLoading(true);
    try {
      const res = await fetch(`/api/network/${id}/activity?limit=100`);
      const data = await res.json();
      setActs(data.data ?? []);
    } catch {
      // silent
    } finally {
      setActLoading(false);
    }
  }, [id]);

  const loadScheme = useCallback(async () => {
    setSchemeLoading(true);
    setSchemeError(null);
    try {
      const res = await fetch(`/api/me/scheme?userId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setSchemeError(data.error ?? "Could not load the scheme.");
        setScheme(null);
      } else {
        setScheme(data.scheme ?? null);
      }
    } catch {
      setSchemeError("Network error — please try again.");
    } finally {
      setSchemeLoading(false);
    }
  }, [id]);

  const loadOnboarding = useCallback(async () => {
    setOnboardingLoading(true);
    setOnboardingError(null);
    try {
      const res = await fetch(`/api/network/${id}/onboarding`);
      const data = await res.json();
      if (!res.ok) {
        setOnboardingError(data.error ?? "Could not load onboarding status.");
        setOnboarding(null);
      } else {
        setOnboarding(data);
      }
    } catch {
      setOnboardingError("Network error — please try again.");
    } finally {
      setOnboardingLoading(false);
    }
  }, [id]);

  const loadKyc = useCallback(async () => {
    setKycLoading(true);
    setKycError(null);
    try {
      const res = await fetch(`/api/network/${id}/kyc`);
      const data = await res.json();
      if (!res.ok) {
        setKycError(data.error ?? "Could not load documents & KYC.");
        setKyc(null);
      } else {
        setKyc(data.kyc);
      }
    } catch {
      setKycError("Network error — please try again.");
    } finally {
      setKycLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Land on the Onboarding tab first when the member isn't active yet — that's
  // the reason a parent is most likely opening this page.
  useEffect(() => {
    if (detail?.user && detail.user.status !== "Active") setTab("onboarding");
  }, [detail?.user?.status]);

  useEffect(() => {
    if (tab === "transactions") loadTxns();
    else if (tab === "activity") loadActs();
    else if (tab === "scheme") loadScheme();
    else if (tab === "onboarding") loadOnboarding();
    else if (tab === "kyc") loadKyc();
  }, [tab, loadTxns, loadActs, loadScheme, loadOnboarding, loadKyc]);

  const cols: Column<Txn>[] = [
    { key: "id", header: "Ref ID", render: (r) => <span className="font-mono text-xs font-medium text-brand-600">{r.id}</span> },
    { key: "service", header: "Service" },
    { key: "customer", header: "Customer" },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold tabular-nums">{formatINR(r.amount)}</span> },
    { key: "commission", header: "Commission", align: "right", render: (r) => <span className="tabular-nums text-emerald-700">{formatINR(r.commission)}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusChip status={r.status} label={r.status} />,
    },
    { key: "date", header: "Date", render: (r) => <span className="text-xs text-ink-500">{r.date}</span> },
  ];

  const grouped = useMemo(() => groupByFamily(scheme?.slabs ?? []), [scheme]);
  const mdrSlabs = scheme?.mdrSlabs ?? [];

  const u = detail?.user;
  const s = detail?.stats;

  const schemeTables = scheme ? (
    <div className="space-y-6">
      {grouped.map(([family, list]) => {
        const Icon = FAMILY_ICONS[family.key] ?? CreditCard;
        return (
          <div key={family.key}>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-50 text-ink-600">
                <Icon className="h-4 w-4" />
              </span>
              <h4 className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">{family.label}</h4>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">{list.length}</span>
            </div>
            <div className="overflow-x-auto rounded-2xl ring-1 ring-inset ring-ink-100">
              <table className="w-full min-w-max text-left text-sm">
                <thead className="bg-ink-50/70 text-[11px] uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Service</th>
                    <th className="px-4 py-2.5 font-semibold">Provider</th>
                    <th className="px-4 py-2.5 font-semibold">Band</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Charge</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {list.map((sl) => (
                    <tr key={sl.id} className="transition-colors hover:bg-brand-50/30">
                      <td className="px-4 py-2.5 font-medium text-ink-900">{sl.service.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2.5 text-xs text-ink-600">{sl.provider ?? "All"}</td>
                      <td className="px-4 py-2.5 tabular-nums text-ink-600">{fmtBand(sl.minAmount, sl.maxAmount)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{fmtServiceRate(sl.chargeType, sl.chargeValue)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">{fmtServiceRate(sl.commissionType, sl.commissionValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {mdrSlabs.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <IconTile icon={Storefront} tone="amber" size="xs" />
            <h4 className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">POS MDR</h4>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">{mdrSlabs.length}</span>
          </div>
          <div className="overflow-x-auto rounded-2xl ring-1 ring-inset ring-ink-100">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-ink-50/70 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Rail</th>
                  <th className="px-4 py-2.5 font-semibold">Company</th>
                  <th className="px-4 py-2.5 font-semibold">Mode</th>
                  <th className="px-4 py-2.5 font-semibold">Card / Brand</th>
                  <th className="px-4 py-2.5 text-right font-semibold">MDR T+1</th>
                  <th className="px-4 py-2.5 text-right font-semibold">MDR T+0</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {mdrSlabs.map((sl) => (
                  <tr key={sl.id} className="transition-colors hover:bg-brand-50/30">
                    <td className="px-4 py-2.5 font-medium text-ink-900">{sl.serviceKind}</td>
                    <td className="px-4 py-2.5 text-ink-600">{sl.company ?? "All"}</td>
                    <td className="px-4 py-2.5 text-ink-600">{sl.paymentMode === "*" ? "Any" : sl.paymentMode}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-600">
                      {[sl.cardType, sl.brandType, sl.classification].filter(Boolean).join(" / ") || "Any"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{fmtRate(sl.mdrType, sl.mdrValue)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">
                      {sl.mdrValueT0 > 0 ? fmtRate(sl.mdrType, sl.mdrValueT0) : "= T+1"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                      {sl.commission > 0 ? fmtRate(sl.commissionType, sl.commission) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {grouped.length === 0 && mdrSlabs.length === 0 && (
        <EmptyState compact icon={Stack} title="No slabs configured yet" description="This scheme has no rates in it." />
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Member"
        title={u?.name ?? "Member"}
        description={
          u
            ? `${prettyRole(u.role)} · ${u.userCode ?? u.id.slice(0, 8)} · ${u.shop}`
            : "Loading member…"
        }
        actions={
          <>
            <Link href="/dashboard/network">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Button variant="outline" onClick={loadDetail} disabled={loading} aria-label="Refresh member">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </>
        }
      />

      {error ? (
        <EmptyState
          bordered
          tone="coral"
          icon={WarningCircle}
          title="Can’t open this account"
          description={error}
        />
      ) : loading || !u || !s ? (
        <SectionCard className="grid place-items-center py-16">
          <span className="inline-flex items-center gap-2 text-sm text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> Loading member…
          </span>
        </SectionCard>
      ) : (
        <>
          <ProfileHero
            name={u.name}
            subtitle={u.shop}
            tone={u.status === "Active" ? "energy" : u.status === "Suspended" ? "ink" : "brand"}
            chips={
              <>
                <Badge variant="brand">{prettyRole(u.role)}</Badge>
                <Badge variant="default" className="font-mono">{u.userCode ?? u.id.slice(0, 8)}</Badge>
                <StatusChip status={u.status} label={u.status} />
                {u.schemeName ? (
                  <Badge variant="royal">
                    <Layers className="h-3 w-3" /> {u.schemeName}
                  </Badge>
                ) : (
                  <Badge variant="warning">No scheme</Badge>
                )}
              </>
            }
            meta={
              <>
                {u.email && <MetaItem icon={<Mail className="h-3.5 w-3.5" />}>{u.email}</MetaItem>}
                {u.phone && <MetaItem icon={<Phone className="h-3.5 w-3.5" />}>{u.phone}</MetaItem>}
                <MetaItem icon={<MapPin className="h-3.5 w-3.5" />}>{u.city}, {u.state}</MetaItem>
                <MetaItem icon={<Store className="h-3.5 w-3.5" />}>{u.shop}</MetaItem>
                <MetaItem icon={<CalendarDays className="h-3.5 w-3.5" />} className="text-ink-400">Joined {u.joined}</MetaItem>
              </>
            }
            aside={
              <div className="rounded-2xl bg-ink-950 px-5 py-4 text-left text-white sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Wallet balance</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] md:text-3xl">{formatINR(u.walletBalance)}</p>
              </div>
            }
          >
            <div className="relative mt-6 grid gap-4 border-t border-ink-100 pt-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Upline</p>
                <UplineChain
                  nodes={
                    u.parent
                      ? [{ role: u.parent.role.toUpperCase().replace(/-/g, "_"), name: u.parent.name }]
                      : []
                  }
                />
              </div>
              <KeyValueList
                dense
                items={[
                  { label: "Lifetime turnover", value: formatINR(s.turnoverLifetime) },
                  { label: "Lifetime commission", value: formatINR(s.commissionLifetime) },
                  { label: "Total transactions", value: s.txnCount.toLocaleString("en-IN") },
                ]}
              />
            </div>
          </ProfileHero>

          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <StaggerItem><StatCard icon={Wallet} label="Wallet" value={formatINR(u.walletBalance)} accent="brand" /></StaggerItem>
            <StaggerItem><StatCard icon={CalendarDays} label="Today" value={formatINR(s.turnoverToday)} accent="brand" /></StaggerItem>
            <StaggerItem><StatCard icon={TrendingUp} label="MTD turnover" value={formatINR(s.turnoverMtd)} accent="emerald" /></StaggerItem>
            <StaggerItem><StatCard icon={TrendingUp} label="Lifetime" value={formatINR(s.turnoverLifetime)} accent="emerald" /></StaggerItem>
            <StaggerItem><StatCard icon={CircleDollarSign} label="Commission MTD" value={formatINR(s.commissionMtd)} accent="accent" /></StaggerItem>
            <StaggerItem><StatCard icon={Users} label="Downline" value={String(u.downline)} accent="violet" /></StaggerItem>
          </Stagger>

          <PillTabs aria-label="Member sections" tabs={TABS} value={tab} onChange={setTab} />

          {tab === "onboarding" && (
            <OnboardingProgressView
              loading={onboardingLoading}
              error={onboardingError}
              data={onboarding}
              memberName={u.name}
              memberStatus={u.status}
            />
          )}

          {tab === "kyc" && (
            <SectionCard padding="none">
              {kycLoading ? (
                <div className="flex items-center justify-center py-16 text-ink-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" /> Loading documents &amp; KYC…
                </div>
              ) : kycError ? (
                <div className="m-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                  <Info className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>{kycError}</div>
                </div>
              ) : !kyc ? (
                <EmptyState icon={FileTextPh} title="No KYC record yet" description="This member hasn't submitted KYC." />
              ) : (
                <KycDetailView
                  kyc={kyc}
                  getDocHref={(docId) => `/api/network/${id}/documents/${docId}`}
                />
              )}
            </SectionCard>
          )}

          {tab === "transactions" && (
            <DataTable
              title="Transactions"
              description={`${txns.length} most recent`}
              columns={cols}
              data={txns}
              loading={txnLoading}
              empty="No transactions yet for this member."
            />
          )}

          {tab === "activity" && (
            <SectionCard
              icon={<IconTile icon={Pulse} tone="brand" size="sm" />}
              title="Activity"
              description="Logins, changes and actions on this account."
              padding="none"
            >
              {actLoading ? (
                <div className="flex items-center justify-center py-14 text-ink-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" /> Loading activity…
                </div>
              ) : acts.length === 0 ? (
                <EmptyState compact icon={Pulse} title="No recorded activity yet" />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {acts.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 px-5 py-3 md:px-6">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-100">
                        <ActivityIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink-900">{a.label}</span>
                          {!a.bySelf && <Badge variant="default" size="sm">by parent/admin</Badge>}
                        </div>
                        <p className="text-xs text-ink-500">
                          {a.date}
                          {a.ip ? ` · ${a.ip}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}

          {tab === "scheme" && (
            <SectionCard
              icon={<IconTile icon={Stack} tone="royal" size="sm" />}
              title={scheme ? scheme.name : "Scheme"}
              description={scheme?.description ?? "Charges, commissions and MDR that apply to this member."}
              action={
                scheme ? (
                  <>
                    <Badge variant="brand">{scheme.slabCount} slabs</Badge>
                    {scheme.mdrSlabCount > 0 && <Badge variant="warning">{scheme.mdrSlabCount} MDR</Badge>}
                  </>
                ) : undefined
              }
            >
              {schemeLoading ? (
                <div className="flex items-center justify-center py-10 text-ink-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" /> Loading scheme…
                </div>
              ) : schemeError ? (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                  <Info className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>{schemeError}</div>
                </div>
              ) : !scheme ? (
                <EmptyState
                  compact
                  tone="amber"
                  icon={TreeStructure}
                  title="No scheme assigned to this member"
                  description="They cannot process transactions until a scheme is assigned."
                />
              ) : (
                schemeTables
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}