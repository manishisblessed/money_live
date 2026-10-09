"use client";

import { useState } from "react";
import { QrCode, Copy, Check } from "lucide-react";
import { QrCode as QrGlyph, DeviceMobile, Lightning } from "@phosphor-icons/react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { ServiceLayout, ServiceCard } from "@/components/dashboard/services/ServiceLayout";
import { AsideTips } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { formatINR } from "@/lib/utils";

export default function UpiPage() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const upiId = "eMoney@axisbank";
  const link = `upi://pay?pa=${upiId}&pn=eMoney&am=${amount}&tn=${encodeURIComponent(
    note || "eMoney payment"
  )}&cu=INR`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const qrSrc = `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(
    link
  )}`;

  const amountNum = Number(amount) || 0;

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={QrCode}
        title="UPI Collect"
        description="Raise a UPI request or show a QR — customers pay from any UPI app, no POS needed."
      />

      <ServiceLayout
        aside={
          <>
            {/* Live QR card — mirrors the amount / note typed on the left */}
            <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-6 text-center text-white grain">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-energy-gradient opacity-40 blur-3xl"
              />
              <div className="relative">
                <p className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  <span className="brand-dot" />
                  Scan to pay
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em]">
                  Show this QR to your customer
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Works with PhonePe, Google Pay, Paytm &amp; every UPI app.
                </p>
                <div className="mx-auto mt-6 grid h-56 w-56 place-items-center rounded-3xl bg-white p-3 shadow-energy">
                  <img src={qrSrc} alt="QR code" className="h-full w-full rounded-2xl" />
                </div>
                <div className="mt-5 flex flex-col items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/15">
                    Pay to <strong className="font-mono">{upiId}</strong>
                  </span>
                  {amountNum > 0 && (
                    <p className="font-display text-3xl font-semibold tracking-[-0.03em] tabular-nums">
                      {formatINR(amountNum)}
                    </p>
                  )}
                  {note && <p className="text-xs text-white/60">“{note}”</p>}
                </div>
              </div>
            </div>
            <AsideTips
              items={[
                { icon: <Lightning weight="duotone" />, text: "Payments settle to your eMoney wallet instantly." },
                { icon: <DeviceMobile weight="duotone" />, text: "Leave the amount blank to let the customer enter it." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={(e) => e.preventDefault()}
          icon={<IconTile icon={QrGlyph} tone="energy" size="lg" />}
          eyebrow="Accept payment"
          title="Create a UPI request"
          description="Set the amount and an optional note. The QR on the right updates live."
        >
          <div className="grid gap-5">
            <div>
              <FloatField
                id="amount"
                label="Amount (₹)"
                type="number"
                display
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                hint="Optional — leave blank for an open amount"
              />
              <AmountChips
                className="mt-3"
                amounts={[100, 200, 500, 1000, 2000]}
                value={amount}
                onPick={(v) => setAmount(String(v))}
              />
            </div>

            <FloatField
              id="note"
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              hint="e.g. Bill #4421"
            />

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-600">
                Your UPI ID
              </p>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-3 ring-1 ring-ink-100">
                <div className="flex min-w-0 items-center gap-3">
                  <IconTile tone="brand" size="sm" icon={QrGlyph} />
                  <span className="truncate font-mono text-sm font-semibold text-ink-900">{upiId}</span>
                  <Badge variant="accent" size="sm" dot>
                    Active
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-ink-200 transition hover:ring-brand-300 focus-energy"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>

            <Button type="button" size="xl" className="w-full">
              Send payment request
            </Button>
          </div>
        </ServiceCard>
      </ServiceLayout>
    </div>
  );
}
