"use client";

/**
 * Retailer Rewards — gamified view of the monthly volume-incentive programme.
 * Shows live tier progress toward the next reward, the projected cashback if the
 * month closed now, and a history of rewards already credited. Designed to
 * encourage retailers to push more QR / POS business each month.
 */

import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { EmptyState, PillTabs, SectionCard, Stagger, StaggerItem } from "@/components/dashboard/patterns";
import { formatINR } from "@/lib/utils";
import { Gift, Trophy, TrendingUp, Sparkles, IndianRupee, Target, Zap, Clock } from "lucide-react";
import { Gift as GiftPh, Trophy as TrophyPh, WarningCircle } from "@phosphor-icons/react";

type LegView = "BOTH" | "INSTANT" | "T1";

type LegProgress = {
  volume: number;
  mdrPaid: number;
  rate: number;
  projectedReward: number;
};

type Progress = {
  schemeId: string;
  schemeName: string;
  description: string | null;
  rail: "QR" | "POS" | "PG" | "COMBINED";
  rewardType: "CASHBACK_ON_MDR" | "CASHBACK_ON_VOLUME" | "FLAT";
  periodKey: string;
  volume: number;
  mdrPaid: number;
  currentTier: { id: string; label: string | null; rate: number; rateT0: number; rewardType: string } | null;
  projectedReward: number;
  entryThreshold: number;
  nextTier: {
    id: string;
    label: string | null;
    threshold: number;
    remaining: number;
    rate: number;
    rateT0: number;
  } | null;
  progress: number;
  achieved: boolean;
  legs: { instant: LegProgress; t1: LegProgress };
};

type Payout = {
  id: string;
  schemeName: string;
  periodKey: string;
  leg: "INSTANT" | "T1";
  rail: string;
  measuredVolume: number;
  mdrPaid: number;
  rewardAmount: number;
  createdAt: string;
};

type Resp = {
  leg: LegView;
  schemes: Progress[];
  payouts: Payout[];
  totalEarned: number;
};

const RAIL_LABEL: Record<string, string> = {
  QR: "QR",
  POS: "POS",
  PG: "PG",
  COMBINED: "QR+POS+PG",
};

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Request failed");
  return res.json();
}

