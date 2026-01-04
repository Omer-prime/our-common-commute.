-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'REQUESTED',
    "tripType" "TripType" NOT NULL DEFAULT 'ONE_WAY',
    "bookingId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "riderId" TEXT NOT NULL,
    "driverId" TEXT,
    "pickupAddress" TEXT NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "fareCents" INTEGER NOT NULL DEFAULT 0,
    "distanceMeters" INTEGER,
    "etaSeconds" INTEGER,
    "estDurationSeconds" INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripMessage" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripCancellation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "reasons" TEXT[],
    "otherReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripReview" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyAlert" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_bookingId_key" ON "Trip"("bookingId");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "Trip_driverId_status_idx" ON "Trip"("driverId", "status");

-- CreateIndex
CREATE INDEX "Trip_riderId_status_idx" ON "Trip"("riderId", "status");

-- CreateIndex
CREATE INDEX "TripMessage_tripId_createdAt_idx" ON "TripMessage"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "TripCancellation_tripId_idx" ON "TripCancellation"("tripId");

-- CreateIndex
CREATE INDEX "TripReview_tripId_idx" ON "TripReview"("tripId");

-- CreateIndex
CREATE INDEX "TripReview_revieweeId_idx" ON "TripReview"("revieweeId");

-- CreateIndex
CREATE INDEX "DriverNotification_userId_createdAt_idx" ON "DriverNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmergencyAlert_tripId_idx" ON "EmergencyAlert"("tripId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMessage" ADD CONSTRAINT "TripMessage_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMessage" ADD CONSTRAINT "TripMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCancellation" ADD CONSTRAINT "TripCancellation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCancellation" ADD CONSTRAINT "TripCancellation_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripReview" ADD CONSTRAINT "TripReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverNotification" ADD CONSTRAINT "DriverNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
