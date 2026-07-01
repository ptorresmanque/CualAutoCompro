# Mejoras v2: Dedup de comparaciones, filtros+orden en catálogo, info icon, favoritos

**Fecha**: 2026-07-01
**Estado**: Aprobado para implementación
**Apps afectadas**: `apps/backend`, `apps/frontend`

## Objetivo

Cuatro mejoras independientes que comparten el dominio de catálogo/comparación/favoritos:

1. **Dedup de comparaciones guardadas**: no crear una nueva `Comparison` cuando ya existe una del mismo usuario con el mismo set de `versionIds` (orden indiferente).
2. **Catálogo con más filtros y orden**: exponer los filtros que el backend ya soporta (`brand`, `transmission`, `fuel`, `year`, `powerMin`, `consumptionMax`) más dos controles de orden (`sort` × `order`).
3. **Disclaimer → info icon**: mover el texto del disclaimer de la pantalla Comparar a un icono `info` con tooltip.
4. **Favoritos end-to-end**: marcar modelos como favoritos desde el catálogo, verlos en una pantalla propia `/favoritos`, y descubrirlos desde un carrusel en la pantalla Comparar.

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Definición de duplicado | Mismo set de `versionIds` (orden indiferente) | Coincidencia exacta por versiones; lo decide el usuario en preguntas clarificadoras. |
| Granularidad de favoritos | A nivel modelo | Coherente con cómo navega el usuario en catálogo. |
| Persistencia de favoritos | Backend Postgres (requiere auth) | Mismo patrón que `Comparison`. Toggle deshabilitado si no hay sesión. |
| Semántica de "rendimiento" | `min consumptionCityKmL` del modelo (más bajo = más eficiente) | Lo decide el usuario: en Chile, "rendimiento" = eficiencia de combustible. |
| Formato del info icon | Tooltip nativo (`title` attr) en hover/focus | Accesible, sin componente extra; expandible después. |
| Pantalla Favoritos | Grid reutilizando `VehicleCardComponent` con CTA "Comparar", "Comparar mis favoritos" global y "Quitar" inline | Lo decide el usuario en preguntas clarificadoras. |
| Carrusel en Comparar | Solo modelos favoritos que NO están ya en `compareStore` | Lo decide el usuario: combina opciones 1 + 3. |
| Alcance de filtros | Todos los que el backend ya soporta + `sort` + `order` | Lo decide el usuario. |
| Rango de años en filtro | 2024–2027 hardcoded en la UI | Cubre los años presentes en el seed actual. |

## Cambios fuera de alcance

- No se modifica el modelo `Version` ni los endpoints existentes `/compare`, `/comparisons/:slug` (solo `/me/comparisons` cambia su comportamiento de dedup).
- No se reescribe el componente de carrusel de imágenes del detalle de modelo (`model.component.ts`); se reutiliza su patrón CSS de scroll-snap.
- No se introduce SSR/hidratación especial; `FavoritesStore` carga al iniciar sesión en cliente.

---

## 1. Modelo de datos (Prisma)

### 1.1 Nueva tabla `Favorite`

```prisma
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  modelId   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  model     Model    @relation(fields: [modelId], references: [id], onDelete: Cascade)

  @@unique([userId, modelId])
  @@index([userId])
}
```

Agregar a `User.favorites: Favorite[]` y a `Model.favorites: Favorite[]`.

### 1.2 Cambios a `Comparison`

```prisma
model Comparison {
  id           String           @id @default(cuid())
  userId       String
  slug         String?          @unique
  name         String?
  versionsHash String           // sha1(sortedVersionIds.join(',')) — 40 chars hex
  createdAt    DateTime         @default(now())
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items        ComparisonItem[]

  @@unique([userId, versionsHash])
  @@index([userId])
}
```

`versionsHash` se calcula en `ComparisonsService.create()` antes del `prisma.comparison.create`.

### 1.3 Migración

Una sola migración Prisma que:
- Crea tabla `Favorite`.
- Agrega columna `versionsHash String NOT NULL DEFAULT ''` a `Comparison`.
- Backfill: para cada `Comparison` existente, calcular `versionsHash` a partir de sus `ComparisonItem.versionId` ordenados y guardar.
- Crea índice unique `[userId, versionsHash]`.

