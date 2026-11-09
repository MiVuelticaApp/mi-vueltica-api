-- Issue #40: rejection reason codes, and the Place/Event an approved submission created.
--
-- Only nullable columns and foreign keys (safe on a table with rows). The UPDATE marks every submission
-- rejected before this migration as OTHER: they only have free text, which stays in `reviewNote`.
-- Approved submissions from before this migration keep `createdPlaceId` / `createdEventId` NULL: there
-- is no reliable way to know which Place/Event they created. Tested on MariaDB 11 and MySQL 8.4.

-- AlterTable
ALTER TABLE `Submission` ADD COLUMN `createdEventId` VARCHAR(191) NULL,
    ADD COLUMN `createdPlaceId` VARCHAR(191) NULL,
    ADD COLUMN `rejectionReason` ENUM('DUPLICATE', 'OVER_5000', 'PAST_EVENT', 'INCOMPLETE', 'WRONG_LOCATION', 'NOT_PUBLIC', 'INAPPROPRIATE', 'SPAM', 'OTHER') NULL;

-- Backfill: existing rejections become OTHER (their note is kept).
UPDATE `Submission` SET `rejectionReason` = 'OTHER' WHERE `status` = 'REJECTED' AND `rejectionReason` IS NULL;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_createdPlaceId_fkey` FOREIGN KEY (`createdPlaceId`) REFERENCES `Place`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_createdEventId_fkey` FOREIGN KEY (`createdEventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
