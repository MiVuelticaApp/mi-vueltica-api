-- Issue #37: events with their own location, and favorites of events.
--
-- Hand-written (not the `prisma migrate diff` output), because that one fails on a table with rows:
-- it adds `Favorite.id` as NOT NULL without values and drops the primary key that the `userId`
-- foreign key relies on. Tested on MariaDB 11 and MySQL 8.4, with and without existing favorites.
-- MySQL commits each DDL statement on its own: if this fails halfway, check which steps ran before
-- `prisma migrate resolve` (see AGENTS.md, "Database").

-- Event: own location, used only when the event has no place.
ALTER TABLE `Event` ADD COLUMN `latitude` DECIMAL(9, 6) NULL,
    ADD COLUMN `longitude` DECIMAL(9, 6) NULL,
    ADD COLUMN `address` VARCHAR(191) NULL;

CREATE INDEX `Event_latitude_longitude_idx` ON `Event`(`latitude`, `longitude`);

-- Favorite: from PRIMARY KEY (userId, placeId) to its own id, with either placeId or eventId.
-- 1. New columns, nullable for now so that the existing rows can be filled.
ALTER TABLE `Favorite` ADD COLUMN `id` VARCHAR(191) NULL,
    ADD COLUMN `eventId` VARCHAR(191) NULL;

-- 2. One id per existing favorite (from now on Prisma generates them).
UPDATE `Favorite` SET `id` = UUID() WHERE `id` IS NULL;

-- 3. The unique index goes first: it takes over from the primary key as the index that the `userId`
--    foreign key needs; without it MySQL refuses to drop the primary key (error 1553).
CREATE UNIQUE INDEX `Favorite_userId_placeId_key` ON `Favorite`(`userId`, `placeId`);

-- 4. Swap the primary key; `placeId` becomes optional.
ALTER TABLE `Favorite` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `placeId` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

CREATE UNIQUE INDEX `Favorite_userId_eventId_key` ON `Favorite`(`userId`, `eventId`);

CREATE INDEX `Favorite_userId_createdAt_idx` ON `Favorite`(`userId`, `createdAt`);

ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
