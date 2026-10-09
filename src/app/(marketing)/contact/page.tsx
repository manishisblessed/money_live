import type { Metadata } from "next";
import Link from "next/link";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Envelope,
  MapPin,
  Scales,
  ShieldCheck,
  WhatsappLogo
} from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Button } from "@/components/ui/Button";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { company, grievanceOfficer, nodalOfficer } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call, WhatsApp or write to eMoney. Support, partnerships, grievance and nodal officer contacts, plus our Gurugram office."
};

type Channel = {
  icon: PhosphorIcon;
  tone: IconTone;
  label: string;
  title: string;
  lines: { text: string; href?: string }[];
  note?: string;
};

const channels: Channel[] = [
  {
    icon: WhatsappLogo,
    tone: "accent",
    label: "Call or WhatsApp",
    title: `+91 ${company.phone}`,
    lines: [
      { text: "Call", href: `tel:+91${company.phone}` },
      { text: "WhatsApp", href: `https://wa.me/91${company.phone}` }
    ],
    note: "Retailer helpline · fastest for transaction help"
  },
  {
    icon: Envelope,
    tone: "brand",
    label: "Email support",
    title: company.supportEmail,
    lines: [{ text: "Write to support", href: `mailto:${company.supportEmail}` }],
    note: "We reply within one working day"
  },
  {
    icon: MapPin,
    tone: "royal",
    label: "Registered office",
    title: company.shortAddress,
    lines: [{ text: company.address }],
    note: company.legalName
  },
  {
    icon: ShieldCheck,
    tone: "coral",
    label: "Grievance Officer · IT Rules 2021",
    title: grievanceOfficer.name,
    lines: [
      { text: grievanceOfficer.email, href: `mailto:${grievanceOfficer.email}` },
      { text: grievanceOfficer.phone, href: `tel:${grievanceOfficer.phone.replace(/\s/g, "")}` }
    ],
    note: grievanceOfficer.responseSla
  },
  {
    icon: Scales,
    tone: "amber",
    label: "Nodal Officer · escalation",
    title: nodalOfficer.name,
    lines: [
      { text: nodalOfficer.email, href: `mailto:${nodalOfficer.email}` },
      { text: nodalOfficer.phone, href: `tel:${nodalOfficer.phone.replace(/\s/g, "")}` }
    ],
    note: "If a grievance is not resolved within 15 working days"
  }
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        variant="light"
        eyebrow="Contact"
        breadcrumbs={[{ label: "Contact", href: "/contact" }]}
        title={
          <>
            Talk to a person,
            <br className="hidden md:block" /> not a ticket number.
          </>
        }
        description="Stuck on a transaction, want to open a counter, or need to reach our grievance officer? Every channel below is answered by a human."
        actions={
          <>
            <a href={`https://wa.me/91${company.phone}`} className="rounded-2xl focus-energy">
              <Button size="lg" variant="accent" tabIndex={-1}>
                <WhatsappLogo size={18} weight="duotone" aria-hidden />
                WhatsApp us
              </Button>
            </a>
            <a href="#message" className="rounded-2xl focus-energy">
              <Button size="lg" variant="outline" tabIndex={-1}>
                Send a message
                <ArrowRight size={16} weight="bold" aria-hidden />
              </Button>
            </a>
          </>
        }
      />

      <Section className="bg-white pt-4 md:pt-8">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Channels */}
            <div className="lg:col-span-5">
              <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {channels.map((c) => (
                  <StaggerItem
                    key={c.label}
                    className="gradient-ring rounded-3xl border border-ink-100 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-energy-sm"
                  >
                    <div className="flex items-start gap-4">
                      <IconTile tone={c.tone} size="lg">
                        <c.icon size={24} weight="duotone" aria-hidden />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                          {c.label}
                        </p>
                        <p className="mt-1 break-words font-display text-lg font-semibold tracking-[-0.01em] text-ink-950">
                          {c.title}
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-ink-600">
                          {c.lines.map((l) =>
                            l.href ? (
                              <li key={l.text}>
                                <a
                                  href={l.href}
                                  className="inline-flex items-center gap-1 font-medium text-royal-700 hover:text-royal-900 hover:underline focus-energy"
                                >
                                  {l.text}
                                  <ArrowUpRight size={12} weight="bold" aria-hidden />
                                </a>
                              </li>
                            ) : (
                              <li key={l.text}>{l.text}</li>
                            )
                          )}
                        </ul>
                        {c.note && <p className="mt-2 text-xs text-ink-500">{c.note}</p>}
                      </div>
                    </div>
                  </StaggerItem>
                ))}

                {/* Office hours */}
                <StaggerItem className="grain relative overflow-hidden rounded-3xl bg-ink-950 p-5 text-white sm:col-span-2 lg:col-span-1">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-energy-gradient opacity-50 blur-2xl"
                  />
                  <div className="relative z-10 flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-inset ring-white/15">
                      <Clock size={24} weight="duotone" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                        Office hours
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold tracking-[-0.01em]">
                        {grievanceOfficer.hours}
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        Transactions settle 24x7. Human support, grievance and
                        nodal desks keep the hours above. Sundays and bank
                        holidays closed.
                      </p>
                      <Link
                        href="/legal/grievance"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-300 hover:text-accent-200 focus-energy"
                      >
                        Grievance policy <ArrowRight size={12} weight="bold" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </StaggerItem>
              </Stagger>
            </div>

            {/* Form */}
            <div id="message" className="scroll-mt-28 lg:col-span-7">
              <Reveal>
                <ContactForm />
              </Reveal>

              <Reveal delay={0.1} className="mt-6">
                <div className="overflow-hidden rounded-3xl border border-ink-100">
                  <div className="flex flex-col gap-2 border-b border-ink-100 bg-ink-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                        Visit us
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-ink-900">
                        JMD Empire Square, DLF Phase-1, Gurugram
                      </p>
                    </div>
                    <a
                      href="https://www.google.com/maps?q=JMD+Empire+Square+Mehrauli+Gurgaon+Road+DLF+Phase+1+Sector+24+Gurugram+Haryana+122002"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-royal-700 hover:text-royal-900 focus-energy"
                    >
                      Get directions <ArrowUpRight size={14} weight="bold" aria-hidden />
                    </a>
                  </div>
                  <div className="aspect-[16/7] w-full bg-ink-100">
                    <iframe
                      title="eMoney HQ — JMD Empire Square, DLF Phase-1, Gurugram"
                      src="https://www.google.com/maps?q=JMD+Empire+Square+Mehrauli+Gurgaon+Road+DLF+Phase+1+Sector+24+Gurugram+Haryana+122002&output=embed"
                      className="h-full w-full"
                      loading="lazy"
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
