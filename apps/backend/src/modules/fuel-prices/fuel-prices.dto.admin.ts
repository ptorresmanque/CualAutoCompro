import { z } from "zod";

export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
const UNITS = ["L", "kWh"] as const;

export const createFuelPriceSchema = z.object({
  fuelType: z.enum(FUELS),
  pricePerUnitClp: z.number().positive(),
  unit: z.enum(UNITS),
});

export const updateFuelPriceSchema = createFuelPriceSchema.partial();

export type CreateFuelPriceInput = z.infer<typeof createFuelPriceSchema>;
export type UpdateFuelPriceInput = z.infer<typeof updateFuelPriceSchema>;
