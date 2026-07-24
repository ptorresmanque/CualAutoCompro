-- CreateTable
CREATE TABLE `Color` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hex` VARCHAR(7) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Color_name_key`(`name`),
    INDEX `Color_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VersionColor` (
    `versionId` VARCHAR(191) NOT NULL,
    `colorId` VARCHAR(191) NOT NULL,

    INDEX `VersionColor_colorId_idx`(`colorId`),
    PRIMARY KEY (`versionId`, `colorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VersionColor` ADD CONSTRAINT `VersionColor_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `Version`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VersionColor` ADD CONSTRAINT `VersionColor_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `Color`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
