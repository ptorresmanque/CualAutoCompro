import { z } from 'zod';

export const SEGMENTS = ['SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'CROSSOVER', 'COMMERCIAL'] as const;
export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'] as const;
export const FUELS = ['BENCINA', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const;

// Mirrors backend `ENUM_REGEX` (apps/backend/src/modules/*/dto.admin.ts).
// New values for Segment/Fuel/Transmission can be typed via the "otro" option
// in the form or directly in the JSON tab; the backend's extendEnum will
// add them to the Postgres enum at insert time.
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

// Mirrors backend `imageUrl` helper (apps/backend/src/shared/image-url.ts).
// Accepts both absolute URLs and relative /uploads/* paths (returned by
// POST /api/v1/admin/uploads).
const imageUrlField = z
  .string()
  .min(1)
  .refine(
    (v) => {
      if (v.startsWith('/uploads/')) return true;
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'URL inválida (debe ser absoluta o ruta /uploads/...)' },
  );

export const brandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: imageUrlField.nullable().optional(),
});

export const modelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.string().min(1).max(40).regex(ENUM_REGEX),
  imageUrl: imageUrlField.nullable().optional(),
  galleryUrls: z.array(imageUrlField).default([]),
});

export const versionSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(2).max(80),
  year: z.number().int().min(1990).max(2100),
  priceClp: z.number().int().nonnegative(),
  transmission: z.string().min(1).max(40).regex(ENUM_REGEX),
  fuel: z.string().min(1).max(40).regex(ENUM_REGEX),
  engineDisplacementCc: z.number().int().nonnegative(),
  powerHp: z.number().int().nonnegative(),
  torqueNm: z.number().int().nonnegative(),
  consumptionCityKmL: z.number().nonnegative(),
  consumptionHighwayKmL: z.number().nonnegative(),
  lengthMm: z.number().int().nonnegative(),
  widthMm: z.number().int().nonnegative(),
  heightMm: z.number().int().nonnegative(),
  weightKg: z.number().int().nonnegative(),
  trunkLiters: z.number().int().nonnegative(),
  airbagCount: z.number().int().nonnegative(),
  hasAbs: z.boolean(),
  hasEsp: z.boolean(),
  hasCruiseControl: z.boolean(),
});

export const equipmentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
});

export const maintenanceSchema = z.object({
  versionId: z.string().min(1),
  mileageTag: z.number().int().min(0).max(500_000),
  costClp: z.number().int().nonnegative(),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type ModelInput = z.infer<typeof modelSchema>;
export type VersionInput = z.infer<typeof versionSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

export type EntityKey = 'brand' | 'model' | 'version' | 'equipment' | 'maintenance';

export const entitySchemaByKey: Record<EntityKey, z.ZodTypeAny> = {
  brand: brandSchema,
  model: modelSchema,
  version: versionSchema,
  equipment: equipmentSchema,
  maintenance: maintenanceSchema,
};

export type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'foreignKey'
  | 'enumWithOther'
  | 'imageUrl'
  | 'gallery'
  | 'array';

export interface FieldMeta {
  field: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  optionsApi?: string;
  optionLabel?: string;
}

export const FIELD_METAS: Record<EntityKey, FieldMeta[]> = {
  brand: [
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'logoUrl', label: 'Logo', kind: 'imageUrl' },
  ],
  model: [
    { field: 'brandId', label: 'Marca', kind: 'foreignKey', optionsApi: '/brands', optionLabel: 'name' },
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'segment', label: 'Segmento', kind: 'enumWithOther', options: [...SEGMENTS] },
    { field: 'imageUrl', label: 'Imagen principal', kind: 'imageUrl' },
    { field: 'galleryUrls', label: 'Galería', kind: 'gallery' },
  ],
  version: [
    { field: 'modelId', label: 'Modelo', kind: 'foreignKey', optionsApi: '/models', optionLabel: 'name' },
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'year', label: 'Año', kind: 'number' },
    { field: 'priceClp', label: 'Precio CLP', kind: 'number' },
    { field: 'transmission', label: 'Transmisión', kind: 'enumWithOther', options: [...TRANSMISSIONS] },
    { field: 'fuel', label: 'Combustible', kind: 'enumWithOther', options: [...FUELS] },
    { field: 'engineDisplacementCc', label: 'Cilindrada cc', kind: 'number' },
    { field: 'powerHp', label: 'Potencia hp', kind: 'number' },
    { field: 'torqueNm', label: 'Torque Nm', kind: 'number' },
    { field: 'consumptionCityKmL', label: 'Consumo ciudad km/L', kind: 'number' },
    { field: 'consumptionHighwayKmL', label: 'Consumo carretera km/L', kind: 'number' },
    { field: 'lengthMm', label: 'Largo mm', kind: 'number' },
    { field: 'widthMm', label: 'Ancho mm', kind: 'number' },
    { field: 'heightMm', label: 'Alto mm', kind: 'number' },
    { field: 'weightKg', label: 'Peso kg', kind: 'number' },
    { field: 'trunkLiters', label: 'Maleta L', kind: 'number' },
    { field: 'airbagCount', label: 'Airbags', kind: 'number' },
    { field: 'hasAbs', label: 'Frenos ABS', kind: 'boolean' },
    { field: 'hasEsp', label: 'Control de estabilidad', kind: 'boolean' },
    { field: 'hasCruiseControl', label: 'Control de crucero', kind: 'boolean' },
  ],
  equipment: [
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'category', label: 'Categoría', kind: 'text' },
  ],
  maintenance: [
    { field: 'versionId', label: 'Versión', kind: 'foreignKey', optionsApi: '/versions', optionLabel: 'name' },
    { field: 'mileageTag', label: 'Kilometraje', kind: 'number' },
    { field: 'costClp', label: 'Costo CLP', kind: 'number' },
  ],
};
