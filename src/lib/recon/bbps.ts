import { type ServiceCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { flags } from "@/lib/env";
import { getPartner } from "@/lib/partners";
import { chagansCcCheckStatus } from "@/lib/partners/chagans-cc-bill";
import { sendOpsAlert } from "@/lib/monitoring/alerts";
import { logger } from "@/lib/logger";
import { deriveTxnRefs } from "./refs";
import { finalizeServiceTransaction, FINALIZABLE_TXN_SELECT } from "@/lib/services/finalize";
import type { BbpsProvider } from "@/lib/partners/types";

// BBPS recon sweeps both SameDay Pay2New AND Chagans CC Bill transactions.
const PAY2NEW_PARTNER = "SAMEDAY_PAY2NEW";
const CHAGANS_CC_PARTNER = "CHAGANS_CC_BILL";
const RECON_PARTNERS = [PAY2NEW_PARTNER, CHAGANS_CC_PARTNER];

const BBPS_SERVICES: ServiceCode[] = [
  "BILL_ELECTRICITY", "BILL_WATER", "BILL_GAS",
  "BILL_CREDIT_CARD", "BILL_EDUCATION", "BILL_INSURANCE",
  "RECHARGE_BROADBAND",
];

/**
 * BBPS reconciliation — polls PROCESSING BBPS transactions and settles them.
 *
 * Unlike payouts (which have webhooks), BBPS providers may not push status
 * updates. This sweep is our only safety net for transactions that returned
 * PENDING at pay-time or whose response was ambiguous.
 *
 * Three stages (mirrors the payout recon pattern):
 *   1. DRAIN   — poll every PROCESSING BBPS txn older than 2 minutes
 *   2. STUCK   — escalate anything still PROCESSING after 1 hour
 *   3. VERIFY  — re-check recent SUCCESS/FAILED rows (last 24h) for mismatches
 */

export type BbpsReconSummary = {
  ranAt: string;
  drained: number;
  settled: number;
  refunded: number;
  stuck: number;
  /** NEEDS_REVIEW rows held too long and escalated (funds NOT refunded). */
  heldEscalated: number;
  verified: number;
  mismatches: number;
  skipped: boolean;
};

type BbpsStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

/**
 * Resolve a stuck/held BBPS payment at the provider by ANY reference it ever
 * exchanged — stored partnerTxnId, or an order_id / request_id / bill_fetch_ref
 * mined from the request/response JSON. Returns the authoritative status plus the
 * echoed pay-step ref so the finalizer stamps the real partnerTxnId.
 */
async function tryResolve(
  bbps: BbpsProvider,
  txn: { partner?: string | null; partnerTxnId: string | null; request: unknown; response: unknown }
): Promise<{ status: BbpsStatus; payRef: string | null; raw: unknown } | null> {
  const refs = deriveTxnRefs({ partnerTxnId: txn.partnerTxnId, request: txn.request, response: txn.response });

  // Chagans CC Bill — use its own checkStatus (POST /bbps/checkStatus)
  if (txn.partner === CHAGANS_CC_PARTNER) {
    for (const ref of refs) {
      const r = await chagansCcCheckStatus(ref);
      if (r.ok) {
        return { status: r.data.status, payRef: r.data.orderId || ref, raw: r.raw };
      }
    }
    return null;
  }

  // Same Day Pay2New — standard BBPS status API
  if (!bbps.status) return null;
  for (const ref of refs) {
    let r = await bbps.status({ orderId: ref });
    if (!r.ok) r = await bbps.status({ requestId: ref });
    if (!r.ok) r = await bbps.status({ billFetchRef: ref });
    if (r.ok) {
      return { status: r.data.status, payRef: r.data.orderId ?? r.data.requestId ?? ref, raw: r.raw };
    }
  }
  return null;
}

const DRAIN_AGE_MS = 2 * 60_000;
const STUCK_THRESHOLD_MS = 60 * 60_000;
const VERIFY_WINDOW_MS = 24 * 3_600_000;

export async function runBbpsReconciliation(): Promise<BbpsReconSummary> {
  const ranAt = new Date().toISOString();

  if (!flags.bbps) {
    logger.info({ action: "recon.bbps_skipped", reason: "bbps partner disabled" });
    return { ranAt, drained: 0, settled: 0, refunded: 0, stuck: 0, heldEscalated: 0, verified: 0, mismatches: 0, skipped: true };
  }

  const bbps = getPartner("bbps");
  if (!bbps.status) {
    logger.info({ action: "recon.bbps_skipped", reason: "provider has no status method" });
    return { ranAt, drained: 0, settled: 0, refunded: 0, stuck: 0, heldEscalated: 0, verified: 0, mismatches: 0, skipped: true };
  }

  const now = Date.now();
  let settled = 0;
  let refunded = 0;

  // 1. DRAIN — poll every non-terminal BBPS txn (PROCESSING from a PENDING pay,
  // or NEEDS_REVIEW held from an indeterminate pay) older than 2 minutes. We do
  // NOT require a stored partnerTxnId: a held row whose pay response was lost has
  // a blank partnerTxnId but still carries a pollable ref (bill_fetch_ref /
  // fetch order_id) in its request JSON, mined by deriveTxnRefs.
  const inflight = await prisma.transaction.findMany({
    where: {
      status: { in: ["PROCESSING", "NEEDS_REVIEW"] },
      service: { in: BBPS_SERVICES },
      partner: { in: RECON_PARTNERS },
      createdAt: { lt: new Date(now - DRAIN_AGE_MS) },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { ...FINALIZABLE_TXN_SELECT, request: true, response: true, createdAt: true },
  });

  let drained = 0;
  for (const txn of inflight) {
    try {
      const resolved = await tryResolve(bbps, txn);
      if (!resolved || resolved.status === "PENDING") {
        drained++;
        continue;
      }
      // Single idempotent settle/refund path (status-claim + keyed ledger).
      const out = await finalizeServiceTransaction({
        txn,
        status: resolved.status === "SUCCESS" ? "SUCCESS" : resolved.status === "REFUNDED" ? "REFUNDED" : "FAILED",
        partnerTxnId: resolved.payRef,
        errorCode: resolved.status !== "SUCCESS" ? "BBPS_PROVIDER_FAILED" : undefined,
        errorMessage:
          resolved.status !== "SUCCESS" ? `Provider reported ${resolved.status} during reconciliation` : undefined,
        raw: resolved.raw,
        source: "recon",
      });
      if (out.outcome === "settled") settled++;
      else if (out.outcome === "refunded") refunded++;
      drained++;
    } catch (err) {
      logger.warn({ action: "recon.bbps_poll_failed", txnId: txn.id, err: String(err) });
    }
  }

  // 2a. STUCK (PROCESSING) — a pay accepted as PENDING but never finalized; the
  // reserve is still held pending the provider. Warn so ops can chase it.
  const stillStuck = await prisma.transaction.findMany({
    where: {
      status: "PROCESSING",
      service: { in: BBPS_SERVICES },
      partner: { in: RECON_PARTNERS },
      createdAt: { lt: new Date(now - STUCK_THRESHOLD_MS) },
    },
    select: { id: true, refId: true, createdAt: true },
  });

  if (stillStuck.length > 0) {
    await sendOpsAlert({
      title: "BBPS transactions stuck in PROCESSING",
      severity: "warning",
      details: {
        count: stillStuck.length,
        oldest: stillStuck[0].createdAt.toISOString(),
        refIds: stillStuck.slice(0, 10).map((r) => r.refId).join(", "),
      },
    });
  }

  // 2b. HELD (NEEDS_REVIEW) — an INDETERMINATE pay where the provider may have
  // charged. Funds are HELD, NOT refunded. If the status poll still can't
  // resolve it after the threshold, escalate LOUD (critical) and de-dupe via an
  // audit marker so ops are paged once, not every 5 minutes.
  let heldEscalated = 0;
  const heldStuck = await prisma.transaction.findMany({
    where: {
      status: "NEEDS_REVIEW",
      service: { in: BBPS_SERVICES },
      partner: { in: RECON_PARTNERS },
      createdAt: { lt: new Date(now - STUCK_THRESHOLD_MS) },
    },
    select: { id: true, refId: true, userId: true, createdAt: true },
  });

  for (const row of heldStuck) {
    const already = await prisma.auditLog.findFirst({
      where: { entityId: row.id, action: "recon.needs_review_escalated" },
      select: { id: true },
    });
    if (already) continue;
    await prisma.auditLog.create({
      data: {
        userId: row.userId,
        action: "recon.needs_review_escalated",
        entity: "Transaction",
        entityId: row.id,
        meta: { refId: row.refId, heldSince: row.createdAt.toISOString() },
      },
    });
    heldEscalated++;
  }

  if (heldEscalated > 0) {
    await sendOpsAlert({
      title: "BBPS payments HELD for review — funds NOT refunded (possible provider charge)",
      severity: "critical",
      details: {
        count: heldEscalated,
        oldest: heldStuck[0]?.createdAt.toISOString() ?? null,
        refIds: heldStuck.slice(0, 10).map((r) => r.refId).join(", "),
      },
    });
  }

  // 3. VERIFY — re-check recent terminal BBPS rows against the provider.
  let verified = 0;
  let mismatches = 0;
  const recentTerminal = await prisma.transaction.findMany({
    where: {
      status: { in: ["SUCCESS", "FAILED"] },
      service: { in: BBPS_SERVICES },
      partner: { in: RECON_PARTNERS },
      partnerTxnId: { not: null },
      updatedAt: { gte: new Date(now - VERIFY_WINDOW_MS) },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: { id: true, refId: true, status: true, partnerTxnId: true, partner: true, userId: true },
  });

  for (const row of recentTerminal) {
    try {
      // Route status check to the correct provider
      const r = row.partner === CHAGANS_CC_PARTNER
        ? await chagansCcCheckStatus(row.partnerTxnId!)
        : await bbps.status({ orderId: row.partnerTxnId! });
      if (!r.ok) continue;
      verified++;

      const provStatus = r.data.status;
      const agree =
        (row.status === "SUCCESS" && provStatus === "SUCCESS") ||
        (row.status === "FAILED" && (provStatus === "FAILED" || provStatus === "REFUNDED")) ||
        provStatus === "PENDING";

      if (!agree) {
        mismatches++;
        await prisma.auditLog.create({
          data: {
            userId: row.userId,
            action: "recon.bbps_mismatch",
            entity: "Transaction",
            entityId: row.id,
            meta: { refId: row.refId, ourStatus: row.status, providerStatus: provStatus, ranAt },
          },
        });
      }
    } catch (err) {
      logger.warn({ action: "recon.bbps_verify_failed", txnId: row.id, err: String(err) });
    }
  }

  if (mismatches > 0) {
    await sendOpsAlert({
      title: "BBPS ledger disagrees with provider",
      severity: "critical",
      details: { verified, mismatches },
    });
  }

  const summary: BbpsReconSummary = { ranAt, drained, settled, refunded, stuck: stillStuck.length, heldEscalated, verified, mismatches, skipped: false };
  await prisma.auditLog.create({
    data: { action: "recon.bbps_recon", entity: "System", meta: { ...summary } },
  });

  return summary;
}
