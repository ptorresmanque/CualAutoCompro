import { z } from "zod";
import { imageUrl } from "../../shared/image-url.js";

export const createDealerSchema = z.object({
  name: z.string().min(2).max(120),
  url: z.string().url(),
  logoUrl: imageUrl.nullable().optional(),
});

export const updateDealerSchema = createDealerSchema.partial();

export type CreateDealerInput = z.infer<typeof createDealerSchema>;
export type UpdateDealerInput = z.infer<typeof updateDealerSchema>;
