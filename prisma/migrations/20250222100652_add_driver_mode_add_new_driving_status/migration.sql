/*
  Warnings:

  - The `drivingStatus` column on the `drivers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DrivingStatus" AS ENUM ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY');

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "drivingStatus",
ADD COLUMN     "drivingStatus" "DrivingStatus" NOT NULL DEFAULT 'AVAILABLE';
