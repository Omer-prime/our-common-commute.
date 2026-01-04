/*
  Warnings:

  - You are about to drop the column `emailVerifiedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RideDirection" AS ENUM ('TO_WORK_ONLY', 'FROM_WORK_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_ACCOUNT', 'MOBILE_WALLET');

-- DropIndex
DROP INDEX "RefreshToken_expiresAt_idx";

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerifiedAt",
ALTER COLUMN "role" SET DEFAULT 'RIDER';

-- CreateTable
CREATE TABLE "DriverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingCompletedAt" TIMESTAMP(3),
    "primaryWorkLocation" TEXT,
    "workDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shiftStart" TEXT,
    "shiftEnd" TEXT,
    "detourMiles" INTEGER,
    "rideDirection" "RideDirection",
    "payoutMethod" "PayoutMethod",
    "payoutAccountNumber" TEXT,
    "payoutAccountName" TEXT,
    "payoutBankName" TEXT,
    "payoutSwiftCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "licensePlate" TEXT,
    "seats" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverDocuments" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "governmentIdUrl" TEXT,
    "selfieUrl" TEXT,
    "licenseUrl" TEXT,
    "insuranceUrl" TEXT,
    "vehicleImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverProfile_userId_key" ON "DriverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_driverId_key" ON "Vehicle"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDocuments_driverId_key" ON "DriverDocuments"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDocuments" ADD CONSTRAINT "DriverDocuments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
