-- Nota del editor, opcional, en modelos y en ítems de equipamiento.
-- Aditiva: NULL para todas las filas existentes, sin backfill.
ALTER TABLE `Model`
  ADD COLUMN `comment` TEXT NULL;

ALTER TABLE `EquipmentItem`
  ADD COLUMN `comment` TEXT NULL;
