/**
 * Twilio adapter — covers two separate services:
 *
 * 1. Twilio Verify (managed OTP)
 *    Activate: PARTNER_OTP_PROVIDER=twilio
 *    Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
 *
 * 2. Twilio Programmable Messaging (transactional SMS — invite links,
 *    notifications, etc.)
 *    Activate: PARTNER_SMS_ENABLED=true  (Twilio is preferred over MSG91 when
 *              TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER is set)
 *    Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 *              + TWILIO_MESSAGING_SERVICE_SID  (recommended — handles sender
 *                rotation, geo-match, and India A2P compliance automatically)
 *              OR TWILIO_FROM_NUMBER  (fallback — a single Twilio number in
 *                +91XXXXXXXXXX format)
 *
 *    India A2P / DLT: Twilio registers templates with TRAI on your behalf when
 *    you use a Messaging Service. For extra control you can pin each message
 *    slug to a pre-approved Twilio ContentSid:
 *      TWILIO_CONTENT_SID_ONBOARD_INVITE=HXxxx
 *      TWILIO_CONTENT_SID_ONBOARD_SUCCESS=HXxxx
 *      (env key = TWILIO_CONTENT_SID_ + SLUG_UPPER)
 */
import type { PartnerResult, SmsProvider } from "./types";

function accountSid(): string {
  return process.env.TWILIO_ACCOUNT_SID!;
}

function authToken(): string {
  return process.env.TWILIO_AUTH_TOKEN!;
}

function verifyServiceSid(): string {
  return process.env.TWILIO_VERIFY_SERVICE_SID!;
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${accountSid()}:${authToken()}`).toString("base64")}`;
}

export function twilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

export function isTwilioOtpEnabled(): boolean {
  return process.env.PARTNER_OTP_PROVIDER === "twilio" && twilioConfigured();
}

/**
 * Send a verification code via Twilio Verify.
 * Twilio generates the OTP and delivers it via the specified channel.
 */
export async function sendVerification(input: {
  to: string;
  channel: "sms" | "email" | "whatsapp";
}): Promise<PartnerResult<{ sid: string; status: string }>> {
  try {
    const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid()}/Verifications`;

    const body = new URLSearchParams({
      To: input.to,
      Channel: input.channel,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();

    if (res.ok && data.status === "pending") {
      return {
        ok: true,
        data: { sid: data.sid, status: data.status },
        raw: data,
      };
    }

    return {
      ok: false,
      code: `TWILIO_${data.code ?? res.status}`,
      message: data.message ?? "Failed to send verification",
      raw: data,
    };
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      message: (e as Error).message,
    };
  }
}

/**
 * Check a verification code via Twilio Verify.
 * Returns approved/pending/canceled status.
 */
export async function checkVerification(input: {
  to: string;
  code: string;
}): Promise<PartnerResult<{ sid: string; status: string; valid: boolean }>> {
  try {
    const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid()}/VerificationCheck`;

    const body = new URLSearchParams({
      To: input.to,
      Code: input.code,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();

    if (res.ok && data.status === "approved") {
      return {
        ok: true,
        data: { sid: data.sid, status: data.status, valid: true },
        raw: data,
      };
    }

    if (res.ok) {
      return {
        ok: false,
        code: "INVALID_CODE",
        message: "Invalid verification code",
        raw: data,
      };
    }

    return {
      ok: false,
      code: `TWILIO_${data.code ?? res.status}`,
      message: data.message ?? "Verification check failed",
      raw: data,
    };
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      message: (e as Error).message,
    };
  }
}

/**
 * Send a transactional SMS via Twilio Programmable Messaging.
 * Used for non-OTP messages (e.g. onboard success notification).
 * Requires a Twilio phone number or Messaging Service SID.
 */
