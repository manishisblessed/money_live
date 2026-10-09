import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: "left" | "center";
  /** Flip colours for dark (`bg-ink-950`) sections. */
  dark?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3";
};

/**
 * Editorial section header — eyebrow pill with the brand dot, Clash Display
 * title, Satoshi sub-copy. Server-safe (no hooks, no icons).
 */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  dark = false,
  className,
  as: Tag = "h2"
}: Props) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
            dark
              ? "border-white/10 bg-white/5 text-white/70"
              : "border-ink-200/80 bg-white text-ink-600"
          )}
        >
          <span className="brand-dot" aria-hidden />
          {eyebrow}
        </span>
      )}
      <Tag
        className={cn(
          "font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-4xl lg:text-5xl",
          eyebrow && "mt-5",
          dark ? "text-white" : "text-ink-950"
        )}
      >
        {title}
      </Tag>
      {sub && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed md:text-lg",
            dark ? "text-white/65" : "text-ink-600"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
