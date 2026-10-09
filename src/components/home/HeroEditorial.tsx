"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  Airplane,
  ArrowRight,
  Bus,
  DeviceMobile,
  Fingerprint,
  Flame,
  Lightbulb,
  Monitor,
  PaperPlaneTilt,
  QrCode,
  Receipt,
  Scan,
  ShieldCheck,
  TrendUp,
  Wallet,
  type Icon
} from "@phosphor-icons/react";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion";
import { heroStats, trustBadges } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./_shared/ButtonLink";
import { CountUp } from "./_shared/CountUp";
import { useCountUp } from "./_shared/useCountUp";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function HeroEditorial() {
  const reduce = useReducedMotion();

  const line = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: easeOut, delay: 0.1 + i * 0.09 }
  });

  return (
    <section className="grain relative overflow-hidden bg-ink-950 text-white">
      {/* Backdrop — aurora orbs, faint grid, bottom fade */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="grid-bg mask-fade-y absolute inset-0 opacity-[0.08] invert" />
        <div className="aurora-glow absolute -left-48 -top-32 h-[540px] w-[540px] rounded-full" />
        <div className="aurora-glow absolute -right-56 top-1/4 h-[600px] w-[600px] rounded-full [animation-direction:reverse]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink-950 to-transparent" />
      </div>

      <div className="container-x relative z-10 pb-14 pt-14 md:pb-20 md:pt-20 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
          {/* Copy */}
          <div className="lg:col-span-7">
            <motion.span
              {...line(0)}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="brand-dot absolute inset-0 animate-ping-soft" />
                <span className="brand-dot relative" />
              </span>
              Bharat&apos;s Shop OS · Live now
            </motion.span>

            <h1 className="mt-7 font-display text-5xl font-bold leading-[0.98] tracking-[-0.02em] md:text-6xl lg:text-7xl">
              <motion.span {...line(1)} className="block">
                Your dukaan.
              </motion.span>
              <motion.span {...line(2)} className="gradient-text block pb-1">
                Your bank.
              </motion.span>
              <motion.span {...line(3)} className="block">
                Your rules.
              </motion.span>
            </h1>

            <motion.p
              {...line(4)}
              className="mt-7 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
            >
              Cash out, send money, pay bills, sell tickets — from the counter you
              already own. You earn a commission on every single transaction.
            </motion.p>

            <motion.div {...line(5)} className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/register" size="xl">
                Start earning today
                <ArrowRight size={18} weight="bold" aria-hidden />
              </ButtonLink>
              <ButtonLink
                href="#how-it-works"
                variant="outline"
                size="xl"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                See how it works
              </ButtonLink>
            </motion.div>

            <motion.ul
              {...line(6)}
              aria-label="Compliance"
              className="mt-10 flex flex-wrap items-center gap-2"
            >
              {trustBadges.map((b) => (
                <li
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/70"
                >
                  <ShieldCheck size={14} weight="duotone" className="text-accent-400" aria-hidden />
                  {b.label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Device */}
          <div className="lg:col-span-5">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 40, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, ease: easeOut, delay: 0.25 }}
            >
              <PhoneMock />
            </motion.div>
          </div>
        </div>

        {/* Stat bento */}
        <dl className="mt-16 grid grid-cols-2 gap-3 md:mt-24 lg:grid-cols-4 lg:gap-4">
          {heroStats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} amount={0.3}>
              <div className="group relative flex flex-col-reverse overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07] md:p-6">
                <dt className="mt-2 text-sm text-white/55">{s.label}</dt>
                <dd className="font-display text-4xl font-semibold tracking-[-0.02em] text-white md:text-5xl">
                  <CountUp value={s.value} />
                </dd>
                <span
                  aria-hidden
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-energy-gradient opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
                />
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ── Phone mock with live transaction feed ─────────────────────────────── */

type FeedItem = {
  service: string;
  amount: string;
  city: string;
  earn: number;
  icon: Icon;
  tone: IconTone;
};

const FEED_POOL: FeedItem[] = [
  { service: "AePS withdrawal", amount: "₹2,000", city: "Kanpur", earn: 6, icon: Fingerprint, tone: "brand" },
  { service: "Send money", amount: "₹5,000", city: "Kochi", earn: 8, icon: PaperPlaneTilt, tone: "royal" },
  { service: "Electricity bill", amount: "₹1,240", city: "Aurangabad", earn: 4, icon: Lightbulb, tone: "accent" },
  { service: "Jio recharge", amount: "₹299", city: "Ludhiana", earn: 3, icon: DeviceMobile, tone: "coral" },
  { service: "POS card swipe", amount: "₹3,450", city: "Vijayawada", earn: 5, icon: Monitor, tone: "brand" },
  { service: "Bus ticket", amount: "₹850", city: "Patna", earn: 42, icon: Bus, tone: "amber" },
  { service: "LPG booking", amount: "₹903", city: "Nashik", earn: 4, icon: Flame, tone: "coral" },
  { service: "UPI collect", amount: "₹560", city: "Ranchi", earn: 1, icon: Scan, tone: "royal" }
];

type FeedRow = FeedItem & { id: number };

function PhoneMock() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });

  const [rows, setRows] = useState<FeedRow[]>(() =>
    FEED_POOL.slice(0, 4).map((r, i) => ({ ...r, id: i }))
  );
  const [earned, setEarned] = useState(2184);
  const nextRef = useRef(4);

  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      const idx = nextRef.current;
      const item = FEED_POOL[idx % FEED_POOL.length];
      setRows((prev) => [{ ...item, id: idx }, ...prev].slice(0, 4));
      setEarned((e) => e + item.earn);
      nextRef.current = idx + 1;
    }, 2200);
    return () => clearInterval(t);
  }, [inView]);

  const earnedAnimated = useCountUp(earned, { duration: 600 });

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[340px]">
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[3.5rem] bg-energy-gradient opacity-30 blur-3xl"
      />

      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-[2.5rem] border border-white/10 bg-ink-900 p-2.5 shadow-2xl ring-1 ring-white/5"
      >
        {/* notch */}
        <div
          aria-hidden
          className="absolute left-1/2 top-2.5 z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-ink-900"
        />

        {/* screen */}
        <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] bg-[#0b1020] px-4 pb-4 pt-10">
          <div className="flex items-center justify-between text-[11px] text-white/50">
            <span>9:41</span>
            <span className="font-display font-semibold tracking-tight text-white/80">
              eMoney
            </span>
          </div>

          {/* Earnings card */}
          <div className="mt-4 overflow-hidden rounded-3xl bg-energy-gradient p-4 text-white shadow-energy-sm">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                Aaj ka earning
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping-soft" aria-hidden />
                Live
              </span>
            </div>
            <p className="mt-1.5 font-display text-4xl font-semibold tracking-[-0.02em] tabular-nums">
              <span aria-hidden>
                ₹{Math.round(earnedAnimated).toLocaleString("en-IN")}
              </span>
              <span className="sr-only">₹{earned.toLocaleString("en-IN")} earned today</span>
            </p>
            <div className="mt-3 flex items-end gap-1" aria-hidden>
              {[38, 52, 44, 70, 58, 82, 66, 90, 74, 100, 88, 96].map((h, i) => (
                <span
                  key={i}
                  className="w-full rounded-sm bg-white/35"
                  style={{ height: `${Math.max(6, h * 0.28)}px` }}
                />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-white/85">
              <TrendUp size={12} weight="bold" aria-hidden />
              +18% vs yesterday
            </p>
          </div>

          {/* Feed */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Live at your counter
            </p>
            <span className="text-[10px] text-white/35">auto-refresh</span>
          </div>

          <ul className="mt-2 space-y-2" aria-live="off">
            <AnimatePresence initial={false} mode="popLayout">
              {rows.map((row) => (
                <motion.li
                  key={row.id}
                  layout
                  initial={{ opacity: 0, y: -16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.97 }}
                  transition={{ duration: reduce ? 0 : 0.42, ease: easeOut }}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5 ring-1 ring-white/5"
                >
                  <IconTile icon={row.icon} tone={row.tone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {row.service} · {row.amount}
                    </p>
                    <p className="text-[11px] text-white/45">{row.city} · just now</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-accent-400">
                    +₹{row.earn}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden>
            {[
              { icon: Fingerprint, label: "AePS" },
              { icon: PaperPlaneTilt, label: "Send" },
              { icon: QrCode, label: "QR" },
              { icon: Wallet, label: "Wallet" }
            ].map(({ icon: I, label }) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl bg-white/[0.05] py-2.5 text-white/70 ring-1 ring-white/5"
                )}
              >
                <I size={18} weight="duotone" />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-white/30">
            <Receipt size={11} weight="duotone" aria-hidden />
            <Airplane size={11} weight="duotone" aria-hidden />
            60+ services · one login
          </div>
        </div>
      </motion.div>
    </div>
  );
}
