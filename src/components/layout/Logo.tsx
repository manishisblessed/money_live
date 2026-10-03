import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * eMoney brand mark — compact gradient circular "e" with speed lines.
 * Uses `currentColor` where possible so dark/light variants work out of the box.
 */
export function LogoMark({
  className,
  size = 32
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className={cn(
        "shrink-0 transition-transform group-hover:scale-105",
        className
      )}
      role="img"
      aria-label="eMoney logo"
    >
      <defs>
        <linearGradient
          id="emoney-mark-grad-cmp"
          x1="4"
          y1="4"
          x2="44"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E88E5" />
          <stop offset="55%" stopColor="#1DA7B0" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#emoney-mark-grad-cmp)" />
      <path
        d="M34 29c-2 3.2-5.6 5.3-9.7 5.3-6.3 0-11.3-5-11.3-11.3s5-11.3 11.3-11.3c6.2 0 11.2 4.9 11.3 11 0 .7-.6 1.3-1.3 1.3H17.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full eMoney logo lockup — the gradient mark + "eMoney" wordmark.
 * When used in a dark footer, pass variant="light" so the wordmark goes white.
 * Pass `useImage` to render the full PNG artwork instead of the SVG lockup
 * (handy for landing pages that want the official bitmap artwork).
 */
export function Logo({
  className,
  variant = "dark",
  iconOnly = false,
  useImage = false
}: {
  className?: string;
  variant?: "dark" | "light";
  iconOnly?: boolean;
  useImage?: boolean;
}) {
  if (useImage && !iconOnly) {
    return (
      <Link
        href="/"
        className={cn("group inline-flex items-center", className)}
        aria-label="eMoney home"
      >
        <Image
          src="/eMoney_logo.png"
          alt="eMoney"
          width={160}
          height={44}
          priority
          className="h-9 w-auto"
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="eMoney home"
    >
      <LogoMark size={iconOnly ? 32 : 36} />
      {!iconOnly && (
        <span
          className={cn(
            "font-display text-[22px] font-extrabold tracking-tight leading-none",
            variant === "light" ? "text-white" : "text-ink-900"
          )}
        >
          eMoney
        </span>
      )}
    </Link>
  );
}
