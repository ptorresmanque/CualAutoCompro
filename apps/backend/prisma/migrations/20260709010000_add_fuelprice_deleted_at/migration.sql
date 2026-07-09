-- AlterTable
ALTER TABLE `FuelPrice` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `FuelPrice_deletedAt_idx` ON `FuelPrice`(`deletedAt`);
