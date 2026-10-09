"use client";

import * as React from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/**
 * Friendly empty state: tinted IconTile, short title, one supportive line and
 * an optional CTA. Keep copy retailer-first and direct.
 */
export function EmptyState({
  icon,
  tone = "brand",
  title,
  body,
  action,
  className,
  compact = false,
}: {
  icon: PhosphorIcon;
  tone?: IconTone;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-12",
        className
      )}
    >
      <IconTile icon={icon} tone={tone} size={compact ? "md" : "lg"} />
      <p className="mt-4 font-display text-base font-semibold tracking-[-0.02em] text-ink-900">
        {title}
      </p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
