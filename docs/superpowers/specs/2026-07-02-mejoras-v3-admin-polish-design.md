# Mejoras v3: Polish del panel de administración (dashboard, CRUD, formularios)

**Fecha**: 2026-07-02
**Estado**: Aprobado para implementación
**Apps afectadas**: `apps/backend`, `apps/frontend`

## Objetivo

Nueve mejoras agrupadas en tres ejes para el panel de administración:

1. **Dashboard** — el conteo de "Mantención" muestra 0 y debe ser la suma total de registros de mantención a través de todas las versiones (#1).
2. **CRUD** — la pantalla de mantención por versión muestra registros repetidos y debe filtrar por la versión seleccionada (#2); los buscadores deben ofrecer un botón X para limpiar cuando hay texto (#3).
3. **Formularios** — los diálogos de alta/edición pasan de un renderer genérico a un renderer declarativo por tipo de campo con:
   - Upload de imágenes desde el formulario para campos de URL de imagen (#4).
   - `id` (y timestamps) ocultos en el formulario y en el JSON inicial (#5).
   - Campos FK como `brandId`/`modelId`/`versionId` como `<select>` con buscador (#6).
   - Campos enum (`segment`, `fuel`, `transmission`) como `<select>` con opciones existentes + opción "otro" que permite tipear un valor nuevo y extender el enum en backend (#7).
   - Campos booleanos (`hasAbs`, `hasEsp`, `hasCruiseControl`) como toggle (#8).
   - Labels con nombre natural + nombre técnico entre paréntesis, p.ej. `Combustible (fuel)` (#9).

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Almacenamiento de imágenes | Disco local en `apps/backend/public/uploads/<yyyy-mm>/<nanoid>.<ext>` servido por `express.static('/uploads')` | Recomendado por el usuario; sin dependencias externas. |
| Validación de upload | multer memory storage, 5MB máximo, mime whitelist `image/jpeg`, `image/png`, `image/webp`, `image/gif` | Bloquea archivos arbitrarios y previene path traversal. |
| Nombre del archivo subido | `nanoid(10)` + extensión validada contra mime (`jpg`, `png`, `webp`, `gif`) | Evita colisiones y nombres controlados. |
| Enum dinámico "otro" | `ALTER TYPE "Segment" ADD VALUE IF NOT EXISTS 'NEW_VALUE'` vía `prisma.$executeRawUnsafe` autocommiteado antes del insert/update | Recomendado por el usuario; `IF NOT EXISTS` da idempotencia. |
| DTOs `segment`/`fuel`/`transmission` | Relajados de `z.enum([...])` a `z.string().regex(/^[A-Z0-9_]+$/)` con `.min(1).max(40)` | Permite valores nuevos manteniendo un formato seguro. |
| Detección de campos FK en el diálogo | Hardcoded en `buildFieldMeta(entityKey)`: por nombre de campo (`brandId`, `modelId`, `versionId`) | Coincide con el modelo Prisma y no requiere introspección. |
| Detección de campos enum | Hardcoded por `entityKey` y `field` (segment, fuel, transmission) | Los enums son fijos y conocidos. |
| Tab JSON del diálogo | Se mantiene como pestaña avanzada | Recomendado por el usuario; útil para power users. |
| Ocultar `id` y timestamps | Nunca aparecen en `fieldMetas()`; el JSON inicial se sanitiza (sin `id`, `createdAt`, `updatedAt`, `deletedAt`) | Recomendado por el usuario. |
| Componentes de campo | Todos externos (`.ts` + `.html` + `.css`), nunca inline en TS | Convención del proyecto. |
| Conteo mantención dashboard | Llamar `/admin/maintenance` y contar `res.data.length` | El dashboard ya está bajo `adminGuard`; admin endpoint ya existe. |
| Dedup mantención | `loadMaintenance()` filtra `res.data.filter(m => m.versionId === versionId)` antes de `items.set()` | Corrige el bug donde `/admin/maintenance` devuelve todos los registros. |
| Componente de búsqueda compartido | `<app-search-input>` en `shared/ui/` | Reutilizable en los 4 CRUD y mantenimiento. |

## Cambios fuera de alcance

- No se modifica la lógica del catálogo público ni del comparador.
- No se introducen librerías nuevas en frontend (sólo backend: `multer` y `@types/multer`).
- No se hace limpieza automática de archivos huérfanos en disco (queda como TODO futuro, fuera de alcance).
- No se modifica el modelo Prisma (`Schema`/`Seed`) ni migraciones de datos.
- No se reescribe `equipment-admin` ni su flujo (sólo se le agrega el buscador con X).
- No se cambia el formato de respuestas del backend (`{ data, error }`).

---

## 1. Backend

### 1.1 Helper `extendEnum`

Archivo nuevo: `apps/backend/src/shared/enum-extension.ts`.

```ts
import type { PrismaClient } from "@prisma/client";

export type EnumName = "Segment" | "Fuel" | "Transmission";

export async function extendEnum(
  prisma: PrismaClient,
  enumName: EnumName,
  newValue: string,
): Promise<void> {
  if (!/^[A-Z0-9_]+$/.test(newValue)) {
    throw new Error(`Valor inválido para enum ${enumName}: ${newValue}`);
  }
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${newValue}'`,
  );
  // Postgres cachea definiciones de enum por sesión. Tras un ALTER TYPE ADD VALUE,
  // la conexión actual no ve el nuevo valor hasta cerrar. Forzamos reconnect del pool.
  await prisma.$disconnect();
  await prisma.$connect();
}
```

**Tests** (`enum-extension.spec.ts`):
- Idempotencia: llamar `extendEnum` dos veces con el mismo valor no rompe (segunda es no-op gracias a `IF NOT EXISTS`).
- Validación regex: rechaza `"lowercase"`, `"BAD-VALUE"`, `""`, `"'; DROP TABLE x; --"` (SQL injection).
- Integración con `ModelsService.create`: crear un modelo con `segment="ELECTRIC_SUV"` resulta en una fila persistida y la consulta posterior retorna ese valor sin errores.

### 1.2 Módulo `uploads/`

Estructura:

| Archivo | Contenido |
|---|---|
| `apps/backend/src/modules/uploads/uploads.routes.ts` | `uploadsAdminRouter = Router()` con `authenticate`, `requireRole("ADMIN")`, multer memory. `POST /` → `uploadsController.upload`. |
| `apps/backend/src/modules/uploads/uploads.controller.ts` | Valida mime contra whitelist, deriva extensión del mime, genera filename = `nanoid(10)` + ext, escribe a `apps/backend/public/uploads/<yyyy-mm>/<id>.<ext>`, retorna `{ data: { url, filename, size, mime } }`. |
| `apps/backend/src/modules/uploads/uploads.controller.spec.ts` | 401 sin auth; 403 no-admin; 200 con `image/png`; rechazo de mime `application/pdf`; rechazo de >5MB. |

`uploadsAdminRouter` se registra en `app.ts`:
```ts
app.use("/api/v1/admin/uploads", uploadsAdminRouter);
app.use("/uploads", express.static("public/uploads"));
```

URL pública resultante: `http://<host>/uploads/<yyyy-mm>/<id>.<ext>`.

### 1.3 DTOs relajados para segment/fuel/transmission

`apps/backend/src/modules/models/models.dto.admin.ts`:

```ts
export const SEGMENT_REGEX = /^[A-Z0-9_]+$/;
export const createModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.string().min(1).max(40).regex(SEGMENT_REGEX),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});
export const updateModelSchema = createModelSchema.partial().omit({ brandId: true });
```

`apps/backend/src/modules/versions/versions.dto.admin.ts` (idem para `fuel` y `transmission`):

```ts
export const ENUM_REGEX = /^[A-Z0-9_]+$/;
export const createVersionSchema = z.object({
  // ...
  transmission: z.string().min(1).max(40).regex(ENUM_REGEX),
  fuel: z.string().min(1).max(40).regex(ENUM_REGEX),
  // ...
});
```

### 1.4 Integración en services

`ModelsService.create()` y `ModelsService.update()`:
- Si `input.segment` no está en `["SEDAN","SUV","HATCHBACK","PICKUP","CROSSOVER","COMMERCIAL"]`, llamar `await extendEnum(prisma, "Segment", input.segment)` antes del `prisma.model.create/update`.

`VersionsService.create()` y `VersionsService.update()`:
- Mismo patrón para `fuel` (FUELS) y `transmission` (TRANSMISSIONS).

### 1.5 Endpoint público `/maintenance`

`apps/backend/src/modules/maintenance/maintenance.routes.ts`:

```ts
export const maintenanceRouter = Router();
maintenanceRouter.get("/", maintenanceController.listAllPublic);
maintenanceRouter.get("/version/:versionId", maintenanceController.listByVersion);
```

`MaintenanceController.listAllPublic`: retorna `MaintenanceService.listAllPublic()` que retorna `findMany({ where: { deletedAt: null, ... } })` con `select: { id, versionId, mileageTag, costClp }`.

**Test** (`maintenance.controller.spec.ts`): 200 con array; shape correcto; sin auth requerida.

### 1.6 Archivos backend (resumen)

**Nuevo**:
- `apps/backend/src/shared/enum-extension.ts`
- `apps/backend/src/shared/enum-extension.spec.ts`
- `apps/backend/src/modules/uploads/uploads.routes.ts`
- `apps/backend/src/modules/uploads/uploads.controller.ts`
- `apps/backend/src/modules/uploads/uploads.controller.spec.ts`

**Modificado**:
- `apps/backend/package.json` (sumar `multer` y `@types/multer`)
- `apps/backend/src/app.ts`
- `apps/backend/src/modules/models/models.dto.admin.ts`
- `apps/backend/src/modules/models/models.service.ts`
- `apps/backend/src/modules/models/models.service.spec.ts`
- `apps/backend/src/modules/versions/versions.dto.admin.ts`
- `apps/backend/src/modules/versions/versions.service.ts`
- `apps/backend/src/modules/versions/versions.service.spec.ts`
- `apps/backend/src/modules/maintenance/maintenance.controller.ts`
- `apps/backend/src/modules/maintenance/maintenance.service.ts`
- `apps/backend/src/modules/maintenance/maintenance.routes.ts`
- `apps/backend/src/modules/maintenance/maintenance.controller.spec.ts`

---

## 2. Frontend

### 2.1 `SearchInputComponent` (compartido)

Archivos:
- `apps/frontend/src/app/shared/ui/search-input.component.{ts,html,css}`
- `apps/frontend/src/app/shared/ui/search-input.component.spec.ts`

API:
```ts
readonly value = model<string>('');
readonly placeholder = input<string>('Buscar…');
readonly changed = output<string>();
clear(): void { this.value.set(''); this.changed.emit(''); }
onInput(v: string): void { this.value.set(v); this.changed.emit(v); }
```

UI:
- Input con clase `w-full rounded border border-border pl-9 pr-9 py-2 text-sm bg-surface`.
- Icono `search` (material-symbols-outlined) a la izquierda, posición absoluta.
- Botón X (icono `close`) a la derecha, visible sólo si `value()` no está vacío.
- `aria-label="Limpiar búsqueda"` en el botón X.

Reemplaza el `<input>` de búsqueda actual en `brands-admin`, `models-admin`, `versions-admin`, `equipment-admin`. `maintenance-admin` no tiene buscador actualmente; no se agrega.

### 2.2 `ApiService.upload`

Extender `apps/frontend/src/app/core/api.service.ts`:

```ts
async upload(file: File): Promise<{ data: { url: string; filename: string; size: number; mime: string } }> {
  const fd = new FormData();
  fd.append('file', file);
  return firstValueFrom(
    this.http.post<{ data: { url: string; filename: string; size: number; mime: string } }>(
      `${ENV.apiBase}/admin/uploads`, fd, { withCredentials: true },
    ),
  );
}
```

### 2.3 Componentes de campo

Carpeta `apps/frontend/src/app/features/admin/fields/`. Cada componente tiene `.ts` + `.html` + `.css`, `OnPush`, standalone.

| Componente | Selector | Inputs | Comportamiento |
|---|---|---|---|
| `TextFieldComponent` | `app-text-field` | `control: FormControl`, `multiline?: boolean` | Input text o textarea (rows=2) según `multiline`. |
| `NumberFieldComponent` | `app-number-field` | `control: FormControl` | Input number, `step` según contexto. |
| `ToggleFieldComponent` | `app-toggle-field` | `control: FormControl<boolean>` | `<button role="switch" [attr.aria-checked]="control.value">` con track + thumb, colores brand/border. |
| `SelectSearchComponent` | `app-select-search` | `control: FormControl<string>`, `options?: string[]`, `optionsApi?: string`, `optionLabel?: string`, `allowOther?: boolean` | Combobox buscable: input text + lista filtrada. Carga opciones de `optionsApi` (`GET` retorna `{ data: [...] }`) si está definido; si no, usa `options`. Soporta teclado (↑↓ Enter Esc) y cierre por click outside. Si `allowOther=true` y se tipea valor no listado, agrega opción "otro: <valor>". |
| `ImageUploadFieldComponent` | `app-image-upload-field` | `control: FormControl<string \| null>` | Preview de la imagen si hay valor; botón "Subir imagen" abre file picker; al seleccionar llama `ApiService.upload`, asigna `url` retornada al control. Permite borrar la imagen (control → null). |

Todos los componentes exponen `control` como `input.required<FormControl>()` y se conectan vía `[formControl]="control"` (no `[formControlName]`, así son reutilizables fuera del form group del padre).

### 2.4 Refactor de `admin-edit-dialog.component`

Archivos: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html,css}` y su `.spec.ts`.

`entity-schemas.ts` agrega:

```ts
export type FieldKind =
  | 'text' | 'number' | 'boolean' | 'select'
  | 'foreignKey' | 'enumWithOther' | 'imageUrl' | 'array';

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
    { field: 'name',    label: 'Nombre',  kind: 'text' },
    { field: 'logoUrl', label: 'Logo',    kind: 'imageUrl' },
  ],
  model: [
    { field: 'brandId',     label: 'Marca',            kind: 'foreignKey',  optionsApi: '/brands', optionLabel: 'name' },
    { field: 'name',        label: 'Nombre',           kind: 'text' },
    { field: 'segment',     label: 'Segmento',         kind: 'enumWithOther', options: ['SEDAN','SUV','HATCHBACK','PICKUP','CROSSOVER','COMMERCIAL'] },
    { field: 'imageUrl',    label: 'Imagen principal', kind: 'imageUrl' },
    { field: 'galleryUrls', label: 'Galería',          kind: 'array' },
  ],
  version: [
    { field: 'modelId',               label: 'Modelo',                  kind: 'foreignKey',  optionsApi: '/models', optionLabel: 'name' },
    { field: 'name',                  label: 'Nombre',                  kind: 'text' },
    { field: 'year',                  label: 'Año',                     kind: 'number' },
    { field: 'priceClp',              label: 'Precio CLP',              kind: 'number' },
    { field: 'transmission',          label: 'Transmisión',             kind: 'enumWithOther', options: ['MANUAL','AUTOMATIC','CVT','DCT'] },
    { field: 'fuel',                  label: 'Combustible',             kind: 'enumWithOther', options: ['BENCINA','DIESEL','HYBRID','ELECTRIC'] },
    { field: 'engineDisplacementCc',  label: 'Cilindrada cc',           kind: 'number' },
    { field: 'powerHp',               label: 'Potencia hp',             kind: 'number' },
    { field: 'torqueNm',              label: 'Torque Nm',               kind: 'number' },
    { field: 'consumptionCityKmL',    label: 'Consumo ciudad km/L',     kind: 'number' },
    { field: 'consumptionHighwayKmL', label: 'Consumo carretera km/L',  kind: 'number' },
    { field: 'lengthMm',              label: 'Largo mm',                kind: 'number' },
    { field: 'widthMm',               label: 'Ancho mm',                kind: 'number' },
    { field: 'heightMm',              label: 'Alto mm',                 kind: 'number' },
    { field: 'weightKg',              label: 'Peso kg',                 kind: 'number' },
    { field: 'trunkLiters',           label: 'Maleta L',                kind: 'number' },
    { field: 'airbagCount',           label: 'Airbags',                 kind: 'number' },
    { field: 'hasAbs',                label: 'Frenos ABS',              kind: 'boolean' },
    { field: 'hasEsp',                label: 'Control de estabilidad',  kind: 'boolean' },
    { field: 'hasCruiseControl',      label: 'Control de crucero',      kind: 'boolean' },
  ],
  equipment: [
    { field: 'name',     label: 'Nombre',    kind: 'text' },
    { field: 'category', label: 'Categoría', kind: 'text' },
  ],
  maintenance: [
    { field: 'versionId',  label: 'Versión',     kind: 'foreignKey', optionsApi: '/versions', optionLabel: 'name' },
    { field: 'mileageTag', label: 'Kilometraje', kind: 'number' },
    { field: 'costClp',    label: 'Costo CLP',   kind: 'number' },
  ],
};
```

`buildFieldMeta(entityKey)` retorna `FIELD_METAS[entityKey]` filtrando campos que no estén en el `emptyTemplate` del backend (defensa adicional: si el backend agrega un campo nuevo al template, el front lo recoge automáticamente con kind `text` por default).

Lógica clave en el `.ts`:

```ts
// Sanitiza el current para JSON inicial y form: nunca incluye id ni timestamps.
function sanitize(value: Record<string, unknown> | null): Record<string, unknown> {
  if (!value) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'deletedAt') continue;
    out[k] = v;
  }
  return out;
}
```

`form()` se construye a partir del `emptyTemplate` del backend, agregando `FormControl` por cada campo en `FIELD_METAS[entityKey]` (no se agregan controles para campos fuera de la lista — defense in depth). El `controlFor(field)` helper retorna `form().get(field)`.

`admin-edit-dialog.component.html` en la pestaña "Formulario":

```html
<form [formGroup]="form()" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
  @for (meta of fieldMetas(); track meta.field) {
    <label class="flex flex-col text-xs">
      <span class="font-bold mb-1">
        {{ meta.label }} <span class="font-normal text-ink-muted">({{ meta.field }})</span>
      </span>
      @switch (meta.kind) {
        @case ('text')          { <app-text-field       [control]="$any(controlFor(meta.field))" /> }
        @case ('number')        { <app-number-field     [control]="$any(controlFor(meta.field))" /> }
        @case ('boolean')       { <app-toggle-field     [control]="$any(controlFor(meta.field))" /> }
        @case ('foreignKey')    { <app-select-search    [control]="$any(controlFor(meta.field))" [optionsApi]="meta.optionsApi!" [optionLabel]="meta.optionLabel!" /> }
        @case ('enumWithOther') { <app-select-search    [control]="$any(controlFor(meta.field))" [options]="meta.options!" [allowOther]="true" /> }
        @case ('imageUrl')      { <app-image-upload-field [control]="$any(controlFor(meta.field))" /> }
        @case ('array')         { <app-text-field       [control]="$any(controlFor(meta.field))" [multiline]="true" /> }
      }
    </label>
  }
</form>
```

Pestaña "JSON" muestra `JSON.stringify(this.sanitizedCurrent() ?? this.emptyTemplate(), null, 2)` (no `current` crudo, para evitar `id`/timestamps).

### 2.5 Dashboard mantención

`apps/frontend/src/app/features/admin/admin-dashboard.component.ts:40`:

Cambio:
```ts
this.load('Mantención', '/maintenance/version/__none__', 4).catch(() => undefined),
```
por:
```ts
this.load('Mantención', '/admin/maintenance', 4),
```

El método `load()` actual ya soporta arrays como respuesta, así que el conteo es `res.data.length` directamente.

### 2.6 Dedup mantención

`apps/frontend/src/app/features/admin/maintenance-admin.component.ts:60-72`:

```ts
this.items.set(res.data.filter((m) => m.versionId === versionId));
```

### 2.7 Archivos frontend (resumen)

**Nuevo**:
- `apps/frontend/src/app/shared/ui/search-input.component.{ts,html,css}`
- `apps/frontend/src/app/shared/ui/search-input.component.spec.ts`
- `apps/frontend/src/app/features/admin/fields/text-field.component.{ts,html,css}`
- `apps/frontend/src/app/features/admin/fields/number-field.component.{ts,html,css}`
- `apps/frontend/src/app/features/admin/fields/toggle-field.component.{ts,html,css}`
- `apps/frontend/src/app/features/admin/fields/select-search.component.{ts,html,css}`
- `apps/frontend/src/app/features/admin/fields/image-upload-field.component.{ts,html,css}`

**Modificado**:
- `apps/frontend/src/app/core/api.service.ts`
- `apps/frontend/src/app/features/admin/entity-schemas.ts`
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html,css}`
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts`
- `apps/frontend/src/app/features/admin/admin-dashboard.component.ts`
- `apps/frontend/src/app/features/admin/admin-dashboard.component.spec.ts`
- `apps/frontend/src/app/features/admin/brands-admin.component.{ts,html}`
- `apps/frontend/src/app/features/admin/brands-admin.component.spec.ts`
- `apps/frontend/src/app/features/admin/models-admin.component.{ts,html}`
- `apps/frontend/src/app/features/admin/models-admin.component.spec.ts`
- `apps/frontend/src/app/features/admin/versions-admin.component.{ts,html}`
- `apps/frontend/src/app/features/admin/versions-admin.component.spec.ts`
- `apps/frontend/src/app/features/admin/equipment-admin.component.{ts,html}`
- `apps/frontend/src/app/features/admin/equipment-admin.component.spec.ts`
- `apps/frontend/src/app/features/admin/maintenance-admin.component.{ts,html}`
- `apps/frontend/src/app/features/admin/maintenance-admin.component.spec.ts`

---

## 3. Testing strategy

| Capa | Framework | Cobertura mínima |
|---|---|---|
| BE controller | Vitest + supertest + Prisma real (pglite) | uploads: 401/403/200/rechazo mime/tamaño; maintenance público: 200 + shape |
| BE service | Vitest + Prisma real | `extendEnum` idempotente + validación regex (incluido caso SQL injection); `extendEnum` + `ModelsService.create` end-to-end con valor nuevo; `VersionsService.create/update` con fuel/transmission nuevos |
| FE component | Vitest + HttpClientTesting | `SearchInputComponent`: X visible/oculto, click emite `''`; `ToggleFieldComponent`: aria-checked cambia con click; `SelectSearchComponent`: filtra, allowOther agrega valor nuevo, navegación por teclado; `ImageUploadFieldComponent`: preview, upload llama ApiService, borrar pone null; `AdminEditDialogComponent`: id no se renderiza, JSON inicial no incluye id, FK es select, enum-with-other permite tipear; `AdminDashboardComponent`: mantención llama `/admin/maintenance`; `MaintenanceAdminComponent`: filtra por `versionId` |
| FE service | Vitest + HttpClientTesting | `ApiService.upload` con FormData |

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `ALTER TYPE ADD VALUE` no se puede usar dentro de la misma transacción que el `INSERT/UPDATE` que usa el nuevo valor | `extendEnum` se invoca vía `prisma.$executeRawUnsafe` autocommiteada **antes** del `prisma.model.create/update`. Tras la extensión, se llama `prisma.$disconnect()` + `prisma.$connect()` para que la siguiente query no use una conexión con la definición de enum cacheada. |
| Concurrencia: dos requests paralelos agregando el mismo valor al enum | `IF NOT EXISTS` lo hace idempotente a nivel Postgres; una segunda llamada no rompe. |
| Path traversal al guardar archivos | Filename generado por `nanoid()`; extensión derivada de mime whitelist; nunca se usa el nombre original del archivo. |
| Disco lleno o permisos faltantes | Error capturado en el controller, devuelto como `AppError('INTERNAL', ...)`. |
| Combobox no accesible | `role="combobox"`, `aria-expanded`, `aria-activedescendant`, navegación por teclado (↑ ↓ Enter Esc), cierre por click outside. |
| Archivo subido que luego queda huérfano (cambio de URL en el form sin guardar) | Aceptado en MVP. TODO futuro: limpieza periódica basada en `createdAt` + diff con URLs en DB. |
| Subida de archivo malicioso (ejecutable renombrado como PNG) | Whitelist de mime verificada en backend (no confiar en extensión); multer memory storage + análisis básico del magic number (Primeros bytes). |

---

## 5. Criterios de aceptación (resumen)

- [ ] **#1**: la card "Mantención" del dashboard muestra la suma total de registros (no 0).
- [ ] **#2**: cambiar de versión en el dropdown de mantención filtra correctamente los registros (no muestra los de otras versiones).
- [ ] **#3**: los buscadores de Marcas, Modelos, Versiones y Equipamiento muestran X cuando hay texto y la limpian al hacer click.
- [ ] **#4**: los formularios de Marca y Modelo permiten subir una imagen desde un file picker y la URL se guarda en `logoUrl`/`imageUrl`.
- [ ] **#5**: el campo `id` no aparece ni en el formulario ni en el JSON inicial del diálogo (en modo crear y editar).
- [ ] **#6**: los campos `brandId` (en Modelo), `modelId` (en Versión) y `versionId` (en Mantención) son un combobox con buscador que muestra todas las opciones disponibles.
- [ ] **#7**: `segment` (Modelo), `fuel` y `transmission` (Versión) son un combobox con las opciones existentes + "otro". Al tipear un valor nuevo, el enum se extiende en backend y se guarda.
- [ ] **#8**: `hasAbs`, `hasEsp`, `hasCruiseControl` son toggles visuales (no checkboxes ni inputs booleanos planos).
- [ ] **#9**: cada label del formulario muestra el nombre natural en negrita y el nombre técnico entre paréntesis, p.ej. `Combustible (fuel)`.
- [ ] Todos los tests pasan (`npm -w apps/backend run test`, `npm -w apps/frontend run test`).