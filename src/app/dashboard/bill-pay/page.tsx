import Link from "next/link";
import { ArrowRight, CreditCard, Receipt, Landmark, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * BBPS hub — landing page reached from the retailer dashboard "BBPS" card.
 * Presents every bill-payment rail as a card; the retailer picks whichever
 * they want. `maxAmount` is the per-transaction ceiling enforced by each
 * rail's form (see CreditCardBillForm / BbpsBillForm — default ₹5,00,000).
 */
type BillOption = {
  title: string;
  description: string;
  href: string;
  maxAmount: number;
  eyebrow: string;
  icon: LucideIcon;
  tone: IconTone;
  tags: string[];
};

const BILL_OPTIONS: BillOption[] = [
  {
    title: "Credit Card Bill Payment",
    eyebrow: "Same Day BBPS",
    description:
      "Fetch the live bill with the card's last 4 digits and registered mobile, then pay — all major banks.",
    href: "/dashboard/bill-pay/credit-card",
    maxAmount: 500000,
    icon: CreditCard,
    tone: "energy",
    tags: ["Live bill fetch", "All major banks"],
  },
  {
    title: "Credit Card Bill Payment-2",
    eyebrow: "Direct payment",
    description:
      "Enter the full card number, bank details and amount. Charges show before you confirm.",
    href: "/dashboard/bill-pay/cc-pay",
    maxAmount: 500000,
    icon: Landmark,
    tone: "royal",
    tags: ["No bill fetch", "Charges upfront"],
  },
  {
    title: "BBPS-Bharat BillPay",
    eyebrow: "Bharat BillPay",
    description:
      "Credit card, electricity, water, gas, education, insurance and broadband on one rail.",
    href: "/dashboard/bill-pay/bbps-1",
    maxAmount: 500000,
    icon: Receipt,
    tone: "brand",
    tags: ["7 categories", "Instant confirmation"],
  },
  {
    title: "Unified Bill Payment Platform",
    eyebrow: "Utilities",
    description:
      "Electricity, water, gas, education, insurance and broadband via the Unified Bill Payment Platform.",
    href: "/dashboard/bill-pay/bbps-2",
    maxAmount: 500000,
    icon: Zap,
    tone: "accent",
    tags: ["6 categories", "Utility bills"],
  },
];

export default function BillPayHubPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Receipt}
        title="BBPS — Bill Payments"
        description="Pick the rail that fits your customer. Each one supports different banks and bill categories."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {BILL_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link
              key={opt.href}
              href={opt.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-energy-sm focus-energy"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-energy-gradient opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20"
              />
              <div className="flex items-start justify-between">
                <IconTile tone={opt.tone} size="lg">
                  <Icon className="h-5 w-5" />
                </IconTile>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink-50 text-ink-400 ring-1 ring-ink-100 transition group-hover:bg-ink-950 group-hover:text-white">
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </div>
              <p className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <span className="brand-dot" />
                {opt.eyebrow}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                {opt.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                {opt.description}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {opt.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
                <Badge variant="warning" size="sm" className="ml-auto">
                  Max {formatINR(opt.maxAmount)}
                </Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
