/*
  Warnings:

  - You are about to drop the column `userId` on the `drivers` table. All the data in the column will be lost.
  - Added the required column `password` to the `drivers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_userId_fkey";

-- DropIndex
DROP INDEX "drivers_userId_key";

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "userId",
ADD COLUMN     "driver_license_back" TEXT,
ADD COLUMN     "driver_license_front" TEXT,
ADD COLUMN     "driver_photo" TEXT,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "total_travel" INTEGER NOT NULL DEFAULT 0;
