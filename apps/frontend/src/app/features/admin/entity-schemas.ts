import { z } from 'zod';
import { ENGINE_TYPE_OPTIONS, TRACTION_OPTIONS } from '../../core/types/version-labels';

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
  dealerIds: z.array(z.string()).optional(),
  // No viaja en el payload de la marca: se sincroniza aparte contra
  // PUT /admin/equipment/brand/:id (ver brands-admin.component.ts).
  equipment: z.array(z.string()).optional(),
});

export const modelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.string().min(1).max(40).regex(ENUM_REGEX),
  imageUrl: imageUrlField.nullable().optional(),
  galleryUrls: z.array(imageUrlField).default([]),
  equipment: z.array(z.string()).optional(),
  comment: z.string().max(500).nullable().optional(),
});

// Sin `year`: es el año que va en el padrón de un 0km comprado hoy, así que
// lo pone el backend con el calendario (apps/backend/src/shared/model-year.ts)
// y no se carga por versión.
export const versionSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(2).max(80),
  priceClp: z.number().int().nonnegative(),
  transmission: z.string().min(1).max(40).regex(ENUM_REGEX),
  fuel: z.string().min(1).max(40).regex(ENUM_REGEX),
  traction: z.enum(['TRACTION_FRONT', 'TRACTION_REAR', 'TRACTION_AWD', 'TRACTION_4X4_LOW']).nullable().optional(),
  engineType: z.enum(['ENGINE_NA', 'ENGINE_TURBO', 'ENGINE_TWIN_TURBO']).nullable().optional(),
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
  circulationPermitClp: z.number().int().nonnegative().nullable().optional(),
  mandatoryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
  voluntaryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
  fuelTankLiters: z.number().nonnegative().nullable().optional(),
  batteryCapacityKwh: z.number().nonnegative().nullable().optional(),
  hasRecall: z.boolean().default(false),
  recallUrl: z.string().url().nullable().optional(),
});

export const equipmentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  comment: z.string().max(500).nullable().optional(),
});

const HEX_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export const colorSchema = z.object({
  name: z.string().min(2).max(80),
  hex: z.string().regex(HEX_REGEX).nullable().optional(),
});

export const maintenanceSchema = z.object({
  versionId: z.string().min(1),
  mileageTag: z.number().int().min(0).max(500_000),
  costClp: z.number().int().nonnegative(),
});

export const dealerSchema = z.object({
  name: z.string().min(2).max(120),
  url: z.string().url(),
  logoUrl: imageUrlField.nullable().optional(),
});

