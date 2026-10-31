-- AlterTable
ALTER TABLE `Route` ADD COLUMN `polyline` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `RoutePoint` ADD COLUMN `polyline` VARCHAR(191) NULL;
