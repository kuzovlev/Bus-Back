/*
  Warnings:

  - You are about to drop the column `payment_type_id` on the `bookings` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_payment_type_id_fkey";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "payment_type_id";
