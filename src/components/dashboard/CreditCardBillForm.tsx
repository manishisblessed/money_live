"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { CreditCard, Lightning, ShieldCheck } from "@phosphor-icons/react";
import { OperatorSelect } from "@/components/ui/OperatorSelect";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { BankLogo } from "@/components/dashboard/BankLogo";
import {
  TransactionResult,
  type TxnResult,
} from "@/components/dashboard/TransactionResult";
import { TxnPinDialog } from "@/components/security/TxnPinDialog";
import {
  ServiceLayout,
  ServiceCard,
  Field,
  Notice,
  SecureFootnote,
} from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips, InfoChip } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { StepHeader } from "@/components/dashboard/services/StepHeader";
import { ChargeBreakdown, BillCard } from "@/components/dashboard/services/ChargeBreakdown";
import { generateRefId, formatINR } from "@/lib/utils";

/**
 * Live credit card bill payment via BBPS (Same Day Pay2New).
 * Flow: billers → fetch bill (card last 4 + registered mobile) → pay with
 * the billFetchRef returned by fetch. Amounts and idempotency keys are
 * server-validated; this form only orchestrates the calls.
 */

type Biller = { code: string; name: string };

type FetchedBill = {
  customerName: string;
  amount: number;
  dueDate?: string;
  billNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  billFetchRef?: string;
};

type ChargeQuote = {
  serviceCharge: number;
  gst: number;
  totalCharge: number;
  totalDebit: number;
  commission: number;
};

