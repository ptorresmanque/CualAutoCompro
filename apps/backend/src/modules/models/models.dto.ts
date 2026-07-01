import { z } from "zod";

export const listModelsQuerySchema = z.object({
  brand: z.string().optional(),
  segment: z.enum(["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"]).optional(),
  year: z.coerce.number().int().optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT", "DCT"]).optional(),
  fuel: z.enum(["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"]).optional(),
  priceMin: z.coerce.number().int().optional(),
  priceMax: z.coerce.number().int().optional(),
  powerMin: z.coerce.number().int().optional(),
  consumptionMax: z.coerce.number().optional(),
  sort: z.enum(["name", "minPrice", "minConsumption"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});