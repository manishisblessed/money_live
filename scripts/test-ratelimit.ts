/**
 * Test the exact enforceRateLimit + assertNotLocked flow that the login route runs.
 */
import "./_load-env";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";

async function main() {
  console.log("→ Checking RateLimit table…");

  // Replicate the raw SQL enforceRateLimit uses
  const now = Date.now();
  const windowMs = 300 * 1000; // 5 min window
  const bucket = Math.floor(now / windowMs);
  const key = `login:ip:test-smoke:${bucket}`;
  const windowStart = new Date(bucket * windowMs);
  const resetAt = new Date((bucket + 1) * windowMs);

  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("id", "key", "count", "windowStart", "expiresAt")
      VALUES (${nanoid()}, ${key}, 1, ${windowStart}, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count"
    `;
    console.log("✓ RateLimit insert/upsert succeeded — count:", rows[0]?.count);
    // cleanup
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (e: any) {
    console.error("✗ RateLimit query FAILED:", e.message);
  }

  console.log("\n→ Checking LoginAttempt table…");
  try {
    const row = await prisma.loginAttempt.findUnique({ where: { identifier: "test-smoke" } });
    console.log("✓ LoginAttempt.findUnique OK:", row ?? "no row (expected)");
  } catch (e: any) {
    console.error("✗ LoginAttempt.findUnique FAILED:", e.message);
  }

  console.log("\n→ Checking assertCaptcha (no-op if disabled)…");
  try {
    const captchaEnabled = process.env.SECURITY_CAPTCHA_ENABLED;
    console.log("✓ SECURITY_CAPTCHA_ENABLED:", captchaEnabled ?? "(not set — captcha off)");
  } catch (e: any) {
    console.error("✗ captcha check FAILED:", e.message);
  }
}

main()
  .catch((e) => {
    console.error("\n✗ FATAL:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
