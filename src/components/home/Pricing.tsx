"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { pricingPlans } from "@/lib/data";
import { cn } from "@/lib/utils";

type Cycle = "monthly" | "yearly";

// Derive a monthly figure from the yearly price so that paying yearly ≈ 20% cheaper.
function priceFor(plan: (typeof pricingPlans)[number], cycle: Cycle) {
  const yearly = Number(plan.price.replace(/[^\d]/g, ""));
  if (!yearly) return { amount: 0, suffix: "forever free", note: plan.description };
  if (cycle === "yearly") {
    return {
      amount: yearly,
      suffix: "/year",
      note: `≈ ₹${Math.round(yearly / 10)}/mo · billed yearly`
    };
  }
  const monthly = Math.round(yearly / 10);
  return { amount: monthly, suffix: "/month", note: "Billed monthly · cancel anytime" };
}

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("yearly");

  return (
    <Section className="relative overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="conic-glow absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30" />
        <div className="grid-bg absolute inset-0 opacity-[0.06]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-transparent to-ink-950" />
      </div>

      <Container>
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Simple, honest pricing
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Start free. <span className="gradient-text">Scale when you earn.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 md:text-lg">
              No setup fees, no lock-in. Pick a plan that matches your shop and upgrade the
              moment your commissions outgrow it.
            </p>
          </div>
        </Reveal>

        {/* Billing toggle */}
        <Reveal direction="up" delay={0.05} className="mt-8 flex items-center justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
            {(["monthly", "yearly"] as const).map((c) => {
              const a = cycle === c;
              return (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={cn(
                    "relative rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors duration-300",
                    a ? "text-ink-900" : "text-white/70 hover:text-white"
                  )}
                >
                  {a && (
                    <motion.span
                      layoutId="cycleToggle"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 -z-10 rounded-full bg-white shadow-soft"
                    />
                  )}
                  {c}
                  {c === "yearly" && (
                    <span
                      className={cn(
                        "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        a ? "bg-accent-500/15 text-accent-700" : "bg-accent-500/20 text-accent-300"
                      )}
                    >
                      -20%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>

        <Stagger stagger={0.12} className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const p = priceFor(plan, cycle);
            return (
              <StaggerItem key={plan.name}>
                <div
                  className={cn(
                    "group relative flex h-full flex-col rounded-3xl border p-8 backdrop-blur transition-all duration-500",
                    plan.highlighted
                      ? "border-white/20 bg-white/[0.07] shadow-glow lg:-translate-y-3 lg:scale-[1.03]"
                      : "border-white/10 bg-white/[0.03] hover:-translate-y-1.5 hover:border-white/20"
                  )}
                >
                  {/* Animated conic glow beam for the popular plan */}
                  {plan.highlighted && (
                    <>
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-royal-500 via-brand-500 to-accent-400 px-3 py-1 text-xs font-semibold text-white shadow-soft">
                        Most popular
                      </span>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-px -z-10 overflow-hidden rounded-3xl"
                      >
                        <span className="aurora-glow absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-25" />
                      </span>
                    </>
                  )}

                  <div>
                    <p className="font-display text-lg font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-sm text-white/50">{plan.description}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="font-display text-5xl font-bold text-white">
                        {p.amount === 0 ? (
                          "₹0"
                        ) : (
                          <>
                            ₹<AnimatedNumber value={p.amount} />
                          </>
                        )}
                      </span>
                      <span className="text-sm text-white/50">{p.suffix}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">{p.note}</p>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-white/75">
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                            plan.highlighted
                              ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                              : "bg-white/10 text-accent-300"
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link href="/register">
                      <Button
                        variant={plan.highlighted ? "primary" : "outline"}
                        className={cn(
                          "w-full",
                          !plan.highlighted &&
                            "border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal direction="up" delay={0.1} className="mt-8 text-center">
          <p className="text-sm text-white/40">
            All plans include real-time settlements, 2-factor security and GST invoices · Prices
            exclusive of 18% GST
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;
    let raf = 0;
    let start: number | null = null;
    const duration = 500;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toLocaleString("en-IN")}</>;
}
