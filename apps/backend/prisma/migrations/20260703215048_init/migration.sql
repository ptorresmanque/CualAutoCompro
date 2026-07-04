-- CreateTable
CREATE TABLE `Brand` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Brand_name_key`(`name`),
    INDEX `Brand_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Model` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `segment` ENUM('SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'CROSSOVER', 'COMMERCIAL') NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `galleryUrls` JSON NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Model_segment_idx`(`segment`),
    INDEX `Model_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `Model_brandId_name_key`(`brandId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Version` (
    `id` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `priceClp` INTEGER NOT NULL,
    `transmission` ENUM('MANUAL', 'AUTOMATIC', 'CVT', 'DCT') NOT NULL,
    `fuel` ENUM('BENCINA', 'DIESEL', 'HYBRID', 'ELECTRIC') NOT NULL,
    `engineDisplacementCc` INTEGER NOT NULL,
    `powerHp` INTEGER NOT NULL,
    `torqueNm` INTEGER NOT NULL,
    `consumptionCityKmL` DOUBLE NOT NULL,
    `consumptionHighwayKmL` DOUBLE NOT NULL,
    `lengthMm` INTEGER NOT NULL,
    `widthMm` INTEGER NOT NULL,
    `heightMm` INTEGER NOT NULL,
    `weightKg` INTEGER NOT NULL,
    `trunkLiters` INTEGER NOT NULL,
    `airbagCount` INTEGER NOT NULL,
    `hasAbs` BOOLEAN NOT NULL,
    `hasEsp` BOOLEAN NOT NULL,
    `hasCruiseControl` BOOLEAN NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Version_modelId_idx`(`modelId`),
    INDEX `Version_priceClp_idx`(`priceClp`),
    INDEX `Version_year_idx`(`year`),
    INDEX `Version_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EquipmentItem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `EquipmentItem_name_key`(`name`),
    INDEX `EquipmentItem_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersionEquipment` (
    `versionId` VARCHAR(191) NOT NULL,
    `equipmentItemId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`versionId`, `equipmentItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaintenanceCost` (
    `id` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `mileageTag` INTEGER NOT NULL,
    `costClp` INTEGER NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `MaintenanceCost_versionId_idx`(`versionId`),
    INDEX `MaintenanceCost_deletedAt_idx`(`deletedAt`),
    UNIQUE INDEX `MaintenanceCost_versionId_mileageTag_key`(`versionId`, `mileageTag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comparison` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `versionsHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Comparison_slug_key`(`slug`),
    INDEX `Comparison_userId_idx`(`userId`),
    UNIQUE INDEX `Comparison_userId_versionsHash_key`(`userId`, `versionsHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComparisonItem` (
    `id` VARCHAR(191) NOT NULL,
    `comparisonId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,

    INDEX `ComparisonItem_versionId_idx`(`versionId`),
    UNIQUE INDEX `ComparisonItem_comparisonId_position_key`(`comparisonId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favorite_userId_idx`(`userId`),
    INDEX `Favorite_modelId_idx`(`modelId`),
    UNIQUE INDEX `Favorite_userId_versionId_key`(`userId`, `versionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Model` ADD CONSTRAINT `Model_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Version` ADD CONSTRAINT `Version_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionEquipment` ADD CONSTRAINT `VersionEquipment_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionEquipment` ADD CONSTRAINT `VersionEquipment_equipmentItemId_fkey` FOREIGN KEY (`equipmentItemId`) REFERENCES `EquipmentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceCost` ADD CONSTRAINT `MaintenanceCost_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comparison` ADD CONSTRAINT `Comparison_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComparisonItem` ADD CONSTRAINT `ComparisonItem_comparisonId_fkey` FOREIGN KEY (`comparisonId`) REFERENCES `Comparison`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComparisonItem` ADD CONSTRAINT `ComparisonItem_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

