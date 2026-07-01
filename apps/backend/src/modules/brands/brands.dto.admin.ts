import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: z.string().url().nullable().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
