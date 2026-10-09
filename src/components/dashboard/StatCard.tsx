"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * Emoney StatCard — v2 "Bharat Energy".
 *
 * `rounded-3xl` white card with a tone-tinted glow, IconTile glyph, Clash
 * Display value with an rAF count-up, delta chip and an optional gradient
 * sparkline. Backward-compatible with the v1 props (`accent` still accepts
 * brand | accent | emerald | violet and is mapped to the v2 tone scale).
 */
export type StatCardAccent = "brand" | "accent" | "emerald" | "violet";

const ACCENT_TO_TONE: Record<StatCardAccent, IconTone> = {
  brand: "brand",
  accent: "accent",
  emerald: "accent",
  violet: "royal",
};

const TONE_GLOW: Record<IconTone, string> = {
  brand: "bg-brand-400",
  accent: "bg-accent-400",
  royal: "bg-royal-400",
  coral: "bg-coral-400",
  amber: "bg-amber-400",
  ink: "bg-ink-400",
  energy: "bg-energy-gradient",
};

const TONE_STROKE: Record<IconTone, [string, string]> = {
  brand: ["#2563eb", "#60a5fa"],
  accent: ["#16a34a", "#4ade80"],
  royal: ["#7c3aed", "#a78bfa"],
  coral: ["#e11d48", "#fb7185"],
  amber: ["#d97706", "#fbbf24"],
  ink: ["#34445d", "#7388a6"],
  energy: ["#7c3aed", "#f43f5e"],
};

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ────────────────────────────────────────────────────────────────────
   Count-up: parse the first numeric run in the string ("₹1,28,450.50",
   "96.8%", "42") and animate just that part, preserving prefix/suffix,
   decimal places and Indian digit grouping.
   ──────────────────────────────────────────────────────────────────── */
const NUM_RE = /-?\d[\d,]*(?:\.\d+)?/;

type Parsed = {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  grouped: boolean;
};

function parseValue(value: string): Parsed | null {
  const m = NUM_RE.exec(value);
  if (!m) return null;
  const raw = m[0];
  const target = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;
  const dot = raw.indexOf(".");
  return {
    prefix: value.slice(0, m.index),
    suffix: value.slice(m.index + raw.length),
    target,
    decimals: dot === -1 ? 0 : raw.length - dot - 1,
    grouped: raw.includes(","),
  };
}

function formatNumber(n: number, p: Parsed): string {
  const fixed = n.toFixed(p.decimals);
  if (!p.grouped) return fixed;
  const [int, frac] = fixed.split(".");
  const groupedInt = Math.abs(Number(int)).toLocaleString("en-IN");
  const sign = n < 0 ? "-" : "";
  return frac !== undefined ? `${sign}${groupedInt}.${frac}` : `${sign}${groupedInt}`;
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function CountUp({ value, duration = 900 }: { value: string; duration?: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useIsoLayoutEffect(() => {
    const parsed = parseValue(value);
    if (!parsed || reduce) {
      setDisplay(value);
      if (parsed) fromRef.current = parsed.target;
      return;
    }
    const from = fromRef.current;
    const to = parsed.target;
    if (from === to) {
      setDisplay(value);
      return;
    }
    // Paint the starting frame synchronously (layout effect) so there is no
    // flash of the final value before the first rAF tick.
    setDisplay(`${parsed.prefix}${formatNumber(from, parsed)}${parsed.suffix}`);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const n = from + (to - from) * easeOutExpo(t);
      setDisplay(`${parsed.prefix}${formatNumber(n, parsed)}${parsed.suffix}`);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(value);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration, reduce]);

  return <>{display}</>;
}

/* ──────────────────────────────────────────────────────────────────── */

function MiniSparkline({ values, tone }: { values: number[]; tone: IconTone }) {
  const id = useId();
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => [i * step, h - 2 - ((v - min) / range) * (h - 4)] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const [c1, c2] = TONE_STROKE[tone];
  const gid = `sc-${id.replace(/:/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 h-8 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`${gid}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid}-f)`} />
      <polyline
        points={line}
        fill="none"
        stroke={`url(#${gid}-s)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  icon: Icon,
  accent = "brand",
  href,
  sparkline,
  hint,
  tone,
  loading = false,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  /** v1 colour key. Prefer `tone` for new code. */
  accent?: StatCardAccent;
  href?: string;
  /** Optional series rendered as a gradient mini sparkline under the value. */
  sparkline?: number[];
  /** Small helper line under the value (e.g. "vs. yesterday"). */
  hint?: string;
  /** v2 tone — overrides `accent` when provided. */
  tone?: IconTone;
  /** Shows shimmer placeholders in place of the label / value. */
  loading?: boolean;
}) {
  const t: IconTone = tone ?? ACCENT_TO_TONE[accent] ?? "brand";
  const up = trend === "up";

  const card = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-sm shadow-inner-ring",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        href && "cursor-pointer hover:-translate-y-1 hover:border-brand-200 hover:shadow-energy-sm"
      )}
    >
      {/* Tone glow — the "inner highlight" */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-[0.10] blur-2xl transition-opacity duration-300",
          href && "group-hover:opacity-20",
          TONE_GLOW[t]
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <IconTile tone={t} size="md">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </IconTile>

        {loading ? (
          <Skeleton className="h-6 w-14 rounded-full" />
        ) : (
          delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                up
                  ? "bg-accent-50 text-accent-700 ring-accent-200"
                  : "bg-coral-50 text-coral-700 ring-coral-200"
              )}
            >
              {up ? (
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3 w-3" aria-hidden />
              )}
              {delta}
            </span>
          )
        )}
      </div>

      <div className="relative mt-4">
        {loading ? (
          <>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold leading-none tracking-[-0.02em] text-ink-950 tabular-nums md:text-3xl">
              <CountUp value={value} />
            </p>
            {hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>}
          </>
        )}
      </div>

      {!loading && sparkline && sparkline.length > 1 && (
        <MiniSparkline values={sparkline} tone={t} />
      )}

      {href && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-4 right-4 grid h-7 w-7 translate-y-1 place-items-center rounded-full bg-ink-950 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-3xl focus-energy">
        {card}
      </Link>
    );
  }

  return card;
}
