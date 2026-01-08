-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminNotificationStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "AdminNotificationStatus" ADD VALUE 'FAILED';
ALTER TYPE "AdminNotificationStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "AdminNotificationCampaign" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "totalRecipients" INTEGER NOT NULL DEFAULT 0;
