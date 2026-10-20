-- Remove "Unified Bill Payment Platform" (bbps_bulkpe_svc) and
-- "Offline CC Bill Payment" (rechargekit_direct) completely.
--
-- These two products have been retired from the application:
--   - bbps_bulkpe_svc was an orphan rail (RailMdrRate rows only, no ServiceRoute row).
--   - rechargekit_direct has both a ServiceRoute row and may have RailMdrRate rows.
--
-- Safe to re-run: DELETE ... WHERE is a no-op when the rows are already gone.

-- 1. Remove any BBPS rate-card entries for the retired scopes.
DELETE FROM "RailMdrRate"
WHERE "scopeKey" IN ('bbps_bulkpe_svc', 'rechargekit_direct');

-- 2. Remove the ServiceRoute row for rechargekit_direct.
--    Also clears it from every user's enabledServices allowlist so no
--    existing user silently retains access to a route that no longer exists.
UPDATE "User"
SET "enabledServices" = array_remove("enabledServices", 'rechargekit_direct')
WHERE 'rechargekit_direct' = ANY("enabledServices");

DELETE FROM "ServiceRoute"
WHERE "key" = 'rechargekit_direct';
