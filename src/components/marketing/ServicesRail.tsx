"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type RailCategory = {
  id: string;
  label: string;
  count: number;
  hint: string;
};

/**
 * ServicesRail — sticky category navigation for /services.
 * Desktop: vertical rail on the left with a sliding active marker.
 * Mobile: horizontally scrollable chip bar pinned under the navbar.
 * Active section is tracked with IntersectionObserver.
 */
export function ServicesRail({ categories }: { categories: RailCategory[] }) {
  const [active, setActive] = React.useState(categories[0]?.id ?? "");

  React.useEffect(() => {
    const els = categories
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <>
      {/* Mobile chip bar */}
      <div className="sticky top-[4.75rem] z-30 -mx-4 mb-8 border-y border-ink-100 bg-white/85 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <nav aria-label="Service categories">
          <ul className="scrollbar-none flex gap-2 overflow-x-auto">
            {categories.map((c) => {
              const isActive = c.id === active;
              return (
                <li key={c.id} className="shrink-0">
                  <a
                    href={`#${c.id}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-energy",
                      isActive
                        ? "bg-ink-950 text-white"
                        : "bg-ink-100/70 text-ink-700 hover:bg-ink-100"
                    )}
                  >
                    {c.label}
                    <span
                      className={cn(
                        "tabular-nums",
                        isActive ? "text-white/60" : "text-ink-400"
                      )}
                    >
                      {c.count}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Desktop rail */}
      <aside className="hidden lg:block">
        <nav
          aria-label="Service categories"
          className="sticky top-28"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            Browse by
          </p>
          <ul className="mt-4 space-y-1">
            {categories.map((c) => {
              const isActive = c.id === active;
              return (
                <li key={c.id} className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="services-rail-marker"
                      aria-hidden
                      className="absolute inset-0 rounded-2xl bg-ink-950"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <a
                    href={`#${c.id}`}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => setActive(c.id)}
                    className={cn(
                      "relative z-10 flex items-start justify-between gap-3 rounded-2xl px-4 py-3 transition-colors focus-energy",
                      isActive ? "text-white" : "text-ink-700 hover:bg-ink-100/70"
                    )}
                  >
                    <span>
                      <span className="block font-display text-base font-semibold tracking-[-0.01em]">
                        {c.label}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-xs",
                          isActive ? "text-white/60" : "text-ink-500"
                        )}
                      >
                        {c.hint}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                        isActive ? "bg-white/15 text-white" : "bg-ink-100 text-ink-600"
                      )}
                    >
                      {c.count}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