function fmtMonth(periodKey: string): string {
  const [y, m] = periodKey.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function fmtPct(fraction: number): string {
  return `${(fraction * 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}%`;
}

function projectedFor(x: Progress, leg: LegView): number {
  if (leg === "INSTANT") return x.legs.instant.projectedReward;
  if (leg === "T1") return x.legs.t1.projectedReward;
  return x.projectedReward;
}

export default function RewardsPage() {
  const [legView, setLegView] = useState<LegView>("BOTH");
  const { data, error, isLoading } = useSWR<Resp>(
    `/api/incentive/progress?leg=${legView}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,
      keepPreviousData: true,
    }
  );

  const schemes = data?.schemes ?? [];
  const projectedThisMonth = schemes.reduce((s, x) => s + projectedFor(x, legView), 0);
  const achievedCount = schemes.filter((x) => x.currentTier).length;

  const LEG_TABS: { id: LegView; label: string; icon: typeof Zap }[] = [
    { id: "BOTH", label: "Both", icon: Sparkles },
    { id: "INSTANT", label: "Instant (T+0)", icon: Zap },
    { id: "T1", label: "T+1", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account · Rewards"
        title="Monthly rewards & cashback"
        description="Earn reverse cashback as your monthly business grows. Instant (T+0) and T+1 business earn separately — switch the view to see each on its own or both together. Rewards auto-credit to your wallet on the last day of the month."
        actions={
          <PillTabs
            aria-label="Settlement leg"
            size="sm"
            value={legView}
            onChange={setLegView}
            tabs={LEG_TABS.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))}
          />
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            label={legView === "BOTH" ? "Projected this month" : `Projected (${legView === "INSTANT" ? "instant" : "T+1"})`}
            value={formatINR(projectedThisMonth)}
            icon={Sparkles}
            accent="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Rewards unlocked" value={`${achievedCount}/${schemes.length}`} icon={Trophy} accent="emerald" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Active programmes" value={String(schemes.length)} icon={Gift} accent="violet" />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label={legView === "BOTH" ? "Total earned (lifetime)" : "Earned (this leg)"}
            value={data ? formatINR(data.totalEarned) : "…"}
            icon={IndianRupee}
            accent="accent"
          />
        </StaggerItem>
      </Stagger>

      {error ? (
        <EmptyState
          bordered
          tone="coral"
          icon={WarningCircle}
          title="Couldn't load your rewards"
          description="Please retry shortly."
        />
      ) : isLoading ? (
        <SectionCard className="p-10 text-center text-sm text-ink-500">Loading your rewards…</SectionCard>
      ) : schemes.length === 0 ? (
        <EmptyState
          bordered
          tone="amber"
          icon={GiftPh}
          title="No reward programmes yet"
          description="You're not enrolled in a reward programme right now. Keep transacting — your distributor or admin can enrol you to start earning monthly cashback."
        />
      ) : (
        <Stagger className="grid gap-4 lg:grid-cols-2">
          {schemes.map((s) => (
            <StaggerItem key={s.schemeId}>
              <RewardCard s={s} legView={legView} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Reward history */}
      {data && data.payouts.length > 0 && (
        <SectionCard
          icon={<IconTile icon={TrophyPh} tone="amber" size="sm" />}
          title="Reward history"
          description={
            legView === "BOTH"
              ? "Everything credited so far."
              : legView === "INSTANT"
                ? "Instant (T+0) only"
                : "T+1 only"
          }
          padding="none"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-ink-50/70 text-left text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Month</th>
                  <th className="px-5 py-3 font-semibold">Programme</th>
                  <th className="px-5 py-3 font-semibold">Rail</th>
                  <th className="px-5 py-3 font-semibold">Leg</th>
                  <th className="px-5 py-3 text-right font-semibold">Volume</th>
                  <th className="px-5 py-3 text-right font-semibold">MDR paid</th>
                  <th className="px-5 py-3 text-right font-semibold text-emerald-700">Reward credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-ink-800">
                {data.payouts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-emerald-50/30">
                    <td className="px-5 py-3 font-medium">{fmtMonth(p.periodKey)}</td>
                    <td className="px-5 py-3">{p.schemeName}</td>
                    <td className="px-5 py-3">
                      <Badge variant="brand">{RAIL_LABEL[p.rail] ?? p.rail}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {p.leg === "INSTANT" ? (
                        <Badge variant="royal" size="sm">
                          <Zap className="h-3 w-3" /> Instant
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <Clock className="h-3 w-3" /> T+1
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatINR(p.measuredVolume)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-500">{formatINR(p.mdrPaid)}</td>
                    <td className="px-5 py-3 text-right font-display text-base font-semibold tabular-nums text-emerald-700">
                      {formatINR(p.rewardAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/** Per-leg breakdown box shown in the "Both" view so instant + T+1 are visible together. */
function LegBreakdown({ s, baseWord }: { s: Progress; baseWord: string }) {
  const rows: { key: string; label: string; icon: typeof Zap; tone: string; leg: LegProgress }[] = [
    { key: "instant", label: "Instant (T+0)", icon: Zap, tone: "text-sky-700", leg: s.legs.instant },
    { key: "t1", label: "T+1", icon: Clock, tone: "text-ink-700", leg: s.legs.t1 },
  ];
  return (
    <div className="mt-3 overflow-hidden rounded-2xl bg-white/70 ring-1 ring-inset ring-ink-100">
      {rows.map((r, i) => {
        const Icon = r.icon;
        return (
          <div
            key={r.key}
            className={`flex items-center justify-between gap-2 px-3 py-2 text-xs ${i > 0 ? "border-t border-ink-100" : ""}`}
          >
            <span className={`inline-flex items-center gap-1.5 font-semibold ${r.tone}`}>
              <Icon className="h-3.5 w-3.5" /> {r.label}
            </span>
            <span className="flex items-center gap-3 text-ink-500">
              <span>{formatINR(r.leg.volume)}</span>
              {r.leg.rate > 0 && (
                <span className="text-ink-400">
                  {fmtPct(r.leg.rate)} {baseWord}
                </span>
              )}
              <span className="font-bold text-emerald-700">{formatINR(r.leg.projectedReward)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RewardCard({ s, legView }: { s: Progress; legView: LegView }) {
  const pct = Math.round(s.progress * 100);
  const baseWord =
    s.rewardType === "CASHBACK_ON_MDR" ? "of MDR paid" : s.rewardType === "CASHBACK_ON_VOLUME" ? "of volume" : "";

  // Figures shown for the currently selected leg view.
  const legLeg = legView === "INSTANT" ? s.legs.instant : legView === "T1" ? s.legs.t1 : null;
  const displayVolume = legLeg ? legLeg.volume : s.volume;
  const displayProjected = legLeg ? legLeg.projectedReward : s.projectedReward;
  const volumeLabel =
    legView === "INSTANT" ? "Instant volume" : legView === "T1" ? "T+1 volume" : "This month volume";

  // Rate string for the "earning" line, respecting the selected leg.
  const earningRate = (t: { rate: number; rateT0: number }) => {
    if (legView === "INSTANT") return `${fmtPct(t.rateT0)} ${baseWord} (instant)`;
    if (legView === "T1") return `${fmtPct(t.rate)} ${baseWord} (T+1)`;
    return t.rateT0 !== t.rate
      ? `T+1 ${fmtPct(t.rate)} · Instant ${fmtPct(t.rateT0)} ${baseWord}`
      : `${fmtPct(t.rate)} ${baseWord}`;
  };

  // Achieved the top tier — celebratory state.
  if (s.achieved && s.currentTier) {
    return (
      <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-accent-50/60 p-5 ring-1 ring-emerald-200 shadow-sm">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-400/20 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-base font-semibold tracking-[-0.01em] text-ink-900">{s.schemeName}</h3>
              <Badge variant="brand" size="sm">{RAIL_LABEL[s.rail] ?? s.rail}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-ink-500">{fmtMonth(s.periodKey)}</p>
          </div>
          <IconTile icon={TrophyPh} tone="accent" size="md" />
        </div>

        <div className="relative mt-4 flex items-center gap-2 text-emerald-700">
          <Sparkles className="h-5 w-5" />
          <p className="text-sm font-bold">Top reward unlocked{s.currentTier.label ? ` — ${s.currentTier.label}` : ""}!</p>
        </div>
        <p className="relative mt-1 text-xs text-ink-600">
          You&apos;ve done <span className="font-semibold text-ink-900">{formatINR(s.volume)}</span> this month and are
          earning <span className="font-semibold text-emerald-700">{earningRate(s.currentTier)}</span>.
        </p>

        <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-emerald-400" style={{ width: "100%" }} />
        </div>

        {legView === "BOTH" ? (
          <LegBreakdown s={s} baseWord={baseWord} />
        ) : null}

        <div className="relative mt-4 rounded-2xl bg-white/80 p-3 text-center ring-1 ring-inset ring-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">
            {legView === "BOTH"
              ? "Projected reward this month"
              : `Projected ${legView === "INSTANT" ? "instant" : "T+1"} reward`}
          </p>
          <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-emerald-700">{formatINR(displayProjected)}</p>
        </div>
      </div>
    );
  }

  const chase = s.nextTier;
  return (
    <div className="relative h-full overflow-hidden rounded-3xl bg-white p-5 ring-1 ring-ink-100 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-display text-base font-semibold tracking-[-0.01em] text-ink-900">{s.schemeName}</h3>
            <Badge variant="brand" size="sm">{RAIL_LABEL[s.rail] ?? s.rail}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-ink-500">{s.description ?? fmtMonth(s.periodKey)}</p>
        </div>
        <IconTile icon={GiftPh} tone="amber" size="md" />
      </div>

      {/* Current status line */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        {s.currentTier ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <TrendingUp className="h-4 w-4" /> Earning {earningRate(s.currentTier)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-ink-600">
            <Target className="h-4 w-4" /> {formatINR(Math.max(0, s.entryThreshold - s.volume))} more to unlock your first reward
          </span>
        )}
      </div>

      {/* Progress bar toward the next milestone (based on TOTAL volume — the tier milestone) */}
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-energy-gradient-x transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(3, pct)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-500">
        <span>{formatINR(s.volume)} total done</span>
        <span>
          {chase ? `Next: ${formatINR(chase.threshold)}` : `Target: ${formatINR(s.entryThreshold)}`}
        </span>
      </div>

      {/* Next-tier nudge */}
      {chase && (
        <div className="mt-4 rounded-2xl bg-amber-50/70 p-3 ring-1 ring-inset ring-amber-100">
          <p className="text-xs text-ink-700">
            Do <span className="font-bold text-amber-700">{formatINR(chase.remaining)}</span> more this month to unlock{" "}
            {chase.label ? <span className="font-semibold">{chase.label}</span> : "the next tier"} and earn{" "}
            <span className="font-bold text-emerald-700">{earningRate(chase)}</span>.
          </p>
        </div>
      )}

      {legView === "BOTH" ? <LegBreakdown s={s} baseWord={baseWord} /> : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-ink-50/70 p-3 text-center ring-1 ring-inset ring-ink-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">{volumeLabel}</p>
          <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">{formatINR(displayVolume)}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50/70 p-3 text-center ring-1 ring-inset ring-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">
            {legView === "BOTH" ? "Projected reward" : "Projected (this leg)"}
          </p>
          <p className="font-display text-lg font-semibold tracking-[-0.02em] text-emerald-700">{formatINR(displayProjected)}</p>
        </div>
      </div>
    </div>
  );
}
