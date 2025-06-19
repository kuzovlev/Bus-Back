/*
  Warnings:

  - You are about to drop the column `user_id` on the `custom_fields` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "custom_fields" DROP CONSTRAINT "custom_fields_user_id_fkey";

-- AlterTable
ALTER TABLE "custom_fields" DROP COLUMN "user_id";
