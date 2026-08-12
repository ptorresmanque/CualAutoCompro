import { z } from "zod";

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  // Nota del editor del ítem. `.trim()` por lo mismo que en models.dto.admin.
  comment: z.string().trim().max(500).nullable().optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const attachEquipmentSchema = z.object({
  versionId: z.string().min(1),
  itemId: z.string().min(1),
});

/**
 * Body de `PUT /admin/equipment/version/:versionId`: la selección completa.
 *
 * `knownInheritedIds` es lo que el formulario **mostró** como heredado de la
 * marca o del modelo. Sin ese dato, una selección que no incluye un ítem
 * heredado es ambigua: puede ser "el admin lo sacó" o "el cliente nunca supo
 * que existía" (el alta, donde todavía no hay versión que resolver). Informarlo
 * hace que solo lo primero genere una exclusión.
 */
export const syncEquipmentSchema = z.object({
  itemIds: z.array(z.string().min(1)),
  knownInheritedIds: z.array(z.string().min(1)).optional(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;