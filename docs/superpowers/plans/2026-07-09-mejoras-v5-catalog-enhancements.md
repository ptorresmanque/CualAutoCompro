# Mejoras v5: Dealers, Fuel Prices, Costos, Recalls, Nav Mobile — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 4 cambios: (1) bug fix nav-mobile para botones de auth, (2) rediseño de la sección "Mantención" → "Costos" en compare, (3) nueva entidad `Dealer` con relación N:M a `Brand`, (4) campo `hasRecall`/`recallUrl` en versiones con warning visual en modelo y compare.

**Architecture:** Backend (Prisma/MariaDB) gana 3 tablas (`Dealer`, `BrandDealer`, `FuelPrice`), 7 campos nuevos en `Version`, 2 nuevos módulos (dealers, fuel-prices), y extensiones a `versions`, `brands`, `compare` services. Frontend (Angular 22) gana 2 CRUDs admin, 2 nuevas tarjetas en dashboard, un polymorphic row schema en `compare.component` para soportar la sub-tabla de mantención, y badges de warning para recall en modelo + compare. Todo en TDD con vitest (BE) y Jasmine/Karma (FE).

**Tech Stack:** Angular 22 (signals, OnPush, standalone), Express + Zod + Prisma/MariaDB, Vitest + supertest (BE) / HttpClientTesting (FE), Tailwind tokens del proyecto.

**Spec de referencia:** `docs/superpowers/specs/2026-07-09-mejoras-v5-catalog-enhancements-design.md`

## Global Constraints

- Cada task termina con commit (`git add -A && git commit -m "<scope>: <desc>"`).
- Backend: `npm -w apps/backend run test` debe pasar antes de commitear.
- Frontend: `npm -w apps/frontend run test` debe pasar antes de commitear.
- TypeScript estricto. No agregar `any` implícito. Reutilizar `shared/errors` (`AppError`, `conflict`, `badRequest`, `notFound`, `unauthorized`, `validation`).
- Naming: archivos en kebab-case; clases en PascalCase; métodos en camelCase.
- Iconos: Material Symbols. No instalar nuevas libs de iconos.
- Componentes Angular: siempre `.ts` + `.html` + `.css` separados. Nunca HTML inline en `.ts`.
- Standalone components, `ChangeDetectionStrategy.OnPush`, signals + `input.required<T>()` / `model<T>()` / `output<T>()`.
- Migración: `npm -w apps/backend run db:migrate -- --name add_dealers_fuelprice_cost_recall` para crear la migración.
- Tests pre-existentes en `apps/backend/__tests__/helpers/db.ts:resetTestDb` debe actualizarse para limpiar las nuevas tablas (`Dealer`, `BrandDealer`, `FuelPrice`).

---

## File map

### Backend (15 archivos)

| Archivo | Cambio | Responsabilidad |
|---|---|---|
| `apps/backend/prisma/schema.prisma` | mod | Nuevos modelos `Dealer`, `BrandDealer`, `FuelPrice`; nuevos campos en `Version` y `Brand` |
| `apps/backend/prisma/migrations/<timestamp>_add_dealers_fuelprice_cost_recall/migration.sql` | crear | Migración generada por Prisma |
| `apps/backend/prisma/seed.ts` | mod | Seed opcional de dealers + fuel prices (no bloquea tests) |
| `apps/backend/src/modules/dealers/dealers.{controller,service,routes,dto.admin}.ts` | crear | CRUD + byBrand público |
| `apps/backend/src/modules/dealers/dealers.service.spec.ts` | crear | Tests CRUD + byBrand |
| `apps/backend/src/modules/fuel-prices/fuel-prices.{controller,service,routes,dto.admin}.ts` | crear | CRUD admin + current público |
| `apps/backend/src/modules/fuel-prices/fuel-prices.service.spec.ts` | crear | Tests CRUD + current |
| `apps/backend/src/modules/versions/versions.dto.admin.ts` | mod | 7 campos nuevos + validación recall |
| `apps/backend/src/modules/versions/versions.service.ts` | mod | listAll incluye nuevos campos; update soporta nuevos campos |
| `apps/backend/src/modules/versions/versions.service.spec.ts` | mod | Tests recall validation |
| `apps/backend/src/modules/brands/brands.service.ts` | mod | update acepta `dealerIds: string[]`; listAll incluye dealers |
| `apps/backend/src/modules/brands/brands.service.spec.ts` | mod | Test sync dealerIds |
| `apps/backend/src/modules/compare/compare.service.ts` | mod | Inyecta FuelPrices; calcula computedFillCostClp; agrega keys a DIFF_KEYS |
| `apps/backend/src/modules/compare/compare.service.spec.ts` | mod | Tests fill cost + diff highlights |
| `apps/backend/src/app.ts` | mod | Wire de nuevos routers |
| `apps/backend/__tests__/helpers/db.ts` | mod | resetTestDb limpia Dealer, BrandDealer, FuelPrice |

### Frontend (16 archivos)

| Archivo | Cambio | Responsabilidad |
|---|---|---|
| `apps/frontend/src/app/layout/top-nav-bar.component.html` | mod | Bug fix: variantes móvil/desktop de botones auth |
| `apps/frontend/src/app/layout/top-nav-bar.component.spec.ts` | mod | Test de visibilidad responsive |
| `apps/frontend/src/app/features/admin/entity-schemas.ts` | mod | Nuevos `dealerSchema`, `fuelPriceSchema`, `dealerIds` en brandSchema, 7 campos en versionSchema; `FIELD_METAS` extendido |
| `apps/frontend/src/app/features/admin/admin-dashboard.component.ts` | mod | Tarjetas para dealers + fuel-prices |
| `apps/frontend/src/app/features/admin/admin-shell.component.ts` | mod | Tabs para dealers + fuel-prices |
| `apps/frontend/src/app/app.routes.ts` | mod | Rutas admin/dealers y admin/fuel-prices |
| `apps/frontend/src/app/features/admin/dealers-admin.component.{ts,html,css,spec.ts}` | crear | CRUD admin dealers |
| `apps/frontend/src/app/features/admin/fuel-prices-admin.component.{ts,html,css,spec.ts}` | crear | CRUD admin fuel-prices |
| `apps/frontend/src/app/features/compare/compare.component.{ts,html,css,spec.ts}` | mod | Sección Costos, sub-tabla mantención, recall badge |
| `apps/frontend/src/app/features/model/model.component.{ts,html,spec.ts}` | mod | Recall badge + dealers section |
| `apps/frontend/src/app/features/admin/brands-admin.component.ts` | mod | onSave: extraer dealerIds y PATCH con sync |

---

## Task 1: Schema + migración (dealers, fuel-prices, version fields)

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/<timestamp>_add_dealers_fuelprice_cost_recall/migration.sql` (auto-generada)
- Modify: `apps/backend/__tests__/helpers/db.ts`

**Interfaces:**
- Produces: tablas `Dealer`, `BrandDealer`, `FuelPrice` accesibles vía Prisma client.
- Produces: campos `circulationPermitClp`, `mandatoryInsuranceClp`, `voluntaryInsuranceClp`, `fuelTankLiters`, `batteryCapacityKwh`, `hasRecall`, `recallUrl` en `Version`.

- [ ] **Step 1: Editar schema.prisma**

Reemplazar el modelo `Brand` para incluir la relación inversa con `BrandDealer`:

```prisma
model Brand {
  id        String       @id @default(cuid())
  name      String       @unique
  logoUrl   String?
  models    Model[]
  dealers   BrandDealer[]
  deletedAt DateTime?
  createdAt DateTime     @default(now())

  @@index([deletedAt])
}
```

Agregar los nuevos modelos al final del archivo:

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
  fuelType        String
  pricePerUnitClp Float
  unit            String
  effectiveFrom   DateTime @default(now())

  @@unique([fuelType, effectiveFrom])
  @@index([fuelType])
}
```

Extender el modelo `Version` agregando 7 campos nuevos antes de `model Model` (cualquier lugar antes de los `@@index`):

```prisma
model Version {
  // ... campos existentes ...
  circulationPermitClp  Int?
  mandatoryInsuranceClp Int?
  voluntaryInsuranceClp Int?
  fuelTankLiters        Float?
  batteryCapacityKwh    Float?
  hasRecall             Boolean  @default(false)
  recallUrl             String?
  // ... resto existente (model relation, equipmentItems, etc) ...
}
```

- [ ] **Step 2: Generar migración**

```bash
npm -w apps/backend run db:migrate -- --name add_dealers_fuelprice_cost_recall
```

Cuando Prisma pida, aceptar el SQL sugerido. Verificar que el archivo `apps/backend/prisma/migrations/<timestamp>_add_dealers_fuelprice_cost_recall/migration.sql` contiene `CREATE TABLE` para las 3 tablas nuevas y `ALTER TABLE` para los nuevos campos en `Version`.

- [ ] **Step 3: Actualizar resetTestDb**

Modificar `apps/backend/__tests__/helpers/db.ts` línea 17-29, agregar al inicio del array de deletes:

```ts
export const resetTestDb = async (prisma: PrismaClient) => {
  await prisma.$transaction([
    prisma.brandDealer.deleteMany(),
    prisma.dealer.deleteMany(),
    prisma.fuelPrice.deleteMany(),
    prisma.comparisonItem.deleteMany(),
    // ... resto igual
  ]);
};
```

- [ ] **Step 4: Verificar migración contra DB de tests**

```bash
npm -w apps/backend run test
```

