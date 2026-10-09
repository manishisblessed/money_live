import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * eMoney brand mark — compact gradient circular "e" with speed lines.
 * Used only for icon-only contexts (e.g. collapsed sidebar). Everywhere else
 * we render the full official logo artwork via <Logo />.
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
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#22c55e" />
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

/** Brand tagline shown beside the logo. Change here to update it everywhere. */
export const LOGO_TAGLINE = "Every Shop's Fintech OS";

const sizeMap = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12"
} as const;

/**
 * Full eMoney logo lockup — renders the official brand artwork
 * (`/emoney-logo.svg`: the gradient "e" + "eMoney" wordmark + rising arrow).
 *
 * - On light surfaces (navbar, auth, sidebar) the full-colour logo is used.
 * - On dark surfaces pass `variant="light"` to render a crisp white
 *   monochrome version of the same artwork.
 * - Pass `iconOnly` to render just the circular "e" mark (collapsed sidebar).
 * - Pass `tagline` to show the theme-gradient tagline beside the mark.
 * - Use `size` to scale the lockup ("sm" | "md" | "lg").
 */
export function Logo({
  className,
  variant = "dark",
  iconOnly = false,
  tagline = false,
  size = "md"
}: {
  className?: string;
  variant?: "dark" | "light";
  iconOnly?: boolean;
  tagline?: boolean;
  size?: keyof typeof sizeMap;
}) {
  if (iconOnly) {
    return (
      <Link
        href="/"
        className={cn("group relative inline-flex items-center", className)}
        aria-label="eMoney home"
      >
        <LogoMark size={34} />
        {/* Live brand-dot — subtle pulse that signals "the Emoney platform is
            on". The single detail users notice first versus the Nextgen logo. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5"
        >
          <span className="absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-70 animate-ping-soft" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand-500 to-coral-500 ring-2 ring-white" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={cn("group relative inline-flex items-center gap-3", className)}
      aria-label="eMoney home"
    >
      <span className="relative inline-flex">
        <Image
          src="/emoney-logo.svg"
          alt="eMoney"
          width={1694}
          height={699}
          priority
          unoptimized
          className={cn(
            "w-auto transition-transform duration-300 group-hover:scale-[1.03]",
            sizeMap[size],
            // Render the dark-text artwork as clean white on dark surfaces
            variant === "light" && "brightness-0 invert"
          )}
        />
        {/* Live brand-dot — tucked at the top-right of the wordmark. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-0.5 flex h-2.5 w-2.5"
        >
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping-soft",
              variant === "light" ? "bg-white" : "bg-coral-400"
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-brand-500 to-coral-500",
              variant === "light" ? "ring-2 ring-white/70" : "ring-2 ring-white"
            )}
          />
        </span>
      </span>

      {tagline && (
        <span
          className={cn(
            "hidden items-center self-stretch border-l pl-3 sm:inline-flex",
            variant === "light" ? "border-white/25" : "border-ink-200"
          )}
        >
          {/* The tagline carries the signature Emoney gradient-sweep (animated
              purple→blue→coral) that `globals.css .gradient-text` applies. */}
          <span className="gradient-text whitespace-nowrap text-[11px] font-bold uppercase leading-tight tracking-[0.14em]">
            {LOGO_TAGLINE}
          </span>
        </span>
      )}
    </Link>
  );
}
