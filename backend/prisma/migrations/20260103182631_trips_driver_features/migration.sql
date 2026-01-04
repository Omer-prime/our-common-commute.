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

-- CreateIndex
CREATE INDEX "EmergencyAlert_driverId_createdAt_idx" ON "EmergencyAlert"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "TripCancellation_cancelledBy_idx" ON "TripCancellation"("cancelledBy");

-- CreateIndex
CREATE INDEX "TripMessage_senderId_createdAt_idx" ON "TripMessage"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "TripReview_reviewerId_idx" ON "TripReview"("reviewerId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMessage" ADD CONSTRAINT "TripMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCancellation" ADD CONSTRAINT "TripCancellation_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNotification" ADD CONSTRAINT "DriverNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
