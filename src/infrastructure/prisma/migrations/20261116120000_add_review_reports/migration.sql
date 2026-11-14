-- Issue #16: report a review (App Store guideline 1.2).
--
-- Only a new table (no change to tables with rows), so it is safe to deploy with data. One row per
-- (review, user); both foreign keys cascade, so deleting the review or the reporter's account removes it.
-- Matches the SQL `prisma migrate diff` generates from schema.prisma.

-- CreateTable
CREATE TABLE `ReviewReport` (
    `id` VARCHAR(191) NOT NULL,
    `reviewId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reason` ENUM('CLOSED', 'NOT_FREE', 'OVER_5000', 'SCHEDULE', 'INAPPROPRIATE', 'SPAM', 'OTHER') NOT NULL,
    `details` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReviewReport_reviewId_resolvedAt_idx`(`reviewId`, `resolvedAt`),
    INDEX `ReviewReport_userId_idx`(`userId`),
    UNIQUE INDEX `ReviewReport_reviewId_userId_key`(`reviewId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReviewReport` ADD CONSTRAINT `ReviewReport_reviewId_fkey` FOREIGN KEY (`reviewId`) REFERENCES `Review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewReport` ADD CONSTRAINT `ReviewReport_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
