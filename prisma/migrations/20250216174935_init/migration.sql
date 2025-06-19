-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GearSystem" AS ENUM ('MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG');

-- CreateEnum
CREATE TYPE "BusType" AS ENUM ('AC_SLEEPER', 'NON_AC_SLEEPER', 'AC_SEATER');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'INTEGER', 'BOOLEAN', 'JSON', 'DECIMAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "mobile" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "gender" TEXT,
    "mobile_otp" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "login_attempts" INTEGER,
    "login_attempts_date" TIMESTAMP(3),
    "expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_logo" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternate_phone" TEXT,
    "address" TEXT NOT NULL,
    "commission_percentage" DECIMAL(5,2),
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "agreement_start_date" TIMESTAMP(3),
    "agreement_end_date" TIMESTAMP(3),
    "rating" DECIMAL(2,1),
    "total_vehicles" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicle_name" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_image" TEXT,
    "vehicle_status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "vehicle_rating" DECIMAL(2,1),
    "total_seats" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "has_ac" BOOLEAN NOT NULL DEFAULT false,
    "driver_name" TEXT,
    "driver_mobile" TEXT,
    "gearSystem" "GearSystem",
    "amenities" JSONB,
    "vehicle_type" TEXT NOT NULL,
    "vehicle_brand" TEXT,
    "available_city" TEXT,
    "fuel_type" "FuelType",
    "user_id" TEXT,
    "vendor_id" TEXT,
    "route_id" TEXT,
    "schedule_id" TEXT,
    "layout_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "source_city" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "distance" DECIMAL(10,2),
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boarding_points" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "sequence_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boarding_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropping_points" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "sequence_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dropping_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_layouts" (
    "id" TEXT NOT NULL,
    "layout_name" TEXT,
    "total_seats" INTEGER NOT NULL,
    "sleeper_seats" INTEGER NOT NULL,
    "seater_seats" INTEGER NOT NULL,
    "has_upper_deck" BOOLEAN NOT NULL DEFAULT false,
    "upper_deck_seats" INTEGER NOT NULL DEFAULT 0,
    "sleeper_price" DECIMAL(10,2) NOT NULL,
    "seater_price" DECIMAL(10,2) NOT NULL,
    "row_count" INTEGER NOT NULL,
    "column_count" INTEGER NOT NULL,
    "layout_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bus_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_schedules" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "busType" "BusType" NOT NULL,
    "base_fare" DECIMAL(10,2),
    "departure_date" TIMESTAMP(3),
    "arrival_date" TIMESTAMP(3),
    "status" "ScheduleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "vendor_id" TEXT,
    "vehicle_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "route_id" TEXT,
    "mobile_number" TEXT NOT NULL,
    "payment_type_id" TEXT,
    "boarding_point_id" TEXT,
    "dropping_point_id" TEXT,
    "booking_date" TIMESTAMP(3),
    "total_amount" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'cash',
    "set_number" JSONB,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancellation_reason" TEXT,
    "cancellation_charge" DECIMAL(10,2),
    "refund_amount" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_types" (
    "id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "description" TEXT,
    "vendor_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custom_fields" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_expenses" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key_name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "language_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "key_name" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "translated_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE UNIQUE INDEX "routes_source_city_destination_city_key" ON "routes"("source_city", "destination_city");

-- CreateIndex
CREATE UNIQUE INDEX "payment_types_payment_method_key" ON "payment_types"("payment_method");

-- CreateIndex
CREATE UNIQUE INDEX "categories_vendor_id_name_key" ON "categories"("vendor_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_name_key" ON "settings"("key_name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_language_code_key" ON "languages"("language_code");

-- CreateIndex
CREATE UNIQUE INDEX "translations_entity_name_entity_id_key_name_language_code_key" ON "translations"("entity_name", "entity_id", "key_name", "language_code");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "bus_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "bus_layouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boarding_points" ADD CONSTRAINT "boarding_points_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropping_points" ADD CONSTRAINT "dropping_points_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_schedules" ADD CONSTRAINT "bus_schedules_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_boarding_point_id_fkey" FOREIGN KEY ("boarding_point_id") REFERENCES "boarding_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dropping_point_id_fkey" FOREIGN KEY ("dropping_point_id") REFERENCES "dropping_points"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_types" ADD CONSTRAINT "payment_types_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_fields" ADD CONSTRAINT "custom_fields_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_expenses" ADD CONSTRAINT "income_expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_expenses" ADD CONSTRAINT "income_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "languages"("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;
