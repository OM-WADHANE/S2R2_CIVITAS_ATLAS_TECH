-- ============================================================
-- S2R2 Inventory Management System — Initial Migration
-- Generated: 2026-08-23
-- ============================================================

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER', 'USER');

-- CreateEnum
CREATE TYPE "FinishedProductStatus" AS ENUM ('ACTIVE', 'HOLD');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INWARD', 'OUTWARD', 'MANUFACTURE');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "IoTDeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "supplier" TEXT,
    "location" TEXT,
    "min_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Box',
    "category" TEXT NOT NULL DEFAULT 'Finished Products',
    "location" TEXT,
    "supplier" TEXT,
    "min_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "FinishedProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "finished_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_of_materials" (
    "id" SERIAL NOT NULL,
    "finished_product_id" INTEGER NOT NULL,
    "raw_material_id" INTEGER NOT NULL,
    "quantity_required" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bill_of_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" SERIAL NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "item_id" INTEGER NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "client_name" TEXT NOT NULL,
    "company_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gst_no" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iot_devices" (
    "id" SERIAL NOT NULL,
    "device_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "location" TEXT,
    "status" "IoTDeviceStatus" NOT NULL DEFAULT 'ONLINE',
    "last_ping" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "iot_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT 'system',
    "event_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique username
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex: unique raw material name (supports seed upsert-by-name)
CREATE UNIQUE INDEX "raw_materials_name_key" ON "raw_materials"("name");

-- CreateIndex: unique finished product name (supports seed upsert-by-name)
CREATE UNIQUE INDEX "finished_products_name_key" ON "finished_products"("name");

-- CreateIndex: one raw material appears only once per finished product BOM
CREATE UNIQUE INDEX "bill_of_materials_finished_product_id_raw_material_id_key"
    ON "bill_of_materials"("finished_product_id", "raw_material_id");

-- CreateIndex: unique client email
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex: unique IoT device ID
CREATE UNIQUE INDEX "iot_devices_device_id_key" ON "iot_devices"("device_id");

-- AddForeignKey: BOM → finished_products (cascade delete)
ALTER TABLE "bill_of_materials"
    ADD CONSTRAINT "bill_of_materials_finished_product_id_fkey"
    FOREIGN KEY ("finished_product_id")
    REFERENCES "finished_products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: BOM → raw_materials (cascade delete)
ALTER TABLE "bill_of_materials"
    ADD CONSTRAINT "bill_of_materials_raw_material_id_fkey"
    FOREIGN KEY ("raw_material_id")
    REFERENCES "raw_materials"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
