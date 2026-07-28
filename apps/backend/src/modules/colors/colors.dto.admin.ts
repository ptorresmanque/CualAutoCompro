import { z } from "zod";

export const HEX_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export const createColorSchema = z.object({
  name: z.string().min(2).max(80),
  hex: z.string().regex(HEX_REGEX).nullable().optional(),
});

export const updateColorSchema = createColorSchema.partial();

export const attachColorSchema = z.object({
  versionId: z.string().min(1),
  colorId: z.string().min(1),
});

/** Body de `PUT /admin/colors/version/:versionId`: la selección completa. */
export const syncColorsSchema = z.object({
  colorIds: z.array(z.string().min(1)),
});

export type CreateColorInput = z.infer<typeof createColorSchema>;
export type UpdateColorInput = z.infer<typeof updateColorSchema>;
