# Mejoras v5: Concesionarios, Costos, Recalls y Bug de Nav Móvil

**Fecha**: 2026-07-09
**Estado**: Aprobado para implementación
**Apps afectadas**: `apps/backend`, `apps/frontend`
**Tipo de cambio**: Features nuevas + 1 bug fix + 1 rediseño de sección

## Objetivo

Esta entrega agrupa cuatro cambios:

1. **Bug fix**: en pantallas pequeñas, los botones "Iniciar sesión" y "Crear cuenta" del top-nav no se muestran. La regla `hidden md:inline-flex` los oculta bajo 768 px y nunca reaparecen.
2. **Rediseño sección "Mantención" → "Costos" en `compare.component`**: agregar permiso de circulación, SOAP, seguro automotriz y costo calculado de llenar estanque, además de las mantenciones por kilometraje existentes.
3. **Nueva entidad `Dealer` (concesionario)**: tabla con `name`, `url`, `logoUrl` y relación N:M con `Brand`. CRUD admin + endpoint público de lectura.
4. **Recalls en versiones**: campo `hasRecall` (bool) + `recallUrl` (opcional, obligatorio si `hasRecall=true`). Mostrar warning en página del modelo y en compare.

**Comportamiento final esperado:**

- Móvil: usuario ve los botones de auth como icon-button con tooltip.
- Compare: la sección colapsable "Costos" muestra una sub-tabla expandible por celda con los costos de mantención por kilometraje, más filas individuales para permiso, SOAP, seguro y llenar estanque.
- Modelo: el admin puede crear/editar concesionarios y asignarlos a marcas. La página de detalle del modelo lista los dealers oficiales de la marca con logo + link.
- Recall: cualquier versión con `hasRecall=true` muestra un ícono de advertencia clickeable en la página del modelo y en la ficha del compare. El link abre el informe en pestaña nueva.

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Botones auth en móvil | Duplicar bloque con variant `md:hidden` (icon-button + matTooltip) | Recomendado; preserva el comportamiento desktop sin reformular el top-nav completo. |
| Visibilidad dealer/recall en frontend | Frontend público solo lectura; CRUD via panel admin | Consistente con el patrón del proyecto (todos los CRUDs en admin). |
| Relación Brand ↔ Dealer | N:M vía tabla puente `BrandDealer` | Una marca puede tener múltiples concesionarios; un dealer puede vender varias marcas. |
| Campos Dealer | `name`, `url`, `logoUrl` (nullable) | Lo que el usuario pidió + logo para presentación en la página de modelo. |
| Precios combustible/kWh | Tabla `FuelPrice` editable por admin | Recomendado. El admin puede actualizar precios sin deploy. |
| Cálculo "llenar estanque" | Backend calcula: `fuelTankLiters × precioPorLitro` o `batteryCapacityKwh × precioPorKWh` | Cálculo derivado; se sirve dentro de `compare` y se etiqueta según `fuel`. |
| Visibilidad de recall | Modelo + compare | Recomendado; ambos son lugares donde el usuario decide. |
| Sub-tabla mantención en compare | Expandible por celda con sub-tabla kilometraje/costo | Recomendado; agrupa los datos pero permite verlos. |
| Schema de rows en compare | `CompareRow = { kind: 'simple', ... } \| { kind: 'maintenanceBreakdown', ... }` | Polymorphic; mantiene la fila simple en su schema actual y agrega un tipo nuevo. |
| Cálculo del costo de llenar estanque | Se hace en backend (compare.service) y se expone en payload | El frontend no debe saber precios; el precio vigente se inyecta. |
| Endpoint público de dealers | `GET /api/v1/brands/:brandId/dealers` | Consistente con `GET /api/v1/brands/:id/models`. |

## Cambios fuera de alcance

- **No** se agrega filtrado de dealers por región/ciudad.
- **No** se rediseña la página del modelo más allá de la nueva sub-sección de dealers y el ícono de recall.
- **No** se calcula automáticamente el costo de permiso/SOAP/seguro a partir de precio u otras variables; se almacenan como valores manuales del admin.
- **No** se hace scraping ni integración con API externa de SERNAC o marcas para detectar recalls.
- **No** se cambia el sistema de pagos de la app.
- **No** se agrega CRUD para gestionar `BrandDealer` como entidad propia visible; se sincroniza desde `PATCH /admin/brands/:id` con un `dealerIds: string[]` opcional.
- **No** se agregan tests E2E con Playwright (queda a criterio del usuario probar manualmente).

