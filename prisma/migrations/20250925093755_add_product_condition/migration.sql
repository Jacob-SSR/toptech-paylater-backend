-- AlterTable
ALTER TABLE `product` ADD COLUMN `condition` ENUM('NEW', 'USED') NOT NULL DEFAULT 'NEW';
