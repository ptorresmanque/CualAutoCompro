# Admin del catálogo: CRUD + JSON para autos

**Fecha:** 2026-07-01
**Estado:** Aprobado para implementación
**Apps afectadas:** `apps/backend`, `apps/frontend`

## Objetivo

Habilitar a usuarios con rol **administrador** a poblar y mantener el catálogo completo de autos de la plataforma (Brand, Model, Version, EquipmentItem, MaintenanceCost) desde una interfaz web. La creación admite dos modalidades equivalentes en la misma pantalla: formulario campo-por-campo y JSON pegado en un textarea. Las modificaciones y eliminaciones usan la misma UI. Los usuarios sin rol admin no pueden acceder al área ni a sus endpoints.

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Alcance de entidades | Catálogo completo: Brand, Model, Version, EquipmentItem, MaintenanceCost | Decidido por el usuario en preguntas clarificadoras. |
| Modelo de rol | `User.role: 'USER' \| 'ADMIN' @default(USER)`, JWT incluye role | Decidido por el usuario. Persiste en DB, no en .env. |
| Promoción de admins | Primer admin por seed; los siguientes por endpoint admin (`POST /admin/users/:id/promote`) | Decidido por el usuario. Auto-servicio vía UI. |
| Operaciones | Listar, crear, editar y eliminar (CRUD) | Decidido por el usuario. |
| Modalidad JSON | Textarea con botón "Cargar", 1 entidad por request | Decidido por el usuario. |
| Convivencia Form/JSON | Tabs en la misma pantalla | Decidido por el usuario. |
| Estructura de navegación | `/admin/*` con sub-rutas por entidad, lazy-loaded, guard admin | Decidido por el usuario. |
| Tipo de borrado | Soft delete con `deletedAt: DateTime?` | Decidido por el usuario. |
| Arquitectura | Un módulo backend por entidad + nuevo módulo `admin/` para cross-entity; un componente frontend por entidad + `AdminEditDialogComponent` compartido | Approach A recomendado y aprobado. |
| Reglas de borrado en cascada | `Brand` con `Model`s activos bloqueado; `Model` con `Version`s activas bloqueado; `Version` borra cascade sus `MaintenanceCost` y `VersionEquipment` (cascade real) | Soft delete en padres, hard en joins/hijos sin valor propio. |
| Formato del JSON de ejemplo vacío | Endpoint `GET /admin/seed/template/:entity` devuelve el shape con valores neutros | Backend es la fuente de verdad del shape. |

## Cambios fuera de alcance

- No se introducen endpoints públicos nuevos; todos los CRUD nuevos viven bajo `/admin/*` o requieren rol admin.
- No se modifica el sistema de comparaciones, favoritos ni el flujo de auth de usuarios normales.
- No se agrega UI para cambiar la contraseña del admin (queda vía Prisma Studio).
- No se agrega auditoría de cambios (log de quién modificó qué).
- No se agrega import masivo (N entidades en un solo request); el JSON representa 1 entidad.

---

## 1. Modelo de datos (Prisma)

### 1.1 Migración 1 — `add_user_role`

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  passwordHash String
  name         String
  role         UserRole     @default(USER)
  createdAt    DateTime     @default(now())
  comparisons  Comparison[]
  favorites    Favorite[]
}
```

### 1.2 Migración 2 — `add_deleted_at`

Agregar columna nullable + índice a las 5 entidades. Migración raw SQL para usar `CREATE INDEX CONCURRENTLY` (no bloquea escrituras):

```prisma
model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  logoUrl   String?
  models    Model[]
  deletedAt DateTime? @index
  createdAt DateTime  @default(now())
}

model Model {
  id          String    @id @default(cuid())
  brandId     String
  name        String
  segment     Segment
  imageUrl    String?
  galleryUrls String[]  @default([])
  brand       Brand     @relation(fields: [brandId], references: [id], onDelete: Cascade)
  versions    Version[]
  favorites   Favorite[]
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  @@unique([brandId, name])
  @@index([segment])
  @@index([deletedAt])
}

