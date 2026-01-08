-- CreateEnum
CREATE TYPE "RiderIdentityDocType" AS ENUM ('GOVERNMENT_ID', 'SELFIE');

-- CreateEnum
CREATE TYPE "RiderLocationTarget" AS ENUM ('HOME', 'WORK');

-- AlterTable
ALTER TABLE "RiderProfile" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "faceRecognitionEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "homeAddress" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workAddress" TEXT;

-- CreateTable
CREATE TABLE "RiderPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "rideUpdates" BOOLEAN NOT NULL DEFAULT true,
    "paymentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "shiftReminders" BOOLEAN NOT NULL DEFAULT true,
    "serviceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderPaymentOption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RiderPaymentMethod" NOT NULL,
    "label" TEXT NOT NULL,
    "secondary" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderPaymentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderIdentityDoc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RiderIdentityDocType" NOT NULL,
    "url" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderIdentityDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiderLocationChangeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "target" "RiderLocationTarget" NOT NULL,
    "requestedAddress" TEXT NOT NULL,
    "status" "WorkChangeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderLocationChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderPreferences_userId_key" ON "RiderPreferences"("userId");

-- CreateIndex
CREATE INDEX "RiderPaymentOption_userId_idx" ON "RiderPaymentOption"("userId");

-- CreateIndex
CREATE INDEX "RiderPaymentOption_userId_isDefault_idx" ON "RiderPaymentOption"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "RiderIdentityDoc_userId_createdAt_idx" ON "RiderIdentityDoc"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RiderIdentityDoc_userId_type_key" ON "RiderIdentityDoc"("userId", "type");

-- CreateIndex
CREATE INDEX "RiderLocationChangeRequest_userId_createdAt_idx" ON "RiderLocationChangeRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RiderLocationChangeRequest_status_createdAt_idx" ON "RiderLocationChangeRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "RiderPreferences" ADD CONSTRAINT "RiderPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderPaymentOption" ADD CONSTRAINT "RiderPaymentOption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderIdentityDoc" ADD CONSTRAINT "RiderIdentityDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderLocationChangeRequest" ADD CONSTRAINT "RiderLocationChangeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
