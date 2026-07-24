-- Quita los campos de seguridad hardcoded del modelo Version.
-- La informacion de airbags/ABS/ESP/cruise ahora vive (cuando aplica) en la
-- tabla EquipmentItem bajo una categoria "Seguridad", y se relaciona via
-- VersionEquipment. Asi el catalogo es extensible y editable por admin.
ALTER TABLE `Version`
  DROP COLUMN `airbagCount`,
  DROP COLUMN `hasAbs`,
  DROP COLUMN `hasEsp`,
  DROP COLUMN `hasCruiseControl`;
