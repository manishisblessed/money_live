import type { Metadata } from "next";
import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  Lightning,
  Storefront,
  WifiHigh
} from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Button } from "@/components/ui/Button";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { company, heroStats } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Why eMoney",
  description:
    "eMoney turns Indian kirana and retail shops into bank counters. Here is why we exist, the numbers that matter and what we stand for."
};

const milestones = [
  {
    when: "Jan 2026",
    title: "The idea",
    text: "Two hundred shop visits across NCR. Same answer everywhere: the nearest bank is far, the customer is right here."
  },
  {
    when: "Mar 2026",
    title: "First 1,000 shops",
    text: "AePS and money transfer go live for pilot retailers in Delhi NCR, Jaipur and Chandigarh."
  },
  {
    when: "Jun 2026",
    title: "NPCI rails live",
    text: "UPI, BBPS and AePS certified directly on NPCI. Bills and recharges join the counter."
  },
  {
    when: "Oct 2026",
    title: "72K shops",
    text: "Payment gateway, POS and QR roll out. The distributor programme opens across 28 states."
  }
];

const values: {
  icon: PhosphorIcon;
  tone: IconTone;
  title: string;
  text: string;
}[] = [
  {
    icon: Storefront,
    tone: "brand",
    title: "Retailer first",
    text: "Every screen is designed on a real shop counter, for one person, with a queue waiting."
  },
  {
    icon: Eye,
    tone: "accent",
    title: "Every rupee visible",
    text: "You see the fee and your commission before you press confirm. No PDFs, no surprises."
  },
  {
    icon: Lightning,
    tone: "coral",
    title: "Fast beats fancy",
    text: "Thirty seconds per transaction is the bar. If a feature slows you down, it does not ship."
  },
  {
    icon: WifiHigh,
    tone: "royal",
    title: "Built for weak networks",
    text: "Works on a 2G signal during a power cut. Offline queueing and smart retries are standard."
  }
];

const team = ["AS", "AI", "RM", "PN", "VB", "SK"];