---

## 1. Backend

### 1.1 Schema (`apps/backend/prisma/schema.prisma`)

**Nuevos modelos:**

```prisma
model Dealer {
  id        String       @id @default(cuid())
  name      String
  url       String
  logoUrl   String?
  deletedAt DateTime?
  createdAt DateTime     @default(now())
  brands    BrandDealer[]

  @@index([deletedAt])
}

model BrandDealer {
  brandId  String
  dealerId String
  brand    Brand  @relation(fields: [brandId], references: [id], onDelete: Cascade)
  dealer   Dealer @relation(fields: [dealerId], references: [id], onDelete: Cascade)

  @@id([brandId, dealerId])
  @@index([dealerId])
}

model FuelPrice {
  id              String   @id @default(cuid())
  fuelType        String   // BENCINA | DIESEL | HYBRID | ELECTRIC
  pricePerUnitClp Float
  unit            String   // 'L' | 'kWh'
  effectiveFrom   DateTime @default(now())

  @@unique([fuelType, effectiveFrom])
  @@index([fuelType])
}
```

**Modificación a `Brand` (relación inversa):**

```prisma
model Brand {
  // ... existentes
  dealers BrandDealer[]
  // ...
}
```

**Modificación a `Version` (campos nuevos):**

```prisma
model Version {
  // ... existentes
  circulationPermitClp  Int?
  mandatoryInsuranceClp Int?     // SOAP
  voluntaryInsuranceClp Int?     // seguro automotriz contra accidentes
  fuelTankLiters        Float?
  batteryCapacityKwh    Float?
  hasRecall             Boolean  @default(false)
  recallUrl             String?
  // ...
}
```

**Migración:** `apps/backend/prisma/migrations/20260709_xxx_add_dealers_fuelprice_cost_recall/migration.sql` (Prisma generate; el nombre exacto lo decide `prisma migrate dev`).

### 1.2 Nuevos módulos: `dealers` y `fuel-prices`

**`apps/backend/src/modules/dealers/`:**

- `dealers.dto.admin.ts`
  - `createDealerSchema` = `{ name, url, logoUrl? }`
  - `updateDealerSchema` = `createDealerSchema.partial()`
  - Validación: `url` con zod `.url()`; `name` 2..120.
- `dealers.service.ts` — `list()`, `listAll()`, `byBrand(brandId)`, `create(input)`, `update(id, input)`, `softDelete(id)`. Mismo patrón que `brands.service`.
- `dealers.controller.ts` — endpoints.
- `dealers.routes.ts`:
  ```ts
  // público (montado bajo /api/v1/brands)
  dealersRouter.get("/:brandId/dealers", dealersController.byBrand);
  // admin (montado bajo /api/v1/admin/dealers)
  dealersAdminRouter.use(authenticate, requireRole("ADMIN"));
  dealersAdminRouter.get("/", dealersController.listAll);
  dealersAdminRouter.post("/", dealersController.create);
  dealersAdminRouter.patch("/:id", dealersController.update);
  dealersAdminRouter.delete("/:id", dealersController.softDelete);
  ```

**`apps/backend/src/modules/fuel-prices/`:**

- `fuel-prices.dto.admin.ts` — `{ fuelType, pricePerUnitClp, unit, effectiveFrom? }`. Validación: `unit` ∈ `['L','kWh']`, `pricePerUnitClp > 0`.
- `fuel-prices.service.ts` — `current()` retorna el precio más reciente por `fuelType`. `create`, `listAll`, `softDelete`.
- `fuel-prices.controller.ts`:
  ```ts
  // público
  fuelPricesRouter.get("/current", fuelPricesController.current);
  // admin
  fuelPricesAdminRouter.get("/", fuelPricesController.listAll);
  fuelPricesAdminRouter.post("/", fuelPricesController.create);
  fuelPricesAdminRouter.delete("/:id", fuelPricesController.softDelete);
  ```

### 1.3 Modificaciones a módulos existentes

**`versions.dto.admin.ts` (extender):**

