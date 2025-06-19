/*
  Warnings:

  - You are about to drop the column `base_fare` on the `bus_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `schedule_id` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `bus_schedules` table without a default value. This is not possible if the table is not empty.
  - Made the column `departure_date` on table `bus_schedules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `arrival_date` on table `bus_schedules` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_schedule_id_fkey";

-- AlterTable
ALTER TABLE "bus_layouts" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "bus_schedules" DROP COLUMN "base_fare",
ADD COLUMN     "available_seats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "vehicle_id" TEXT,
ALTER COLUMN "departure_date" SET NOT NULL,
ALTER COLUMN "arrival_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "schedule_id";

-- CreateTable
CREATE TABLE "_ScheduleVehicles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ScheduleVehicles_AB_unique" ON "_ScheduleVehicles"("A", "B");

-- CreateIndex
CREATE INDEX "_ScheduleVehicles_B_index" ON "_ScheduleVehicles"("B");

-- AddForeignKey
ALTER TABLE "bus_schedules" ADD CONSTRAINT "bus_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScheduleVehicles" ADD CONSTRAINT "_ScheduleVehicles_A_fkey" FOREIGN KEY ("A") REFERENCES "bus_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ScheduleVehicles" ADD CONSTRAINT "_ScheduleVehicles_B_fkey" FOREIGN KEY ("B") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