export default function AboutPage() {
  return (
    <>
      <PageHero
        variant="dark"
        eyebrow="Why eMoney"
        breadcrumbs={[{ label: "Why eMoney", href: "/about" }]}
        title={
          <>
            Your shop already has the trust.
            <br className="hidden md:block" /> We bring the bank.
          </>
        }
        description="eMoney is a fintech distribution platform from Gurugram. We give kirana and retail shops the rails of a bank branch: cash withdrawal, money transfer, bills, recharges, payments and travel, all from one counter."
        actions={
          <>
            <Link href="/register" className="rounded-2xl focus-energy">
              <Button size="lg" tabIndex={-1}>
                Start earning
                <ArrowRight size={16} weight="bold" aria-hidden />
              </Button>
            </Link>
            <Link href="/contact" className="rounded-2xl focus-energy">
              <Button
                size="lg"
                variant="outline"
                tabIndex={-1}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Talk to us
              </Button>
            </Link>
          </>
        }
      >
        <div className="relative">
          <div className="grain relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Founders&rsquo; note · day one
            </p>
            <blockquote className="mt-4 font-display text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-white md:text-3xl">
              &ldquo;If a shopkeeper can&rsquo;t finish a transaction in thirty
              seconds, on a weak signal, in their own language, we have
              failed.&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2">
                {team.slice(0, 3).map((m, i) => (
                  <span
                    key={m}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full font-display text-[10px] font-semibold text-white ring-2 ring-ink-950",
                      ["bg-brand-600", "bg-royal-600", "bg-coral-500"][i]
                    )}
                  >
                    {m}
                  </span>
                ))}
              </div>
              <span className="text-xs text-white/55">
                Written in Gurugram, {company.incorporated}
              </span>
            </div>
          </div>
        </div>
      </PageHero>

      {/* Why we exist — manifesto */}
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-royal-700">
                  <span className="brand-dot" aria-hidden /> Why we exist
                </span>
                <p className="mt-6 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] text-ink-950 md:text-6xl">
                  The bank is{" "}
                  <span className="gradient-text">15 km</span> away. Your
                  dukaan is 50 metres away.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Stagger className="space-y-6 text-lg leading-relaxed text-ink-600 md:text-xl">
                <StaggerItem>
                  <p>
                    For 400 million Indians, the nearest branch means a bus
                    ride, a lost half-day and a queue. The shop at the corner
                    is open 14 hours a day and already knows every customer by
                    name.
                  </p>
                </StaggerItem>
                <StaggerItem>
                  <p>
                    We built eMoney so that shop can do what the branch does:
                    hand over cash on a fingerprint, send money home, pay a
                    bill, book a ticket. You earn a commission on each one.
                  </p>
                </StaggerItem>
                <StaggerItem>
                  <p className="font-medium text-ink-900">
                    No joining fee. No hidden charges. Settlement in your bank
                    the same day. That is the whole pitch.
                  </p>
                </StaggerItem>
              </Stagger>
            </div>
          </div>
        </Container>
      </Section>

      {/* Numbers that matter — bento */}
      <Section className="grain relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-brand-600/20 blur-3xl"
        />
        <Container className="relative z-10">
          <SectionIntro
            dark
            eyebrow="Numbers that matter"
            title="Small shops. Serious volume."
            description="Updated every quarter, audited every year."
          />
          <Stagger className="grid gap-4 md:grid-cols-4 md:grid-rows-2">
            {heroStats.map((s, i) => {
              const big = i === 0;
              return (
                <StaggerItem
                  key={s.label}
                  className={cn(
                    "relative overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8",
                    big
                      ? "bg-energy-gradient md:col-span-2 md:row-span-2"
                      : "bg-white/[0.04]"
                  )}
                >
                  {big && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl"
                    />
                  )}
                  <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                    <span
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-[0.18em]",
                        big ? "text-white/75" : "text-white/45"
                      )}
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <p
                        className={cn(
                          "font-display font-semibold leading-none tracking-[-0.03em]",
                          big
                            ? "text-6xl md:text-[7rem]"
                            : "text-4xl md:text-5xl"
                        )}
                      >
                        {s.value}
                      </p>
                      <p
                        className={cn(
                          "mt-3 text-sm",
                          big ? "text-white/85 md:text-base" : "text-white/55"
                        )}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Container>
      </Section>

      {/* Our journey — horizontal timeline */}
      <Section className="bg-white">
        <Container>
          <SectionIntro
            eyebrow="Our journey"
            title="One year. Four turning points."
            description="From a notebook full of shop visits to a network across 28 states."
          />
          <div className="relative">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-[11px] hidden h-px bg-gradient-to-r from-royal-500 via-brand-500 to-coral-500 md:block"
            />
            <div
              aria-hidden
              className="absolute bottom-0 left-[11px] top-0 w-px bg-gradient-to-b from-royal-500 via-brand-500 to-coral-500 md:hidden"
            />
            <Stagger className="grid gap-10 md:grid-cols-4 md:gap-6">
              {milestones.map((m, i) => (
                <StaggerItem key={m.when} className="relative pl-10 md:pl-0">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full bg-white ring-1 ring-ink-200 md:relative"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-energy-gradient" />
                  </span>
                  <p className="mt-0 text-xs font-semibold uppercase tracking-[0.18em] text-royal-700 md:mt-6">
                    {m.when}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950">
                    {m.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    {m.text}
                  </p>
                  <span className="mt-4 block font-display text-5xl font-semibold leading-none text-ink-100">
                    0{i + 1}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      {/* What we stand for */}
      <Section className="bg-ink-50/60">
        <Container>
          <SectionIntro
            eyebrow="What we stand for"
            title="Four rules we don't bend."
          />
          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <StaggerItem
                key={v.title}
                className="gradient-ring group rounded-3xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-energy-sm"
              >
                {/* Icon passed as children: server → client boundary can't serialize component refs. */}
                <IconTile tone={v.tone} size="lg">
                  <v.icon size={24} weight="duotone" aria-hidden />
                </IconTile>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {v.text}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* Meet the team CTA */}
      <Section className="bg-white">
        <Container>
          <Reveal>
            <Link
              href="/team"
              className="group grain relative flex flex-col gap-8 overflow-hidden rounded-4xl bg-ink-950 p-8 text-white transition hover:shadow-energy md:flex-row md:items-center md:justify-between md:p-12 focus-energy"
            >
              <div
                aria-hidden
                className="aurora-glow pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full"
              />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  <span className="brand-dot" aria-hidden /> The people
                </span>
                <p className="mt-3 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-5xl">
                  Meet the team behind your counter.
                </p>
                <p className="mt-3 max-w-xl text-sm text-white/60 md:text-base">
                  Payments, field sales, compliance and design. Most of us
                  have stood behind a shop counter ourselves.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {team.map((m, i) => (
                    <span
                      key={m}
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-2xl font-display text-xs font-semibold text-white ring-2 ring-ink-950 transition group-hover:-translate-y-1",
                        [
                          "bg-brand-600",
                          "bg-royal-600",
                          "bg-coral-500",
                          "bg-accent-600",
                          "bg-amber-500",
                          "bg-ink-700"
                        ][i]
                      )}
                      style={{ transitionDelay: `${i * 40}ms` }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-ink-950 transition group-hover:bg-accent-400">
                  <ArrowUpRight size={18} weight="bold" aria-hidden />
                </span>
              </div>
            </Link>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
