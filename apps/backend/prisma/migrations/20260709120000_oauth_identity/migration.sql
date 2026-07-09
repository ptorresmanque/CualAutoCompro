-- AlterTable
ALTER TABLE `User` MODIFY `passwordHash` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `UserIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerSub` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserIdentity_userId_idx`(`userId`),
    INDEX `UserIdentity_email_idx`(`email`),
    UNIQUE INDEX `UserIdentity_provider_providerSub_key`(`provider`, `providerSub`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserIdentity` ADD CONSTRAINT `UserIdentity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
