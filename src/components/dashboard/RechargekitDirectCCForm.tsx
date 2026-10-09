"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
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
import { FloatField } from "@/components/dashboard/services/FloatField";
import { OperatorGrid } from "@/components/dashboard/services/OperatorGrid";
import { ChargeBreakdown } from "@/components/dashboard/services/ChargeBreakdown";
import { generateRefId, formatINR } from "@/lib/utils";

type Operator = {
  operatorId: string;
  operatorName: string;
  operatorCode: string;
  serviceName?: string;
};

/** Canonical IFSC: 4 letters, a 0, then 6 alphanumerics (e.g. ICIC0001234). */
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Transfer types accepted by the RechargeKit CC payment API. */
const TRANSFER_TYPES = [
  { value: "5", label: "IMPS (instant)" },
  { value: "6", label: "NEFT" },
] as const;

type ChargeQuote = {
  serviceCharge: number;
  gst: number;
  totalCharge: number;
  totalDebit: number;
  commission: number;
};

export function RechargekitDirectCCForm() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [operatorCode, setOperatorCode] = useState("");
  const [loadingOps, setLoadingOps] = useState(true);

  const [mobile, setMobile] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [amount, setAmount] = useState("");
  const [transferType, setTransferType] = useState<string>("5");

  const [quote, setQuote] = useState<ChargeQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [result, setResult] = useState<TxnResult>(null);

  const loadOperators = useCallback(async (refresh = false) => {
    setLoadingOps(true);
    try {
      const url = `/api/services/rechargekit-direct/operators${refresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && Array.isArray(data.operators)) {
        setOperators(data.operators);
        if (data.operators[0] && !refresh) {
          setOperatorCode(data.operators[0].operatorCode);
        }
      } else {
        setError(data.error ?? "Could not load operators");
      }
    } catch {
      setError("Could not load operators — check your connection");
    } finally {
      setLoadingOps(false);
    }
  }, []);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  const selectedOp = useMemo(
    () => operators.find((o) => o.operatorCode === operatorCode) ?? null,
    [operators, operatorCode]
  );

  // The direct operator list carries no IFSC, so we pre-fill the bank name from
  // the selected operator (still editable) and always collect the IFSC manually.
  useEffect(() => {
    if (!selectedOp) return;
    setBankName(selectedOp.operatorName);
  }, [selectedOp]);

  const inputsValid = useMemo(
    () =>
      /^\d{10}$/.test(mobile) &&
      /^\d{13,19}$/.test(cardNumber) &&
      IFSC_RE.test(ifsc) &&
      bankName.length >= 2 &&
      beneficiaryName.length >= 2 &&
      operatorCode.length > 0 &&
      (transferType === "5" || transferType === "6") &&
      Number(amount) > 0,
    [mobile, cardNumber, ifsc, bankName, beneficiaryName, operatorCode, transferType, amount]
  );

  // Fetch charges when amount changes
  useEffect(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch("/api/services/rechargekit-direct/charges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amt }),
        });
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
      } catch {
        /* swallow */
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount]);

  function resetForm() {
    setCardNumber("");
    setMobile("");
    setIfsc("");
    setBeneficiaryName("");
    setAmount("");
    setQuote(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputsValid) return;
    setError(null);
    setProcessing(null);
    setPinOpen(true);
  }

  async function payWithPin(pin: string): Promise<string | null> {
    setPaying(true);
    try {
      const res = await fetch("/api/services/rechargekit-direct/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-txn-pin": pin },
        body: JSON.stringify({
          mobileNo: mobile,
          accountNo: cardNumber,
          ifsc,
          bankName,
          beneficiaryName,
          amount: Number(amount),
          transferType,
          operatorCode,
          idempotencyKey: generateRefId("RKOD"),
        }),
      });
      const data = await res.json();

      if (data.txnPin) {
        return typeof data.error === "string"
          ? data.error
          : "PIN verification failed";
      }

      if (data.status === "PROCESSING" || data.status === "INITIATED") {
        setPinOpen(false);
        setProcessing(
          "Payment is being processed. Check your transaction history for the final status — do NOT re-submit."
        );
        resetForm();
        return null;
      }

      if (!res.ok || data.status !== "SUCCESS") {
        setPinOpen(false);
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Payment failed — any debited amount is auto-refunded to your wallet";

        if (data.code === "INSUFFICIENT_BALANCE") {
          setError(
            `Insufficient wallet balance. Required: ${formatINR(data.required_amount ?? 0)}, Available: ${formatINR(data.wallet_balance ?? 0)}`
          );
        } else {
          setError(msg);
        }
        return null;
      }

      setPinOpen(false);
      setResult({
        refId: data.refId,
        service: `Offline CC Bill Payment — ${bankName}`,
        amount: Number(amount),
        customer: beneficiaryName,
        meta: {
          "Card ending": cardNumber.slice(-4),
          "Transfer type": transferType === "5" ? "IMPS" : "NEFT",
          ...(data.data?.operatorReference
            ? { "Operator ref": data.data.operatorReference }
            : {}),
          ...(data.data?.orderId ? { "Order ID": data.data.orderId } : {}),
        },
      });
      resetForm();
      return null;
    } catch {
      setPinOpen(false);
      // Network error — DO NOT retry pay. Check transaction history.
      setError(
        "Network error — check your transaction history before retrying. Do NOT re-submit the payment."
      );
      return null;
    } finally {
      setPaying(false);
    }
  }

  const amountNum = Number(amount) || 0;
  const ifscInvalid = ifsc.length > 0 && !IFSC_RE.test(ifsc);
  const transferLabel = TRANSFER_TYPES.find((t) => t.value === transferType)?.label ?? transferType;

  return (
    <>
      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title="Offline CC payment"
              status={
                inputsValid
                  ? { label: "Ready to pay", variant: "accent", dot: true }
                  : { label: "Fill the form", variant: "default" }
              }
              rows={[
                {
                  label: "Bank",
                  value: bankName ? (
                    <span className="inline-flex items-center gap-1.5">
                      <BankLogo name={bankName} size={18} />
                      {bankName}
                    </span>
                  ) : (
                    "—"
                  ),
                  muted: !bankName,
                },
                { label: "Card", value: cardNumber ? `•••• ${cardNumber.slice(-4)}` : "—", mono: true, muted: !cardNumber },
                { label: "Cardholder", value: beneficiaryName || "—", muted: !beneficiaryName },
                { label: "IFSC", value: ifsc || "—", mono: true, muted: !ifsc },
                { label: "Transfer", value: transferLabel, tone: "brand" },
                ...(quote && amountNum > 0
                  ? [
                      { label: "Payment amount", value: formatINR(amountNum) },
                      { label: "Service charge", value: formatINR(quote.serviceCharge) },
                      ...(quote.gst > 0 ? [{ label: "GST (18%)", value: formatINR(quote.gst) }] : []),
                    ]
                  : []),
              ]}
              total={formatINR(quote && amountNum > 0 ? quote.totalDebit : amountNum)}
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
                { icon: <ShieldCheck weight="duotone" />, text: "The card number is sent securely and never stored." },
                { icon: <CreditCard weight="duotone" />, text: "IMPS lands instantly; NEFT settles in the next batch." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={handleSubmit}
          icon={<IconTile icon={CreditCard} tone="energy" size="lg" />}
          eyebrow="RechargeKit direct"
          title="Offline CC Bill Payment"
          description="Enter the full card number, bank and amount — charges show before you confirm."
        >
          <div className="grid gap-5">
            <Field
              label="Card issuer / bank"
              htmlFor="operator"
              hint={!loadingOps && operators.length > 0 ? `${operators.length} operators available` : undefined}
            >
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <OperatorSelect
                    id="operator"
                    value={operatorCode}
                    onChange={setOperatorCode}
                    options={operators.map((op) => ({
                      value: op.operatorCode,
                      label: op.operatorName,
                    }))}
                    loading={loadingOps}
                    disabled={loadingOps}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadOperators(true)}
                  disabled={loadingOps}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-ink-500 ring-1 ring-ink-200 transition hover:bg-ink-50 hover:text-ink-700 focus-energy disabled:opacity-50"
                  title="Refresh operator list"
                  aria-label="Refresh operator list"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingOps ? "animate-spin" : ""}`} />
                </button>
              </div>
            </Field>

            <FloatField
              id="cardNumber"
              label="Credit card number (full)"
              required
              mono
              inputMode="numeric"
              maxLength={19}
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))
              }
              hint="Sent securely, never stored"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FloatField
                id="mobile"
                label="Registered mobile number"
                required
                mono
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                hint="10-digit mobile"
              />
              {/* IFSC — always collected manually for the direct rail. */}
              <FloatField
                id="ifsc"
                label="Card IFSC code"
                required
                mono
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))}
                error={ifscInvalid ? "Enter a valid IFSC (format: ICIC0001234)." : undefined}
                hint="e.g. ICIC0000001"
              />
              {/* Bank name — pre-filled from operator, editable. */}
              <FloatField
                id="bankName"
                label="Bank name"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="sm:col-span-2"
              />
            </div>

            <Field label="Transfer type">
              <OperatorGrid
                name="Transfer type"
                showLogo={false}
                columns={2}
                size="sm"
                options={TRANSFER_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                value={transferType}
                onChange={setTransferType}
              />
            </Field>

            <FloatField
              id="beneficiaryName"
              label="Cardholder name"
              required
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              hint="Name as printed on the card"
            />

            <FloatField
              id="amount"
              label="Amount to pay (₹)"
              required
              display
              type="number"
              min={1}
              max={500000}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {quote && amountNum > 0 && (
              <ChargeBreakdown
                amount={amountNum}
                amountLabel="Payment amount"
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

            {error && (
              <Notice tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
                {error}
              </Notice>
            )}

            {processing && (
              <Notice tone="warning" icon={<Loader2 className="h-4 w-4 animate-spin" />}>
                {processing}
              </Notice>
            )}

            <div>
              <Button
                type="submit"
                size="xl"
                className="w-full"
                disabled={paying || !inputsValid}
                isLoading={paying}
              >
                Pay{" "}
                {quote
                  ? formatINR(quote.totalDebit)
                  : amount
                    ? formatINR(Number(amount))
                    : "credit card"}
              </Button>
              <SecureFootnote />
            </div>
          </div>
        </ServiceCard>
      </ServiceLayout>

      <TxnPinDialog
        open={pinOpen}
        title="Pay credit card"
        detail={`${bankName} · Card ****${cardNumber.slice(-4)}`}
        amount={Number(amount) || undefined}
        busy={paying}
        onConfirm={payWithPin}
        onCancel={() => !paying && setPinOpen(false)}
      />
      <TransactionResult result={result} onClose={() => setResult(null)} />
    </>
  );
}
