ALTER TABLE `User` ADD COLUMN `resetPasswordToken` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `resetPasswordExpiresAt` DATETIME(3) NULL;
CREATE UNIQUE INDEX `User_resetPasswordToken_key` ON `User`(`resetPasswordToken`);
