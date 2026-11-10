-- Issue #42: reputation ledger, cached points and the user's province.
--
-- Safe on tables with rows: `User` only gains a nullable column and a NOT NULL column with a default,
-- and `ReputationEvent` is new. The backfill then gives the points earned before this migration
-- (positive ones only, so the floor at 0 never matters): +10 per approved submission, +2 per plan a
-- signed-in user verified, +1 per "útil" vote received. Penalties start counting from this deploy.
-- The cause keys match `reputationCause` in src/domain/reputation/entities/ReputationEvent.ts, so these
-- causes are never awarded again. Tested on MariaDB 11 and MySQL 8.4.
--
-- MySQL commits each DDL statement: if a later statement fails, the earlier ones stay applied (see
-- AGENTS.md "Database"). The backfill INSERTs and the UPDATE only run after every DDL succeeded.

-- AlterTable
ALTER TABLE `User` ADD COLUMN `provinceId` INTEGER NULL,
    ADD COLUMN `reputationPoints` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ReputationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `kind` ENUM('SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'VERIFICATION', 'REVIEW_USEFUL', 'PLAN_HIDDEN', 'MODERATION_VOTE', 'MODERATION_MINORITY') NOT NULL,
    `delta` INTEGER NOT NULL,
    `causeKey` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReputationEvent_causeKey_key`(`causeKey`),
    INDEX `ReputationEvent_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `User_provinceId_idx` ON `User`(`provinceId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_provinceId_fkey` FOREIGN KEY (`provinceId`) REFERENCES `Province`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReputationEvent` ADD CONSTRAINT `ReputationEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: approved submissions (+10 to the author).
INSERT INTO `ReputationEvent` (`id`, `userId`, `kind`, `delta`, `causeKey`, `createdAt`)
SELECT UUID(), `s`.`userId`, 'SUBMISSION_APPROVED', 10, CONCAT('submission-approved:', `s`.`id`), COALESCE(`s`.`reviewedAt`, `s`.`createdAt`)
FROM `Submission` `s`
WHERE `s`.`status` = 'PUBLISHED';

-- Backfill: verifications by signed-in users (+2 per plan; there is one row per person and plan).
INSERT INTO `ReputationEvent` (`id`, `userId`, `kind`, `delta`, `causeKey`, `createdAt`)
SELECT UUID(), `v`.`userId`, 'VERIFICATION', 2,
       CONCAT('verification:', IF(`v`.`placeId` IS NOT NULL, 'PLACE', 'EVENT'), ':', COALESCE(`v`.`placeId`, `v`.`eventId`), ':', `v`.`userId`),
       `v`.`createdAt`
FROM `Verification` `v`
WHERE `v`.`userId` IS NOT NULL AND (`v`.`placeId` IS NOT NULL OR `v`.`eventId` IS NOT NULL);

-- Backfill: "útil" votes (+1 to the review's author; own votes are rejected by the API, skipped anyway).
INSERT INTO `ReputationEvent` (`id`, `userId`, `kind`, `delta`, `causeKey`, `createdAt`)
SELECT UUID(), `r`.`userId`, 'REVIEW_USEFUL', 1, CONCAT('useful:', `u`.`reviewId`, ':', `u`.`userId`), `u`.`createdAt`
FROM `ReviewUsefulVote` `u`
JOIN `Review` `r` ON `r`.`id` = `u`.`reviewId`
WHERE `r`.`userId` IS NOT NULL AND `r`.`userId` <> `u`.`userId`;

-- Cached totals.
UPDATE `User` `usr`
SET `usr`.`reputationPoints` = (SELECT COALESCE(SUM(`e`.`delta`), 0) FROM `ReputationEvent` `e` WHERE `e`.`userId` = `usr`.`id`);
