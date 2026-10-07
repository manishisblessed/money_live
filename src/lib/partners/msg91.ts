/**
 * MSG91 SMS / OTP adapter (DLT-compliant for India).
 *
 * Activate: PARTNER_SMS_ENABLED=true
 * Required: MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID
 *
 * For transactional flow SMS, set the corresponding flow ID env vars:
 *   MSG91_FLOW_ONBOARD_INVITE  — Flow ID from MSG91 dashboard → Flow section
 */
import type { PartnerResult, SmsProvider } from "./types";

async function call<T>(path: string, body: unknown): Promise<PartnerResult<T>> {
  try {
    const res = await fetch(`https://control.msg91.com/api/v5${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authkey: process.env.MSG91_AUTH_KEY! },
      body: JSON.stringify(body)
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok || (json.type && json.type !== "success")) {
      return { ok: false, code: String(json.type ?? `HTTP_${res.status}`), message: String(json.message ?? "MSG91 error"), raw: json };
    }
    return { ok: true, data: json as T, raw: json };
  } catch (e) {
    return { ok: false, code: "NETWORK", message: (e as Error).message };
  }
}

/**
 * Resolve a human-readable template slug to the actual MSG91 Flow ID.
 * Slugs map 1-to-1 to env vars (MSG91_FLOW_<SLUG_UPPER>).
 * Falls back to the slug itself so existing behaviour is preserved if the
 * env var is unset (the call will fail at MSG91 with a clear error).
 */
function resolveFlowId(slug: string): string {
  const flowMap: Record<string, string | undefined> = {
    onboard_invite: process.env.MSG91_FLOW_ONBOARD_INVITE,
  };
  return flowMap[slug] ?? slug;
}

/**
 * Normalise an Indian phone number to the 12-digit format required by MSG91
 * (country code 91 + 10-digit mobile). Handles:
 *   "9090702705"     → "919090702705"
 *   "+919090702705"  → "919090702705"
 *   "919090702705"   → "919090702705"  (no-op)
 */
function toMsg91Mobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits; // best-effort for any other format
}

export const msg91Sms: SmsProvider = {
  name: "MSG91",
  async sendOtp({ phone, otp, templateId }) {
    const mobile = toMsg91Mobile(phone);
    const r = await call<{ request_id: string }>(`/otp?template_id=${templateId ?? process.env.MSG91_TEMPLATE_ID}&mobile=${mobile}&otp=${otp}`, {});
    return r.ok ? { ok: true, data: { messageId: r.data.request_id } } : r;
  },
  async sendTransactional({ phone, templateId, variables }) {
    // MSG91 Flow API v5 uses "flow_id" (not "template_id") for the flow/template.
    const flowId = resolveFlowId(templateId ?? "");
    const r = await call<{ request_id: string }>(`/flow/`, {
      flow_id: flowId,
      sender: process.env.MSG91_SENDER_ID,
      mobiles: toMsg91Mobile(phone),
      ...variables
    });
    return r.ok ? { ok: true, data: { messageId: r.data.request_id } } : r;
  }
};

export function msg91Configured(): boolean {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}
