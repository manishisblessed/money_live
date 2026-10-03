"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Store, Users, Network, Lock, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;
const AUTO_MS = 6000;

const roles = [
  {
    id: "retailer",
    label: "Retailer",
    tag: "The shopkeeper",
    icon: Store,
    color: "from-accent-500 to-accent-700",
    accent: "accent",
    headline: "Your counter is now a banking counter",
    sub: "Everything your customers ask for — in one tap, settled instantly.",
    bullets: [
      "60+ services: AePS, DMT, UPI, recharges, bills & travel",
      "Instant IMPS settlement + 24×7 wallet top-up",
      "Industry-highest commissions on every transaction",
      "Free RuPay debit card & branded sound box"
    ],
    visual: "retailer"
  },
  {
    id: "distributor",
    label: "Distributor",
    tag: "The network builder",
    icon: Users,
    color: "from-brand-500 to-brand-700",
    accent: "brand",
    headline: "Grow a retailer army, earn on every tap",
    sub: "Onboard, fund and reward your retailers from one control room.",
    bullets: [
      "Onboard new retailers in under 5 minutes",
      "Approve fund requests with a single tap",
      "Set your own commission slabs per service",
      "Live leaderboard of your top-earning shops"
    ],
    visual: "distributor"
  },
  {
    id: "master",
    label: "Master Distributor",
    tag: "The brand owner",
    icon: Network,
    color: "from-royal-500 to-royal-700",
    accent: "royal",
    headline: "Launch your own fintech, under your own brand",
    sub: "A white-label banking business on your domain — we run the rails.",
    bullets: [
      "White-label portal & app on your own domain",
      "Full REST API + webhooks for your stack",
      "Override commissions across the entire tree",
      "Co-branded marketing kits & creatives"
    ],
    visual: "master"
  },
  {
    id: "admin",
    label: "Platform Admin",
    tag: "The operator",
    icon: Lock,
    color: "from-coral-400 to-coral-600",
    accent: "coral",
    headline: "Total visibility. Total control. Zero surprises",
    sub: "Watch every switch, every rupee and every risk — in real time.",
    bullets: [
      "KYC queue with DigiLocker auto-verification",
      "Live SLO board for every payment switch",
      "Tamper-proof audit log + WORM storage",
      "Velocity rules, fraud holds & settlement runs"
    ],
    visual: "admin"
  }
] as const;

