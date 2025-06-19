/*
  Warnings:

  - You are about to drop the column `set_number` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "set_number",
ADD COLUMN     "payment_intent_id" TEXT,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "seat_numbers" JSONB,
ALTER COLUMN "payment_method" SET DEFAULT 'CASH';
