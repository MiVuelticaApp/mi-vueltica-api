-- Issue #10: push notification settings.
--
-- New columns on `User` with defaults (everything on, no push sent yet): no data is rewritten, safe to deploy with data.

-- AlterTable
ALTER TABLE `User` ADD COLUMN `lastNearbyPushAt` DATETIME(3) NULL,
    ADD COLUMN `notifyMyStatus` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyNewNearby` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyReminders` BOOLEAN NOT NULL DEFAULT true;
