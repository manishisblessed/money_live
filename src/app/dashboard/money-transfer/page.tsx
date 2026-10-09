"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Bank, Lightning, Percent, Timer } from "@phosphor-icons/react";
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
} from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips, InfoChip } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { OperatorGrid } from "@/components/dashboard/services/OperatorGrid";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { generateRefId, formatINR } from "@/lib/utils";

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Kotak Mahindra Bank",
  "Yes Bank",
  "IndusInd Bank"
];

const MODE_META: Record<string, { meta: string }> = {
  IMPS: { meta: "Instant · 24×7" },
  NEFT: { meta: "Every 30 mins" },
  RTGS: { meta: "₹2 lakh+" },
};

export default function MoneyTransferPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxnResult>(null);
  const [form, setForm] = useState({
    name: "",
    account: "",
    ifsc: "",
    bank: banks[0],
    amount: "",
    mode: "IMPS"
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setResult({
      refId: generateRefId("DMT"),
      service: `Money Transfer (${form.mode}) — ${form.bank}`,
      amount: Number(form.amount),
      customer: form.name,
      meta: {
        Account: form.account,
        IFSC: form.ifsc,
        Charges: "₹ 5"
      }
    });
  }

  const amountNum = Number(form.amount) || 0;
  const ready = Boolean(form.name && form.account && form.ifsc && amountNum > 0);
  const maskedAccount = form.account
    ? form.account.length > 4
      ? `•••• ${form.account.slice(-4)}`
      : form.account
    : "—";

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Send}
        title="Domestic Money Transfer"
        description="Send money to any bank account in India — IMPS, NEFT or RTGS."
      />

      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title="Transfer preview"
              status={{
                label: ready ? "Ready to send" : "Fill the form",
                variant: ready ? "accent" : "default",
                dot: ready,
              }}
              rows={[
                { label: "To", value: form.name || "—", muted: !form.name },
                { label: "Account", value: maskedAccount, mono: true, muted: !form.account },
                { label: "IFSC", value: form.ifsc || "—", mono: true, muted: !form.ifsc },
                { label: "Bank", value: form.bank },
                { label: "Mode", value: form.mode, tone: "brand" },
              ]}
              total={formatINR(amountNum)}
              totalLabel="Beneficiary gets"
              totalHint={MODE_META[form.mode]?.meta}
              footer={
                <div className="flex flex-wrap gap-2">
                  <InfoChip tone="brand" icon={<Timer weight="duotone" />} label={form.mode} value={MODE_META[form.mode]?.meta} />
                  <InfoChip tone="accent" icon={<Percent weight="duotone" />} label="Commission to you" value="0.4–0.6%" />
                </div>
              }
            />
            <AsideTips
              items={[
                { icon: <Lightning weight="duotone" />, text: "IMPS lands instantly, round the clock (₹1 to ₹2 lakh)." },
                { icon: <Bank weight="duotone" />, text: "RTGS is for ₹2 lakh and above — instant on bank hours." },
                { text: "Charges are ₹5–₹25 depending on amount." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={submit}
          icon={<IconTile icon={Bank} tone="energy" size="lg" />}
          eyebrow="Send money"
          title="Beneficiary details"
          description="Enter the account exactly as it appears in the bank passbook."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FloatField
              id="name"
              label="Beneficiary name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              hint="As per bank records"
              className="sm:col-span-2"
            />
            <FloatField
              id="account"
              label="Account number"
              required
              mono
              inputMode="numeric"
              value={form.account}
              onChange={(e) => update("account", e.target.value)}
              hint="9–18 digits"
            />
            <FloatField
              id="ifsc"
              label="IFSC code"
              required
              mono
              value={form.ifsc}
              onChange={(e) => update("ifsc", e.target.value.toUpperCase())}
              hint="e.g. SBIN0001234"
            />
            <Field label="Bank" htmlFor="bank" className="sm:col-span-2">
              <Select
                id="bank"
                value={form.bank}
                onChange={(e) => update("bank", e.target.value)}
              >
                {banks.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Transfer mode" className="sm:col-span-2">
              <OperatorGrid
                name="Transfer mode"
                showLogo={false}
                columns={3}
                size="sm"
                options={["IMPS", "NEFT", "RTGS"].map((m) => ({
                  value: m,
                  label: m,
                  meta: MODE_META[m]?.meta,
                }))}
                value={form.mode}
                onChange={(v) => update("mode", v)}
              />
            </Field>
            <div className="sm:col-span-2">
              <FloatField
                id="amount"
                label="Amount (₹)"
                required
                display
                type="number"
                min={1}
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
              />
              <AmountChips
                className="mt-3"
                prefix="+"
                amounts={[500, 1000, 2000, 5000, 10000]}
                value={form.amount}
                onPick={(v) => update("amount", String(v))}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="xl" className="w-full" disabled={loading} isLoading={loading}>
                Send {form.amount ? formatINR(Number(form.amount)) : "money"}
              </Button>
            </div>
          </div>
        </ServiceCard>
      </ServiceLayout>

      <TransactionResult result={result} onClose={() => setResult(null)} />
    </div>
  );
}
