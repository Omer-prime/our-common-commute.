-- CreateEnum
CREATE TYPE "AdminNotificationTarget" AS ENUM ('DRIVERS', 'RIDERS', 'ALL_USERS');

-- CreateEnum
CREATE TYPE "AdminNotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "AdminNotificationStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateTable
CREATE TABLE "AdminNotificationCampaign" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target" "AdminNotificationTarget" NOT NULL,
    "channel" "AdminNotificationChannel" NOT NULL,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduledFor" TIMESTAMP(3),
    "status" "AdminNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNotificationCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminNotificationCampaign_status_scheduledFor_idx" ON "AdminNotificationCampaign"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "AdminNotificationCampaign_createdById_createdAt_idx" ON "AdminNotificationCampaign"("createdById", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminNotificationCampaign" ADD CONSTRAINT "AdminNotificationCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
