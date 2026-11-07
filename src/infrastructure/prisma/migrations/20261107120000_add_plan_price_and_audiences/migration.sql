-- AlterTable
ALTER TABLE `Place` ADD COLUMN `audienceEveryone` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `audienceFamilies` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `audienceSeniors` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `audienceStudents` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `freeForSeniors` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `freeForStudents` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pricePerPerson` INTEGER NULL,
    ADD COLUMN `wheelchairAccessible` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `audienceEveryone` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `audienceFamilies` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `audienceSeniors` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `audienceStudents` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `freeForSeniors` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `freeForStudents` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pricePerPerson` INTEGER NULL,
    ADD COLUMN `wheelchairAccessible` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Place_status_pricePerPerson_idx` ON `Place`(`status`, `pricePerPerson`);


-- Backfill the new audience flags from the legacy single-value `targetAudience`.
-- EVERYONE / ADULTS keep the default (`audienceEveryone`). SENIORS maps to "ciudadanos de oro"
-- and CHILDREN to "familias". Prices stay NULL (unknown) until someone sets them.
UPDATE `Place` SET `audienceEveryone` = false, `audienceSeniors` = true WHERE `targetAudience` = 'SENIORS';
UPDATE `Place` SET `audienceEveryone` = false, `audienceFamilies` = true WHERE `targetAudience` = 'CHILDREN';
UPDATE `Event` SET `audienceEveryone` = false, `audienceSeniors` = true WHERE `targetAudience` = 'SENIORS';
UPDATE `Event` SET `audienceEveryone` = false, `audienceFamilies` = true WHERE `targetAudience` = 'CHILDREN';
