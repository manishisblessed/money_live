import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Team",
  description:
    "The people behind the eMoney counter: payments, field sales, compliance and design, most of whom have run a shop themselves."
};

const team = [
  {
    name: "Aman Sharma",
    role: "Co-founder & CEO",
    bio: "Ex-payments at a leading bank. Building Bharat's most loved fintech."
  },
  {
    name: "Anjali Iyer",
    role: "Co-founder & COO",
    bio: "10+ years in retail networks. Obsessed with retailer experience."
  },
  {
    name: "Rohan Mehta",
    role: "CTO",
    bio: "Distributed systems engineer. Loves building reliable rails."
  },
  {
    name: "Priya Nair",
    role: "VP Product",
    bio: "Designs delightful flows for first-time internet users."
  },
  {
    name: "Vikram Bose",
    role: "VP Engineering",
    bio: "Scaled multiple fintech platforms to billions of transactions."
  },
  {
    name: "Sneha Kapoor",
    role: "Head of Compliance",
    bio: "Former RBI auditor. Champion of safe & sound finance."
  },
  {
    name: "Karan Joshi",
    role: "Head of Sales",
    bio: "Built distributor networks across 22 states from the ground up."
  },
  {
    name: "Meera Krishnan",
    role: "Head of Design",
    bio: "Believes great design speaks every Indian language."
  }
];

const tiles = [
  "from-brand-500 to-brand-700",
  "from-royal-500 to-royal-700",
  "from-coral-400 to-coral-600",
  "from-accent-500 to-accent-700",
  "from-amber-400 to-amber-600",
  "from-ink-700 to-ink-900",
  "from-brand-600 to-royal-600",
  "from-royal-600 to-coral-500"
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export default function TeamPage() {
  return (
    <>
      <PageHero
        variant="dark"
        eyebrow="Team"
        breadcrumbs={[{ label: "Team", href: "/team" }]}
        title={
          <>
            The people behind
            <br className="hidden md:block" /> your counter.
          </>
        }
        description="Payments, field sales, compliance and design. A small team from Gurugram with people in shops across 28 states."
        stats={[
          { value: String(team.length), label: "Leadership team" },
          { value: "85+", label: "Teammates" },
          { value: "9", label: "Languages spoken" },
          { value: "28", label: "States visited" }
        ]}
        actions={
          <Link href="/career" className="rounded-2xl focus-energy">
            <Button size="lg" tabIndex={-1}>
              Join the team
              <ArrowRight size={16} weight="bold" aria-hidden />
            </Button>
          </Link>
        }
      />

      <Section className="bg-white">
        <Container>
          <SectionIntro
            eyebrow="Leadership"
            title="Namaste. Here is who picks up when you call."
            description="No stock photos. Just names, roles and what each of us is responsible for."
          />
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <StaggerItem
                key={m.name}
                className="gradient-ring group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-energy-sm"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br font-display text-lg font-semibold text-white shadow-soft transition group-hover:scale-105",
                      tiles[i % tiles.length]
                    )}
                    aria-hidden
                  >
                    {initials(m.name)}
                  </span>
                  <a
                    href="#"
                    aria-label={`${m.name} on LinkedIn`}
                    className="grid h-9 w-9 place-items-center rounded-full border border-ink-100 text-ink-400 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 focus-energy"
                  >
                    <LinkedinLogo size={16} weight="duotone" aria-hidden />
                  </a>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
                  {m.name}
                </h3>
                <div className="mt-2">
                  <Badge variant={i < 2 ? "energy" : "royal"} size="sm">
                    {m.role}
                  </Badge>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-600">{m.bio}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className="bg-ink-50/60 pt-0">
        <Container>
          <Reveal>
            <div className="flex flex-col items-start gap-6 rounded-4xl border border-ink-100 bg-white p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div>
                <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950 md:text-3xl">
                  85 more of us are in the field right now.
                </p>
                <p className="mt-2 max-w-xl text-sm text-ink-600 md:text-base">
                  Onboarding shops, fixing devices, answering calls in nine languages. Want in?
                </p>
              </div>
              <Link href="/career" className="shrink-0 rounded-2xl focus-energy">
                <Button variant="outline" size="lg" tabIndex={-1}>
                  See open roles
                  <ArrowRight size={16} weight="bold" aria-hidden />
                </Button>
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
