"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { services, type ServiceItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import { iconForService, serviceToneByCategory } from "./_shared/serviceIcons";

const toneText: Record<string, string> = {
  brand: "text-brand-600",
  royal: "text-royal-600",
  accent: "text-accent-600",
  coral: "text-coral-500",
  ink: "text-ink-600",
  amber: "text-amber-600",
  energy: "text-royal-600"
};

const half = Math.ceil(services.length / 2);
const rowA = services.slice(0, half);
const rowB = services.slice(half);

/**
 * Two counter-scrolling marquee rows of service chips. Pure CSS motion
 * (`animate-marquee`), paused on hover, disabled under reduced motion.
 */
export function ServiceTicker() {
  return (
    <section
      aria-label="Services at a glance"
      className="relative border-b border-ink-100 bg-white py-8 md:py-10"
    >
      <div className="container-x mb-5 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
          60+ ways your counter earns
        </p>
        <Link
          href="/services"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-ink-700 hover:text-ink-950"
        >
          All services
          <ArrowRight
            size={14}
            weight="bold"
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      <div className="space-y-3">
        <TickerRow items={rowA} />
        <TickerRow items={rowB} reverse />
      </div>
    </section>
  );
}

function TickerRow({ items, reverse }: { items: ServiceItem[]; reverse?: boolean }) {
  const loop = [...items, ...items];
  return (
    <div className="group mask-fade-x overflow-hidden">
      <ul
        className={cn(
          "flex w-max gap-3 pr-3 animate-marquee motion-reduce:animate-none group-hover:[animation-play-state:paused]",
          reverse && "[animation-direction:reverse]"
        )}
        style={{ animationDuration: "48s" }}
      >
        {loop.map((s, i) => {
          const I = iconForService(s.slug);
          const tone = serviceToneByCategory[s.category] ?? "ink";
          return (
            <li
              key={`${s.slug}-${i}`}
              aria-hidden={i >= items.length || undefined}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-2xl border border-ink-100 bg-[#f6f7fb] px-4 py-2.5 transition-colors hover:border-ink-200 hover:bg-white"
            >
              <I size={18} weight="duotone" className={toneText[tone]} aria-hidden />
              <span className="text-sm font-semibold text-ink-800">{s.title}</span>
              {s.badge && (
                <span className="rounded-full bg-energy-gradient-x px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  {s.badge}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
