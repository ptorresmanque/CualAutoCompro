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
