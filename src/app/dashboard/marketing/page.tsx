"use client";

import { Megaphone, Mail, MessageSquare, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { SectionCard, Stagger, StaggerItem, StatusChip } from "@/components/dashboard/patterns";

const campaigns = [
  { id: "C1", name: "AePS double cashback weekend", channel: "WhatsApp", reach: 8420, ctr: "12.4%", status: "Live" },
  { id: "C2", name: "Recharge ₹100 + ₹10 cashback", channel: "SMS", reach: 24812, ctr: "4.8%", status: "Live" },
  { id: "C3", name: "Distributor onboarding drive", channel: "Email", reach: 1248, ctr: "8.1%", status: "Scheduled" },
  { id: "C4", name: "BBPS bills ka dhamaka", channel: "In-app", reach: 38400, ctr: "15.2%", status: "Ended" }
];

const STATS = [
  { icon: MessageSquare, label: "WhatsApp templates", value: "24", accent: "accent" as const },
  { icon: Mail, label: "Email campaigns (MTD)", value: "12", accent: "brand" as const },
  { icon: ImageIcon, label: "Creative assets", value: "182", accent: "violet" as const },
  { icon: Megaphone, label: "Active push", value: "6", accent: "emerald" as const },
];

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform · Growth"
        title="Marketing tools"
        description="WhatsApp / SMS / Email blasts, in-app banners, and ready-made creatives for your network."
        actions={<Button><Megaphone className="h-4 w-4" /> New campaign</Button>}
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <StaggerItem key={s.label}>
            <StatCard label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
          </StaggerItem>
        ))}
      </Stagger>

      <SectionCard
        title="Recent campaigns"
        description="Reach and click-through across every channel."
        padding="none"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Campaign</th>
                <th className="px-5 py-3 font-semibold">Channel</th>
                <th className="px-5 py-3 text-right font-semibold">Reach</th>
                <th className="px-5 py-3 text-right font-semibold">CTR</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-ink-50/40">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-ink-600">{c.channel}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-ink-800">{c.reach.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-ink-900">{c.ctr}</td>
                  <td className="px-5 py-3.5">
                    <StatusChip status={c.status} label={c.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
