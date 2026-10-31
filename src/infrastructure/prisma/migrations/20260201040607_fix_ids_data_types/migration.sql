/*
  Warnings:

  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ClientBill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ClientBillItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Supplier` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SupplierBill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SupplierBillItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `TaxPeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserCompany` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `Client` DROP FOREIGN KEY `Client_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientBill` DROP FOREIGN KEY `ClientBill_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientBill` DROP FOREIGN KEY `ClientBill_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientBillItem` DROP FOREIGN KEY `ClientBillItem_billId_fkey`;

-- DropForeignKey
ALTER TABLE `ClientBillItem` DROP FOREIGN KEY `ClientBillItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `Supplier` DROP FOREIGN KEY `Supplier_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `SupplierBill` DROP FOREIGN KEY `SupplierBill_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `SupplierBill` DROP FOREIGN KEY `SupplierBill_supplierId_fkey`;

-- DropForeignKey
ALTER TABLE `SupplierBillItem` DROP FOREIGN KEY `SupplierBillItem_billId_fkey`;

-- DropForeignKey
ALTER TABLE `TaxPeriod` DROP FOREIGN KEY `TaxPeriod_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `UserCompany` DROP FOREIGN KEY `UserCompany_companyId_fkey`;

-- DropIndex
DROP INDEX `Client_companyId_fkey` ON `Client`;

-- DropIndex
DROP INDEX `ClientBill_clientId_fkey` ON `ClientBill`;

-- DropIndex
DROP INDEX `ClientBill_companyId_fkey` ON `ClientBill`;

-- DropIndex
DROP INDEX `ClientBillItem_billId_fkey` ON `ClientBillItem`;

-- DropIndex
DROP INDEX `ClientBillItem_productId_fkey` ON `ClientBillItem`;

-- DropIndex
DROP INDEX `Product_companyId_fkey` ON `Product`;

-- DropIndex
DROP INDEX `Supplier_companyId_fkey` ON `Supplier`;

-- DropIndex
DROP INDEX `SupplierBill_companyId_fkey` ON `SupplierBill`;

-- DropIndex
DROP INDEX `SupplierBill_supplierId_fkey` ON `SupplierBill`;

-- DropIndex
DROP INDEX `SupplierBillItem_billId_fkey` ON `SupplierBillItem`;

-- DropIndex
DROP INDEX `TaxPeriod_companyId_fkey` ON `TaxPeriod`;

-- DropIndex
DROP INDEX `UserCompany_companyId_fkey` ON `UserCompany`;

-- AlterTable
ALTER TABLE `Client` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ClientBill` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `clientId` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ClientBillItem` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `billId` VARCHAR(191) NOT NULL,
    MODIFY `productId` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Company` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Product` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Supplier` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `SupplierBill` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `supplierId` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `SupplierBillItem` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `billId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `TaxPeriod` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `UserCompany` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `companyId` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `UserCompany` ADD CONSTRAINT `UserCompany_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientBill` ADD CONSTRAINT `ClientBill_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientBill` ADD CONSTRAINT `ClientBill_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientBillItem` ADD CONSTRAINT `ClientBillItem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `ClientBill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientBillItem` ADD CONSTRAINT `ClientBillItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierBill` ADD CONSTRAINT `SupplierBill_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierBill` ADD CONSTRAINT `SupplierBill_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierBillItem` ADD CONSTRAINT `SupplierBillItem_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `SupplierBill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaxPeriod` ADD CONSTRAINT `TaxPeriod_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
