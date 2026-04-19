-- Migration: Add tipe column to Unit
ALTER TABLE `Unit` ADD COLUMN `tipe` VARCHAR(10) NOT NULL DEFAULT 'UNIT';

-- Set PDM as root (already exists as ID 1)
UPDATE `Unit` SET `tipe` = 'UNIT' WHERE `id` = 1;

-- Example: Create GROUP folders (run these to set up your hierarchy)
-- UPDATE `Unit` SET `tipe` = 'GROUP', `parent_unit_id` = 1 WHERE `nama_unit` LIKE '%Majelis%' OR `nama_unit` LIKE '%Lembaga%';
-- INSERT INTO `Unit` (`nama_unit`, `nama_unit_pendek`, `tipe`, `parent_unit_id`) VALUES ('Majelis & Lembaga', 'Maj/Lem', 'GROUP', 1);
-- INSERT INTO `Unit` (`nama_unit`, `nama_unit_pendek`, `tipe`, `parent_unit_id`) VALUES ('Anak Usaha', 'AUM', 'GROUP', 1);
-- INSERT INTO `Unit` (`nama_unit`, `nama_unit_pendek`, `tipe`, `parent_unit_id`) VALUES ('Sekolah', 'Sekolah', 'GROUP', 1);
-- INSERT INTO `Unit` (`nama_unit`, `nama_unit_pendek`, `tipe`, `parent_unit_id`) VALUES ('Cabang', 'Cabang', 'GROUP', 1);
