/**
 * Create or update Mukesh Kedia as MASTER_ADMIN (idempotent).
 * Also clears any login lockout / rate-limit rows so the account can sign in immediately.
 *
 *   node scripts/upsert-master-admin.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

const MASTER = {
  name: "Mukesh Kedia",
  email: "mukeshkedia1986@gmail.com",
  phone: "+919000000206",   // placeholder — update if a real phone is needed
  password: "Dmcpay@9820",
};

(async () => {
  const passwordHash = await bcrypt.hash(MASTER.password, 12);

  const user = await p.user.upsert({
    where: { email: MASTER.email },
    update: {
      name: MASTER.name,
      passwordHash,
      role: "MASTER_ADMIN",
      status: "ACTIVE",
      deletedAt: null,
      tokenVersion: { increment: 1 },
    },
    create: {
      name: MASTER.name,
      email: MASTER.email,
      phone: MASTER.phone,
      passwordHash,
      role: "MASTER_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("✅ Upserted:", user.id, "|", user.name, "|", user.email, "|", user.role, "|", user.status);

  // Clear any lockout rows from previous failed attempts
  try {
    const a = await p.loginAttempt.deleteMany({ where: { identifier: MASTER.email } });
    const r = await p.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
    console.log(`   Cleared ${a.count} lockout row(s), ${r.count} login rate-limit row(s)`);
  } catch (e) {
    console.log("   WARN clearing lockout:", e.message.split("\n")[0]);
  }

  // Confirm password hash is correct
  const fresh = await p.user.findFirst({ where: { email: MASTER.email, deletedAt: null } });
  console.log("   Password verifies:", await bcrypt.compare(MASTER.password, fresh.passwordHash));

  await p.$disconnect();
})().catch(async (e) => {
  console.error("ERROR:", e);
  await p.$disconnect();
  process.exit(1);
});
