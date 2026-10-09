import Link from "next/link";
import { ArrowLeft, Lifebuoy, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/layout/Logo";
import { heroStats, company } from "@/lib/data";
import { RotatingQuote } from "@/components/auth/RotatingQuote";

const COMPLIANCE_CHIPS = [
  "RBI-authorised partners",
  "NPCI certified",
  "PCI-DSS v4.0",
  "ISO 27001:2022",
];

/**
 * Auth shell — split screen. Left: dark "Bharat Energy" brand panel (desktop
 * only; collapses to a compact strip on mobile). Right: light canvas with a
 * slim top bar and the centered form area. Server component; the only client
 * piece is the rotating retailer quote.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const stats = heroStats.slice(0, 3);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#f6f7fb] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      {/* ── Brand panel (≥ lg) ─────────────────────────────────────── */}
      <aside className="grain relative hidden overflow-hidden bg-ink-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="grid-bg absolute inset-0 opacity-40 invert [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_75%)]" />
          <div className="aurora-glow absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full" />
          <div className="aurora-glow absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full opacity-30 [animation-direction:reverse]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink-950 to-transparent" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center justify-between gap-4">
            <Logo variant="light" size="md" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-inset ring-white/10">
              <span className="brand-dot" aria-hidden />
              Namaste
            </span>
          </div>

          <div className="py-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              Built for Bharat&apos;s retailers
            </p>
            <p className="mt-4 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.02em] xl:text-[3.5rem]">
              Your dukaan.
              <br />
              <span className="gradient-text">Your bank.</span>
              <br />
              Your rules.
            </p>
            <RotatingQuote className="mt-10 max-w-md" />
          </div>

          <div>
            <dl className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                    {s.label}
                  </dt>
                  <dd className="font-display text-3xl font-semibold tracking-[-0.02em] text-white">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Compliance">
              {COMPLIANCE_CHIPS.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/70 ring-1 ring-inset ring-white/10"
                >
                  <ShieldCheck size={13} weight="duotone" className="text-accent-400" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* ── Form canvas ─────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-col">
        {/* Compact brand strip (< lg) */}
        <div className="grain relative overflow-hidden bg-ink-950 text-white lg:hidden">
          <div aria-hidden className="aurora-glow pointer-events-none absolute -right-20 -top-28 h-60 w-60 rounded-full opacity-40" />
          <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <Logo variant="light" size="sm" />
            <p className="hidden font-display text-sm font-semibold tracking-[-0.01em] text-white/80 sm:block">
              Your dukaan. <span className="gradient-text">Your bank.</span> Your rules.
            </p>
          </div>
        </div>

        <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="focus-energy group inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-white hover:text-ink-900 hover:shadow-soft"
          >
            <ArrowLeft
              size={16}
              weight="bold"
              className="transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Back to home
          </Link>
          <Link
            href="/contact"
            className="focus-energy inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold text-ink-500 transition hover:bg-white hover:text-ink-900"
          >
            <Lifebuoy size={15} weight="duotone" aria-hidden />
            Need help?
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>

        <footer className="px-4 py-5 text-center text-xs text-ink-400 sm:px-6 lg:px-10">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>
              © {year} {company.brand} · {company.jurisdiction}
            </span>
            <span aria-hidden>·</span>
            <Link href="/legal/privacy" className="hover:text-ink-700">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/legal/terms" className="hover:text-ink-700">
              Terms
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
