/*
  Warnings:

  - You are about to drop the column `vendor_id` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_id` on the `income_expenses` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `income_expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "income_expenses" DROP CONSTRAINT "income_expenses_vendor_id_fkey";

-- DropIndex
DROP INDEX "categories_vendor_id_name_key";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "vendor_id",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "income_expenses" DROP COLUMN "vendor_id",
ADD COLUMN     "userId" TEXT NOT NULL;
