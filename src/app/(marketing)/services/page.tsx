import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Coins } from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { ServicesRail, type RailCategory } from "@/components/marketing/ServicesRail";
import { services, type ServiceItem } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Cash withdrawal, money transfer, UPI, recharges, 1,200+ billers and travel. Every service your customers walk in for, from one eMoney counter."
};

type Category = ServiceItem["category"];

const categoryMeta: {
  id: Category;
  label: string;
  hint: string;
  tone: IconTone;
  blurb: string;
  commission: string;
}[] = [
  {
    id: "banking",
    label: "Banking",
    hint: "Cash, transfers, payments",
    tone: "brand",
    blurb:
      "The services that make your shop a bank counter. Cash on a fingerprint, money sent home in seconds, payments accepted every way a customer can pay.",
    commission: "Earn up to ₹6 per AePS withdrawal · 0.40% on money transfer"
  },
  {
    id: "recharge",
    label: "Top-ups",
    hint: "Mobile, DTH, broadband",
    tone: "accent",
    blurb:
      "Prepaid recharges for every operator. Instant confirmation, cashback on select plans, and a reason for customers to come back every month.",
    commission: "Earn 0.5% – 3% per recharge, credited instantly"
  },
  {
    id: "bills",
    label: "Bills",
    hint: "1,200+ billers on BBPS",
    tone: "coral",
    blurb:
      "Electricity, water, gas, credit cards, school fees, insurance. One BBPS connection, 1,200+ billers, receipts the customer can trust.",
    commission: "Earn ₹2 – ₹15 per bill · ₹0 convenience fee on most billers"
  },
  {
    id: "travel",
    label: "Travel",
    hint: "Flights, buses, hotels",
    tone: "royal",
    blurb:
      "Book flights, buses and hotels at agent rates. Higher ticket sizes, higher margins, and customers who stop going to the travel agent down the road.",
    commission: "Earn 0.5% – 4% per booking by route"
  }
];

const heroStats = [
  { value: "60+", label: "Services live" },
  { value: "1,200+", label: "BBPS billers" },
  { value: "T+0", label: "AePS settlement" },
  { value: "24x7", label: "Money transfer" }
];

