import { type ServiceCode, type TxnStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPartner } from "@/lib/partners";
import { rechargekitStatus } from "@/lib/partners/sameday-rechargekit";
import {
  finalizeServiceTransaction,
  correctTerminalToSuccess,
  FINALIZABLE_TXN_SELECT,
} from "@/lib/services/finalize";
import { deriveTxnRefs } from "./refs";

/**
 * Targeted, provider-VERIFIED reconciliation of a SINGLE transaction — the
 * engine behind the admin "Resolve / verify with provider" action and the
 * one-off resolver script.
 *
 * It never flips money on an admin's say-so: it re-checks the provider's own
 * status API first (by any stored ref, plus an optional admin-supplied pay-step
 * ref recovered from the provider panel). Then:
 *   - a NON-TERMINAL (NEEDS_REVIEW/PROCESSING) row settles or refunds via the
 *     shared finalizer,
 *   - an already-TERMINAL FAILED/REFUNDED row that the provider confirms SUCCESS
 *     is promoted via the corrective finalizer, with a LIEN clawback of any
 *     earlier refund (never a negative wallet).
 */

const BBPS_SERVICES: ServiceCode[] = [
  "BILL_ELECTRICITY", "BILL_WATER", "BILL_GAS",
  "BILL_CREDIT_CARD", "BILL_EDUCATION", "BILL_INSURANCE",
  "RECHARGE_BROADBAND",
];

type Rail = "bbps" | "rechargekit";
type ProviderStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

function railFor(partner: string | null, service: ServiceCode): Rail | null {
  if (partner === "SAMEDAY_RECHARGEKIT") return "rechargekit";
  // BBPS is served only by Pay2New. BILL_CREDIT_CARD
  // but has no status API, so it is not auto-resolvable here.
  if ((partner === "SAMEDAY_PAY2NEW" || partner === null) && BBPS_SERVICES.includes(service)) return "bbps";
  return null;
}

/** Try every candidate ref against the rail's status API; first hit wins. */
async function resolveProviderStatus(
  rail: Rail,
  refs: string[]
): Promise<{ status: ProviderStatus; payRef: string | null; amount: number | null; raw: unknown } | null> {
  if (rail === "rechargekit") {
    for (const ref of refs) {
      let r = await rechargekitStatus({ txnId: ref });
      if (!r.ok) r = await rechargekitStatus({ requestId: ref });
      if (r.ok)
        return {
          status: r.data.status,
          payRef: r.data.txnId || r.data.requestId || ref,
          amount: typeof r.data.amount === "number" && r.data.amount > 0 ? r.data.amount : null,
          raw: r.raw,
        };
    }
    return null;
  }
  const bbps = getPartner("bbps");
  if (!bbps.status) return null;
  for (const ref of refs) {
    let r = await bbps.status({ orderId: ref });
    if (!r.ok) r = await bbps.status({ requestId: ref });
    if (!r.ok) r = await bbps.status({ billFetchRef: ref });
    if (r.ok)
      return {
        status: r.data.status,
        payRef: r.data.orderId ?? r.data.requestId ?? ref,
        amount: typeof r.data.amount === "number" && r.data.amount > 0 ? r.data.amount : null,
        raw: r.raw,
      };
  }
  return null;
}

/** True when the provider-reported amount matches the row (or is unknown). */
function providerAmountMatches(providerAmount: number | null, rowAmount: number): boolean {
  if (providerAmount == null) return true; // unknown → defer to unique-constraint backstop
  return Math.abs(providerAmount - rowAmount) <= 0.01;
}

