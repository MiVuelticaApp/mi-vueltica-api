-- Verifications ("¿Sigue siendo gratis?") and reports with automatic hiding (issue #39).
-- Verification/Report belong to exactly one Place or Event; enforced by the application, not by a CHECK
-- (MySQL 8 rejects a CHECK on columns used by a foreign key with a referential action, error 3823).
-- AlterTable
ALTER TABLE `Place` ADD COLUMN `authorId` VARCHAR(191) NULL,
    ADD COLUMN `hiddenReason` VARCHAR(191) NULL,
    ADD COLUMN `reportedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `authorId` VARCHAR(191) NULL,
    ADD COLUMN `hiddenReason` VARCHAR(191) NULL,
    ADD COLUMN `reportedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Verification` (
    `id` VARCHAR(191) NOT NULL,
    `placeId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `personKey` VARCHAR(160) NOT NULL,
    `stillHappening` ENUM('YES', 'NO', 'DONT_KNOW') NOT NULL,
    `pricePaid` ENUM('FREE', 'UNDER_2500', 'FROM_2500_TO_5000', 'OVER_5000') NULL,
    `scheduleCorrect` BOOLEAN NULL,
    `correctedTime` VARCHAR(100) NULL,
    `uploadId` VARCHAR(191) NULL,
    `photoUrl` VARCHAR(2048) NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Verification_userId_idx`(`userId`),
    INDEX `Verification_uploadId_idx`(`uploadId`),
    UNIQUE INDEX `Verification_placeId_personKey_key`(`placeId`, `personKey`),
    UNIQUE INDEX `Verification_eventId_personKey_key`(`eventId`, `personKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `placeId` VARCHAR(191) NULL,
    `eventId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `personKey` VARCHAR(160) NOT NULL,
    `reason` ENUM('CLOSED', 'NOT_FREE', 'OVER_5000', 'SCHEDULE', 'INAPPROPRIATE', 'SPAM', 'OTHER') NOT NULL,
    `details` TEXT NULL,
    `uploadId` VARCHAR(191) NULL,
    `photoUrl` VARCHAR(2048) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Report_resolvedAt_createdAt_idx`(`resolvedAt`, `createdAt`),
    INDEX `Report_userId_idx`(`userId`),
    INDEX `Report_uploadId_idx`(`uploadId`),
    UNIQUE INDEX `Report_placeId_personKey_key`(`placeId`, `personKey`),
    UNIQUE INDEX `Report_eventId_personKey_key`(`eventId`, `personKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Place` ADD CONSTRAINT `Place_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Verification` ADD CONSTRAINT `Verification_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Verification` ADD CONSTRAINT `Verification_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Verification` ADD CONSTRAINT `Verification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Verification` ADD CONSTRAINT `Verification_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_placeId_fkey` FOREIGN KEY (`placeId`) REFERENCES `Place`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

