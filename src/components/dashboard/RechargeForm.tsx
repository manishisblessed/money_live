"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { DeviceMobile, Lightning, ShieldCheck, Television, WifiHigh } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import {
  TransactionResult,
  type TxnResult
} from "@/components/dashboard/TransactionResult";
import { TxnPinDialog } from "@/components/security/TxnPinDialog";
import {
  ServiceLayout,
  ServiceCard,
  Field,
  Notice,
  SecureFootnote,
} from "@/components/dashboard/services/ServiceLayout";
import { SummaryPanel, AsideTips } from "@/components/dashboard/services/SummaryPanel";
import { AmountChips } from "@/components/dashboard/services/AmountChips";
import { OperatorGrid } from "@/components/dashboard/services/OperatorGrid";
import { FloatField } from "@/components/dashboard/services/FloatField";
import { generateRefId, formatINR } from "@/lib/utils";

const TYPE_ICON = {
  MOBILE: DeviceMobile,
  DTH: Television,
  BROADBAND: WifiHigh,
} as const;

/**
 * Recharge (mobile / DTH / broadband) against /api/services/recharge —
 * wallet debit + commission + transaction record all happen server-side.
 * Payment is PIN-confirmed; the PIN travels only in the x-txn-pin header.
 */
export function RechargeForm({
  serviceTitle,
  type,
  numberLabel,
  numberPlaceholder,
  operators,
  amountPresets = [99, 199, 299, 399, 499, 999],
  refPrefix = "RCH"
}: {
  serviceTitle: string;
  type: "MOBILE" | "DTH" | "BROADBAND";
  numberLabel: string;
  numberPlaceholder: string;
  operators: string[];
  amountPresets?: number[];
  refPrefix?: string;
}) {
  const [number, setNumber] = useState("");
  const [operator, setOperator] = useState(operators[0]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [result, setResult] = useState<TxnResult>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!number || !amount) return;
    setError(null);
    setPinOpen(true);
  }

  /** Called by the PIN dialog. Returns an error string to keep it open, null on success. */
  async function rechargeWithPin(pin: string): Promise<string | null> {
    setLoading(true);
    try {
      const res = await fetch("/api/services/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-txn-pin": pin },
        body: JSON.stringify({
          type,
          operatorCode: operator,
          number,
          amount: Number(amount),
          idempotencyKey: generateRefId(refPrefix),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "FAILED") {
        // PIN problems stay inside the dialog; other failures surface on the form.
        if (data.txnPin) return typeof data.error === "string" ? data.error : "PIN verification failed";
        setPinOpen(false);
        setError(
          typeof data.error === "string"
            ? data.error
            : "Recharge failed — any debited amount is auto-refunded to your wallet"
        );
        return null;
      }
      setPinOpen(false);
      // PROCESSING/INITIATED = provider accepted but not yet confirmed. Show a
      // pending receipt (never a success claim) so the agent doesn't re-charge.
      const pending = data.status === "PROCESSING" || data.status === "INITIATED";
      setResult({
        status: pending ? "PENDING" : "SUCCESS",
        refId: data.refId,
        service: `${serviceTitle} — ${operator}`,
        amount: Number(amount),
        customer: number,
        meta: { Operator: operator }
      });
      setNumber("");
      setAmount("");
      return null;
    } catch {
      setPinOpen(false);
      setError("Network error — check the transaction history before retrying to avoid a duplicate recharge");
      return null;
    } finally {
      setLoading(false);
    }
  }

  const Glyph = TYPE_ICON[type];
  const amountNum = Number(amount) || 0;
  const ready = Boolean(number) && amountNum > 0;

  return (
    <>
      <ServiceLayout
        aside={
          <>
            <SummaryPanel
              title={serviceTitle}
              status={{
                label: ready ? "Ready to pay" : "Fill the form",
                variant: ready ? "accent" : "default",
                dot: ready,
              }}
              rows={[
                { label: numberLabel, value: number || "—", mono: true, muted: !number },
                { label: "Operator", value: operator },
                { label: "Paid from", value: "eMoney wallet" },
              ]}
              total={formatINR(amountNum)}
              totalLabel="You pay"
              totalHint="Instant confirmation"
            />
            <AsideTips
              items={[
                { icon: <Lightning weight="duotone" />, text: "Most recharges confirm in under 10 seconds." },
                { icon: <ShieldCheck weight="duotone" />, text: "Failed recharges auto-refund to your wallet — no follow-up needed." },
              ]}
            />
          </>
        }
      >
        <ServiceCard
          as="form"
          onSubmit={submit}
          icon={<IconTile icon={Glyph} tone="energy" size="lg" />}
          eyebrow="Recharge"
          title={serviceTitle}
          description="Pick the operator, enter the number and amount — PIN confirms it."
        >
          <div className="grid gap-5">
            <Field label="Operator">
              <OperatorGrid
                name="Operator"
                options={operators.map((o) => ({ value: o, label: o }))}
                value={operator}
                onChange={setOperator}
                columns={operators.length > 4 ? 4 : 3}
                size="sm"
              />
            </Field>

            <FloatField
              id="number"
              label={numberLabel}
              required
              mono
              inputMode={type === "MOBILE" ? "tel" : undefined}
              autoComplete="off"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              hint={numberPlaceholder}
            />

            <div>
              <FloatField
                id="amount"
                label="Amount (₹)"
                required
                display
                type="number"
                min={1}
                max={10000}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <AmountChips
                className="mt-3"
                amounts={amountPresets}
                value={amount}
                onPick={(v) => setAmount(String(v))}
              />
            </div>

            {error && (
              <Notice tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
                {error}
              </Notice>
            )}

            <div>
              <Button type="submit" size="xl" className="w-full" disabled={loading} isLoading={loading}>
                Pay {amount ? formatINR(Number(amount)) : "now"}
              </Button>
              <SecureFootnote />
            </div>
          </div>
        </ServiceCard>
      </ServiceLayout>
      <TxnPinDialog
        open={pinOpen}
        title={serviceTitle}
        detail={`${operator} · ${number}`}
        amount={Number(amount) || undefined}
        busy={loading}
        onConfirm={rechargeWithPin}
        onCancel={() => !loading && setPinOpen(false)}
      />
      <TransactionResult result={result} onClose={() => setResult(null)} />
    </>
  );
}
