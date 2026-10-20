/**
 * Proactive clawback / false-refund / amount-mismatch detector (service rails).
 *
 * Payouts get a daily VERIFY vs the rail's books; the BBPS + RechargeKit service
 * rails did not — so a provider clawback (we SUCCESS, provider FAILED/REVERSED),
 * a false refund (we FAILED/REFUNDED, provider SUCCESS — the direct-loss incident),
 * or a twin double-attempt amount mismatch could sit unnoticed. This sweep closes
 * that gap.
 *
 * It re-polls recent TERMINAL service rows against the provider's own status API
 * and compares the authoritative outcome — and amount — to our ledger:
 *
 *   • we SUCCESS, provider FAILED/REFUNDED → PROVIDER_CLAWBACK
 *   • we FAILED/REFUNDED, provider SUCCESS (same amount) → FALSE_REFUND
 *   • provider terminal but a DIFFERENT amount → AMOUNT_MISMATCH
 *
 * It NEVER moves money — findings are recorded as AuditLog flags + a critical ops
 * alert, and surfaced on the Money-at-Risk dashboard for a deliberate operator
 * action (resolve via the audited /api/admin/transactions/resolve path, which has
 * its own amount cross-check guard). Each row is polled at most once (a durable
 * "verified-ok" marker) so provider load stays bounded, and a definitive provider
 * answer is required before any flag, so a provider outage can never mass-flag.
 */
import type { ServiceCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toNumber } from "@/lib/money";
import { getPartner } from "@/lib/partners";
import { deriveTxnRefs } from "@/lib/recon/refs";
import { sendOpsAlert } from "@/lib/monitoring/alerts";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "recon/clawbackDetect" });

const BBPS_SERVICES: ServiceCode[] = [
  "BILL_ELECTRICITY",
  "BILL_WATER",
  "BILL_GAS",
  "BILL_CREDIT_CARD",
  "BILL_EDUCATION",
  "BILL_INSURANCE",
  "RECHARGE_BROADBAND",
];

export const OUTCOME_ANOMALY_ACTIONS = {
  PROVIDER_CLAWBACK: "anomaly.provider_clawback",
  FALSE_REFUND: "anomaly.false_refund",
  AMOUNT_MISMATCH: "anomaly.amount_mismatch",
} as const;

/** Durable "verified-OK vs provider" marker — bounds polling to once per row. */
const OUTCOME_VERIFIED_ACTION = "recon.txn_outcome_verified";

const WINDOW_MS = 72 * 3_600_000; // re-check terminal rows < 72h old
const MIN_AGE_MS = 15 * 60_000; // …and ≥ 15 min old (let it settle)

export type OutcomeVerifySummary = {
  ranAt: string;
  scanned: number;
  providerClawback: number;
  falseRefund: number;
  amountMismatch: number;
  verifiedOk: number;
};

async function alreadyLogged(txnId: string, action: string): Promise<boolean> {
  const hit = await prisma.auditLog.findFirst({
    where: { action, entity: "Transaction", entityId: txnId },
    select: { id: true },
  });
  return Boolean(hit);
}

async function flag(txnId: string, userId: string, action: string, meta: Record<string, unknown>): Promise<boolean> {
  if (await alreadyLogged(txnId, action)) return false;
  await prisma.auditLog.create({
    data: { userId, action, entity: "Transaction", entityId: txnId, meta: { ...meta, detectedAt: new Date().toISOString() } },
  });
  return true;
}

/**
 * Is an outcome-anomaly flag STILL open, judged from the row alone?
 *   • PROVIDER_CLAWBACK — open while the row is still a plain SUCCESS and no lien
 *     covers the captured funds (operator reversed/clawed back → cleared).
 *   • FALSE_REFUND / AMOUNT_MISMATCH — open until the row is corrected to SUCCESS.
 */