export type CorrectOneResult =
  | { found: false }
  | {
      found: true;
      refId: string;
      rail: Rail;
      status: TxnStatus;
      providerStatus: ProviderStatus | "UNRESOLVED" | "NOT_POLLED";
      outcome:
        | "corrected" // FAILED/REFUNDED → SUCCESS (clawback if a refund existed)
        | "settled" // non-terminal → SUCCESS
        | "refunded" // non-terminal → FAILED/REFUNDED (reserve returned)
        | "noop" // already consistent with the provider
        | "unresolved" // provider couldn't confirm from any ref
        | "amount_mismatch" // provider SUCCESS but a DIFFERENT amount (twin attempt)
        | "not_applicable"; // rail has no status API / unsupported service
      providerAmount?: number;
      clawback?: { placed: boolean; refunded: number; lienId: string | null };
    };

export async function correctOneTransaction(
  ref: string,
  opts: { actorId: string; providerRef?: string; source?: string; remarks?: string }
): Promise<CorrectOneResult> {
  const txn = await prisma.transaction.findFirst({
    where: { OR: [{ refId: ref }, { partnerTxnId: ref }] },
    select: { ...FINALIZABLE_TXN_SELECT, request: true, response: true },
  });
  if (!txn) return { found: false };

  const rail = railFor(txn.partner, txn.service);
  if (!rail) {
    return { found: true, refId: txn.refId, rail: "bbps", status: txn.status, providerStatus: "NOT_POLLED", outcome: "not_applicable" };
  }

  const refs = Array.from(
    new Set([opts.providerRef, ...deriveTxnRefs({ partnerTxnId: txn.partnerTxnId, request: txn.request, response: txn.response })].filter(Boolean) as string[])
  );
  const resolved = await resolveProviderStatus(rail, refs);
  const source = opts.source ?? "admin_resolve";

  if (!resolved) {
    return { found: true, refId: txn.refId, rail, status: txn.status, providerStatus: "UNRESOLVED", outcome: "unresolved" };
  }

  const isTerminalFailed = txn.status === "FAILED" || txn.status === "REFUNDED";
  const partnerTxnId = resolved.payRef ?? txn.partnerTxnId;

  // Already-terminal failed row that the provider confirms SUCCESS → corrective
  // promotion + lien clawback.
  if (isTerminalFailed) {
    if (resolved.status === "SUCCESS") {
      // Amount cross-check BEFORE any clawback: if the provider confirms SUCCESS
      // for a DIFFERENT amount than this row, this is almost certainly a twin
      // double-attempt (same bill_fetch_ref, two amounts). Clawing back here
      // could hit the wrong leg — refuse and flag for a human instead.
      if (!providerAmountMatches(resolved.amount, Number(txn.amount))) {
        await prisma.auditLog.create({
          data: {
            userId: opts.actorId,
            action: "txn.resolve.amount_mismatch",
            entity: "Transaction",
            entityId: txn.id,
            meta: {
              refId: txn.refId,
              rowAmount: Number(txn.amount),
              providerAmount: resolved.amount,
              source,
            },
          },
        });
        return {
          found: true,
          refId: txn.refId,
          rail,
          status: txn.status,
          providerStatus: "SUCCESS",
          outcome: "amount_mismatch",
          providerAmount: resolved.amount ?? undefined,
        };
      }
      const r = await correctTerminalToSuccess({ txn, partnerTxnId, raw: resolved.raw, actorId: opts.actorId, source, remarks: opts.remarks });
      return {
        found: true,
        refId: txn.refId,
        rail,
        status: txn.status,
        providerStatus: "SUCCESS",
        outcome: r.corrected ? "corrected" : "noop",
        clawback: { placed: r.clawbackPlaced, refunded: r.refunded, lienId: r.lienId },
      };
    }
    // Provider agrees it failed (or still pending) — nothing to correct.
    return { found: true, refId: txn.refId, rail, status: txn.status, providerStatus: resolved.status, outcome: "noop" };
  }

  // Non-terminal (NEEDS_REVIEW / PROCESSING) → settle or refund via finalizer.
  if (resolved.status === "PENDING") {
    return { found: true, refId: txn.refId, rail, status: txn.status, providerStatus: "PENDING", outcome: "noop" };
  }
  const res = await finalizeServiceTransaction({
    txn,
    status: resolved.status === "SUCCESS" ? "SUCCESS" : resolved.status === "REFUNDED" ? "REFUNDED" : "FAILED",
    partnerTxnId,
    errorCode: resolved.status !== "SUCCESS" ? `PROVIDER_${resolved.status}` : undefined,
    raw: resolved.raw,
    source,
  });
  return {
    found: true,
    refId: txn.refId,
    rail,
    status: txn.status,
    providerStatus: resolved.status,
    outcome: res.outcome === "settled" ? "settled" : res.outcome === "refunded" ? "refunded" : "noop",
  };
}

