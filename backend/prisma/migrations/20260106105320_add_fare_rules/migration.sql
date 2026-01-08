-- CreateEnum
CREATE TYPE "FareRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "FareRule" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "rideFareCents" INTEGER NOT NULL,
    "driverPayoutCents" INTEGER NOT NULL,
    "transactionFeeCents" INTEGER,
    "status" "FareRuleStatus" NOT NULL DEFAULT 'INACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FareRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FareRule_status_effectiveAt_idx" ON "FareRule"("status", "effectiveAt");

-- CreateIndex
CREATE INDEX "FareRule_createdById_createdAt_idx" ON "FareRule"("createdById", "createdAt");

-- AddForeignKey
ALTER TABLE "FareRule" ADD CONSTRAINT "FareRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