export const fuelPriceSchema = z.object({
  fuelType: z.enum(FUELS),
  pricePerUnitClp: z.number().positive(),
  unit: z.enum(['L', 'kWh']),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type ModelInput = z.infer<typeof modelSchema>;
export type VersionInput = z.infer<typeof versionSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type ColorInput = z.infer<typeof colorSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
export type DealerInput = z.infer<typeof dealerSchema>;
export type FuelPriceInput = z.infer<typeof fuelPriceSchema>;

export type EntityKey = 'brand' | 'model' | 'version' | 'equipment' | 'maintenance' | 'dealer' | 'fuelPrice' | 'color';

export const entitySchemaByKey: Record<EntityKey, z.ZodTypeAny> = {
  brand: brandSchema,
  model: modelSchema,
  version: versionSchema,
  equipment: equipmentSchema,
  maintenance: maintenanceSchema,
  dealer: dealerSchema,
  fuelPrice: fuelPriceSchema,
  color: colorSchema,
};

export type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'foreignKey'
  | 'enumWithOther'
  | 'imageUrl'
  | 'gallery'
  | 'multiSelect'
  | 'array';

export interface FieldMeta {
  field: string;
  label: string;
  kind: FieldKind;
  options?: Array<string | { value: string; label: string }>;
  optionsApi?: string;
  optionLabel?: string;
  optional?: boolean;
  hidden?: boolean;
  /**
   * Campo de contexto: al usar "Guardar y crear otro" su valor se conserva
   * para la siguiente alta. Marcar los que se repiten dentro de una tanda de
   * carga (marca, modelo, año) y no los que identifican al registro.
   */
  sticky?: boolean;
  /** When provided, hides the field unless the form's `fuel` value is in this list. */
  showWhenFuels?: string[];
  /**
   * Clave de la entidad que trae un `Record<id, motivo>` para anotar las
   * opciones ya seleccionadas de un `multiSelect`. La usa el diálogo para
   * marcar el equipamiento que la versión hereda de su marca o su modelo.
   */
  annotationsFrom?: string;
  placeholder?: string;
  help?: string;
  group?: string;
  /** Solo `text`: renderiza un `<textarea>` en vez de un `<input>`. */
  multiline?: boolean;
  /** Solo `number`: muestra separador de miles mientras se escribe (montos CLP). */
  thousands?: boolean;
}

const EXEMPT_KINDS: ReadonlySet<FieldKind> = new Set<FieldKind>([
  'foreignKey',
  'imageUrl',
  'array',
  'gallery',
  'multiSelect',
]);

export function isFieldRequired(meta: FieldMeta): boolean {
  if (meta.optional) return false;
  if (EXEMPT_KINDS.has(meta.kind)) return false;
  return true;
}

/**
 * Convierte texto libre a un token válido según `ENUM_REGEX`.
 *
 * La opción "Otro" de los selects deja escribir cualquier cosa; sin normalizar,
 * "Doble embrague" llegaba como "DOBLE EMBRAGUE" y el backend lo rechazaba por
 * el espacio. El rango ̀-ͯ son los diacríticos combinantes que deja
 * `normalize('NFD')`.
 */
export function toEnumToken(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/(^_+|_+$)/g, '');
}

export const FIELD_METAS: Record<EntityKey, FieldMeta[]> = {
  brand: [
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'logoUrl', label: 'Logo', kind: 'imageUrl' },
    { field: 'dealerIds', label: 'Concesionarios', kind: 'multiSelect', optionsApi: '/admin/dealers/options', optionLabel: 'name' },
    { field: 'equipment', label: 'Equipamiento de serie', kind: 'multiSelect', optionsApi: '/admin/equipment/options', optionLabel: 'name', placeholder: 'Buscar equipamiento…', help: 'Lo heredan todas las versiones de la marca, existentes y nuevas. Cada versión puede excluirlo individualmente.' },
  ],
  model: [
    { field: 'brandId', label: 'Marca', kind: 'foreignKey', optionsApi: '/brands', optionLabel: 'name', sticky: true },
    { field: 'name', label: 'Nombre', kind: 'text' },
    // Las opciones salen del endpoint y no de `SEGMENTS`: incluye los valores
    // dados de alta con "Otro" en cargas anteriores, que de otro modo habría
    // que retipear (y se duplicaban como MINIVAN / MINI_VAN).
    { field: 'segment', label: 'Segmento', kind: 'enumWithOther', optionsApi: '/models/segments', placeholder: 'Buscar o crear segmento…', sticky: true },
    { field: 'imageUrl', label: 'Imagen principal', kind: 'imageUrl' },
    { field: 'galleryUrls', label: 'Galería', kind: 'gallery' },
    { field: 'equipment', label: 'Equipamiento de serie', kind: 'multiSelect', optionsApi: '/admin/equipment/options', optionLabel: 'name', placeholder: 'Buscar equipamiento…', help: 'Lo heredan todas las versiones del modelo, existentes y nuevas. Cada versión puede excluirlo individualmente.' },
    { field: 'comment', label: 'Comentario', kind: 'text', multiline: true, optional: true, help: 'Nota del editor: dato curioso o aclaración. El usuario la ve como tooltip en el catálogo y el comparador, y como cuadro en la ficha del modelo.' },
  ],
  version: [
    { field: 'modelId', label: 'Modelo', kind: 'foreignKey', optionsApi: '/admin/models/options', optionLabel: 'name', group: 'Identificación', sticky: true },
    { field: 'name', label: 'Nombre', kind: 'text', group: 'Identificación' },
    { field: 'priceClp', label: 'Precio CLP', kind: 'number', thousands: true, group: 'Identificación' },
    // Igual que `segment` en model: opciones desde la DB para no perder los
    // valores creados con "Otro".
    { field: 'transmission', label: 'Transmisión', kind: 'enumWithOther', optionsApi: '/versions/transmissions', placeholder: 'Buscar o crear transmisión…', group: 'Motor', sticky: true },
    { field: 'fuel', label: 'Combustible', kind: 'enumWithOther', optionsApi: '/versions/fuels', placeholder: 'Buscar o crear combustible…', group: 'Motor', sticky: true },
    // Las opciones salen de `version-labels` —la misma lista con la que la
    // ficha y el comparador traducen el token a etiqueta— para que no haya dos
    // copias que puedan divergir.
    //
    // `optional` para no exigir en el form lo que versionSchema declara
    // `.nullable().optional()`: sin esto el formulario se niega a guardar una
    // versión sin tracción que el backend sí acepta.
    { field: 'traction', label: 'Tracción', kind: 'enumWithOther', options: [...TRACTION_OPTIONS], optional: true, group: 'Motor' },
    { field: 'engineType', label: 'Tipo Motor', kind: 'enumWithOther', options: [...ENGINE_TYPE_OPTIONS], optional: true, group: 'Motor', showWhenFuels: ['BENCINA', 'DIESEL', 'HYBRID'] },
    { field: 'engineDisplacementCc', label: 'Cilindrada cc', kind: 'number', optional: true, help: 'No aplica a vehículos eléctricos', group: 'Motor', showWhenFuels: ['BENCINA', 'DIESEL', 'HYBRID'] },
    { field: 'powerHp', label: 'Potencia hp', kind: 'number', group: 'Motor' },
    { field: 'torqueNm', label: 'Torque Nm', kind: 'number', group: 'Motor' },
    { field: 'consumptionCityKmL', label: 'Consumo ciudad km/L', kind: 'number', optional: true, help: 'No aplica a vehículos eléctricos', group: 'Consumo', showWhenFuels: ['BENCINA', 'DIESEL', 'HYBRID'] },
    { field: 'consumptionHighwayKmL', label: 'Consumo carretera km/L', kind: 'number', optional: true, help: 'No aplica a vehículos eléctricos', group: 'Consumo', showWhenFuels: ['BENCINA', 'DIESEL', 'HYBRID'] },
    { field: 'autonomyKm', label: 'Autonomía km', kind: 'number', optional: true, help: 'Autonomía estimada con carga completa (obligatoria para eléctricos)', group: 'Consumo', showWhenFuels: ['ELECTRIC'] },
    // El orden de este array define el orden de las secciones: "Tanque y
    // batería" va acá para quedar pegada a "Consumo", que es lo que se llena
    // en la misma pasada.
    { field: 'fuelTankLiters', label: 'Capacidad estanque L', kind: 'number', optional: true, help: 'Capacidad del estanque de combustible en litros', group: 'Tanque y batería' },
    { field: 'batteryCapacityKwh', label: 'Capacidad batería kWh', kind: 'number', optional: true, help: 'Capacidad de la batería en kWh (solo vehículos eléctricos o híbridos enchufables)', group: 'Tanque y batería' },
    { field: 'lengthMm', label: 'Largo mm', kind: 'number', group: 'Dimensiones' },
    { field: 'widthMm', label: 'Ancho mm', kind: 'number', group: 'Dimensiones' },
    { field: 'heightMm', label: 'Alto mm', kind: 'number', group: 'Dimensiones' },
    { field: 'weightKg', label: 'Peso kg', kind: 'number', group: 'Dimensiones' },
    { field: 'trunkLiters', label: 'Maleta L', kind: 'number', group: 'Dimensiones' },
    // La lista es el equipamiento **efectivo**: incluye lo heredado de la marca
    // y del modelo, marcado vía `annotationsFrom`. Quitar un heredado no lo
    // borra del origen, crea una excepción para esta versión.
    { field: 'equipment', label: 'Equipamiento', kind: 'multiSelect', optionsApi: '/admin/equipment/options', optionLabel: 'name', group: 'Equipamiento', annotationsFrom: 'equipmentInherited' },
    { field: 'colors', label: 'Colores', kind: 'multiSelect', optionsApi: '/admin/colors/options', optionLabel: 'name', placeholder: 'Buscar color…', group: 'Apariencia' },
    { field: 'circulationPermitClp', label: 'Permiso circulación CLP', kind: 'number', optional: true, help: 'Permiso de circulación anual del vehículo en pesos chilenos', group: 'Seguros y permisos' },
    { field: 'mandatoryInsuranceClp', label: 'SOAP CLP', kind: 'number', optional: true, help: 'Seguro Obligatorio de Accidentes Personales (SOAP) en pesos chilenos', group: 'Seguros y permisos' },
    { field: 'voluntaryInsuranceClp', label: 'Seguro automotriz CLP', kind: 'number', optional: true, group: 'Seguros y permisos' },
    { field: 'hasRecall', label: '¿Tiene recall?', kind: 'boolean', optional: true, group: 'Recalls' },
    { field: 'recallUrl', label: 'URL del informe (si recall)', kind: 'text', optional: true, help: 'URL pública del informe de recall publicado por el fabricante o la autoridad', group: 'Recalls' },
  ],
  equipment: [
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'category', label: 'Categoría', kind: 'enumWithOther', optionsApi: '/admin/equipment/categories', placeholder: 'Buscar o crear categoría…', sticky: true },
    { field: 'comment', label: 'Comentario', kind: 'text', multiline: true, optional: true, help: 'Nota del editor del ítem. Se muestra como tooltip sobre el ítem en la ficha del modelo y en el comparador.' },
  ],
  maintenance: [
    { field: 'versionId', label: 'Versión', kind: 'foreignKey', optionsApi: '/admin/versions/options', optionLabel: 'name', hidden: true, sticky: true },
    { field: 'mileageTag', label: 'Kilometraje', kind: 'number' },
    { field: 'costClp', label: 'Costo CLP', kind: 'number' },
  ],
  dealer: [
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'url', label: 'URL', kind: 'text' },
    { field: 'logoUrl', label: 'Logo', kind: 'imageUrl' },
  ],
  fuelPrice: [
    { field: 'fuelType', label: 'Tipo de combustible', kind: 'enumWithOther', options: [...FUELS] },
    { field: 'pricePerUnitClp', label: 'Precio CLP / unidad', kind: 'number' },
    { field: 'unit', label: 'Unidad', kind: 'enumWithOther', options: ['L', 'kWh'], sticky: true },
  ],
  color: [
    { field: 'name', label: 'Nombre', kind: 'text' },
    { field: 'hex', label: 'Hex (opcional)', kind: 'text', optional: true, help: 'Código hexadecimal del color, p. ej. #FF0000' },
  ],
};

/**
 * Campos que "Guardar y crear otro" conserva, derivados del flag `sticky`
 * de FIELD_METAS para que no haya dos listas que mantener sincronizadas.
 */
export const STICKY_FIELDS: Record<EntityKey, string[]> = Object.fromEntries(
  Object.entries(FIELD_METAS).map(([key, metas]) => [
    key,
    metas.filter((m) => m.sticky).map((m) => m.field),
  ]),
) as Record<EntityKey, string[]>;
