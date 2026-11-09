import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminActivity } from "@/lib/security/adminActivity";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { toErrorResponse } from "@/lib/security/apiErrors";
import { checkProviderStatusOne } from "@/lib/recon/reconcileOne";

export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/transactions/status-check  { refId }
 *
 * READ-ONLY live provider status probe for a held transaction. It re-polls the
 * BBPS rail's status API across every reference we hold and reports the
 * authoritative provider status plus the recovered pay-step reference (request_id).
 * It NEVER moves money or changes a row — it only reads — so ops can see the
 * current provider verdict before choosing to Resolve/verify or force a
 * "Not found — refund". Must run on the IP-whitelisted host.
 */
const Body = z.object({ refId: z.string().trim().min(3).max(60) }).strict();

export async function POST(req: Request) {
  try {
    const actor = await requireAdminActivity(req, {
      action: "txn.status_check",
      roles: ["MASTER_ADMIN", "ADMIN"],
      entity: "Transaction",
    });

    // Each probe makes live provider calls — cap per-admin frequency.
    await enforceRateLimit(`txn:status-check:${actor.id}`, RATE_LIMITS.sensitiveWrite);

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const result = await checkProviderStatusOne(parsed.data.refId);
    if (!result.found)
      return NextResponse.json({ error: "No transaction found for that reference" }, { status: 404 });

    return NextResponse.json(result);
  } catch (e) {
    return toErrorResponse(e);
  }
}
