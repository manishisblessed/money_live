import { ArrowRight, Check, Minus } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/Badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { pricingPlans } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./_shared/ButtonLink";
import { SectionHeading } from "./_shared/SectionHeading";

const PLAN_HREF: Record<string, string> = {
  Starter: "/register",
  Retailer: "/register",
  Distributor: "/contact"
};

type Cell = string | boolean;
const COMPARE: { label: string; values: [Cell, Cell, Cell] }[] = [
  { label: "Services unlocked", values: ["30+", "60+", "60+"] },
  { label: "AePS & Send Money", values: [false, true, true] },
  { label: "Commission slab", values: ["Standard", "Higher", "Higher + overrides"] },
  { label: "Support", values: ["Email", "Priority WhatsApp", "Dedicated manager"] },
  { label: "Onboard & manage retailers", values: [false, false, true] },
  { label: "API access & white-label", values: [false, false, true] }
];

/** Server component — static pricing columns + a compact comparison table. */
export function PlansCompare() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 bg-[#f6f7fb] py-20 md:py-28"
      aria-labelledby="plans-heading"
    >
      <div className="container-x">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Plans"
            title={<span id="plans-heading">Start free. Upgrade when it pays for itself.</span>}
            sub="Three plans, one rule: you should earn more than you pay in the first week."
          />
        </Reveal>

        <Stagger className="mt-12 grid items-stretch gap-5 lg:grid-cols-3" stagger={0.08}>
          {pricingPlans.map((p) => {
            const hi = !!p.highlighted;
            return (
              <StaggerItem key={p.name} className="h-full">
                <article
                  data-active={hi || undefined}
                  className={cn(
                    "relative flex h-full flex-col rounded-3xl border bg-white p-7 md:p-8",
                    hi
                      ? "gradient-ring border-transparent shadow-energy lg:-translate-y-3"
                      : "border-ink-100 shadow-sm"
                  )}
                >
                  {hi && (
                    <Badge variant="energy" className="absolute -top-3 left-7">
                      Most shops pick this
                    </Badge>
                  )}
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950">
                    {p.name}
                  </h3>
                  <p className="mt-1.5 min-h-[2.5rem] text-sm text-ink-600">{p.description}</p>

                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-5xl font-semibold tracking-[-0.03em] text-ink-950">
                      {p.price}
                    </span>
                    <span className="text-sm text-ink-500">{p.cadence}</span>
                  </p>

                  <ul className="mt-7 space-y-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-ink-700">
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                            hi ? "bg-energy-gradient text-white" : "bg-accent-50 text-accent-700"
                          )}
                        >
                          <Check size={12} weight="bold" aria-hidden />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-2">
                    <ButtonLink
                      href={PLAN_HREF[p.name] ?? "/register"}
                      variant={hi ? "primary" : "outline"}
                      size="lg"
                      linkClassName="w-full"
                    >
                      {p.cta}
                      <ArrowRight size={16} weight="bold" aria-hidden />
                    </ButtonLink>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>

        {/* Comparison */}
        <Reveal className="mt-14">
          <div className="overflow-x-auto rounded-3xl border border-ink-100 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Plan feature comparison</caption>
              <thead>
                <tr className="border-b border-ink-100 text-left">
                  <th scope="col" className="px-6 py-4 font-semibold text-ink-500">
                    What you get
                  </th>
                  {pricingPlans.map((p) => (
                    <th
                      key={p.name}
                      scope="col"
                      className={cn(
                        "px-6 py-4 font-display text-base font-semibold tracking-[-0.01em] text-ink-950",
                        p.highlighted && "bg-royal-50/50"
                      )}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label} className="border-b border-ink-100 last:border-0">
                    <th scope="row" className="px-6 py-3.5 text-left font-medium text-ink-700">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className={cn(
                          "px-6 py-3.5 text-ink-800",
                          pricingPlans[i]?.highlighted && "bg-royal-50/50"
                        )}
                      >
                        {typeof v === "boolean" ? (
                          v ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-accent-700">
                              <Check size={16} weight="bold" aria-hidden />
                              <span className="sr-only">Included</span>
                            </span>
                          ) : (
                            <span className="text-ink-300">
                              <Minus size={16} weight="bold" aria-hidden />
                              <span className="sr-only">Not included</span>
                            </span>
                          )
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-ink-500">
            All plans: zero joining fee, instant commission credit, 24x7 wallet withdrawal.
            Plan fees are exclusive of GST.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
