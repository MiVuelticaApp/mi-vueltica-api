/*
  Warnings:

  - You are about to drop the column `netPrice` on the `Product` table. All the data in the column will be lost.
  - Added the required column `grossPrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Product` DROP COLUMN `netPrice`,
    ADD COLUMN `grossPrice` DECIMAL(12, 2) NOT NULL;
