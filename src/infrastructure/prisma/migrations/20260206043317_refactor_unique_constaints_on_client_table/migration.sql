/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber,companyId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Client_email_key` ON `Client`;

-- DropIndex
DROP INDEX `Client_name_key` ON `Client`;

-- DropIndex
DROP INDEX `Client_phoneNumber_key` ON `Client`;

-- CreateIndex
CREATE UNIQUE INDEX `Client_name_companyId_key` ON `Client`(`name`, `companyId`);

-- CreateIndex
CREATE UNIQUE INDEX `Client_phoneNumber_companyId_key` ON `Client`(`phoneNumber`, `companyId`);

-- CreateIndex
CREATE UNIQUE INDEX `Client_email_companyId_key` ON `Client`(`email`, `companyId`);
