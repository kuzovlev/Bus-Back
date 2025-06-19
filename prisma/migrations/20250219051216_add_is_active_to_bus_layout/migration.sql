/*
  Warnings:

  - Made the column `layout_json` on table `bus_layouts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bus_layouts" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "layout_json" SET NOT NULL;
