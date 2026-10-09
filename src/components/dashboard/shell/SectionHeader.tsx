"use client";

import * as React from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * Section heading used across overview screens: optional IconTile, a Clash
 * Display title, a one-line description and a right-aligned action slot.
 */
export function SectionHeader({
  title,
  description,
  icon,
  tone = "brand",
  actions,
  className,
  size = "md",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: PhosphorIcon;
  tone?: IconTone;
  actions?: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && <IconTile icon={icon} tone={tone} size={size === "sm" ? "sm" : "md"} />}
        <div className="min-w-0">
          <h2
            className={cn(
              "font-display font-semibold tracking-[-0.02em] text-ink-900",
              size === "sm" ? "text-base" : "text-lg md:text-xl"
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 max-w-2xl text-sm text-ink-500">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