export function CreditCardBillForm({ route }: { route?: string } = {}) {
  const [billers, setBillers] = useState<Biller[]>([]);
  const [billersSource, setBillersSource] = useState<string>("");
  const [billerCode, setBillerCode] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [mobile, setMobile] = useState("");
  const [bill, setBill] = useState<FetchedBill | null>(null);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<ChargeQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [result, setResult] = useState<TxnResult>(null);

  const loadBillers = useCallback(async () => {
    try {
      const res = await fetch("/api/services/bbps/billers?category=CREDIT_CARD");
      const data = await res.json();
      if (res.ok && Array.isArray(data.billers)) {
        setBillers(data.billers);
        setBillersSource(data.source ?? "");
        if (data.billers[0]) setBillerCode(data.billers[0].code);
      } else {
        setError(data.error ?? "Could not load billers");
      }
    } catch {
      setError("Could not load billers — check your connection");
    }
  }, []);

  useEffect(() => {
    loadBillers();
  }, [loadBillers]);

  const inputsValid = useMemo(
    () => /^\d{4}$/.test(cardLast4) && /^\d{10}$/.test(mobile) && billerCode,
    [cardLast4, mobile, billerCode]
  );

  useEffect(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setQuote(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch(
          `/api/services/bbps/quote?amount=${amt}&category=CREDIT_CARD${route ? `&route=${encodeURIComponent(route)}` : ""}`
        );
        if (!cancelled && res.ok) {
          const data = await res.json();
          setQuote({
            serviceCharge: data.serviceCharge,
            gst: data.gst,
            totalCharge: data.totalCharge,
            totalDebit: data.totalDebit,
            commission: data.commission,
          });
        }
      } catch { /* swallow */ }
      finally { if (!cancelled) setQuoteLoading(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [amount, route]);

  function resetBill() {
    setBill(null);
    setAmount("");
    setQuote(null);
    setError(null);
  }

  async function fetchBill() {
    if (!inputsValid) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/services/bbps/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billerCode,
          category: "CREDIT_CARD",
          customerParams: { number: cardLast4, customerNumber: mobile },
          idempotencyKey: generateRefId("CCFETCH"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Bill fetch failed — verify the card digits and registered mobile");
        return;
      }
      setBill(data as FetchedBill);
      setAmount("");
    } catch {
      setError("Network error while fetching the bill");
    } finally {
      setFetching(false);
    }
  }

  function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!bill || !amount) return;
    const amt = Number(amount);
    const maxAllowed = bill.maxAmount ?? 500000;
    if (amt > maxAllowed) {
      setError(`Amount exceeds the maximum payable limit of ${formatINR(maxAllowed)}`);
      return;
    }
    setError(null);
    setPinOpen(true);
  }

  /** Called by the PIN dialog. Returns an error string to keep it open, null on success. */
  async function payWithPin(pin: string): Promise<string | null> {
    if (!bill) return "No bill loaded";
    setPaying(true);
    try {
      const res = await fetch("/api/services/bbps/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-txn-pin": pin },
        body: JSON.stringify({
          billerCode,
          category: "CREDIT_CARD",
          ...(route ? { route } : {}),
          customerParams: {
            number: cardLast4,
            customerNumber: mobile,
            ...(bill.billFetchRef ? { billFetchRef: bill.billFetchRef } : {}),
          },
          amount: Number(amount),
          idempotencyKey: generateRefId("CCPAY"),
          ...(bill.customerName ? { customerName: bill.customerName } : {}),
          ...(() => {
            const name = billers.find((b) => b.code === billerCode)?.name;
            return name ? { billerName: name } : {};
          })(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "SUCCESS") {
        // PIN problems stay inside the dialog; other failures surface on the form.
        if (data.txnPin) return typeof data.error === "string" ? data.error : "PIN verification failed";
        setPinOpen(false);
        setError(
          typeof data.error === "string"
            ? data.error
            : "Payment failed — any debited amount is auto-refunded to your wallet"
        );
        return null;
      }
      setPinOpen(false);
      setResult({
        refId: data.refId,
        service: `Credit Card Bill — ${billers.find((b) => b.code === billerCode)?.name ?? billerCode}`,
        amount: Number(amount),
        customer: bill.customerName,
        meta: {
          "Card ending": cardLast4,
          ...(data.data?.receipt ? { "Operator ref": data.data.receipt } : {}),
        },
      });
      resetBill();
      return null;
    } catch {
      setPinOpen(false);
      setError("Network error — check the transaction history before retrying to avoid a duplicate payment");
      return null;
    } finally {
      setPaying(false);
    }
  }

  const issuerName = billers.find((b) => b.code === billerCode)?.name;
  const stage: "card" | "fetch" | "pay" = !inputsValid ? "card" : !bill ? "fetch" : "pay";
  const amountNum = Number(amount) || 0;

  return (
    <>
      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title="Credit card bill"
              status={
                bill
                  ? { label: "Bill fetched", variant: "accent", dot: true }
                  : { label: "Awaiting bill", variant: "default" }
              }
              rows={[
                {
                  label: "Issuer",
                  value: issuerName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <BankLogo name={issuerName} size={18} />
                      {issuerName}
                    </span>
                  ) : (
                    "—"
                  ),
                  muted: !issuerName,
                },
                { label: "Card", value: cardLast4 ? `•••• ${cardLast4}` : "—", mono: true, muted: !cardLast4 },
                { label: "Mobile", value: mobile || "—", mono: true, muted: !mobile },
                ...(bill?.customerName ? [{ label: "Cardholder", value: bill.customerName }] : []),
                ...(bill?.dueDate ? [{ label: "Due", value: bill.dueDate }] : []),
                ...(bill ? [{ label: "Bill amount", value: formatINR(bill.amount) }] : []),
                ...(quote && amountNum > 0
                  ? [
                      { label: "Service charge", value: formatINR(quote.serviceCharge) },
                      ...(quote.gst > 0 ? [{ label: "GST (18%)", value: formatINR(quote.gst) }] : []),
                    ]
                  : []),
              ]}
              total={bill ? formatINR(quote && amountNum > 0 ? quote.totalDebit : amountNum) : undefined}
              totalLabel="Debit from wallet"
              totalHint={quoteLoading && amountNum > 0 ? "Calculating charges…" : undefined}
              footer={
                quote && quote.commission > 0 && amountNum > 0 ? (
                  <InfoChip
                    tone="accent"
                    icon={<Lightning weight="duotone" />}
                    label="Commission on this txn"
                    value={formatINR(quote.commission)}
                  />
                ) : undefined
              }
            />
            <AsideTips
              items={[
                { icon: <CreditCard weight="duotone" />, text: "Only the last 4 digits and the registered mobile are needed to fetch the bill." },
                { icon: <ShieldCheck weight="duotone" />, text: "Same Day BBPS — failed payments auto-refund to your wallet." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={pay}
          icon={<IconTile icon={CreditCard} tone="energy" size="lg" />}
          eyebrow="Same Day BBPS"
          title="Pay credit card bill"
          description="Pick the issuer, fetch the live bill, then pay — PIN confirms it."
        >
          <div className="grid gap-5">
            <StepHeader
              layoutId="cc-bill-steps"
              steps={[
                { key: "card", label: "Card details" },
                { key: "fetch", label: "Fetch bill" },
                { key: "pay", label: "Pay" },
              ]}
              current={stage}
            />

            <Field
              label="Card issuer"
              htmlFor="biller"
              hint={
                billersSource && billersSource !== "CATALOG"
                  ? `Live biller list · ${billers.length} issuers`
                  : undefined
              }
            >
              <OperatorSelect
                id="biller"
                value={billerCode}
                onChange={(code) => {
                  setBillerCode(code);
                  resetBill();
                }}
                options={billers.map((b) => ({ value: b.code, label: b.name }))}
                loading={billers.length === 0}
                loadingText="Loading billers…"
                placeholder="Select card issuer"
                emptyText="No issuers found"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <FloatField
                id="card4"
                label="Card number — last 4 digits"
                required
                mono
                inputMode="numeric"
                maxLength={4}
                hint="e.g. 5008"
                value={cardLast4}
                onChange={(e) => {
                  setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4));
                  resetBill();
                }}
              />
              <FloatField
                id="mobile"
                label="Registered mobile number"
                required
                mono
                inputMode="numeric"
                maxLength={10}
                hint="10-digit mobile linked to the card"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                  resetBill();
                }}
              />
            </div>

            {error && (
              <Notice tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
                {error}
              </Notice>
            )}

            {!bill ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={fetchBill}
                disabled={fetching || !inputsValid}
                isLoading={fetching}
              >
                Fetch bill
              </Button>
            ) : (
              <BillCard
                customerName={bill.customerName}
                dueDate={bill.dueDate}
                amount={bill.amount}
                minAmount={bill.minAmount}
                maxAmount={bill.maxAmount}
                onChange={resetBill}
              />
            )}

            {bill && (
              <>
                <div>
                  <FloatField
                    id="amount"
                    label="Amount to pay (₹)"
                    required
                    display
                    type="number"
                    min={1}
                    max={bill.maxAmount ?? 500000}
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <AmountChips
                    className="mt-3"
                    amounts={[
                      ...(bill.minAmount !== undefined ? [bill.minAmount] : []),
                      bill.amount,
                    ].filter((v, i, arr) => arr.indexOf(v) === i)}
                    value={amount}
                    onPick={(v) => setAmount(String(v))}
                    render={(v) =>
                      v === bill.amount
                        ? `Total due — ${formatINR(v)}`
                        : `Minimum due — ${formatINR(v)}`
                    }
                  />
                </div>
                {quote && amountNum > 0 && (
                  <ChargeBreakdown
                    amount={amountNum}
                    serviceCharge={quote.serviceCharge}
                    gst={quote.gst}
                    totalDebit={quote.totalDebit}
                    commission={quote.commission}
                    loading={quoteLoading}
                  />
                )}
                {quoteLoading && !quote && amountNum > 0 && (
                  <p className="text-center text-xs text-ink-400 animate-pulse">Calculating charges…</p>
                )}
                <div>
                  <Button type="submit" size="xl" className="w-full" disabled={paying || !amount} isLoading={paying}>
                    Pay {quote ? formatINR(quote.totalDebit) : amount ? formatINR(Number(amount)) : "bill"}
                  </Button>
                  <SecureFootnote />
                </div>
              </>
            )}
          </div>
        </ServiceCard>
      </ServiceLayout>
      <TxnPinDialog
        open={pinOpen}
        title="Pay credit card bill"
        detail={billers.find((b) => b.code === billerCode)?.name}
        amount={Number(amount) || undefined}
        busy={paying}
        onConfirm={payWithPin}
        onCancel={() => !paying && setPinOpen(false)}
      />
      <TransactionResult result={result} onClose={() => setResult(null)} />
    </>
  );
}
