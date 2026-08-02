import { z } from "zod";
import { imageUrl, imageUrlArray } from "../../shared/image-url.js";

export const SEGMENTS = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

export const createModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.string().min(1).max(40).regex(ENUM_REGEX),
  imageUrl: imageUrl.nullable().optional(),
  galleryUrls: imageUrlArray.default([]),
});

// `brandId` viaja acá igual que en el alta: el selector "Marca" del panel
// admin permite mover un modelo a otra marca. Omitirlo hacía que zod lo
// descartara en silencio y el cambio se perdiera sin ningún error visible.
// `.partial()` lo deja opcional, que es lo que corresponde en un PATCH.
export const updateModelSchema = createModelSchema.partial();

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;