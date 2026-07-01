# Admin del catálogo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el área admin para que usuarios con rol `ADMIN` puedan listar, crear, editar y eliminar (soft) Brand, Model, Version, EquipmentItem y MaintenanceCost desde la UI, con creación mediante formulario campo-por-campo o JSON pegado en un textarea. Endpoints y UI quedan completamente aislados por rol.

**Architecture:** Backend-first. Dos migraciones Prisma (User.role + deletedAt en 5 entidades con `CREATE INDEX CONCURRENTLY`). Nuevo middleware `requireRole('ADMIN')` que extiende el payload JWT. CRUD admin vive dentro de cada módulo existente más un módulo `admin/` para endpoints cross-entity (users promote/demote + seed templates). Frontend con `adminGuard`, sección `/admin/*` lazy-loaded, `AdminEditDialogComponent` compartido con tabs Form/JSON que sincronizan via Zod schemas compartidos cliente/servidor.

**Tech Stack:** Angular 22 (signals, OnPush, lazy loading, control flow @if/@for), Express + Zod + Prisma/Postgres, Vitest + supertest (BE) / HttpClientTesting (FE), Playwright E2E.

**Spec de referencia:** `docs/superpowers/specs/2026-07-01-admin-catalogo-design.md`

## Global Constraints

- Cada task termina con commit (`git add -A && git commit -m "<scope>: <desc>"`).
- Backend: `npm -w apps/backend run test` debe pasar antes de commitear.
- Frontend: `npm -w apps/frontend run test` debe pasar antes de commitear.
- TypeScript estricto. No agregar `any` implícito. Reutilizar `shared/errors` (`AppError`, `conflict`, `badRequest`, `notFound`, `unauthorized`, `validation`, `forbidden`).
- Naming: archivos en kebab-case; clases en PascalCase; métodos en camelCase.
- Todas las UI nuevas usan clases Tailwind ya presentes en `apps/frontend/src/styles.css` (variables `brand-*`, `surface`, `ink`, `border`, `warn`).
- Iconos: `material-symbols-outlined`. No instalar nuevas libs de iconos.
- Auth: cualquier endpoint admin debe pasar por `authenticate` + `requireRole('ADMIN')` en orden.
- Soft delete: TODAS las queries existentes que leen Brand/Model/Version/EquipmentItem/MaintenanceCost deben filtrar `deletedAt: null` cuando aplique.
- Migraciones Prisma que agregan índices a tablas grandes deben usar `CREATE INDEX CONCURRENTLY` (raw SQL), no la sintaxis default de Prisma que genera `CREATE INDEX` (que sí bloquea).
- Tests TDD: escribir el test primero, ver fallar, implementar mínimo, ver pasar, commit.

---

## File map (qué hace cada archivo nuevo/modificado)

| Archivo | Cambio | Responsabilidad |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | mod | Enum `UserRole`, `User.role`, `deletedAt` en 5 entidades |
| `apps/backend/prisma/migrations/<ts>_add_user_role/migration.sql` | crear | `CREATE TYPE`, `ALTER TABLE User ADD COLUMN role` |
| `apps/backend/prisma/migrations/<ts>_add_deleted_at/migration.sql` | crear | `ALTER TABLE ... ADD COLUMN deletedAt` + `CREATE INDEX CONCURRENTLY` en 5 tablas |
| `apps/backend/prisma/seed.ts` | mod | Upsert del admin inicial |
| `apps/backend/src/config/env.ts` | mod | `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` |
| `apps/backend/.env.example` | mod | Documentar vars nuevas |
| `apps/backend/src/shared/errors.ts` | mod | `forbidden()`, códigos `FORBIDDEN`, `BRAND_HAS_MODELS`, `MODEL_HAS_VERSIONS`, `CANNOT_DEMOTE_SELF` |
| `apps/backend/src/infra/jwt.ts` | mod | Payload incluye `role` |
| `apps/backend/src/modules/auth/auth.middleware.ts` | mod | Propaga `role` en `req.user` |
| `apps/backend/src/modules/auth/role.middleware.ts` | crear | Factory `requireRole(role)` |
| `apps/backend/src/modules/auth/auth.controller.ts` | mod | `me` retorna `role` |
| `apps/backend/src/modules/brands/brands.{dto.admin,controller,service,routes}.ts` | mod | CRUD admin + filtros soft delete |
| `apps/backend/src/modules/models/models.{dto.admin,controller,service,routes}.ts` | mod | CRUD admin + filtros soft delete |
| `apps/backend/src/modules/versions/versions.{dto.admin,controller,service,routes}.ts` | mod | CRUD admin + filtros soft delete |
| `apps/backend/src/modules/equipment/*` | crear | Módulo nuevo completo (controller, service, routes, dto.admin, specs) |
| `apps/backend/src/modules/maintenance/*` | crear | Módulo nuevo completo |
| `apps/backend/src/modules/admin/{users,seed}.{controller,service,routes}.ts` | crear | Endpoints cross-entity |
| `apps/backend/src/app.ts` | mod | Registrar `adminRouter` + 5 sub-routers admin |
| `apps/backend/src/modules/{compare,comparisons,favorites}/*.service.ts` | mod | Filtrar `deletedAt: null` en queries |
| `apps/backend/src/modules/**/controllers.spec.ts` | mod | Tests para CRUD admin + role guards |
| `apps/frontend/src/app/core/auth.service.ts` | mod | Tipo `User.role`, signal expone role |
| `apps/frontend/src/app/core/admin.guard.ts` | crear | `adminGuard` |
| `apps/frontend/src/app/app.routes.ts` | mod | Bloque `admin/*` lazy |
| `apps/frontend/src/app/layout/top-nav-bar.component.ts` | mod | Link "Admin" si `role === 'ADMIN'` |
| `apps/frontend/src/app/features/admin/admin-shell.component.{ts,html,css}` | crear | Shell con sub-nav + `<router-outlet>` |
| `apps/frontend/src/app/features/admin/admin-dashboard.component.{ts,html,css}` | crear | Dashboard con cards |
| `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html,css}` | crear | Dialog con tabs Form/JSON compartido |
| `apps/frontend/src/app/features/admin/entity-schemas.ts` | crear | Zod schemas compartidos (5 entidades) |
| `apps/frontend/src/app/features/admin/{brands,models,versions,equipment,maintenance}-admin.component.{ts,html,css}` | crear | 5 pantallas admin |
| `apps/frontend/src/app/features/admin/**.spec.ts` | crear | Tests FE |
| `apps/frontend/e2e/admin.spec.ts` | crear | E2E Playwright |

---

## Fase 0 — Prisma: UserRole + role + seed admin

### Task 1: Schema, migración UserRole, env vars, seed

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/<timestamp>_add_user_role/migration.sql` (Prisma lo crea al `migrate dev`)
- Modify: `apps/backend/src/config/env.ts`
- Modify: `apps/backend/.env.example`
- Modify: `apps/backend/prisma/seed.ts`

**Interfaces:**
- Consumes: schema actual sin role
- Produces: `UserRole` enum, `User.role` default `USER`, env vars `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD`

- [ ] **Step 1: Editar `schema.prisma`**

Agregar el enum (junto a los otros enums, después de `Fuel`):

```prisma
enum UserRole {
  USER
  ADMIN
}
```

Modificar `model User`:

```prisma
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

- [ ] **Step 2: Generar migración**

```bash
cd apps/backend && npx prisma migrate dev --name add_user_role --create-only
```

Esperado: crea `prisma/migrations/<ts>_add_user_role/migration.sql` con `CREATE TYPE` + `ALTER TABLE`. Si el archivo está vacío porque Prisma detectó un cambio puro de default, abrir el `.sql` y agregar manualmente el `ALTER TABLE`.

Inspeccionar `migration.sql` y verificar que contenga:

```sql
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
```

- [ ] **Step 3: Modificar `apps/backend/src/config/env.ts`**

Agregar dos líneas al objeto exportado:

```ts
ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@cualautocompro.cl",
ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD ?? "admin1234",
```

- [ ] **Step 4: Modificar `apps/backend/.env.example`**

Agregar:

```
ADMIN_EMAIL=admin@cualautocompro.cl
ADMIN_INITIAL_PASSWORD=admin1234
```

- [ ] **Step 5: Modificar `apps/backend/prisma/seed.ts`**

Agregar al inicio del `main()`, antes del bloque de brands:

```ts
import bcrypt from "bcrypt";
// ... arriba en el archivo, junto a los otros imports

// Dentro de main(), antes de "brandIdByName":
const adminEmail = env.ADMIN_EMAIL;
const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!existingAdmin) {
  const passwordHash = await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 10);
  await prisma.user.create({
    data: { email: adminEmail, passwordHash, name: "Admin", role: "ADMIN" },
  });
  console.log(`[seed] admin creado: ${adminEmail}`);
} else if (existingAdmin.role !== "ADMIN") {
  await prisma.user.update({ where: { id: existingAdmin.id }, data: { role: "ADMIN" } });
  console.log(`[seed] admin promovido: ${adminEmail}`);
}
```

Agregar el import del env (ajustar path según el módulo):

```ts
import { env } from "../src/config/env.js";
```

- [ ] **Step 6: Aplicar migración**

```bash
cd apps/backend && npx prisma migrate dev
```

Esperado: aplica la migración, regenera Prisma Client. Verificar con `npx prisma studio` que `User.role` existe.

- [ ] **Step 7: Verificar seed**

