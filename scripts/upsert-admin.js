/**
 * Create or update the ADMIN account (idempotent).
 * Also clears login lockout / rate-limit rows so the account can sign in right away.
 *
 *   node scripts/upsert-admin.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const ADMIN = {
  name: "Manish admin",
  email: "cto@samedaysolution.in",
  phone: "+919000000205",
  password: "Lion_9090702707",
};

(async () => {
  const passwordHash = await bcrypt.hash(ADMIN.password, 12);

  const user = await p.user.upsert({
    where: { email: ADMIN.email },
    update: {
      name: ADMIN.name,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      deletedAt: null,
      tokenVersion: { increment: 1 },
    },
    create: {
      name: ADMIN.name,
      email: ADMIN.email,
      phone: ADMIN.phone,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("Upserted:", user.id, user.name, user.email, user.role, user.status);

  // Clear lockout + rate limits from earlier failed attempts.
  try {
    const a = await p.loginAttempt.deleteMany({ where: { identifier: ADMIN.email } });
    const r = await p.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
    console.log(`Cleared ${a.count} lockout row(s), ${r.count} login rate-limit row(s)`);
  } catch (e) {
    console.log("WARN clearing lockout:", e.message.split("\n")[0]);
  }

  // Verify
  const fresh = await p.user.findFirst({ where: { email: ADMIN.email, deletedAt: null } });
  console.log("Password verifies:", await bcrypt.compare(ADMIN.password, fresh.passwordHash));

  await p.$disconnect();
})().catch(async (e) => {
  console.error("ERROR:", e);
  await p.$disconnect();
  process.exit(1);
});
