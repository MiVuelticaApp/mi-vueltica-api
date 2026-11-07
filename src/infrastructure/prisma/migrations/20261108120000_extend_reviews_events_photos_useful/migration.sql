-- Reviews for events as well as places, "went with" / "spent" fields, review photos and "útil" votes (issue #38).
-- Exactly one of Review.placeId / Review.eventId is set; this is enforced by the application, not by a CHECK
-- (MySQL 8 rejects a CHECK on columns used by a foreign key with a referential action, error 3823).
-- Review.userId becomes nullable with ON DELETE SET NULL: deleting an account keeps its reviews as "Anónimo".

-- DropForeignKey
ALTER TABLE `Review` DROP FOREIGN KEY `Review_userId_fkey`;

-- AlterTable
ALTER TABLE `Review` ADD COLUMN `eventId` VARCHAR(191) NULL,
    ADD COLUMN `spent` ENUM('NOTHING', 'UNDER_2500', 'FROM_2500_TO_5000') NULL,
    ADD COLUMN `wentWith` ENUM('FAMILY', 'FRIENDS', 'PARTNER', 'SOLO') NULL,
    MODIFY `userId` VARCHAR(191) NULL,
    MODIFY `placeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ReviewPhoto` (
    `reviewId` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `position` INTEGER NOT NULL,
    INDEX `ReviewPhoto_uploadId_idx`(`uploadId`),
    PRIMARY KEY (`reviewId`, `uploadId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewUsefulVote` (
    `reviewId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ReviewUsefulVote_userId_idx`(`userId`),
    PRIMARY KEY (`reviewId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Review_placeId_status_idx` ON `Review`(`placeId`, `status`);

-- CreateIndex
CREATE INDEX `Review_eventId_status_idx` ON `Review`(`eventId`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `Review_userId_eventId_key` ON `Review`(`userId`, `eventId`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewPhoto` ADD CONSTRAINT `ReviewPhoto_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewPhoto` ADD CONSTRAINT `ReviewPhoto_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewUsefulVote` ADD CONSTRAINT `ReviewUsefulVote_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewUsefulVote` ADD CONSTRAINT `ReviewUsefulVote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
