"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * QuickActions — a horizontal dock of IconTile shortcuts. Each overview passes
 * the 4–8 actions that matter for its role. Scrolls horizontally on small
 * screens, spreads out as a grid on desktop.
 */
export type QuickAction = {
  label: string;
  href: string;
  icon: PhosphorIcon;
  tone?: IconTone;
  /** Tiny supporting text under the label. */
  hint?: string;
};

export function QuickActions({
  actions,
  title = "Quick actions",
  className,
}: {
  actions: QuickAction[];
  title?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (actions.length === 0) return null;

  return (
    <nav aria-label={title} className={cn("min-w-0", className)}>
      <ul className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-6 xl:grid-cols-8">
        {actions.slice(0, 8).map((a, i) => (
          <motion.li
            key={a.href + a.label}
            className="shrink-0 md:shrink"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.4,
              delay: reduce ? 0 : 0.08 + i * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href={a.href}
              className="group flex w-[7.5rem] flex-col items-center gap-2.5 rounded-3xl border border-ink-100 bg-white px-3 py-4 text-center shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out focus-energy hover:-translate-y-1 hover:border-brand-200 hover:shadow-energy-sm md:w-auto"
            >
              <IconTile
                icon={a.icon}
                tone={a.tone ?? "brand"}
                size="lg"
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-ink-900">
                  {a.label}
                </span>
                {a.hint && (
                  <span className="mt-0.5 block truncate text-[11px] text-ink-500">{a.hint}</span>
                )}
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
