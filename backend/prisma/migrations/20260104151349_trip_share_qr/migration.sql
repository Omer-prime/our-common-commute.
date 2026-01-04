/*
  Warnings:

  - A unique constraint covering the columns `[publicShareToken]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrTokenHash]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "publicShareToken" TEXT,
ADD COLUMN     "qrTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "qrTokenHash" TEXT,
ADD COLUMN     "qrTokenIssuedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_publicShareToken_key" ON "Trip"("publicShareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_qrTokenHash_key" ON "Trip"("qrTokenHash");
