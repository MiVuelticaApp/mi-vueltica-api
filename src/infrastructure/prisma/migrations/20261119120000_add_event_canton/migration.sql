-- App issue #9: an event without a place can carry its own canton, so `GET /events?cantonId=` also finds it.
--
-- One nullable column on `Event` plus its index and foreign key (SET NULL, like `placeId`): no data is rewritten,
-- so it is safe to deploy with data. Existing events have NULL (they keep matching through their place). Same SQL as
-- Prisma generates.

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `cantonId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Event_cantonId_idx` ON `Event`(`cantonId`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_cantonId_fkey` FOREIGN KEY (`cantonId`) REFERENCES `Canton`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