model Version {
  id                    String             @id @default(cuid())
  modelId               String
  name                  String
  year                  Int
  priceClp              Int
  transmission          Transmission
  fuel                  Fuel
  engineDisplacementCc  Int
  powerHp               Int
  torqueNm              Int
  consumptionCityKmL    Float
  consumptionHighwayKmL Float
  lengthMm              Int
  widthMm               Int
  heightMm              Int
  weightKg              Int
  trunkLiters           Int
  airbagCount           Int
  hasAbs                Boolean
  hasEsp                Boolean
  hasCruiseControl      Boolean
  model                 Model              @relation(fields: [modelId], references: [id], onDelete: Cascade)
  equipmentItems        VersionEquipment[]
  maintenanceCosts      MaintenanceCost[]
  comparisonItems       ComparisonItem[]
  favorites             Favorite[]
  deletedAt             DateTime?
  createdAt             DateTime           @default(now())
  @@index([modelId])
  @@index([priceClp])
  @@index([year])
  @@index([deletedAt])
}

model EquipmentItem {
  id       String             @id @default(cuid())
  name     String             @unique
  category String
  versions VersionEquipment[]
  deletedAt DateTime?
}

model MaintenanceCost {
  id         String   @id @default(cuid())
  versionId  String
  mileageTag Int
  costClp    Int
  version    Version  @relation(fields: [versionId], references: [id], onDelete: Cascade)
  deletedAt  DateTime?
  @@unique([versionId, mileageTag])
  @@index([versionId])
  @@index([deletedAt])
}
```

### 1.3 Reglas de borrado (lógicas, en services)

- `DELETE Brand` → bloqueado si `prisma.model.count({ where: { brandId, deletedAt: null } }) > 0`. Error `BRAND_HAS_MODELS`.
- `DELETE Model` → bloqueado si `prisma.version.count({ where: { modelId, deletedAt: null } }) > 0`. Error `MODEL_HAS_VERSIONS`.
- `DELETE Version` → soft delete OK; cascade real (FK `onDelete: Cascade`) borra `MaintenanceCost` y `VersionEquipment` asociadas.
- `DELETE EquipmentItem` → soft delete OK; cascade real borra `VersionEquipment` asociadas.
- `DELETE MaintenanceCost` → soft delete siempre permitido.

### 1.4 Seed del primer admin

```ts
await prisma.user.upsert({
  where: { email: env.ADMIN_EMAIL },
  update: { role: "ADMIN" },
  create: {
    email: env.ADMIN_EMAIL,
    passwordHash: await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 10),
    name: "Admin",
    role: "ADMIN",
  },
});
```

Variables nuevas en `.env` (con defaults en código por si faltan):

```
ADMIN_EMAIL=admin@cualautocompro.cl
ADMIN_INITIAL_PASSWORD=admin1234
```

`env.ts` las lee con `process.env.X ?? "default"` y las exporta.

---

## 2. Backend

### 2.1 Auth y autorización

#### 2.1.1 `apps/backend/src/infra/jwt.ts` — payload extendido

```ts
export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};
```

#### 2.1.2 `apps/backend/src/modules/auth/auth.middleware.ts` — propaga role

```ts
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string; role: "USER" | "ADMIN" };
    }
  }
}
// populate req.user.role desde JWT en authenticate()
```

#### 2.1.3 Nuevo `apps/backend/src/modules/auth/role.middleware.ts`

```ts
export const requireRole = (role: "USER" | "ADMIN") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden(`Requiere rol ${role}`));
    next();
  };
```

#### 2.1.4 `shared/errors.ts` — nuevos helpers

```ts
export type ErrorCode = "VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFLICT" | "BAD_REQUEST" | "BRAND_HAS_MODELS" | "MODEL_HAS_VERSIONS";
const STATUS = { /* ... */ FORBIDDEN: 403, BRAND_HAS_MODELS: 409, MODEL_HAS_VERSIONS: 409 };
export const forbidden = (msg: string) => new AppError("FORBIDDEN", msg);
```

### 2.2 Módulos existentes — CRUD admin

Cada módulo agrega 4 endpoints protegidos con `requireRole('ADMIN')` después del middleware de auth. Estructura final:

| Módulo | Rutas admin nuevas | Servicios nuevos |
|---|---|---|
| `brands` | `POST /`, `PATCH /:id`, `DELETE /:id` | `BrandsService.create/update/softDelete` |
| `models` | `POST /`, `PATCH /:id`, `DELETE /:id` | `ModelsService.create/update/softDelete` |
| `versions` | `POST /`, `PATCH /:id`, `DELETE /:id` | `VersionsService.create/update/softDelete` |
| `equipment` | `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /version/:versionId/item/:itemId`, `DELETE /version/:versionId/item/:itemId` | `EquipmentService.create/update/softDelete/attach/detach` |
| `maintenance` | `POST /`, `PATCH /:id`, `DELETE /:id` | `MaintenanceService.create/update/softDelete` |

#### Ejemplo de routes para brands:

```ts
// apps/backend/src/modules/brands/brands.routes.ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { brandsController } from "./brands.controller.js";

