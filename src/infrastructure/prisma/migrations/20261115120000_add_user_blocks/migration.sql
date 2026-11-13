-- Issue #17: block users (App Store guideline 1.2).
--
-- Only a new table (no change to tables with rows), so it is safe to deploy with data. One row per
-- (blocker, blocked) pair; both foreign keys cascade, so deleting either account (a hard delete, see
-- AGENTS.md "Account deletion") removes its blocks. Not yet run against a database: it mirrors the SQL
-- Prisma generated for the earlier migrations (see #62's ModerationVote), so run `prisma migrate dev` or
-- `prisma migrate diff` to confirm it matches schema.prisma before deploying.

-- CreateTable
CREATE TABLE `UserBlock` (
    `id` VARCHAR(191) NOT NULL,
    `blockerId` VARCHAR(191) NOT NULL,
    `blockedId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserBlock_blockedId_idx`(`blockedId`),
    UNIQUE INDEX `UserBlock_blockerId_blockedId_key`(`blockerId`, `blockedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserBlock` ADD CONSTRAINT `UserBlock_blockerId_fkey` FOREIGN KEY (`blockerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBlock` ADD CONSTRAINT `UserBlock_blockedId_fkey` FOREIGN KEY (`blockedId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
