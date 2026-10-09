"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Loader2,
  Info,
  CreditCard,
  Send,
} from "lucide-react";
import { Stack, Storefront, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { EmptyState, SectionCard } from "@/components/dashboard/patterns";
import { SERVICE_FAMILIES, familyOf, schemeAssignerLabel, type ServiceFamily } from "@/lib/scheme/constants";

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
  parentSlabId: string | null;
  active: boolean;
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
  active: boolean;
};

/** A direct child the caller may inspect the scheme of (SD→MDs, MD→DTs, DT→RTs). */
type DirectChild = { id: string; name: string; role: string; userCode: string | null };

type Scheme = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  slabCount: number;
  mdrSlabCount: number;
  slabs?: Slab[];
  mdrSlabs?: MdrSlab[];
};

const FAMILY_ICONS: Record<string, { icon: typeof CreditCard; className: string }> = {
  BBPS: { icon: CreditCard, className: "text-blue-600" },
  PAYOUT: { icon: Send, className: "text-cyan-600" },
};

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

export default function MyAssignedSchemePage() {
  const [loading, setLoading] = useState(true);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  // Direct-child scheme viewer: null = the caller's own scheme.
  const [children, setChildren] = useState<DirectChild[]>([]);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  const load = useCallback(async (userId: string | null) => {
    setLoading(true);
    try {
      const url = userId ? `/api/me/scheme?userId=${encodeURIComponent(userId)}` : "/api/me/scheme";
      const data = await fetch(url).then((r) => r.json());
      setScheme(data.scheme ?? null);
      setSource(data.source ?? null);
      setRole(data.role ?? null);
    } catch {
      // network hiccup
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the caller's direct children (if any) so a parent can inspect a
  // child's scheme. Retailers have none / get 403 — the selector stays hidden.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/network?pageSize=100")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => {
        if (cancelled) return;
        const list: DirectChild[] = (d.users ?? []).map((u: { id: string; name: string; role: string; userCode: string | null }) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          userCode: u.userCode,
        }));
        setChildren(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    load(viewUserId);
  }, [load, viewUserId]);

  const viewingChild = viewUserId ? children.find((c) => c.id === viewUserId) ?? null : null;

  const grouped = useMemo(() => groupByFamily(scheme?.slabs ?? []), [scheme]);
  const mdrSlabs = scheme?.mdrSlabs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account · Pricing"
        title="My scheme"
        description="The rate-card assigned to you. Charges, commissions and POS MDR are set by your parent and applied to every transaction you process."
        actions={
          <>
            {children.length > 0 && (
              <Select
                value={viewUserId ?? ""}
                onChange={(e) => setViewUserId(e.target.value || null)}
                title="View a direct child's scheme"
                aria-label="View a direct child's scheme"
                className="w-56"
              >
                <option value="">My scheme</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </Select>
            )}
            <Button variant="outline" onClick={() => load(viewUserId)} disabled={loading} aria-label="Refresh scheme">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </>
        }
      />

      {viewingChild && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">
          <Info className="h-4 w-4 shrink-0" />
          Viewing the scheme of your direct child{" "}
          <span className="font-semibold">{viewingChild.name}</span>
          <Badge variant="brand">{viewingChild.role}</Badge>
        </div>
      )}

      {loading ? (
        <SectionCard className="grid place-items-center py-16">
          <span className="inline-flex items-center gap-2 text-sm text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> Loading scheme…
          </span>
        </SectionCard>
      ) : !scheme ? (
        <EmptyState
          bordered
          tone="amber"
          icon={WarningCircle}
          title="No scheme assigned to you yet"
          description={`Ask your ${schemeAssignerLabel(role)} to assign one. Until then you cannot process transactions.`}
        />
      ) : (
        <SectionCard
          icon={<IconTile icon={Stack} tone="royal" size="md" />}
          eyebrow={source === "DEFAULT_SCHEME" ? "Platform default" : "Assigned rate-card"}
          title={scheme.name}
          description={
            scheme.description ??
            "These are the charges, commissions and MDR rates that apply to your transactions."
          }
          action={
            <>
              <Badge variant="success" dot>Active</Badge>
              <Badge variant="brand">{scheme.slabCount} slabs</Badge>
              {scheme.mdrSlabCount > 0 && <Badge variant="warning">{scheme.mdrSlabCount} MDR</Badge>}
            </>
          }
        >
          <div className="space-y-6">
            {grouped.map(([family, list]) => {
              const cfg = FAMILY_ICONS[family.key];
              const Icon = cfg?.icon ?? CreditCard;
              const cls = cfg?.className ?? "text-ink-600";
              return (
                <div key={family.key}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg bg-ink-50 ${cls}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h4 className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">
                      {family.label}
                    </h4>
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">
                      {list.length}
                    </span>
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
                        {list.map((s) => (
                          <tr key={s.id} className="transition-colors hover:bg-brand-50/30">
                            <td className="px-4 py-2.5 font-medium text-ink-900">{s.service.replace(/_/g, " ")}</td>
                            <td className="px-4 py-2.5 text-xs text-ink-600">{s.provider ?? "All"}</td>
                            <td className="px-4 py-2.5 tabular-nums text-ink-600">{fmtBand(s.minAmount, s.maxAmount)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{fmtServiceRate(s.chargeType, s.chargeValue)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">{fmtServiceRate(s.commissionType, s.commissionValue)}</td>
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
                  <h4 className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">MDR rates</h4>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-600">
                    {mdrSlabs.length}
                  </span>
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
                      {mdrSlabs.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-brand-50/30">
                          <td className="px-4 py-2.5 font-medium text-ink-900">{s.serviceKind}</td>
                          <td className="px-4 py-2.5 text-ink-600">{s.company ?? "All"}</td>
                          <td className="px-4 py-2.5 text-ink-600">{s.paymentMode === "*" ? "Any" : s.paymentMode}</td>
                          <td className="px-4 py-2.5 text-xs text-ink-600">
                            {[s.cardType, s.brandType, s.classification].filter(Boolean).join(" / ") || "Any"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{fmtRate(s.mdrType, s.mdrValue)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">
                            {s.mdrValueT0 > 0 ? fmtRate(s.mdrType, s.mdrValueT0) : "= T+1"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                            {s.commission > 0 ? fmtRate(s.commissionType, s.commission) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {grouped.length === 0 && mdrSlabs.length === 0 && (
              <EmptyState compact icon={Stack} title="No slabs configured yet" description="Your parent hasn't added any rates to this scheme." />
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
