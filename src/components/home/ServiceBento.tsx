"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  Fingerprint,
  type Icon
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion";
import { services, type ServiceItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./_shared/SectionHeading";
import { iconForService, serviceToneByCategory } from "./_shared/serviceIcons";

type FilterKey = "all" | ServiceItem["category"];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "banking", label: "Banking" },
  { key: "recharge", label: "Top-ups" },
  { key: "bills", label: "Bills" },
  { key: "travel", label: "Travel" }
];

const FEATURED = new Set(["payment-gateway", "aadhaar-pay"]);

const easeOut = [0.22, 1, 0.36, 1] as const;

export function ServiceBento() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<FilterKey>("all");

  const visible = useMemo(
    () => (filter === "all" ? services : services.filter((s) => s.category === filter)),
    [filter]
  );

  return (
    <section id="services" className="bg-white py-20 md:py-28" aria-labelledby="bento-heading">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow="Everything at your counter"
              title={<span id="bento-heading">One login. Sixty ways to earn.</span>}
              sub="Banking, top-ups, bills and travel — every service pays you a commission the moment it succeeds."
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div
              role="group"
              aria-label="Filter services"
              className="inline-flex flex-wrap gap-1 rounded-full border border-ink-200 bg-white p-1.5 shadow-sm"
            >
              {FILTERS.map((f) => {
                const on = f.key === filter;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "focus-energy relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      on ? "text-royal-900" : "text-ink-600 hover:text-ink-900"
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="service-filter-pill"
                        className="pill-active absolute inset-0 rounded-full"
                        transition={
                          reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                        }
                        aria-hidden
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <motion.ul
          layout
          className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((s) => (
              <motion.li
                key={s.slug}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: easeOut }}
                className={cn(FEATURED.has(s.slug) && "col-span-2")}
              >
                {FEATURED.has(s.slug) ? <FeatureTile service={s} /> : <CompactTile service={s} />}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        <p className="mt-6 text-sm text-ink-500">
          Showing {visible.length} of {services.length} services ·{" "}
          <Link href="/services" className="font-semibold text-ink-800 underline-offset-4 hover:underline">
            see full list and commission slabs
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ── Tiles ─────────────────────────────────────────────────────────────── */

function CompactTile({ service }: { service: ServiceItem }) {
  const I: Icon = iconForService(service.slug);
  const tone = serviceToneByCategory[service.category] ?? "ink";
  return (
    <Link
      href={`/services#${service.slug}`}
      className="group focus-energy relative flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-4 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand-200 hover:shadow-energy md:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <IconTile icon={I} tone={tone} size="md" />
        {service.badge && (
          <Badge variant="energy" size="sm">
            {service.badge}
          </Badge>
        )}
      </div>
      <h3 className="mt-4 font-display text-base font-semibold tracking-[-0.01em] text-ink-950 md:text-lg">
        {service.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-500">{service.description}</p>
      <ArrowUpRight
        size={16}
        weight="bold"
        aria-hidden
        className="absolute bottom-4 right-4 text-ink-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-royal-600"
      />
    </Link>
  );
}

function FeatureTile({ service }: { service: ServiceItem }) {
  const isPg = service.slug === "payment-gateway";
  return (
    <Link
      href={`/services#${service.slug}`}
      className={cn(
        "group focus-energy grain relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-3xl p-5 text-white transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-energy md:p-6",
        isPg
          ? "bg-gradient-to-br from-royal-600 via-brand-600 to-brand-800"
          : "bg-gradient-to-br from-ink-900 via-ink-950 to-brand-950"
      )}
    >
      {!isPg && (
        <div
          aria-hidden
          className="aurora-glow absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-40"
        />
      )}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
          {isPg ? (
            <CreditCard size={22} weight="duotone" aria-hidden />
          ) : (
            <Fingerprint size={22} weight="duotone" aria-hidden />
          )}
        </span>
        <Badge variant="energy" size="sm" className="bg-white/15 ring-white/25">
          {service.badge ?? "Most used"}
        </Badge>
      </div>

      <h3 className="relative z-10 mt-5 font-display text-2xl font-semibold tracking-[-0.02em] md:text-3xl">
        {isPg ? "Payment Gateway" : "Aadhaar Pay"}
      </h3>
      <p className="relative z-10 mt-1.5 max-w-sm text-sm leading-snug text-white/75">
        {service.description}
      </p>

      {/* mini mock */}
      <div className="relative z-10 mt-auto pt-6">
        {isPg ? <PgMock /> : <AepsMock />}
      </div>

      <ArrowUpRight
        size={18}
        weight="bold"
        aria-hidden
        className="absolute right-5 top-5 z-10 text-white/0 transition-all group-hover:translate-x-0.5 group-hover:text-white/80"
      />
    </Link>
  );
}

function PgMock() {
  return (
    <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-inset ring-white/15 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
            Payment received
          </p>
          <p className="mt-0.5 font-display text-xl font-semibold tabular-nums">₹12,400</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-400/20 px-2 py-1 text-[10px] font-bold text-accent-200">
          <CheckCircle size={12} weight="fill" aria-hidden />
          Settles T+1
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["UPI", "Cards", "Net banking", "Wallets", "EMI"].map((m) => (
          <span
            key={m}
            className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80"
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function AepsMock() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-inset ring-white/10">
      <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent-500/20 text-accent-300">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-accent-400/50 animate-ping-soft"
        />
        <Fingerprint size={28} weight="duotone" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
          Thumb verified
        </p>
        <p className="mt-0.5 truncate font-display text-lg font-semibold">
          ₹2,000 paid out · <span className="text-accent-300">+₹6 earned</span>
        </p>
        <p className="text-[11px] text-white/50">Any bank · any customer · 1.4s</p>
      </div>
    </div>
  );
}
