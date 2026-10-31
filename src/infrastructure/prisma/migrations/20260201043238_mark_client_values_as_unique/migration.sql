/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Client_name_key` ON `Client`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `Client_phoneNumber_key` ON `Client`(`phoneNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `Client_email_key` ON `Client`(`email`);
