"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  TrendingUp,
  Users,
  Wallet,
  ArrowRight,
  Monitor,
  CreditCard,
  QrCode,
  Receipt,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  PaperPlaneTilt,
  Fingerprint,
  DeviceMobile,
  Receipt as ReceiptIcon,
  HandCoins,
  ClockCounterClockwise,
  Storefront,
  Sparkle,
  Rocket,
} from "@phosphor-icons/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatSkeleton } from "@/components/ui/Skeleton";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { GreetingBand } from "@/components/dashboard/shell/GreetingBand";
import { QuickActions, type QuickAction } from "@/components/dashboard/shell/QuickActions";
import { Stagger, StaggerItem, FadeIn } from "@/components/dashboard/shell/Motion";
import { SectionHeader } from "@/components/dashboard/shell/SectionHeader";
import { EmptyState } from "@/components/dashboard/shell/EmptyState";
import { services } from "@/lib/data";
import type { Transaction } from "@/lib/data";
import type { Session } from "@/lib/auth";
import { formatINR, cn } from "@/lib/utils";
import { hrefToServiceKey } from "@/lib/services/catalog";
import { useEffectiveServices } from "@/hooks/useEffectiveServices";

/** Primary service cards shown on the retailer dashboard. Each links straight
 *  to its rail; BBPS opens the bill-payment hub with all sub-options. */
const SERVICE_CARDS: { title: string; description: string; href: string; icon: LucideIcon; tone: string }[] = [
  { title: "POS", description: "Manage POS terminals & settlements", href: "/dashboard/pos", icon: Monitor, tone: "from-brand-500 to-brand-700" },
  { title: "Payment Gateway", description: "Collect payments & top up your wallet", href: "/dashboard/wallet", icon: CreditCard, tone: "from-royal-500 to-royal-700" },
  { title: "QR Payments", description: "Static & dynamic UPI QR collections", href: "/dashboard/qr", icon: QrCode, tone: "from-accent-500 to-accent-700" },
  { title: "BBPS", description: "Credit card & utility bill payments", href: "/dashboard/bill-pay", icon: Receipt, tone: "from-coral-500 to-coral-600" },
];

/** Dock shortcuts for the retailer home. */
const QUICK_ACTIONS: QuickAction[] = [
  { label: "Send Money", href: "/dashboard/money-transfer", icon: PaperPlaneTilt, tone: "brand" },
  { label: "Aadhaar Pay", href: "/dashboard/aadhaar-pay", icon: Fingerprint, tone: "royal" },
  { label: "Top-up", href: "/dashboard/recharge/mobile", icon: DeviceMobile, tone: "accent" },
  { label: "Pay Bills", href: "/dashboard/bill-pay/credit-card", icon: ReceiptIcon, tone: "coral" },
  { label: "Add Funds", href: "/dashboard/funds-request", icon: HandCoins, tone: "amber" },
  { label: "Activity", href: "/dashboard/transactions", icon: ClockCounterClockwise, tone: "ink" },
];

