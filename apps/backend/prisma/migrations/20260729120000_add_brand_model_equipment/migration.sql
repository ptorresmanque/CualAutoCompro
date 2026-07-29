-- Equipamiento heredado desde Marca y Modelo.
-- Migración aditiva: `VersionEquipment` no se toca y conserva su significado
-- (equipamiento propio de la versión). Ver el comentario de bloque sobre
-- `VersionEquipment` en prisma/schema.prisma para el modelo de resolución.

-- CreateTable
CREATE TABLE `BrandEquipment` (
    `brandId` VARCHAR(191) NOT NULL,
    `equipmentItemId` VARCHAR(191) NOT NULL,

    INDEX `BrandEquipment_equipmentItemId_idx`(`equipmentItemId`),
    PRIMARY KEY (`brandId`, `equipmentItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModelEquipment` (
    `modelId` VARCHAR(191) NOT NULL,
    `equipmentItemId` VARCHAR(191) NOT NULL,

    INDEX `ModelEquipment_equipmentItemId_idx`(`equipmentItemId`),
    PRIMARY KEY (`modelId`, `equipmentItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersionEquipmentExclusion` (
    `versionId` VARCHAR(191) NOT NULL,
    `equipmentItemId` VARCHAR(191) NOT NULL,

    INDEX `VersionEquipmentExclusion_equipmentItemId_idx`(`equipmentItemId`),
    PRIMARY KEY (`versionId`, `equipmentItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BrandEquipment` ADD CONSTRAINT `BrandEquipment_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BrandEquipment` ADD CONSTRAINT `BrandEquipment_equipmentItemId_fkey` FOREIGN KEY (`equipmentItemId`) REFERENCES `EquipmentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelEquipment` ADD CONSTRAINT `ModelEquipment_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModelEquipment` ADD CONSTRAINT `ModelEquipment_equipmentItemId_fkey` FOREIGN KEY (`equipmentItemId`) REFERENCES `EquipmentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionEquipmentExclusion` ADD CONSTRAINT `VersionEquipmentExclusion_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionEquipmentExclusion` ADD CONSTRAINT `VersionEquipmentExclusion_equipmentItemId_fkey` FOREIGN KEY (`equipmentItemId`) REFERENCES `EquipmentItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
