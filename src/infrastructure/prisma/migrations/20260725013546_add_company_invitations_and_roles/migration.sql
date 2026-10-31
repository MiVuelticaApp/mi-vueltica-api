-- AlterTable
ALTER TABLE `Client` MODIFY `deletedAt` DATETIME(3) NULL DEFAULT NULL;

-- AlterTable
ALTER TABLE `Product` MODIFY `deletedAt` DATETIME(3) NULL DEFAULT NULL;

-- AlterTable
ALTER TABLE `UserCompany` MODIFY `role` ENUM('OWNER', 'ADMIN', 'DEALER') NOT NULL DEFAULT 'OWNER';

-- CreateTable
CREATE TABLE `CompanyInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'DEALER') NOT NULL DEFAULT 'DEALER',
    `status` ENUM('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CompanyInvitation_token_key`(`token`),
    UNIQUE INDEX `CompanyInvitation_email_companyId_key`(`email`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CompanyInvitation` ADD CONSTRAINT `CompanyInvitation_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyInvitation` ADD CONSTRAINT `CompanyInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
