import { ArrowRight, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion";
import { trustBadges } from "@/lib/data";
import { ButtonLink } from "./_shared/ButtonLink";

/** Server component — dark full-bleed closer with an energy orb. */
export function FinalCTA() {
  return (
    <section
      className="grain relative overflow-hidden bg-ink-950 py-24 text-white md:py-32"
      aria-labelledby="final-heading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-energy-gradient opacity-40 blur-3xl md:h-[720px] md:w-[720px]" />
        <div className="grid-bg mask-fade-y absolute inset-0 opacity-[0.07] invert" />
      </div>

      <div className="container-x relative z-10 text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
            <span className="brand-dot" aria-hidden />
            Free to join · Earn from day one
          </span>
          <h2
            id="final-heading"
            className="mx-auto mt-7 max-w-4xl font-display text-4xl font-bold leading-[0.98] tracking-[-0.02em] md:text-6xl lg:text-7xl"
          >
            Start earning from your counter today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base text-white/65 md:text-lg">
            Five minutes to sign up. One thumb to serve your first customer. Namaste to a
            second income.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/register" size="xl">
              Start earning today
              <ArrowRight size={18} weight="bold" aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="outline"
              size="xl"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              Talk to our team
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <ul
            aria-label="Compliance"
            className="mt-12 flex flex-wrap items-center justify-center gap-2"
          >
            {trustBadges.map((b) => (
              <li
                key={b.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/70"
              >
                <ShieldCheck size={14} weight="duotone" className="text-accent-400" aria-hidden />
                {b.label}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