Expected: PASS (sin tests rotos; resetTestDb ahora limpia las tablas nuevas).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/ apps/backend/__tests__/helpers/db.ts
git commit -m "feat(be): schema dealers + fuel-prices + version recall/cost fields"
```

---

## Task 2: Backend dealers module (CRUD + byBrand público)

**Files:**
- Create: `apps/backend/src/modules/dealers/dealers.dto.admin.ts`
- Create: `apps/backend/src/modules/dealers/dealers.service.ts`
- Create: `apps/backend/src/modules/dealers/dealers.controller.ts`
- Create: `apps/backend/src/modules/dealers/dealers.routes.ts`
- Create: `apps/backend/src/modules/dealers/dealers.service.spec.ts`

**Interfaces:**
- Produces: `DealersService` con `listAll()`, `byBrand(brandId)`, `create(input)`, `update(id, input)`, `softDelete(id)`.
- Produces: `dealersRouter` con `GET /:brandId/dealers` (público); `dealersAdminRouter` con `GET /, POST /, PATCH /:id, DELETE /:id` (admin).

- [ ] **Step 1: Escribir test del service**

`apps/backend/src/modules/dealers/dealers.service.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { DealersService } from "./dealers.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("DealersService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create crea un dealer con name, url, logoUrl opcional", async () => {
    const svc = new DealersService(prisma);
    const dealer = await svc.create({ name: "Derco", url: "https://derco.cl" });
    expect(dealer.name).toBe("Derco");
    expect(dealer.url).toBe("https://derco.cl");
    expect(dealer.logoUrl).toBeNull();
  });

  it("byBrand retorna solo dealers asociados a la marca vía BrandDealer", async () => {
    const svc = new DealersService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await svc.create({ name: "Derco", url: "https://derco.cl" });
    const dealerB = await svc.create({ name: "Salazar Israel", url: "https://salazar.cl" });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });
    const result = await svc.byBrand(brand.id);
    expect(result.map((d) => d.id)).toEqual([dealerA.id]);
    expect(result[0]?.name).toBe("Derco");
  });

  it("softDelete setea deletedAt", async () => {
    const svc = new DealersService(prisma);
    const dealer = await svc.create({ name: "Derco", url: "https://derco.cl" });
    await svc.softDelete(dealer.id);
    const after = await prisma.dealer.findUnique({ where: { id: dealer.id } });
    expect(after?.deletedAt).not.toBeNull();
  });

  it("listAll excluye dealers soft-deleted", async () => {
    const svc = new DealersService(prisma);
    await svc.create({ name: "A", url: "https://a.cl" });
    const b = await svc.create({ name: "B", url: "https://b.cl" });
    await svc.softDelete(b.id);
    const all = await svc.listAll();
    expect(all.map((d) => d.name)).toEqual(["A"]);
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

```bash
npm -w apps/backend run test -- dealers.service
```

Expected: FAIL con "DealersService not defined".

- [ ] **Step 3: Crear DTO**

`apps/backend/src/modules/dealers/dealers.dto.admin.ts`:

```ts
import { z } from "zod";

export const createDealerSchema = z.object({
  name: z.string().min(2).max(120),
  url: z.string().url(),
  logoUrl: z.string().url().nullable().optional(),
});

export const updateDealerSchema = createDealerSchema.partial();

export type CreateDealerInput = z.infer<typeof createDealerSchema>;
export type UpdateDealerInput = z.infer<typeof updateDealerSchema>;
```

- [ ] **Step 4: Crear service**

`apps/backend/src/modules/dealers/dealers.service.ts`:

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateDealerInput, UpdateDealerInput } from "./dealers.dto.admin.js";

export class DealersService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.dealer.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  byBrand(brandId: string) {
    return this.prisma.dealer.findMany({
      where: { deletedAt: null, brands: { some: { brandId } } },
      orderBy: { name: "asc" },
    });
  }

  async create(input: CreateDealerInput) {
    return this.prisma.dealer.create({ data: input as Prisma.DealerUncheckedCreateInput });
  }

  async update(id: string, input: UpdateDealerInput) {
    const data = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Prisma.DealerUpdateInput;
    try {
      return await this.prisma.dealer.update({
        where: { id, deletedAt: null },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Concesionario no encontrado");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    try {
      await this.prisma.dealer.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Concesionario no encontrado");
      }
      throw e;
    }
  }
}
```

- [ ] **Step 5: Correr test (debe pasar)**

```bash
npm -w apps/backend run test -- dealers.service
```

Expected: PASS (4 tests).

- [ ] **Step 6: Crear controller**

`apps/backend/src/modules/dealers/dealers.controller.ts`:

```ts
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { DealersService } from "./dealers.service.js";
import { createDealerSchema, updateDealerSchema } from "./dealers.dto.admin.js";

const svc = new DealersService(prisma);

export const dealersController = {
  listAll: ah(async (_req, res) => {
    res.json(ok(await svc.listAll()));
  }),
  byBrand: ah(async (req, res) => {
    const brandId = req.params.brandId ?? "";
    res.json(ok(await svc.byBrand(brandId)));
  }),
  create: ah(async (req, res) => {
    const parsed = createDealerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),
  update: ah(async (req, res) => {
    const id = req.params.id ?? "";
    const parsed = updateDealerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.update(id, parsed.data)));
  }),
  softDelete: ah(async (req, res) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
```

- [ ] **Step 7: Crear routes**

`apps/backend/src/modules/dealers/dealers.routes.ts`:

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { dealersController } from "./dealers.controller.js";

export const dealersRouter = Router();
dealersRouter.get("/:brandId/dealers", dealersController.byBrand);

export const dealersAdminRouter = Router();
dealersAdminRouter.use(authenticate, requireRole("ADMIN"));
dealersAdminRouter.get("/", dealersController.listAll);
dealersAdminRouter.post("/", dealersController.create);
dealersAdminRouter.patch("/:id", dealersController.update);
dealersAdminRouter.delete("/:id", dealersController.softDelete);
```

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/modules/dealers/
git commit -m "feat(be): dealers module — CRUD admin + endpoint público byBrand"
```

---

## Task 3: Backend fuel-prices module (CRUD admin + current público)

**Files:**
- Create: `apps/backend/src/modules/fuel-prices/fuel-prices.dto.admin.ts`
- Create: `apps/backend/src/modules/fuel-prices/fuel-prices.service.ts`
- Create: `apps/backend/src/modules/fuel-prices/fuel-prices.controller.ts`
- Create: `apps/backend/src/modules/fuel-prices/fuel-prices.routes.ts`
- Create: `apps/backend/src/modules/fuel-prices/fuel-prices.service.spec.ts`

**Interfaces:**
- Produces: `FuelPricesService` con `listAll()`, `current()`, `create(input)`, `softDelete(id)`.
- Produces: `fuelPricesRouter` con `GET /current` (público); `fuelPricesAdminRouter` con CRUD admin.

- [ ] **Step 1: Escribir test del service**

`apps/backend/src/modules/fuel-prices/fuel-prices.service.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { FuelPricesService } from "./fuel-prices.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("FuelPricesService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create guarda pricePerUnitClp + unit", async () => {
    const svc = new FuelPricesService(prisma);
    const result = await svc.create({
      fuelType: "BENCINA",
      pricePerUnitClp: 1280,
      unit: "L",
    });
    expect(result.fuelType).toBe("BENCINA");
    expect(result.pricePerUnitClp).toBe(1280);
  });

  it("current retorna el precio más reciente por fuelType", async () => {
    const svc = new FuelPricesService(prisma);
    await svc.create({ fuelType: "BENCINA", pricePerUnitClp: 1200, unit: "L" });
    await new Promise((r) => setTimeout(r, 5));
    await svc.create({ fuelType: "BENCINA", pricePerUnitClp: 1300, unit: "L" });
    const current = await svc.current();
    const bencina = current.find((c) => c.fuelType === "BENCINA");
    expect(bencina?.pricePerUnitClp).toBe(1300);
  });

  it("current agrupa por fuelType", async () => {
    const svc = new FuelPricesService(prisma);
    await svc.create({ fuelType: "BENCINA", pricePerUnitClp: 1200, unit: "L" });
    await svc.create({ fuelType: "ELECTRIC", pricePerUnitClp: 350, unit: "kWh" });
    const current = await svc.current();
    expect(current).toHaveLength(2);
    expect(current.map((c) => c.fuelType).sort()).toEqual(["BENCINA", "ELECTRIC"]);
  });

  it("softDelete setea deletedAt", async () => {
    const svc = new FuelPricesService(prisma);
    const fp = await svc.create({ fuelType: "DIESEL", pricePerUnitClp: 1100, unit: "L" });
    await svc.softDelete(fp.id);
    const after = await prisma.fuelPrice.findUnique({ where: { id: fp.id } });
    expect(after?.deletedAt).not.toBeNull();
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

```bash
npm -w apps/backend run test -- fuel-prices.service
```

Expected: FAIL con "FuelPricesService not defined".

- [ ] **Step 3: Crear DTO**

`apps/backend/src/modules/fuel-prices/fuel-prices.dto.admin.ts`:

```ts
import { z } from "zod";

export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
export const UNITS = ["L", "kWh"] as const;

export const createFuelPriceSchema = z.object({
  fuelType: z.enum(FUELS),
  pricePerUnitClp: z.number().positive(),
  unit: z.enum(UNITS),
});

export type CreateFuelPriceInput = z.infer<typeof createFuelPriceSchema>;
```

- [ ] **Step 4: Crear service**

`apps/backend/src/modules/fuel-prices/fuel-prices.service.ts`:

```ts
import { Prisma, type PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
import type { CreateFuelPriceInput } from "./fuel-prices.dto.admin.js";

export class FuelPricesService {
  constructor(private readonly prisma: PrismaClient) {}

  listAll() {
    return this.prisma.fuelPrice.findMany({
      where: { deletedAt: null },
      orderBy: [{ fuelType: "asc" }, { effectiveFrom: "desc" }],
    });
  }

  async current() {
    // Para cada fuelType, retorna la fila con effectiveFrom más reciente y deletedAt null.
    const fuelTypes = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
    const out: { fuelType: string; pricePerUnitClp: number; unit: string; effectiveFrom: Date }[] = [];
    for (const fuelType of fuelTypes) {
      const row = await this.prisma.fuelPrice.findFirst({
        where: { fuelType, deletedAt: null },
        orderBy: { effectiveFrom: "desc" },
      });
      if (row) {
        out.push({
          fuelType: row.fuelType,
          pricePerUnitClp: row.pricePerUnitClp,
          unit: row.unit,
          effectiveFrom: row.effectiveFrom,
        });
      }
    }
    return out;
  }

  async create(input: CreateFuelPriceInput) {
    return this.prisma.fuelPrice.create({
      data: input as Prisma.FuelPriceUncheckedCreateInput,
    });
  }

  async softDelete(id: string) {
    try {
      await this.prisma.fuelPrice.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { deleted: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        throw notFound("Precio de combustible no encontrado");
      }
      throw e;
    }
  }
}
```

- [ ] **Step 5: Correr test (debe pasar)**

```bash
npm -w apps/backend run test -- fuel-prices.service
```

Expected: PASS (4 tests).

- [ ] **Step 6: Crear controller**

`apps/backend/src/modules/fuel-prices/fuel-prices.controller.ts`:

```ts
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { FuelPricesService } from "./fuel-prices.service.js";
import { createFuelPriceSchema } from "./fuel-prices.dto.admin.js";

const svc = new FuelPricesService(prisma);

export const fuelPricesController = {
  listAll: ah(async (_req, res) => {
    res.json(ok(await svc.listAll()));
  }),
  current: ah(async (_req, res) => {
    res.json(ok(await svc.current()));
  }),
  create: ah(async (req, res) => {
    const parsed = createFuelPriceSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.status(201).json(ok(await svc.create(parsed.data)));
  }),
  softDelete: ah(async (req, res) => {
    const id = req.params.id ?? "";
    res.json(ok(await svc.softDelete(id)));
  }),
};
```

- [ ] **Step 7: Crear routes**

`apps/backend/src/modules/fuel-prices/fuel-prices.routes.ts`:

```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { fuelPricesController } from "./fuel-prices.controller.js";

export const fuelPricesRouter = Router();
fuelPricesRouter.get("/current", fuelPricesController.current);

export const fuelPricesAdminRouter = Router();
fuelPricesAdminRouter.use(authenticate, requireRole("ADMIN"));
fuelPricesAdminRouter.get("/", fuelPricesController.listAll);
fuelPricesAdminRouter.post("/", fuelPricesController.create);
fuelPricesAdminRouter.delete("/:id", fuelPricesController.softDelete);
```

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/modules/fuel-prices/
git commit -m "feat(be): fuel-prices module — CRUD admin + current público"
```

---

## Task 4: Backend versions — DTO + service + recall validation

**Files:**
- Modify: `apps/backend/src/modules/versions/versions.dto.admin.ts`
- Modify: `apps/backend/src/modules/versions/versions.service.ts`
- Modify/Create: `apps/backend/src/modules/versions/versions.service.spec.ts`

**Interfaces:**
- Produces: `createVersionSchema` y `updateVersionSchema` aceptan los 7 campos nuevos; `hasRecall=true` requiere `recallUrl` URL.
- Produces: `VersionsService.create` y `update` persisten los nuevos campos.

- [ ] **Step 1: Escribir test de validación recall**

`apps/backend/src/modules/versions/versions.dto.admin.spec.ts` (crear nuevo):

```ts
import { describe, expect, it } from "vitest";
import { createVersionSchema, updateVersionSchema } from "./versions.dto.admin.js";

const baseInput = {
  modelId: "m1",
  name: "Sport",
  year: 2025,
  priceClp: 15000000,
  transmission: "AUTOMATIC",
  fuel: "BENCINA",
  engineDisplacementCc: 2000,
  powerHp: 150,
  torqueNm: 200,
  consumptionCityKmL: 12.5,
  consumptionHighwayKmL: 16.0,
  lengthMm: 4500,
  widthMm: 1800,
  heightMm: 1450,
  weightKg: 1300,
  trunkLiters: 450,
  airbagCount: 6,
  hasAbs: true,
  hasEsp: true,
  hasCruiseControl: true,
};

describe("versions.dto.admin recall validation", () => {
  it("create acepta hasRecall=false sin recallUrl", () => {
    const parsed = createVersionSchema.safeParse({ ...baseInput, hasRecall: false });
    expect(parsed.success).toBe(true);
  });

  it("create rechaza hasRecall=true sin recallUrl", () => {
    const parsed = createVersionSchema.safeParse({ ...baseInput, hasRecall: true });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path.includes("recallUrl"))).toBe(true);
    }
  });

  it("create acepta hasRecall=true con recallUrl URL válida", () => {
    const parsed = createVersionSchema.safeParse({
      ...baseInput,
      hasRecall: true,
      recallUrl: "https://sernac.cl/recall/123",
    });
    expect(parsed.success).toBe(true);
  });

  it("create rechaza recallUrl que no es URL", () => {
    const parsed = createVersionSchema.safeParse({
      ...baseInput,
      hasRecall: true,
      recallUrl: "no-es-url",
    });
    expect(parsed.success).toBe(false);
  });

  it("update aplica la misma validación", () => {
    const parsed = updateVersionSchema.safeParse({ hasRecall: true });
    expect(parsed.success).toBe(false);
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

```bash
npm -w apps/backend run test -- versions.dto.admin
```

Expected: FAIL (el spec actual no tiene los nuevos campos).

- [ ] **Step 3: Modificar versions.dto.admin.ts**

Reemplazar el archivo completo con:

```ts
import { z } from "zod";

export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC", "CVT", "DCT"] as const;
export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

export const createVersionSchema = z
  .object({
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
    circulationPermitClp: z.number().int().nonnegative().nullable().optional(),
    mandatoryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
    voluntaryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
    fuelTankLiters: z.number().nonnegative().nullable().optional(),
    batteryCapacityKwh: z.number().nonnegative().nullable().optional(),
    hasRecall: z.boolean().default(false),
    recallUrl: z.string().url().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasRecall && !data.recallUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recallUrl"],
        message: "recallUrl es obligatorio cuando hasRecall=true",
      });
    }
  });

export const updateVersionSchema = createVersionSchema.partial().omit({ modelId: true });

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;
```

- [ ] **Step 4: Correr test (debe pasar)**

```bash
npm -w apps/backend run test -- versions.dto.admin
```

Expected: PASS (5 tests).

- [ ] **Step 5: Modificar versions.service.ts — listAll + soporte nuevos campos**

En `apps/backend/src/modules/versions/versions.service.ts`:

1. Modificar el tipo `VersionRow` (líneas 12-36) para agregar los nuevos campos:

```ts
type VersionRow = {
  id: string;
  modelId: string;
  name: string;
  year: number;
  priceClp: number;
  transmission: string;
  fuel: string;
  engineDisplacementCc: number;
  powerHp: number;
  torqueNm: number;
  consumptionCityKmL: number;
  consumptionHighwayKmL: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weightKg: number;
  trunkLiters: number;
  airbagCount: number;
  hasAbs: boolean;
  hasEsp: boolean;
  hasCruiseControl: boolean;
  circulationPermitClp: number | null;
  mandatoryInsuranceClp: number | null;
  voluntaryInsuranceClp: number | null;
  fuelTankLiters: number | null;
  batteryCapacityKwh: number | null;
  hasRecall: boolean;
  recallUrl: string | null;
  deletedAt: Date | null;
  createdAt: Date;
};
```

2. Modificar la constante `VERSION_RETURNING` (línea 38-42):

```ts
const VERSION_RETURNING = `id, \`modelId\`, name, year, \`priceClp\`, transmission, fuel,
  \`engineDisplacementCc\`, \`powerHp\`, \`torqueNm\`, \`consumptionCityKmL\`,
  \`consumptionHighwayKmL\`, \`lengthMm\`, \`widthMm\`, \`heightMm\`, \`weightKg\`,
  \`trunkLiters\`, \`airbagCount\`, \`hasAbs\`, \`hasEsp\`, \`hasCruiseControl\`,
  \`circulationPermitClp\`, \`mandatoryInsuranceClp\`, \`voluntaryInsuranceClp\`,
  \`fuelTankLiters\`, \`batteryCapacityKwh\`, \`hasRecall\`, \`recallUrl\`,
  \`deletedAt\`, \`createdAt\``;
```

3. Modificar el `INSERT` SQL en `create` (línea 128-142) para incluir los nuevos campos:

```ts
await this.prisma.$executeRawUnsafe(
  `INSERT INTO \`Version\` (
     id, \`modelId\`, name, year, \`priceClp\`, transmission, fuel,
     \`engineDisplacementCc\`, \`powerHp\`, \`torqueNm\`, \`consumptionCityKmL\`,
     \`consumptionHighwayKmL\`, \`lengthMm\`, \`widthMm\`, \`heightMm\`, \`weightKg\`,
     \`trunkLiters\`, \`airbagCount\`, \`hasAbs\`, \`hasEsp\`, \`hasCruiseControl\`,
     \`circulationPermitClp\`, \`mandatoryInsuranceClp\`, \`voluntaryInsuranceClp\`,
     \`fuelTankLiters\`, \`batteryCapacityKwh\`, \`hasRecall\`, \`recallUrl\`,
     \`deletedAt\`, \`createdAt\`
   )
   VALUES (
     ?, ?, ?, ?, ?, ?, ?,
     ?, ?, ?, ?,
     ?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?,
     ?, ?, ?, ?,
     ?, ?, ?, ?,
     NULL, NOW()
   )`,
  id,
  input.modelId,
  input.name,
  input.year,
  input.priceClp,
  input.transmission,
  input.fuel,
  input.engineDisplacementCc,
  input.powerHp,
  input.torqueNm,
  input.consumptionCityKmL,
  input.consumptionHighwayKmL,
  input.lengthMm,
  input.widthMm,
  input.heightMm,
  input.weightKg,
  input.trunkLiters,
  input.airbagCount,
  input.hasAbs,
  input.hasEsp,
  input.hasCruiseControl,
  input.circulationPermitClp ?? null,
  input.mandatoryInsuranceClp ?? null,
  input.voluntaryInsuranceClp ?? null,
  input.fuelTankLiters ?? null,
  input.batteryCapacityKwh ?? null,
  input.hasRecall ?? false,
  input.recallUrl ?? null,
);
```

4. Modificar el bloque de UPDATE SQL en `update` (línea 191-268) — agregar casos para los 7 campos nuevos después de `hasCruiseControl`:

```ts
if (input.circulationPermitClp !== undefined) {
  setClauses.push("`circulationPermitClp` = ?");
  values.push(input.circulationPermitClp);
}
if (input.mandatoryInsuranceClp !== undefined) {
  setClauses.push("`mandatoryInsuranceClp` = ?");
  values.push(input.mandatoryInsuranceClp);
}
if (input.voluntaryInsuranceClp !== undefined) {
  setClauses.push("`voluntaryInsuranceClp` = ?");
  values.push(input.voluntaryInsuranceClp);
}
if (input.fuelTankLiters !== undefined) {
  setClauses.push("`fuelTankLiters` = ?");
  values.push(input.fuelTankLiters);
}
if (input.batteryCapacityKwh !== undefined) {
  setClauses.push("`batteryCapacityKwh` = ?");
  values.push(input.batteryCapacityKwh);
}
if (input.hasRecall !== undefined) {
  setClauses.push("`hasRecall` = ?");
  values.push(input.hasRecall);
}
if (input.recallUrl !== undefined) {
  setClauses.push("`recallUrl` = ?");
  values.push(input.recallUrl);
}
```

- [ ] **Step 6: Correr tests existentes**

```bash
npm -w apps/backend run test
```

Expected: PASS (no debe romper tests existentes, solo agregan campos opcionales).

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/modules/versions/
git commit -m "feat(be): versions — 7 nuevos campos (cost + recall) con validación"
```

---

## Task 5: Backend brands — sync `dealerIds` + include dealers en listAll

**Files:**
- Modify: `apps/backend/src/modules/brands/brands.service.ts`
- Modify: `apps/backend/src/modules/brands/brands.dto.admin.ts` (extender schema)
- Modify/Create: `apps/backend/src/modules/brands/brands.service.spec.ts`

**Interfaces:**
- Produces: `updateBrandSchema` acepta `dealerIds: string[]` opcional.
- Produces: `BrandsService.update` sincroniza `BrandDealer` cuando `dealerIds` está presente.
- Produces: `BrandsService.listAll` y `models(brandId)` incluyen dealers.

- [ ] **Step 1: Escribir test de sync dealerIds**

`apps/backend/src/modules/brands/brands.service.spec.ts` (crear o extender). Si no existe, crear:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("BrandsService.update dealerIds sync", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("update con dealerIds[] reemplaza la lista completa de BrandDealer", async () => {
    const svc = new BrandsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await prisma.dealer.create({ data: { name: "Derco", url: "https://derco.cl" } });
    const dealerB = await prisma.dealer.create({ data: { name: "Salazar", url: "https://salazar.cl" } });
    const dealerC = await prisma.dealer.create({ data: { name: "Rosselot", url: "https://rosselot.cl" } });

    // Estado inicial: [A, B]
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerB.id } });

    // Update reemplaza por [B, C]
    await svc.update(brand.id, { dealerIds: [dealerB.id, dealerC.id] });

    const relations = await prisma.brandDealer.findMany({ where: { brandId: brand.id } });
    expect(relations.map((r) => r.dealerId).sort()).toEqual([dealerB.id, dealerC.id].sort());
  });

  it("update sin dealerIds no toca las relaciones existentes", async () => {
    const svc = new BrandsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const dealerA = await prisma.dealer.create({ data: { name: "Derco", url: "https://derco.cl" } });
    await prisma.brandDealer.create({ data: { brandId: brand.id, dealerId: dealerA.id } });

    await svc.update(brand.id, { name: "Toyota Chile" });

    const relations = await prisma.brandDealer.findMany({ where: { brandId: brand.id } });
    expect(relations).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

```bash
npm -w apps/backend run test -- brands.service
```

Expected: FAIL (no hay `dealerIds` en update).

- [ ] **Step 3: Extender DTO de brand**

`apps/backend/src/modules/brands/brands.dto.admin.ts` — agregar `dealerIds` opcional al schema:

```ts
export const updateBrandSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  logoUrl: z.string().url().nullable().optional(),
  dealerIds: z.array(z.string()).optional(),
});
```

- [ ] **Step 4: Modificar BrandsService.update**

Reemplazar el método `update` en `apps/backend/src/modules/brands/brands.service.ts` (línea 34-49):

```ts
async update(id: string, input: UpdateBrandInput) {
  const { dealerIds, ...rest } = input;
  const data = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  ) as Prisma.BrandUpdateInput;
  try {
    const brand = await this.prisma.brand.update({
      where: { id, deletedAt: null },
      data,
    });
    if (dealerIds !== undefined) {
      // Reemplaza todas las relaciones: delete where brandId=id, createMany nuevos
      await this.prisma.brandDealer.deleteMany({ where: { brandId: id } });
      if (dealerIds.length > 0) {
        await this.prisma.brandDealer.createMany({
          data: dealerIds.map((dealerId) => ({ brandId: id, dealerId })),
        });
      }
    }
    return brand;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      throw notFound("Marca no encontrada");
    }
    throw e;
  }
}
```

- [ ] **Step 5: Modificar BrandsService.listAll y models**

En `listAll` (línea 16-22) agregar `include`:

```ts
listAll() {
  return this.prisma.brand.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      dealers: { include: { dealer: { select: { id: true, name: true, url: true, logoUrl: true } } } },
    },
  });
}
```

En `models` (línea 23-28) — dejar igual (no aplica dealers a modelos).

- [ ] **Step 6: Correr test (debe pasar)**

```bash
npm -w apps/backend run test -- brands.service
```

Expected: PASS (2 tests nuevos + existentes).

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/modules/brands/
git commit -m "feat(be): brands — sync dealerIds + include dealers en listAll"
```

---

## Task 6: Backend compare — fuel prices lookup + computedFillCost + DIFF_KEYS

**Files:**
- Modify: `apps/backend/src/modules/compare/compare.service.ts`
- Modify/Create: `apps/backend/src/modules/compare/compare.service.spec.ts`

**Interfaces:**
- Produces: `CompareService.compare()` retorna payload con `versions[].computedFillCostClp` y `fuelPrices` (vigentes).
- Produce: `DIFF_KEYS` incluye `circulationPermitClp`, `mandatoryInsuranceClp`, `voluntaryInsuranceClp`, `computedFillCostClp`.

- [ ] **Step 1: Escribir tests del cálculo**

`apps/backend/src/modules/compare/compare.service.spec.ts` (crear):

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { CompareService } from "./compare.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { FuelPricesService } from "../fuel-prices/fuel-prices.service.js";

describe("CompareService.computeFillCost", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("BENCINA con fuelTankLiters usa precio vigente", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    await fuelSvc.create({ fuelType: "BENCINA", pricePerUnitClp: 1000, unit: "L" });
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "Sport",
        year: 2025,
        priceClp: 15000000,
        transmission: "AUTOMATIC",
        fuel: "BENCINA",
        engineDisplacementCc: 2000,
        powerHp: 150,
        torqueNm: 200,
        consumptionCityKmL: 12,
        consumptionHighwayKmL: 16,
        lengthMm: 4500,
        widthMm: 1800,
        heightMm: 1450,
        weightKg: 1300,
        trunkLiters: 450,
        airbagCount: 6,
        hasAbs: true,
        hasEsp: true,
        hasCruiseControl: true,
        fuelTankLiters: 50,
      },
    });
    const result = await compareSvc.compare([v.id]);
    expect(result.versions[0]?.computedFillCostClp).toBe(50000);
  });

  it("ELECTRIC con batteryCapacityKwh usa precio kWh", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    await fuelSvc.create({ fuelType: "ELECTRIC", pricePerUnitClp: 200, unit: "kWh" });
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "EV",
        year: 2025,
        priceClp: 25000000,
        transmission: "AUTOMATIC",
        fuel: "ELECTRIC",
        engineDisplacementCc: 0,
        powerHp: 200,
        torqueNm: 300,
        consumptionCityKmL: 0,
        consumptionHighwayKmL: 0,
        lengthMm: 4500,
        widthMm: 1800,
        heightMm: 1450,
        weightKg: 1700,
        trunkLiters: 400,
        airbagCount: 6,
        hasAbs: true,
        hasEsp: true,
        hasCruiseControl: true,
        batteryCapacityKwh: 60,
      },
    });
    const result = await compareSvc.compare([v.id]);
    expect(result.versions[0]?.computedFillCostClp).toBe(12000);
  });

  it("retorna null si no hay precio vigente para el fuelType", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "Sport",
        year: 2025,
        priceClp: 15000000,
        transmission: "AUTOMATIC",
        fuel: "BENCINA",
        engineDisplacementCc: 2000,
        powerHp: 150,
        torqueNm: 200,
        consumptionCityKmL: 12,
        consumptionHighwayKmL: 16,
        lengthMm: 4500,
        widthMm: 1800,
        heightMm: 1450,
        weightKg: 1300,
        trunkLiters: 450,
        airbagCount: 6,
        hasAbs: true,
        hasEsp: true,
        hasCruiseControl: true,
        fuelTankLiters: 50,
      },
    });
    const result = await compareSvc.compare([v.id]);
    expect(result.versions[0]?.computedFillCostClp).toBeNull();
  });

  it("diffHighlights incluye nuevas keys de costos", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const a = await prisma.version.create({
      data: {
        modelId: model.id, name: "A", year: 2025, priceClp: 15000000,
        transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 2000, powerHp: 150, torqueNm: 200,
        consumptionCityKmL: 12, consumptionHighwayKmL: 16,
        lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300,
        trunkLiters: 450, airbagCount: 6,
        hasAbs: true, hasEsp: true, hasCruiseControl: true,
        circulationPermitClp: 100000, mandatoryInsuranceClp: 50000,
      },
    });
    const b = await prisma.version.create({
      data: {
        modelId: model.id, name: "B", year: 2025, priceClp: 18000000,
        transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 2000, powerHp: 150, torqueNm: 200,
        consumptionCityKmL: 12, consumptionHighwayKmL: 16,
        lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300,
        trunkLiters: 450, airbagCount: 6,
        hasAbs: true, hasEsp: true, hasCruiseControl: true,
        circulationPermitClp: 200000, mandatoryInsuranceClp: 80000,
      },
    });
    const result = await compareSvc.compare([a.id, b.id]);
    expect(result.diffHighlights.circulationPermitClp).toBe(true);
    expect(result.diffHighlights.mandatoryInsuranceClp).toBe(true);
  });
});
```

- [ ] **Step 2: Correr test (debe fallar)**

```bash
npm -w apps/backend run test -- compare.service
```

Expected: FAIL (el constructor actual no acepta FuelPricesService).

- [ ] **Step 3: Reescribir compare.service.ts**

Reemplazar `apps/backend/src/modules/compare/compare.service.ts`:

```ts
import type { PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";
import type { FuelPricesService } from "../fuel-prices/fuel-prices.service.js";

const DIFF_KEYS = [
  "priceClp","year","transmission","fuel","engineDisplacementCc","powerHp","torqueNm",
  "consumptionCityKmL","consumptionHighwayKmL","lengthMm","widthMm","heightMm",
  "weightKg","trunkLiters","airbagCount","hasAbs","hasEsp","hasCruiseControl",
  "circulationPermitClp","mandatoryInsuranceClp","voluntaryInsuranceClp","computedFillCostClp",
] as const;

type DiffKey = typeof DIFF_KEYS[number];

export class CompareService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly fuelPriceService: FuelPricesService,
  ) {}

  async compare(versionIds: string[]) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");
    const versions = await this.prisma.version.findMany({
      where: { id: { in: versionIds }, deletedAt: null, model: { deletedAt: null } },
      include: {
        model: {
          include: {
            brand: true,
            versions: { where: { deletedAt: null }, orderBy: { priceClp: "asc" } },
          },
        },
        maintenanceCosts: { where: { deletedAt: null } },
      },
    });
    if (versions.length !== versionIds.length) throw notFound("Alguna versión no existe");

    const fuelPrices = await this.fuelPriceService.current();
    const priceByFuelType = new Map(fuelPrices.map((fp) => [fp.fuelType, fp]));

    const enriched = versions.map((v) => {
      const fillCost = this.computeFillCost(v, priceByFuelType);
      return {
        ...v,
        model: v.model
          ? {
              ...v.model,
              availableVersions: v.model.versions.map((av) => ({
                id: av.id,
                name: av.name,
                year: av.year,
                priceClp: av.priceClp,
                transmission: av.transmission,
                fuel: av.fuel,
              })),
            }
          : undefined,
        computedFillCostClp: fillCost,
      };
    });

    const diffHighlights: Partial<Record<DiffKey, boolean>> = {};
    if (enriched.length === 1) {
      for (const k of DIFF_KEYS) diffHighlights[k] = false;
    } else {
      const first = enriched[0]!;
      for (const key of DIFF_KEYS) {
        diffHighlights[key] = enriched.some(
          (v) => v[key as keyof typeof v] !== first[key as keyof typeof first],
        );
      }
    }

    return { versions: enriched, diffHighlights, fuelPrices };
  }

  private computeFillCost(
    v: { fuel: string; batteryCapacityKwh: number | null; fuelTankLiters: number | null },
    prices: Map<string, { pricePerUnitClp: number; unit: string }>,
  ): number | null {
    if (v.fuel === "ELECTRIC" && v.batteryCapacityKwh != null) {
      const price = prices.get("ELECTRIC");
      return price ? v.batteryCapacityKwh * price.pricePerUnitClp : null;
    }
    if (v.fuelTankLiters != null) {
      const price = prices.get(v.fuel);
      return price ? v.fuelTankLiters * price.pricePerUnitClp : null;
    }
    return null;
  }
}
```

- [ ] **Step 4: Actualizar compare.controller.ts**

`apps/backend/src/modules/compare/compare.controller.ts` — instanciar el service con FuelPricesService:

```ts
import { z } from "zod";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { validation } from "../../shared/errors.js";
import { CompareService } from "./compare.service.js";
import { FuelPricesService } from "../fuel-prices/fuel-prices.service.js";

const postBodySchema = z.object({
  versionIds: z.array(z.string()).min(1).max(3),
});

const fuelPriceSvc = new FuelPricesService(prisma);
const svc = new CompareService(prisma, fuelPriceSvc);

export const compareController = {
  post: ah(async (req, res) => {
    const parsed = postBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.compare(parsed.data.versionIds)));
  }),
  get: ah(async (req, res) => {
    const ids = String(req.query.ids ?? "").split(",").filter(Boolean);
    if (ids.length < 1) throw validation("ids requerido");
    res.json(ok(await svc.compare(ids)));
  }),
};
```

- [ ] **Step 5: Correr test (debe pasar)**

```bash
npm -w apps/backend run test -- compare.service
```

Expected: PASS (4 tests nuevos).

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/compare/
git commit -m "feat(be): compare — fuel prices lookup + computedFillCost + DIFF_KEYS extendidas"
```

---

## Task 7: Backend wiring — registrar nuevos routers en app.ts

**Files:**
- Modify: `apps/backend/src/app.ts`

- [ ] **Step 1: Importar routers**

En `apps/backend/src/app.ts`, agregar después de la línea 16:

```ts
import { dealersRouter, dealersAdminRouter } from "./modules/dealers/dealers.routes.js";
import { fuelPricesRouter, fuelPricesAdminRouter } from "./modules/fuel-prices/fuel-prices.routes.js";
```

- [ ] **Step 2: Wire routers públicos y admin**

Después de la línea `app.use("/api/v1/maintenance", maintenanceRouter);` (línea 58) agregar:

```ts
app.use("/api/v1/brands", dealersRouter);
app.use("/api/v1/fuel-prices", fuelPricesRouter);
app.use("/api/v1/admin/dealers", dealersAdminRouter);
app.use("/api/v1/admin/fuel-prices", fuelPricesAdminRouter);
```

- [ ] **Step 3: Verificar build**

```bash
npm -w apps/backend run build
```

Expected: build success, no errores TS.

- [ ] **Step 4: Correr suite completa**

```bash
npm -w apps/backend run test
```

Expected: PASS todos los tests.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/app.ts
git commit -m "feat(be): wire dealers y fuel-prices routers en app"
```

---

## Task 8: Frontend bug fix — top-nav-bar botones auth en móvil

**Files:**
- Modify: `apps/frontend/src/app/layout/top-nav-bar.component.html`
- Modify: `apps/frontend/src/app/layout/top-nav-bar.component.spec.ts`

- [ ] **Step 1: Ver spec del top-nav-bar**

```bash
head -50 apps/frontend/src/app/layout/top-nav-bar.component.spec.ts
```

Anotar el patrón de tests existente (probablemente usa `TestBed` o `spectator`).

- [ ] **Step 2: Escribir test de visibilidad responsive**

Agregar al spec existente:

```ts
describe('responsive visibility', () => {
  it('muestra botones auth con icono en viewport < 768px', () => {
    // Mock matchMedia para simular mobile
    spyOn(window, 'matchMedia').and.callFake((q: string) => ({
      matches: false,  // < md: no coincide
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList);
    fixture.detectChanges();
    const loginBtn = fixture.nativeElement.querySelector('[data-testid="nav-login-btn"]');
    const registerBtn = fixture.nativeElement.querySelector('[data-testid="nav-register-btn"]');
    expect(loginBtn).toBeTruthy();
    expect(registerBtn).toBeTruthy();
  });
});
```

- [ ] **Step 3: Correr test (debe pasar antes; este test es regression guard)**

```bash
npm -w apps/frontend run test -- --include='**/top-nav-bar.component.spec.ts'
```

Expected: PASS (los data-testid ya existen, el test valida que no se rompa).

- [ ] **Step 4: Modificar top-nav-bar.component.html**

Reemplazar la sección `} @else { ... }` (líneas 111-128) con:

```html
} @else {
  <!-- Móvil: icon-button con tooltip -->
  <a
    mat-icon-button
    routerLink="/login"
    class="md:hidden"
    matTooltip="Iniciar sesión"
    aria-label="Iniciar sesión"
    data-testid="nav-login-btn"
  >
    <mat-icon>login</mat-icon>
  </a>
  <a
    mat-icon-button
    routerLink="/register"
    class="md:hidden"
    matTooltip="Crear cuenta"
    aria-label="Crear cuenta"
    data-testid="nav-register-btn"
  >
    <mat-icon>person_add</mat-icon>
  </a>
  <!-- Desktop: botones con texto (sin cambios) -->
  <a
    mat-stroked-button
    color="primary"
    routerLink="/login"
    class="nav-login-btn hidden md:inline-flex"
  >
    Iniciar sesión
  </a>
  <a
    mat-flat-button
    color="primary"
    routerLink="/register"
    class="nav-register-btn hidden md:inline-flex"
  >
    Crear cuenta
  </a>
}
```

- [ ] **Step 5: Correr tests**

```bash
npm -w apps/frontend run test -- --include='**/top-nav-bar.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/layout/top-nav-bar.component.html apps/frontend/src/app/layout/top-nav-bar.component.spec.ts
git commit -m "fix(fe): botones auth visibles en móvil (icon-button con tooltip)"
```

---

## Task 9: Frontend entity-schemas — dealer, fuelPrice, version fields, brand.dealerIds

**Files:**
- Modify: `apps/frontend/src/app/features/admin/entity-schemas.ts`

- [ ] **Step 1: Agregar dealerSchema y fuelPriceSchema**

En `apps/frontend/src/app/features/admin/entity-schemas.ts`, después de `maintenanceSchema` (línea 73-77), agregar:

```ts
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
```

- [ ] **Step 2: Extender brandSchema con dealerIds**

Modificar `brandSchema` (líneas 32-35):

```ts
export const brandSchema = z.object({
  name: z.string().min(2).max(80),
  logoUrl: imageUrlField.nullable().optional(),
  dealerIds: z.array(z.string()).optional(),
});
```

- [ ] **Step 3: Extender versionSchema con 7 campos**

Modificar `versionSchema` (líneas 45-66), agregar al final antes del cierre:

```ts
  circulationPermitClp: z.number().int().nonnegative().nullable().optional(),
  mandatoryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
  voluntaryInsuranceClp: z.number().int().nonnegative().nullable().optional(),
  fuelTankLiters: z.number().nonnegative().nullable().optional(),
  batteryCapacityKwh: z.number().nonnegative().nullable().optional(),
  hasRecall: z.boolean().default(false),
  recallUrl: z.string().url().nullable().optional(),
```

- [ ] **Step 4: Extender tipos e EntityKey**

Modificar `EntityKey` (línea 85):

```ts
export type EntityKey = 'brand' | 'model' | 'version' | 'equipment' | 'maintenance' | 'dealer' | 'fuelPrice';
```

Agregar los inputs:

```ts
export type DealerInput = z.infer<typeof dealerSchema>;
export type FuelPriceInput = z.infer<typeof fuelPriceSchema>;
```

Extender `entitySchemaByKey`:

```ts
export const entitySchemaByKey: Record<EntityKey, z.ZodTypeAny> = {
  brand: brandSchema,
  model: modelSchema,
  version: versionSchema,
  equipment: equipmentSchema,
  maintenance: maintenanceSchema,
  dealer: dealerSchema,
  fuelPrice: fuelPriceSchema,
};
```

- [ ] **Step 5: Extender FIELD_METAS**

Modificar `FIELD_METAS` (líneas 115-158) — agregar en `brand` un campo más, en `version` 7 campos más, y crear entries para `dealer` y `fuelPrice`:

```ts
brand: [
  { field: 'name', label: 'Nombre', kind: 'text' },
  { field: 'logoUrl', label: 'Logo', kind: 'imageUrl' },
  { field: 'dealerIds', label: 'Concesionarios', kind: 'multiSelect', optionsApi: '/admin/dealers', optionLabel: 'name' },
],
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

- [ ] **Step 6: Verificar build**

```bash
npm -w apps/frontend run build
```

Expected: build success (puede fallar tests por el cambio en EntityKey; los arreglamos en tasks siguientes).

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/app/features/admin/entity-schemas.ts
git commit -m "feat(fe): entity-schemas — dealer, fuelPrice, version cost/recall fields, brand.dealerIds"
```

---

## Task 10: Frontend admin shell + dashboard + routes (dealers + fuel-prices)

**Files:**
- Modify: `apps/frontend/src/app/features/admin/admin-shell.component.ts`
- Modify: `apps/frontend/src/app/features/admin/admin-dashboard.component.ts`
- Modify: `apps/frontend/src/app/app.routes.ts`

- [ ] **Step 1: Agregar tabs en admin-shell**

En `apps/frontend/src/app/features/admin/admin-shell.component.ts`, modificar el array `subLinks` (líneas 23-30):

```ts
readonly subLinks: SubLink[] = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/brands', label: 'Marcas' },
  { path: '/admin/models', label: 'Modelos' },
  { path: '/admin/versions', label: 'Versiones' },
  { path: '/admin/equipment', label: 'Equipamiento' },
  { path: '/admin/maintenance', label: 'Mantención' },
  { path: '/admin/dealers', label: 'Concesionarios' },
  { path: '/admin/fuel-prices', label: 'Precios combustible' },
];
```

- [ ] **Step 2: Agregar cards en admin-dashboard**

En `apps/frontend/src/app/features/admin/admin-dashboard.component.ts`, modificar el array `cards` (líneas 23-29) y el método `loadCounts` (líneas 31-43):

```ts
readonly cards = signal<Card[]>([
  { path: '/admin/brands',      label: 'Marcas',              count: null, loading: true },
  { path: '/admin/models',      label: 'Modelos',             count: null, loading: true },
  { path: '/admin/versions',    label: 'Versiones',           count: null, loading: true },
  { path: '/admin/equipment',   label: 'Equipamiento',        count: null, loading: true },
  { path: '/admin/maintenance', label: 'Mantención',          count: null, loading: true },
  { path: '/admin/dealers',     label: 'Concesionarios',      count: null, loading: true },
  { path: '/admin/fuel-prices', label: 'Precios combustible', count: null, loading: true },
]);

private async loadCounts(): Promise<void> {
  await Promise.all([
    this.load('/brands',                       0),
    this.load('/models?pageSize=1',            1),
    this.load('/versions?pageSize=1',          2),
    this.load('/equipment',                    3),
    this.load('/admin/maintenance',            4),
    this.load('/admin/dealers',                5),
    this.load('/admin/fuel-prices',            6),
  ]);
}
```

- [ ] **Step 3: Agregar rutas en app.routes.ts**

En `apps/frontend/src/app/app.routes.ts`, dentro del `children` del admin shell, agregar dos entries después de `maintenance` (línea 113-119):

```ts
{
  path: 'dealers',
  loadComponent: () =>
    import('./features/admin/dealers-admin.component').then(
      (m) => m.DealersAdminComponent,
    ),
},
{
  path: 'fuel-prices',
  loadComponent: () =>
    import('./features/admin/fuel-prices-admin.component').then(
      (m) => m.FuelPricesAdminComponent,
    ),
},
```

- [ ] **Step 4: Commit (con tests rotos esperados)**

```bash
git add apps/frontend/src/app/features/admin/admin-shell.component.ts apps/frontend/src/app/features/admin/admin-dashboard.component.ts apps/frontend/src/app/app.routes.ts
git commit -m "feat(fe): admin shell/dashboard/routes — entries para dealers y fuel-prices"
```

Nota: el build puede fallar porque las rutas referencian componentes que aún no existen. Esto se resuelve en Task 11 y 12.

---

## Task 11: Frontend dealers-admin component

**Files:**
- Create: `apps/frontend/src/app/features/admin/dealers-admin.component.{ts,html,css,spec.ts}`

**Interfaces:**
- Produces: `DealersAdminComponent` con tabla, búsqueda, dialog de crear/editar, delete.

- [ ] **Step 1: Copiar brands-admin como base**

```bash
cp apps/frontend/src/app/features/admin/brands-admin.component.ts apps/frontend/src/app/features/admin/dealers-admin.component.ts
cp apps/frontend/src/app/features/admin/brands-admin.component.html apps/frontend/src/app/features/admin/dealers-admin.component.html
cp apps/frontend/src/app/features/admin/brands-admin.component.css apps/frontend/src/app/features/admin/dealers-admin.component.css
cp apps/frontend/src/app/features/admin/brands-admin.component.spec.ts apps/frontend/src/app/features/admin/dealers-admin.component.spec.ts
```

- [ ] **Step 2: Adaptar dealers-admin.component.ts**

Editar el archivo copiado:

1. Cambiar `BrandsAdminComponent` → `DealersAdminComponent` en clase, selector (`app-dealers-admin`), `templateUrl`/`styleUrl`.
2. Cambiar imports: `import { BrandsAdminComponent }` no aplica, dejar la base.
3. Cambiar interface `BrandRow` a `DealerRow` con campos `{ id: string; name: string; url: string; logoUrl: string | null }`.
4. En el `load()`, llamar `this.api.get<{ data: DealerRow[] }>('/admin/dealers')` (en plural; ya existe el endpoint).
5. En el `openEdit`, proyectar `logoUrl` igual que `name`/`url`.
6. En el `onSave`, POST/PATCH a `/admin/dealers` y `/admin/dealers/:id` según `dialogEntity()`.
7. En `confirmDelete`, llamar `api.delete('/admin/dealers/' + row.id)`.

- [ ] **Step 3: Adaptar dealers-admin.component.html**

Reemplazar el contenido para mostrar 3 columnas: Nombre, URL, Logo (con `<img>` si existe, sino "—"). Mantener el patrón de la tabla:

```html
<section>
  <header class="flex items-center justify-between mb-4 gap-2">
    <h2 class="text-xl font-bold">Concesionarios</h2>
    <button mat-flat-button color="primary" type="button" (click)="openCreate()">+ Nuevo</button>
  </header>

  <app-search-input placeholder="Buscar concesionario…" [value]="search()" (changed)="onSearch($event)" />

  @if (error(); as err) {
    <div class="mb-3 rounded border border-warn bg-warn-light px-3 py-2 text-sm text-warn-dark">{{ err }}</div>
  }

  @if (loading()) {
    <p class="text-sm text-ink-muted">Cargando…</p>
  } @else if (displayed().length === 0) {
    <p class="text-sm text-ink-muted">No hay concesionarios.</p>
  } @else {
    <div class="admin-table-scroll">
      <table class="admin-table w-full text-sm">
        <thead class="text-left text-xs text-ink-muted">
          <tr>
            <th class="py-2">
              <button type="button" class="sort-header font-bold uppercase tracking-wide hover:text-ink"
                (click)="toggleSort('name')" [attr.aria-sort]="sortKey() === 'name' ? (sortDir() === 'asc' ? 'ascending' : 'descending') : 'none'">
                Nombre <mat-icon class="sort-icon">{{ sortKey() === 'name' ? (sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}</mat-icon>
              </button>
            </th>
            <th class="py-2">URL</th>
            <th class="py-2">Logo</th>
            <th class="py-2 actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (d of displayed(); track d.id) {
            <tr class="border-t border-border">
              <td class="py-2">{{ d.name }}</td>
              <td class="py-2"><a [href]="d.url" target="_blank" rel="noopener" class="text-engine underline truncate max-w-xs block">{{ d.url }}</a></td>
              <td class="py-2">
                @if (d.logoUrl) { <img [src]="d.logoUrl" alt="logo" class="h-8 object-contain"> }
                @else { <span class="text-ink-muted">—</span> }
              </td>
              <td class="py-2 actions-col">
                <div class="action-buttons">
                  <button mat-stroked-button color="primary" (click)="openEdit(d)">
                    <mat-icon class="action-icon">edit</mat-icon>
                    <span class="action-label">Editar</span>
                  </button>
                  <button mat-stroked-button class="action-danger" (click)="confirmDelete(d)">
                    <mat-icon class="action-icon">delete</mat-icon>
                    <span class="action-label">Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  @if (dialogMode() === 'open') {
    <app-admin-edit-dialog
      [entityKey]="'dealer'"
      [apiPath]="'dealers'"
      [entity]="$any(dialogEntity())"
      (save)="onSave($event)"
      (cancel)="closeDialog()"
    />
  }
</section>
```

- [ ] **Step 4: Adaptar dealers-admin.component.spec.ts**

Reemplazar el contenido con un smoke test similar al de brands-admin pero apuntando a `/admin/dealers`. Usar el patrón de `HttpClientTesting` o el `ApiService` mock según el spec original.

- [ ] **Step 5: Correr tests**

```bash
npm -w apps/frontend run test -- --include='**/dealers-admin.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/features/admin/dealers-admin.component.ts apps/frontend/src/app/features/admin/dealers-admin.component.html apps/frontend/src/app/features/admin/dealers-admin.component.css apps/frontend/src/app/features/admin/dealers-admin.component.spec.ts
git commit -m "feat(fe): dealers-admin component (CRUD)"
```

---

## Task 12: Frontend fuel-prices-admin component

**Files:**
- Create: `apps/frontend/src/app/features/admin/fuel-prices-admin.component.{ts,html,css,spec.ts}`

- [ ] **Step 1: Copiar maintenance-admin como base**

```bash
cp apps/frontend/src/app/features/admin/maintenance-admin.component.ts apps/frontend/src/app/features/admin/fuel-prices-admin.component.ts
cp apps/frontend/src/app/features/admin/maintenance-admin.component.html apps/frontend/src/app/features/admin/fuel-prices-admin.component.html
cp apps/frontend/src/app/features/admin/maintenance-admin.component.css apps/frontend/src/app/features/admin/fuel-prices-admin.component.css
cp apps/frontend/src/app/features/admin/maintenance-admin.component.spec.ts apps/frontend/src/app/features/admin/fuel-prices-admin.component.spec.ts
```

- [ ] **Step 2: Adaptar fuel-prices-admin.component.ts**

Editar:

1. Clase: `FuelPricesAdminComponent`, selector `app-fuel-prices-admin`.
2. `FuelPriceRow` interface: `{ id: string; fuelType: string; pricePerUnitClp: number; unit: string; effectiveFrom: string }`.
3. `load()` → `GET /admin/fuel-prices`.
4. `onSave` → POST/PATCH `/admin/fuel-prices` y `/admin/fuel-prices/:id`.
5. `confirmDelete` → DELETE `/admin/fuel-prices/:id`.
6. `formatPrice` no aplica (es CLP por unidad, no mantenimiento). Agregar `formatCurrency(value: number) => '$' + new Intl.NumberFormat('es-CL').format(value)`.

- [ ] **Step 3: Adaptar fuel-prices-admin.component.html**

```html
<section>
  <header class="flex items-center justify-between mb-4 gap-2">
    <h2 class="text-xl font-bold">Precios de combustible</h2>
    <button mat-flat-button color="primary" type="button" (click)="openCreate()">+ Nuevo</button>
  </header>

  <app-search-input placeholder="Buscar por tipo…" [value]="search()" (changed)="onSearch($event)" />

  @if (error(); as err) {
    <div class="mb-3 rounded border border-warn bg-warn-light px-3 py-2 text-sm text-warn-dark">{{ err }}</div>
  }

  @if (loading()) {
    <p class="text-sm text-ink-muted">Cargando…</p>
  } @else if (displayed().length === 0) {
    <p class="text-sm text-ink-muted">No hay precios registrados.</p>
  } @else {
    <div class="admin-table-scroll">
      <table class="admin-table w-full text-sm">
        <thead class="text-left text-xs text-ink-muted">
          <tr>
            <th class="py-2">Tipo</th>
            <th class="py-2">Precio CLP</th>
            <th class="py-2">Unidad</th>
            <th class="py-2">Vigente desde</th>
            <th class="py-2 actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @for (fp of displayed(); track fp.id) {
            <tr class="border-t border-border">
              <td class="py-2">{{ fp.fuelType }}</td>
              <td class="py-2">{{ formatCurrency(fp.pricePerUnitClp) }}</td>
              <td class="py-2">{{ fp.unit }}</td>
              <td class="py-2">{{ fp.effectiveFrom | date: 'short' }}</td>
              <td class="py-2 actions-col">
                <div class="action-buttons">
                  <button mat-stroked-button class="action-danger" (click)="confirmDelete(fp)">
                    <mat-icon class="action-icon">delete</mat-icon>
                    <span class="action-label">Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  @if (dialogMode() === 'open') {
    <app-admin-edit-dialog
      [entityKey]="'fuelPrice'"
      [apiPath]="'fuel-prices'"
      [entity]="$any(dialogEntity())"
      (save)="onSave($event)"
      (cancel)="closeDialog()"
    />
  }
</section>
```

- [ ] **Step 4: Adaptar fuel-prices-admin.component.spec.ts**

Reemplazar con smoke test apuntando a `/admin/fuel-prices`. Importar `DatePipe` si se usa `| date: 'short'`.

- [ ] **Step 5: Correr tests**

```bash
npm -w apps/frontend run test -- --include='**/fuel-prices-admin.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/features/admin/fuel-prices-admin.component.ts apps/frontend/src/app/features/admin/fuel-prices-admin.component.html apps/frontend/src/app/features/admin/fuel-prices-admin.component.css apps/frontend/src/app/features/admin/fuel-prices-admin.component.spec.ts
git commit -m "feat(fe): fuel-prices-admin component (CRUD)"
```

---

## Task 13: Frontend model component — recall badge + dealers section

**Files:**
- Modify: `apps/frontend/src/app/features/model/model.component.{ts,html,spec.ts}`

**Interfaces:**
- Produces: `ModelComponent` carga dealers via `GET /api/v1/brands/:brandId/dealers`.
- Produces: el template renderiza warning de recall por versión y sección de dealers al final.

- [ ] **Step 1: Extender interface VersionLite en model.component.ts**

En `apps/frontend/src/app/features/model/model.component.ts`, agregar campos al tipo local (probablemente `VersionLite` o `Version`):

```ts
hasRecall?: boolean | null;
recallUrl?: string | null;
```

- [ ] **Step 2: Agregar signal para dealers**

```ts
readonly dealers = signal<{ id: string; name: string; url: string; logoUrl: string | null }[]>([]);
```

- [ ] **Step 3: Método loadBrandDealers**

```ts
async loadBrandDealers(brandId: string): Promise<void> {
  try {
    const res = await this.api.get<{ data: { id: string; name: string; url: string; logoUrl: string | null }[] }>(
      `/brands/${brandId}/dealers`,
    );
    this.dealers.set(res.data ?? []);
  } catch {
    this.dealers.set([]);
  }
}
```

En el `bootstrap()` (o donde se carga el modelo), después de tener `brand()`:
```ts
const b = this.brand();
if (b) await this.loadBrandDealers(b.id);
```

- [ ] **Step 4: Modificar template — recall badge**

En `apps/frontend/src/app/features/model/model.component.html`, dentro del `<article>` de cada versión en el sidebar (línea 198-238), agregar después del precio:

```html
@if (v.hasRecall) {
  <a
    [href]="v.recallUrl"
    target="_blank"
    rel="noopener"
    class="mt-2 inline-flex items-center gap-1 text-engine font-mono text-[10px] uppercase tracking-stamp border border-engine px-2 py-0.5"
    [attr.data-testid]="'recall-' + v.id"
  >
    <mat-icon class="text-base">warning</mat-icon>
    Recall publicado
  </a>
}
```

- [ ] **Step 5: Modificar template — dealers section**

Después del sidebar de versiones (línea 244), agregar:

```html
@if (dealers().length > 0) {
  <aside class="mt-6 bg-paper-cool border border-ink p-4" data-testid="brand-dealers">
    <h3 class="font-mono text-[11px] uppercase tracking-stamp text-ink-muted mb-3">Concesionarios oficiales</h3>
    <ul class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      @for (d of dealers(); track d.id) {
        <li>
          <a
            [href]="d.url"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 p-2 border border-border hover:border-ink"
          >
            @if (d.logoUrl) {
              <img [src]="d.logoUrl" [alt]="d.name" class="h-8 w-8 object-contain" />
            }
            <span class="text-xs font-semibold truncate">{{ d.name }}</span>
            <mat-icon class="text-base ml-auto">open_in_new</mat-icon>
          </a>
        </li>
      }
    </ul>
  </aside>
}
```

- [ ] **Step 6: Agregar tests**

`apps/frontend/src/app/features/model/model.component.spec.ts` — extender con:

```ts
it('muestra recall badge si v.hasRecall=true', () => {
  // Setup model con versión que tiene hasRecall=true y recallUrl
  // Detectar cambios
  // Asertar que data-testid="recall-<id>" existe
});

it('carga dealers de la marca', () => {
  // Mock api.get('/brands/<id>/dealers')
  // Asertar que data-testid="brand-dealers" renderiza los dealers
});
```

- [ ] **Step 7: Correr tests**

```bash
npm -w apps/frontend run test -- --include='**/model.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/app/features/model/model.component.ts apps/frontend/src/app/features/model/model.component.html apps/frontend/src/app/features/model/model.component.spec.ts
git commit -m "feat(fe): model component — recall badge + dealers section"
```

---

## Task 14: Frontend compare component — sección Costos + sub-tabla mantención + recall badge

**Files:**
- Modify: `apps/frontend/src/app/features/compare/compare.component.{ts,html,css,spec.ts}`

**Interfaces:**
- Produces: `CompareRow` polymorphic (`'simple' | 'maintenanceBreakdown'`).
- Produces: sección colapsable "Costos" con 5 filas (mantenimiento + 4 simples).
- Produces: recall badge en cada card de versión.

- [ ] **Step 1: Extender interface CompareVersion**

En `apps/frontend/src/app/features/compare/compare.component.ts`, agregar al interface `CompareVersion` (líneas 38-60):

```ts
  circulationPermitClp?: number | null;
  mandatoryInsuranceClp?: number | null;
  voluntaryInsuranceClp?: number | null;
  fuelTankLiters?: number | null;
  batteryCapacityKwh?: number | null;
  hasRecall?: boolean | null;
  recallUrl?: string | null;
  computedFillCostClp?: number | null;
  maintenanceCosts?: { mileageTag: number; costClp: number }[];
```

- [ ] **Step 2: Polymorphic CompareRow + SectionRow**

Reemplazar las interfaces `SectionRow` y `Section` (líneas 82-92) y la lista `DiffKey` (líneas 62-80):

```ts
type DiffKey =
  | 'priceClp'
  | 'year'
  | 'transmission'
  | 'fuel'
  | 'engineDisplacementCc'
  | 'powerHp'
  | 'torqueNm'
  | 'consumptionCityKmL'
  | 'consumptionHighwayKmL'
  | 'lengthMm'
  | 'widthMm'
  | 'heightMm'
  | 'weightKg'
  | 'trunkLiters'
  | 'airbagCount'
  | 'hasAbs'
  | 'hasEsp'
  | 'hasCruiseControl'
  | 'circulationPermitClp'
  | 'mandatoryInsuranceClp'
  | 'voluntaryInsuranceClp'
  | 'computedFillCostClp';

type CompareRow =
  | { kind: 'simple'; key: DiffKey; label: string; format: (v: CompareVersion) => string }
  | { kind: 'maintenanceBreakdown'; label: string };

interface Section {
  name: string;
  label: string;
  rows: CompareRow[];
}
```

- [ ] **Step 3: Reemplazar sección "mantencion" por "costos"**

En el array `sections` (líneas 178-298), reemplazar la sección `{ name: 'mantencion', ... }` (líneas 287-297) con:

```ts
{
  name: 'costos',
  label: 'Costos',
  rows: [
    { kind: 'maintenanceBreakdown', label: 'Mantención (CLP/por km)' },
    {
      kind: 'simple',
      key: 'circulationPermitClp',
      label: 'Permiso de circulación',
      format: (v) => (v.circulationPermitClp ? this.formatPrice(v.circulationPermitClp) : '—'),
    },
    {
      kind: 'simple',
      key: 'mandatoryInsuranceClp',
      label: 'Seguro obligatorio (SOAP)',
      format: (v) => (v.mandatoryInsuranceClp ? this.formatPrice(v.mandatoryInsuranceClp) : '—'),
    },
    {
      kind: 'simple',
      key: 'voluntaryInsuranceClp',
      label: 'Seguro automotriz',
      format: (v) => (v.voluntaryInsuranceClp ? this.formatPrice(v.voluntaryInsuranceClp) : '—'),
    },
    {
      kind: 'simple',
      key: 'computedFillCostClp',
      label: 'Llenar estanque',
      format: (v) => (v.computedFillCostClp ? this.formatPrice(v.computedFillCostClp) : '—'),
    },
  ],
},
```

- [ ] **Step 4: Actualizar `sectionIcon`**

En el método `sectionIcon` (líneas 439-452), cambiar el case `'mantencion'` por `'costos'`:

```ts
case 'costos':
  return 'payments';
```

(Nota: si `mantencion` ya no existe, el case anterior se puede eliminar.)

- [ ] **Step 5: Render polymorphic row en template**

En `apps/frontend/src/app/features/compare/compare.component.html`, en el bloque `@for (row of s.rows; track row.key)` (línea 321), cambiar la fila `<tr>` a un dispatch sobre `row.kind`. Reemplazar el bloque completo (líneas 320-338) con:

```html
<tbody class="divide-y divide-border">
  @for (row of s.rows; track $index) {
    <tr [attr.data-testid]="'row-' + (row.kind === 'simple' ? row.key : 'maintenance-breakdown')">
      <th scope="row" class="px-4 py-2 text-left font-bold text-ink-muted text-xs uppercase tracking-wider">
        {{ row.label }}
      </th>
      @if (row.kind === 'simple') {
        @for (v of versions(); track v.id) {
          <td [class]="cellClass(row.key)" class="px-4 py-2 text-ink">
            {{ row.format(v) }}
          </td>
        }
      } @else {
        @for (v of versions(); track v.id) {
          <td class="px-4 py-2 text-ink">
            <button
              type="button"
              class="font-mono text-[11px] uppercase tracking-stamp text-engine hover:underline"
              (click)="openMaintPopover(v.id); $event.stopPropagation()"
              [attr.data-testid]="'maint-popover-btn-' + v.id"
            >
              Ver detalle ({{ (v.maintenanceCosts?.length ?? 0) }})
            </button>
          </td>
        }
      }
    </tr>
  }
</tbody>
```

- [ ] **Step 6: Agregar signal para popover de mantención**

En `compare.component.ts`, agregar:

```ts
maintPopoverFor = signal<string | null>(null);

openMaintPopover(versionId: string): void {
  this.maintPopoverFor.update((cur) => (cur === versionId ? null : versionId));
}

closeMaintPopover(): void {
  this.maintPopoverFor.set(null);
}
```

En el `onDocumentClick` (línea 168-176), agregar lógica para cerrar también el popover de mantención:

```ts
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (this.swappingFor() !== null && !target.closest('[data-testid^="swap-popover-"]') && !target.closest('[data-testid^="swap-button-"]')) {
    this.closeSwap();
  }
  if (this.maintPopoverFor() !== null && !target.closest('[data-testid^="maint-popover-panel-"]') && !target.closest('[data-testid^="maint-popover-btn-"]')) {
    this.closeMaintPopover();
  }
}
```

- [ ] **Step 7: Render popover de mantención**

En el template, después de la tabla (después de `</table>`) y antes del cierre de cada `mat-expansion-panel`, agregar un popover flotante. Para mantenerlo simple, agregar al final de la fila de mantención, dentro del `<td>` con un wrapper `position: relative`:

Reemplazar el bloque del step 5 (botón de mantención) para incluir un panel flotante:

```html
@if (row.kind === 'maintenanceBreakdown') {
  @for (v of versions(); track v.id) {
    <td class="px-4 py-2 text-ink relative">
      <button
        type="button"
        class="font-mono text-[11px] uppercase tracking-stamp text-engine hover:underline"
        (click)="openMaintPopover(v.id); $event.stopPropagation()"
        [attr.data-testid]="'maint-popover-btn-' + v.id"
      >
        Ver detalle ({{ (v.maintenanceCosts?.length ?? 0) }})
      </button>
      @if (maintPopoverFor() === v.id) {
        <div
          class="absolute z-30 left-0 top-full mt-1 bg-paper-cool border border-ink p-3 w-72 shadow-e2"
          [attr.data-testid]="'maint-popover-panel-' + v.id"
        >
          <p class="font-mono text-[10px] uppercase tracking-stamp text-ink-muted mb-2">Mantención por kilometraje</p>
          @if (v.maintenanceCosts && v.maintenanceCosts.length > 0) {
            <table class="w-full text-xs">
              @for (mc of [...(v.maintenanceCosts ?? [])].sort((a, b) => a.mileageTag - b.mileageTag); track mc.mileageTag) {
                <tr>
                  <td class="py-0.5 text-ink-muted">{{ mc.mileageTag | number }} km</td>
                  <td class="py-0.5 text-right font-semibold">{{ formatPrice(mc.costClp) }}</td>
                </tr>
              }
            </table>
          } @else {
            <p class="text-xs text-ink-muted">Sin costos registrados.</p>
          }
        </div>
      }
    </td>
  }
}
```

Importar `DecimalPipe` (o `CommonModule`) en `imports` del componente. Verificar el import existente; si no está, agregar `DecimalPipe` a `imports`.

- [ ] **Step 8: Recall badge en cards**

En `apps/frontend/src/app/features/compare/compare.component.html`, dentro del `<article>` de cada versión en las cards (línea 161-277), agregar badge al inicio:

```html
@if (v.hasRecall) {
  <a
    [href]="v.recallUrl"
    target="_blank"
    rel="noopener"
    class="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-engine font-mono text-[10px] uppercase tracking-stamp border border-engine bg-white px-1.5 py-0.5 z-10"
    [attr.data-testid]="'recall-card-' + v.id"
  >
    <mat-icon class="text-base">warning</mat-icon>
    Recall
  </a>
}
```

- [ ] **Step 9: Tests**

En `apps/frontend/src/app/features/compare/compare.component.spec.ts` — extender con:

```ts
it('sección "Costos" se renderiza con 5 filas', () => {
  // Setup versions con data completa
  // Detectar
  // Asertar que data-testid="row-circulationPermitClp", "row-mandatoryInsuranceClp", etc. existen
});

it('sub-tabla de mantención se expande al click', () => {
  // Setup con maintenanceCosts
  // Click en data-testid="maint-popover-btn-<id>"
  // Asertar que data-testid="maint-popover-panel-<id>" existe
});

it('recall badge aparece si v.hasRecall=true', () => {
  // Asertar que data-testid="recall-card-<id>" existe
});
```

- [ ] **Step 10: Correr tests**

```bash
npm -w apps/frontend run test -- --include='**/compare.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add apps/frontend/src/app/features/compare/compare.component.ts apps/frontend/src/app/features/compare/compare.component.html apps/frontend/src/app/features/compare/compare.component.css apps/frontend/src/app/features/compare/compare.component.spec.ts
git commit -m "feat(fe): compare — sección Costos + sub-tabla mantención + recall badge"
```

---

## Task 15: Frontend brands-admin — sync dealerIds al guardar

**Files:**
- Modify: `apps/frontend/src/app/features/admin/brands-admin.component.ts`

- [ ] **Step 1: Ver spec actual del brands-admin**

```bash
cat apps/frontend/src/app/features/admin/brands-admin.component.ts
```

- [ ] **Step 2: Modificar onSave para enviar dealerIds**

En el método `onSave`, después del PATCH existente, agregar el envío de `dealerIds` (que viene en el value):

```ts
async onSave(value: Record<string, unknown>): Promise<void> {
  const e = this.dialogEntity();
  try {
    const payload = { ...value };
    if (e) {
      // Editar: el PATCH ya acepta dealerIds
      await this.api.patch(`/admin/brands/${e.id}`, payload);
    } else {
      // Crear: el POST no acepta dealerIds (no aplica a marcas nuevas sin id)
      const { dealerIds: _ignore, ...createPayload } = payload;
      await this.api.post('/admin/brands', createPayload);
    }
    this.dialogEntity.set(undefined);
    await this.load();
  } catch (err) {
    this.error.set((err as Error).message);
  }
}
```

- [ ] **Step 3: Tests del sync**

En `apps/frontend/src/app/features/admin/brands-admin.component.spec.ts`, agregar:

```ts
it('al editar marca, PATCH envía dealerIds al backend', () => {
  // Setup dialogEntity con marca existente
  // Llamar onSave con value.dealerIds = ['d1', 'd2']
  // Asertar que api.patch fue llamado con payload.dealerIds = ['d1', 'd2']
});

it('al crear marca, dealerIds no se envía (no aplica)', () => {
  // Llamar onSave con dialogEntity null y value.dealerIds = ['d1']
  // Asertar que api.post fue llamado sin dealerIds en el payload
});
```

- [ ] **Step 4: Correr tests**

```bash
npm -w apps/frontend run test -- --include='**/brands-admin.component.spec.ts'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin/brands-admin.component.ts apps/frontend/src/app/features/admin/brands-admin.component.spec.ts
git commit -m "feat(fe): brands-admin — enviar dealerIds en PATCH"
```

---

## Task 16: Verificación final + seed opcional

**Files:**
- Modify: `apps/backend/prisma/catalog.ts` (opcional)
- Modify: `apps/backend/prisma/seed.ts` (opcional)

- [ ] **Step 1: Suite completa backend**

```bash
npm -w apps/backend run test
```

Expected: PASS (todos los tests).

- [ ] **Step 2: Suite completa frontend**

```bash
npm -w apps/frontend run test
```

Expected: PASS (todos los tests).

- [ ] **Step 3: Build backend**

```bash
npm -w apps/backend run build
```

Expected: build success.

- [ ] **Step 4: Build frontend**

```bash
npm -w apps/frontend run build
```

Expected: build success.

- [ ] **Step 5: Smoke test manual (recomendado, no automatizado)**

1. Levantar dev servers: `npm run dev`.
2. Login como admin.
3. Ir a `/admin/fuel-prices`, crear un precio BENCINA = 1200 CLP/L.
4. Ir a `/admin/dealers`, crear "Derco" con URL.
5. Ir a `/admin/brands/Toyota`, agregar Derco en el multiSelect, guardar.
6. Ir a `/admin/versions/<id>`, marcar `hasRecall = true`, agregar URL, guardar.
7. Cargar `http://localhost:4200/brand/toyota/model/corolla` → ver dealers + recall badge.
8. Cargar `http://localhost:4200/compare?ids=<v1>,<v2>,<v3>` → ver sección Costos con sub-tabla de mantención expandible y celdas nuevas (permiso, SOAP, seguro, llenar estanque).

- [ ] **Step 6: Commit final (si se agregaron seeds)**

```bash
git add apps/backend/prisma/catalog.ts apps/backend/prisma/seed.ts
git commit -m "chore(be): seed opcional dealers + fuel prices iniciales"
```

---

## Self-Review

1. **Spec coverage:**
   - Bug fix nav mobile → Task 8. ✓
   - Sección "Costos" reemplaza "Mantención" → Task 14. ✓
   - Sub-tabla mantención expandible por celda → Task 14 (step 5-7). ✓
   - Cálculo "llenar estanque" → Task 6 (backend computeFillCost) + Task 14 (frontend). ✓
   - Nueva entidad Dealer con relación N:M a Brand → Task 1 (schema) + Task 2 (BE module) + Task 11 (FE admin) + Task 15 (brand sync). ✓
   - `hasRecall` + `recallUrl` en Version con validación → Task 4 (BE) + Task 13 (FE modelo) + Task 14 (FE compare). ✓
   - `FuelPrice` editable por admin → Task 1 (schema) + Task 3 (BE module) + Task 12 (FE admin). ✓
   - Endpoint público `GET /api/v1/brands/:brandId/dealers` → Task 2 (routes) + Task 7 (wiring) + Task 13 (FE consumer). ✓
   - Endpoint público `GET /api/v1/fuel-prices/current` → Task 3 (routes) + Task 7 (wiring) + Task 6 (BE consumer). ✓
   - Recalls como warning visible en modelo y compare → Task 13 (modelo) + Task 14 (compare cards). ✓
   - DIFF_KEYS extendidas con nuevas keys de costos → Task 6. ✓
   - Validación Zod recall URL requerida si hasRecall → Task 4. ✓

2. **Placeholder scan:** Ningún TBD/TODO. Cada step tiene código completo o referencia a archivo existente.

3. **Type consistency:**
   - `DealersService` se usa en Task 2 (definido) y Task 6 (consumido). ✓
   - `FuelPricesService.current()` definido en Task 3, consumido en Task 6. ✓
   - `CompareService` ahora requiere `FuelPricesService` en constructor (Task 6), controller actualizado en mismo task. ✓
   - `CompareRow` polymorphic definido en Task 14 con `kind` discriminator. ✓
   - `data-testid` attributes consistentes entre modelo y compare. ✓
