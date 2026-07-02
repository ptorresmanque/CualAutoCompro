import { z } from "zod";

export const SEGMENTS = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

export const createModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.string().min(1).max(40).regex(ENUM_REGEX),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});

export const updateModelSchema = createModelSchema.partial().omit({ brandId: true });

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;