```ts
export const createVersionSchema = z.object({
  // ... existentes
  circulationPermitClp: z.number().int().nonnegative().optional().nullable(),
  mandatoryInsuranceClp: z.number().int().nonnegative().optional().nullable(),
  voluntaryInsuranceClp: z.number().int().nonnegative().optional().nullable(),
  fuelTankLiters: z.number().nonnegative().optional().nullable(),
  batteryCapacityKwh: z.number().nonnegative().optional().nullable(),
  hasRecall: z.boolean().default(false),
  recallUrl: z.string().url().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.hasRecall && !data.recallUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["recallUrl"],
      message: "recallUrl es obligatorio cuando hasRecall=true",
    });
  }
});
```

**`versions.service.ts`:**

- `listAll` agrega los nuevos campos al SELECT.
- `create` y `update` aceptan los nuevos campos.

**`compare.service.ts` (extender):**

```ts
async compare(versionIds: string[]) {
  // ... existentes
  // AGREGAR: lookup de fuel prices vigentes
  const fuelPrices = await this.fuelPriceService.current();
  // AGREGAR: cálculo de fillCost por versión
  const enriched = versions.map((v) => {
    const fillCost = this.computeFillCost(v, fuelPrices);
    return { ...v, computedFillCostClp: fillCost };
  });
  return { versions: enriched, diffHighlights, fuelPrices };
}

private computeFillCost(v, fuelPrices) {
  if (v.fuel === 'ELECTRIC' && v.batteryCapacityKwh) {
    const price = fuelPrices[fuelTypeToKey('ELECTRIC')];
    return price ? v.batteryCapacityKwh * price.pricePerUnitClp : null;
  }
  if (v.fuelTankLiters) {
    const price = fuelPrices[fuelTypeToKey(v.fuel)];
    return price ? v.fuelTankLiters * price.pricePerUnitClp : null;
  }
  return null;
}
```

**`brands.service.ts` (extender):**

- `update` ahora acepta `dealerIds: string[]` opcional. Si está presente, sincroniza la tabla `BrandDealer` (delete-where + createMany).
- `listAll` y `detail` incluyen `dealers: { dealer: { id, name, url, logoUrl } }`.

### 1.4 Wiring (`apps/backend/src/app.ts`)

```ts
import { dealersRouter, dealersAdminRouter } from "./modules/dealers/dealers.routes.js";
import { fuelPricesRouter, fuelPricesAdminRouter } from "./modules/fuel-prices/fuel-prices.routes.js";

// público
//   dealersRouter expone GET /:brandId/dealers, montado bajo /api/v1/brands
//   para que la URL pública sea /api/v1/brands/:brandId/dealers
app.use("/api/v1/brands", dealersRouter);
app.use("/api/v1/fuel-prices", fuelPricesRouter);
// admin
app.use("/api/v1/admin/dealers", dealersAdminRouter);
app.use("/api/v1/admin/fuel-prices", fuelPricesAdminRouter);
```

El router público de dealers solo expone `/:brandId/dealers` (sigue el patrón del brands router público que expone `/:id/models`). El admin router expone CRUD completo bajo `/api/v1/admin/dealers`.

### 1.5 Tests backend (vitest)

| Spec | Cobertura |
|---|---|
| `dealers.service.spec.ts` (nuevo) | CRUD, byBrand, softDelete |
| `fuel-prices.service.spec.ts` (nuevo) | current retorna el más reciente por fuelType |
| `versions.dto.admin.spec.ts` (extender) | recall: URL requerida si hasRecall=true; acepta null/omitted si hasRecall=false |
| `compare.service.spec.ts` (extender) | include de nuevos campos; `computedFillCostClp` para bencina y eléctrico; null si no hay capacidad |
| `brands.service.spec.ts` (extender) | sync `dealerIds` en update |

---

## 2. Frontend

### 2.1 Bug fix: nav-mobile (`top-nav-bar.component.html`)

Reemplazar:

```html
} @else {
  <a mat-stroked-button color="primary" routerLink="/login" class="nav-login-btn hidden md:inline-flex">Iniciar sesión</a>
  <a mat-flat-button color="primary" routerLink="/register" class="nav-register-btn hidden md:inline-flex">Crear cuenta</a>
}
```

Por:

