-- Migration: Add MasterVisibility table for per-unit reference activation
CREATE TABLE `MasterVisibility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference_type` VARCHAR(191) NOT NULL,
    `reference_id` INTEGER NOT NULL,
    `unit_id` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add Foreign Key to Unit
ALTER TABLE `MasterVisibility` ADD CONSTRAINT `MasterVisibility_unit_id_fkey` 
    FOREIGN KEY (`unit_id`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Unique Constraint to prevent duplicates
CREATE UNIQUE INDEX `MasterVisibility_reference_type_reference_id_unit_id_key` 
    ON `MasterVisibility`(`reference_type`, `reference_id`, `unit_id`);