export const brandsRouter = Router();
brandsRouter.get("/", brandsController.list);
brandsRouter.get("/:id/models", brandsController.models);

const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));
adminRouter.post("/", brandsController.create);
adminRouter.patch("/:id", brandsController.update);
adminRouter.delete("/:id", brandsController.softDelete);

export { adminRouter as brandsAdminRouter };
```

`app.ts` registra `brandsAdminRouter` bajo `/api/v1/admin/brands`. Patrón análogo para models/versions/equipment/maintenance.

### 2.3 DTOs (Zod) — un archivo `<entity>.dto.admin.ts` por módulo

#### `brands.dto.admin.ts`

```ts
import { z } from "zod";
export const createBrandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: z.string().url().nullable().optional(),
});
export const updateBrandSchema = createBrandSchema.partial();
```

#### `models.dto.admin.ts`

```ts
const SEGMENTS = ["SEDAN","SUV","HATCHBACK","PICKUP","CROSSOVER","COMMERCIAL"] as const;
export const createModelSchema = z.object({
  brandId: z.string().cuid(),
  name: z.string().min(2).max(80),
  segment: z.enum(SEGMENTS),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});
export const updateModelSchema = createModelSchema.partial();
```

#### `versions.dto.admin.ts`

```ts
const TRANSMISSIONS = ["MANUAL","AUTOMATIC","CVT","DCT"] as const;
const FUELS = ["BENCINA","DIESEL","HYBRID","ELECTRIC"] as const;
export const createVersionSchema = z.object({
  modelId: z.string().cuid(),
  name: z.string().min(2).max(80),
  year: z.number().int().min(1990).max(2100),
  priceClp: z.number().int().nonnegative(),
  transmission: z.enum(TRANSMISSIONS),
  fuel: z.enum(FUELS),
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
export const updateVersionSchema = createVersionSchema.partial();
```

#### `equipment.dto.admin.ts` y `maintenance.dto.admin.ts`

```ts
export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
});
export const updateEquipmentSchema = createEquipmentSchema.partial();

export const attachEquipmentSchema = z.object({
  versionId: z.string().cuid(),
  itemId: z.string().cuid(),
});