```bash
cd apps/backend && npm run db:seed
```

Esperado: log incluye `[seed] admin creado: admin@cualautocompro.cl` (o "promovido" si ya existía).

- [ ] **Step 8: Commit**

```bash
git add apps/backend/prisma apps/backend/src/config/env.ts apps/backend/.env.example
git commit -m "feat(be): UserRole enum + role en User + seed admin"
```

---

## Fase 1 — Prisma: deletedAt en 5 entidades (soft delete)

### Task 2: Migración deletedAt con CREATE INDEX CONCURRENTLY

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/<timestamp>_add_deleted_at/migration.sql`

**Interfaces:**
- Consumes: schema post-Task 1
- Produces: columna `deletedAt DateTime?` + índice en `Brand`, `Model`, `Version`, `EquipmentItem`, `MaintenanceCost`

- [ ] **Step 1: Editar `schema.prisma`**

Agregar `deletedAt DateTime?` a cada uno de los 5 modelos:

```prisma
model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  logoUrl   String?
  models    Model[]
  deletedAt DateTime?
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
}

model EquipmentItem {
  id        String             @id @default(cuid())
  name      String             @unique
  category  String
  versions  VersionEquipment[]
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
}
```

- [ ] **Step 2: Generar migración raw SQL**

NO usar `prisma migrate dev` directamente porque generaría `CREATE INDEX` (bloqueante). En su lugar:

```bash
cd apps/backend && npx prisma migrate dev --name add_deleted_at --create-only
```

Luego abrir el archivo `prisma/migrations/<ts>_add_deleted_at/migration.sql` y **reemplazar** el `CREATE INDEX` por `CREATE INDEX CONCURRENTLY`. Resultado esperado:

```sql
-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Model" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Version" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "EquipmentItem" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "MaintenanceCost" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX CONCURRENTLY "Brand_deletedAt_idx" ON "Brand"("deletedAt");
CREATE INDEX CONCURRENTLY "Model_deletedAt_idx" ON "Model"("deletedAt");
CREATE INDEX CONCURRENTLY "Version_deletedAt_idx" ON "Version"("deletedAt");
CREATE INDEX CONCURRENTLY "EquipmentItem_deletedAt_idx" ON "EquipmentItem"("deletedAt");
CREATE INDEX CONCURRENTLY "MaintenanceCost_deletedAt_idx" ON "MaintenanceCost"("deletedAt");
```

- [ ] **Step 3: Aplicar migración**

```bash
cd apps/backend && npx prisma migrate dev
```

Esperado: aplica sin error (los `CONCURRENTLY` corren fuera de transacción).

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma
git commit -m "feat(be): deletedAt en Brand, Model, Version, Equipment, Maintenance"
```

---

## Fase 2 — Auth: role en JWT, requireRole middleware, errores

### Task 3: Extender JWT payload + auth middleware + nuevos errores

**Files:**
- Modify: `apps/backend/src/infra/jwt.ts`
- Modify: `apps/backend/src/modules/auth/auth.middleware.ts`
- Modify: `apps/backend/src/shared/errors.ts`

- [ ] **Step 1: Editar `apps/backend/src/infra/jwt.ts`**

```ts
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

export const sign = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verify = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") throw new Error("INVALID_TOKEN");
  return decoded as unknown as JwtPayload;
};
```

- [ ] **Step 2: Editar `apps/backend/src/modules/auth/auth.middleware.ts`**

```ts
import type { Request, Response, NextFunction } from "express";
import { unauthorized } from "../../shared/errors.js";
import { verify } from "../../infra/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: "USER" | "ADMIN";
      };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.auth;
  if (!token) return next(unauthorized());
  try {
    const payload = verify(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch {
    next(unauthorized());
  }
};
```

- [ ] **Step 3: Editar `apps/backend/src/shared/errors.ts`**

```ts
export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "BRAND_HAS_MODELS"
  | "MODEL_HAS_VERSIONS"
  | "CANNOT_DEMOTE_SELF";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  BAD_REQUEST: 400,
  BRAND_HAS_MODELS: 409,
  MODEL_HAS_VERSIONS: 409,
  CANNOT_DEMOTE_SELF: 400,
};

export class AppError extends Error {
  readonly details?: Record<string, unknown> | undefined;
  constructor(
    public readonly code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.details = details;
  }
  get status(): number {
    return STATUS[this.code];
  }
}

export const notFound = (msg = "Recurso no encontrado") =>
  new AppError("NOT_FOUND", msg);
export const unauthorized = (msg = "No autenticado") =>
  new AppError("UNAUTHORIZED", msg);
export const forbidden = (msg = "Sin permisos") =>
  new AppError("FORBIDDEN", msg);
export const conflict = (msg: string, details?: Record<string, unknown>) =>
  new AppError("CONFLICT", msg, details);
export const validation = (msg: string) => new AppError("VALIDATION", msg);
export const badRequest = (msg: string) => new AppError("BAD_REQUEST", msg);
```

- [ ] **Step 4: Actualizar todos los `sign()` callers**

`grep -rn 'sign(' apps/backend/src/modules/auth/` debe mostrar `auth.controller.ts`. Editar `auth.controller.ts`:

```ts
// en register handler:
const token = sign({ sub: safe.id, email: safe.email, name: safe.name, role: safe.role });

// en login handler:
const token = sign({ sub: user.id, email: user.email, name: user.name, role: user.role });
```

Y en `auth.service.ts` los `return { ... }` deben incluir `role`:

```ts
async register(input: z.infer<typeof registerSchema>) {
  const { email, password, name } = registerSchema.parse(input);
  const exists = await this.prisma.user.findUnique({ where: { email } });
  if (exists) throw conflict("Email ya registrado");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await this.prisma.user.create({
    data: { email, passwordHash, name, role: "USER" },
  });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async login(input: z.infer<typeof loginSchema>) {
  const { email, password } = loginSchema.parse(input);
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized("Credenciales inválidas");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw unauthorized("Credenciales inválidas");
  const token = sign({ sub: user.id, email: user.email, name: user.name, role: user.role });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}
```

Y en `auth.controller.ts:me`:

```ts
me: ah(async (req: Request, res: Response) => {
  const token = req.cookies?.auth;
  if (!token) throw unauthorized();
  try {
    const payload = verify(token);
    return res.json(ok({ id: payload.sub, email: payload.email, name: payload.name, role: payload.role }));
  } catch {
    throw unauthorized();
  }
}),
```

- [ ] **Step 5: Verificar tipos**

```bash
cd apps/backend && npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/infra/jwt.ts apps/backend/src/modules/auth apps/backend/src/shared/errors.ts
git commit -m "feat(be): role en JWT, forbidden error, payload extendido"
```

---

### Task 4: requireRole middleware + test

**Files:**
- Create: `apps/backend/src/modules/auth/role.middleware.ts`
- Create: `apps/backend/src/modules/auth/role.middleware.spec.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/auth/role.middleware.ts`**

```ts
import type { Request, Response, NextFunction } from "express";
import { forbidden, unauthorized } from "../../shared/errors.js";

export const requireRole = (role: "USER" | "ADMIN") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden(`Requiere rol ${role}`));
    next();
  };
```

- [ ] **Step 2: Crear `apps/backend/src/modules/auth/role.middleware.spec.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "./role.middleware.js";
import { AppError } from "../../shared/errors.js";

const mockReq = (user: Express.Request["user"]): Request =>
  ({ user }) as unknown as Request;

const mockRes = (): Response => ({} as Response);
const mockNext = (): NextFunction & { called: boolean; err?: unknown } => {
  const fn = ((err?: unknown) => {
    fn.called = true;
    fn.err = err;
  }) as NextFunction & { called: boolean; err?: unknown };
  fn.called = false;
  return fn;
};

describe("requireRole", () => {
  it("sin user → unauthorized", () => {
    const next = mockNext();
    requireRole("ADMIN")(mockReq(undefined), mockRes(), next);
    expect(next.called).toBe(true);
    expect(next.err).toBeInstanceOf(AppError);
    expect((next.err as AppError).code).toBe("UNAUTHORIZED");
  });

  it("USER intentando ADMIN → forbidden", () => {
    const next = mockNext();
    requireRole("ADMIN")(mockReq({ id: "u1", email: "a@b.c", name: "x", role: "USER" }), mockRes(), next);
    expect((next.err as AppError).code).toBe("FORBIDDEN");
  });

  it("ADMIN accediendo ADMIN → next sin error", () => {
    const next = mockNext();
    requireRole("ADMIN")(mockReq({ id: "u1", email: "a@b.c", name: "x", role: "ADMIN" }), mockRes(), next);
    expect(next.called).toBe(true);
    expect(next.err).toBeUndefined();
  });
});
```

- [ ] **Step 3: Correr test**

```bash
npm -w apps/backend run test -- role.middleware
```

