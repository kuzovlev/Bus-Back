/*
  Warnings:

  - You are about to drop the column `email` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `mobile_number` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "mobile_number";
