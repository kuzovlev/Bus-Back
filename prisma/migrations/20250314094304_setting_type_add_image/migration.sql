/*
  Warnings:

  - The values [STRING,INTEGER,DECIMAL] on the enum `SettingType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SettingType_new" AS ENUM ('TEXT', 'IMAGE', 'JSON', 'BOOLEAN', 'NUMBER');
ALTER TABLE "settings" ALTER COLUMN "type" TYPE "SettingType_new" USING ("type"::text::"SettingType_new");
ALTER TYPE "SettingType" RENAME TO "SettingType_old";
ALTER TYPE "SettingType_new" RENAME TO "SettingType";
DROP TYPE "SettingType_old";
COMMIT;
