"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; heading: string };

/**
 * LegalToc — sticky table of contents with active-section tracking.
 * Desktop: vertical list with a sliding marker. Mobile: a native `<details>`
 * so the TOC never pushes the document far below the fold.
 */
export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = React.useState(items[0]?.id ?? "");

  React.useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const list = (compact: boolean) => (
    <ol className={cn("space-y-0.5", compact ? "mt-2" : "mt-4")}>
      {items.map((item, idx) => {
        const isActive = item.id === active;
        return (
          <li key={item.id} className="relative">
            {isActive && !compact && (
              <motion.span
                layoutId="legal-toc-marker"
                aria-hidden
                className="absolute inset-y-0 -left-px w-0.5 rounded-full bg-energy-gradient"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <a
              href={`#${item.id}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex items-start gap-2.5 rounded-r-xl py-1.5 pl-4 pr-2 text-sm transition-colors focus-energy",
                isActive
                  ? "font-semibold text-ink-950"
                  : "text-ink-500 hover:text-ink-900"
              )}
            >
              <span className="mt-px shrink-0 font-display text-[11px] font-semibold tabular-nums text-ink-300">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">
                {item.heading.replace(/^\d+\.\s*/, "")}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Mobile */}
      <details className="group mb-8 rounded-2xl border border-ink-100 bg-ink-50/60 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
          On this page
          <span className="text-ink-400 transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="border-t border-ink-100 px-2 pb-3">{list(true)}</div>
      </details>

      {/* Desktop */}
      <nav aria-label="On this page" className="hidden lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          On this page
        </p>
        <div className="relative border-l border-ink-100">{list(false)}</div>
      </nav>
    </>
  );
}
