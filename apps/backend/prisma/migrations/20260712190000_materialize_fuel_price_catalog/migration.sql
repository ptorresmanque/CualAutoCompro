-- Drop legacy FuelPriceSyncState table (no longer in schema).
DROP TABLE IF EXISTS `FuelPriceSyncState`;

-- Restore FuelPrice to schema shape (id PK, no sampleSize/updatedAt, deletedAt, unique on (fuelType, effectiveFrom)).
DROP TABLE IF EXISTS `FuelPrice`;
CREATE TABLE `FuelPrice` (
    `id` VARCHAR(191) NOT NULL,
    `fuelType` VARCHAR(191) NOT NULL,
    `pricePerUnitClp` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `FuelPrice_fuelType_idx`(`fuelType`),
    INDEX `FuelPrice_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `FuelPrice_fuelType_effectiveFrom_key`(`fuelType`, `effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
