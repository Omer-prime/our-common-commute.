-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupportChannel" AS ENUM ('CHAT', 'EMAIL');

-- CreateEnum
CREATE TYPE "SupportAuthor" AS ENUM ('DRIVER', 'AGENT');

-- DropForeignKey
ALTER TABLE "DriverNotification" DROP CONSTRAINT "DriverNotification_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmergencyAlert" DROP CONSTRAINT "EmergencyAlert_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_riderId_fkey";

-- DropForeignKey
ALTER TABLE "TripCancellation" DROP CONSTRAINT "TripCancellation_cancelledBy_fkey";

-- DropForeignKey
ALTER TABLE "TripMessage" DROP CONSTRAINT "TripMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "TripReview" DROP CONSTRAINT "TripReview_revieweeId_fkey";

-- DropForeignKey
ALTER TABLE "TripReview" DROP CONSTRAINT "TripReview_reviewerId_fkey";

-- DropIndex
DROP INDEX "EmergencyAlert_driverId_createdAt_idx";

-- DropIndex
DROP INDEX "TripCancellation_cancelledBy_idx";

-- DropIndex
DROP INDEX "TripMessage_senderId_createdAt_idx";

-- DropIndex
DROP INDEX "TripReview_reviewerId_idx";

-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "faceRecognitionEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "locationText" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workAddress" TEXT,
ADD COLUMN     "workSiteName" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "DriverDocument" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPreferences" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "rideUpdates" BOOLEAN NOT NULL DEFAULT true,
    "paymentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "shiftReminders" BOOLEAN NOT NULL DEFAULT true,
    "serviceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkLocationChangeRequest" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "requestedSiteName" TEXT NOT NULL,
    "requestedAddress" TEXT NOT NULL,
    "status" "WorkChangeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkLocationChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "channel" "SupportChannel" NOT NULL DEFAULT 'CHAT',
    "name" TEXT NOT NULL,
    "tagLine" TEXT,
    "unread" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "author" "SupportAuthor" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverDocument_driverId_idx" ON "DriverDocument"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocument_driverId_type_key" ON "DriverDocument"("driverId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "DriverPreferences_driverId_key" ON "DriverPreferences"("driverId");

-- CreateIndex
CREATE INDEX "WorkLocationChangeRequest_driverId_createdAt_idx" ON "WorkLocationChangeRequest"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportConversation_driverId_lastMessageAt_idx" ON "SupportConversation"("driverId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPreferences" ADD CONSTRAINT "DriverPreferences_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLocationChangeRequest" ADD CONSTRAINT "WorkLocationChangeRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMessage" ADD CONSTRAINT "TripMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCancellation" ADD CONSTRAINT "TripCancellation_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNotification" ADD CONSTRAINT "DriverNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
