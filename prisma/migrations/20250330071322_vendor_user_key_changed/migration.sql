-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_vendor_id_fkey";

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
