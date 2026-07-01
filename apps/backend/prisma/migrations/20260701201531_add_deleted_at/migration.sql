-- IMPORTANT: This migration uses CREATE INDEX CONCURRENTLY which Prisma cannot
-- execute inside its transactional wrapper. To apply:
--   1. psql -f migration.sql
--   2. npx prisma migrate resolve --applied 20260701201531_add_deleted_at
-- Do NOT run `npx prisma migrate dev` for this migration.

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EquipmentItem" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MaintenanceCost" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX CONCURRENTLY "Brand_deletedAt_idx" ON "Brand"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "EquipmentItem_deletedAt_idx" ON "EquipmentItem"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "MaintenanceCost_deletedAt_idx" ON "MaintenanceCost"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Model_deletedAt_idx" ON "Model"("deletedAt");

-- CreateIndex
CREATE INDEX CONCURRENTLY "Version_deletedAt_idx" ON "Version"("deletedAt");
