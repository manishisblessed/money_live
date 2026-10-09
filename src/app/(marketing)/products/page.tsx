import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react/dist/ssr";
import { Container, Section } from "@/components/ui/Container";
import { PageHero } from "@/components/PageHero";
import { SectionIntro } from "@/components/marketing/SectionIntro";
import { ProductMock, type ProductMockVariant } from "@/components/marketing/ProductMock";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Payment Gateway, POS terminals, QR Collect and Virtual Accounts. Accept every payment your customer wants to make, settled to your bank."
};

type Product = {
  id: ProductMockVariant;
  index: string;
  name: string;
  headline: string;
  text: string;
  specs: string[];
  href: string;
  cta: string;
  badge?: string;
};

const products: Product[] = [
  {
    id: "pg",
    index: "01",
    name: "Payment Gateway",
    headline: "Take payments online without writing a line of code.",
    text: "Send a payment link on WhatsApp or drop a checkout on your website. UPI, cards, net banking and wallets, with tracking you can read at a glance.",
    specs: [
      "0% MDR on UPI · cards from 0.95%",
      "T+1 settlement to any bank account",
      "Payment links, hosted checkout and APIs"
    ],
    href: "/dashboard/pg",
    cta: "Open Payment Gateway",
    badge: "New"
  },
  {
    id: "pos",
    index: "02",
    name: "POS Terminals",
    headline: "A card machine that pays for itself in a week.",
    text: "Android terminals on monthly rental. Card, UPI, BharatQR and tap-to-pay on one device, with every sale in your eMoney wallet by next morning.",
    specs: [
      "Rental from ₹499 a month, no deposit",
      "Cards, UPI, BharatQR and Tap & Pay",
      "Replacement within 48 hours if it fails"
    ],
    href: "/dashboard/pos",
    cta: "Order a terminal"
  },
  {
    id: "qr",
    index: "03",
    name: "QR Collect",
    headline: "Your own QR. Your own name on every receipt.",
    text: "Static QR for the counter, dynamic QR for a specific bill. The customer scans, you hear the alert, the money is yours the same day.",
    specs: [
      "0% MDR · ₹0 setup",
      "Voice alerts and instant settlement reports",
      "Unlimited static and dynamic codes"
    ],
    href: "/dashboard/qr",
    cta: "Create your QR",
    badge: "New"
  },
  {
    id: "va",
    index: "04",
    name: "Virtual Account",
    headline: "A bank account number that fills your wallet by itself.",
    text: "Share one account number and IFSC with distributors and customers. Every IMPS, NEFT or UPI credit lands in your wallet, named and reconciled.",
    specs: [
      "Unique account number + IFSC in minutes",
      "Instant credit to your eMoney wallet",
      "Zero charge on incoming transfers"
    ],
    href: "/dashboard/virtual-account",
    cta: "Open a Virtual Account",
    badge: "New"
  }
];

const comparison: { label: string; values: string[] }[] = [
  { label: "Settlement", values: ["T+1", "T+1", "Same day", "Instant"] },
  {
    label: "MDR",
    values: ["UPI 0% · Cards from 0.95%", "UPI 0% · Cards from 1.10%", "0%", "₹0 per credit"]
  },
  { label: "Setup fee", values: ["₹0", "₹499 / month rental", "₹0", "₹0"] },
  {
    label: "Best for",
    values: [
      "Online orders & payment links",
      "Counter sales with cards",
      "Any shop counter",
      "Collecting from distributors"
    ]
  }
];

