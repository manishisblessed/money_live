import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Body = z.object({
  channel: z.enum(["SMS", "EMAIL"]),
});

export const fetchCache = "force-no-store";
export const dynamic = "force-dynamic";

/**
 * Temporarily skip OTP verification during onboarding. Sets the verifiedAt
 * timestamp so the registration endpoint doesn't block. This is a stopgap
 * while SMS/email delivery is being stabilised — remove or gate behind a
 * platform setting once delivery is reliable.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  }

  if (!["PENDING", "REGISTERED"].includes(invite.status)) {
    return NextResponse.json(
      { error: "Invite is no longer active" },
      { status: 400 }
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { channel } = parsed.data;

  const updateField =
    channel === "SMS"
      ? { phoneVerifiedAt: new Date() }
      : { emailVerifiedAt: new Date() };

  await prisma.invite.update({
    where: { id: invite.id },
    data: updateField,
  });

  return NextResponse.json({ ok: true, skipped: true });
}