async function flagStillOpen(action: string, txn: { id: string; status: string }): Promise<boolean> {
  if (action === OUTCOME_ANOMALY_ACTIONS.PROVIDER_CLAWBACK) {
    if (txn.status !== "SUCCESS") return false;
    const lien = await prisma.walletLien.findFirst({
      where: { refType: "Transaction", refId: txn.id },
      select: { id: true },
    });
    return !lien;
  }
  // FALSE_REFUND / AMOUNT_MISMATCH
  return txn.status !== "SUCCESS";
}

/** Delete outcome-anomaly flags whose underlying txn has since been resolved. */
async function clearResolvedFlags(): Promise<number> {
  const actions = Object.values(OUTCOME_ANOMALY_ACTIONS);
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: actions }, entity: "Transaction" },
    select: { id: true, action: true, entityId: true },
    take: 2000,
  });
  if (logs.length === 0) return 0;
  const ids = [...new Set(logs.map((l) => l.entityId).filter((x): x is string => !!x))];
  const txns = await prisma.transaction.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });
  const txnMap = new Map(txns.map((t) => [t.id, t]));
  let cleared = 0;
  for (const lg of logs) {
    const txn = lg.entityId ? txnMap.get(lg.entityId) : undefined;
    if (!txn) continue;
    if (!(await flagStillOpen(lg.action, txn))) {
      await prisma.auditLog.delete({ where: { id: lg.id } }).catch(() => {});
      cleared++;
    }
  }
  return cleared;
}

