import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  Envelope,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
  SealCheck,
  XLogo,
  YoutubeLogo
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import {
  footerLinks,
  footerCertifications,
  company,
  grievanceOfficer,
  nodalOfficer
} from "@/lib/data";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "Services", links: footerLinks.services },
  { title: "Company", links: footerLinks.company },
  { title: "Resources", links: footerLinks.resources },
  { title: "Legal", links: footerLinks.legal }
];

const socials: { label: string; href: string; icon: PhosphorIcon }[] = [
  { label: "X (Twitter)", href: "#", icon: XLogo },
  { label: "LinkedIn", href: "#", icon: LinkedinLogo },
  { label: "Instagram", href: "#", icon: InstagramLogo },
  { label: "YouTube", href: "#", icon: YoutubeLogo },
  { label: "Facebook", href: "#", icon: FacebookLogo }
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden bg-ink-950 text-ink-300">
      {/* Giant outlined wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none overflow-hidden"
      >
        <span className="block translate-y-[18%] text-center font-display text-[22vw] font-bold leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.08)]">
          eMoney
        </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 z-0 h-[420px] w-[420px] rounded-full bg-royal-600/20 blur-3xl"
      />

      {/* 1 · CTA strip */}
      <div className="relative z-10 border-b border-white/10">
        <Container className="flex flex-col gap-6 py-12 md:flex-row md:items-center md:justify-between md:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              <span className="brand-dot" aria-hidden /> Free to join
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-5xl">
              Your counter is ready. Start earning from it today.
            </h2>
            <p className="mt-3 text-sm text-white/55 md:text-base">
              PAN, Aadhaar, shop details. KYC done in under five minutes.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
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
          </div>
        </Container>
      </div>

      {/* 3 · Brand + link columns */}
      <Container className="relative z-10 pt-14 md:pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo variant="light" size="md" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              eMoney turns any shop into a bank counter. Cash withdrawal, money
              transfer, bills, recharges and travel — your customers get it
              here, you earn on every one.
            </p>
            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                The monthly retailer briefing
              </p>
              <NewsletterForm className="mt-3 max-w-md" />
              <p className="mt-2 text-[11px] text-white/35">
                One message a month. Unsubscribe anytime.{" "}
                <Link
                  href="/legal/privacy"
                  className="underline-offset-2 hover:text-white/70 hover:underline"
                >
                  Privacy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8 lg:pl-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-sm font-semibold tracking-[-0.01em] text-white">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.label}`}>
                      <Link
                        href={l.href}
                        className="group inline-flex items-center gap-1 text-white/55 transition hover:text-white"
                      >
                        {l.label}
                        <ArrowUpRight
                          size={11}
                          weight="bold"
                          aria-hidden
                          className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-70"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 4 · Compliance chips */}
        <ul className="mt-14 flex flex-wrap gap-2" aria-label="Compliance">
          {footerCertifications.map((c) => (
            <li
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/60"
            >
              <SealCheck
                size={13}
                weight="duotone"
                aria-hidden
                className="text-accent-400"
              />
              {c}
            </li>
          ))}
        </ul>

        {/* 5 · Registered office · Grievance · Nodal (RBI / IT Rules mandated) */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-3">
          <OfficeCell
            label="Registered office"
            title={company.legalName}
          >
            <p className="flex items-start gap-2">
              <MapPin size={14} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-brand-300" />
              <span>{company.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} weight="duotone" aria-hidden className="shrink-0 text-brand-300" />
              <a href={`tel:+91${company.phone}`} className="hover:text-white">
                +91 {company.phone}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Envelope size={14} weight="duotone" aria-hidden className="shrink-0 text-brand-300" />
              <a href={`mailto:${company.email}`} className="break-all hover:text-white">
                {company.email}
              </a>
            </p>
          </OfficeCell>

          <OfficeCell
            label="Grievance Redressal · IT Rules 2021"
            title={grievanceOfficer.name}
            subtitle={grievanceOfficer.designation}
          >
            <p className="flex items-center gap-2">
              <Envelope size={14} weight="duotone" aria-hidden className="shrink-0 text-brand-300" />
              <a href={`mailto:${grievanceOfficer.email}`} className="break-all hover:text-white">
                {grievanceOfficer.email}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} weight="duotone" aria-hidden className="shrink-0 text-brand-300" />
              {grievanceOfficer.phone}
            </p>
            <p className="text-white/45">{grievanceOfficer.hours}</p>
            <p className="text-white/45">{grievanceOfficer.responseSla}</p>
            <p className="flex items-start gap-2 text-white/45">
              <MapPin size={14} weight="duotone" aria-hidden className="mt-0.5 shrink-0 text-brand-300" />
              <span>{grievanceOfficer.address}</span>
            </p>
            <Link
              href="/legal/grievance"
              className="inline-flex items-center gap-1 pt-1 font-semibold text-accent-300 hover:text-accent-200"
            >
              Read the policy <ArrowRight size={12} weight="bold" aria-hidden />
            </Link>
          </OfficeCell>

          <OfficeCell
            label="Escalation · RBI Ombudsman Scheme"
            title={nodalOfficer.name}
            subtitle={nodalOfficer.designation}
          >
            <p className="flex items-center gap-2">
              <Envelope size={14} weight="duotone" aria-hidden className="shrink-0 text-brand-300" />
              <a href={`mailto:${nodalOfficer.email}`} className="break-all hover:text-white">
                {nodalOfficer.email}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} weight="duotone" aria-hidden className="shrink-0 text-brand-300" />
              {nodalOfficer.phone}
            </p>
            <p className="text-white/45">
              Reach the Nodal Officer if a grievance is not resolved within 15
              working days.
            </p>
          </OfficeCell>
        </div>

        {/* 6 · Bottom bar */}
        <div className="mt-10 flex flex-col gap-6 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
          <div className="text-xs leading-relaxed text-white/40">
            <p>
              © {year} {company.legalName}. All rights reserved.
            </p>
            <p className="mt-1">
              CIN {company.cin} · GSTIN {company.gstin} · Incorporated{" "}
              {company.incorporated}, {company.jurisdiction}.
            </p>
          </div>
          <ul className="flex items-center gap-2" aria-label="Social">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-energy"
                  >
                    <Icon size={16} weight="duotone" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function OfficeCell({
  label,
  title,
  subtitle,
  children
}: {
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ink-950 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-2 font-display text-base font-semibold text-white">
        {title}
      </p>
      {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-white/65">
        {children}
      </div>
    </div>
  );
}
