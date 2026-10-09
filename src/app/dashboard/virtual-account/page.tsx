"use client";

import { Building2, Copy, Check, Share2 } from "lucide-react";
import { Bank, Lightning, QrCode, ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { ServiceLayout, ServiceCard } from "@/components/dashboard/services/ServiceLayout";
import { AsideTips } from "@/components/dashboard/services/SummaryPanel";
import { cn } from "@/lib/utils";

const account = {
  ifsc: "YESB0CMSNOC",
  number: "PPRSMV456789012345",
  beneficiary: "eMoney - Aman Sharma",
  branch: "Virtual Branch, Delhi"
};

const STEPS = [
  { icon: ShareNetwork, text: "Share the account number & IFSC with your customer." },
  { icon: Bank, text: "Customer transfers via UPI / IMPS / NEFT from any bank app." },
  { icon: Lightning, text: "Funds auto-credit to your eMoney wallet within 30 seconds." },
  { icon: QrCode, text: "You earn standard collection commission on every credit." },
];

export default function VirtualAccountPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(label: string, val: string) {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Building2}
        title="Virtual Account"
        description="Your own IFSC + account number. Every NEFT/IMPS deposit lands straight in your wallet."
      />

      <ServiceLayout
        aside={
          <>
            <ServiceCard
              eyebrow="How it works"
              title="Four steps, zero follow-up"
            >
              <ol className="grid gap-3">
                {STEPS.map((s, i) => (
                  <li key={s.text} className="flex items-start gap-3">
                    <span className="relative shrink-0">
                      <IconTile icon={s.icon} tone={i === 2 ? "energy" : "brand"} size="sm" />
                      <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-ink-950 text-[9px] font-bold text-white ring-2 ring-white">
                        {i + 1}
                      </span>
                    </span>
                    <p className="text-sm leading-relaxed text-ink-700">{s.text}</p>
                  </li>
                ))}
              </ol>
            </ServiceCard>
            <AsideTips
              items={[
                { icon: <Lightning weight="duotone" />, text: "Share once — the same details work for every customer." },
                { icon: <Bank weight="duotone" />, text: "Works with every bank app, no QR needed." },
              ]}
            />
          </>
        }
      >
        {/* Account card — dark band, Clash Display account number */}
        <div className="relative overflow-hidden rounded-4xl bg-ink-950 p-6 text-white grain sm:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-energy-gradient opacity-40 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl"
          />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  <span className="brand-dot" />
                  Beneficiary
                </p>
                <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em]">
                  {account.beneficiary}
                </p>
              </div>
              <Badge variant="energy" size="sm" dot>
                Auto-credit on
              </Badge>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { k: "Account number", v: account.number, wide: true },
                { k: "IFSC", v: account.ifsc },
                { k: "Branch", v: account.branch },
                { k: "Type", v: "Virtual current" }
              ].map((row) => (
                <div
                  key={row.k}
                  className={cn(
                    "rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm",
                    row.wide && "sm:col-span-2"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                    {row.k}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <p
                      className={cn(
                        "truncate font-semibold tabular-nums",
                        row.wide ? "font-display text-2xl tracking-[0.08em]" : "font-mono text-sm"
                      )}
                    >
                      {row.v}
                    </p>
                    <button
                      type="button"
                      onClick={() => copy(row.k, row.v)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/15 transition hover:bg-white hover:text-ink-950 focus-energy"
                    >
                      {copied === row.k ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied === row.k ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg">
            <Share2 className="h-4 w-4" />
            Share details
          </Button>
          <Button size="lg" variant="outline">Generate QR for collection</Button>
        </div>
      </ServiceLayout>
    </div>
  );
}