/**
 * Webhook-safe, NON-corrective reconcile of a single transaction by any provider
 * reference — the instant twin of the BBPS recon "drain" stage.
 *
 * Unlike {@link correctOneTransaction}, this NEVER promotes an already-terminal
 * FAILED/REFUNDED row to SUCCESS (no lien clawback), so it needs no admin actor
 * and is safe to drive from an unauthenticated-but-signature-verified webhook.
 * It still NEVER trusts the trigger's claimed status: it re-checks the provider's
 * own status API and then settles/refunds ONLY a non-terminal (PROCESSING /
 * NEEDS_REVIEW) row through the shared idempotent finalizer. Terminal-state
 * corrections remain the admin/CLI path. Idempotent: concurrent webhook + sweep
 * can both call this and at most one wins the status claim.
 */
export async function reconcileNonTerminalByRef(
  ref: string,
  opts: { source?: string; providerRef?: string } = {}
): Promise<CorrectOneResult> {
  const txn = await prisma.transaction.findFirst({
    where: { OR: [{ refId: ref }, { partnerTxnId: ref }] },
    select: { ...FINALIZABLE_TXN_SELECT, request: true, response: true },
  });
  if (!txn) return { found: false };

  const rail = railFor(txn.partner, txn.service);
  if (!rail) {
    return { found: true, refId: txn.refId, rail: "bbps", status: txn.status, providerStatus: "NOT_POLLED", outcome: "not_applicable" };
  }

  // Only a NON-terminal row is settle/refund-able here. A terminal row (incl. a
  // FAILED one the provider might now confirm SUCCESS) is deliberately left to
  // the audited admin/CLI corrective path — the webhook never claws back.
  if (txn.status === "SUCCESS" || txn.status === "FAILED" || txn.status === "REFUNDED") {
    return { found: true, refId: txn.refId, rail, status: txn.status, providerStatus: "NOT_POLLED", outcome: "noop" };
  }

  const refs = Array.from(
    new Set([opts.providerRef, ...deriveTxnRefs({ partnerTxnId: txn.partnerTxnId, request: txn.request, response: txn.response })].filter(Boolean) as string[])
  );
  const resolved = await resolveProviderStatus(rail, refs);
  const source = opts.source ?? "webhook";

  if (!resolved) {
    return { found: true, refId: txn.refId, rail, status: txn.status, providerStatus: "UNRESOLVED", outcome: "unresolved" };
  }
  if (resolved.status === "PENDING") {
    return { found: true, refId: txn.refId, rail, status: txn.status, providerStatus: "PENDING", outcome: "noop" };
  }

  const res = await finalizeServiceTransaction({
    txn,
    status: resolved.status === "SUCCESS" ? "SUCCESS" : resolved.status === "REFUNDED" ? "REFUNDED" : "FAILED",
    partnerTxnId: resolved.payRef ?? txn.partnerTxnId,
    errorCode: resolved.status !== "SUCCESS" ? `PROVIDER_${resolved.status}` : undefined,
    raw: resolved.raw,
    source,
  });
  return {
    found: true,
    refId: txn.refId,
    rail,
    status: txn.status,
    providerStatus: resolved.status,
    outcome: res.outcome === "settled" ? "settled" : res.outcome === "refunded" ? "refunded" : "noop",
  };
}