export default function ServicesPage() {
  const grouped = categoryMeta.map((c) => ({
    ...c,
    items: services.filter((s) => s.category === c.id)
  }));

  const railCategories: RailCategory[] = grouped.map((c) => ({
    id: c.id,
    label: c.label,
    count: c.items.length,
    hint: c.hint
  }));

  return (
    <>
      <PageHero
        variant="light"
        eyebrow="Services"
        breadcrumbs={[{ label: "Services", href: "/services" }]}
        title={
          <>
            Everything a customer
            <br className="hidden md:block" /> walks in for.
          </>
        }
        description="Banking, top-ups, bills and travel from one login and one wallet. Every service shows the fee and your commission before you confirm."
        stats={heroStats}
        actions={
          <>
            <Link href="/register" className="rounded-2xl focus-energy">
              <Button size="lg" tabIndex={-1}>
                Start earning
                <ArrowRight size={16} weight="bold" aria-hidden />
              </Button>
            </Link>
            <Link href="/legal/charges" className="rounded-2xl focus-energy">
              <Button size="lg" variant="outline" tabIndex={-1}>
                See all charges
              </Button>
            </Link>
          </>
        }
      />

      <Section className="bg-white pt-4 md:pt-8">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-14">
            <ServicesRail categories={railCategories} />

            <div className="space-y-20 md:space-y-28">
              {grouped.map((cat, idx) => (
                <section
                  key={cat.id}
                  id={cat.id}
                  aria-labelledby={`${cat.id}-heading`}
                  className="scroll-mt-32"
                >
                  <Reveal>
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-royal-700">
                          <span className="brand-dot" aria-hidden />
                          0{idx + 1} · {cat.items.length} services
                        </span>
                        <h2
                          id={`${cat.id}-heading`}
                          className="mt-4 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink-950 md:text-5xl"
                        >
                          {cat.label}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-ink-600 md:text-lg">
                          {cat.blurb}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "inline-flex shrink-0 items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium",
                          toneSurface[cat.tone]
                        )}
                      >
                        <Coins size={18} weight="duotone" aria-hidden className="mt-0.5 shrink-0" />
                        <span>{cat.commission}</span>
                      </div>
                    </div>
                  </Reveal>

                  <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cat.items.map((s) => (
                      <StaggerItem key={s.slug} id={s.slug} className="scroll-mt-32">
                        <ServiceCard service={s} tone={cat.tone} commission={cat.commission} />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </section>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Closing band */}
      <Section className="bg-ink-50/60 pt-0">
        <Container>
          <Reveal>
            <div className="grain relative overflow-hidden rounded-4xl bg-ink-950 p-8 text-white md:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-energy-gradient opacity-50 blur-3xl"
              />
              <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] md:text-5xl">
                    Every service. One wallet. Commission on each.
                  </p>
                  <p className="mt-3 text-sm text-white/60 md:text-base">
                    Open your counter today. No joining fee, KYC in under five
                    minutes.
                  </p>
                </div>
                <Link href="/register" className="shrink-0 rounded-2xl focus-energy">
                  <Button size="xl" tabIndex={-1}>
                    Start earning
                    <ArrowRight size={18} weight="bold" aria-hidden />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}

/** Per-service commission hints shown on cards. Falls back to the first
 *  clause of the category commission line for services not listed here. */
const serviceHints: Record<string, string> = {
  "payment-gateway": "0% MDR on UPI · T+1 settlement",
  pos: "Low MDR on cards · monthly rental, no buying",
  "qr-payments": "₹0 on UPI collections · instant alerts",
  "aadhaar-pay": "Earn up to ₹6 per AePS withdrawal",
  "money-transfer": "Earn 0.40% on every transfer",
  upi: "₹0 up to ₹2,000 · 0.10% above",
  wallet: "Instant top-ups · zero holding fee",
  "virtual-account": "Auto-credit to wallet · ₹0 setup",
  "credit-card": "Earn ₹2 – ₹15 per bill",
  "mobile-recharge": "Earn 0.5% – 3% per recharge",
  dth: "Earn up to 3.5% per recharge",
  broadband: "Earn on every renewal, monthly repeat",
  electricity: "Earn on every bill · 84+ boards",
  water: "Earn ₹2 – ₹15 per bill",
  gas: "Earn on every cylinder & gas bill",
  education: "Earn on every fee collection",
  insurance: "Earn on every premium paid",
  "broadband-bill": "Earn ₹2 – ₹15 per bill",
  flight: "Earn 0.5% – 4% per ticket",
  hotel: "Agent rates on 50,000+ hotels",
  bus: "Earn up to 5% per seat"
};

const toneSurface: Record<IconTone, string> = {
  brand: "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100",
  accent: "bg-accent-50 text-accent-800 ring-1 ring-inset ring-accent-100",
  royal: "bg-royal-50 text-royal-800 ring-1 ring-inset ring-royal-100",
  coral: "bg-coral-50 text-coral-800 ring-1 ring-inset ring-coral-100",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-100",
  ink: "bg-ink-100 text-ink-800 ring-1 ring-inset ring-ink-200",
  energy: "bg-energy-gradient text-white"
};

function ServiceCard({
  service,
  tone,
  commission
}: {
  service: ServiceItem;
  tone: IconTone;
  commission: string;
}) {
  const Icon = service.icon;
  // Prefer the per-service hint; fall back to the category's first clause.
  const hint = serviceHints[service.slug] ?? commission.split("·")[0].trim();

  return (
    <article className="gradient-ring group relative flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-energy-sm">
      <div className="flex items-start justify-between gap-3">
        <IconTile tone={tone} size="lg">
          <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </IconTile>
        {service.badge && (
          <Badge variant="energy" size="sm" dot>
            {service.badge}
          </Badge>
        )}
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
        {service.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
        {service.description}
      </p>
      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700">
        <Coins size={14} weight="duotone" aria-hidden />
        {hint}
      </p>
      <Link
        href={service.href}
        className="mt-4 inline-flex items-center gap-1.5 border-t border-ink-100 pt-4 text-sm font-semibold text-ink-900 transition group-hover:text-royal-700 focus-energy"
      >
        Open in dashboard
        <ArrowUpRight
          size={14}
          weight="bold"
          aria-hidden
          className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </Link>
    </article>
  );
}
