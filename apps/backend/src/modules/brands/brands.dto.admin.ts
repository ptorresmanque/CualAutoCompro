import { z } from "zod";
import { imageUrl } from "../../shared/image-url.js";

export const createBrandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: imageUrl.nullable().optional(),
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  dealerIds: z.array(z.string()).optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