```html
} @else {
  <!-- Móvil: icon-button con tooltip -->
  <a mat-icon-button routerLink="/login" class="md:hidden" matTooltip="Iniciar sesión" aria-label="Iniciar sesión" data-testid="nav-login-btn">
    <mat-icon>login</mat-icon>
  </a>
  <a mat-icon-button routerLink="/register" class="md:hidden" matTooltip="Crear cuenta" aria-label="Crear cuenta" data-testid="nav-register-btn">
    <mat-icon>person_add</mat-icon>
  </a>
  <!-- Desktop: botones con texto (sin cambios visibles) -->
  <a mat-stroked-button color="primary" routerLink="/login" class="nav-login-btn hidden md:inline-flex">Iniciar sesión</a>
  <a mat-flat-button color="primary" routerLink="/register" class="nav-register-btn hidden md:inline-flex">Crear cuenta</a>
}
```

### 2.2 Compare — sección "Costos" (`compare.component.{ts,html}`)

**Cambio en tipos (`compare.component.ts`):**

```ts
interface CompareVersion {
  // ... existentes
  circulationPermitClp?: number | null;
  mandatoryInsuranceClp?: number | null;
  voluntaryInsuranceClp?: number | null;
  fuelTankLiters?: number | null;
  batteryCapacityKwh?: number | null;
  hasRecall?: boolean | null;
  recallUrl?: string | null;
  computedFillCostClp?: number | null;
  // mantenimientos
  maintenanceCosts?: { mileageTag: number; costClp: number }[];
}

type CompareRow =
  | { kind: 'simple'; key: DiffKey; label: string; format: (v: CompareVersion) => string }
  | { kind: 'maintenanceBreakdown'; label: string };
```

**Nueva sección en `sections`:**

```ts
{
  name: 'costos',
  label: 'Costos',
  rows: [
    { kind: 'maintenanceBreakdown', label: 'Mantención (CLP/por km)' },
    { kind: 'simple', key: 'circulationPermitClp', label: 'Permiso de circulación', format: (v) => v.circulationPermitClp ? this.formatPrice(v.circulationPermitClp) : '—' },
    { kind: 'simple', key: 'mandatoryInsuranceClp', label: 'Seguro obligatorio (SOAP)', format: (v) => v.mandatoryInsuranceClp ? this.formatPrice(v.mandatoryInsuranceClp) : '—' },
    { kind: 'simple', key: 'voluntaryInsuranceClp', label: 'Seguro automotriz', format: (v) => v.voluntaryInsuranceClp ? this.formatPrice(v.voluntaryInsuranceClp) : '—' },
    { kind: 'simple', key: 'computedFillCostClp', label: 'Llenar estanque', format: (v) => v.computedFillCostClp ? this.formatPrice(v.computedFillCostClp) : '—' },
  ],
},
```

**Render en `compare.component.html`:** el `@for (row of s.rows)` chequea `row.kind`:
- `'simple'`: igual que antes, `<td>{{ row.format(v) }}</td>`.
- `'maintenanceBreakdown'`: celda con `<button mat-stroked-button (click)="openMaintPopover(v.id)">Ver detalle (N)</button>`; popover muestra mini-tabla kilometraje → costo. Reutiliza patrón de `swappingFor()`.

**Diff highlights:** agregar las nuevas keys (`circulationPermitClp`, `mandatoryInsuranceClp`, `voluntaryInsuranceClp`, `computedFillCostClp`) a `DIFF_KEYS` en `compare.service.ts`.

**Recall badge en cards:** en `compare.component.html`, dentro del `<article>` de cada card, agregar:

```html
@if (v.hasRecall) {
  <a [href]="v.recallUrl" target="_blank" rel="noopener" class="absolute top-1.5 left-1.5 ...">
    <mat-icon>warning</mat-icon>
    Recall
  </a>
}
```

### 2.3 Página de modelo — recall + dealers (`model.component.{ts,html}`)

**Recall badge** en el `<article>` de cada versión en el sidebar:

```html
@if (v.hasRecall) {
  <a [href]="v.recallUrl" target="_blank" rel="noopener" class="...">
    <mat-icon class="text-engine">warning</mat-icon>
    Recall publicado
  </a>
}
```

**Sub-sección "Concesionarios oficiales":** debajo del sidebar de versiones:

```html
@if (dealers().length > 0) {
  <aside class="..." data-testid="brand-dealers">
    <h3 class="font-mono text-[11px] uppercase tracking-stamp text-ink-muted">Concesionarios oficiales</h3>
    <ul>
      @for (d of dealers(); track d.id) {
        <li>
          <a [href]="d.url" target="_blank" rel="noopener">
            @if (d.logoUrl) { <img [src]="d.logoUrl" [alt]="d.name"> }
            <span>{{ d.name }}</span>
          </a>
        </li>
      }
    </ul>
  </aside>
}
```

