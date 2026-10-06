import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { toErrorResponse } from "@/lib/security/apiErrors";
import { assertServiceEnabled } from "@/lib/services/guard";
import { SERVICE_KEYS } from "@/lib/services/catalog";
import { AuthError } from "@/lib/auth-server";

/**
 * GET /api/services/bbps/pending-bills?page=1&limit=25&sort=dueDate&order=desc
 *
 * Returns pending/upcoming bills. Currently returns an empty list as the
 * pending-bill auto-fetch feature is not available.
 */

export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "RETAILER") throw new AuthError("BBPS is available for retailers only", 403);
    await assertServiceEnabled(SERVICE_KEYS.BBPS, { name: "Bill Payments", userId: user.id, role: user.role });
    await enforceRateLimit(`bbps:pending:${user.id}`, RATE_LIMITS.default);
  } catch (e) {
    return toErrorResponse(e);
  }

  return NextResponse.json({ bills: [], total: 0, message: "Pending bills feature is not available" });
}
