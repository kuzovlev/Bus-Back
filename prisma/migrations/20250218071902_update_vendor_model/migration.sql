/*
  Warnings:

  - You are about to drop the column `address` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `agreement_end_date` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `agreement_start_date` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `alternate_phone` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `commission_percentage` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `company_logo` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `company_name` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `contact_person` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `total_vehicles` on the `vendors` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[business_email]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - Made the column `first_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `login_attempts` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `business_name` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `vendors` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "vendors_email_key";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "last_name" SET NOT NULL,
ALTER COLUMN "login_attempts" SET NOT NULL,
ALTER COLUMN "login_attempts" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "address",
DROP COLUMN "agreement_end_date",
DROP COLUMN "agreement_start_date",
DROP COLUMN "alternate_phone",
DROP COLUMN "commission_percentage",
DROP COLUMN "company_logo",
DROP COLUMN "company_name",
DROP COLUMN "contact_person",
DROP COLUMN "email",
DROP COLUMN "phone",
DROP COLUMN "rating",
DROP COLUMN "total_vehicles",
ADD COLUMN     "business_address" TEXT,
ADD COLUMN     "business_email" TEXT,
ADD COLUMN     "business_logo" TEXT,
ADD COLUMN     "business_mobile" TEXT,
ADD COLUMN     "business_name" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "vendors_business_email_key" ON "vendors"("business_email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_user_id_key" ON "vendors"("user_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
