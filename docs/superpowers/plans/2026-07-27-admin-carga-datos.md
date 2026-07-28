# Panel de administración — carga de datos más rápida y simple

> **Para agentes ejecutores:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans`.
> **Primer paso de la ejecución:** copiar este archivo a `docs/superpowers/plans/2026-07-27-admin-carga-datos.md` (AGENTS.md §6) y, al cerrar, apuntar el commit range en `.superpowers/sdd/progress.md`.

## Context

El panel de administración (`apps/frontend/src/app/features/admin/`) es la única vía para
poblar el catálogo: marcas → modelos → versiones → equipamiento/colores/mantenciones. Hoy
cargar datos es lento y frágil por tres razones distintas:

1. **Bugs que rompen o encarecen el flujo.** El filtro por versión en mantenciones no se
   aplica, los selectores de versión/modelo topan en 50 registros, guardar una versión con
   equipamiento dispara N requests en serie, la opción "Otro" de los enums genera valores que
   el backend rechaza, y cada lista dispara un GET de opciones cuyo resultado nadie consume.
2. **Fricción de flujo.** No hay "guardar y crear otro" ni "duplicar": cargar 8 versiones de un
   mismo modelo obliga a tipear 28 campos ocho veces. El diálogo bloquea el formulario hasta que
   llega una plantilla estática, y cada apertura recarga desde cero las listas de opciones.
3. **Deuda estructural.** Los 8 componentes de lista repiten ~160 líneas idénticas
   (`load`, `onSave`, `confirmDelete`, `onSearch`, `onPageChange`, `toggleSort`). Toda mejora hay
   que replicarla ocho veces, lo que en la práctica congela el panel.

**Resultado buscado:** que un operador pueda cargar una familia de versiones sin repetir tipeo,
con el diálogo abriendo instantáneo, y que agregar una mejora al panel sea un cambio en un archivo
y no en ocho.

**Alcance acordado con el usuario:** refactor de la base común + quick wins + bugs, con
"guardar y crear otro" + "duplicar" y secciones opcionales colapsadas.

**Supuesto declarado:** la opción de alcance elegida ("Todo, con refactor") menciona validación
derivada de Zod, pero en la pregunta específica del formulario el usuario marcó solo "colapsar
opcionales". Se incluye como **Tarea 13, última y separable**: se puede omitir sin afectar nada
anterior.

---

## Hallazgos que originan cada tarea

| # | Archivo | Problema | Tarea |
|---|---------|----------|-------|
| 1 | `maintenance-admin.component.ts:85` | `loadMaintenance(versionId)` nunca usa el parámetro en los params → lista todas las mantenciones de la BD, no las de la versión elegida | T2 |
| 2 | `maintenance-admin.component.ts:72`, `versions-admin.component.ts:90` | Selectores alimentados con `?pageSize=50`; `MAX_PAGE_SIZE=100` en `shared/pagination.ts` → registros inalcanzables | T1 |
| 3 | `versions-admin.component.ts:155-166` | `for … await` secuencial: 20 equipamientos = 20 round-trips | T3 |
| 4 | `fields/select-search.component.ts:138` | `query.toUpperCase()` sin normalizar → falla `ENUM_REGEX` en backend | T11 |
| 5 | `models`/`brands`/`dealers`/`equipment`/`fuel-prices` admin | Fetch de opciones cuyo signal no se usa en ningún template | T5-T7 |
| 6 | `admin-edit-dialog.component.ts:267-291` + `.html:35` | `loading()` bloquea el form hasta que llega `/admin/seed/template/:key`, que es estático (`seed.controller.ts:6`) | T9 |
| 7 | `fields/select-search.component.ts:89`, `fields/multi-select-field.component.ts:82` | Sin caché: abrir el diálogo de `version` dispara 3 GETs de opciones cada vez | T8 |
| 8 | `shared/ui/admin-paged-list.ts` | `AdminPagedListState` existe pero **no se usa en ningún archivo** — refactor previo abandonado | T4 |
| 9 | backend: `*.routes.ts` | `/bulk-delete` y `/export` existen en 6 entidades y el frontend nunca los llama | fuera de alcance (ver Notas) |

---

## Arquitectura

Tres piezas nuevas y todo lo demás se apoya en ellas:

- **`AdminCrudStore<TRow>`** (`shared/ui/admin-crud.store.ts`) — absorbe el
  `AdminPagedListState` muerto y concentra estado + operaciones CRUD de una lista admin.
  Se instancia como campo de componente (contexto de inyección), así puede usar `inject()`.
  Los casos especiales (proyección de relaciones en `brands`/`versions`, `versionId` implícito en
  `maintenance`) entran por hooks de configuración, no por subclases.
- **`AdminOptionsCacheService`** (`core/admin-options-cache.service.ts`) — memoiza por path las
  respuestas de `/options` y de `/admin/seed/template/:key`, con invalidación explícita tras guardar.
- **Endpoints de sync bulk** — `PUT /admin/equipment/version/:versionId` y
  `PUT /admin/colors/version/:versionId` reemplazan el bucle attach/detach por una transacción.

El orden importa: backend (T1-T3) → base común (T4-T7) → velocidad (T8-T9) → flujo (T10-T12) →
opcional (T13). Cada tarea deja el panel funcionando y testeable.

## Global Constraints

- Versiones de deps **exactas** en `package.json`; no se agregan dependencias nuevas en este plan.
- Backend TypeScript ESM: imports terminan en **`.js`**; errores vía `AppError` de `shared/errors.ts`.
- Frontend: componentes **standalone**, **OnPush**, **signals** para estado local.
- Todo cambio de producción viene con su `.spec.ts` actualizado. Backend `vitest run`
  (`npm -w apps/backend run test`), frontend `ng test` (`npm -w apps/frontend run test`).
- `npm -w apps/frontend run check:design` debe pasar (prohíbe `rounded-xl+`, `shadow-*` suaves y
  paleta Tailwind cruda; usar tokens `--ink`, `--engine`, etc.).
- Sin cambios de schema Prisma en este plan: no hay migraciones.
- Commits frecuentes, uno por tarea. **No commitear sin pedido explícito del usuario.**

---

## Fase A — Backend (habilita el resto)

### Tarea 1: Endpoint de opciones de versiones

**Archivos:**
- Modificar: `apps/backend/src/modules/versions/versions.service.ts` (agregar `listOptions`)
- Modificar: `apps/backend/src/modules/versions/versions.controller.ts` (agregar `listOptions`)
- Modificar: `apps/backend/src/modules/versions/versions.routes.ts`
- Test: `apps/backend/src/modules/versions/versions.controller.spec.ts` (o el spec existente del módulo)

**Produce:** `GET /api/v1/admin/versions/options` → `{ data: Array<{ id, name, year, modelName }>, error: null }`

`versions.service.listAll()` (línea 73) trae `equipmentItems` y `colorItems` completos: demasiado
pesado para alimentar un selector. `listOptions` usa `select` mínimo:

```ts
listOptions() {
  return this.prisma.version.findMany({
    where: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
    orderBy: [{ model: { name: "asc" } }, { name: "asc" }, { year: "desc" }],
    select: { id: true, name: true, year: true, model: { select: { name: true } } },
  });
}
```

El controller aplana a `{ id, name: `${modelName} ${name} (${year})`, year, modelName }` para que
`app-select-search`/`app-multi-select-field` (que leen `optionLabel`, por defecto `name`) funcionen
sin cambios.

**Ruta:** `versionsAdminRouter.get("/options", versionsController.listOptions);` — **antes** de
`versionsAdminRouter.get("/:id/price-history", …)` para que `options` no se capture como `:id`.

- [ ] Test que falla: `GET /admin/versions/options` devuelve todas las versiones (crear 3 en fixture) con label `Modelo Nombre (Año)`, sin `equipmentItems` en el payload
- [ ] Correr y ver fallar (404)
- [ ] Implementar service + controller + ruta
- [ ] Correr y ver pasar
- [ ] Commit

### Tarea 2: Filtro `versionId` en mantenciones

**Archivos:**
- Modificar: `apps/backend/src/modules/maintenance/maintenance.service.ts` (`listPaged`)
- Modificar: `apps/backend/src/modules/maintenance/maintenance.controller.ts` (`listPaged`)
- Test: spec del módulo maintenance

`listPaged(q, params)` pasa a `listPaged(q, params, versionId?)`; cuando `versionId` viene, se
agrega `where.versionId = versionId` al `Prisma.MaintenanceCostWhereInput` existente (mantiene los
filtros de `deletedAt` y cascada de `version/model/brand`). El controller lee
`typeof req.query.versionId === "string" ? req.query.versionId : undefined`.

- [ ] Test que falla: dos versiones con mantenciones; `GET /admin/maintenance?versionId=v1` devuelve solo las de `v1` y `pagination.total` coherente
- [ ] Correr y ver fallar
- [ ] Implementar
- [ ] Correr y ver pasar
- [ ] Commit

### Tarea 3: Sync bulk de equipamiento y colores

**Archivos:**
- Modificar: `apps/backend/src/modules/equipment/equipment.service.ts` (+ `syncVersion`)
- Modificar: `apps/backend/src/modules/equipment/equipment.controller.ts` (+ `syncVersion`)
- Modificar: `apps/backend/src/modules/equipment/equipment.routes.ts`
- Modificar: `apps/backend/src/modules/colors/{colors.service,colors.controller,colors.routes}.ts` (mismo patrón sobre `versionColor`/`colorId`)
- Test: specs de ambos módulos

**Produce:**
- `PUT /api/v1/admin/equipment/version/:versionId` body `{ itemIds: string[] }`
- `PUT /api/v1/admin/colors/version/:versionId` body `{ colorIds: string[] }`
- Ambos devuelven `{ data: { attached: number, detached: number }, error: null }`

Rutas junto a las existentes (`equipmentAdminRouter.put("/version/:versionId", …)`), coherentes con
`DELETE /version/:versionId/item/:itemId`. Validar el body con un schema Zod en el `*.dto.admin.ts`
del módulo y lanzar `validation("Datos inválidos", parsed.error.issues)` como el resto de los
controllers.

Implementación del service, en una sola transacción, idempotente (a diferencia de `attach`, que
tira 409 si ya existe):

```ts
async syncVersion(versionId: string, itemIds: string[]) {
  const version = await this.prisma.version.findFirst({
    where: { id: versionId, deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
    select: { id: true },
  });
  if (!version) throw notFound("Versión no encontrada");

  const valid = await this.prisma.equipmentItem.findMany({
    where: { id: { in: itemIds }, deletedAt: null },
    select: { id: true },
  });
  if (valid.length !== new Set(itemIds).size) throw notFound("Equipamiento no encontrado");

  const current = await this.prisma.versionEquipment.findMany({ where: { versionId }, select: { equipmentItemId: true } });
  const currentIds = new Set(current.map((r) => r.equipmentItemId));
  const nextIds = new Set(itemIds);
  const toAttach = [...nextIds].filter((id) => !currentIds.has(id));
  const toDetach = [...currentIds].filter((id) => !nextIds.has(id));

  await this.prisma.$transaction([
    this.prisma.versionEquipment.deleteMany({ where: { versionId, equipmentItemId: { in: toDetach } } }),
    this.prisma.versionEquipment.createMany({ data: toAttach.map((equipmentItemId) => ({ versionId, equipmentItemId })) }),
  ]);
  return { attached: toAttach.length, detached: toDetach.length };
}
```

`attach`/`detach` individuales **se mantienen** (los usan otros flujos y los tests existentes).

- [ ] Test que falla (equipment): versión con items `[a,b]`, `PUT` con `[b,c]` → queda `[b,c]`, responde `{attached:1, detached:1}`
- [ ] Test que falla: `PUT` con la misma lista dos veces es idempotente (`{attached:0, detached:0}`, sin 409)
- [ ] Test que falla: `versionId` inexistente → 404
- [ ] Correr y ver fallar
- [ ] Implementar equipment; correr; ver pasar
- [ ] Replicar tests + implementación en colors (`versionColor`, campo `colorId`, body `{ colorIds }`)
- [ ] Correr toda la suite backend
- [ ] Commit

---

## Fase B — Base común del frontend

### Tarea 4: `AdminCrudStore`

**Archivos:**
- Crear: `apps/frontend/src/app/shared/ui/admin-crud.store.ts`
- Crear: `apps/frontend/src/app/shared/ui/admin-crud.store.spec.ts`
- Borrar: `apps/frontend/src/app/shared/ui/admin-paged-list.ts` (código muerto, se absorbe aquí)

**Interfaz que consumen las tareas 5-7 y 10-12:**

```ts
export type DialogMode = 'closed' | 'create' | 'edit';

export interface AdminCrudConfig<TRow extends { id: string }> {
  /** Path base del recurso admin, sin barra final. Ej: '/admin/models'. */
  apiPath: string;
  /** Etiqueta para los toasts. Ej: { singular: 'Modelo', article: 'el' }. */
  label: { singular: string; created: string; updated: string; deleted: string };
  /** Texto identificatorio de una fila, para toasts y confirmaciones. */
  rowName: (row: TRow) => string;
  /** Campos por los que filtra el buscador en cliente. Omitir = sin filtro local. */
  searchFields?: (row: TRow) => Array<string | number | null | undefined>;
  /** Traduce una sortKey a un valor comparable. */
  sortAccessor?: (row: TRow, key: string) => unknown;
  /** Query params extra en cada load (ej. versionId en mantenciones). */
  extraParams?: () => Record<string, string | number>;
  /** Proyecta la fila al shape que espera el diálogo (ej. dealerIds, equipment). */
  toDialogEntity?: (row: TRow) => Record<string, unknown>;
  /** Quita del payload los campos que no van al endpoint principal. */
  beforeSave?: (value: Record<string, unknown>, mode: DialogMode) => Record<string, unknown>;
  /** Efectos post-guardado con el id resultante (ej. sync de relaciones). */
  afterSave?: (ctx: { id: string; value: Record<string, unknown>; previous: TRow | null }) => Promise<void>;
  /** Paths de /options a invalidar en la caché tras guardar o borrar. */
  invalidates?: string[];
  /** Campos que se conservan al usar "Guardar y crear otro". */
  stickyFields?: string[];
  /** Se invoca con los errores de campo del backend (el componente los pasa al diálogo). */
  onValidationError?: (fields: BackendFieldError[]) => void;
}

export class AdminCrudStore<TRow extends { id: string }> {
  constructor(config: AdminCrudConfig<TRow>);

  // Estado (todo signals de solo lectura hacia afuera)
  readonly items: Signal<TRow[]>;
  readonly displayed: Signal<TRow[]>;      // filtro local + orden
  readonly pagination: Signal<PageMeta>;
  readonly search: Signal<string>;
  readonly loading: Signal<boolean>;
  readonly saving: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly sortKey: Signal<string | null>;
  readonly sortDir: Signal<SortDir>;
  readonly dialogMode: Signal<DialogMode>;
  readonly dialogEntity: Signal<Record<string, unknown> | null>;  // prefill; null = vacío
  readonly editingRow: Signal<TRow | null>;                       // null en create/duplicate

  load(): Promise<void>;
  retry(): void;
  openCreate(): void;
  openEdit(row: TRow): void;
  openDuplicate(row: TRow): void;    // prefill completo, dialogMode = 'create'
  closeDialog(): void;
  save(value: Record<string, unknown>): Promise<void>;
  saveAndNew(value: Record<string, unknown>): Promise<void>;
  confirmDelete(row: TRow): Promise<void>;
  onSearch(value: string): void;
  onPageChange(page: number): void;
  onPageSizeChange(pageSize: number): void;
  toggleSort(key: string): void;
}
```

Notas de implementación, todas trasladadas del código actual:

- Se construye en el inicializador de campo del componente (`private crud = new AdminCrudStore({…})`),
  que corre en contexto de inyección, así que `inject(ApiService)`, `inject(AdminFeedbackService)` y
  `inject(MatDialog)` funcionan dentro del constructor del store. No usar `providedIn: 'root'`:
  cada lista necesita su propia instancia.
- `load()` reemplaza los 8 `load()` privados: arma `{ page, pageSize, ...extraParams() }`, agrega
  `q` si `search().trim()` no está vacío, hace `api.get<PagedResponse<TRow[]>>(apiPath, params)`,
  vuelca `data`/`pagination`. **No** dispara ningún fetch de opciones (bug #5: hoy los 5 componentes
  piden `/brands`, `/models`, etc. y nadie los lee).
- `save()` distingue por `editingRow()`: `PATCH ${apiPath}/${row.id}` o `POST ${apiPath}`. El POST
  debe leer el id devuelto (`{ data: { id } }`) para pasárselo a `afterSave`.
- El manejo de error replica el actual: si `err instanceof ApiCallError && err.backend.code === 'VALIDATION' && err.backend.fields`, llama `onValidationError(fields)` y **no** setea `error`;
  si no, `error.set(msg)` + `feedback.error(msg)`.
- `confirmDelete` abre `ConfirmDialogComponent` con `disableClose: true` y `danger: true`, igual que
  hoy en los 8 componentes.
- `displayed` reusa `sortItems` de `features/admin/sort-utils.ts` (mover el import; el archivo se
  queda donde está).
- `openDuplicate(row)` aplica `toDialogEntity` y luego borra `id`, `createdAt`, `updatedAt`.
- `saveAndNew(value)` guarda como create y deja `dialogMode` en `'create'` con
  `dialogEntity` = solo las claves de `stickyFields` tomadas de `value`.
- Tras `save`/`confirmDelete` exitosos: `optionsCache.invalidate(path)` por cada `invalidates`.

- [ ] Tests que fallan (`admin-crud.store.spec.ts`, con `provideHttpClientTesting` como los specs actuales de admin):
      carga y pagina; `openDuplicate` deja `dialogMode='create'` y `editingRow()===null`;
      `save` en modo create hace POST y en edit hace PATCH; un 400 `VALIDATION` llama `onValidationError` sin setear `error`;
      `saveAndNew` conserva solo los `stickyFields`; `afterSave` recibe el id del POST
- [ ] Correr y ver fallar
- [ ] Implementar el store; borrar `admin-paged-list.ts`
- [ ] Correr y ver pasar
- [ ] Commit

### Tarea 5: Migrar las 5 listas simples

**Archivos (mismo patrón en los cinco):**
- `apps/frontend/src/app/features/admin/colors-admin.component.{ts,html,spec.ts}`
- …e idénticamente `equipment-admin`, `dealers-admin`, `fuel-prices-admin`, `brands-admin`

**Patrón de migración**, aplicado igual en cada componente:

1. Reemplazar los ~10 signals y los 7 métodos por un único campo
   `readonly crud = new AdminCrudStore<XRow>({ … })`, y `void this.crud.load()` en el constructor.
2. En el template, cambiar `items()`→`crud.items()`, `displayed()`→`crud.displayed()`,
   `loading()`→`crud.loading()`, `pagination()`→`crud.pagination()`, etc. La estructura HTML
   (tabla, `sort-header`, `app-search-input`, `app-pagination`) **no cambia**.
3. `onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields)` — el `viewChild`
   del diálogo se queda en el componente.
4. Borrar el fetch de opciones muerto donde exista (`brands` en `models-admin`, etc.).

Particularidades a preservar:
- **brands**: `toDialogEntity: (row) => ({ ...row, dealerIds: row.dealers?.map((d) => d.dealer.id) ?? [] })`
  y `beforeSave: (value, mode) => mode === 'create' ? omit(value, 'dealerIds') : value` — replica
  exacta de `brands-admin.component.ts:93` y `:102`.
- **equipment**: `invalidates: ['/admin/equipment/options', '/admin/equipment/categories']`.
- **colors**: `invalidates: ['/admin/colors/options']`.
- **dealers**: `invalidates: ['/admin/dealers/options']`.

- [ ] Por cada componente, en este orden: adaptar su `.spec.ts` a la nueva superficie (los specs actuales asertan `items()`/`pagination()`/`dialogEntity()`), correr y ver fallar, migrar, correr y ver pasar
- [ ] `npm -w apps/frontend run test` completo en verde
- [ ] `npm -w apps/frontend run check:design`
- [ ] Commit (uno por componente está bien)

### Tarea 6: Migrar `models-admin` y `versions-admin`

**Archivos:** `models-admin.component.{ts,html,spec.ts}`, `versions-admin.component.{ts,html,spec.ts}`

Mismo patrón de la T5, más:

- **models**: borrar `brands` signal y su fetch a `/brands` (no se usa en el template);
  `invalidates: ['/admin/models/options']`.
- **versions**: borrar `models` signal y su fetch a `/models?pageSize=50` (tampoco se usa);
  `invalidates: ['/admin/versions/options']`.
  `toDialogEntity` mantiene la proyección documentada en `versions-admin.component.ts:107-123`
  (`equipmentItems[].equipmentItem.id → equipment[]`, `colorItems[].color.id → colors[]`).
  `beforeSave` saca `equipment` y `colors` del payload.
  `afterSave` reemplaza el bucle N+1 de las líneas 155-166 por los endpoints de la T3:

```ts
afterSave: async ({ id, value }) => {
  await Promise.all([
    this.api.put(`/admin/equipment/version/${id}`, { itemIds: (value['equipment'] as string[]) ?? [] }),
    this.api.put(`/admin/colors/version/${id}`, { colorIds: (value['colors'] as string[]) ?? [] }),
  ]);
},
```

`ApiService` (`core/api.service.ts`) **no tiene `put`**: agregarlo siguiendo exactamente la forma de
`patch()` (líneas 56-62), con su par `putUnwrapped`.

Con esto `computeEquipmentDiff`/`computeColorDiff` (líneas 181-199) desaparecen: el diff vive en el
backend y ya no hace falta conservar `equipmentItems`/`colorItems` en la entidad del diálogo.

- [ ] Agregar `put`/`putUnwrapped` a `ApiService` + test en `api.service.spec.ts`
- [ ] Adaptar los specs (el de versions cubre hoy el diff; reemplazar por "emite un PUT por relación con la selección completa")
- [ ] Correr y ver fallar
- [ ] Migrar ambos componentes
- [ ] Correr y ver pasar
- [ ] Commit

### Tarea 7: Migrar `maintenance-admin` y arreglar el filtro

**Archivos:** `maintenance-admin.component.{ts,html,spec.ts}`

- El selector de versión pasa a consumir **`/admin/versions/options`** (T1) vía
  `AdminOptionsCacheService`; se elimina `/versions?pageSize=50` y con él el techo de 50 registros.
- `extraParams: () => this.selectedVersion() ? { versionId: this.selectedVersion() } : {}` —
  cierra el bug #1 junto con la T2.
- `beforeSave` inyecta el `versionId`: `{ ...value, versionId: editingRow()?.versionId ?? selectedVersion() }`,
  que es lo que hoy hace `onSave` en la línea 121-122.
- `onVersionChange` queda en: `selectedVersion.set(id); crud.onSearch(crud.search())` (resetea a
  página 1 y recarga).

- [ ] Test que falla: al elegir la versión `v2`, la request lleva `versionId=v2`
- [ ] Test que falla: el selector se alimenta de `/admin/versions/options` y muestra más de 50 opciones
- [ ] Correr y ver fallar
- [ ] Migrar
- [ ] Correr y ver pasar
- [ ] Commit

---

## Fase C — Velocidad percibida

### Tarea 8: Caché de opciones

**Archivos:**
- Crear: `apps/frontend/src/app/core/admin-options-cache.service.ts` + `.spec.ts`
- Modificar: `features/admin/fields/select-search.component.ts:89` (`loadRemote`)
- Modificar: `features/admin/fields/multi-select-field.component.ts:82` (`load`)

```ts
@Injectable({ providedIn: 'root' })
export class AdminOptionsCacheService {
  /** Devuelve la misma Promise para llamadas concurrentes al mismo path. */
  get<T = { id: string; [k: string]: unknown }>(path: string): Promise<T[]>;
  invalidate(path: string): void;
  clear(): void;
}
```

Memoiza la **Promise**, no el resultado: dos campos que piden el mismo path en el mismo tick
comparten un solo request. Si la promesa rechaza, se saca de la caché para que el próximo intento
reintente. Los componentes de campo pasan de `api.get(...)` a `cache.get(...)` sin más cambios; el
`AdminCrudStore` la invalida por `config.invalidates` tras cada save/delete, de modo que crear un
color y volver a abrir el diálogo de versión muestra el color nuevo.

- [ ] Tests que fallan: dos `get()` del mismo path emiten un solo HTTP; `invalidate` fuerza refetch; un error no queda cacheado
- [ ] Correr y ver fallar
- [ ] Implementar servicio y conectar los dos componentes de campo
- [ ] Correr y ver pasar (revisar los specs de `select-search`/`multi-select`, que hoy interceptan HTTP directo)
- [ ] Commit

### Tarea 9: El diálogo abre sin esperar la plantilla

**Archivos:** `admin-edit-dialog.component.ts:267-291` y `.html:35-37`

Hoy el `effect` que pide `/admin/seed/template/:key` setea `loading=true` y el template renderiza
`"Cargando plantilla…"` en vez del formulario, aunque el form es enteramente derivable de
`FIELD_METAS` (`entity-schemas.ts:168`). La plantilla solo aporta los "extras": claves presentes en
el backend que no están en `FIELD_METAS` (`fieldMetas()`, línea 148).

Cambio:
1. Pedir la plantilla a través de `AdminOptionsCacheService.get` (path
   `/admin/seed/template/${key}`) — a partir de la segunda apertura es instantánea.
2. Quitar el gate: el `@if (loading())` del HTML deja de envolver el formulario. Renderizar el form
   desde `FIELD_METAS` de inmediato; el effect que mergea `emptyTemplate` + `entity` (líneas 293-331)
   ya está preparado para correr después y agregar los controles faltantes.
3. `loading()` queda solo para deshabilitar el botón "Guardar" mientras la plantilla no llegó, y
   `loadError()` sigue mostrándose arriba.

- [ ] Test que falla: al crear el componente, el formulario (`[formGroup]`) está en el DOM **antes** de flushear la request de template
- [ ] Test que falla: abrir el diálogo dos veces para la misma entidad emite un solo GET de template
- [ ] Correr y ver fallar
- [ ] Implementar
- [ ] Correr y ver pasar; revisar `admin-edit-dialog.component.spec.ts` (853 líneas: varios tests flushean el template antes de asertar)
- [ ] Commit

---

## Fase D — Flujo de alta

### Tarea 10: "Guardar y crear otro"

**Archivos:**
- `admin-edit-dialog.component.{ts,html}` — nuevo `@Output() saveAndNew`
- `entity-schemas.ts` — nuevo flag `sticky?: boolean` en `FieldMeta`
- Los 8 componentes de lista: cablear `(saveAndNew)="crud.saveAndNew($event)"`

Botón **"Guardar y crear otro"** entre "Cancelar" y "Guardar" en `mat-card-actions`
(`admin-edit-dialog.component.html:119-133`), usando `mat-stroked-button` como "Cancelar" para no
competir con la acción primaria. Solo visible cuando el diálogo está en modo create.

Tras un `saveAndNew` exitoso el store deja el diálogo abierto con `dialogEntity` = solo los campos
sticky. El diálogo debe reaccionar al cambio de `entity()` reseteando el resto del form,
`markAsPristine()` y devolviendo el foco al primer campo (`autofocusDone` en la línea 217 debe
resetearse cuando cambia la identidad del prefill, si no el foco no vuelve).

Campos `sticky: true` a marcar en `FIELD_METAS`:
- `version`: `modelId`, `year`, `transmission`, `fuel`
- `model`: `brandId`, `segment`
- `maintenance`: `versionId`
- `equipment`: `category`
- `fuelPrice`: `unit`

`stickyFields` de cada `AdminCrudStore` se deriva de `FIELD_METAS[key].filter(m => m.sticky)`.

- [ ] Test que falla (diálogo): click en "Guardar y crear otro" emite `saveAndNew` y no `save`
- [ ] Test que falla (diálogo): al cambiar `entity` a un prefill parcial, los campos no-sticky quedan vacíos y el form `pristine`
- [ ] Test que falla (store): `saveAndNew` hace POST, deja `dialogMode()==='create'` y `dialogEntity()` solo con las claves sticky
- [ ] Correr y ver fallar
- [ ] Implementar
- [ ] Correr y ver pasar; `check:design`
- [ ] Commit

### Tarea 11: Duplicar fila + normalización de enums

**Archivos:**
- Los 8 `*-admin.component.html`: botón "Duplicar" en la columna de acciones
- `entity-schemas.ts`: exportar `toEnumToken`
- `fields/select-search.component.ts:134-150` (`pick`)

**Duplicar** — junto a "Editar"/"Eliminar" en `.action-buttons`, mismo `mat-stroked-button` con
`<mat-icon class="action-icon">content_copy</mat-icon>`, llamando `crud.openDuplicate(v)`. La lógica
ya está en el store (T4); acá solo es template.

**Enums** — `pick()` hace hoy `this.query().toUpperCase()`, que deja espacios y acentos y por lo
tanto viola `ENUM_REGEX` (`/^[A-Z0-9_]+$/`, `entity-schemas.ts:11`), produciendo un error de backend
evitable. Nueva función junto a la regex que documenta:

```ts
/** Convierte texto libre a un token de enum válido según ENUM_REGEX. */
export function toEnumToken(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    // Rango de diacríticos combinantes: copiar literalmente el de sectionId()
    // en admin-edit-dialog.component.ts:65 → .replace(/[̀-ͯ]/g, '')
    .replace(DIACRITICS_RE, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
```

En `pick`, la rama `item.isOther` pasa a `value = toEnumToken(this.query())`. Si el resultado es
vacío, no seleccionar nada y dejar el dropdown abierto.

- [ ] Test que falla: `toEnumToken('Súper Cargado 4x4 ')` → `'SUPER_CARGADO_4X4'`
- [ ] Test que falla (select-search): elegir "Otro: Súper Turbo" setea `SUPER_TURBO` en el control
- [ ] Test que falla (un componente de lista): "Duplicar" abre el diálogo en modo create con los datos de la fila y sin `id`
- [ ] Correr y ver fallar
- [ ] Implementar
- [ ] Correr y ver pasar; `check:design`
- [ ] Commit

### Tarea 12: Secciones opcionales colapsadas

**Archivos:** `admin-edit-dialog.component.{ts,html,css}`

`sections()` (línea 167) pasa a producir `Section & { collapsible: boolean }`. Regla **derivada, sin
metadata nueva**: una sección es colapsable si **todos** sus campos son opcionales
(`isFieldRequired(meta) === false`, `entity-schemas.ts:162`). En `version` eso captura exactamente
"Seguros y permisos", "Tanque y batería" y "Recalls"; "Identificación", "Motor" y "Dimensiones"
quedan siempre abiertas porque tienen campos requeridos.

Estado inicial en un `signal<Set<string>>` de secciones expandidas, calculado al abrir: una sección
colapsable arranca **cerrada**, salvo que la entidad cargada traiga algún valor no nulo/no vacío en
alguno de sus campos (así editar nunca esconde datos existentes).

El header (`h3.dialog-section-header`, línea 42) pasa a `<button type="button">` con
`[attr.aria-expanded]` y `[attr.aria-controls]`, un `mat-icon` `expand_more`/`expand_less`, y el
`div.dialog-section-grid` se renderiza con `@if`. Cuidado con dos cosas existentes:
- el `IntersectionObserver` de `ngAfterViewInit` (líneas 190-205) observa los `#sectionEl`; los
  `<section>` siguen en el DOM (solo se oculta la grilla), así que la nav lateral sigue funcionando;
- `onSubmit` (línea 429) hace `markAllAsTouched()` — si tras un submit inválido hay errores en una
  sección colapsada, expandirla automáticamente antes de retornar, o el usuario no ve por qué no
  guarda.

- [ ] Test que falla: en `version` create, "Recalls" arranca colapsada y "Motor" expandida
- [ ] Test que falla: al editar una versión con `mandatoryInsuranceClp` seteado, "Seguros y permisos" arranca expandida
- [ ] Test que falla: submit inválido con el campo culpable en una sección colapsada la expande
- [ ] Correr y ver fallar
- [ ] Implementar
- [ ] Correr y ver pasar; `check:design`
- [ ] Commit

---

## Fase E — Opcional y separable

### Tarea 13: Validadores derivados de Zod

> Separable: ver el supuesto declarado en Context. Se puede omitir sin tocar nada anterior.

**Archivos:**
- Crear: `apps/frontend/src/app/features/admin/zod-validators.ts` + `.spec.ts`
- Modificar: `admin-edit-dialog.component.ts:334-357` (`buildInitialControls`)

Hoy el form aplica solo `Validators.required` mientras `entity-schemas.ts` ya declara `min`, `max`,
`int`, `url` y `regex` para cada campo — pero solo se evalúan en la pestaña JSON (`loadJson`,
línea 405). Consecuencia: el operador descubre "el año debe estar entre 1990 y 2100" recién tras el
round-trip al backend.

```ts
/** Traduce los checks de un campo Zod a validadores de Angular. */
export function validatorsFor(schema: z.ZodTypeAny, field: string): ValidatorFn[];
```

Recorre `schema.shape[field]`, desenvuelve `ZodOptional`/`ZodNullable`/`ZodDefault` hasta el tipo
base y mapea: `min`/`max` de string → `minLength`/`maxLength`; `min`/`max` de number →
`Validators.min`/`max`; `regex` → `Validators.pattern`; `url` → un `urlValidator` propio.
`buildInitialControls` concatena estos validadores a los que ya arma, conservando la lógica de
`EXEMPT_KINDS` intacta. `errorMessage()` (línea 376) ya cubre `min`/`max`/`minlength`/`maxlength`/
`pattern`, así que los mensajes salen sin cambios.

Zod es `^3.25.76` en el frontend: los checks viven en `._def.checks`. Escribir los tests contra los
schemas reales del repo, no contra schemas sintéticos, para que una migración a Zod 4 rompa acá y no
en producción.

- [ ] Tests que fallan: `validatorsFor(versionSchema,'year')` rechaza 1980 y acepta 2026; `'name'` rechaza 1 carácter; `'recallUrl'` rechaza `'foo'`; un campo `.optional()` no agrega `required`
- [ ] Correr y ver fallar
- [ ] Implementar y conectar en `buildInitialControls`
- [ ] Correr y ver pasar; revisar `admin-edit-dialog.component.spec.ts` completo
- [ ] Commit

---

## Verificación end-to-end

**Automatizada** (todo debe pasar antes de dar por cerrado el plan):

```bash
npm -w apps/backend run test && npm -w apps/frontend run test && npm -w apps/frontend run check:design && npm -w apps/frontend run build
```

**Manual**, con `npm run dev` y sesión ADMIN, midiendo contra el comportamiento previo:

1. **Mantenciones** → elegir una versión: la tabla muestra solo las de esa versión (antes: todas).
   Con más de 50 versiones en la BD, la #51 aparece en el selector.
2. **Versiones** → editar una con equipamiento y colores, cambiar la selección, guardar: en la
   pestaña Network hay **un** PUT por relación (antes: un request por ítem, en serie).
3. **Versiones** → "+ Nueva": el formulario aparece de inmediato, con "Seguros y permisos",
   "Tanque y batería" y "Recalls" colapsadas. Llenar y usar **"Guardar y crear otro"**: el diálogo
   sigue abierto con modelo, año, transmisión y combustible conservados y el foco en "Nombre".
4. **Versiones** → "Duplicar" en una fila: diálogo precargado, guardar crea un registro nuevo sin
   tocar el original.
5. **Segunda apertura** de cualquier diálogo: en Network no hay GET repetido de
   `/admin/seed/template/…` ni de `/options`. Crear un color nuevo y reabrir el diálogo de versión:
   el color aparece (la invalidación funciona).
6. **Enums**: en Transmisión escribir "Doble embrague" y elegir "Otro": se guarda como
   `DOBLE_EMBRAGUE` sin error de validación.
7. **Listas**: en cualquier lista, la carga inicial ya no dispara el GET de opciones huérfano.

## Notas fuera de alcance

- El backend expone `POST /bulk-delete` y `GET /export` en brands, models, versions, equipment,
  colors, dealers y maintenance, y **el frontend no los usa**. Selección múltiple + exportar CSV es
  la siguiente mejora natural de carga masiva (y el CSV exportado sería el formato espejo de un
  futuro importador), pero el usuario acotó el alcance a refactor + quick wins.
- No se toca el schema Prisma ni se agregan dependencias, así que no hay migraciones ni cambios en
  `package.json`.

---

## Registro de ejecución (2026-07-27)

Tareas 1–12 implementadas. **Tarea 13 (validadores derivados de Zod) NO se hizo**: era
separable por el supuesto declarado en Context y el usuario no la eligió en la pregunta
específica del formulario.

### Desvíos respecto del plan

1. **Bug adicional encontrado al implementar la T4.** La rama
   `err instanceof ApiCallError` de los 8 componentes era **código muerto**:
   `ApiService.get/post/patch/delete` lanzan `HttpErrorResponse`, no `ApiCallError`, así que
   los errores por campo del backend nunca llegaban a `applyBackendErrors` y el usuario solo
   veía un toast genérico. Se agregó `toApiCallError()` en `core/api-error.ts` y el store lo
   usa. El plan decía "replicar el manejo actual"; replicar algo roto no servía.
2. **Regla de colapso corregida.** `!isFieldRequired(f)` capturaba también Equipamiento,
   Colores y Consumo, porque los `multiSelect` quedan exentos por un motivo técnico.
   La regla final es `f.optional === true && !f.showWhenFuels`, que da exactamente las tres
   secciones acordadas (Seguros y permisos, Tanque y batería, Recalls).
3. **`traction` estaba marcado como obligatorio** en `FIELD_METAS` mientras `versionSchema`
   lo declara `.nullable().optional()`. El formulario se negaba a guardar versiones que el
   backend sí aceptaba. Corregido a `optional: true`.
4. **`initialSort` agregado a `AdminCrudConfig`** (no estaba en el plan): fuel-prices ordena
   por `effectiveFrom desc` y maintenance por `mileageTag asc` por defecto.
5. **`resetTestDb` no limpiaba `color`/`versionColor`**, y `Color.name` es `@unique`: los
   specs nuevos de colors chocaban entre corridas. Agregado al helper.
6. **Duplicar en fuel-prices** reemplaza al botón Editar (que no existe: los precios son
   históricos de solo-agregar). Es justamente donde más ahorra tipeo.

### Estado de la verificación

- `npm -w apps/backend run test` → **264/264 en verde** (41 archivos).
- `npm -w apps/frontend run test` → 325/335. Los **10 fallos restantes ya estaban rojos en
  `main`** y viven en features no tocadas por este plan: `compare` (5),
  `annual-cost-card` (3), `account/forgot-password` y `account/reset-password` (1 c/u).
  Línea base medida en `main`: 19 fallos. De esos se arreglaron 6 (3 de
  `admin-edit-dialog`, 1 de `maintenance-admin`, 2 de `versions-admin`) más los 2 de
  `brands-admin` y el de `admin-dashboard`, todos por specs desactualizados.
- `npm -w apps/frontend run build`, `npm -w apps/backend run build` y
  `npm -w apps/frontend run check:design` → OK.
- **La verificación manual end-to-end no se corrió**: requiere iniciar sesión como ADMIN.
