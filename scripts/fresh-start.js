/**
 * Fresh-start cleanup: delete extra users + wipe all transactional data.
 * Keeps: Manish Master (MASTER_ADMIN), Manish SD, MD, DT, RT.
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const KEEP_IDS = [
  "cmuwgivan00011hw207a552xn", // Manish Master - MASTER_ADMIN
  "cmuwgivhr00041hw2d35ui3th", // Manish SD - SUPER_DISTRIBUTOR
  "cmuwgivlr00061hw2c65qeedq", // Manish MD - MASTER_DISTRIBUTOR
  "cmuwgivp900081hw2ibgluq0r", // Manish DT - DISTRIBUTOR
  "cmuwgivsy000a1hw27m2sp9ik", // Manish RT - RETAILER
];

(async () => {
  console.log("=== eMoney Fresh Start ===\n");

  // 1. List who we're deleting
  const toDelete = await p.user.findMany({
    where: { id: { notIn: KEEP_IDS } },
    select: { id: true, name: true, role: true },
  });
  console.log("Users to DELETE:", toDelete.map((u) => `${u.name} (${u.role})`));

  const toKeep = await p.user.findMany({
    where: { id: { in: KEEP_IDS } },
    select: { id: true, name: true, role: true },
  });
  console.log("Users to KEEP:", toKeep.map((u) => `${u.name} (${u.role})`));

  const deleteUserIds = toDelete.map((u) => u.id);

  // 2. Disable append-only triggers on AuditLog & AuditAnchor
  console.log("\n[0/5] Disabling append-only triggers...");
  await p.$executeRawUnsafe(`ALTER TABLE "AuditLog" DISABLE TRIGGER USER`);
  await p.$executeRawUnsafe(`ALTER TABLE "AuditAnchor" DISABLE TRIGGER USER`);

  // 3. Wipe all transactional/operational data (order matters for FK constraints)
  console.log("[1/5] Wiping transactional & operational data...");

  const counts = {};
  const del = async (table) => {
    try {
      const r = await p.$executeRawUnsafe(`DELETE FROM "${table}"`);
      if (r > 0) counts[table] = r;
    } catch (e) {
      console.log(`   WARN: ${table}: ${e.message.split("\n")[0]}`);
    }
  };

  // Incentive system
  await del("IncentivePayout");
  await del("UserIncentiveConfig");
  await del("IncentiveTier");
  await del("IncentiveScheme");

  // POS settlement & rental
  await del("PosBookingEvent");
  await del("PosBookingRequest");
  await del("PosRentalInvoice");
  await del("PosSubscription");
  await del("PosRentalPlan");
  await del("PosSettlementEntry");
  await del("PosManualSlip");
  await del("PosWebhookDelivery");
  await del("PosAssignmentLog");
  await del("PosTransactionMirror");
  await del("PosMachine");

  // PG / QR / AEPS
  await del("PgSettlementEntry");
  await del("QrClaim");
  await del("AepsSettlement");
  await del("AepsSettlementAccount");
  await del("AepsMerchant");

  // Settlement
  await del("SettlementAlert");
  await del("SettlementRun");

  // Commission & TDS
  await del("TdsLedgerEntry");
  await del("CommissionCredit");
  await del("CommissionSlab");

  // Brand MDR
  await del("BrandMdrRate");
  await del("Brand");
  await del("CompanyMdrFloor");
  await del("RailMdrRate");
  await del("MdrSlab");

  // Reversals
  await del("Reversal");

  // Wallet operations & liens
  await del("WalletLien");
  await del("WalletOperation");

  // Network transfers
  await del("HierarchyTransfer");
  await del("NetworkWalletTransfer");

  // Fund requests
  await del("FundRequest");

  // Disputes
  await del("DisputeMessage");
  await del("Dispute");

  // Payout
  await del("PayoutRequest");
  await del("PayoutBeneficiary");

  // Wallet & transactions
  await del("WalletTxn");
  await del("Transaction");

  // Webhooks & API keys
  await del("WebhookDelivery");
  await del("WebhookEndpoint");
  await del("ApiKey");

  // Notifications
  await del("Notification");

  // Audit (triggers disabled above)
  await del("AuditLog");
  await del("AuditAnchor");

  // AML
  await del("AmlAlert");

  // Rate limits, idempotency, card cache
  await del("RateLimit");
  await del("IdempotencyKey");
  await del("CardBinCache");

  // Sliders, StaticQR, Platform settings
  await del("Slider");
  await del("StaticQr");

  // Sessions & auth
  await del("Session");
  await del("LoginAttempt");
  await del("Otp");

  console.log("   Deleted:", counts);

  // 4. Delete data belonging to users being removed
  console.log("\n[2/5] Removing data for users being deleted...");
  if (deleteUserIds.length > 0) {
    for (const id of deleteUserIds) {
      await p.$executeRawUnsafe(`DELETE FROM "ReKycLog" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "KycVideo" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "Document" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "Kyc" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "UserLimit" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "UserSettlementConfig" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "WhitelabelProfile" WHERE "userId" = '${id}'`);
      await p.$executeRawUnsafe(`DELETE FROM "SchemeSlab" WHERE "schemeId" IN (SELECT id FROM "Scheme" WHERE "ownerId" = '${id}')`);
      await p.$executeRawUnsafe(`DELETE FROM "Scheme" WHERE "ownerId" = '${id}'`);
    }
    console.log("   Done for", deleteUserIds.length, "users");
  }

  // 5. Clean invites, declarations, verifications
  console.log("\n[3/5] Cleaning invites, declarations, verifications...");
  await del("DeclarationApproval");
  await del("VerificationResult");
  await del("JoinRequest");
  await del("Invite");
  await del("IdentityException");

  // 6. Delete the extra users
  console.log("\n[4/5] Deleting extra users...");
  if (deleteUserIds.length > 0) {
    const r = await p.user.deleteMany({ where: { id: { in: deleteUserIds } } });
    console.log(`   Deleted ${r.count} users`);
  }

  // 7. Reset 2FA + clean state for kept users
  console.log("\n[5/5] Resetting kept users to clean state...");
  await p.user.updateMany({
    where: { id: { in: KEEP_IDS } },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
      twoFactorVerifiedAt: null,
      reKycRequired: false,
      lastReKycAt: null,
      reKycDueAt: null,
      tokenVersion: { increment: 1 },
    },
  });
  console.log("   Reset 2FA & re-KYC state for kept users");

  // Re-enable triggers
  await p.$executeRawUnsafe(`ALTER TABLE "AuditLog" ENABLE TRIGGER USER`);
  await p.$executeRawUnsafe(`ALTER TABLE "AuditAnchor" ENABLE TRIGGER USER`);
  console.log("   Re-enabled AuditLog/AuditAnchor triggers");

  // Final check
  const remaining = await p.user.findMany({
    select: { name: true, role: true, email: true },
  });
  console.log("\n=== Remaining users ===");
  remaining.forEach((u) => console.log(`  ${u.name} (${u.role}) - ${u.email}`));
  console.log("\n✅ Fresh start complete!");

  await p.$disconnect();
})().catch(async (e) => {
  console.error("ERROR:", e);
  await p.$disconnect();
  process.exit(1);
});
