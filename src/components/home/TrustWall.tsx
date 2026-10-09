import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { certifications, integrations } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./_shared/SectionHeading";

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  Live: "success",
  Certified: "brand",
  "Sub-AUA": "royal",
  Compliant: "accent",
  Audited: "warning",
  Reporting: "default"
};

/**
 * Dense wall of regulatory monograms + the rails and partners underneath.
 * Server component — no hooks, no client-only icons.
 */
export function TrustWall() {
  return (
    <section className="bg-white py-20 md:py-28" aria-labelledby="trust-heading">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            eyebrow="Trust wall"
            title={<span id="trust-heading">Regulated to the letter.</span>}
            sub="The licences, audits and rails behind every rupee that moves through your counter. Nothing hidden, nothing borrowed."
          />
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" stagger={0.05}>
          {certifications.map((c) => (
            <StaggerItem key={c.code} className="h-full">
              <article
                className="gradient-ring group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-energy-sm md:p-6"
                title={c.description}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-3xl font-semibold tracking-[-0.03em] text-ink-950 md:text-4xl">
                    {c.code}
                  </p>
                  <Badge variant={STATUS_VARIANT[c.status] ?? "default"} size="sm">
                    {c.status}
                  </Badge>
                </div>
                <p className="mt-4 text-sm font-semibold leading-snug text-ink-900">{c.name}</p>
                <p className="mt-1 text-xs leading-snug text-ink-500">{c.authority}</p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
            Rails, banks and devices we run on
          </p>
          <ul className="mt-4 flex flex-wrap gap-3">
            {integrations.map((it) => (
              <li key={it.name} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "grid h-14 min-w-[4.5rem] place-items-center rounded-xl bg-gradient-to-br px-3 font-display text-xs font-bold tracking-wide text-white shadow-soft",
                    it.color
                  )}
                  aria-hidden
                >
                  {it.initials}
                </span>
                <span className="max-w-[5.5rem] truncate text-[11px] text-ink-500">{it.name}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
