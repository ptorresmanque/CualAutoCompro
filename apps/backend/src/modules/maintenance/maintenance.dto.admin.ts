import { z } from "zod";

export const createMaintenanceSchema = z.object({
  versionId: z.string().min(1),
  mileageTag: z.number().int().min(0).max(500_000),
  costClp: z.number().int().nonnegative(),
});

export const updateMaintenanceSchema = createMaintenanceSchema
  .partial()
  .omit({ versionId: true });

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;