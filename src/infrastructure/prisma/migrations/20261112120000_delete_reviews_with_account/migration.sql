-- Deleting an account deletes its reviews (the app's rule: published plans stay as "Anónimo", reviews go).
-- Until now `Review.userId` was ON DELETE SET NULL, which kept the text of deleted accounts as "Anónimo".
--
-- IRREVERSIBLE: the DELETE removes the reviews already left without an author by earlier account deletions,
-- together with their ReviewPhoto rows and "útil" votes (both cascade at DB level). Their uploads become
-- unreferenced and are removed by the orphan cleanup job. Back up the `Review` table before deploying
-- (see "Pending deploy actions" in AGENTS.md). Tested on MariaDB 11 and MySQL 8.4.

-- 1. Reviews of accounts that were already deleted.
DELETE FROM `Review` WHERE `userId` IS NULL;

-- 2. From now on the reviews go with the account.
ALTER TABLE `Review` DROP FOREIGN KEY `Review_userId_fkey`;

ALTER TABLE `Review` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
