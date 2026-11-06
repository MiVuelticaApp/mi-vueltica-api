-- AlterTable
ALTER TABLE `Photo` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `eventId` VARCHAR(191) NULL,
    ADD COLUMN `uploadId` VARCHAR(191) NULL,
    MODIFY `placeId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Upload` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `objectKey` VARCHAR(255) NOT NULL,
    `contentType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Upload_objectKey_key`(`objectKey`),
    INDEX `Upload_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubmissionUpload` (
    `submissionId` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NOT NULL,

    INDEX `SubmissionUpload_uploadId_idx`(`uploadId`),
    PRIMARY KEY (`submissionId`, `uploadId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Photo_placeId_position_idx` ON `Photo`(`placeId`, `position`);

-- CreateIndex
CREATE INDEX `Photo_eventId_position_idx` ON `Photo`(`eventId`, `position`);

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Photo` ADD CONSTRAINT `Photo_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionUpload` ADD CONSTRAINT `SubmissionUpload_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `Submission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubmissionUpload` ADD CONSTRAINT `SubmissionUpload_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- A photo belongs to exactly one Place or one Event. This is enforced by the application
-- (PhotoOwner / PrismaPhotoRepository), not by a CHECK constraint: MySQL 8 rejects a CHECK on
-- columns used by a foreign key with a referential action (error 3823).
