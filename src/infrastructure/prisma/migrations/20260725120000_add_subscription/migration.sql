-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `tier` ENUM('FREE', 'BASIC') NOT NULL DEFAULT 'FREE',
    `status` ENUM('ACTIVE', 'IN_GRACE_PERIOD', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `provider` ENUM('REVENUECAT') NULL,
    `providerCustomerId` VARCHAR(191) NULL,
    `providerEntitlement` VARCHAR(191) NULL,
    `currentPeriodStart` DATETIME(3) NULL,
    `currentPeriodEnd` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subscription_companyId_key`(`companyId`),
    INDEX `Subscription_providerCustomerId_idx`(`providerCustomerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
