import { prisma } from "@/lib/db";
import { reconcilePayout } from "@/lib/payout/service";
import type { SamedayWebhookCtx, WebhookResult } from "@/lib/partners/sameday-webhook";

function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Process a verified Same Day payout/settlement event. Never trusts the body's
 * claimed status: matches the PayoutRequest by the Same Day reference_id it
 * carries, then reconciles it the idempotent, provider-VERIFIED way
 * (reconcilePayout re-polls Same Day's status API and finalizes once). The
 * `bulkpe*` columns are legacy names that in fact hold the settlement reference.
 */
export async function handlePayoutWebhookEvent(
  payload: Record<string, unknown>,
  ctx: SamedayWebhookCtx
): Promise<WebhookResult> {
  // The provider may nest the txn under `data`; support flat and nested shapes.
  const data = (payload.data && typeof payload.data === "object"
    ? (payload.data as Record<string, unknown>)
    : payload) as Record<string, unknown>;

  const refs = Array.from(
    new Set(
      [
        pick(data, ["reference_id", "referenceId"]),
        pick(data, ["transcation_id", "transaction_id", "txn_id", "txnId"]),
        pick(data, ["utr", "rrn"]),
        // Knteer payout webhook shape: partner_trans_id / partnerTransId
        pick(data, ["partner_trans_id", "partnerTransId"]),
      ].filter(Boolean) as string[]
    )
  );
  if (refs.length === 0) {
    return { status: 200, body: { ok: true, matched: false, reason: "no reference" } };
  }

  const row = await prisma.payoutRequest.findFirst({
    where: {
      OR: [{ bulkpeReferenceId: { in: refs } }, { bulkpeTxnId: { in: refs } }],
    },
    select: { id: true },
  });

  // Unknown reference (e.g. a POS event on the shared Events channel) → ack 200.
  if (!row) return { status: 200, body: { ok: true, matched: false } };

  await prisma.auditLog
    .create({
      data: {
        action: "payout.webhook",
        entity: "PayoutRequest",
        entityId: row.id,
        meta: {
          event: ctx.eventHeader ?? null,
          refs,
          signatureVerified: ctx.verified,
          deliveryId: ctx.deliveryId ?? null,
        },
      },
    })
    .catch(() => {});

  // Provider-VERIFIED, idempotent finalize: re-polls Same Day and settles once.
  await reconcilePayout(row.id);

  return { status: 200, body: { ok: true, matched: true } };
}
