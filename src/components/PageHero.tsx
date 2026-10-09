import Link from "next/link";
import * as React from "react";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

export type PageHeroBreadcrumb = { label: string; href: string };
export type PageHeroStat = { value: string; label: string };

export interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: PageHeroBreadcrumb[];
  /** `dark` = ink-950 + grain + aurora; `light` = white with a soft radial wash. */
  variant?: "dark" | "light";
  stats?: PageHeroStat[];
  /** Buttons / chips rendered under the description. */
  actions?: React.ReactNode;
  /** Optional right-hand panel (illustration, mock UI, meta card). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * PageHero — shared hero for every secondary marketing page.
 *
 * Carries its own top padding (`pt-28 md:pt-36`) because the site navbar is a
 * fixed floating island. Any page that does NOT use PageHero must add the same
 * padding to its first section.
 *
 * Emits `data-nav-theme` so the navbar can switch to light text while it sits
 * transparently over a dark hero.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  variant = "light",
  stats,
  actions,
  children,
  className
}: PageHeroProps) {
  const dark = variant === "dark";

  return (
    <section
      data-nav-theme={variant}
      className={cn(
        "relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-36",
        dark ? "grain bg-ink-950 text-white" : "bg-white text-ink-900",
        className
      )}
    >
      {/* Backdrop */}
      {dark ? (
        <>
          <div
            aria-hidden
            className="aurora-glow pointer-events-none absolute -left-40 -top-56 h-[640px] w-[640px] rounded-full"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-72 -right-40 h-[560px] w-[560px] rounded-full bg-royal-600/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] mask-fade-y"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "56px 56px"
            }}
          />
        </>
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-hero-radial"
          />
          <div
            aria-hidden
            className="grid-bg pointer-events-none absolute inset-0 opacity-50 mask-fade-y"
          />
        </>
      )}

      <Container className="relative z-10">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol
              className={cn(
                "flex flex-wrap items-center gap-1.5 text-xs font-medium",
                dark ? "text-white/60" : "text-ink-500"
              )}
            >
              <li>
                <Link
                  href="/"
                  className={cn(
                    "rounded-md px-1 py-0.5 transition focus-energy",
                    dark ? "hover:text-white" : "hover:text-ink-900"
                  )}
                >
                  Home
                </Link>
              </li>
              {breadcrumbs.map((b, i) => {
                const last = i === breadcrumbs.length - 1;
                return (
                  <li key={b.href} className="flex items-center gap-1.5">
                    <CaretRight size={12} weight="bold" aria-hidden />
                    {last ? (
                      <span
                        aria-current="page"
                        className={dark ? "text-white" : "text-ink-900"}
                      >
                        {b.label}
                      </span>
                    ) : (
                      <Link
                        href={b.href}
                        className={cn(
                          "rounded-md px-1 py-0.5 transition focus-energy",
                          dark ? "hover:text-white" : "hover:text-ink-900"
                        )}
                      >
                        {b.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        <div
          className={cn(
            "grid gap-10 lg:gap-16",
            children ? "lg:grid-cols-12 lg:items-end" : ""
          )}
        >
          <div className={cn(children ? "lg:col-span-7" : "max-w-4xl")}>
            {eyebrow && (
              <Reveal distance={12} duration={0.5}>
                <span
                  className={cn(
                    "inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em]",
                    dark ? "text-white/70" : "text-royal-700"
                  )}
                >
                  <span className="brand-dot" aria-hidden />
                  {eyebrow}
                </span>
              </Reveal>
            )}

            <Reveal delay={0.05}>
              <h1
                className={cn(
                  "mt-5 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-5xl lg:text-6xl",
                  dark ? "text-white" : "text-ink-950"
                )}
              >
                {title}
              </h1>
            </Reveal>

            {description && (
              <Reveal delay={0.12}>
                <p
                  className={cn(
                    "mt-6 max-w-2xl text-base leading-relaxed md:text-lg",
                    dark ? "text-white/70" : "text-ink-600"
                  )}
                >
                  {description}
                </p>
              </Reveal>
            )}

            {actions && (
              <Reveal delay={0.18}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {actions}
                </div>
              </Reveal>
            )}
          </div>

          {children && (
            <Reveal
              delay={0.15}
              direction="left"
              className="lg:col-span-5"
            >
              {children}
            </Reveal>
          )}
        </div>

        {stats && stats.length > 0 && (
          <Reveal delay={0.22} className="mt-14 md:mt-16">
            <dl
              className={cn(
                "grid grid-cols-2 overflow-hidden rounded-3xl border md:grid-cols-4",
                dark
                  ? "border-white/10 bg-white/[0.04]"
                  : "border-ink-100 bg-white/70 shadow-soft backdrop-blur"
              )}
            >
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    "px-5 py-5 md:px-7 md:py-6",
                    i % 2 === 1 && (dark ? "border-l border-white/10" : "border-l border-ink-100"),
                    i >= 2 && (dark ? "border-t border-white/10 md:border-t-0" : "border-t border-ink-100 md:border-t-0"),
                    i >= 2 && (dark ? "md:border-l md:border-white/10" : "md:border-l md:border-ink-100")
                  )}
                >
                  <dd
                    className={cn(
                      "font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl",
                      dark ? "text-white" : "text-ink-950"
                    )}
                  >
                    {s.value}
                  </dd>
                  <dt
                    className={cn(
                      "mt-1 text-xs font-medium uppercase tracking-wider",
                      dark ? "text-white/50" : "text-ink-500"
                    )}
                  >
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
