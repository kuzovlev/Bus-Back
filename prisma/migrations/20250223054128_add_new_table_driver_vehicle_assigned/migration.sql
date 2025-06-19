/*
  Warnings:

  - You are about to drop the column `assigned_vehicle_id` on the `drivers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DriverVehicleAssignedStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_assigned_vehicle_id_fkey";

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "assigned_vehicle_id";

-- CreateTable
CREATE TABLE "driver_vehicle_assigned" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "assigned_from" TIMESTAMP(3) NOT NULL,
    "assigned_to" TIMESTAMP(3),
    "status" "DriverVehicleAssignedStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_vehicle_assigned_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
