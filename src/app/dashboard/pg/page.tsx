"use client";

import { useState } from "react";
import {
  CreditCard,
  Copy,
  Check,
  IndianRupee,
  ArrowLeftRight,
  Percent,
  Banknote
} from "lucide-react";
import { LinkSimple, Lightning, ShieldCheck } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { ServiceLayout, ServiceCard } from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { pgTransactions, type PgTransaction } from "@/lib/data";
import { formatINR, generateRefId } from "@/lib/utils";

export default function PgPage() {
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  function createLink() {
    if (!amount) return;
    const ref = generateRefId("PAY");
    setLink(
      `https://pay.emoney.today/l/${ref.toLowerCase()}?am=${amount}`
    );
    setCopied(false);
  }

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const cols: Column<PgTransaction>[] = [
    { key: "id", header: "Txn ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "orderId", header: "Order", render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
    { key: "mode", header: "Mode" },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold">{formatINR(r.amount)}</span> },
    { key: "fee", header: "Fee", align: "right", render: (r) => (r.fee ? formatINR(r.fee) : "—") },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge
          variant={
            r.status === "Success"
              ? "success"
              : r.status === "Pending"
                ? "warning"
                : r.status === "Refunded"
                  ? "brand"
                  : "danger"
          }
        >
          {r.status}
        </Badge>
      )
    },
    { key: "settlement", header: "Settlement" },
    { key: "date", header: "Date" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payment Gateway"
        title="PG Collections"
        description="Accept UPI, cards, net banking and wallets. Track every order with real-time status and automated T+1 settlement."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Collections" value="₹1.28 L" delta="+14.2%" icon={IndianRupee} tone="brand" />
        <StatCard label="Success Rate" value="96.8%" delta="+0.6%" icon={Percent} tone="accent" />
        <StatCard label="Transactions Today" value="42" delta="+8" icon={ArrowLeftRight} tone="royal" />
        <StatCard label="Pending Settlement" value="₹2.69 L" icon={Banknote} tone="amber" />
      </div>

      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title="Payment link"
              status={
                link
                  ? { label: "Link ready", variant: "accent", dot: true }
                  : { label: "Not generated", variant: "default" }
              }
              rows={[
                { label: "Purpose", value: purpose || "Payment request", muted: !purpose },
                { label: "Accepts", value: "UPI · Cards · Net banking" },
                { label: "Settlement", value: "T+1 · automated", tone: "brand" },
              ]}
              total={amount ? formatINR(Number(amount) || 0) : undefined}
              totalLabel="Customer pays"
              footer={
                link ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-ink-100">
                    <span className="truncate font-mono text-xs font-semibold text-ink-900">{link}</span>
                    <button
                      type="button"
                      onClick={copy}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-ink-100 transition hover:ring-brand-300 focus-energy"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <div className="grid h-20 place-items-center rounded-2xl border border-dashed border-ink-200 bg-white/60 text-xs text-ink-500">
                    Enter an amount and generate a link to see it here.
                  </div>
                )
              }
            />
            <AsideTips
              items={[
                { icon: <Lightning weight="duotone" />, text: "You're notified the moment the customer pays." },
                { icon: <ShieldCheck weight="duotone" />, text: "Every order is tracked with real-time status." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            createLink();
          }}
          icon={<IconTile icon={LinkSimple} tone="energy" size="lg" />}
          eyebrow="Collect remotely"
          title="Create payment link"
          description="Set an amount and a purpose — share the link on WhatsApp or SMS."
        >
          <div className="grid gap-5">
            <div>
              <FloatField
                id="pg-amount"
                label="Amount (₹)"
                type="number"
                display
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <AmountChips
                className="mt-3"
                amounts={[500, 1000, 2000, 5000, 10000]}
                value={amount}
                onPick={(v) => setAmount(String(v))}
              />
            </div>
            <FloatField
              id="pg-purpose"
              label="Purpose (optional)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              hint="e.g. Invoice #4427"
            />
            <Button type="submit" size="xl" className="w-full">
              <CreditCard className="h-4 w-4" /> Generate link
            </Button>
          </div>
        </ServiceCard>
      </ServiceLayout>

      <DataTable
        title="Recent PG transactions"
        description="All orders collected through your payment gateway."
        columns={cols}
        data={pgTransactions}
      />
    </div>
  );
}