export async function sendSms(input: {
  to: string;
  body: string;
}): Promise<PartnerResult<{ messageId: string }>> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid()}/Messages.json`;

    const params = new URLSearchParams({
      To: input.to,
      Body: input.body,
    });

    const msgServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (msgServiceSid) {
      params.set("MessagingServiceSid", msgServiceSid);
    } else if (fromNumber) {
      params.set("From", fromNumber);
    } else {
      return {
        ok: false,
        code: "CONFIG",
        message: "TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER is required for transactional SMS",
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (res.ok || res.status === 201) {
      return {
        ok: true,
        data: { messageId: data.sid },
        raw: data,
      };
    }

    return {
      ok: false,
      code: `TWILIO_${data.code ?? res.status}`,
      message: data.message ?? "Failed to send SMS",
      raw: data,
    };
  } catch (e) {
    return {
      ok: false,
      code: "NETWORK",
      message: (e as Error).message,
    };
  }
}

export const twilioVerify = {
  name: "TWILIO_VERIFY",
  sendVerification,
  checkVerification,
  sendSms,
  twilioConfigured,
  isTwilioOtpEnabled,
} as const;

// ---------------------------------------------------------------------------
// Twilio Programmable Messaging — SmsProvider implementation
// ---------------------------------------------------------------------------

/**
 * Normalise any Indian phone number to E.164 (+91XXXXXXXXXX) for Twilio.
 *   "9090702705"      → "+919090702705"
 *   "+919090702705"   → "+919090702705"  (no-op)
 *   "919090702705"    → "+919090702705"
 */
function toE164India(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  // already has country code or unknown format — return as-is with + prefix
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Look up a pre-approved Twilio ContentSid for the given template slug.
 * Set env vars like TWILIO_CONTENT_SID_ONBOARD_INVITE=HXxxx to enable
 * DLT-pinned delivery for India A2P compliance.
 */
function contentSidFor(slug: string): string | undefined {
  return process.env[`TWILIO_CONTENT_SID_${slug.toUpperCase()}`];
}

/**
 * Free-form SMS body builders — used as fallback when no ContentSid is set.
 * Keep each message ≤ 160 chars where possible to avoid multi-part SMS charges.
 */
const SMS_BODIES: Record<string, ((v: Record<string, string>) => string) | undefined> = {
  onboard_invite: (v) =>
    `eMoney: You're invited as ${v.role}. Complete registration: ${v.link}`,
  onboard_success: (v) =>
    `eMoney: Welcome! Your ${v.role} account is active. Login: ${v.link}`,
  declaration_approval: (v) =>
    `eMoney: Approve the declaration for your downline member: ${v.link}`,
  declaration_approved: (v) =>
    `eMoney: Your declaration has been approved. Login to continue.`,
  declaration_rejected: (v) =>
    `eMoney: Your declaration was rejected. Reason: ${v.reason ?? "See dashboard."}`,
};

/** Send an SMS via Twilio Content API (pre-approved template + variables). */
async function sendSmsWithContent(input: {
  to: string;
  contentSid: string;
  contentVariables: Record<string, string>;
}): Promise<PartnerResult<{ messageId: string }>> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid()}/Messages.json`;
    const params = new URLSearchParams({
      To: toE164India(input.to),
      ContentSid: input.contentSid,
      ContentVariables: JSON.stringify(input.contentVariables),
    });

    const msgServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (msgServiceSid) {
      params.set("MessagingServiceSid", msgServiceSid);
    } else if (fromNumber) {
      params.set("From", toE164India(fromNumber));
    } else {
      return { ok: false, code: "CONFIG", message: "TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER required" };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (res.ok || res.status === 201) return { ok: true, data: { messageId: data.sid }, raw: data };
    return { ok: false, code: `TWILIO_${data.code ?? res.status}`, message: data.message ?? "Failed to send SMS", raw: data };
  } catch (e) {
    return { ok: false, code: "NETWORK", message: (e as Error).message };
  }
}

/**
 * Full SmsProvider backed by Twilio Programmable Messaging.
 * Resolves to TWILIO_SMS when twilioSmsConfigured() is true and
 * PARTNER_SMS_ENABLED=true.
 */
export const twilioSms: SmsProvider = {
  name: "TWILIO_SMS",

  async sendOtp({ phone, otp }) {
    // Use Twilio Verify if configured — it handles DLT/delivery automatically.
    if (isTwilioOtpEnabled()) {
      const r = await sendVerification({ to: toE164India(phone), channel: "sms" });
      // Twilio Verify generates its own OTP; the otp arg is ignored here.
      // (Routes that use getPartner("otpVerify") bypass this entirely.)
      if (r.ok) return { ok: true, data: { messageId: r.data.sid } };
      return r as PartnerResult<{ messageId: string }>;
    }
    // Fallback: deliver OTP via Programmable Messaging
    const body = `Your eMoney verification code is ${otp}. Valid for 5 minutes. Do not share.`;
    const r = await sendSms({ to: toE164India(phone), body });
    return r;
  },

  async sendTransactional({ phone, templateId, variables }) {
    // Prefer a pre-approved ContentSid (India A2P / DLT compliance).
    const sid = contentSidFor(templateId);
    if (sid) {
      return sendSmsWithContent({ to: phone, contentSid: sid, contentVariables: variables });
    }
    // Fall back to a free-form message body built from the slug.
    const builder = SMS_BODIES[templateId];
    const body = builder
      ? builder(variables)
      : `eMoney notification. Visit your dashboard for details.`;
    return sendSms({ to: toE164India(phone), body });
  },
};

/** True when Twilio Programmable Messaging credentials are present. */
export function twilioSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM_NUMBER)
  );
}
