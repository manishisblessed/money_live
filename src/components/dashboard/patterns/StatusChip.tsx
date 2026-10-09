import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/Badge";

type Variant = NonNullable<BadgeProps["variant"]>;

type Mapped = { variant: Variant; dot?: boolean; label?: string };

/**
 * Normalises any status-ish string ("PENDING_REVIEW", "under review",
 * "Success") to a lookup key.
 */
function normalize(s: string) {
  return s.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

const MAP: Record<string, Mapped> = {
  // success-ish
  SUCCESS: { variant: "success" },
  SUCCESSFUL: { variant: "success" },
  COMPLETED: { variant: "success" },
  COMPLETE: { variant: "success" },
  DONE: { variant: "success" },
  APPROVED: { variant: "success" },
  ACCEPTED: { variant: "success" },
  VERIFIED: { variant: "success" },
  ACTIVE: { variant: "success" },
  ENABLED: { variant: "success" },
  ON: { variant: "success" },
  PAID: { variant: "success" },
  SETTLED: { variant: "success" },
  CREDITED: { variant: "success" },
  RESOLVED: { variant: "success" },
  REFUNDED: { variant: "success" },
  REVERSED: { variant: "success" },
  LIVE: { variant: "success", dot: true },
  UP: { variant: "success", dot: true },
  HEALTHY: { variant: "success", dot: true },
  ONLINE: { variant: "success", dot: true },
  OK: { variant: "success", dot: true },
  OPERATIONAL: { variant: "success", dot: true },
  // in-progress / pending
  PENDING: { variant: "warning", dot: true },
  PENDING_REVIEW: { variant: "warning", dot: true, label: "Under review" },
  PENDING_KYC: { variant: "warning", dot: true, label: "Pending KYC" },
  PENDING_APPROVAL: { variant: "warning", dot: true, label: "Pending approval" },
  UNDER_REVIEW: { variant: "warning", dot: true, label: "Under review" },
  IN_REVIEW: { variant: "warning", dot: true, label: "In review" },
  IN_PROGRESS: { variant: "warning", dot: true, label: "In progress" },
  PROCESSING: { variant: "warning", dot: true },
  INITIATED: { variant: "warning", dot: true },
  QUEUED: { variant: "warning", dot: true },
  SUBMITTED: { variant: "warning", dot: true },
  REQUESTED: { variant: "warning", dot: true },
  HOLD: { variant: "warning" },
  ON_HOLD: { variant: "warning", label: "On hold" },
  HELD: { variant: "warning" },
  RELEASED: { variant: "warning" },
  SCHEDULED: { variant: "warning" },
  RETRYING: { variant: "warning", dot: true },
  AWAITING: { variant: "warning", dot: true },
  AWAITING_USER: { variant: "accent", dot: true, label: "Needs your reply" },
  DEGRADED: { variant: "warning", dot: true },
  PARTIAL: { variant: "warning" },
  EXPIRED: { variant: "warning" },
  NOT_STARTED: { variant: "default", label: "Not started" },
  DRAFT: { variant: "default" },
  INACTIVE: { variant: "default" },
  DISABLED: { variant: "default" },
  OFF: { variant: "default" },
  ARCHIVED: { variant: "default" },
  ENDED: { variant: "default" },
  PAUSED: { variant: "default" },
  CLOSED: { variant: "default" },
  CANCELLED: { variant: "default" },
  CANCELED: { variant: "default", label: "Cancelled" },
  UNKNOWN: { variant: "default" },
  // failure
  FAILED: { variant: "danger" },
  FAILURE: { variant: "danger" },
  ERROR: { variant: "danger" },
  REJECTED: { variant: "danger" },
  DECLINED: { variant: "danger" },
  DENIED: { variant: "danger" },
  SUSPENDED: { variant: "danger" },
  REVOKED: { variant: "danger" },
  BLOCKED: { variant: "danger" },
  BANNED: { variant: "danger" },
  LOCKED: { variant: "danger" },
  DOWN: { variant: "danger", dot: true },
  OFFLINE: { variant: "danger" },
  OVERDUE: { variant: "danger" },
  FLAGGED: { variant: "coral" },
  // misc
  OPEN: { variant: "brand", dot: true },
  NEW: { variant: "brand" },
  CREDIT: { variant: "success" },
  DEBIT: { variant: "danger" },
  INSTANT: { variant: "brand" },
  T1: { variant: "default", label: "T+1" },
  "T+1": { variant: "default", label: "T+1" },
  "T+0": { variant: "brand", label: "T+0" },
  INFO: { variant: "brand" },
  WARNING: { variant: "warning" },
  CRITICAL: { variant: "danger", dot: true },
  HIGH: { variant: "coral" },
  URGENT: { variant: "coral", dot: true },
  MEDIUM: { variant: "warning" },
  NORMAL: { variant: "default" },
  LOW: { variant: "default" },
};

function prettify(s: string) {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function statusToVariant(status: string | null | undefined): Variant {
  if (!status) return "default";
  return MAP[normalize(status)]?.variant ?? "default";
}

/**
 * Emoney StatusChip — maps common status strings to Badge variants, with a
 * soft ping dot for in-progress states. Pass `label` to override the
 * display text while keeping the status-driven colour, or `variant`/`dot`
 * to force a specific look.
 */
export function StatusChip({
  status,
  label,
  variant,
  dot,
  size = "md",
  className,
  ...rest
}: Omit<BadgeProps, "variant" | "children"> & {
  status: string | null | undefined;
  label?: React.ReactNode;
  variant?: Variant;
}) {
  const key = status ? normalize(status) : "";
  const m = MAP[key];
  const v = variant ?? m?.variant ?? "default";
  const showDot = dot ?? m?.dot ?? false;
  const text = label ?? (m?.label ?? (status ? prettify(status) : "—"));
  return (
    <Badge variant={v} dot={showDot} size={size} className={className} {...rest}>
      {text}
    </Badge>
  );
}
