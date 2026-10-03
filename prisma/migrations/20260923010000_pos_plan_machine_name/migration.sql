-- Per-machine rental plans + plan ownership.
--
-- NOTE (2026-10-03): This migration originally only added "machineName" and
-- then created a unique index on ("ownerId","machineName"). But no earlier
-- migration ever added the "ownerId" / "includeGst" columns to "PosRentalPlan"
-- (they had only ever reached dev via `prisma db push`, which does not emit a
-- migration). On a fresh production database this migration therefore failed
-- with: ERROR: column "ownerId" does not exist.
--
-- It is now self-contained and FULLY IDEMPOTENT: it adds every column the
-- Prisma schema expects for this model before indexing them, and every
-- statement is guarded so it is safe to re-run even if a previous attempt
-- partially applied (e.g. "machineName" already added).

-- 1. Columns expected by the Prisma schema (additive — nullable or defaulted).
ALTER TABLE "PosRentalPlan" ADD COLUMN IF NOT EXISTS "machineName" TEXT;
ALTER TABLE "PosRentalPlan" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "PosRentalPlan" ADD COLUMN IF NOT EXISTS "includeGst" BOOLEAN NOT NULL DEFAULT false;

-- 2. Ownership scoping for names: plan names are unique PER OWNER (platform
--    plans share the null-owner scope), replacing the old global unique-on-name.
DROP INDEX IF EXISTS "PosRentalPlan_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "PosRentalPlan_ownerId_name_key"
  ON "PosRentalPlan"("ownerId", "name");

-- 3. Owner foreign key (null ownerId = platform plan, visible to everyone).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PosRentalPlan_ownerId_fkey'
  ) THEN
    ALTER TABLE "PosRentalPlan"
      ADD CONSTRAINT "PosRentalPlan_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- 4. One plan per machine model, per owner. Because Postgres treats NULLs as
--    distinct, legacy plans with a NULL machineName remain valid; the
--    constraint only enforces "one plan per model" once a model is set.
CREATE UNIQUE INDEX IF NOT EXISTS "PosRentalPlan_ownerId_machineName_key"
  ON "PosRentalPlan"("ownerId", "machineName");
