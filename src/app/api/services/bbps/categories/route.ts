import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { toErrorResponse } from "@/lib/security/apiErrors";
import { assertServiceEnabled } from "@/lib/services/guard";
import { SERVICE_KEYS } from "@/lib/services/catalog";
import { AuthError } from "@/lib/auth-server";

/**
 * GET /api/services/bbps/categories
 *
 * Returns the list of BBPS bill categories from a static catalog.
 */

const FALLBACK_CATEGORIES = [
  { biller: "Electricity", category: "Utility Bill payments" },
  { biller: "Water", category: "Utility Bill payments" },
  { biller: "Gas", category: "Utility Bill payments" },
  { biller: "LPG Gas", category: "Utility Bill payments" },
  { biller: "Education Fees", category: "Utility Bill payments" },
  { biller: "Credit Card", category: "Financial Services" },
  { biller: "Life Insurance", category: "Financial Services" },
  { biller: "Loan Repayment", category: "Financial Services" },
  { biller: "Broadband Postpaid", category: "Recharge & Bill Payments" },
  { biller: "Mobile Prepaid", category: "Recharge & Bill Payments" },
  { biller: "Mobile Postpaid", category: "Recharge & Bill Payments" },
  { biller: "DTH", category: "Recharge & Bill Payments" },
  { biller: "Fastag", category: "Recharge & Bill Payments" },
  { biller: "Municipal Taxes", category: "Financial Services" },
  { biller: "Municipal Services", category: "Other Services" },
];

export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "RETAILER") throw new AuthError("BBPS is available for retailers only", 403);
    await assertServiceEnabled(SERVICE_KEYS.BBPS, { name: "Bill Payments", userId: user.id, role: user.role });
    await enforceRateLimit(`bbps:categories:${user.id}`, RATE_LIMITS.default);
  } catch (e) {
    return toErrorResponse(e);
  }

  return NextResponse.json({ source: "FALLBACK", categories: FALLBACK_CATEGORIES });
}
