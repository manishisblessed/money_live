"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Receipt, ShieldCheck, Lightning } from "@phosphor-icons/react";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
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
import { OperatorGrid } from "@/components/dashboard/services/OperatorGrid";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { StepHeader } from "@/components/dashboard/services/StepHeader";
import { ChargeBreakdown, BillCard } from "@/components/dashboard/services/ChargeBreakdown";
import { generateRefId, formatINR } from "@/lib/utils";

/** Biller lists longer than this stay a searchable <select>; shorter ones become tap tiles. */
const GRID_MAX = 8;

/**
 * Live BBPS bill payment — works for any category (electricity, water, gas,
 * education, …). Billers come from /api/services/bbps/billers; when the
 * provider publishes each biller's required customer params, the
 * form renders those inputs dynamically. Payment is PIN-confirmed and the
 * PIN travels only in the x-txn-pin header.
 */

type BillerParam = { name: string; dataType: string; optional: boolean };
type Biller = { code: string; name: string; params?: BillerParam[] };

type FetchedBill = {
  customerName: string;
  amount: number;
  dueDate?: string;
  billNumber?: string;
  minAmount?: number;
  maxAmount?: number;
  billFetchRef?: string;
};

const FALLBACK_PARAM = "Consumer Number";

export function BbpsBillForm({
  category,
  serviceTitle,
  consumerLabel = "Consumer number",
  refPrefix = "BILL",
  route,
}: {
  category: "ELECTRICITY" | "WATER" | "GAS" | "EDUCATION" | "INSURANCE" | "BROADBAND";
  serviceTitle: string;
  consumerLabel?: string;
  refPrefix?: string;
  /** Product scope (ServiceRoute key) that prices this bill payment. */
  route?: string;
}) {
  type ChargeQuote = {
    serviceCharge: number;
    gst: number;
    totalCharge: number;
    totalDebit: number;
    commission: number;
  };

  const [billers, setBillers] = useState<Biller[]>([]);
  const [billersSource, setBillersSource] = useState("");
  const [billersError, setBillersError] = useState<string | null>(null);
  const [loadingBillers, setLoadingBillers] = useState(true);
  const [billerCode, setBillerCode] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
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
    setLoadingBillers(true);
    setBillersError(null);
    try {
      const res = await fetch(`/api/services/bbps/billers?category=${category}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.billers) && data.billers.length > 0) {
        setBillers(data.billers);
        setBillersSource(data.source ?? "");
        setBillerCode(data.billers[0].code);
      } else {
        setBillers([]);
        setBillersError(
          typeof data.error === "string" ? data.error : "No billers available for this category yet"
        );
      }
    } catch {
      setBillersError("Could not load billers — check your connection");
    } finally {
      setLoadingBillers(false);
    }
  }, [category]);

  useEffect(() => {
    loadBillers();
  }, [loadBillers]);

  const biller = useMemo(() => billers.find((b) => b.code === billerCode), [billers, billerCode]);

  /** Input fields for the selected biller — its published params, or one generic field. */
  const fields: BillerParam[] = useMemo(() => {
    if (biller?.params && biller.params.length > 0) return biller.params;
    return [{ name: FALLBACK_PARAM, dataType: "ALPHANUMERIC", optional: false }];
  }, [biller]);

  const requiredFilled = fields
    .filter((f) => !f.optional)
    .every((f) => (paramValues[f.name] ?? "").trim().length > 0);

  useEffect(() => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setQuote(null); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch(
          `/api/services/bbps/quote?amount=${amt}&category=${category}${route ? `&route=${encodeURIComponent(route)}` : ""}`
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
  }, [amount, category, route]);

  function resetBill() {
    setBill(null);
    setAmount("");
    setQuote(null);
    setError(null);
  }

  function selectBiller(code: string) {
    setBillerCode(code);
    setParamValues({});
    resetBill();
  }

  /** customerParams sent to fetch/pay: only non-empty values. */
  function customerParams(extra?: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const f of fields) {
      const v = (paramValues[f.name] ?? "").trim();
      if (v) out[f.name] = v;
    }
    return { ...out, ...extra };
  }

  async function fetchBill() {
    if (!requiredFilled || !billerCode) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/services/bbps/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billerCode,
          category,
          customerParams: customerParams(),
          idempotencyKey: generateRefId(`${refPrefix}F`),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Bill fetch failed — verify the details and try again"
        );
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
          category,
          ...(route ? { route } : {}),
          customerParams: customerParams(
            bill.billFetchRef ? { billFetchRef: bill.billFetchRef } : undefined
          ),
          amount: Number(amount),
          idempotencyKey: generateRefId(`${refPrefix}P`),
          ...(bill.customerName ? { customerName: bill.customerName } : {}),
          ...(biller?.name ? { billerName: biller.name } : {}),
        }),
      });
      const data = await res.json();
      if (data.status === "FAILED" || (res.status >= 400 && res.status !== 402)) {
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
      const isPending = data.status === "PROCESSING" || res.status === 202;
      setResult({
        refId: data.refId,
        service: `${serviceTitle} — ${biller?.name ?? billerCode}`,
        amount: Number(amount),
        customer: bill.customerName || Object.values(customerParams())[0],
        meta: {
          Biller: biller?.name ?? billerCode,
          ...(data.data?.receipt ? { "Operator ref": data.data.receipt } : {}),
          ...(isPending ? { Status: "Processing — will be confirmed shortly" } : {}),
        },
      });
      resetBill();
      setParamValues({});
      return null;
    } catch {
      setPinOpen(false);
      setError("Network error — check the transaction history before retrying to avoid a duplicate payment");
      return null;
    } finally {
      setPaying(false);
    }
  }

  // Display-only derivation of where the retailer is in the flow.
  const stage: "biller" | "fetch" | "pay" = !billerCode ? "biller" : !bill ? "fetch" : "pay";
  const amountNum = Number(amount) || 0;
  const firstParam = Object.values(customerParams())[0];
  const useGrid = !loadingBillers && billers.length > 0 && billers.length <= GRID_MAX;

  return (
    <>
      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title={`${serviceTitle} bill`}
              status={
                bill
                  ? { label: "Bill fetched", variant: "accent", dot: true }
                  : { label: "Awaiting bill", variant: "default" }
              }
              rows={[
                { label: "Biller", value: biller?.name ?? "—", muted: !biller },
                {
                  label: fields.length === 1 && fields[0].name === FALLBACK_PARAM ? consumerLabel : "Customer ref",
                  value: firstParam ?? "—",
                  mono: true,
                  muted: !firstParam,
                },
                ...(bill?.customerName ? [{ label: "Customer", value: bill.customerName }] : []),
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
                { icon: <Receipt weight="duotone" />, text: "Fetch the bill first — the biller tells us the exact due amount." },
                { icon: <ShieldCheck weight="duotone" />, text: "Failed payments auto-refund to your wallet." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={(e) => {
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
          }}
          icon={<IconTile icon={Receipt} tone="energy" size="lg" />}
          eyebrow="Bharat BillPay"
          title={`Pay ${serviceTitle.toLowerCase()} bill`}
          description="Pick the biller, fetch the bill, then pay — PIN confirms it."
        >
          <div className="grid gap-5">
            <StepHeader
              layoutId={`bbps-steps-${category}`}
              steps={[
                { key: "biller", label: "Biller" },
                { key: "fetch", label: "Fetch bill" },
                { key: "pay", label: "Pay" },
              ]}
              current={stage}
            />

            <Field
              label="Biller / operator"
              htmlFor="biller"
              hint={
                billersSource && billersSource !== "CATALOG" && billers.length > 0
                  ? `Live BBPS biller list · ${billers.length} billers`
                  : undefined
              }
            >
              {useGrid ? (
                <OperatorGrid
                  name="Biller"
                  options={billers.map((b) => ({ value: b.code, label: b.name }))}
                  value={billerCode}
                  onChange={selectBiller}
                  columns={billers.length > 4 ? 4 : 3}
                  size="sm"
                />
              ) : (
                <Select
                  id="biller"
                  value={billerCode}
                  onChange={(e) => selectBiller(e.target.value)}
                  disabled={loadingBillers || billers.length === 0}
                >
                  {loadingBillers && <option value="">Loading billers…</option>}
                  {!loadingBillers && billers.length === 0 && <option value="">No billers available</option>}
                  {billers.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              )}
              {billersError && (
                <Notice
                  tone="warning"
                  className="mt-2"
                  action={
                    <button
                      type="button"
                      onClick={loadBillers}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  }
                >
                  {billersError}
                </Notice>
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((f) => (
                <FloatField
                  key={f.name}
                  id={`param-${f.name}`}
                  label={`${f.name === FALLBACK_PARAM ? consumerLabel : f.name}${f.optional ? " (optional)" : ""}`}
                  required={!f.optional}
                  mono
                  inputMode={f.dataType === "NUMERIC" ? "numeric" : undefined}
                  hint={f.dataType === "NUMERIC" ? "Digits only" : undefined}
                  value={paramValues[f.name] ?? ""}
                  onChange={(e) => {
                    const v = f.dataType === "NUMERIC" ? e.target.value.replace(/\D/g, "") : e.target.value;
                    setParamValues((p) => ({ ...p, [f.name]: v }));
                    resetBill();
                  }}
                  className={fields.length === 1 ? "sm:col-span-2" : undefined}
                />
              ))}
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
                disabled={fetching || !requiredFilled || !billerCode}
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
                      ...(bill.minAmount !== undefined && bill.minAmount > 0 ? [bill.minAmount] : []),
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
        title={`Pay ${serviceTitle.toLowerCase()} bill`}
        detail={biller?.name}
        amount={Number(amount) || undefined}
        busy={paying}
        onConfirm={payWithPin}
        onCancel={() => !paying && setPinOpen(false)}
      />
      <TransactionResult result={result} onClose={() => setResult(null)} />
    </>
  );
}