export function RetailerOverview({ session }: { session: Session }) {
  const effectiveServices = useEffectiveServices();
  const quickServices = services
    .filter((s) => {
      const key = hrefToServiceKey(s.href);
      if (!key) return true;
      return (effectiveServices ?? new Set<string>()).has(key);
    })
    .slice(0, 8);

  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  const loadTxns = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const res = await fetch("/api/transactions?limit=20");
      const json = await res.json();
      if (Array.isArray(json.data)) setTxns(json.data);
    } catch {
      setTxns([]);
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    loadTxns();
  }, [loadTxns]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todays = txns.filter((t) => {
    // date is locale string; prefer counting SUCCESS from loaded set as proxy when timestamps unavailable
    return t.status === "Success";
  });
  // Retailers see their own processed VOLUME (sum of txn amounts), not commission:
  // on settlement rails the per-txn commission is the upline's, not theirs, so it
  // would be misleading here. Their genuine earnings live on the My Earnings page.
  const todayVolume = todays.reduce((s, t) => s + t.amount, 0);
  const todayCount = todays.length;
  const volume14d = txns
    .filter((t) => t.status === "Success")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-8">
      <GreetingBand
        name={session.name}
        subtitle="Here's a snapshot of your shop today."
        heroLabel="Wallet balance"
        heroValue={session.walletBalance}
        heroHint={
          <Link href="/dashboard/wallet" className="inline-flex items-center gap-1 font-semibold text-ink-200 transition hover:text-white">
            Manage wallet <ArrowRight className="h-3 w-3" />
          </Link>
        }
        chips={[
          { label: "Today", value: loadingTxns ? "…" : formatINR(todayVolume), tone: "accent" },
          { label: "Txns", value: loadingTxns ? "…" : `${todayCount}`, tone: "brand" },
        ]}
      />

      <QuickActions actions={QUICK_ACTIONS} />

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingTxns ? (
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
                label="Wallet Balance"
                value={formatINR(session.walletBalance)}
                icon={Wallet}
                accent="brand"
                href="/dashboard/wallet"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Today's Volume"
                value={formatINR(todayVolume)}
                icon={IndianRupee}
                accent="emerald"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Transactions Today"
                value={`${todayCount}`}
                icon={TrendingUp}
                accent="brand"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                label="Customers Served"
                value={`${txns.filter((t) => t.status === "Success").length}`}
                icon={Users}
                accent="violet"
              />
            </StaggerItem>
          </>
        )}
      </Stagger>

      <PosBookingStrip />

      <section>
        <SectionHeader
          title="Services"
          description="Jump straight into a payment rail"
          icon={Storefront}
          tone="brand"
          className="mb-4"
        />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <StaggerItem key={card.href}>
                <Link
                  href={card.href}
                  className="group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-energy-sm focus-energy"
                >
                  <div className="flex items-start justify-between">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft", card.tone)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold tracking-[-0.02em] text-ink-900">{card.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{card.description}</p>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <Stagger className="grid gap-4 lg:grid-cols-3">
        <StaggerItem className="lg:col-span-2">
          <div className="h-full rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Volume · recent
                </p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                  {formatINR(volume14d)}
                </p>
              </div>
              <Badge variant="brand" size="sm">Last 14 days</Badge>
            </div>
            <div className="mt-5">
              <Sparkline
                values={Array.from({ length: 14 }, () => 0)}
                color="#2563eb"
                height={80}
              />
            </div>
            {!loadingTxns && volume14d === 0 && (
              <p className="mt-3 text-xs text-ink-500">
                No transactions yet — your processed volume appears after successful live transactions.
              </p>
            )}
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="grain relative h-full overflow-hidden rounded-3xl bg-ink-950 p-6 text-white shadow-[0_24px_60px_-28px_rgba(7,11,20,0.7)]">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-royal-500/30 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-coral-500/20 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col">
              <IconTile icon={Rocket} tone="energy" size="md" />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Get started
              </p>
              <p className="mt-1.5 font-display text-xl font-semibold tracking-[-0.02em]">
                Run your first live transaction
              </p>
              <p className="mt-1.5 text-sm text-ink-300">
                Top up your wallet, then use Quick services below to process real payments.
              </p>
              <Link
                href="/dashboard/wallet"
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-white transition hover:gap-2.5"
              >
                Open wallet <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </StaggerItem>
      </Stagger>

      <section>
        <SectionHeader
          title="Quick services"
          description="Most-used services for fast access"
          icon={Sparkle}
          tone="royal"
          className="mb-4"
          actions={
            <Link
              href="/services"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {quickServices.length === 0 && (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white/60">
            <EmptyState
              icon={Storefront}
              tone="ink"
              compact
              title="No services switched on yet"
              body="Ask your admin to activate services for your account — you'll see them here the moment they're live."
            />
          </div>
        )}
        <Stagger className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {quickServices.map((s) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={s.slug}>
                <Link
                  href={s.href}
                  className="group flex items-center gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-energy-sm focus-energy"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition group-hover:bg-energy-gradient group-hover:text-white group-hover:ring-white/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">
                      {s.title}
                    </p>
                    <p className="truncate text-xs text-ink-500">{s.description.slice(0, 36)}...</p>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <FadeIn delay={0.1}>
        <TransactionsTable data={txns} loading={loadingTxns} showCommission={false} />
      </FadeIn>
    </div>
  );
}

/** Compact live status of the retailer's most recent in-progress POS booking.
 *  Renders nothing until it knows there's an active order, so it never clutters
 *  the dashboard for retailers who haven't booked a machine. */
type StripBooking = {
  id: string;
  status: "APPLIED" | "ASSIGNED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  statusLabel: string;
  stepIndex: number;
  plan: { name: string };
  machine: { tid: string | null; serial: string | null } | null;
};

const STRIP_STEPS = ["Applied", "Assigned", "Dispatched", "Delivered"];

function PosBookingStrip() {
  const [booking, setBooking] = useState<StripBooking | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/pos/booking")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.bookings) return;
        const list = d.bookings as StripBooking[];
        // Prefer an in-progress order; otherwise the most recent overall.
        const active = list.find((b) => b.status !== "DELIVERED" && b.status !== "CANCELLED");
        setBooking(active ?? list[0] ?? null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!booking || booking.status === "CANCELLED") return null;

  const machineLabel = booking.machine?.tid ?? booking.machine?.serial ?? null;
  const delivered = booking.status === "DELIVERED";

  return (
    <FadeIn>
      <Link
        href="/dashboard/pos-booking"
        className="group flex flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:border-brand-200 hover:shadow-energy-sm focus-energy sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            "grid h-11 w-11 place-items-center rounded-xl text-white shadow-soft",
            delivered ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-energy-gradient",
          )}>
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">POS Booking</p>
            <p className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">
              {booking.plan.name} · {booking.statusLabel}
              {machineLabel && <span className="ml-1 font-mono text-xs font-normal text-ink-500">({machineLabel})</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ol className="flex items-center gap-1.5" aria-label="Booking progress">
            {STRIP_STEPS.map((label, i) => {
              const done = i <= booking.stepIndex;
              return (
                <li key={label} className="flex items-center gap-1.5" title={label}>
                  <span className={cn("h-2 w-2 rounded-full", done ? (delivered ? "bg-emerald-500" : "bg-energy-gradient") : "bg-ink-200")} />
                  {i < STRIP_STEPS.length - 1 && <span className={cn("h-0.5 w-6 rounded-full", i < booking.stepIndex ? (delivered ? "bg-emerald-500" : "bg-energy-gradient-x") : "bg-ink-200")} />}
                </li>
              );
            })}
          </ol>
          <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
        </div>
      </Link>
    </FadeIn>
  );
}
