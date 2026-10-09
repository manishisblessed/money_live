import type { Metadata } from "next";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ChartLineUp,
  Clock,
  Envelope,
  FirstAid,
  GraduationCap,
  House,
  MapPin
} from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { company } from "@/lib/data";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Build the counter that brings banking to every Indian shop. Open roles at eMoney across engineering, design, sales, operations and compliance."
};

const openings = [
  {
    title: "Senior Backend Engineer (Payments)",
    team: "Engineering",
    location: "Bengaluru / Remote",
    type: "Full-time"
  },
  {
    title: "Product Designer (Retailer App)",
    team: "Design",
    location: "Delhi NCR",
    type: "Full-time"
  },
  {
    title: "Regional Sales Manager",
    team: "Sales",
    location: "Lucknow",
    type: "Full-time"
  },
  {
    title: "Customer Success Lead",
    team: "Operations",
    location: "Delhi NCR",
    type: "Full-time"
  },
  {
    title: "Compliance Manager (RBI)",
    team: "Compliance",
    location: "Mumbai",
    type: "Full-time"
  },
  {
    title: "Growth Marketing Intern",
    team: "Marketing",
    location: "Remote",
    type: "Internship"
  }
];

const perks: { icon: PhosphorIcon; tone: IconTone; title: string; text: string }[] = [
  {
    icon: ChartLineUp,
    tone: "brand",
    title: "Salary plus ESOPs",
    text: "Own a piece of what you build. Every full-time role comes with equity."
  },
  {
    icon: FirstAid,
    tone: "coral",
    title: "Health cover for your family",
    text: "You, your partner, kids and parents. Day one, no waiting period."
  },
  {
    icon: House,
    tone: "royal",
    title: "Remote-first, field-often",
    text: "Work from where you work best. Visit shops with the team every quarter."
  },
  {
    icon: GraduationCap,
    tone: "accent",
    title: "Learning budget every quarter",
    text: "Courses, books, conferences. Spend it on anything that makes you better."
  }
];

const hiring = [
  {
    step: "01",
    title: "Send a note",
    text: "Email us your CV or portfolio with the role in the subject line. A human reads every one."
  },
  {
    step: "02",
    title: "Intro call",
    text: "Thirty minutes with the hiring manager. We tell you about the work; you tell us what you want."
  },
  {
    step: "03",
    title: "Work sample",
    text: "A small, paid task that looks like the real job. No whiteboard puzzles."
  },
  {
    step: "04",
    title: "Offer within a week",
    text: "Meet two more people from the team, then a decision. Start when you are ready."
  }
];

