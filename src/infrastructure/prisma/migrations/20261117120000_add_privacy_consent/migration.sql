-- Issue #7: record privacy consent (Ley 8968 art. 5).
--
-- Two nullable columns on `User`: no data is rewritten, so it is safe to deploy with data. Existing users have
-- NULL and the app asks them once (`GET /me` says `privacyAccepted: false`). Same SQL as Prisma generates.

-- AlterTable
ALTER TABLE `User` ADD COLUMN `privacyAcceptedAt` DATETIME(3) NULL,
    ADD COLUMN `privacyVersion` VARCHAR(32) NULL;