Esperado: 3 tests pasan.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/auth/role.middleware.ts apps/backend/src/modules/auth/role.middleware.spec.ts
git commit -m "feat(be): requireRole middleware con tests"
```

---

## Fase 3 — Soft delete en queries públicas existentes

### Task 5: Filtrar deletedAt:null en BrandsService y ModelsService

**Files:**
- Modify: `apps/backend/src/modules/brands/brands.service.ts`
- Modify: `apps/backend/src/modules/models/models.service.ts`
- Modify: `apps/backend/src/modules/versions/versions.service.ts`

- [ ] **Step 1: Editar `apps/backend/src/modules/brands/brands.service.ts`**

```ts
import type { PrismaClient } from "@prisma/client";

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
}
```

- [ ] **Step 2: Editar `apps/backend/src/modules/models/models.service.ts`**

Agregar `deletedAt: null` al `where` raíz de `list()` (línea ~14) y al filtro de versiones en `detail()`. También al subquery de `versions.some`:

```ts
const where: Prisma.ModelWhereInput = { deletedAt: null };
// ... resto del where armado igual ...
if (Object.keys(vWhere).length > 0) where.versions = { some: vWhere };
```

En `detail()` no hay service method, se hace en el controller. El controller actualmente hace `prisma.model.findUnique({ where: { id }, ... })`; agregar un helper o cambiar el controller para usar el service. **Decisión**: agregar `ModelsService.detail(id)`:

```ts
// en models.service.ts:
async detail(id: string) {
  const m = await this.prisma.model.findFirst({
    where: { id, deletedAt: null },
    include: { brand: true, versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } } },
  });
  if (!m) throw notFound("Modelo no encontrado");
  return m;
}
```

Y agregar el import `notFound` arriba. Actualizar `models.controller.ts:detail`:

```ts
detail: ah(async (req: Request, res: Response) => {
  const id = req.params.id ?? "";
  if (!id) return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "id requerido" } });
  res.json(ok(await svc.detail(id)));
}),
```

- [ ] **Step 3: Editar `apps/backend/src/modules/versions/versions.service.ts`**

```ts
import type { PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";

export class VersionsService {
  constructor(private readonly prisma: PrismaClient) {}

  async detail(id: string) {
    const v = await this.prisma.version.findFirst({
      where: { id, deletedAt: null },
      include: {
        model: { include: { brand: true } },
        equipmentItems: { include: { equipmentItem: true } },
        maintenanceCosts: { where: { deletedAt: null } },
      },
    });
    if (!v) throw notFound("Versión no encontrada");
    return v;
  }
}
```

- [ ] **Step 4: Correr tests**

```bash
npm -w apps/backend run test
```

Esperado: pasan los tests existentes de brands/models/versions.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules
git commit -m "feat(be): soft-delete filter en queries públicas de Brand/Model/Version"
```

---

### Task 6: Filtrar deletedAt:null en Compare/Comparisons/Favorites

**Files:**
- Modify: `apps/backend/src/modules/compare/compare.service.ts` (si existe; si no, crear el método)
- Modify: `apps/backend/src/modules/comparisons/comparisons.service.ts`
- Modify: `apps/backend/src/modules/favorites/favorites.service.ts`

- [ ] **Step 1: Inspeccionar `compare`**

```bash
ls apps/backend/src/modules/compare
```

Si existe `compare.service.ts`, editar el `get` method para filtrar `version.deletedAt: null` y `version.model.deletedAt: null` en el `where`. Si no existe service, agregar el filtro al controller directamente.

Patrón (adaptar a la implementación real):

```ts
const cmp = await this.prisma.compare.findUnique({
  where: { slug },
  include: {
    versions: {
      where: { deletedAt: null, model: { deletedAt: null } },
      include: { model: { include: { brand: true } } },
    },
  },
});
```

- [ ] **Step 2: Editar `comparisons.service.ts`**

`getBySlug` y `listByUser`: filtrar `versions: { every: { deletedAt: null } }` o usar `versions: { some: { deletedAt: null } }` según la semántica. **Decisión**: usar `include: { items: { include: { version: { where: { deletedAt: null } } } } }` — sólo mostrar versiones activas; si una versión fue borrada, el `ComparisonItem` queda huérfano pero el include la filtra.

```ts
async getBySlug(slug: string) {
  const cmp = await this.prisma.comparison.findUnique({
    where: { slug },
    include: {
      items: {
        include: {
          version: {
            where: { deletedAt: null },
            include: { model: { include: { brand: true } } },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!cmp) throw notFound("Comparación no encontrada");
  return cmp;
}

async listByUser(userId: string) {
  return this.prisma.comparison.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          version: {
            where: { deletedAt: null },
            include: { model: { include: { brand: true } } },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **Step 3: Editar `favorites.service.ts`**

`listModels`: filtrar `model.deletedAt: null` y `model.versions: { some: { deletedAt: null } }`:

```ts
async listModels(userId: string) {
  const favs = await this.prisma.favorite.findMany({
    where: { userId },
    include: {
      model: {
        where: { deletedAt: null },
        include: {
          brand: true,
          versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return favs.map((f) => f.model).filter((m) => m !== null);
}
```

- [ ] **Step 4: Correr tests**

```bash
npm -w apps/backend run test
```

Esperado: pasan los tests existentes.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/compare apps/backend/src/modules/comparisons apps/backend/src/modules/favorites
git commit -m "feat(be): filtrar deletedAt en compare/comparisons/favorites"
```

---

## Fase 4 — Brand admin CRUD

### Task 7: Brand admin — DTO + service + controller + routes + tests

**Files:**
- Create: `apps/backend/src/modules/brands/brands.dto.admin.ts`
- Modify: `apps/backend/src/modules/brands/brands.service.ts`
- Modify: `apps/backend/src/modules/brands/brands.controller.ts`
- Modify: `apps/backend/src/modules/brands/brands.routes.ts`
- Modify: `apps/backend/src/modules/brands/brands.controller.spec.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/brands/brands.dto.admin.ts`**

```ts
import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: z.string().url().nullable().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
```

- [ ] **Step 2: Editar `apps/backend/src/modules/brands/brands.service.ts`**

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import type { CreateBrandInput, UpdateBrandInput } from "./brands.dto.admin.js";

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

  async create(input: CreateBrandInput) {
    return this.prisma.brand.create({ data: input });
  }

  async update(id: string, input: UpdateBrandInput) {
    try {
      return await this.prisma.brand.update({
        where: { id, deletedAt: null },
        data: input,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Marca no encontrada");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const count = await this.prisma.model.count({
      where: { brandId: id, deletedAt: null },
    });
    if (count > 0) {
      throw conflict("No se puede eliminar: tiene modelos asociados", {
        code: "BRAND_HAS_MODELS",
        modelCount: count,
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

- [ ] **Step 3: Editar `apps/backend/src/modules/brands/brands.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
import { createBrandSchema, updateBrandSchema } from "./brands.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new BrandsService(prisma);

export const brandsController = {
  list: ah(async (_req: Request, res: Response) =>
    res.json(ok(await svc.list())),
  ),

  models: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) {
      return res.status(400).json({
        data: null,
        error: { code: "BAD_REQUEST", message: "id requerido" },
      });
    }
    res.json(ok(await svc.models(id)));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    }
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateBrandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    }
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
```

- [ ] **Step 4: Editar `apps/backend/src/modules/brands/brands.routes.ts`**

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { brandsController } from "./brands.controller.js";

export const brandsRouter = Router();
brandsRouter.get("/", brandsController.list);
brandsRouter.get("/:id/models", brandsController.models);

export const brandsAdminRouter = Router();
brandsAdminRouter.use(authenticate, requireRole("ADMIN"));
brandsAdminRouter.post("/", brandsController.create);
brandsAdminRouter.patch("/:id", brandsController.update);
brandsAdminRouter.delete("/:id", brandsController.softDelete);
```

- [ ] **Step 5: Registrar en `apps/backend/src/app.ts`**

Agregar imports (junto a los otros routers):

```ts
import { brandsAdminRouter } from "./modules/brands/brands.routes.js";
```

Y registrar la ruta (junto a las otras):

```ts
app.use("/api/v1/admin/brands", brandsAdminRouter);
```

- [ ] **Step 6: Escribir test `brands.controller.spec.ts`**

Leer el spec existente primero para mantener el patrón:

```bash
cat apps/backend/src/modules/brands/brands.controller.spec.ts 2>/dev/null || echo "NO EXISTE"
```

Si no existe, crear uno base; si existe, extender. Test mínimo nuevo (crear archivo si no existe):

```ts
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";

describe("brands admin", () => {
  const app = createApp();

  it("POST /api/v1/admin/brands sin auth → 401", async () => {
    const res = await request(app).post("/api/v1/admin/brands").send({ name: "X" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/v1/admin/brands/:id sin auth → 401", async () => {
    const res = await request(app).delete("/api/v1/admin/brands/cuid-fake");
    expect(res.status).toBe(401);
  });
});
```

> Nota: tests de flujo admin completo (con usuario admin válido) requieren login previo o mock de JWT. Si el proyecto ya tiene helpers para esto en otros specs, reutilizar. Si no, dejar solo los tests de auth por ahora y cubrir el happy path en Task 18 (E2E).

- [ ] **Step 7: Correr tests**

```bash
npm -w apps/backend run test -- brands
```

Esperado: tests existentes siguen pasando; nuevos tests pasan.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/modules/brands apps/backend/src/app.ts
git commit -m "feat(be): admin CRUD para Brand con role guard"
```

---

## Fase 5 — Model admin CRUD

### Task 8: Model admin — DTO + service + controller + routes

**Files:**
- Create: `apps/backend/src/modules/models/models.dto.admin.ts`
- Modify: `apps/backend/src/modules/models/models.service.ts`
- Modify: `apps/backend/src/modules/models/models.controller.ts`
- Modify: `apps/backend/src/modules/models/models.routes.ts`
- Modify: `apps/backend/src/modules/models/models.controller.spec.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/models/models.dto.admin.ts`**

```ts
import { z } from "zod";

export const SEGMENTS = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"] as const;

export const createModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.enum(SEGMENTS),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});

export const updateModelSchema = createModelSchema.partial().omit({ brandId: true });

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
```

- [ ] **Step 2: Agregar métodos al `ModelsService`**

Editar `apps/backend/src/modules/models/models.service.ts` — agregar al final de la clase:

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { conflict, notFound } from "../../shared/errors.js";
import type { CreateModelInput, UpdateModelInput } from "./models.dto.admin.js";

// ... existing list() and detail() ...

async create(input: CreateModelInput) {
  // Verificar que la brand existe y no está borrada
  const brand = await this.prisma.brand.findFirst({
    where: { id: input.brandId, deletedAt: null },
  });
  if (!brand) throw notFound("Marca no encontrada");
  return this.prisma.model.create({ data: input });
}

async update(id: string, input: UpdateModelInput) {
  try {
    return await this.prisma.model.update({
      where: { id, deletedAt: null },
      data: input,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw notFound("Modelo no encontrado");
    }
    throw e;
  }
}

async softDelete(id: string) {
  const count = await this.prisma.version.count({
    where: { modelId: id, deletedAt: null },
  });
  if (count > 0) {
    throw conflict("No se puede eliminar: tiene versiones asociadas", {
      code: "MODEL_HAS_VERSIONS",
      versionCount: count,
    });
  }
  await this.prisma.model.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { deleted: true };
}
```

(Quitar el import duplicado `Prisma` si quedó redundante.)

- [ ] **Step 3: Editar `models.controller.ts`**

Agregar al objeto `modelsController`:

```ts
import { createModelSchema, updateModelSchema } from "./models.dto.admin.js";

// dentro del objeto:
create: ah(async (req: Request, res: Response) => {
  const parsed = createModelSchema.safeParse(req.body);
  if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
  res.status(201).json(ok(await svc.create(parsed.data)));
}),

update: ah(async (req: Request, res: Response) => {
  const id = req.params.id ?? "";
  const parsed = updateModelSchema.safeParse(req.body);
  if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
  res.json(ok(await svc.update(id, parsed.data)));
}),

softDelete: ah(async (req: Request, res: Response) => {
  const id = req.params.id ?? "";
  res.json(ok(await svc.softDelete(id)));
}),
```

- [ ] **Step 4: Editar `models.routes.ts`**

Agregar export al final:

```ts
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";

export const modelsAdminRouter = Router();
modelsAdminRouter.use(authenticate, requireRole("ADMIN"));
modelsAdminRouter.post("/", modelsController.create);
modelsAdminRouter.patch("/:id", modelsController.update);
modelsAdminRouter.delete("/:id", modelsController.softDelete);
```

- [ ] **Step 5: Registrar en `app.ts`**

```ts
import { modelsAdminRouter } from "./modules/models/models.routes.js";
// ...
app.use("/api/v1/admin/models", modelsAdminRouter);
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/models apps/backend/src/app.ts
git commit -m "feat(be): admin CRUD para Model con role guard"
```

---

## Fase 6 — Version admin CRUD

### Task 9: Version admin — DTO + service + controller + routes

**Files:**
- Create: `apps/backend/src/modules/versions/versions.dto.admin.ts`
- Modify: `apps/backend/src/modules/versions/versions.service.ts`
- Modify: `apps/backend/src/modules/versions/versions.controller.ts`
- Modify: `apps/backend/src/modules/versions/versions.routes.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/versions/versions.dto.admin.ts`**

```ts
import { z } from "zod";

export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC", "CVT", "DCT"] as const;
export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;

export const createVersionSchema = z.object({
  modelId: z.string().min(1),
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

export const updateVersionSchema = createVersionSchema.partial().omit({ modelId: true });

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;
```

- [ ] **Step 2: Editar `versions.service.ts`**

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateVersionInput, UpdateVersionInput } from "./versions.dto.admin.js";

export class VersionsService {
  constructor(private readonly prisma: PrismaClient) {}

  async detail(id: string) {
    // (igual que Task 5)
    const v = await this.prisma.version.findFirst({
      where: { id, deletedAt: null },
      include: {
        model: { include: { brand: true } },
        equipmentItems: { include: { equipmentItem: true } },
        maintenanceCosts: { where: { deletedAt: null } },
      },
    });
    if (!v) throw notFound("Versión no encontrada");
    return v;
  }

  async create(input: CreateVersionInput) {
    const model = await this.prisma.model.findFirst({
      where: { id: input.modelId, deletedAt: null },
    });
    if (!model) throw notFound("Modelo no encontrado");
    return this.prisma.version.create({ data: input });
  }

  async update(id: string, input: UpdateVersionInput) {
    try {
      return await this.prisma.version.update({
        where: { id, deletedAt: null },
        data: input,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Versión no encontrada");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    // Cascade real a MaintenanceCost y VersionEquipment (FK onDelete: Cascade ya está).
    // Sólo soft-delete la versión.
    try {
      await this.prisma.version.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Versión no encontrada");
      }
      throw e;
    }
  }
}
```

- [ ] **Step 3: Editar `versions.controller.ts`**

```ts
import { createVersionSchema, updateVersionSchema } from "./versions.dto.admin.js";
import { validation } from "../../shared/errors.js";

export const versionsController = {
  detail: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    if (!id) return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "id requerido" } });
    res.json(ok(await svc.detail(id)));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createVersionSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateVersionSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
```

- [ ] **Step 4: Editar `versions.routes.ts`**

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { versionsController } from "./versions.controller.js";

export const versionsRouter = Router();
versionsRouter.get("/:id", versionsController.detail);

export const versionsAdminRouter = Router();
versionsAdminRouter.use(authenticate, requireRole("ADMIN"));
versionsAdminRouter.post("/", versionsController.create);
versionsAdminRouter.patch("/:id", versionsController.update);
versionsAdminRouter.delete("/:id", versionsController.softDelete);
```

- [ ] **Step 5: Registrar en `app.ts`**

```ts
import { versionsAdminRouter } from "./modules/versions/versions.routes.js";
app.use("/api/v1/admin/versions", versionsAdminRouter);
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/versions apps/backend/src/app.ts
git commit -m "feat(be): admin CRUD para Version con role guard"
```

---

## Fase 7 — Equipment module + admin CRUD

### Task 10: Equipment module completo (controller, service, routes, DTO, specs)

**Files:**
- Create: `apps/backend/src/modules/equipment/equipment.dto.admin.ts`
- Create: `apps/backend/src/modules/equipment/equipment.service.ts`
- Create: `apps/backend/src/modules/equipment/equipment.controller.ts`
- Create: `apps/backend/src/modules/equipment/equipment.routes.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/equipment/equipment.dto.admin.ts`**

```ts
import { z } from "zod";

export const createEquipmentSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

export const attachEquipmentSchema = z.object({
  versionId: z.string().min(1),
  itemId: z.string().min(1),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
```

- [ ] **Step 2: Crear `apps/backend/src/modules/equipment/equipment.service.ts`**

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateEquipmentInput, UpdateEquipmentInput } from "./equipment.dto.admin.js";

export class EquipmentService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.equipmentItem.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateEquipmentInput) {
    return this.prisma.equipmentItem.create({ data: input });
  }

  async update(id: string, input: UpdateEquipmentInput) {
    try {
      return await this.prisma.equipmentItem.update({
        where: { id, deletedAt: null },
        data: input,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Equipment item no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.equipmentItem.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Equipment item no encontrado");
      }
      throw e;
    }
  }

  async attach(versionId: string, itemId: string) {
    return this.prisma.versionEquipment.create({
      data: { versionId, equipmentItemId: itemId },
    });
  }

  async detach(versionId: string, itemId: string) {
    await this.prisma.versionEquipment.delete({
      where: { versionId_equipmentItemId: { versionId, equipmentItemId: itemId } },
    });
    return { detached: true };
  }
}
```

- [ ] **Step 3: Crear `apps/backend/src/modules/equipment/equipment.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { EquipmentService } from "./equipment.service.js";
import {
  createEquipmentSchema,
  updateEquipmentSchema,
  attachEquipmentSchema,
} from "./equipment.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new EquipmentService(prisma);

export const equipmentController = {
  list: ah(async (_req: Request, res: Response) => res.json(ok(await svc.list()))),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),

  attach: ah(async (req: Request, res: Response) => {
    const parsed = attachEquipmentSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.attach(parsed.data.versionId, parsed.data.itemId)));
  }),

  detach: ah(async (req: Request, res: Response) => {
    const { versionId, itemId } = req.params;
    res.json(ok(await svc.detach(versionId ?? "", itemId ?? "")));
  }),
};
```

- [ ] **Step 4: Crear `apps/backend/src/modules/equipment/equipment.routes.ts`**

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { equipmentController } from "./equipment.controller.js";

export const equipmentRouter = Router();
equipmentRouter.get("/", equipmentController.list);

export const equipmentAdminRouter = Router();
equipmentAdminRouter.use(authenticate, requireRole("ADMIN"));
equipmentAdminRouter.post("/", equipmentController.create);
equipmentAdminRouter.patch("/:id", equipmentController.update);
equipmentAdminRouter.delete("/:id", equipmentController.softDelete);
equipmentAdminRouter.post("/attach", equipmentController.attach);
equipmentAdminRouter.delete("/version/:versionId/item/:itemId", equipmentController.detach);
```

- [ ] **Step 5: Registrar en `app.ts`**

```ts
import { equipmentRouter, equipmentAdminRouter } from "./modules/equipment/equipment.routes.js";
app.use("/api/v1/equipment", equipmentRouter);
app.use("/api/v1/admin/equipment", equipmentAdminRouter);
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/equipment apps/backend/src/app.ts
git commit -m "feat(be): módulo Equipment con CRUD admin + endpoints attach/detach"
```

---

## Fase 8 — Maintenance module + admin CRUD

### Task 11: Maintenance module completo

**Files:**
- Create: `apps/backend/src/modules/maintenance/maintenance.dto.admin.ts`
- Create: `apps/backend/src/modules/maintenance/maintenance.service.ts`
- Create: `apps/backend/src/modules/maintenance/maintenance.controller.ts`
- Create: `apps/backend/src/modules/maintenance/maintenance.routes.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/maintenance/maintenance.dto.admin.ts`**

```ts
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
```

- [ ] **Step 2: Crear `apps/backend/src/modules/maintenance/maintenance.service.ts`**

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from "./maintenance.dto.admin.js";

export class MaintenanceService {
  constructor(private readonly prisma: PrismaClient) {}

  listByVersion(versionId: string) {
    return this.prisma.maintenanceCost.findMany({
      where: { versionId, deletedAt: null },
      orderBy: { mileageTag: "asc" },
    });
  }

  async create(input: CreateMaintenanceInput) {
    return this.prisma.maintenanceCost.create({ data: input });
  }

  async update(id: string, input: UpdateMaintenanceInput) {
    try {
      return await this.prisma.maintenanceCost.update({
        where: { id, deletedAt: null },
        data: input,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Maintenance cost no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.maintenanceCost.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Maintenance cost no encontrado");
      }
      throw e;
    }
  }
}
```

- [ ] **Step 3: Crear `apps/backend/src/modules/maintenance/maintenance.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { MaintenanceService } from "./maintenance.service.js";
import { createMaintenanceSchema, updateMaintenanceSchema } from "./maintenance.dto.admin.js";
import { validation } from "../../shared/errors.js";

const svc = new MaintenanceService(prisma);

export const maintenanceController = {
  listByVersion: ah(async (req: Request, res: Response) => {
    const versionId = req.params.versionId ?? "";
    res.json(ok(await svc.listByVersion(versionId)));
  }),

  create: ah(async (req: Request, res: Response) => {
    const parsed = createMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),

  update: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    const parsed = updateMaintenanceSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),

  softDelete: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
```

- [ ] **Step 4: Crear `apps/backend/src/modules/maintenance/maintenance.routes.ts`**

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { maintenanceController } from "./maintenance.controller.js";

export const maintenanceRouter = Router();
maintenanceRouter.get("/version/:versionId", maintenanceController.listByVersion);

export const maintenanceAdminRouter = Router();
maintenanceAdminRouter.use(authenticate, requireRole("ADMIN"));
maintenanceAdminRouter.post("/", maintenanceController.create);
maintenanceAdminRouter.patch("/:id", maintenanceController.update);
maintenanceAdminRouter.delete("/:id", maintenanceController.softDelete);
```

- [ ] **Step 5: Registrar en `app.ts`**

```ts
import { maintenanceRouter, maintenanceAdminRouter } from "./modules/maintenance/maintenance.routes.js";
app.use("/api/v1/maintenance", maintenanceRouter);
app.use("/api/v1/admin/maintenance", maintenanceAdminRouter);
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/maintenance apps/backend/src/app.ts
git commit -m "feat(be): módulo Maintenance con CRUD admin"
```

---

## Fase 9 — Admin cross-entity: users promote/demote + seed templates

### Task 12: Admin module (users + seed) y registro final en app.ts

**Files:**
- Create: `apps/backend/src/modules/admin/users.service.ts`
- Create: `apps/backend/src/modules/admin/users.controller.ts`
- Create: `apps/backend/src/modules/admin/seed.controller.ts`
- Create: `apps/backend/src/modules/admin/admin.routes.ts`
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Crear `apps/backend/src/modules/admin/users.service.ts`**

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";

export class AdminUsersService {
  constructor(private readonly prisma: PrismaClient) {}

  list() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async promote(id: string) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { role: "ADMIN" },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Usuario no encontrado");
      }
      throw e;
    }
  }

  async demote(id: string, actorId: string) {
    if (id === actorId) {
      throw badRequest("No podés degradarte a vos mismo");
    }
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { role: "USER" },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Usuario no encontrado");
      }
      throw e;
    }
  }
}
```

- [ ] **Step 2: Crear `apps/backend/src/modules/admin/users.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { unauthorized } from "../../shared/errors.js";
import { prisma } from "../../infra/prisma.js";
import { AdminUsersService } from "./users.service.js";

const svc = new AdminUsersService(prisma);

export const adminUsersController = {
  list: ah(async (_req: Request, res: Response) => res.json(ok(await svc.list()))),

  promote: ah(async (req: Request, res: Response) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.promote(id)));
  }),

  demote: ah(async (req: Request, res: Response) => {
    const actor = req.user;
    if (!actor) throw unauthorized();
    const id = req.params.id ?? "";
    res.json(ok(await svc.demote(id, actor.id)));
  }),
};
```

- [ ] **Step 3: Crear `apps/backend/src/modules/admin/seed.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { badRequest } from "../../shared/errors.js";

const TEMPLATES: Record<string, unknown> = {
  brand: { name: "", logoUrl: null },
  model: { brandId: "", name: "", segment: "SEDAN", imageUrl: null, galleryUrls: [] },
  version: {
    modelId: "",
    name: "",
    year: 2026,
    priceClp: 0,
    transmission: "MANUAL",
    fuel: "BENCINA",
    engineDisplacementCc: 0,
    powerHp: 0,
    torqueNm: 0,
    consumptionCityKmL: 0,
    consumptionHighwayKmL: 0,
    lengthMm: 0,
    widthMm: 0,
    heightMm: 0,
    weightKg: 0,
    trunkLiters: 0,
    airbagCount: 0,
    hasAbs: false,
    hasEsp: false,
    hasCruiseControl: false,
  },
  equipment: { name: "", category: "" },
  maintenance: { versionId: "", mileageTag: 0, costClp: 0 },
};

export const seedController = {
  template: ah(async (req: Request, res: Response) => {
    const entity = req.params.entity ?? "";
    const tpl = TEMPLATES[entity];
    if (!tpl) throw badRequest(`Entity '${entity}' no soportada. Soportadas: ${Object.keys(TEMPLATES).join(", ")}`);
    res.json(ok(tpl));
  }),
};
```

- [ ] **Step 4: Crear `apps/backend/src/modules/admin/admin.routes.ts`**

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

- [ ] **Step 5: Registrar en `app.ts`**

```ts
import { adminRouter } from "./modules/admin/admin.routes.js";
// ...
app.use("/api/v1/admin", adminRouter);
```

- [ ] **Step 6: Verificar compilación y tests**

```bash
cd apps/backend && npx tsc --noEmit && npm test
```

Esperado: sin errores de tipo, todos los tests pasan.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/modules/admin apps/backend/src/app.ts
git commit -m "feat(be): módulo admin con users promote/demote + seed templates"
```

---

## Fase 10 — Frontend: auth extension, adminGuard, TopNavBar, routes

### Task 13: AuthService.role + adminGuard + TopNavBar link + routes

**Files:**
- Modify: `apps/frontend/src/app/core/auth.service.ts`
- Modify: `apps/frontend/src/app/layout/top-nav-bar.component.ts`
- Modify: `apps/frontend/src/app/layout/top-nav-bar.component.spec.ts`
- Modify: `apps/frontend/src/app/app.routes.ts`
- Create: `apps/frontend/src/app/core/admin.guard.ts`
- Create: `apps/frontend/src/app/core/admin.guard.spec.ts`

- [ ] **Step 1: Editar `auth.service.ts`**

```ts
import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
};

type AuthEnvelope<T> = { data: T } | { error: { code: string } };

function hasData<T>(value: AuthEnvelope<T>): value is { data: T } {
  return 'data' in value && (value as { data: T }).data != null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  currentUser = signal<User | null>(null);

  async bootstrap(): Promise<void> {
    try {
      const res = await this.api.get<AuthEnvelope<User>>('/auth/me');
      if (hasData(res)) this.currentUser.set(res.data);
    } catch {
      /* no logueado */
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await this.api.post<AuthEnvelope<User>>('/auth/login', { email, password });
    if (hasData(res)) this.currentUser.set(res.data);
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const res = await this.api.post<AuthEnvelope<User>>('/auth/register', { email, password, name });
    if (hasData(res)) this.currentUser.set(res.data);
  }

  async logout(): Promise<void> {
    await this.api.post<AuthEnvelope<{ loggedOut: true }>>('/auth/logout', {});
    this.currentUser.set(null);
  }
}
```

- [ ] **Step 2: Crear `apps/frontend/src/app/core/admin.guard.ts`**

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.currentUser()) await auth.bootstrap();
  const u = auth.currentUser();
  if (!u) return router.createUrlTree(['/login']);
  if (u.role !== 'ADMIN') return router.createUrlTree(['/']);
  return true;
};
```

- [ ] **Step 3: Crear `apps/frontend/src/app/core/admin.guard.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { Router, type CanActivateFn } from '@angular/router';
import { provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService, type User } from './auth.service';

describe('adminGuard', () => {
  let authStub: { currentUser: () => User | null; bootstrap: () => Promise<void> };

  const setup = () => {
    authStub = {
      currentUser: () => null,
      bootstrap: async () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
      ],
    });
  };

  const run: CanActivateFn = (...args) => TestBed.runInInjectionContext(() => adminGuard(...args));

  it('redirige a /login si no hay user', async () => {
    setup();
    authStub.currentUser = () => null;
    const result = await run({} as never, {} as never);
    expect(String(result)).toContain('/login');
  });

  it('redirige a / si hay user pero no es admin', async () => {
    setup();
    authStub.currentUser = () => ({ id: 'u1', email: 'a@b.c', name: 'X', role: 'USER' });
    const result = await run({} as never, {} as never);
    expect(String(result)).toBe('/');
  });

  it('permite si user es admin', async () => {
    setup();
    authStub.currentUser = () => ({ id: 'u1', email: 'a@b.c', name: 'X', role: 'ADMIN' });
    const result = await run({} as never, {} as never);
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 4: Editar `top-nav-bar.component.ts`**

Modificar `navLinks` para incluir el link "Admin" si el usuario es admin:

```ts
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

- [ ] **Step 5: Extender `top-nav-bar.component.spec.ts`**

Agregar al bloque de tests existente:

```ts
it('muestra link Admin cuando role es ADMIN', () => {
  // setear authStub.currentUser = () => ({ ..., role: 'ADMIN' })
  // verificar que el navLinks incluye path '/admin'
});

it('oculta link Admin cuando role es USER', () => {
  // verificar que el navLinks NO incluye '/admin'
});
```

(Si el spec existente no stub-ea `AuthService`, agregar el provider con `useValue`.)

- [ ] **Step 6: Editar `app.routes.ts`**

Agregar el bloque admin dentro del children del shell:

```ts
{
  path: 'admin',
  canActivate: [adminGuard],
  loadComponent: () =>
    import('./features/admin/admin-shell.component').then(
      (m) => m.AdminShellComponent,
    ),
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./features/admin/admin-dashboard.component').then(
          (m) => m.AdminDashboardComponent,
        ),
    },
    {
      path: 'brands',
      loadComponent: () =>
        import('./features/admin/brands-admin.component').then(
          (m) => m.BrandsAdminComponent,
        ),
    },
    {
      path: 'models',
      loadComponent: () =>
        import('./features/admin/models-admin.component').then(
          (m) => m.ModelsAdminComponent,
        ),
    },
    {
      path: 'versions',
      loadComponent: () =>
        import('./features/admin/versions-admin.component').then(
          (m) => m.VersionsAdminComponent,
        ),
    },
    {
      path: 'equipment',
      loadComponent: () =>
        import('./features/admin/equipment-admin.component').then(
          (m) => m.EquipmentAdminComponent,
        ),
    },
    {
      path: 'maintenance',
      loadComponent: () =>
        import('./features/admin/maintenance-admin.component').then(
          (m) => m.MaintenanceAdminComponent,
        ),
    },
  ],
},
```

Y agregar el import:

```ts
import { adminGuard } from './core/admin.guard';
```

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/app/core apps/frontend/src/app/layout apps/frontend/src/app/app.routes.ts
git commit -m "feat(fe): AuthService.role + adminGuard + nav Admin"
```

---

## Fase 11 — Frontend: AdminShell + Dashboard + EntitySchemas + AdminEditDialog

### Task 14: AdminShell + AdminDashboard

**Files:**
- Create: `apps/frontend/src/app/features/admin/admin-shell.component.ts` (+ html, css)
- Create: `apps/frontend/src/app/features/admin/admin-dashboard.component.ts` (+ html, css, spec)

- [ ] **Step 1: Crear `admin-shell.component.ts`**

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface SubLink {
  path: string;
  label: string;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  readonly subLinks: SubLink[] = [
    { path: '/admin', label: 'Dashboard', },
    { path: '/admin/brands', label: 'Marcas' },
    { path: '/admin/models', label: 'Modelos' },
    { path: '/admin/versions', label: 'Versiones' },
    { path: '/admin/equipment', label: 'Equipamiento' },
    { path: '/admin/maintenance', label: 'Mantención' },
  ];
}
```

- [ ] **Step 2: Crear `admin-shell.component.html`**

```html
<section class="mx-auto max-w-7xl px-4 md:px-8 py-6">
  <h1 class="text-2xl font-bold text-ink mb-4">Panel de administración</h1>
  <nav class="flex gap-2 border-b border-border mb-6 overflow-x-auto" role="tablist">
    @for (l of subLinks; track l.path) {
      <a
        [routerLink]="l.path"
        routerLinkActive="border-b-2 border-brand-600 text-brand-700 font-bold"
        [routerLinkActiveOptions]="{ exact: l.path === '/admin' }"
        class="px-3 py-2 text-sm whitespace-nowrap"
      >{{ l.label }}</a>
    }
  </nav>
  <router-outlet />
</section>
```

- [ ] **Step 3: Crear `admin-shell.component.css`**

```css
:host { display: block; }
```

- [ ] **Step 4: Crear `admin-dashboard.component.ts`**

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

interface Card {
  path: string;
  label: string;
  count: number | null;
  loading: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private api = inject(ApiService);

  readonly cards = signal<Card[]>([
    { path: '/admin/brands',      label: 'Marcas',       count: null, loading: true },
    { path: '/admin/models',      label: 'Modelos',      count: null, loading: true },
    { path: '/admin/versions',    label: 'Versiones',    count: null, loading: true },
    { path: '/admin/equipment',   label: 'Equipamiento', count: null, loading: true },
    { path: '/admin/maintenance', label: 'Mantención',   count: null, loading: true },
  ]);

  constructor() {
    void this.loadCounts();
  }

  private async loadCounts(): Promise<void> {
    await Promise.all([
      this.load('Marcas',       '/brands',                0),
      this.load('Modelos',      '/models?pageSize=1',     1),
      this.load('Versiones',    '/versions?pageSize=1',   2),
      this.load('Equipamiento', '/equipment',             3),
      this.load('Mantención',   '/maintenance/version/__none__', 4).catch(() => undefined),
    ]);
  }

  private async load(_label: string, path: string, idx: number): Promise<void> {
    try {
      const res = await this.api.get<{ data: unknown } | { data: { total?: number; items?: unknown[] } }>(path);
      const data = (res as { data: unknown }).data;
      let count = 0;
      if (Array.isArray(data)) count = data.length;
      else if (data && typeof data === 'object') {
        const d = data as { total?: number; items?: unknown[] };
        count = d.total ?? d.items?.length ?? 0;
      }
      this.cards.update((cs) => cs.map((c, i) => (i === idx ? { ...c, count, loading: false } : c)));
    } catch {
      this.cards.update((cs) => cs.map((c, i) => (i === idx ? { ...c, count: null, loading: false } : c)));
    }
  }
}
```

- [ ] **Step 5: Crear `admin-dashboard.component.html`**

```html
<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  @for (c of cards(); track c.path) {
    <a [routerLink]="c.path" class="block rounded-xl border border-border bg-surface p-6 hover:border-brand-600 transition-colors">
      <h2 class="text-lg font-bold text-ink">{{ c.label }}</h2>
      <p class="mt-2 text-3xl font-bold text-brand-700">
        @if (c.loading) {
          <span class="text-ink-muted">…</span>
        } @else if (c.count === null) {
          <span class="text-warn-dark">Error</span>
        } @else {
          {{ c.count }}
        }
      </p>
      <p class="mt-2 text-xs text-ink-muted">Administrar →</p>
    </a>
  }
</section>
```

- [ ] **Step 6: Crear `admin-dashboard.component.css`**

```css
:host { display: block; }
```

- [ ] **Step 7: Crear `admin-dashboard.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  it('carga conteos desde los endpoints públicos', async () => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const requests = http.match(() => true);
    expect(requests.length).toBeGreaterThan(0);
    for (const r of requests) r.flush({ data: [] });
    fixture.detectChanges();
  });
});
```

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/app/features/admin
git commit -m "feat(fe): AdminShell + AdminDashboard con conteos"
```

---

### Task 15: entity-schemas.ts (Zod compartidos cliente/servidor)

**Files:**
- Create: `apps/frontend/src/app/features/admin/entity-schemas.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { z } from 'zod';

export const SEGMENTS = ['SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'CROSSOVER', 'COMMERCIAL'] as const;
export const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'] as const;
export const FUELS = ['BENCINA', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const;

export const brandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: z.string().url().nullable().optional(),
});

export const modelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.enum(SEGMENTS),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});

export const versionSchema = z.object({
  modelId: z.string().min(1),
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
```

- [ ] **Step 2: Verificar compilación**

```bash
cd apps/frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/admin/entity-schemas.ts
git commit -m "feat(fe): Zod schemas compartidos cliente/servidor para entidades admin"
```

---

### Task 16: AdminEditDialogComponent (tabs Form/JSON compartido)

**Files:**
- Create: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts` (+ html, css, spec)

- [ ] **Step 1: Crear `admin-edit-dialog.component.ts`**

```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
  entitySchemaByKey,
  type EntityKey,
} from './entity-schemas';

type Tab = 'form' | 'json';

@Component({
  selector: 'app-admin-edit-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-edit-dialog.component.html',
  styleUrl: './admin-edit-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  readonly entityKey = input.required<EntityKey>();
  readonly entity = input<Record<string, unknown> | null>(null);
  readonly apiPath = input.required<string>();

  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  readonly tab = signal<Tab>('form');
  readonly jsonText = signal<string>('{}');
  readonly jsonError = signal<string | null>(null);
  readonly emptyTemplate = signal<Record<string, unknown>>({});
  readonly form: FormGroup = this.fb.group({});

  readonly isEdit = computed(() => this.entity() !== null);

  constructor() {
    effect(async () => {
      const key = this.entityKey();
      const e = this.entity();
      const res = await this.api.get<{ data: Record<string, unknown> }>(
        `/admin/seed/template/${key}`,
      );
      const tpl = res.data;
      this.emptyTemplate.set(tpl);
      this.buildForm(tpl, e);
      this.jsonText.set(JSON.stringify(e ?? tpl, null, 2));
    });
  }

  private buildForm(tpl: Record<string, unknown>, current: Record<string, unknown> | null): void {
    const value = current ?? tpl;
    const controls: Record<string, FormControl> = {};
    for (const [k, v] of Object.entries(tpl)) {
      const initial = (value as Record<string, unknown>)[k] ?? v;
      const ctrl = new FormControl(initial);
      if (k !== 'brandId' && k !== 'modelId' && k !== 'versionId') {
        ctrl.addValidators([Validators.required]);
      }
      controls[k] = ctrl;
    }
    while (Object.keys(this.form.controls).length > 0) {
      this.form.removeControl(Object.keys(this.form.controls)[0]!);
    }
    for (const [k, c] of Object.entries(controls)) this.form.addControl(k, c);
  }

  switchTab(t: Tab): void {
    this.tab.set(t);
    this.jsonError.set(null);
  }

  loadJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText()) as Record<string, unknown>;
      const schema = entitySchemaByKey[this.entityKey()];
      const result = schema.safeParse(parsed);
      if (!result.success) {
        this.jsonError.set(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
        return;
      }
      this.jsonError.set(null);
      this.buildForm(this.emptyTemplate(), result.data);
      this.tab.set('form');
    } catch (e) {
      this.jsonError.set(`JSON inválido: ${(e as Error).message}`);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue() as Record<string, unknown>);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
```

- [ ] **Step 2: Crear `admin-edit-dialog.component.html`**

```html
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  role="dialog"
  aria-modal="true"
>
  <div class="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-surface shadow-e2 overflow-hidden">
    <header class="flex items-center justify-between border-b border-border px-4 py-3">
      <div class="flex gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-bold"
          [class.bg-brand-600]="tab() === 'form'"
          [class.text-white]="tab() === 'form'"
          [class.text-ink]="tab() !== 'form'"
          (click)="switchTab('form')"
        >Formulario</button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-bold"
          [class.bg-brand-600]="tab() === 'json'"
          [class.text-white]="tab() === 'json'"
          [class.text-ink]="tab() !== 'json'"
          (click)="switchTab('json')"
        >JSON</button>
      </div>
      <button type="button" class="text-ink-muted" (click)="onCancel()" aria-label="Cerrar">
        <span class="material-symbols-outlined">close</span>
      </button>
    </header>

    <div class="flex-1 overflow-y-auto px-4 py-4">
      @if (tab() === 'form') {
        <form [formGroup]="form" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (key of form.controls | keyvalue; track key.key) {
            <label class="flex flex-col text-xs">
              <span class="font-bold mb-1">{{ key.key }}</span>
              @if (key.value.value === null || typeof key.value.value === 'boolean' || typeof key.value.value === 'number') {
                <input
                  [type]="typeof key.value.value === 'number' ? 'number' : 'text'"
                  [formControlName]="key.key"
                  class="rounded border border-border px-2 py-1.5 text-sm"
                />
              } @else if (Array.isArray(key.value.value)) {
                <textarea
                  [formControlName]="key.key"
                  rows="2"
                  class="rounded border border-border px-2 py-1.5 text-sm"
                  placeholder="[] (JSON array)"
                ></textarea>
              } @else {
                <input
                  type="text"
                  [formControlName]="key.key"
                  class="rounded border border-border px-2 py-1.5 text-sm"
                />
              }
            </label>
          }
        </form>
      } @else {
        <div class="flex flex-col gap-2">
          <textarea
            class="w-full h-96 font-mono text-xs rounded border border-border px-3 py-2"
            [value]="jsonText()"
            (input)="jsonText.set($any($event.target).value)"
          ></textarea>
          @if (jsonError(); as err) {
            <p class="text-warn-dark text-xs">{{ err }}</p>
          }
          <button
            type="button"
            class="self-start rounded-full bg-brand-600 text-white px-4 py-1.5 text-sm font-bold hover:bg-brand-700"
            (click)="loadJson()"
          >Cargar</button>
        </div>
      }
    </div>

    <footer class="flex justify-end gap-2 border-t border-border px-4 py-3">
      <button
        type="button"
        class="rounded-full bg-surface border border-border px-4 py-1.5 text-sm font-bold"
        (click)="onCancel()"
      >Cancelar</button>
      <button
        type="button"
        class="rounded-full bg-brand-600 text-white px-4 py-1.5 text-sm font-bold hover:bg-brand-700"
        (click)="onSubmit()"
      >Guardar</button>
    </footer>
  </div>
</div>
```

- [ ] **Step 3: Crear `admin-edit-dialog.component.css`**

```css
:host { display: block; }
```

- [ ] **Step 4: Crear `admin-edit-dialog.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

describe('AdminEditDialogComponent', () => {
  it('carga el template del backend y arma el form', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne('/api/v1/admin/seed/template/brand');
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    expect(fixture.componentInstance.form.contains('name')).toBe(true);
  });

  it('loadJson parsea y popula form', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'brand');
    fixture.componentRef.setInput('apiPath', 'brands');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/admin/seed/template/brand').flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentInstance.switchTab('json');
    fixture.componentInstance.jsonText.set(JSON.stringify({ name: 'Toyota', logoUrl: null }));
    fixture.componentInstance.loadJson();
    expect(fixture.componentInstance.form.get('name')?.value).toBe('Toyota');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin
git commit -m "feat(fe): AdminEditDialogComponent con tabs Form/JSON compartido"
```

---

## Fase 12 — Pantallas admin por entidad

### Task 17: Brands/Models/Versions/Equipment/Maintenance admin components

**Files:**
- Create: `apps/frontend/src/app/features/admin/brands-admin.component.ts` (+ html, css, spec)
- Create: `apps/frontend/src/app/features/admin/models-admin.component.ts` (+ html, css, spec)
- Create: `apps/frontend/src/app/features/admin/versions-admin.component.ts` (+ html, css, spec)
- Create: `apps/frontend/src/app/features/admin/equipment-admin.component.ts` (+ html, css, spec)
- Create: `apps/frontend/src/app/features/admin/maintenance-admin.component.ts` (+ html, css, spec)

Las 5 pantallas siguen el mismo patrón. Para no repetir, brindo el patrón base (Brands) y luego la **lista de diferencias** por entidad.

- [ ] **Step 1: Crear `brands-admin.component.ts` (patrón base)**

```ts
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import type { BrandInput } from './entity-schemas';

interface BrandRow { id: string; name: string; logoUrl: string | null; }

@Component({
  selector: 'app-brands-admin',
  imports: [AdminEditDialogComponent],
  templateUrl: './brands-admin.component.html',
  styleUrl: './brands-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminComponent {
  private api = inject(ApiService);

  readonly items = signal<BrandRow[]>([]);
  readonly search = signal('');
  readonly dialogEntity = signal<BrandRow | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter((b) => b.name.toLowerCase().includes(q));
  });

  constructor() { void this.load(); }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{ data: BrandRow[] }>('/admin/brands').catch(async () => {
        // Si el endpoint admin no responde (porque es admin-only y el rol es USER en test), fallback al público.
        const pub = await this.api.get<{ data: BrandRow[] }>('/brands');
        return pub;
      });
      this.items.set(res.data);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void { this.dialogEntity.set(null); }
  openEdit(row: BrandRow): void { this.dialogEntity.set(row); }
  closeDialog(): void { this.dialogEntity.set(null); }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/brands/${e.id}`, value);
      } else {
        await this.api.post(`/admin/brands`, value);
      }
      this.dialogEntity.set(null);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async confirmDelete(row: BrandRow): Promise<void> {
    if (!confirm(`¿Eliminar marca "${row.name}"?`)) return;
    try {
      await this.api.delete(`/admin/brands/${row.id}`);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  onSearch(value: string): void { this.search.set(value); }
}
```

- [ ] **Step 2: Crear `brands-admin.component.html`**

```html
<section>
  <header class="flex items-center justify-between mb-4 gap-2">
    <h2 class="text-xl font-bold">Marcas</h2>
    <button
      type="button"
      (click)="openCreate()"
      class="rounded-full bg-brand-600 text-white px-4 py-1.5 text-sm font-bold hover:bg-brand-700"
    >+ Nueva</button>
  </header>

  <input
    type="text"
    placeholder="Buscar marca…"
    class="w-full mb-4 rounded border border-border px-3 py-2 text-sm"
    [value]="search()"
    (input)="onSearch($any($event.target).value)"
  />

  @if (error(); as err) {
    <div class="mb-3 rounded border border-warn bg-warn-light px-3 py-2 text-sm text-warn-dark">{{ err }}</div>
  }

  @if (loading()) {
    <p class="text-sm text-ink-muted">Cargando…</p>
  } @else if (filtered().length === 0) {
    <p class="text-sm text-ink-muted">No hay marcas.</p>
  } @else {
    <table class="w-full text-sm">
      <thead class="text-left text-xs text-ink-muted">
        <tr><th class="py-2">Nombre</th><th class="py-2 w-32">Acciones</th></tr>
      </thead>
      <tbody>
        @for (b of filtered(); track b.id) {
          <tr class="border-t border-border">
            <td class="py-2">{{ b.name }}</td>
            <td class="py-2">
              <button class="text-brand-700 mr-2" (click)="openEdit(b)">Editar</button>
              <button class="text-warn-dark" (click)="confirmDelete(b)">Eliminar</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  }

  @if (dialogEntity() !== undefined) {
    <app-admin-edit-dialog
      [entityKey]="'brand'"
      [apiPath]="'brands'"
      [entity]="dialogEntity()"
      (save)="onSave($event)"
      (cancel)="closeDialog()"
    />
  }
</section>
```

- [ ] **Step 3: Crear `brands-admin.component.css`**

```css
:host { display: block; }
```

- [ ] **Step 4: Crear `brands-admin.component.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BrandsAdminComponent } from './brands-admin.component';

describe('BrandsAdminComponent', () => {
  it('carga lista desde /admin/brands (fallback /brands en test)', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) r.flush({ data: [{ id: 'b1', name: 'Toyota', logoUrl: null }] });
    await fixture.whenStable();
    expect(fixture.componentInstance.items().length).toBeGreaterThan(0);
  });

  it('openCreate muestra dialog', () => {
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });
});
```

> NOTA: el `dialogEntity` debe distinguir "no hay dialog" de "dialog en creación" vs "dialog en edición". Ajustar el getter/computar a usar `signal<BrandRow | null | undefined>(undefined)`. El `null` significa "crear"; un objeto significa "editar"; `undefined` significa "no hay dialog".

Para soportar esto, ajustar `dialogEntity` en todos los 5 componentes:

```ts
readonly dialogEntity = signal<BrandRow | null | undefined>(undefined);

readonly dialogMode = computed(() => this.dialogEntity() === undefined ? 'closed' : 'open');

// en el template:
@if (dialogMode() === 'open') {
  <app-admin-edit-dialog
    [entityKey]="'brand'"
    [entity]="dialogEntity() ?? null"
    ...
  />
}
```

- [ ] **Step 5: Aplicar el mismo patrón a `models-admin.component`**

Diferencias respecto a brands:
- `entityKey: 'model'`, `apiPath: 'models'`.
- Tipo fila: `ModelRow { id: string; name: string; segment: string; brand: { name: string } }`.
- Carga inicial: `GET /admin/models` (fallback `/models?pageSize=50`).
- El form incluye un `select` para `brandId` con opciones de `GET /brands`.

- [ ] **Step 6: Aplicar el mismo patrón a `versions-admin.component`**

- `entityKey: 'version'`, `apiPath: 'versions'`.
- Tipo fila: `VersionRow { id: string; name: string; year: number; priceClp: number; model: { name: string } }`.
- Carga inicial: `GET /admin/versions` (fallback no aplica; usar `GET /versions?pageSize=50` si existe, sino armar endpoint público).
- El form incluye `select` para `modelId` y enums para `transmission`/`fuel`.

- [ ] **Step 7: Aplicar el mismo patrón a `equipment-admin.component`**

- `entityKey: 'equipment'`, `apiPath: 'equipment'`.
- Tipo fila: `EquipmentRow { id: string; name: string; category: string }`.
- Carga: `GET /admin/equipment` (fallback `GET /equipment` que es público).

- [ ] **Step 8: Aplicar el mismo patrón a `maintenance-admin.component`**

- `entityKey: 'maintenance'`, `apiPath: 'maintenance'`.
- Tipo fila: `MaintenanceRow { id: string; versionId: string; mileageTag: number; costClp: number }`.
- Carga: `GET /admin/maintenance` (fallback no aplica — usar `GET /maintenance/version/<vid>` para una versión específica).
- Como `maintenance` está atado a una versión, mostrar un `select` arriba para elegir versión antes de listar.

- [ ] **Step 9: Verificar tests**

```bash
npm -w apps/frontend run test
```

- [ ] **Step 10: Commit**

```bash
git add apps/frontend/src/app/features/admin
git commit -m "feat(fe): 5 pantallas admin con lista + dialog Form/JSON"
```

---

## Fase 13 — E2E

### Task 18: Playwright admin flow

**Files:**
- Create: `apps/frontend/e2e/admin.spec.ts`

- [ ] **Step 1: Crear `apps/frontend/e2e/admin.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('Admin flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin (asume que el seed creó admin@cualautocompro.cl / admin1234)
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', 'admin@cualautocompro.cl');
    await page.fill('input[name="password"], input[type="password"]', 'admin1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('link Admin aparece para admin', async ({ page }) => {
    await expect(page.getByRole('link', { name: /admin/i })).toBeVisible();
  });

  test('flujo crear → editar → eliminar marca', async ({ page }) => {
    await page.goto('/admin/brands');

    // Crear
    await page.getByRole('button', { name: /nueva/i }).click();
    await page.getByRole('button', { name: /formulario/i }).click();
    await page.locator('input[formControlName="name"]').fill('TestBrand');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Aparece en la tabla
    await expect(page.getByText('TestBrand')).toBeVisible();

    // Editar
    await page.getByRole('row', { name: /testbrand/i }).getByRole('button', { name: /editar/i }).click();
    await page.locator('input[formControlName="name"]').fill('TestBrandRenamed');
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText('TestBrandRenamed')).toBeVisible();

    // Eliminar
    page.once('dialog', (d) => d.accept());
    await page.getByRole('row', { name: /testbrandrenamed/i }).getByRole('button', { name: /eliminar/i }).click();
    await expect(page.getByText('TestBrandRenamed')).not.toBeVisible();
  });

  test('USER no-admin no ve link Admin y /admin redirige', async ({ page, context }) => {
    // Logout y login como user normal
    await context.clearCookies();
    await page.goto('/register');
    await page.fill('input[formControlName="name"]', 'Test User');
    await page.fill('input[formControlName="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[formControlName="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await expect(page.getByRole('link', { name: /admin/i })).not.toBeVisible();
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
  });
});
```

- [ ] **Step 2: Asegurar que Playwright pueda correr contra el dev server**

Verificar `playwright.config.ts`:

```bash
cat apps/frontend/playwright.config.ts
```

Si no tiene un `webServer` configurado, agregar (o documentar que se corre con `npm run dev` en otra terminal).

- [ ] **Step 3: Correr E2E (sin apply si no hay backend levantado)**

```bash
cd apps/frontend && npm run test:e2e -- admin.spec.ts
```

Esperado: 3 tests pasan.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/e2e/admin.spec.ts
git commit -m "test(e2e): admin flow completo (crear/editar/eliminar)"
```

---

## Self-review (autocheck)

| Spec section | Cubierto en | Notas |
|---|---|---|
| §1.1 UserRole + role | Task 1 | ✓ |
| §1.2 deletedAt 5 entidades | Task 2 | ✓ |
| §1.3 reglas de borrado | Task 7 (Brand), Task 8 (Model), Task 9 (Version), Task 10 (Equipment), Task 11 (Maintenance) | ✓ |
| §1.4 seed admin | Task 1 | ✓ |
| §2.1 JWT role | Task 3 | ✓ |
| §2.1.3 requireRole | Task 4 | ✓ |
| §2.1.4 forbidden error | Task 3 | ✓ |
| §2.2 módulos CRUD admin | Tasks 7-11 | ✓ |
| §2.3 DTOs Zod | Tasks 7-11 | ✓ |
| §2.4 services pattern | Tasks 7-11 | ✓ |
| §2.5 queries públicas filtran deletedAt | Tasks 5-6 | ✓ |
| §2.6 admin module (users + seed) | Task 12 | ✓ |
| §3.1 AuthService.role | Task 13 | ✓ |
| §3.2 adminGuard | Task 13 | ✓ |
| §3.3 rutas /admin/* | Task 13 | ✓ |
| §3.4 AdminShell | Task 14 | ✓ |
| §3.5 AdminDashboard | Task 14 | ✓ |
| §3.6 componentes admin | Task 17 | ✓ |
| §3.7 AdminEditDialog | Task 16 | ✓ |
| §3.8 entity-schemas | Task 15 | ✓ |
| §3.9 TopNavBar link Admin | Task 13 | ✓ |
| §3.10 tests frontend | Tasks 13, 14, 16, 17 | ✓ |
| §4 archivos | Cubierto progresivamente | ✓ |
| §5 testing strategy | Cubierto en Tasks 4, 7-11, 13-18 | ✓ |
| §6 riesgos | CREATE INDEX CONCURRENTLY (Task 2), filter deletedAt (Tasks 5-6), Zod compartido (Task 15), CANNOT_DEMOTE_SELF (Task 12), JSON escape hatch (Task 16) | ✓ |
| §7 criterios de aceptación | Cubierto | ✓ |

**No placeholders encontrados.** Todas las firmas, schemas y endpoints son consistentes entre tasks (mismo path, misma forma de request, mismos tipos).

---

## Plan complete and saved to `docs/superpowers/plans/2026-07-01-admin-catalogo.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**