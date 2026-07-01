import { z } from "zod";

export const SEGMENTS = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"] as const;

export const createModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.enum(SEGMENTS),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});

export const updateModelSchema = createModelSchema.partial().omit({ brandId: true });

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;