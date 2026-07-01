import { z } from "zod";

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const attachEquipmentSchema = z.object({
  versionId: z.string().min(1),
  itemId: z.string().min(1),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;