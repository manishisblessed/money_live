"use client";

import { MapPin, Translate } from "@phosphor-icons/react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { coverageZones, indiaMissions, languagesSupported } from "@/lib/data";
import { CountUp } from "./_shared/CountUp";
import { SectionHeading } from "./_shared/SectionHeading";

const BIG_NUMBERS = [
  { value: "28", label: "States & UTs", sub: "every corner of Bharat" },
  { value: "72K+", label: "Shops live", sub: "and hundreds joining daily" },
  { value: "1,400+", label: "Billers", sub: "via BBPS and direct rails" },
  { value: "₹240 Cr+", label: "Monthly volume", sub: "through counters like yours" }
];

export function BharatReach() {
  return (
    <section
      className="grain relative overflow-hidden bg-ink-950 py-20 text-white md:py-28"
      aria-labelledby="reach-heading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="aurora-glow absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full opacity-30" />
        <div className="grid-bg mask-fade-y absolute inset-0 opacity-[0.06] invert" />
      </div>

      <div className="container-x relative z-10">
        <Reveal>
          <SectionHeading
            dark
            eyebrow="Bharat reach"
            title={<span id="reach-heading">From Kanpur to Kochi, the counter is open.</span>}
            sub="One network of shops doing what bank branches never reached. Yours can be the next pin on the map."
          />
        </Reveal>

        {/* Big numerals */}
        <Stagger className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-4">
          {BIG_NUMBERS.map((n) => (
            <StaggerItem key={n.label} className="bg-ink-950 p-6 md:p-8">
              <p className="font-display text-5xl font-semibold tracking-[-0.03em] md:text-6xl lg:text-7xl">
                <CountUp value={n.value} />
              </p>
              <p className="mt-3 font-semibold text-white/90">{n.label}</p>
              <p className="text-sm text-white/45">{n.sub}</p>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Zones */}
        <Reveal className="mt-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
            <MapPin size={14} weight="duotone" aria-hidden />
            Shops by zone
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {coverageZones.map((z) => (
              <li
                key={z.zone}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
              >
                <p className="font-display text-2xl font-semibold tracking-[-0.02em]">
                  {z.retailers}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white/85">{z.zone}</p>
                <p className="text-xs text-white/45">
                  {z.states} states · {z.topCities.slice(0, 3).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Languages */}
        <Reveal className="mt-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              <Translate size={14} weight="duotone" aria-hidden />
              Support in
            </span>
            {languagesSupported.map((l) => (
              <span
                key={l}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/80"
              >
                {l}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Missions */}
        <Stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {indiaMissions.map((m) => (
            <StaggerItem
              key={m.code}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.07]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-5 font-display text-7xl font-semibold leading-none tracking-[-0.04em] text-white/[0.05]"
              >
                {m.code}
              </span>
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Mission {m.code}
              </p>
              <h3 className="relative mt-2 font-display text-lg font-semibold tracking-[-0.01em]">
                {m.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/60">{m.body}</p>
              <div className="relative mt-5 border-t border-white/10 pt-4">
                <p className="font-display text-3xl font-semibold tracking-[-0.02em]">{m.stat}</p>
                <p className="text-xs text-white/45">{m.statLabel}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