export default function CareerPage() {
  return (
    <>
      <PageHero
        variant="light"
        eyebrow="Careers"
        breadcrumbs={[{ label: "Careers", href: "/career" }]}
        title={
          <>
            Build the counter that
            <br className="hidden md:block" /> brings the bank to the shop.
          </>
        }
        description="We are a small team in Gurugram with people in the field across India. Engineers, designers, salespeople and compliance folks who have all stood behind a shop counter."
        stats={[
          { value: String(openings.length), label: "Open roles" },
          { value: "5", label: "Teams hiring" },
          { value: "28", label: "States we work in" },
          { value: "1 week", label: "Decision time" }
        ]}
        actions={
          <a href="#roles" className="rounded-2xl focus-energy">
            <Button size="lg" tabIndex={-1}>
              See open roles
              <ArrowRight size={16} weight="bold" aria-hidden />
            </Button>
          </a>
        }
      />

      {/* Culture statement */}
      <Section className="grain relative overflow-hidden bg-ink-950 text-white">
        <div
          aria-hidden
          className="aurora-glow pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full"
        />
        <Container className="relative z-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <span className="brand-dot" aria-hidden /> How we work
              </span>
              <p className="mt-6 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-6xl">
                We ship every Friday. We visit a shop every month. We never
                hide a fee.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="space-y-5 text-base leading-relaxed text-white/65 md:text-lg lg:col-span-5 lg:pt-16">
              <p>
                Our users run a business with thin margins and a queue at the
                counter. Every decision here starts with what that person needs
                at 7 pm on a Tuesday.
              </p>
              <p>
                Small teams, clear owners, short meetings. You will see your
                work in a shop within weeks of joining.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Perks */}
      <Section className="bg-white">
        <Container>
          <SectionIntro
            eyebrow="What you get"
            title="Four things we take care of so you can do the work."
          />
          <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <StaggerItem
                key={p.title}
                className="gradient-ring rounded-3xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-energy-sm"
              >
                <IconTile tone={p.tone} size="lg">
                  <p.icon size={24} weight="duotone" aria-hidden />
                </IconTile>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* Open roles */}
      <Section id="roles" className="scroll-mt-28 bg-ink-50/60">
        <Container>
          <SectionIntro
            eyebrow="Open roles"
            title="Where we need you."
            description="Hover a role to apply. We reply to every application within five working days."
            aside={
              <a href={`mailto:${company.email}?subject=Open%20application`} className="rounded-2xl focus-energy">
                <Button variant="outline" tabIndex={-1}>
                  <Envelope size={16} weight="duotone" aria-hidden />
                  Open application
                </Button>
              </a>
            }
          />
          <Stagger className="overflow-hidden rounded-3xl border border-ink-100 bg-white">
            {openings.map((job, i) => {
              const mailto = `mailto:${company.email}?subject=${encodeURIComponent(
                `Application: ${job.title}`
              )}`;
              return (
                <StaggerItem key={job.title} distance={12}>
                  <a
                    href={mailto}
                    className="group flex flex-col gap-4 border-b border-ink-100 p-5 transition last:border-b-0 hover:bg-ink-50/70 focus-energy sm:flex-row sm:items-center sm:justify-between md:px-7"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-1 hidden font-display text-sm font-semibold tabular-nums text-ink-300 sm:block">
                        0{i + 1}
                      </span>
                      <div>
                        <p className="font-display text-lg font-semibold tracking-[-0.01em] text-ink-950 transition group-hover:text-royal-800">
                          {job.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="royal" size="sm">
                            <Briefcase size={11} weight="duotone" aria-hidden />
                            {job.team}
                          </Badge>
                          <Badge size="sm">
                            <MapPin size={11} weight="duotone" aria-hidden />
                            {job.location}
                          </Badge>
                          <Badge
                            variant={job.type === "Internship" ? "accent" : "default"}
                            size="sm"
                          >
                            <Clock size={11} weight="duotone" aria-hidden />
                            {job.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink-400 transition sm:self-auto sm:translate-x-2 sm:opacity-0 group-hover:text-royal-700 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 group-focus-visible:opacity-100">
                      Apply
                      <ArrowUpRight size={14} weight="bold" aria-hidden />
                    </span>
                  </a>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Container>
      </Section>

      {/* How we hire */}
      <Section className="bg-white">
        <Container>
          <SectionIntro
            eyebrow="How we hire"
            title="Four steps. One week."
          />
          <div className="relative">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-royal-500 via-brand-500 to-coral-500 lg:block"
            />
            <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {hiring.map((h) => (
                <StaggerItem key={h.step} className="relative">
                  <span className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-ink-950 font-display text-sm font-semibold text-white shadow-energy-sm">
                    {h.step}
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
                    {h.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{h.text}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal className="mt-14">
            <div className="flex flex-col items-start gap-4 rounded-3xl border border-ink-100 bg-ink-50/60 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <p className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
                  Don&rsquo;t see your role?
                </p>
                <p className="mt-1 text-sm text-ink-600">
                  Tell us what you would build for a shopkeeper. We make room for good people.
                </p>
              </div>
              <a href={`mailto:${company.email}?subject=Open%20application`} className="rounded-2xl focus-energy">
                <Button tabIndex={-1}>
                  Write to {company.email}
                  <ArrowRight size={16} weight="bold" aria-hidden />
                </Button>
              </a>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
