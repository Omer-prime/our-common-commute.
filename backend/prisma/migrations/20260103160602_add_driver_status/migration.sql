-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OCCUPIED');

-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "driverStatus" "DriverStatus" NOT NULL DEFAULT 'INACTIVE';