**Datos de dealers:** `model.component.ts` carga con `GET /api/v1/brands/:brandId/dealers` (nuevo endpoint público). El método `loadBrandDealers(brandId)` se invoca en `bootstrap()` cuando `brand()` está disponible.

### 2.4 Admin — nuevos CRUD

**Estructura de archivos (siguiendo el patrón existente):**

- `apps/frontend/src/app/features/admin/dealers-admin.component.{ts,html,css,spec.ts}`
- `apps/frontend/src/app/features/admin/fuel-prices-admin.component.{ts,html,css,spec.ts}`

**`entity-schemas.ts`:**

```ts
export const dealerSchema = z.object({
  name: z.string().min(2).max(120),
  url: z.string().url(),
  logoUrl: imageUrlField.nullable().optional(),
});

export const fuelPriceSchema = z.object({
  fuelType: z.enum(['BENCINA', 'DIESEL', 'HYBRID', 'ELECTRIC']),
  pricePerUnitClp: z.number().positive(),
  unit: z.enum(['L', 'kWh']),
  effectiveFrom: z.string().datetime().optional(),
});

export const brandSchema = z.object({
  // ... existentes
  dealerIds: z.array(z.string()).optional(),  // sincronizar al guardar
});

export type EntityKey = 'brand' | 'model' | 'version' | 'equipment' | 'maintenance' | 'dealer' | 'fuelPrice';
```

**`FIELD_METAS`:**

```ts
dealer: [
  { field: 'name', label: 'Nombre', kind: 'text' },
  { field: 'url', label: 'URL', kind: 'text' },
  { field: 'logoUrl', label: 'Logo', kind: 'imageUrl' },
],
fuelPrice: [
  { field: 'fuelType', label: 'Tipo de combustible', kind: 'enumWithOther', options: [...FUELS] },
  { field: 'pricePerUnitClp', label: 'Precio CLP / unidad', kind: 'number' },
  { field: 'unit', label: 'Unidad', kind: 'enumWithOther', options: ['L', 'kWh'] },
],
brand: [
  // ... existentes
  { field: 'dealerIds', label: 'Concesionarios', kind: 'multiSelect', optionsApi: '/admin/dealers', optionLabel: 'name' },
],
version: [
  // ... existentes
  { field: 'circulationPermitClp', label: 'Permiso circulación CLP', kind: 'number' },
  { field: 'mandatoryInsuranceClp', label: 'SOAP CLP', kind: 'number' },
  { field: 'voluntaryInsuranceClp', label: 'Seguro automotriz CLP', kind: 'number' },
  { field: 'fuelTankLiters', label: 'Capacidad estanque L', kind: 'number' },
  { field: 'batteryCapacityKwh', label: 'Capacidad batería kWh', kind: 'number' },
  { field: 'hasRecall', label: '¿Tiene recall?', kind: 'boolean' },
  { field: 'recallUrl', label: 'URL del informe (si recall)', kind: 'text' },
],
```

**Nota:** la marca necesita `dealerIds` en el form, pero el backend los sincroniza aparte en el PATCH. `brands-admin.component.ts.onSave` debe: 1) PATCH brand; 2) reemplazar la lista de `BrandDealer` (o un endpoint dedicado si se prefiere). Para mantenerlo simple, el backend acepta `dealerIds` en el PATCH de brand y sincroniza internamente.

**`admin-shell.component.ts`:** agregar `{ path: '/admin/dealers', label: 'Concesionarios' }` y `{ path: '/admin/fuel-prices', label: 'Precios combustible' }`.

**`admin-dashboard.component.ts`:** agregar dos cards con count.

**`app.routes.ts`:** agregar las dos rutas `dealers` y `fuel-prices` dentro del children del admin shell.

### 2.5 Version entity — incluir nuevos campos

**`versions.service.listAll` (backend):** extender el `include`/select para devolver los nuevos campos. Sin esto, el admin de versiones los recibe como `undefined` y el form no los prellena.

**`entity-schemas.ts` `versionSchema`:** agregar los 7 campos nuevos. El form los renderiza como `number` excepto `hasRecall` (boolean) y `recallUrl` (text/url).

**`CompareVersion` interface (frontend):** extender con los nuevos campos (ver 2.2).

### 2.6 Tests frontend

