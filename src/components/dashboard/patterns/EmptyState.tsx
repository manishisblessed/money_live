"use client";

import * as React from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Tray } from "@phosphor-icons/react";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * Emoney EmptyState — friendly, retailer-first empty / zero-data block.
 * Drop it inside a SectionCard body or render standalone (`bordered`).
 */
export function EmptyState({
  icon = Tray,
  tone = "brand",
  title,
  description,
  action,
  compact = false,
  bordered = false,
  className,
}: {
  icon?: PhosphorIcon;
  tone?: IconTone;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  /** Renders its own dashed rounded-3xl surface. */
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        bordered && "rounded-3xl border border-dashed border-ink-200 bg-white",
        className
      )}
    >
      <IconTile icon={icon} tone={tone} size={compact ? "md" : "xl"} />
      <p
        className={cn(
          "mt-4 font-display font-semibold tracking-[-0.01em] text-ink-900",
          compact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