export const createMaintenanceSchema = z.object({
  versionId: z.string().cuid(),
  mileageTag: z.number().int().min(0).max(500_000),
  costClp: z.number().int().nonnegative(),
});
export const updateMaintenanceSchema = createMaintenanceSchema.partial().omit({ versionId: true });
```

### 2.4 Servicios — patrón uniforme

```ts
// apps/backend/src/modules/brands/brands.service.ts
export class BrandsService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.brand.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  models(brandId: string) {
    return this.prisma.model.findMany({
      where: { brandId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async create(input: z.infer<typeof createBrandSchema>) {
    return this.prisma.brand.create({ data: input });
  }

  async update(id: string, input: z.infer<typeof updateBrandSchema>) {
    try {
      return await this.prisma.brand.update({ where: { id }, data: input });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Marca no encontrada");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const modelsCount = await this.prisma.model.count({
      where: { brandId: id, deletedAt: null },
    });
    if (modelsCount > 0) {
      throw conflict("No se puede eliminar: tiene modelos asociados", {
        code: "BRAND_HAS_MODELS",
        modelCount: modelsCount,
      });
    }
    await this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }
}
```

Patrón análogo para `ModelsService`, `VersionsService`, `EquipmentService`, `MaintenanceService`.

### 2.5 Actualización de queries públicas

Todas las queries existentes de los 5 módulos deben filtrar `deletedAt: null` cuando corresponda:

- `ModelsService.list()`: agrega `deletedAt: null` al `where` de `Model` y al subquery de `versions.some`.
- `ModelsService.detail()`: agrega `deletedAt: null`.
- `BrandsService.list()`, `models()`: ya cubierto arriba.
- `VersionsService.detail()`: agrega `deletedAt: null`.
- `CompareService`: filtra versions por `deletedAt: null` antes de devolver la comparación.
- `ComparisonsService.getBySlug` / `listByUser`: filtrar en `include` que las versiones no estén borradas.
- `FavoritesService.listModels`: filtra `model.deletedAt: null`.

### 2.6 Nuevo módulo `apps/backend/src/modules/admin/`

#### `users.controller.ts` + `users.service.ts`

```ts
// Endpoints:
// GET    /api/v1/admin/users                    → lista (id, email, name, role, createdAt)
// POST   /api/v1/admin/users/:id/promote        → role = ADMIN
// POST   /api/v1/admin/users/:id/demote         → role = USER (no permite si es a sí mismo)
```

#### `seed.controller.ts`

```ts
// GET /api/v1/admin/seed/template/brand       → { name: "", logoUrl: null }
// GET /api/v1/admin/seed/template/model       → { brandId: "", name: "", segment: "SEDAN", imageUrl: null, galleryUrls: [] }
// GET /api/v1/admin/seed/template/version     → { ... todos los campos numéricos en 0, enums en primer valor, modelId: "" }
// GET /api/v1/admin/seed/template/equipment    → { name: "", category: "" }
// GET /api/v1/admin/seed/template/maintenance → { versionId: "", mileageTag: 0, costClp: 0 }
```

Los templates se construyen en runtime desde los schemas Zod (`Object.fromEntries(Object.keys(shape).map(k => [k, defaultValue(shape[k])]))`).

#### `routes.ts`

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { adminUsersController } from "./users.controller.js";
import { seedController } from "./seed.controller.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole("ADMIN"));
adminRouter.get("/users", adminUsersController.list);
adminRouter.post("/users/:id/promote", adminUsersController.promote);
adminRouter.post("/users/:id/demote", adminUsersController.demote);
adminRouter.get("/seed/template/:entity", seedController.template);
```

`app.ts` registra `adminRouter` bajo `/api/v1/admin`. Adicionalmente registra los 5 sub-routers admin (uno por entidad) bajo `/api/v1/admin/<entity>`.

### 2.7 Tests backend (Vitest + supertest)

| Test | Cubre |
|---|---|
| `role.middleware.spec.ts` (nuevo) | Sin token → 401; USER → 403; ADMIN → next |
| `brands.controller.spec.ts` (extender) | POST/PATCH/DELETE admin con rol ADMIN; con rol USER → 403; DELETE bloqueado con `BRAND_HAS_MODELS` |
| `models.controller.spec.ts` (extender) | CRUD admin + bloqueos; `list` filtra `deletedAt: null` |
| `versions.controller.spec.ts` (extender) | CRUD admin + cascade a `MaintenanceCost`/`VersionEquipment` en DELETE |
| `equipment.controller.spec.ts` (extender) | CRUD admin + endpoints attach/detach |
| `maintenance.controller.spec.ts` (extender) | CRUD admin |
| `admin/users.controller.spec.ts` (nuevo) | Listar, promote, demote; demote de sí mismo → 400 `CANNOT_DEMOTE_SELF` |
| `admin/seed.controller.spec.ts` (nuevo) | Cada `/template/:entity` devuelve el shape con defaults |

---

## 3. Frontend

### 3.1 `AuthService` extendido

```ts
// apps/frontend/src/app/core/auth.service.ts
export type User = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};
```

El endpoint `GET /auth/me` ya devuelve el payload del JWT; ampliar el response para incluir `role` (cambio en `auth.controller.ts:me`).

### 3.2 `adminGuard`

```ts
// apps/frontend/src/app/core/admin.guard.ts
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.currentUser()) await auth.bootstrap();
  const u = auth.currentUser();
  if (!u) return router.createUrlTree(["/login"]);
  if (u.role !== "ADMIN") return router.createUrlTree(["/"]);
  return true;
};
```

### 3.3 Rutas

```ts
// apps/frontend/src/app/app.routes.ts (extender children del shell)
{
  path: "admin",
  canActivate: [adminGuard],
  loadComponent: () => import("./features/admin/admin-shell.component").then(m => m.AdminShellComponent),
  children: [
    { path: "", loadComponent: () => import("./features/admin/admin-dashboard.component").then(m => m.AdminDashboardComponent) },
    { path: "brands",      loadComponent: () => import("./features/admin/brands-admin.component").then(m => m.BrandsAdminComponent) },
    { path: "models",      loadComponent: () => import("./features/admin/models-admin.component").then(m => m.ModelsAdminComponent) },
    { path: "versions",    loadComponent: () => import("./features/admin/versions-admin.component").then(m => m.VersionsAdminComponent) },
    { path: "equipment",   loadComponent: () => import("./features/admin/equipment-admin.component").then(m => m.EquipmentAdminComponent) },
    { path: "maintenance", loadComponent: () => import("./features/admin/maintenance-admin.component").then(m => m.MaintenanceAdminComponent) },
  ],
}
```

### 3.4 `AdminShellComponent`

Layout simple con sub-nav horizontal (links a las 5 entidades + Dashboard) + `<router-outlet>`. Sin auth propio (heredado del guard del padre).

### 3.5 `AdminDashboardComponent`

Grid de 5 cards (Brand, Model, Version, Equipment, Maintenance) que enlazan a las sub-rutas. Cada card muestra un conteo (ej: "23 marcas activas", "67 modelos", "132 versiones") cargado en `ngOnInit` desde `GET /brands`, `GET /models?pageSize=1`, etc.

### 3.6 Componentes `<entity>-admin.component`

Cada uno combina **lista + dialog de edición en la misma pantalla**:

```ts
@Component({
  selector: 'app-brands-admin',
  template: `
    <header class="flex items-center justify-between mb-4">
      <h1>Marcas</h1>
      <button (click)="openCreate()">+ Nueva</button>
    </header>
    <input [value]="search()" (input)="onSearch($event)" placeholder="Buscar..." />
    <table>
      <thead>...</thead>
      <tbody>
        @for (b of items(); track b.id) {
          <tr>
            <td>{{ b.name }}</td>
            <td>
              <button (click)="openEdit(b)">Editar</button>
              <button (click)="confirmDelete(b)">Eliminar</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
    @if (dialogEntity(); as e) {
      <app-admin-edit-dialog
        [entityConfig]="entityConfig"
        [entity]="e"
        (save)="onSave($event)"
        (cancel)="dialogEntity.set(null)"
      />
    }
  `
})
```

#### `EntityConfig<T>` (compartido)

```ts
export interface EntityConfig<T> {
  name: string;             // "Brand", "Model", ...
  apiPath: string;          // "brands", "models", ...
  schema: ZodSchema<T>;     // validación cliente
  columns: { key: keyof T; label: string }[];
  formFields: FormField[];  // definición declarativa de campos
  emptyTemplate: T;         // JSON inicial del tab JSON
}
```

`AdminEditDialogComponent` recibe este config y renderiza tabs Form/JSON usando el schema y los `formFields`.

### 3.7 `AdminEditDialogComponent` (compartido)

- Header con tabs `[Formulario] [JSON]`.
- Tab Form: `ReactiveForm` construido desde `formFields` (text/number/select/boolean/array).
- Tab JSON: textarea con `emptyTemplate` prellenado + botón **Cargar**.
  - Al click "Cargar": `schema.safeParse(text)`. Si OK, popula el form. Si falla, muestra errores inline debajo del textarea.
- Footer: `[Cancelar]` cierra, `[Guardar]` emite `save` con el entity final.

### 3.8 Schemas Zod compartidos cliente/servidor

Crear `apps/frontend/src/app/features/admin/entity-schemas.ts` con los mismos Zod schemas del backend (re-export). Esto garantiza roundtrip.

### 3.9 TopNavBar

```ts
// top-nav-bar.component.ts (modificado)
readonly navLinks = computed<NavLink[]>(() => {
  const u = this.user();
  const base: NavLink[] = [
    { path: '/', label: 'Inicio', icon: 'home', exact: true },
    { path: '/catalogo', label: 'Catálogo', icon: 'directions_car' },
  ];
  if (u?.role === 'ADMIN') {
    base.push({ path: '/admin', label: 'Admin', icon: 'admin_panel_settings' });
  }
  if (u) {
    base.push({ path: '/favoritos', label: 'Favoritos', icon: 'favorite' });
    base.push({ path: '/compare', label: 'Comparar', icon: 'compare_arrows' });
    base.push({ path: '/account/comparisons', label: 'Mis comparaciones', icon: 'bookmarks' });
  }
  return base;
});
```

### 3.10 Tests frontend (Vitest)

| Test | Cubre |
|---|---|
| `admin.guard.spec.ts` (nuevo) | Bloquea anónimo (redirect /login), USER (redirect /), permite ADMIN |
| `auth.service.spec.ts` (extender) | `currentUser` incluye `role` |
| `top-nav-bar.component.spec.ts` (extender) | Link "Admin" visible si role=ADMIN, oculto si USER |
| `brands-admin.component.spec.ts` (nuevo, base) | Carga lista, "+ Nuevo" abre dialog, submit → POST, error → banner |
| `models-admin.component.spec.ts` (nuevo) | Selector de brand carga `/brands`; submit incluye `brandId` |
| `versions-admin.component.spec.ts` (nuevo) | Form 18+ campos valida; tab JSON carga `/admin/seed/template/version` |
| `equipment-admin.component.spec.ts` (nuevo) | CRUD + endpoints de attach/detach |
| `maintenance-admin.component.spec.ts` (nuevo) | CRUD |
| `admin-edit-dialog.component.spec.ts` (nuevo) | Tabs Form/JSON; "Cargar" parsea y popula form; errores Zod inline |
| `admin-dashboard.component.spec.ts` (nuevo) | Cards con conteos correctos |
| E2E Playwright `apps/frontend/e2e/admin.spec.ts` (nuevo) | Login admin → /admin/brands → crear "TestBrand" → editar → eliminar |

---

## 4. Archivos a crear / modificar

### Backend nuevo

- `apps/backend/prisma/migrations/<ts>_add_user_role/migration.sql`
- `apps/backend/prisma/migrations/<ts>_add_deleted_at/migration.sql`
- `apps/backend/src/modules/auth/role.middleware.ts`
- `apps/backend/src/modules/admin/users.controller.ts`
- `apps/backend/src/modules/admin/users.service.ts`
- `apps/backend/src/modules/admin/users.routes.ts`
- `apps/backend/src/modules/admin/seed.controller.ts`
- `apps/backend/src/modules/admin/seed.routes.ts`
- `apps/backend/src/modules/admin/users.controller.spec.ts`
- `apps/backend/src/modules/admin/seed.controller.spec.ts`
- `apps/backend/src/modules/auth/role.middleware.spec.ts`
- `apps/backend/src/modules/brands/brands.dto.admin.ts`
- `apps/backend/src/modules/models/models.dto.admin.ts`
- `apps/backend/src/modules/versions/versions.dto.admin.ts`
- `apps/backend/src/modules/equipment/equipment.dto.admin.ts`
- `apps/backend/src/modules/maintenance/maintenance.dto.admin.ts`

### Backend modificado

- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/seed.ts`
- `apps/backend/src/infra/jwt.ts`
- `apps/backend/src/modules/auth/auth.middleware.ts`
- `apps/backend/src/shared/errors.ts`
- `apps/backend/src/app.ts`
- `apps/backend/src/modules/brands/{brands.routes,brands.controller,brands.service,brands.controller.spec}.ts`
- `apps/backend/src/modules/models/{models.routes,models.controller,models.service,models.controller.spec}.ts`
- `apps/backend/src/modules/versions/{versions.routes,versions.controller,versions.service,versions.controller.spec}.ts`
- `apps/backend/src/modules/equipment/{equipment.routes,equipment.controller,equipment.service,equipment.controller.spec}.ts` (crear el módulo si no existe)
- `apps/backend/src/modules/maintenance/{maintenance.routes,maintenance.controller,maintenance.service,maintenance.controller.spec}.ts` (crear el módulo si no existe)
- `apps/backend/src/modules/comparisons/comparisons.service.ts` (filtra `deletedAt: null`)
- `apps/backend/src/modules/favorites/favorites.service.ts` (idem)
- `apps/backend/src/modules/compare/compare.service.ts` (idem)
- `apps/backend/src/config/env.ts` (ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD)

### Frontend nuevo

- `apps/frontend/src/app/core/admin.guard.ts`
- `apps/frontend/src/app/core/admin.guard.spec.ts`
- `apps/frontend/src/app/features/admin/admin-shell.component.ts` (+ html, css)
- `apps/frontend/src/app/features/admin/admin-dashboard.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/features/admin/entity-schemas.ts`
- `apps/frontend/src/app/features/admin/brands-admin.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/features/admin/models-admin.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/features/admin/versions-admin.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/features/admin/equipment-admin.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/features/admin/maintenance-admin.component.ts` (+ html, css, spec)
- `apps/frontend/e2e/admin.spec.ts`

### Frontend modificado

- `apps/frontend/src/app/app.routes.ts`
- `apps/frontend/src/app/core/auth.service.ts`
- `apps/frontend/src/app/layout/top-nav-bar.component.ts`
- `apps/frontend/src/app/layout/top-nav-bar.component.spec.ts`
- `apps/frontend/src/app/core/auth.service.spec.ts`

---

## 5. Testing strategy

| Capa | Framework | Cobertura mínima |
|---|---|---|
| Backend service | Vitest + Prisma test DB | `create/update/softDelete` para los 5 módulos + guards de role + reglas de cascade |
| Backend HTTP | Vitest + supertest | Endpoints admin: 403 sin admin, happy path, errores de validación, 409 BRAND_HAS_MODELS / MODEL_HAS_VERSIONS |
| Frontend service | Vitest + HttpClientTesting | `AuthService.role` |
| Frontend component | Vitest + HttpClientTesting | Los 5 `<entity>-admin.component` + dialog compartido + dashboard + guard + nav |
| E2E | Playwright | Flujo admin end-to-end (login → crear → editar → eliminar) |

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Migración `add_deleted_at` agrega índice en tablas grandes | Prisma genera `CREATE INDEX CONCURRENTLY` via raw SQL; no bloquea escrituras |
| Soft delete filtra datos en endpoints públicos que olvidemos actualizar | Spec lista explícitamente cada service a actualizar; tests verifican que GET filtran `deletedAt: null` |
| Schema Zod frontend y backend se desincronizan | `entity-schemas.ts` re-exporta los schemas; un solo lugar para los tipos |
| Admin se degrada a sí mismo y queda sin nadie | `demote` rechaza si `targetId === req.user.id` con `CANNOT_DEMOTE_SELF` |
| Forms largos de Version son tediosos | Tab JSON siempre disponible; textarea prellenado con template |
| `TopNavBar` muestra link Admin a USER por race condition | `adminGuard` corre antes que cualquier `<entity>-admin.component`; `navLinks` se computa desde `currentUser()` reactivo |
| Cascade real en `Version` borra favoritos/comparisons relacionadas | Es la semántica correcta: si el auto ya no existe, el favorito/comparison que lo apunta queda huérfano. Trade-off aceptado para MVP (documentado en spec). |
| Seed crea admin con password débil por defecto | `.env.example` documenta el flag de cambio obligatorio; `env.ts` exige la var en producción |

---

## 7. Criterios de aceptación

- [ ] Migración Prisma agrega `role: UserRole` a `User` y `deletedAt` a las 5 entidades; seed crea admin.
- [ ] Backend: `requireRole('ADMIN')` rechaza USER (403) y anónimos (401); JWT incluye `role`.
- [ ] Backend: CRUD admin (POST/PATCH/DELETE soft) para las 5 entidades funciona con auth admin.
- [ ] Backend: DELETE bloquea Brand con Models y Model con Versions con código claro (`BRAND_HAS_MODELS` / `MODEL_HAS_VERSIONS`).
- [ ] Backend: `GET /admin/seed/template/:entity` devuelve JSON ejemplo vacío para las 5 entidades.
- [ ] Backend: `POST /admin/users/:id/promote` y `/demote` funcionan; demote de sí mismo rechazado.
- [ ] Backend: GETs públicos de catálogo (`/brands`, `/models`, `/versions`, comparaciones, favoritos) filtran `deletedAt: null`.
- [ ] Frontend: `adminGuard` bloquea no-admin; `TopNavBar` muestra link "Admin" solo para admins.
- [ ] Frontend: las 5 pantallas admin tienen lista con búsqueda + dialog de edición con tabs Form/JSON.
- [ ] Frontend: tab JSON popula el form al "Cargar" tras validación Zod cliente.
- [ ] Frontend: dashboard admin muestra conteos de cada entidad.
- [ ] Todos los tests pasan (`npm test:be`, `npm test:fe`, `npm run test:e2e`).
- [ ] Playwright E2E `admin.spec.ts` cubre el flujo completo.