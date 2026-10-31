/*
  Warnings:

  - You are about to alter the column `number` on the `ClientBill` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to drop the column `description` on the `ClientBillItem` table. All the data in the column will be lost.
  - You are about to drop the column `ivaAmount` on the `ClientBillItem` table. All the data in the column will be lost.
  - You are about to drop the column `lineTotal` on the `ClientBillItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `ClientBillItem` table. All the data in the column will be lost.
  - Added the required column `unitGrossPrice` to the `ClientBillItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `productId` on table `ClientBillItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `ClientBillItem` DROP FOREIGN KEY `ClientBillItem_productId_fkey`;

-- DropIndex
DROP INDEX `ClientBillItem_productId_fkey` ON `ClientBillItem`;

-- AlterTable
ALTER TABLE `ClientBill` MODIFY `number` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `ClientBillItem` DROP COLUMN `description`,
    DROP COLUMN `ivaAmount`,
    DROP COLUMN `lineTotal`,
    DROP COLUMN `unitPrice`,
    ADD COLUMN `unitGrossPrice` DECIMAL(12, 2) NOT NULL,
    MODIFY `productId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `ClientBillItem` ADD CONSTRAINT `ClientBillItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
