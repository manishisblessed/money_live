-- Remove Unified Bill Payment Platform (bbps_bulkpe_svc) ServiceRoute row.
-- The RailMdrRate entries for this scope were already deleted in the prior
-- migration (20261020000000_remove_bulkpe_and_rechargekit_direct).
DELETE FROM "ServiceRoute" WHERE "key" = 'bbps_bulkpe_svc';

-- Remove Credit Card Bill Payment-2 (rechargekit_cc) — all layers.
DELETE FROM "RailMdrRate" WHERE "scopeKey" = 'rechargekit_cc';

UPDATE "User"
SET "enabledServices" = array_remove("enabledServices", 'rechargekit_cc')
WHERE 'rechargekit_cc' = ANY("enabledServices");

DELETE FROM "ServiceRoute" WHERE "key" = 'rechargekit_cc';
