-- CreateTable
CREATE TABLE `PopularityCounter` (
    `modelId` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `lastUpdatedAt` DATETIME(3) NOT NULL,

    INDEX `PopularityCounter_count_idx`(`count`),
    PRIMARY KEY (`modelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PopularityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `cookieId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PopularityEvent_createdAt_idx`(`createdAt`),
    INDEX `PopularityEvent_modelId_createdAt_idx`(`modelId`, `createdAt`),
    INDEX `PopularityEvent_cookieId_createdAt_idx`(`cookieId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PopularityCounter` ADD CONSTRAINT `PopularityCounter_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `Model`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

