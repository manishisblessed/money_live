"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WarningCircle, Clock, CheckCircle, Info, Eye, EyeSlash } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────
   Shared presentation primitives for every auth screen.
   No auth logic lives here — only JSX structure and classNames.
   ────────────────────────────────────────────────────────────────────── */

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `md` (default) = 28rem form card. `lg` = 42rem for document-heavy flows. */
  size?: "md" | "lg";
}

export const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(
  ({ className, size = "md", children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full rounded-4xl bg-white p-6 shadow-soft ring-1 ring-ink-100 md:p-8",
        size === "md" ? "max-w-md" : "max-w-2xl",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
);
AuthCard.displayName = "AuthCard";

/* ── Header ──────────────────────────────────────────────────────────── */

export interface AuthCardHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Usually an `<IconTile />`. */
  icon?: React.ReactNode;
  /** Right-aligned chip (e.g. `<Badge variant="royal">Staff access</Badge>`). */
  badge?: React.ReactNode;
  /** `staff` renders a dark-tinted strip bleeding to the card edges. */
  tone?: "retailer" | "staff";
  /** Heading level — pages use h1, embedded steps use h2. */
  as?: "h1" | "h2";
  align?: "left" | "center";
  className?: string;
}

export function AuthCardHeader({
  eyebrow,
  title,
  description,
  icon,
  badge,
  tone = "retailer",
  as: Heading = "h1",
  align = "left",
  className,
}: AuthCardHeaderProps) {
  if (tone === "staff") {
    return (
      <div className={className}>
        <div className="grain relative -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-4xl bg-ink-950 px-6 py-5 text-white md:-mx-8 md:-mt-8 md:px-8">
          <div
            aria-hidden
            className="aurora-glow pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full opacity-30"
          />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {icon}
              <div className="min-w-0">
                {eyebrow && (
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
                    <span className="brand-dot" aria-hidden />
                    {eyebrow}
                  </p>
                )}
                <Heading className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl">
                  {title}
                </Heading>
              </div>
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        </div>
        {description && (
          <p className="text-sm leading-relaxed text-ink-500">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-4",
        align === "center" ? "flex-col items-center text-center" : "items-start",
        className
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        {(eyebrow || badge) && (
          <div
            className={cn(
              "flex items-center gap-3",
              align === "center" ? "justify-center" : "justify-between"
            )}
          >
            {eyebrow && (
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
                <span className="brand-dot" aria-hidden />
                {eyebrow}
              </p>
            )}
            {badge}
          </div>
        )}
        <Heading className="mt-2 font-display text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900 md:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ── Inline alert (live region) ──────────────────────────────────────── */

type AlertTone = "error" | "warning" | "success" | "info";

const alertStyles: Record<AlertTone, { box: string; icon: React.ElementType }> = {
  error: {
    box: "bg-coral-50 text-coral-700 ring-coral-200",
    icon: WarningCircle,
  },
  warning: {
    box: "bg-amber-50 text-amber-800 ring-amber-200",
    icon: Clock,
  },
  success: {
    box: "bg-accent-50 text-accent-700 ring-accent-200",
    icon: CheckCircle,
  },
  info: {
    box: "bg-brand-50 text-brand-700 ring-brand-200",
    icon: Info,
  },
};

export interface AuthAlertProps {
  /** Falsy hides the banner but keeps the live region mounted. */
  message?: React.ReactNode;
  tone?: AlertTone;
  /** Optional right-aligned slot (e.g. attempts-left, retry button). */
  aside?: React.ReactNode;
  className?: string;
}

/**
 * Error / status banner. The wrapper is always rendered with
 * `aria-live="polite"` so screen readers announce changes.
 */
export function AuthAlert({ message, tone = "error", aside, className }: AuthAlertProps) {
  const reduce = useReducedMotion();
  const { box, icon: Icon } = alertStyles[tone];
  return (
    <div aria-live="polite" role="status" className={cn("empty:hidden", className)}>
      <AnimatePresence initial={false}>
        {message ? (
          <motion.div
            key="alert"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-sm ring-1 ring-inset",
              box
            )}
          >
            <Icon size={18} weight="duotone" className="mt-px shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">{message}</div>
            {aside && <div className="shrink-0 text-xs font-semibold">{aside}</div>}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ── Cooldown helper (pure formatting) ───────────────────────────────── */

export function formatCooldown(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/* ── Password visibility toggle (sits inside a FloatingInput wrapper) ── */

export function PasswordToggle({
  shown,
  onToggle,
  className,
}: {
  shown: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className={cn(
        "focus-energy absolute right-3 top-7 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-ink-400 transition hover:bg-ink-50 hover:text-ink-900",
        className
      )}
    >
      {shown ? (
        <EyeSlash size={18} weight="duotone" aria-hidden />
      ) : (
        <Eye size={18} weight="duotone" aria-hidden />
      )}
    </button>
  );
}

/* ── Subtle "secondary links" row ────────────────────────────────────── */

export function AuthLinksRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-ink-500",
        className
      )}
    >
      {children}
    </div>
  );
}
