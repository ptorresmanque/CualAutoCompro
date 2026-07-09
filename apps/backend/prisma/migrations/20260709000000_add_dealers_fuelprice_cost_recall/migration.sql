-- AlterTable
ALTER TABLE `Version` ADD COLUMN `batteryCapacityKwh` DOUBLE NULL,
    ADD COLUMN `circulationPermitClp` INTEGER NULL,
    ADD COLUMN `fuelTankLiters` DOUBLE NULL,
    ADD COLUMN `hasRecall` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mandatoryInsuranceClp` INTEGER NULL,
    ADD COLUMN `recallUrl` VARCHAR(191) NULL,
    ADD COLUMN `voluntaryInsuranceClp` INTEGER NULL;

-- CreateTable
CREATE TABLE `Dealer` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Dealer_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BrandDealer` (
    `brandId` VARCHAR(191) NOT NULL,
    `dealerId` VARCHAR(191) NOT NULL,

    INDEX `BrandDealer_dealerId_idx`(`dealerId`),
    PRIMARY KEY (`brandId`, `dealerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuelPrice` (
    `id` VARCHAR(191) NOT NULL,
    `fuelType` VARCHAR(191) NOT NULL,
    `pricePerUnitClp` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FuelPrice_fuelType_idx`(`fuelType`),
    UNIQUE INDEX `FuelPrice_fuelType_effectiveFrom_key`(`fuelType`, `effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BrandDealer` ADD CONSTRAINT `BrandDealer_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BrandDealer` ADD CONSTRAINT `BrandDealer_dealerId_fkey` FOREIGN KEY (`dealerId`) REFERENCES `Dealer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;