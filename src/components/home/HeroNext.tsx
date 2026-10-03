"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Wallet,
  Fingerprint,
  Send,
  QrCode,
  Smartphone,
  Receipt,
  Plane,
  TrendingUp
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { TiltCard } from "@/components/motion";
import { heroStats } from "@/lib/data";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function HeroNext() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated premium background — purple → blue → green → coral */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg mask-fade-y opacity-50" />
        <div className="aurora-glow absolute -left-40 top-6 h-[440px] w-[440px] rounded-full" />
        <div className="aurora-glow absolute -right-44 top-40 h-[500px] w-[500px] rounded-full [animation-direction:reverse]" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-white/50 to-transparent" />
      </div>

      <div className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <span className="eyebrow animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            The operating system for Digital Bharat
          </span>

          <h1 className="heading-xl mt-5 animate-fade-up [animation-delay:80ms]">
            Turn any shop into a{" "}
            <span className="relative inline-block">
              <span className="gradient-text bg-[length:200%_auto] animate-gradient-x">
                full bank branch
              </span>
              <svg
                viewBox="0 0 220 12"
                className="absolute -bottom-2 left-0 h-3 w-full text-royal-400"
                fill="none"
              >
                <path
                  d="M2 6 Q 60 0, 110 6 T 218 6"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            in under five minutes.
          </h1>

          <p className="lead mt-6 max-w-2xl animate-fade-up [animation-delay:160ms]">
            Cash withdrawal, money transfer, bills, recharges and travel — eMoney puts
            60+ RBI-grade banking services behind a single login. Instant settlements,
            the highest commissions in Bharat, and zero paperwork to start earning.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up [animation-delay:240ms]">
            <Link href="/register">
              <Button size="lg">
                Start earning today — it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#tour">
              <Button size="lg" variant="outline">
                Watch the 60-second tour
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-2.5 animate-fade-up [animation-delay:320ms]">
            <ComplianceChip text="RBI Authorised" tone="brand" />
            <ComplianceChip text="NPCI Certified" tone="royal" />
            <ComplianceChip text="PCI-DSS v4.0" tone="accent" />
            <ComplianceChip text="ISO 27001" tone="coral" />
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4 animate-fade-up [animation-delay:400ms]">
            {heroStats.map((s) => (
              <Counter key={s.label} value={s.value} label={s.label} />
            ))}
          </dl>

          <LiveTicker />
        </div>

        <div className="lg:col-span-5">
          <Hero3DCard />
        </div>
      </div>
    </section>
  );
}

function ComplianceChip({
  text,
  tone
}: {
  text: string;
  tone: keyof typeof toneMap;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur transition-colors hover:border-ink-300">
      <ShieldCheck className={cn("h-3.5 w-3.5", toneMap[tone])} />
      {text}
    </span>
  );
}

