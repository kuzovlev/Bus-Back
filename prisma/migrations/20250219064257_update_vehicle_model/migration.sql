/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `vehicles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_vendor_id_fkey";

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "vendor_id";
