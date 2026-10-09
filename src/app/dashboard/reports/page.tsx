import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Stagger, StaggerItem } from "@/components/dashboard/patterns";
import { REPORT_LIST, type Accent } from "@/lib/reports/registry";

const ACCENT_TILE: Record<Accent, string> = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  accent: "bg-accent-50 text-accent-700 ring-accent-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  violet: "bg-royal-50 text-royal-600 ring-royal-100",
};

export const dynamic = "force-dynamic";

export default function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Business reports"
        description="Ownership-scoped reports across funds, payments, payouts, commissions and settlements. Filter by date, preview, then export to CSV, Excel or PDF."
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_LIST.map((r) => {
          const Icon = r.icon;
          return (
            <StaggerItem key={r.type}>
              <Link href={`/dashboard/reports/${r.type}`} className="block h-full rounded-3xl focus-energy">
                <Card interactive className="group flex h-full flex-col p-5">
                  <div className="flex items-start justify-between">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-inset ${ACCENT_TILE[r.accent]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition-[transform,color] group-hover:translate-x-1 group-hover:text-brand-600" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">{r.short}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{r.description}</p>
                </Card>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
