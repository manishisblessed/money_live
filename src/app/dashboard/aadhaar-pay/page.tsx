"use client";

import { useState } from "react";
import { Fingerprint, Banknote, Receipt, FileText } from "lucide-react";
import { Fingerprint as FingerprintGlyph, ShieldCheck, Usb } from "@phosphor-icons/react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import {
  TransactionResult,
  type TxnResult
} from "@/components/dashboard/TransactionResult";
import {
  ServiceLayout,
  ServiceCard,
  Field,
  Notice,
} from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { generateRefId, formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ops = [
  { id: "withdrawal", label: "Cash withdrawal", icon: Banknote },
  { id: "balance", label: "Balance enquiry", icon: Receipt },
  { id: "statement", label: "Mini statement", icon: FileText }
] as const;

type Op = (typeof ops)[number]["id"];

const banks = ["SBI", "PNB", "BoB", "Canara", "Union", "HDFC", "ICICI", "Axis"];

export default function AadhaarPayPage() {
  const [op, setOp] = useState<Op>("withdrawal");
  const [aadhaar, setAadhaar] = useState("");
  const [bank, setBank] = useState(banks[0]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxnResult>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    setLoading(false);
    const meta: Record<string, string | number> =
      op === "balance"
        ? { "Available balance": `₹ ${(Math.random() * 25000 + 1000).toFixed(0)}` }
        : op === "statement"
          ? { "Last 5 transactions": "View in receipt" }
          : { Bank: bank, Mode: "AePS biometric" };
    setResult({
      refId: generateRefId("AEPS"),
      service: `AePS — ${ops.find((o) => o.id === op)!.label}`,
      amount: op === "withdrawal" ? Number(amount) : 0,
      customer: `Aadhaar XXXX XXXX ${aadhaar.slice(-4)}`,
      meta
    });
  }

  const opLabel = ops.find((o) => o.id === op)!.label;
  const maskedAadhaar = aadhaar.length === 12 ? `XXXX XXXX ${aadhaar.slice(-4)}` : aadhaar ? `${aadhaar.length}/12 digits` : "—";
  const amountNum = Number(amount) || 0;
  const ready = aadhaar.length === 12 && (op !== "withdrawal" || amountNum > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Fingerprint}
        title="Aadhaar Pay (AePS)"
        description="Cash withdrawal, balance enquiry & mini statement with the customer's Aadhaar + fingerprint."
      />

      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title={opLabel}
              status={{
                label: ready ? "Ready for biometric" : "Fill the form",
                variant: ready ? "accent" : "default",
                dot: ready,
              }}
              rows={[
                { label: "Aadhaar", value: maskedAadhaar, mono: true, muted: aadhaar.length !== 12 },
                { label: "Bank (IIN)", value: bank },
                { label: "Auth", value: "Fingerprint (RD service)" },
              ]}
              total={op === "withdrawal" ? formatINR(amountNum) : undefined}
              totalLabel="Cash to hand over"
              totalHint="Max ₹10,000 per txn"
            />
            <AsideTips
              title="Before you start"
              items={[
                { icon: <Usb weight="duotone" />, text: "Plug in your registered RD-service biometric device." },
                { icon: <ShieldCheck weight="duotone" />, text: "Fingerprint is captured securely after you submit — nothing is stored on this device." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={submit}
          icon={<IconTile icon={FingerprintGlyph} tone="energy" size="lg" />}
          eyebrow="AePS"
          title="Customer details"
          description="Choose the service, enter Aadhaar and bank — then capture the fingerprint."
        >
          <div className="grid gap-5">
            <Field label="Service">
              <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Service">
                {ops.map((o) => {
                  const Icon = o.icon;
                  const active = op === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setOp(o.id)}
                      data-active={active ? "true" : undefined}
                      className={cn(
                        "gradient-ring flex items-center gap-3 rounded-xl bg-white p-3.5 text-left ring-1 ring-ink-200 transition-[box-shadow,transform,background-color] duration-200 focus-energy",
                        "hover:-translate-y-0.5 hover:shadow-soft",
                        active && "bg-gradient-to-br from-royal-50/70 via-white to-coral-50/50 ring-transparent shadow-energy-sm"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors",
                          active ? "bg-energy-gradient text-white shadow-energy-sm" : "bg-ink-100 text-ink-600"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className={cn("text-sm font-semibold", active ? "text-royal-900" : "text-ink-900")}>
                        {o.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <FloatField
                id="aadhaar"
                label="Aadhaar number (12 digits)"
                required
                mono
                maxLength={12}
                minLength={12}
                inputMode="numeric"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                hint="XXXX XXXX XXXX"
                className="sm:col-span-2"
              />
              <Field label="Bank (IIN)" htmlFor="bank" className={op === "withdrawal" ? undefined : "sm:col-span-2"}>
                <Select id="bank" value={bank} onChange={(e) => setBank(e.target.value)}>
                  {banks.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </Field>
              {op === "withdrawal" && (
                <div>
                  <FloatField
                    id="amount"
                    label="Amount (₹)"
                    type="number"
                    required
                    display
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    hint="Max ₹10,000 per txn"
                  />
                </div>
              )}
            </div>

            {op === "withdrawal" && (
              <AmountChips
                amounts={[500, 1000, 2000, 5000, 10000]}
                value={amount}
                onPick={(v) => setAmount(String(v))}
              />
            )}

            <Notice tone="warning">
              <strong className="font-semibold">Heads up:</strong> connect your authorised RD-service
              biometric device. The customer&apos;s fingerprint is captured securely after you submit.
            </Notice>

            <Button type="submit" size="xl" className="w-full" disabled={loading} isLoading={loading}>
              Capture fingerprint &amp; continue
            </Button>
          </div>
        </ServiceCard>
      </ServiceLayout>

      <TransactionResult result={result} onClose={() => setResult(null)} />
    </div>
  );
}