Backfill SQL aproximado:
```sql
UPDATE "Comparison" c
SET "versionsHash" = sub.hash
FROM (
  SELECT ci."comparisonId", encode(digest(string_agg(ci."versionId", ',' ORDER BY ci."versionId"), 'sha1'), 'hex') AS hash
  FROM "ComparisonItem" ci
  GROUP BY ci."comparisonId"
) sub
WHERE c.id = sub."comparisonId";
```

Si la migración no puede correr `pgcrypto`, fallback: script Node independiente pre-migración.

---

## 2. Backend

### 2.1 Módulo nuevo: `apps/backend/src/modules/favorites/`

Estructura (mismo patrón que `comparisons/`):

| Archivo | Contenido |
|---|---|
| `favorites.service.ts` | `FavoritesService` con `list(userId)`, `listModels(userId)`, `add(userId, modelId)`, `remove(userId, modelId)`. `add()` usa `upsert` para idempotencia. `listModels` retorna shape `VehicleCardInput[]`. |
| `favorites.controller.ts` | Handlers para los 4 endpoints; Zod schemas inline; `async-handler`; errores via `shared/errors`. |
| `favorites.routes.ts` | `Router` con `meFavoritesRouter.use(authenticate)` para `/me/favorites/*`. |
| `favorites.controller.spec.ts` | Vitest + supertest: 401 sin auth; POST idempotente; DELETE quita; GET /models devuelve modelo con versiones. |
| `favorites.service.spec.ts` | Vitest: `add` crea, `add` duplicado no crea, `remove` quita, `listModels` devuelve shape correcto. |

### 2.2 Endpoints nuevos

| Método | Path | Auth | Body | Respuesta |
|---|---|---|---|---|
| `GET` | `/api/v1/me/favorites` | sí | — | `200 { data: { modelIds: string[] } }` |
| `GET` | `/api/v1/me/favorites/models` | sí | — | `200 { data: VehicleCardInput[] }` (mismo shape que `/api/v1/models`) |
| `POST` | `/api/v1/me/favorites` | sí | `{ modelId: string }` | `200 { data: { modelId: string, created: boolean } }` |
| `DELETE` | `/api/v1/me/favorites/:modelId` | sí | — | `200 { data: { removed: true } }` |

`POST` valida que `modelId` exista en `prisma.model.findUnique`; si no, `404 NOT_FOUND`.

### 2.3 Modificación a `ComparisonsService.create()`

```ts
async create({ userId, versionIds, name }) {
  if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("...");
  const sorted = [...versionIds].sort();
  const versionsHash = crypto.createHash("sha1").update(sorted.join(",")).digest("hex");

  const existing = await this.prisma.comparison.findUnique({
    where: { userId_versionsHash: { userId, versionsHash } },
    select: { slug: true },
  });
  if (existing) throw conflict({ code: "COMPARISON_DUPLICATE", slug: existing.slug });

  // ... lógica existente de creación con slug retry ...
}
```

Nuevo helper `conflict(details)` en `shared/errors.ts` que mapea a `409 Conflict` con body `{ error: { code, message, ...details } }`.

### 2.4 Modificación a `ModelsService.list()`

Extender `listModelsQuerySchema`:

```ts
sort: z.enum(["name", "minPrice", "minConsumption"]).default("name"),
order: z.enum(["asc", "desc"]).default("asc"),
```

En `ModelsService.list()`:
- Mantener la query Prisma con `versions.some` y `orderBy: { name: 'asc' }` (como hasta ahora).
- Después del `findMany`, calcular `minPrice` y `minConsumption` por modelo (enriquece respuesta).
- Aplicar `.sort()` en memoria al array `enriched` por el criterio pedido:
  - `sort=name`: por `m.name` asc/desc.
  - `sort=minPrice`: por `m.minPrice ?? Infinity` asc/desc.
  - `sort=minConsumption`: por `m.minConsumption ?? Infinity` asc/desc.
