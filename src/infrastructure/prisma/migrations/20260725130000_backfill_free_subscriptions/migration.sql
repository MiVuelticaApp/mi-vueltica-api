-- Data migration: every existing organization must have a subscription, so that the
-- entitlement layer always finds a plan. Companies created before the Billing MVP get
-- the default FREE (Gratis) plan, active, with no expiry.
--
-- Idempotent: the NOT EXISTS guard means re-running this inserts nothing.
INSERT INTO `Subscription` (`id`, `tier`, `status`, `companyId`, `createdAt`, `updatedAt`)
SELECT UUID(), 'FREE', 'ACTIVE', `c`.`id`, NOW(3), NOW(3)
FROM `Company` AS `c`
WHERE NOT EXISTS (
    SELECT 1 FROM `Subscription` AS `s` WHERE `s`.`companyId` = `c`.`id`
);
