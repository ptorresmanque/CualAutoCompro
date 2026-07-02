import { z } from "zod";

export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC", "CVT", "DCT"] as const;
export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

export const createVersionSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(2).max(80),
  year: z.number().int().min(1990).max(2100),
  priceClp: z.number().int().nonnegative(),
  transmission: z.string().min(1).max(40).regex(ENUM_REGEX),
  fuel: z.string().min(1).max(40).regex(ENUM_REGEX),
  engineDisplacementCc: z.number().int().nonnegative(),
  powerHp: z.number().int().nonnegative(),
  torqueNm: z.number().int().nonnegative(),
  consumptionCityKmL: z.number().nonnegative(),
  consumptionHighwayKmL: z.number().nonnegative(),
  lengthMm: z.number().int().nonnegative(),
  widthMm: z.number().int().nonnegative(),
  heightMm: z.number().int().nonnegative(),
  weightKg: z.number().int().nonnegative(),
  trunkLiters: z.number().int().nonnegative(),
  airbagCount: z.number().int().nonnegative(),
  hasAbs: z.boolean(),
  hasEsp: z.boolean(),
  hasCruiseControl: z.boolean(),
});

export const updateVersionSchema = createVersionSchema.partial().omit({ modelId: true });

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;