- Mantener `page`/`pageSize`/total tal cual (la paginación se aplica antes del sort; trade-off aceptado para MVP).

### 2.5 Tests backend (Vitest + supertest)

- `favorites.controller.spec.ts`: 401 sin auth; `POST` idempotente (segunda llamada devuelve 200); `DELETE` quita; `GET /models` devuelve los modelos con sus versiones.
- `favorites.service.spec.ts`: add/remove/list/listModels.
- `comparisons.controller.spec.ts`: agregar test — segundo `POST` con mismos versionIds retorna 409 con slug existente.
- `models.controller.spec.ts`: tests de filtros (`brand`, `transmission`, `fuel`, `year`, `powerMin`, `consumptionMax`) y `sort` (`name`, `minPrice`, `minConsumption` × asc/desc).

---

## 3. Frontend — Catálogo (filtros + orden)

### 3.1 Cambios en `CatalogFilters`

```ts
export interface CatalogFilters {
  brand?: string;
  segment?: Segment;
  priceMin?: number;
  priceMax?: number;
  transmission?: 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'DCT';
  fuel?: 'BENCINA' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
  year?: number;
  powerMin?: number;
  consumptionMax?: number;
  sort?: 'name' | 'minPrice' | 'minConsumption';
  order?: 'asc' | 'desc';
}
```

### 3.2 UI — sidebar de filtros (`catalog.component.html`)

Orden dentro del sidebar:

1. **Segmento** (radios, sin cambios).
2. **Marca** (select — datos cargados de `GET /brands` en constructor; primer option "Cualquiera").
3. **Transmisión** (radios: Cualquiera / Manual / Automática / CVT / DCT).
4. **Combustible** (radios: Cualquiera / Bencina / Diésel / Híbrido / Eléctrico).
5. **Año** (select con años 2024–2027 + "Cualquiera"; hardcoded).
6. **Precio** (min/max, sin cambios).
7. **Potencia mínima (hp)** (number input, step 10).
8. **Consumo máximo ciudad (km/L)** (number input, step 0.5).

### 3.3 UI — controles de orden

Encima del grid, en línea con el subtítulo "Filtrá por marca...":
- Select "Ordenar por": Nombre / Precio / Rendimiento
- Toggle group icon-buttons: ↑ Asc / ↓ Desc (iconos `arrow_upward`/`arrow_downward`)

Texto del header del catálogo cambia: *"Filtrá por marca, segmento, transmisión, combustible y rango de precio."*

Mapeo de etiquetas:
- "Rendimiento" → `minConsumption`
- Tooltip en el select de orden: *"Rendimiento = menor consumo de combustible en ciudad (km/L)."*

### 3.4 Comportamiento

- Inputs `number` y `select` disparan `updateFilter()` con debounce de 250ms para text/number, inmediato para radios y selects.
- `clearFilters()` resetea también `sort='name'` y `order='asc'`.
- Estado de filtros se sincroniza a query params (`/catalogo?segment=SUV&sort=minPrice&order=desc`) en `ngOnInit` y al cambiar.
- `CatalogComponent` carga marcas una vez en constructor (`brands = signal<{id,name}[]>([])`).

### 3.5 Tests frontend

- `catalog.component.spec.ts` extender con: aplicar filtro `transmission=AUTOMATIC` → request con ese query param; cambiar `sort` a `minPrice`; cambiar `order` a `desc`.
- `vehicle-card.component.spec.ts` cubrirá el toggle de favoritos en Sección 5.

---

## 4. Frontend — Servicio de favoritos

