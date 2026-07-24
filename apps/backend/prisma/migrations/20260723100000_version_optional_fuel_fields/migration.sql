-- Relaja los campos relacionados a motor/combustible a nullable: las versiones
-- electricas ya no requieren cilindrada ni consumos km/L; el campo `autonomyKm`
-- las caracteriza en su lugar.
ALTER TABLE `Version`
  MODIFY `engineDisplacementCc` INTEGER NULL,
  MODIFY `consumptionCityKmL` DOUBLE NULL,
  MODIFY `consumptionHighwayKmL` DOUBLE NULL,
  ADD COLUMN `autonomyKm` DOUBLE NULL;
