"use client";

import { ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion";
import { trustBadges } from "@/lib/data";
import { cn } from "@/lib/utils";

const partners = [
  "NPCI",
  "RBI Authorised",
  "Visa",
  "Mastercard",
  "RuPay",
  "BBPS",
  "IRCTC",
  "FASTag",
  "UIDAI"
];

// Cycle each trust badge through the premium theme palette.
const badgeTones = [
  "text-royal-600 group-hover:text-royal-700",
  "text-brand-600 group-hover:text-brand-700",
  "text-accent-600 group-hover:text-accent-700",
  "text-coral-500 group-hover:text-coral-600"
];

export function TrustMarquee() {
  return (
    <Reveal direction="up" amount={0.3}>
      <section className="relative overflow-hidden border-y border-ink-100 bg-gradient-to-r from-royal-50/60 via-white to-accent-50/50 py-8">
        <div className="container-x">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
              Trusted across <span className="gradient-text">38M+ Indian businesses</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              {trustBadges.map((b, i) => (
                <div
                  key={b.label}
                  className="group inline-flex items-center gap-1.5 text-xs font-medium text-ink-600 transition-colors duration-300"
                >
                  <ShieldCheck
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                      badgeTones[i % badgeTones.length]
                    )}
                  />
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          <div className="mask-fade-x mt-6 overflow-hidden">
            <div className="flex w-max animate-marquee gap-12 [animation-play-state:running] hover:[animation-play-state:paused]">
              {[...partners, ...partners].map((p, i) => (
                <span
                  key={`${p}-${i}`}
                  className="font-display text-lg font-semibold text-ink-400 transition-colors duration-300 hover:text-royal-600"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