function LiveTicker() {
  const items = [
    "₹8.42 Cr settled today",
    "74 transactions in the last minute",
    "AePS ₹2,000 · settled in 1.4s",
    "DMT IMPS · 286 ms avg",
    "₹2,184 commission earned today",
    "1,200+ billers live",
    "99.98% switch uptime"
  ];
  return (
    <div className="mt-10 flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/60 p-2 pl-3 shadow-sm backdrop-blur animate-fade-up [animation-delay:480ms]">
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
        Live
      </span>
      <div className="mask-fade-x relative overflow-hidden">
        <div className="flex w-max animate-marquee gap-6 whitespace-nowrap">
          {[...items, ...items].map((t, i) => (
            <span key={i} className="flex items-center gap-6 text-xs font-medium text-ink-600">
              {t}
              <span className="h-1 w-1 rounded-full bg-ink-300" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const toneMap = {
  brand: "text-brand-600",
  accent: "text-accent-600",
  royal: "text-royal-600",
  coral: "text-coral-500"
} as const;

function Counter({ value, label }: { value: string; label: string }) {
  // animate the numeric portion in
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const num = parseFloat(value.replace(/[^\d.]/g, ""));
    if (!num || Number.isNaN(num)) return setDisplay(value);
    const suffix = value.replace(/[\d.,]/g, "");
    let start: number | null = null;
    const duration = 1200;
    let raf = 0;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = (num * eased).toFixed(num >= 100 ? 0 : 1);
      setDisplay(v + suffix);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div ref={ref}>
      <dt className="font-display text-3xl font-bold text-ink-900 md:text-4xl text-glow">
        {display}
      </dt>
      <dd className="mt-1 text-xs uppercase tracking-wider text-ink-500">
        {label}
      </dd>
    </div>
  );
}

function Hero3DCard() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: easeOut, delay: 0.2 }}
      className="relative mx-auto w-full max-w-md perspective-1200"
    >
      <motion.div
        aria-hidden
        animate={
          reduce
            ? undefined
            : { scale: [1, 1.06, 1], opacity: [0.55, 0.78, 0.55] }
        }
        transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
        className="absolute -inset-10 -z-10 rounded-[44px] bg-gradient-to-br from-royal-400/40 via-brand-300/40 to-coral-300/40 blur-3xl"
      />

      <TiltCard intensity="normal" glare={false} className="relative">
        <div
          className="relative rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-glow backdrop-blur"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-ink-500">
                eMoney Wallet
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-ink-900">
                ₹ 28,450.00
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-500" />
              Active
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "AePS", color: "from-brand-500 to-brand-700", val: "₹3,420" },
              { label: "DMT", color: "from-accent-500 to-accent-700", val: "₹1,840" },
              { label: "Recharge", color: "from-coral-400 to-coral-600", val: "₹2,180" }
            ].map((t, i) => (
              <div
                key={t.label}
                className={cn(
                  "rounded-2xl bg-gradient-to-br p-3 text-white shadow-soft",
                  t.color
                )}
                style={{ transform: `translateZ(${20 + i * 6}px)` }}
              >
                <p className="text-[10px] uppercase tracking-widest opacity-80">Today</p>
                <p className="mt-1 text-base font-bold">{t.val}</p>
                <p className="text-[11px] opacity-90">{t.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {[Fingerprint, Send, QrCode, Smartphone, Receipt, Plane, Wallet, TrendingUp].map((I, i) => (
              <span
                key={i}
                className="grid h-12 w-full place-items-center rounded-xl bg-ink-50 text-ink-700 transition hover:bg-royal-600 hover:text-white"
                style={{ transform: `translateZ(${10}px)` }}
              >
                <I className="h-4 w-4" />
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-gradient-to-r from-royal-600 via-brand-600 to-accent-500 p-3 text-center text-xs text-white shadow-soft">
            <span className="font-semibold">+₹ 2,184</span> earned today as commission
          </div>
        </div>

        {/* Floating badges */}
        <FloatBadge
          className="absolute -left-10 top-16 hidden rounded-2xl border border-white/70 bg-white px-3 py-2 shadow-soft md:block"
          translateZ={80}
          delay={0}
          range={10}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-100 text-accent-700">✓</span>
            <div>
              <p className="text-xs font-semibold text-ink-900">AePS · ₹2,000</p>
              <p className="text-[10px] text-ink-500">Settled in 1.4s</p>
            </div>
          </div>
        </FloatBadge>

        <FloatBadge
          className="absolute -right-6 bottom-20 hidden rounded-2xl border border-white/70 bg-white px-3 py-2 shadow-soft md:block"
          translateZ={70}
          delay={1.2}
          range={8}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-royal-100 text-royal-700">₹</span>
            <div>
              <p className="text-xs font-semibold text-ink-900">Wallet credited</p>
              <p className="text-[10px] text-ink-500">+₹ 2,500.00</p>
            </div>
          </div>
        </FloatBadge>

        <FloatBadge
          className="absolute -left-4 -bottom-4 hidden rounded-2xl border border-white/70 bg-gradient-to-br from-royal-600 to-coral-500 px-3 py-2 text-white shadow-glow md:block"
          translateZ={90}
          delay={0.6}
          range={12}
        >
          <p className="text-[10px] uppercase tracking-widest opacity-80">Today</p>
          <p className="font-display text-sm font-bold">74 transactions</p>
        </FloatBadge>
      </TiltCard>
    </motion.div>
  );
}

function FloatBadge({
  children,
  className,
  translateZ,
  delay,
  range
}: {
  children: React.ReactNode;
  className?: string;
  translateZ: number;
  delay: number;
  range: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ z: translateZ }}
      animate={reduce ? undefined : { y: [0, -range, 0] }}
      transition={{
        duration: 5 + delay,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}