### 4.1 `apps/frontend/src/app/core/favorites-store.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class FavoritesStore {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private _ids = signal<Set<string>>(new Set());
  readonly ids = computed(() => Array.from(this._ids()));
  readonly count = computed(() => this._ids().size);
  readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const u = this.auth.currentUser();
      if (u) this.load();
      else { this._ids.set(new Set()); this.loaded.set(false); }
    });
  }

  isFavorite(modelId: string): boolean { return this._ids().has(modelId); }

  async toggle(modelId: string): Promise<void> {
    if (!this.auth.currentUser()) throw new Error("UNAUTHORIZED");
    if (this._ids().has(modelId)) {
      await this.api.delete(`/me/favorites/${modelId}`);
      this._ids.update(s => { const n = new Set(s); n.delete(modelId); return n; });
    } else {
      await this.api.post(`/me/favorites`, { modelId });
      this._ids.update(s => { const n = new Set(s); n.add(modelId); return n; });
    }
  }

  async load(): Promise<void> {
    try {
      const res = await this.api.get<{ data: { modelIds: string[] } }>('/me/favorites');
      this._ids.set(new Set(res.data.modelIds));
    } finally {
      this.loaded.set(true);
    }
  }
}
```

### 4.2 Tests (`favorites-store.service.spec.ts`)

- `toggle` cuando no hay user lanza error.
- `toggle` cuando hay user llama POST y agrega al set.
- `toggle` cuando ya es favorito llama DELETE y remueve del set.
- `load()` hidrata el set.
- `effect` clear el set al deslogearse.

---

## 5. Frontend — `VehicleCardComponent` extendido

### 5.1 Nuevos inputs/outputs

```ts
readonly isFavorite = input<boolean>(false);
readonly showFavoriteToggle = input<boolean>(true);
readonly favoriteToggled = output<void>();
```

### 5.2 UI

- Botón corazón (`favorite` filled / `favorite_border` outline) en la esquina superior derecha del card, junto al featured pill.
- Si `isFavorite()` → filled en `text-error`.
- Si no hay sesión (`auth.currentUser() === null`) → disabled + tooltip "Inicia sesión para guardar favoritos".
- Click emite `favoriteToggled`. El componente padre cablea el handler con `FavoritesStore.toggle(model().id)`.

### 5.3 Tests (`vehicle-card.component.spec.ts`)

- Renderiza corazón filled cuando `[isFavorite]=true`.
- Renderiza corazón outline cuando `[isFavorite]=false`.
- Click emite `favoriteToggled`.
- Botón disabled cuando `auth.currentUser()` es null.

---

## 6. Frontend — Comparar (dedup + info icon + carrusel)

### 6.1 Dedup en `CompareComponent.saveComparison()`

- Capturar respuesta con status 409 y `error.code === 'COMPARISON_DUPLICATE'`.
- Mostrar inline (reemplaza el banner verde de "Ver enlace público"):
  > Ya tenés esta comparación guardada. [Ver enlace público](/compare?slug=xxx)
- Si el backend retorna `slug` en el error, navegar a `['/compare']` con `queryParams: { slug }`.

### 6.2 Info icon en el header de `compare.component.html`

Reemplazar el `<app-disclaimer>` en el bloque de tablas con:

```html
<div class="flex items-center gap-2">
  <h2 class="font-bold text-base">{{ s.label }}</h2>
  <span
    class="material-symbols-outlined text-ink-muted cursor-help"
    [attr.title]="disclaimerText"
    tabindex="0"
    aria-label="Información sobre el resaltado"
  >info</span>