| Spec | Cobertura |
|---|---|
| `top-nav-bar.component.spec.ts` (extender) | En `window.matchMedia('(min-width: 768px)')` false, los `data-testid="nav-login-btn"` y `nav-register-btn` siguen visibles (con icono). |
| `compare.component.spec.ts` (extender) | Sección "Costos" se renderiza; sub-tabla de mantención se expande; recall badge aparece. |
| `model.component.spec.ts` (extender) | Recall badge visible si `hasRecall=true`; dealers se cargan. |
| `dealers-admin.component.spec.ts` (nuevo) | Smoke: renderiza lista; abre dialog de creación. |
| `fuel-prices-admin.component.spec.ts` (nuevo) | Smoke: idem. |
| `brands-admin.component.ts` (extender) | Sync de `dealerIds` al guardar (mock PATCH). |

---

## 3. Testing strategy

| Capa | Framework | Cobertura mínima |
|---|---|---|
| BE service | Vitest + Prisma real (pglite/MariaDB local) | `DealersService`, `FuelPricesService` (CRUD), `compare.service.computeFillCost`, `brands.service.update` con `dealerIds`, validación Zod de recall. |
| FE service | N/A | El dialog usa `ApiService` directamente. |
| FE component | Vitest + HttpClientTesting | Bug nav-mobile (visibilidad responsive), sección "Costos" + sub-tabla mantención, recall badge en modelo y compare. |

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backend sin precio vigente en `FuelPrice` | El cálculo retorna `null`; la celda muestra "—". El admin ve un warning en la sección admin si no hay precio para el fuelType de una versión. |
| Versiones existentes sin `fuelTankLiters` ni `batteryCapacityKwh` | Campos nullable. Migración sin default. La celda muestra "—". |
| Recall sin URL por bug de UI | Validación Zod en backend rechaza el PATCH si `hasRecall=true && !recallUrl`. |
| Recalls como dato sensible (URL pública externa) | El admin es responsable de la URL; no la scrapeamos ni validamos contenido. |
| Diff highlights no incluye las nuevas keys | Agregar explícitamente en `DIFF_KEYS` para que la celda se resalte en ámbar cuando difieren. |
| `compare` payload crece con fuel prices | Calculado en backend, < 1 KB extra; aceptable. |
| Sección "Costos" con muchos mantenimientos | Sub-tabla con scroll interno; el botón dice "Ver detalle (N puntos)" para clarificar. |
| Brand `dealerIds` se pisa al guardar | PATCH hace `set` (no merge parcial): reemplaza la lista completa cada vez. UX: el form siempre trae la lista actual antes de editar. |

---

## 5. Criterios de aceptación (resumen)

- [ ] En `top-nav-bar`, los botones de auth son visibles en móvil (icon-button) y desktop (texto) según `data-testid`.
- [ ] La sección colapsable "Costos" en compare muestra: Mantención (sub-tabla expandible por celda), Permiso de circulación, SOAP, Seguro automotriz, Llenar estanque (calculado).
- [ ] La sub-tabla de mantención muestra kilometraje y costo por cada `MaintenanceCost` de la versión.
- [ ] El cálculo de "Llenar estanque" usa `fuelTankLiters × pricePerUnitClp` o `batteryCapacityKwh × pricePerUnitClp` según `fuel` (BENCINA/DIESEL/HYBRID/ELECTRIC).
- [ ] El admin puede crear/editar dealers y asignarlos a marcas (`dealerIds` en form de marca).
- [ ] La página de modelo lista los dealers oficiales de la marca con logo + nombre + link externo.
- [ ] Si una versión tiene `hasRecall=true`, se ve un ícono de warning clickeable en la página del modelo y en compare; abre `recallUrl` en nueva pestaña.
- [ ] Backend valida: si `hasRecall=true`, `recallUrl` es obligatorio y URL válida.
- [ ] El admin puede crear `FuelPrice` por fuelType. La vista pública `GET /api/v1/fuel-prices/current` retorna el más reciente por fuelType.
- [ ] Migración aplicada: tablas `Dealer`, `BrandDealer`, `FuelPrice`; nuevos campos en `Version`.
- [ ] Tests pasan: backend (95+ tests), frontend (135+ tests).
- [ ] Build limpio en ambos.
- [ ] No se rompió el comportamiento existente (catálogo público, comparador, favoritos, modelo detalle).
