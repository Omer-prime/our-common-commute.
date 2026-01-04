-- CreateEnum
CREATE TYPE "NotificationSource" AS ENUM ('RIDER', 'ADMIN', 'SYSTEM');

-- AlterTable
ALTER TABLE "DriverNotification" ADD COLUMN     "actionUrl" TEXT,
ADD COLUMN     "source" "NotificationSource" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "sourceUserId" TEXT;

-- CreateIndex
CREATE INDEX "DriverNotification_userId_readAt_createdAt_idx" ON "DriverNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "DriverNotification_sourceUserId_idx" ON "DriverNotification"("sourceUserId");

-- AddForeignKey
ALTER TABLE "DriverNotification" ADD CONSTRAINT "DriverNotification_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