</div>
```

`disclaimerText` es constante del componente:
```ts
readonly disclaimerText = "Las celdas resaltadas en ámbar indican diferencias relevantes entre las versiones seleccionadas.";
```

### 6.3 Carrusel de favoritos en Comparar

Nuevo bloque entre el grid de cards y las tablas collapsibles:

```html
@if (user() && favoriteModels().length > 0) {
  <section class="mb-8" data-testid="favorites-carousel">
    <h2 class="font-bold text-base mb-2">Tus favoritos · Agregá uno a la comparación</h2>
    <ul class="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2" role="list">
      @for (m of favoriteModels(); track m.id) {
        @if (!isModelInCompare(m)) {
          <li class="snap-start shrink-0 w-56 bg-surface border border-border rounded-xl p-3">
            <div class="aspect-video rounded-lg bg-cover bg-center mb-2" [style.background-image]="thumb(m)"></div>
            <p class="text-xs text-ink-muted">{{ m.brand.name }}</p>
            <h3 class="font-bold text-sm">{{ m.name }}</h3>
            <p class="text-xs text-brand-700 mt-1">$ {{ formatMinPrice(m) }}</p>
            <button
              type="button"
              class="mt-2 w-full text-xs font-bold bg-brand-600 text-white rounded-full py-1.5 hover:bg-brand-700"
              (click)="addModelToCompare(m)"
            >Agregar versión</button>
          </li>
        }
      }
    </ul>
  </section>
}
```

- `favoriteModels = signal<VehicleCardInput[]>([])` — cargado en `bootstrap()` si hay user: `await api.get('/me/favorites/models')`.
- `isModelInCompare(m)` chequea si `compareStore.ids()` contiene alguna versión del modelo `m.id`.
- `addModelToCompare(m)` abre popover de versiones (idéntico al `swap` existente): usuario elige una versión → `compareStore.setIds([...current, versionId])` + `reloadCompare()`.

### 6.4 Tests (`compare.component.spec.ts`)

Extender con:
- `saveComparison()` cuando backend retorna 409 → muestra mensaje "Ya guardada" + link con el slug recibido en el error.
- Carrusel muestra favoritos cuando user logueado y `GET /me/favorites/models` devuelve modelos.
- Carrusel oculta los modelos cuya versión ya está en `compareStore`.
- Si no hay sesión, el bloque del carrusel no se renderiza.

---

## 7. Frontend — Pantalla Favoritos

### 7.1 Ruta

`apps/frontend/src/app/app.routes.ts`:

```ts
{
  path: 'favoritos',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/favorites/favorites.component').then(m => m.FavoritesComponent),
},
```

### 7.2 `FavoritesComponent`

- Selector: `app-favorites`.
- ChangeDetection: `OnPush`.
- Carga inicial: `GET /me/favorites/models`.
- Renderiza header + grid de `VehicleCardComponent` (reutilizado).
- Estado vacío: mensaje + CTA "Ir al catálogo".
- CTA global "Comparar mis favoritos (N)": toma los primeros 3 modelos del array (orden del backend = `createdAt desc`, más recientes primero).

### 7.3 Acciones por card

- Reutiliza `VehicleCardComponent` con `[isFavorite]="true"`.
- Botón "Comparar" en cada card → toma `m.defaultVersion.id` y llama `compareStore.setIds([..., versionId])` + navega a `/compare`. Si ya hay 3 en store → muestra mensaje "Máximo 3, limpiá la comparación actual primero".
- Botón "Ver detalle" como link normal al detail route.

### 7.4 Tests (`favorites.component.spec.ts`)

- Carga inicial → GET /me/favorites/models.
- Click "Comparar" → `compareStore.ids()` contiene `defaultVersion.id` + navegación a `/compare`.
- Click "Comparar mis favoritos (N)" → store contiene hasta 3 ids.
- Empty state cuando `[]`.

### 7.5 Navegación

Agregar a `TopNavBarComponent.navLinks`:

```ts
{ path: '/favoritos', label: 'Favoritos', icon: 'favorite' },
```

Insertar entre `Catálogo` y `Comparar`. Solo visible si hay user (igual que "Mis comparaciones").

---

## 8. Archivos a crear / modificar

### Backend (nuevo)
- `apps/backend/prisma/migrations/<timestamp>_favorites_and_versions_hash/migration.sql`
- `apps/backend/src/modules/favorites/favorites.service.ts`
- `apps/backend/src/modules/favorites/favorites.controller.ts`
- `apps/backend/src/modules/favorites/favorites.routes.ts`
- `apps/backend/src/modules/favorites/favorites.service.spec.ts`
- `apps/backend/src/modules/favorites/favorites.controller.spec.ts`

### Backend (modificado)
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/modules/comparisons/comparisons.service.ts`
- `apps/backend/src/modules/comparisons/comparisons.controller.spec.ts`
- `apps/backend/src/modules/models/models.dto.ts`
- `apps/backend/src/modules/models/models.service.ts`
- `apps/backend/src/shared/errors.ts`