export default function ProductsPage() {
  return (
    <>
      <PageHero
        variant="dark"
        eyebrow="Products"
        breadcrumbs={[{ label: "Products", href: "/products" }]}
        title={
          <>
            Accept every payment
            <br className="hidden md:block" /> your customer wants to make.
          </>
        }
        description="Four ways to get paid, one wallet to collect it in. Pick what fits your counter; add the rest when you grow."
        stats={[
          { value: "4", label: "Ways to get paid" },
          { value: "0%", label: "MDR on UPI" },
          { value: "T+1", label: "Settlement" },
          { value: "₹0", label: "Setup fee" }
        ]}
        actions={
          <>
            <Link href="/register" className="rounded-2xl focus-energy">
              <Button size="lg" tabIndex={-1}>
                Start earning
                <ArrowRight size={16} weight="bold" aria-hidden />
              </Button>
            </Link>
            <a href="#compare" className="rounded-2xl focus-energy">
              <Button
                size="lg"
                variant="outline"
                tabIndex={-1}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Compare products
              </Button>
            </a>
          </>
        }
      />

      {/* Alternating feature sections */}
      <div className="bg-white">
        {products.map((p, i) => {
          const flip = i % 2 === 1;
          return (
            <Section
              key={p.id}
              id={p.id}
              className={cn("scroll-mt-28", i % 2 === 1 && "bg-ink-50/60")}
            >
              <Container>
                <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                  <Reveal
                    direction={flip ? "left" : "right"}
                    className={cn("lg:col-span-5", flip && "lg:order-2")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-sm font-semibold tabular-nums text-ink-400">
                        {p.index}
                      </span>
                      <span className="h-px w-8 bg-ink-200" aria-hidden />
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-royal-700">
                        {p.name}
                      </span>
                      {p.badge && (
                        <Badge variant="energy" size="sm" dot>
                          {p.badge}
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink-950 md:text-5xl">
                      {p.headline}
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-ink-600 md:text-lg">
                      {p.text}
                    </p>
                    <ul className="mt-7 space-y-3">
                      {p.specs.map((s) => (
                        <li key={s} className="flex items-start gap-3 text-sm text-ink-800">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-100">
                            <Check size={12} weight="bold" aria-hidden />
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link href={p.href} className="rounded-2xl focus-energy">
                        <Button tabIndex={-1}>
                          {p.cta}
                          <ArrowUpRight size={16} weight="bold" aria-hidden />
                        </Button>
                      </Link>
                      <Link href="/contact" className="rounded-2xl focus-energy">
                        <Button variant="ghost" tabIndex={-1}>
                          Talk to sales
                        </Button>
                      </Link>
                    </div>
                  </Reveal>

                  <Reveal
                    direction={flip ? "right" : "left"}
                    delay={0.1}
                    className={cn("lg:col-span-7", flip && "lg:order-1")}
                  >
                    <ProductMock variant={p.id} />
                  </Reveal>
                </div>
              </Container>
            </Section>
          );
        })}
      </div>

      {/* Comparison */}
      <Section id="compare" className="scroll-mt-28 bg-white">
        <Container>
          <SectionIntro
            eyebrow="Compare"
            title="Pick the one that fits your counter."
            description="All four pay into the same eMoney wallet. Start with one, add the rest from the dashboard."
          />
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-ink-100 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Comparison of eMoney payment products
                  </caption>
                  <thead>
                    <tr className="bg-ink-950 text-white">
                      <th scope="col" className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                        &nbsp;
                      </th>
                      {products.map((p) => (
                        <th
                          key={p.id}
                          scope="col"
                          className="px-5 py-4 font-display text-base font-semibold tracking-[-0.01em]"
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {comparison.map((row) => (
                      <tr key={row.label} className="odd:bg-white even:bg-ink-50/50">
                        <th
                          scope="row"
                          className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                        >
                          {row.label}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={`${row.label}-${i}`} className="px-5 py-4 align-top text-ink-800">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-white">
                      <td className="px-5 py-4" />
                      {products.map((p) => (
                        <td key={`cta-${p.id}`} className="px-5 py-4">
                          <Link
                            href={p.href}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-royal-700 hover:text-royal-900 focus-energy"
                          >
                            Open <ArrowUpRight size={14} weight="bold" aria-hidden />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