export async function runOutcomeVerificationSweep(): Promise<OutcomeVerifySummary> {
  const ranAt = new Date().toISOString();
  const now = Date.now();
  await clearResolvedFlags();
  let scanned = 0;
  let providerClawback = 0;
  let falseRefund = 0;
  let amountMismatch = 0;
  let verifiedOk = 0;

  let bbps: ReturnType<typeof getPartner> | null = null;
  try {
    bbps = getPartner("bbps");
  } catch {
    bbps = null;
  }

  const rows = await prisma.transaction.findMany({
    where: {
      status: { in: ["SUCCESS", "FAILED", "REFUNDED"] },
      isSettlement: false,
      service: { in: BBPS_SERVICES },
      createdAt: { gte: new Date(now - WINDOW_MS), lt: new Date(now - MIN_AGE_MS) },
    },
    select: {
      id: true,
      refId: true,
      userId: true,
      amount: true,
      fee: true,
      service: true,
      status: true,
      partner: true,
      partnerTxnId: true,
      request: true,
      response: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  for (const txn of rows) {
    if (await alreadyLogged(txn.id, OUTCOME_VERIFIED_ACTION)) continue;
    if (await alreadyLogged(txn.id, OUTCOME_ANOMALY_ACTIONS.PROVIDER_CLAWBACK)) continue;
    if (await alreadyLogged(txn.id, OUTCOME_ANOMALY_ACTIONS.FALSE_REFUND)) continue;
    if (await alreadyLogged(txn.id, OUTCOME_ANOMALY_ACTIONS.AMOUNT_MISMATCH)) continue;

    const refs = deriveTxnRefs({ partnerTxnId: txn.partnerTxnId, request: txn.request, response: txn.response });
    if (refs.length === 0) continue;

    let provStatus: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED" | null = null;
    let provAmount: number | null = null;
    try {
      for (const ref of refs) {
        if (!bbps?.status) break;
        let r = await bbps.status({ orderId: ref });
        if (!r.ok) r = await bbps.status({ requestId: ref });
        if (!r.ok) r = await bbps.status({ billFetchRef: ref });
        if (r.ok) {
          provStatus = r.data.status;
          provAmount = typeof r.data.amount === "number" && r.data.amount > 0 ? r.data.amount : null;
          break;
        }
      }
    } catch (e) {
      log.warn({ refId: txn.refId, err: String(e) }, "outcome verify: provider poll failed");
      continue;
    }

    scanned++;
    if (!provStatus || provStatus === "PENDING") continue;

    const rowAmt = toNumber(txn.amount);
    const amountOk = provAmount == null || Math.abs(provAmount - rowAmt) <= 0.01;
    const weSucceeded = txn.status === "SUCCESS";
    const meta = {
      refId: txn.refId,
      amount: rowAmt,
      fee: toNumber(txn.fee),
      service: txn.service,
      partner: txn.partner,
      partnerTxnId: txn.partnerTxnId,
      ourStatus: txn.status,
      providerStatus: provStatus,
      providerAmount: provAmount,
      createdAt: txn.createdAt.toISOString(),
    };

    if (provStatus === "SUCCESS") {
      if (!amountOk) {
        if (await flag(txn.id, txn.userId, OUTCOME_ANOMALY_ACTIONS.AMOUNT_MISMATCH, meta)) amountMismatch++;
      } else if (weSucceeded) {
        await prisma.auditLog.create({
          data: { userId: txn.userId, action: OUTCOME_VERIFIED_ACTION, entity: "Transaction", entityId: txn.id, meta: { providerStatus: provStatus } },
        });
        verifiedOk++;
      } else {
        if (await flag(txn.id, txn.userId, OUTCOME_ANOMALY_ACTIONS.FALSE_REFUND, meta)) falseRefund++;
      }
    } else {
      // provider FAILED / REFUNDED
      if (weSucceeded) {
        if (await flag(txn.id, txn.userId, OUTCOME_ANOMALY_ACTIONS.PROVIDER_CLAWBACK, meta)) providerClawback++;
      } else {
        await prisma.auditLog.create({
          data: { userId: txn.userId, action: OUTCOME_VERIFIED_ACTION, entity: "Transaction", entityId: txn.id, meta: { providerStatus: provStatus } },
        });
        verifiedOk++;
      }
    }
  }

  const total = providerClawback + falseRefund + amountMismatch;
  if (total > 0) {
    void sendOpsAlert({
      title: `${total} payment outcome mismatch(es) vs provider detected`,
      severity: "critical",
      details: {
        providerClawback,
        falseRefund,
        amountMismatch,
        verifiedOk,
        hint: "Review on Money-at-Risk, then Resolve / verify with provider.",
      },
    }).catch(() => {});
    log.warn({ providerClawback, falseRefund, amountMismatch, verifiedOk }, "outcome mismatches detected");
  }

  const summary: OutcomeVerifySummary = { ranAt, scanned, providerClawback, falseRefund, amountMismatch, verifiedOk };
  await prisma.auditLog.create({ data: { action: "recon.outcome_verify", entity: "System", meta: { ...summary } } });
  return summary;
}

/**
 * Open outcome-anomaly exposure (count of flagged txns + Σ amount+fee). A flag is
 * "open" while its AuditLog row exists — the row is cleared when an operator
 * corrects the txn (the resolver stamps the correction; see getOutcomeAnomalyExposure
 * which only counts rows still in a mismatched state).
 */
export async function getOutcomeAnomalyExposure(): Promise<{ count: number; exposure: number }> {
  const actions = Object.values(OUTCOME_ANOMALY_ACTIONS);
  const logs = await prisma.auditLog.findMany({
    where: { action: { in: actions }, entity: "Transaction" },
    select: { action: true, entityId: true },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });
  const ids = [...new Set(logs.map((l) => l.entityId).filter((x): x is string => !!x))];
  if (ids.length === 0) return { count: 0, exposure: 0 };
  const txns = await prisma.transaction.findMany({
    where: { id: { in: ids } },
    select: { id: true, amount: true, fee: true, status: true },
  });
  const txnMap = new Map(txns.map((t) => [t.id, t]));
  let exposure = 0;
  let count = 0;
  const seen = new Set<string>();
  for (const lg of logs) {
    if (!lg.entityId || seen.has(lg.entityId)) continue;
    const txn = txnMap.get(lg.entityId);
    if (!txn) continue;
    // Only count flags whose txn is STILL provider-divergent (resolved → excluded).
    if (!(await flagStillOpen(lg.action, { id: txn.id, status: txn.status as string }))) continue;
    seen.add(lg.entityId);
    count++;
    exposure += toNumber(txn.amount) + toNumber(txn.fee);
  }
  return { count, exposure };
}