### Frontend (nuevo)
- `apps/frontend/src/app/core/favorites-store.service.ts`
- `apps/frontend/src/app/core/favorites-store.service.spec.ts`
- `apps/frontend/src/app/features/favorites/favorites.component.ts`
- `apps/frontend/src/app/features/favorites/favorites.component.html`
- `apps/frontend/src/app/features/favorites/favorites.component.css`
- `apps/frontend/src/app/features/favorites/favorites.component.spec.ts`

### Frontend (modificado)
- `apps/frontend/src/app/app.routes.ts`
- `apps/frontend/src/app/layout/top-nav-bar.component.ts`
- `apps/frontend/src/app/features/catalog/catalog.component.ts`
- `apps/frontend/src/app/features/catalog/catalog.component.html`
- `apps/frontend/src/app/features/catalog/catalog.component.spec.ts`
- `apps/frontend/src/app/features/landing/landing.component.html`
- `apps/frontend/src/app/shared/ui/vehicle-card.component.ts`
- `apps/frontend/src/app/shared/ui/vehicle-card.component.html`
- `apps/frontend/src/app/shared/ui/vehicle-card.component.spec.ts`
- `apps/frontend/src/app/features/compare/compare.component.ts`
- `apps/frontend/src/app/features/compare/compare.component.html`
- `apps/frontend/src/app/features/compare/compare.component.spec.ts`

---

## 9. Testing strategy

| Capa | Framework | Cobertura mínima |
|---|---|---|
| Backend service | Vitest + Prisma real (test DB) | `FavoritesService`, `ComparisonsService.create` dedup |
| Backend HTTP | Vitest + supertest + Prisma real | 4 endpoints favoritos + comparaciones 409 + modelos sort/order |
| Frontend service | Vitest + HttpClientTesting | `FavoritesStore` |
| Frontend component | Vitest + HttpClientTesting | `VehicleCardComponent` (favorito), `CatalogComponent` (filtros+orden), `CompareComponent` (dedup, info, carrusel), `FavoritesComponent` (full) |
| E2E | (existente, no en alcance) | Se aprovecha el flujo manual en navegador |

---

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backfill de `versionsHash` falla en producción con muchos datos | Script de backfill idempotente que se ejecuta antes del deploy + validación post-migración. |
| Doble click en "Guardar comparación" crea duplicados por race | La unique constraint en DB es la red de seguridad; el pre-check devuelve 409 con el slug existente. |
| Migración Prisma no soporta `pgcrypto` para `digest()` | Fallback: script Node independiente que itera sobre `Comparison` existentes y setea `versionsHash` antes de aplicar el `ALTER TABLE ... SET NOT NULL`. |
| `FavoritesStore.effect` se dispara antes de que `auth` esté listo | El effect depende solo de `currentUser`; si arranca sin sesión simplemente queda con set vacío. |
| Ordenar por campo computado en memoria rompe paginación | Documentado en Sección 2.4; se acepta como trade-off para MVP. |
| Auth interceptor envía 401 en `POST /me/favorites` cuando hay sesión expirada | Ya manejado por `auth.interceptor.ts` (refresh o redirect a login). |

---

## 11. Criterios de aceptación (resumen)

- [ ] Backend: `POST /api/v1/me/favorites` es idempotente y devuelve `200` la 2ª vez sin crear duplicado.
- [ ] Backend: `POST /api/v1/me/comparisons` con `versionIds` ya guardados retorna `409 { code: 'COMPARISON_DUPLICATE', slug }`.
- [ ] Backend: `GET /api/v1/models?sort=minPrice&order=desc` ordena correctamente.
- [ ] Frontend: el catálogo expone 6 filtros nuevos + 2 controles de orden y sincroniza a query params.
- [ ] Frontend: el disclaimer de Comparar se reemplazó por un icono `info` con tooltip accesible.
- [ ] Frontend: existe `/favoritos`, gated por auth, con grid + CTAs.
- [ ] Frontend: el corazón en `VehicleCardComponent` funciona logueado, está disabled sin sesión.
- [ ] Frontend: el carrusel de favoritos aparece en Comparar, oculto para anónimos y para los modelos ya en comparar.
- [ ] Todos los tests pasan (`npm test` y `npm run test:e2e`).