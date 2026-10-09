"use client";

import { useId, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  DeviceMobile,
  Fingerprint,
  Monitor,
  PaperPlaneTilt,
  Receipt,
  type Icon
} from "@phosphor-icons/react";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./_shared/ButtonLink";
import { SectionHeading } from "./_shared/SectionHeading";
import { useCountUp } from "./_shared/useCountUp";

type CalcService = {
  key: string;
  label: string;
  /** Average retailer commission per transaction (₹). */
  rate: number;
  /** Share of daily footfall that uses this service. */
  share: number;
  icon: Icon;
  tone: IconTone;
};

const CALC_SERVICES: CalcService[] = [
  { key: "aeps", label: "AePS", rate: 6, share: 0.35, icon: Fingerprint, tone: "brand" },
  { key: "dmt", label: "Send Money", rate: 8, share: 0.2, icon: PaperPlaneTilt, tone: "royal" },
  { key: "bills", label: "Bill Pay", rate: 4, share: 0.2, icon: Receipt, tone: "accent" },
  { key: "recharge", label: "Recharge", rate: 3, share: 0.15, icon: DeviceMobile, tone: "coral" },
  { key: "pos", label: "POS", rate: 5, share: 0.1, icon: Monitor, tone: "amber" }
];

const WORKING_DAYS = 26;
const MIN = 10;
const MAX = 200;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function EarningsCalculator() {
  const reduce = useReducedMotion();
  const sliderId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const [customers, setCustomers] = useState(60);
  const [active, setActive] = useState<string[]>(CALC_SERVICES.map((s) => s.key));

  const toggle = (key: string) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const { perDay, perMonth, perYear } = useMemo(() => {
    const perCustomer = CALC_SERVICES.filter((s) => active.includes(s.key)).reduce(
      (sum, s) => sum + s.rate * s.share,
      0
    );
    const day = customers * perCustomer;
    return { perDay: day, perMonth: day * WORKING_DAYS, perYear: day * WORKING_DAYS * 12 };
  }, [customers, active]);

  const animatedMonth = useCountUp(Math.round(perMonth), { duration: 700, start: inView });
  const pct = ((customers - MIN) / (MAX - MIN)) * 100;

  return (
    <section className="bg-[#f6f7fb] py-20 md:py-28" aria-labelledby="calc-heading">
      <div ref={ref} className="container-x grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Controls */}
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading
              eyebrow="Earnings calculator"
              title={<span id="calc-heading">How much can your shop earn?</span>}
              sub="Slide to your daily footfall. Tap the services you'll offer. Real averages, no fairy tales."
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <label htmlFor={sliderId} className="text-sm font-semibold text-ink-700">
                  Customers per day
                </label>
                <output
                  htmlFor={sliderId}
                  className="font-display text-3xl font-semibold tabular-nums tracking-[-0.02em] text-ink-950"
                >
                  {customers}
                </output>
              </div>

              <div className="relative mt-4">
                <input
                  id={sliderId}
                  type="range"
                  min={MIN}
                  max={MAX}
                  step={5}
                  value={customers}
                  onChange={(e) => setCustomers(Number(e.target.value))}
                  aria-valuetext={`${customers} customers per day`}
                  className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-accent-500 focus-energy [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-accent-500 [&::-moz-range-thumb]:shadow-energy-sm [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:shadow-energy-sm"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 right-0 my-auto h-2 rounded-full bg-ink-100"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-medium text-ink-400">
                <span>{MIN}</span>
                <span>100</span>
                <span>{MAX}+</span>
              </div>

              <p className="mt-7 text-sm font-semibold text-ink-700">Services you&apos;ll offer</p>
              <div role="group" aria-label="Services" className="mt-3 flex flex-wrap gap-2">
                {CALC_SERVICES.map((s) => {
                  const on = active.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(s.key)}
                      className={cn(
                        "focus-energy inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors",
                        on
                          ? "pill-active border-transparent"
                          : "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900"
                      )}
                    >
                      <IconTile icon={s.icon} tone={s.tone} size="xs" />
                      {s.label}
                      <span
                        className={cn(
                          "ml-0.5 grid h-4 w-4 place-items-center rounded-full",
                          on ? "bg-royal-600 text-white" : "border border-ink-300"
                        )}
                        aria-hidden
                      >
                        {on && <Check size={10} weight="bold" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Result */}
        <div className="lg:col-span-7">
          <Reveal delay={0.15} className="h-full">
            <div className="grain relative flex h-full flex-col overflow-hidden rounded-4xl bg-ink-950 p-7 text-white md:p-10">
              <div
                aria-hidden
                className="aurora-glow absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-30"
              />
              <div className="relative z-10 flex flex-1 flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                  Estimated monthly commission
                </p>

                <div className="mt-4 min-h-[5rem]">
                  {active.length === 0 ? (
                    <p className="font-display text-3xl font-semibold text-white/60">
                      Pick at least one service.
                    </p>
                  ) : (
                    <motion.p
                      key={active.length}
                      initial={reduce ? false : { opacity: 0.6, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="font-display text-6xl font-semibold leading-none tracking-[-0.03em] tabular-nums md:text-7xl lg:text-8xl"
                    >
                      <span aria-hidden>{inr(animatedMonth)}</span>
                      <span className="sr-only">{inr(perMonth)} per month</span>
                    </motion.p>
                  )}
                </div>

                <p className="mt-3 text-sm text-white/55">
                  at {customers} customers a day · {WORKING_DAYS} working days
                </p>

                <dl className="mt-8 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-5">
                  {[
                    { k: "Per day", v: inr(perDay) },
                    { k: "Per month", v: inr(perMonth) },
                    { k: "Per year", v: inr(perYear) }
                  ].map((s) => (
                    <div key={s.k} className="px-3 first:pl-0 last:pr-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                        {s.k}
                      </dt>
                      <dd className="mt-1 font-display text-xl font-semibold tabular-nums tracking-[-0.02em] md:text-2xl">
                        {s.v}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-auto flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <ButtonLink href="/register" size="lg">
                    Lock in these earnings
                    <ArrowRight size={16} weight="bold" aria-hidden />
                  </ButtonLink>
                  <p className="max-w-xs text-[11px] leading-relaxed text-white/40">
                    Based on average retailer commission per transaction: AePS ₹6 · Send
                    Money ₹8 · Bills ₹4 · Recharge ₹3 · POS ₹5. Your slab may be higher.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
