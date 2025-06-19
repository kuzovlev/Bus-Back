-- DropForeignKey
ALTER TABLE "driver_vehicle_assigned" DROP CONSTRAINT "driver_vehicle_assigned_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_vendorId_fkey";

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
