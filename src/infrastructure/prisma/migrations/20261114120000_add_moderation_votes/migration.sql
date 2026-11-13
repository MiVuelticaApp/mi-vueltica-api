-- Issue #43: community moderation votes.
--
-- Only a new table (no change to tables with rows). Exactly one of submissionId / placeId / eventId is set,
-- enforced by the application: MySQL 8 rejects a CHECK on columns used by a foreign key with a referential
-- action (error 3823, see Photo). Tested on MariaDB 11 and MySQL 8.4.
-- CreateTable
CREATE TABLE `ModerationVote` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NULL,
    `placeId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `choice` ENUM('FOR', 'AGAINST') NOT NULL,
    `weight` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ModerationVote_userId_idx`(`userId`),
    UNIQUE INDEX `ModerationVote_submissionId_userId_key`(`submissionId`, `userId`),
    UNIQUE INDEX `ModerationVote_placeId_userId_key`(`placeId`, `userId`),
    UNIQUE INDEX `ModerationVote_eventId_userId_key`(`eventId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ModerationVote` ADD CONSTRAINT `ModerationVote_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationVote` ADD CONSTRAINT `ModerationVote_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationVote` ADD CONSTRAINT `ModerationVote_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationVote` ADD CONSTRAINT `ModerationVote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

