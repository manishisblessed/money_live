import { Prisma, type ServiceCode, type TxnStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { creditWallet, placeLienHold } from "@/lib/ledger";
import { creditServiceMargin } from "@/lib/commission/revenue";
import { isChargeDrivenService } from "@/lib/scheme/constants";
import { emitWebhookEvent } from "@/lib/platform/webhooks";
import { add, sub, round, dec } from "@/lib/money";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const log = logger.child({ module: "services/finalize" });

/** Deferred-refund cooling-off window in milliseconds (from REFUND_HOLD_MINUTES env var). */
function refundHoldMs(): number {
  return Math.max(0, env.REFUND_HOLD_MINUTES) * 60_000;
}

// These finalizers run claim + ledger movements (which may trigger a lien sweep
// touching several rows) in ONE interactive transaction. Prisma's 5s default is
// too tight over a high-latency DB link (EC2 ↔ allow-listed Postgres), so give
// the whole unit generous headroom — it's still a small, bounded amount of work.
const TXN_OPTS = { timeout: 30_000, maxWait: 15_000 } as const;

/**
 * Provider-agnostic terminal finalizer for a service `Transaction` left in a
 * non-terminal state (INITIATED/PROCESSING/NEEDS_REVIEW).
 *
 * This is the SINGLE settle/refund path shared by every out-of-band finalizer
 * (the reconciliation sweeps, and any future webhook) so a transaction finishes
 * exactly the same way no matter which trigger fires first:
 *
 *   SUCCESS            → mark SUCCESS, book the company margin for charge-driven
 *                        rails (BBPS/RechargeKit), emit `txn.success`.
 *   FAILED | REFUNDED  → mark the terminal status and REVERSAL-credit the held
 *                        reserve (amount + fee) back to the wallet, emit
 *                        `txn.failed`.
 *
 * At-most-once is guaranteed by a conditional status claim (`updateMany` scoped
 * to the non-terminal set): whoever transitions the row first wins; every later
 * caller (retry, racing webhook + sweep) is a no-op. The ledger writes are
 * additionally idempotency-keyed, so even a replay inside the winning branch
 * cannot double-credit.
 */
export type FinalizableTxn = {
  id: string;
  refId: string;
  userId: string;
  amount: Prisma.Decimal;
  fee: Prisma.Decimal;
  gst: Prisma.Decimal;
  vendorCharge: Prisma.Decimal;
  service: ServiceCode;
  status: TxnStatus;
  partner: string | null;
  partnerTxnId: string | null;
  /** Populated when a deferred-refund cooling-off window was stamped earlier. */
  refundEligibleAt?: Date | null;
};

// A held NEEDS_REVIEW txn is non-terminal: the out-of-band finalizer may still
// settle (SUCCESS) or refund (FAILED/REFUNDED) it once the provider's
// authoritative outcome is known.
const NON_TERMINAL: TxnStatus[] = ["INITIATED", "PROCESSING", "NEEDS_REVIEW"];

export type FinalizeOutcome = "settled" | "refunded" | "noop";

export async function finalizeServiceTransaction(opts: {
  txn: FinalizableTxn;
  status: "SUCCESS" | "FAILED" | "REFUNDED";
  partnerTxnId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  raw?: unknown;
  /** Provenance for the audit trail, e.g. "webhook" | "recon". */
  source: string;
  /**
   * When true, skip the deferred cooling-off window and credit immediately.
   * Used for admin-triggered resolutions and recon not-found refunds.
   */
  immediate?: boolean;
}): Promise<{ finalized: boolean; outcome: FinalizeOutcome }> {
  const { txn, status, source } = opts;
  const partnerTxnId = opts.partnerTxnId ?? txn.partnerTxnId ?? null;
  const raw = (opts.raw ?? null) as Prisma.InputJsonValue;

  // ── SUCCESS ─────────────────────────────────────────────────────────────
  if (status === "SUCCESS") {
    let finalized = false;
    await prisma.$transaction(async (tx) => {
      const claim = await tx.transaction.updateMany({
        where: { id: txn.id, status: { in: NON_TERMINAL } },
        data: { status: "SUCCESS", partnerTxnId, response: raw, refundEligibleAt: null },
      });
      if (claim.count === 0) return; // someone finalized first
      finalized = true;

      // Charge-driven rails (BBPS/RechargeKit) book the spread —
      // (fee − gst) − vendorCharge — into the Revenue Wallet. Idempotent.
      if (isChargeDrivenService(txn.service)) {
        const margin = round(
          sub(sub(txn.fee.toNumber(), txn.gst.toNumber()), txn.vendorCharge.toNumber())
        );
        await creditServiceMargin(txn.id, txn.service, margin, tx);
      }

      await tx.auditLog.create({
        data: {
          userId: txn.userId,
          action: `txn.${source}_settled`,
          entity: "Transaction",
          entityId: txn.id,
          meta: { refId: txn.refId, source, partner: txn.partner },
        },
      });
    }, TXN_OPTS);

    if (finalized) {
      void emitWebhookEvent(txn.userId, "txn.success", {
        refId: txn.refId,
        service: txn.service,
        amount: txn.amount.toNumber(),
      });
      log.info({ refId: txn.refId, source }, "service txn settled via out-of-band finalizer");
    }
    return { finalized, outcome: finalized ? "settled" : "noop" };
  }

  // ── FAILED / REFUNDED — deferred double-checked refund ───────────────────
  //
  // On SameDay recon-capable rails a synchronous "failure" may arrive while the
  // payment actually charged (SameDay reverses our float separately, later).
  // We NEVER credit the retailer on the first failure signal alone. Instead:
  //
  //   1st call (immediate=false, no refundEligibleAt stamped yet):
  //       Stamp refundEligibleAt = now + REFUND_HOLD_MINUTES.
  //       Keep the row NEEDS_REVIEW. Audit and return noop — do NOT credit yet.
  //
  //   Subsequent calls while window is still active:
  //       noop — wait.
  //
  //   Subsequent call after window elapsed (double-check complete):
  //       Guard against a prior REVERSAL (idempotent). If none, proceed to mark
  //       terminal + creditWallet + audit.
  //
  // immediate=true bypasses the hold: used for admin-triggered "Not found in
  // panel" refunds and reconcileOne admin force-refund, where the ops team has
  // already verified with the provider.

  const reserveAmount = round(add(txn.amount.toNumber(), txn.fee.toNumber()));
  const terminal: TxnStatus = status === "REFUNDED" ? "REFUNDED" : "FAILED";

  // ── Prior-reversal idempotency guard ────────────────────────────────────
  const existingReversal = await prisma.walletTxn.findFirst({
    where: {
      userId: txn.userId,
      direction: "CREDIT",
      reason: "REVERSAL",
      refType: "Transaction",
      refId: txn.id,
    },
    select: { id: true },
  });
  if (existingReversal) {
    log.info({ refId: txn.refId, source }, "refund skipped — REVERSAL already posted");
    return { finalized: false, outcome: "noop" };
  }

  // ── Cooling-off gate (deferred double-check) ─────────────────────────────
  if (!opts.immediate) {
    const holdMs = refundHoldMs();
    const now = Date.now();

    if (!txn.refundEligibleAt) {
      // First confirmed failure — stamp the cooling-off deadline, stay NEEDS_REVIEW.
      const eligibleAt = new Date(now + holdMs);
      await prisma.transaction.updateMany({
        where: { id: txn.id, status: { in: NON_TERMINAL } },
        data: {
          refundEligibleAt: eligibleAt,
          errorCode: opts.errorCode ?? `PROVIDER_${status}`,
          errorMessage: opts.errorMessage || `Provider reported ${status} for ${txn.refId}`,
          response: raw,
        },
      });
      await prisma.auditLog.create({
        data: {
          userId: txn.userId,
          action: `txn.${source}_refund_scheduled`,
          entity: "Transaction",
          entityId: txn.id,
          meta: {
            refId: txn.refId,
            source,
            providerStatus: status,
            partner: txn.partner,
            eligibleAt: eligibleAt.toISOString(),
            holdMinutes: env.REFUND_HOLD_MINUTES,
          },
        },
      });
      log.info(
        { refId: txn.refId, source, eligibleAt },
        "refund cooling-off window stamped — will credit after double-check"
      );
      return { finalized: false, outcome: "noop" };
    }

    // Window still active — wait.
    if (txn.refundEligibleAt.getTime() > now) {
      log.info(
        { refId: txn.refId, eligibleAt: txn.refundEligibleAt },
        "refund cooling-off window still active — skipping"
      );
      return { finalized: false, outcome: "noop" };
    }
    // Window elapsed → fall through to credit.
  }

  let finalized = false;
  await prisma.$transaction(async (tx) => {
    const claim = await tx.transaction.updateMany({
      where: { id: txn.id, status: { in: NON_TERMINAL } },
      data: {
        status: terminal,
        partnerTxnId,
        refundEligibleAt: null,
        errorCode: opts.errorCode ?? `PROVIDER_${status}`,
        errorMessage: opts.errorMessage || `Provider reported ${status} for ${txn.refId}`,
        response: raw,
      },
    });
    if (claim.count === 0) return;
    finalized = true;

    await creditWallet(
      {
        userId: txn.userId,
        amount: reserveAmount,
        reason: "REVERSAL",
        refType: "Transaction",
        refId: txn.id,
        // Stable per-transaction key: a replay is a ledger no-op, and the status
        // claim above already prevents a second branch from ever reaching here.
        idempotencyKey: `txn:${txn.userId}:${txn.refId}:reversal`,
      },
      tx
    );

    await tx.auditLog.create({
      data: {
        userId: txn.userId,
        action: `txn.${source}_refunded`,
        entity: "Transaction",
        entityId: txn.id,
        meta: { refId: txn.refId, source, providerStatus: status, partner: txn.partner },
      },
    });
  }, TXN_OPTS);

  if (finalized) {
    void emitWebhookEvent(txn.userId, "txn.failed", {
      refId: txn.refId,
      service: txn.service,
      amount: txn.amount.toNumber(),
      code: opts.errorCode ?? `PROVIDER_${status}`,
      message: opts.errorMessage ?? `Transaction ${status.toLowerCase()} at provider`,
    });
    log.info({ refId: txn.refId, source, status }, "service txn refunded via out-of-band finalizer");
  }
  return { finalized, outcome: finalized ? "refunded" : "noop" };
}

/**
 * CORRECTIVE finalizer: promote an already-TERMINAL FAILED/REFUNDED transaction
 * to SUCCESS after the provider's authoritative outcome proves the money DID
 * move — the direct-financial-loss case this whole subsystem exists to prevent.
 *
 * The ordinary {@link finalizeServiceTransaction} deliberately only acts on
 * non-terminal rows, so it can NEVER touch a row that was wrongly refunded. This
 * function is the single, audited, admin-triggered path that can, and it does so
 * safely:
 *
 *   1. At-most-once — the status claim is scoped to `FAILED | REFUNDED`; a second
 *      run (or a race) sees SUCCESS and becomes a no-op.
 *   2. Clawback WITHOUT a negative wallet — if (and only if) the retailer was
 *      actually refunded earlier (detected via the durable REVERSAL ledger link,
 *      which also catches refunds written by older code under non-standard keys),
 *      the refunded reserve is recovered through a LIEN: it sweeps whatever is
 *      available now and recovers the rest EAGERLY from every future credit. The
 *      wallet is never driven negative.
 */
export async function correctTerminalToSuccess(opts: {
  txn: FinalizableTxn;
  partnerTxnId?: string | null;
  raw?: unknown;
  /** Admin (or system actor) responsible — recorded on the lien + audit log. */
  actorId: string;
  /** Provenance, e.g. "admin_resolve" | "corrective_recon". */
  source: string;
  remarks?: string;
}): Promise<{
  corrected: boolean;
  clawbackPlaced: boolean;
  lienId: string | null;
  refunded: number;
}> {
  const { txn, actorId, source } = opts;
  const partnerTxnId = opts.partnerTxnId ?? txn.partnerTxnId ?? null;
  const raw = (opts.raw ?? null) as Prisma.InputJsonValue;
  const reserveAmount = round(add(txn.amount.toNumber(), txn.fee.toNumber()));

  let corrected = false;
  let clawbackPlaced = false;
  let lienId: string | null = null;
  let refunded = 0;

  await prisma.$transaction(async (tx) => {
    // Claim ONLY a genuinely terminal-failed row → SUCCESS. At-most-once.
    const claim = await tx.transaction.updateMany({
      where: { id: txn.id, status: { in: ["FAILED", "REFUNDED"] } },
      data: { status: "SUCCESS", partnerTxnId, errorCode: null, errorMessage: null, response: raw, refundEligibleAt: null },
    });
    if (claim.count === 0) return; // already corrected / not a terminal-failed row
    corrected = true;

    // Only claw back money that was ACTUALLY returned. Detect the refund via the
    // DURABLE ledger link — a REVERSAL credit pointing at this Transaction —
    // rather than a single deterministic key: rows failed by older code refunded
    // under different (or no) idempotency keys, and missing that refund here would
    // hand the retailer free money when we promote the row to SUCCESS.
    const reversalAgg = await tx.walletTxn.aggregate({
      where: {
        userId: txn.userId,
        direction: "CREDIT",
        reason: "REVERSAL",
        refType: "Transaction",
        refId: txn.id,
      },
      _sum: { amount: true },
    });
    const refundedAmt = reversalAgg._sum.amount?.toNumber() ?? 0;
    if (refundedAmt > 0) {
      refunded = refundedAmt;
      // LIEN-based recovery → sweeps available funds now, recovers the rest from
      // future credits; floored at zero so the wallet never goes negative.
      const lien = await tx.walletLien.create({
        data: {
          targetUserId: txn.userId,
          actorId,
          amount: dec(refunded),
          reasonCode: "OTHER",
          remarks:
            opts.remarks?.trim() ||
            `Corrective clawback — provider-confirmed SUCCESS on wrongly-refunded txn ${txn.refId}`,
          refType: "Transaction",
          refId: txn.id,
          status: "ACTIVE",
        },
      });
      lienId = lien.id;
      await placeLienHold(txn.userId, refunded, tx);
      clawbackPlaced = true;
      // Governance: notify the retailer their earlier refund is being clawed back
      // (the provider confirmed the payment actually succeeded). Atomic with the lien.
      await tx.notification.create({
        data: {
          userId: txn.userId,
          title: "A wallet hold was placed to recover a refund",
          body: `₹${refunded.toFixed(2)} from txn ${txn.refId} is being recovered: the provider confirmed this payment actually succeeded, so the earlier refund is reversed via a recovery hold (not a negative balance).`,
          channel: "INAPP",
          href: "/dashboard/wallet",
        },
      });
    }

    // Book the company margin exactly like a normal SUCCESS settlement.
    if (isChargeDrivenService(txn.service)) {
      const margin = round(
        sub(sub(txn.fee.toNumber(), txn.gst.toNumber()), txn.vendorCharge.toNumber())
      );
      await creditServiceMargin(txn.id, txn.service, margin, tx);
    }

    await tx.auditLog.create({
      data: {
        userId: txn.userId,
        action: "txn.corrected_to_success",
        entity: "Transaction",
        entityId: txn.id,
        meta: {
          refId: txn.refId,
          source,
          actorId,
          reserveAmount,
          refunded,
          clawbackPlaced,
          lienId,
          partner: txn.partner,
        },
      },
    });
  }, TXN_OPTS);

  if (corrected) {
    void emitWebhookEvent(txn.userId, "txn.success", {
      refId: txn.refId,
      service: txn.service,
      amount: txn.amount.toNumber(),
    });
    log.info(
      { refId: txn.refId, source, clawbackPlaced, refunded },
      "terminal txn corrected to SUCCESS"
    );
  }
  return { corrected, clawbackPlaced, lienId, refunded };
}

/** Column set required by {@link finalizeServiceTransaction}. */
export const FINALIZABLE_TXN_SELECT = {
  id: true,
  refId: true,
  userId: true,
  amount: true,
  fee: true,
  gst: true,
  vendorCharge: true,
  service: true,
  status: true,
  partner: true,
  partnerTxnId: true,
  refundEligibleAt: true,
} satisfies Prisma.TransactionSelect;
