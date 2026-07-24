import { z } from "zod";

export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC", "CVT", "DCT"] as const;
export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

const versionObjectSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(2).max(80),
  year: z.number().int().min(1990).max(2100),
  priceClp: z.number().int().nonnegative(),
  transmission: z.string().min(1).max(40).regex(ENUM_REGEX),
  fuel: z.string().min(1).max(40).regex(ENUM_REGEX),
  engineDisplacementCc: z.number().int().nonnegative().nullable().optional(),
  powerHp: z.number().int().nonnegative(),
  torqueNm: z.number().int().nonnegative(),
  consumptionCityKmL: z.number().nonnegative().nullable().optional(),
  consumptionHighwayKmL: z.number().nonnegative().nullable().optional(),
  autonomyKm: z.number().nonnegative().nullable().optional(),
  lengthMm: z.number().int().nonnegative(),
  widthMm: z.number().int().nonnegative(),
  heightMm: z.number().int().nonnegative(),
  weightKg: z.number().int().nonnegative(),
  trunkLiters: z.number().int().nonnegative(),
  airbagCount: z.number().int().nonnegative(),
  hasAbs: z.boolean(),
  hasEsp: z.boolean(),
  hasCruiseControl: z.boolean(),
  circulationPermitClp: z.number().int().nonnegative().nullable().optional(),
  mandatoryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
  voluntaryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
  fuelTankLiters: z.number().nonnegative().nullable().optional(),
  batteryCapacityKwh: z.number().nonnegative().nullable().optional(),
  hasRecall: z.boolean().default(false),
  recallUrl: z.string().url().nullable().optional(),
});

const validateRecall = (
  data: Pick<z.input<typeof versionObjectSchema>, "hasRecall" | "recallUrl">,
  ctx: z.RefinementCtx,
) => {
  if (data.hasRecall && !data.recallUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["recallUrl"],
      message: "recallUrl es obligatorio cuando hasRecall=true",
    });
  }
};

/**
 * Para vehiculos electricos, cilindrada y consumos km/L no aplican (deben ser null)
 * y autonomiaKm es obligatoria.
 */
const validateFuelFields = (
  data: { fuel?: string | undefined; engineDisplacementCc?: number | null | undefined; autonomyKm?: number | null | undefined },
  ctx: z.RefinementCtx,
) => {
  if (data.fuel === "ELECTRIC") {
    if (data.engineDisplacementCc != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["engineDisplacementCc"],
        message: "Cilindrada no aplica a vehiculos electricos",
      });
    }
    if (data.autonomyKm == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["autonomyKm"],
        message: "Autonomia es obligatoria para vehiculos electricos",
      });
    }
  }
};

export const createVersionSchema = versionObjectSchema
  .superRefine(validateRecall)
  .superRefine(validateFuelFields);

export const updateVersionSchema = versionObjectSchema
  .partial()
  .omit({ modelId: true })
  .extend({ priceNote: z.string().max(120).optional() })
  .superRefine(validateRecall)
  .superRefine(validateFuelFields);

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;
