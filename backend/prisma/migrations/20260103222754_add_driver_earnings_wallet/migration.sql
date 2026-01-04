-- CreateEnum
CREATE TYPE "EarningTransactionType" AS ENUM ('RIDE_EARNING', 'CASH_TIP', 'WITHDRAWAL', 'REFERRAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "EarningDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "PayoutMethod" ADD VALUE 'PAYPAL';

-- CreateTable
CREATE TABLE "DriverWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "availableCents" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarnedCents" INTEGER NOT NULL DEFAULT 0,
    "lifetimeWithdrawnCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverPayoutMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PayoutMethod" NOT NULL,
    "label" TEXT NOT NULL,
    "subLabel" TEXT,
    "details" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payoutMethodId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverEarningTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EarningTransactionType" NOT NULL,
    "direction" "EarningDirection" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "tripId" TEXT,
    "withdrawalId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverEarningTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverWallet_userId_key" ON "DriverWallet"("userId");

-- CreateIndex
CREATE INDEX "DriverPayoutMethod_userId_idx" ON "DriverPayoutMethod"("userId");

-- CreateIndex
CREATE INDEX "DriverPayoutMethod_userId_isDefault_idx" ON "DriverPayoutMethod"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "DriverWithdrawalRequest_userId_createdAt_idx" ON "DriverWithdrawalRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverWithdrawalRequest_walletId_createdAt_idx" ON "DriverWithdrawalRequest"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverWithdrawalRequest_status_createdAt_idx" ON "DriverWithdrawalRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DriverEarningTransaction_userId_createdAt_idx" ON "DriverEarningTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverEarningTransaction_walletId_createdAt_idx" ON "DriverEarningTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverEarningTransaction_tripId_idx" ON "DriverEarningTransaction"("tripId");

-- CreateIndex
CREATE INDEX "DriverEarningTransaction_withdrawalId_idx" ON "DriverEarningTransaction"("withdrawalId");

-- AddForeignKey
ALTER TABLE "DriverWallet" ADD CONSTRAINT "DriverWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverPayoutMethod" ADD CONSTRAINT "DriverPayoutMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverWithdrawalRequest" ADD CONSTRAINT "DriverWithdrawalRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DriverWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverWithdrawalRequest" ADD CONSTRAINT "DriverWithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverWithdrawalRequest" ADD CONSTRAINT "DriverWithdrawalRequest_payoutMethodId_fkey" FOREIGN KEY ("payoutMethodId") REFERENCES "DriverPayoutMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEarningTransaction" ADD CONSTRAINT "DriverEarningTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DriverWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEarningTransaction" ADD CONSTRAINT "DriverEarningTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEarningTransaction" ADD CONSTRAINT "DriverEarningTransaction_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEarningTransaction" ADD CONSTRAINT "DriverEarningTransaction_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "DriverWithdrawalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
