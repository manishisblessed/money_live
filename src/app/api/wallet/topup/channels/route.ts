import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { toErrorResponse } from "@/lib/security/apiErrors";
import { flags } from "@/lib/env";
import { viableConfigured, viableChannelHealth, hydrateHealthCache } from "@/lib/partners/viable-pg";
import { chagansConfigured, chagansChannelHealth } from "@/lib/partners/chagans-pg";
import { readGatewayHealth } from "@/lib/ops/telemetry";

/**
 * PG gateway channels + live health for the wallet "add money" selector.
 *
 * Returns a combined list of ALL selectable gateways across Viable PG and
 * Chagans PG, each with a prefixed id (`viable:<route>` / `chagans:<id>`) so
 * the wallet page and `resolveUpiSelection` route them correctly.
 *
 * Health is probed/cached server-side; the UI uses this to disable unavailable
 * gateways so the retailer doesn't waste time on them.
 */
export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try {
    user = await requireAuth();
    await enforceRateLimit(`wallet:topup:channels:${user.id}`, RATE_LIMITS.default);
  } catch (e) {
    return toErrorResponse(e);
  }

  const channels: {
    id: string;
    label: string;
    route: string;
    primary: boolean;
    healthy: boolean;
    detail: string;
    checkedAt: string;
    maxAmount?: number;
    provider: string;
  }[] = [];

  // ── Viable PG gateways ──────────────────────────────────────────────────
  if (flags.upi && viableConfigured()) {
    try {
      // No user-triggered force re-probe: an on-demand `force` would let any
      // user mint ₹1 probe orders at will. Seed from the worker's shared
      // snapshot first, then fall back to a single cold probe only if nothing
      // is cached at all.
      hydrateHealthCache(await readGatewayHealth());
      const viableChannels = await viableChannelHealth(false);
      for (const c of viableChannels) {
        channels.push({
          id: `viable:${c.route}`,   // prefixed so resolveUpiSelection routes correctly
          label: c.label,
          route: c.route,
          primary: c.primary,
          healthy: c.healthy,
          detail: c.detail,
          checkedAt: c.checkedAt,
          provider: "VIABLE_PG",
        });
      }
    } catch {
      /* health unavailable — selector still shows; top-up still works on default */
    }
  }

  // ── Chagans PG gateways ─────────────────────────────────────────────────
  if (flags.upi && chagansConfigured()) {
    for (const c of chagansChannelHealth()) {
      channels.push({
        id: `chagans:${c.id}`,       // prefixed so resolveUpiSelection routes correctly
        label: c.userLabel,           // user-facing neutral label ("PG-1" / "PG-2")
        route: c.id,
        primary: c.primary,
        healthy: c.healthy,
        detail: c.detail,
        checkedAt: c.checkedAt,
        maxAmount: c.maxAmount,
        provider: "PG",               // neutral — hides vendor name from users
      });
    }
  }

  return NextResponse.json({ channels });
}
