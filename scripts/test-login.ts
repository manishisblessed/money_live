/**
 * Quick login smoke-test — simulates the /api/auth/login logic directly
 * so we can see the real error without going through the HTTP stack.
 */
import "./_load-env";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const TEST_EMAIL = "support@grandhr.in";
const TEST_PASS = "Lion_9090702707";

async function main() {
  console.log("→ Testing login for:", TEST_EMAIL);

  // 1) Find user
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: TEST_EMAIL }, { phone: TEST_EMAIL }], deletedAt: null },
  });

  if (!user) {
    console.error("✗ User not found in DB");
    return;
  }
  console.log("✓ User found:", user.id, user.name, user.role, user.status);

  // 2) Check password
  const valid = await bcrypt.compare(TEST_PASS, user.passwordHash);
  console.log("✓ Password valid:", valid);

  if (!valid) {
    console.error("✗ Password mismatch");
    return;
  }

  // 3) Check lockout table
  const attempt = await prisma.loginAttempt.findUnique({ where: { identifier: TEST_EMAIL } });
  console.log("✓ LoginAttempt row:", attempt ?? "none (not locked)");

  // 4) Check RateLimit table
  const rateRows = await prisma.rateLimit.findMany({ where: { key: { startsWith: "login:" } }, take: 5 });
  console.log("✓ RateLimit rows:", rateRows.length);

  // 5) Try prisma.user.update (last login fields)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginLat: 19.076,
      lastLoginLng: 72.877,
      lastLoginAt: new Date(),
      lastLoginIp: "127.0.0.1",
      lastLoginUserAgent: "test-script",
      knownDevices: [],
    },
  });
  console.log("✓ user.update (last-login fields) succeeded");

  // 6) AuditLog insert
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "test.login_check",
      entity: "User",
      entityId: user.id,
      meta: { test: true },
      ip: "127.0.0.1",
    },
  });
  console.log("✓ AuditLog insert succeeded");

  console.log("\n✅ All login steps passed — no server errors expected");
}

main()
  .catch((e) => {
    console.error("\n✗ FAILED:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