export function RoleShowcase() {
  const [active, setActive] = useState<(typeof roles)[number]["id"]>("retailer");
  const [paused, setPaused] = useState(false);
  const role = roles.find((r) => r.id === active)!;
  const activeIndex = roles.findIndex((r) => r.id === active);

  const next = useCallback(() => {
    setActive((cur) => {
      const i = roles.findIndex((r) => r.id === cur);
      return roles[(i + 1) % roles.length].id;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [active, paused, next]);

  return (
    <section
      id="tour"
      className="relative overflow-hidden bg-ink-950 py-20 md:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Aurora + grid backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-glow absolute -left-40 top-10 h-[520px] w-[520px] rounded-full opacity-30" />
        <div className="aurora-glow absolute -right-48 bottom-0 h-[560px] w-[560px] rounded-full opacity-25 [animation-direction:reverse]" />
        <div className="grid-bg absolute inset-0 opacity-[0.07]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/80 to-ink-950" />
      </div>

      <div className="container-x">
        <Reveal>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
              <Network className="h-3.5 w-3.5" /> One platform, four jobs
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Pick your role.{" "}
              <span className="gradient-text">See your workspace.</span>
            </h2>
            <p className="mt-4 text-base text-white/60 md:text-lg">
              From the village shopkeeper to the platform operator, every persona gets a
              dashboard engineered around exactly what <em>they</em> do all day.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Vertical stepper rail */}
          <div className="lg:col-span-5">
            <ul className="relative space-y-2">
              {/* progress rail */}
              <span className="absolute left-[22px] top-2 bottom-2 w-px bg-white/10" />
              <motion.span
                className={cn(
                  "absolute left-[20px] w-[3px] rounded-full bg-gradient-to-b",
                  role.color
                )}
                animate={{
                  top: `calc(${activeIndex} * (100% / ${roles.length}) + 10px)`,
                  height: `calc(100% / ${roles.length} - 20px)`
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              />
              {roles.map((r) => {
                const Icon = r.icon;
                const a = active === r.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setActive(r.id)}
                      className={cn(
                        "group relative flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                        a
                          ? "border-white/15 bg-white/[0.07] shadow-glow backdrop-blur"
                          : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-all duration-300",
                          a
                            ? cn("bg-gradient-to-br text-white shadow-soft", r.color)
                            : "bg-white/10 text-white/60 group-hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-sm font-semibold transition-colors",
                            a ? "text-white" : "text-white/70 group-hover:text-white"
                          )}
                        >
                          {r.label}
                        </span>
                        <span className="block text-xs text-white/40">{r.tag}</span>
                      </span>
                      {a && !paused && (
                        <motion.span
                          key={`bar-${r.id}`}
                          className="absolute inset-x-4 bottom-2 h-0.5 origin-left rounded-full bg-white/25"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Detail + visual */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className="relative rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-glow backdrop-blur md:p-8"
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -inset-px -z-10 rounded-[28px] bg-gradient-to-br opacity-20 blur-xl",
                    role.color
                  )}
                />
                <span
                  className={cn(
                    "inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white",
                    role.color
                  )}
                >
                  {role.label}
                </span>
                <h3 className="mt-4 font-display text-2xl font-bold text-white md:text-3xl">
                  {role.headline}
                </h3>
                <p className="mt-2 text-sm text-white/60 md:text-base">{role.sub}</p>

                <div className="mt-7 grid gap-6 md:grid-cols-2">
                  <motion.ul
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
                    }}
                    className="space-y-3"
                  >
                    {role.bullets.map((b) => (
                      <motion.li
                        key={b}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          show: { opacity: 1, x: 0 }
                        }}
                        transition={{ duration: 0.4, ease: easeOut }}
                        className="flex items-start gap-3 text-sm text-white/80"
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white",
                            role.color
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{b}</span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <RoleVisual id={role.id} color={role.color} />
                </div>

                <Link
                  href="/login"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:translate-x-1"
                >
                  Try the {role.label.toLowerCase()} demo <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleVisual({ id, color }: { id: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-4 backdrop-blur">
      {id === "retailer" && <RetailerVisual color={color} />}
      {id === "distributor" && <DistributorVisual />}
      {id === "master" && <MasterVisual />}
      {id === "admin" && <AdminVisual />}
    </div>
  );
}

function MiniBars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div className="flex h-20 items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex-1">
          <div
            className={cn("rounded-t-md bg-gradient-to-t", color)}
            style={{ height: `${(v / max) * 100}%`, minHeight: "8%" }}
          />
        </div>
      ))}
    </div>
  );
}

function RetailerVisual({ color }: { color: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Wallet</p>
          <p className="font-display text-lg font-bold text-white">₹ 28,450</p>
        </div>
        <span className="rounded-full bg-accent-500/15 px-2 py-1 text-[10px] font-semibold text-accent-300">
          +₹ 2,184 today
        </span>
      </div>
      <MiniBars values={[12, 18, 14, 22, 28, 24, 32, 30, 36, 42, 38, 48]} color={color} />
      <div className="grid grid-cols-4 gap-2">
        {["AePS", "DMT", "UPI", "Bills"].map((s) => (
          <div
            key={s}
            className="rounded-lg bg-white/5 p-2 text-center text-[10px] font-semibold text-white/70"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributorVisual() {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] uppercase tracking-widest text-white/40">My retailers · 86</p>
      {[
        { n: "Aman Sharma", t: "₹ 184k" },
        { n: "Mukesh Kumar", t: "₹ 312k" },
        { n: "Priya Sharma", t: "₹ 145k" }
      ].map((r) => (
        <div
          key={r.n}
          className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2"
        >
          <div>
            <p className="text-xs font-semibold text-white">{r.n}</p>
            <p className="text-[10px] text-white/40">MTD turnover</p>
          </div>
          <span className="font-display text-sm font-bold text-white">{r.t}</span>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-600 to-brand-400 p-3 text-white">
        <p className="text-xs font-semibold">12 fund requests pending</p>
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px]">Review →</span>
      </div>
    </div>
  );
}

function MasterVisual() {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] uppercase tracking-widest text-white/40">kapoorpay.in · live</p>
      <div className="rounded-xl bg-gradient-to-br from-royal-700 via-royal-600 to-royal-400 p-3 text-white">
        <p className="text-[9px] uppercase tracking-widest opacity-80">KapoorPay</p>
        <p className="mt-1 font-display text-sm font-bold">Bharat ka apna fintech</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Distributors", "3"],
          ["Retailers", "482"],
          ["API calls / day", "4.2M"],
          ["Override · MTD", "₹ 18.4L"]
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-white/10 p-2.5">
            <p className="text-[9px] uppercase tracking-widest text-white/40">{l}</p>
            <p className="font-display text-base font-bold text-white">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminVisual() {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] uppercase tracking-widest text-white/40">Platform health · live</p>
      {[
        { l: "AePS Switch", v: "99.98%", t: "412 ms", ok: true },
        { l: "DMT IMPS", v: "99.99%", t: "286 ms", ok: true },
        { l: "BBPS", v: "99.92%", t: "642 ms", ok: false }
      ].map((r) => (
        <div
          key={r.l}
          className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn("h-2 w-2 rounded-full", r.ok ? "bg-emerald-400" : "bg-amber-400")}
            />
            <p className="text-xs font-semibold text-white">{r.l}</p>
          </div>
          <div className="text-right text-[10px]">
            <p className="font-semibold text-white">{r.v}</p>
            <p className="text-white/40">{r.t}</p>
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-gradient-to-r from-coral-500 to-coral-400 p-3 text-white">
        <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">
          Velocity rule fired
        </p>
        <p className="font-display text-xs font-bold">JNPR3217 · 18 AePS in 12 mins · auto-hold</p>
      </div>
    </div>
  );
}
