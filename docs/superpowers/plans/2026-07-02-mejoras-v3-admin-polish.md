# Mejoras v3: Admin polish — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pulir el panel de administración: dashboard con conteo correcto de mantención, CRUD con buscador limpio y sin duplicados, y formularios con tipos enriquecidos (toggle, select buscable, upload de imágenes, enums extensibles).

**Architecture:** Backend gana un helper `extendEnum` para extender enums Postgres vía `ALTER TYPE ADD VALUE`, un módulo `uploads` con multer para servir imágenes locales, y un endpoint público `/maintenance`. Frontend introduce `<app-search-input>` compartido, una carpeta `fields/` con 5 sub-componentes (text/number/toggle/select-search/image-upload) y un refactor declarativo de `admin-edit-dialog` que itera sobre `FIELD_METAS`.

**Tech Stack:** Angular 20 (signals, OnPush, standalone), Express + Zod + Prisma/Postgres + multer, Vitest + supertest (BE) / HttpClientTesting (FE), Tailwind con tokens del proyecto, `material-symbols-outlined`.

**Spec de referencia:** `docs/superpowers/specs/2026-07-02-mejoras-v3-admin-polish-design.md`

## Global Constraints

- Cada task termina con commit (`git add -A && git commit -m "<scope>: <desc>"`).
- Backend: `npm -w apps/backend run test` debe pasar antes de commitear.
- Frontend: `npm -w apps/frontend run test` debe pasar antes de commitear.
- TypeScript estricto. No agregar `any` implícito. Reutilizar `shared/errors` (`AppError`, `conflict`, `badRequest`, `notFound`, `unauthorized`, `validation`).
- Naming: archivos en kebab-case; clases en PascalCase; métodos en camelCase.
- Todas las UI nuevas usan clases Tailwind ya presentes en `apps/frontend/src/styles.css` (variables `brand-*`, `surface`, `ink`, `border`, `warn`, `warn-dark`, `shadow-e2`).
- Iconos: `material-symbols-outlined`. No instalar nuevas libs de iconos.
- **Componentes Angular**: siempre `.ts` + `.html` + `.css` separados. Nunca HTML inline en `.ts`.
- Standalone components, `ChangeDetectionStrategy.OnPush`, signals + `input.required<T>()` / `model<T>()` / `output<T>()`.
- Auth: cualquier endpoint `/admin/uploads` debe pasar por `authenticate` + `requireRole("ADMIN")`.

---

## File map

### Backend (nuevo)
| Archivo | Responsabilidad |
|---|---|
| `apps/backend/src/shared/enum-extension.ts` | `extendEnum(prisma, name, value)` con `$executeRawUnsafe` + reconnect |
| `apps/backend/src/shared/enum-extension.spec.ts` | Tests de regex, idempotencia e integración con ModelsService |
| `apps/backend/src/modules/uploads/uploads.routes.ts` | Router admin con multer memory + auth + role guard |
| `apps/backend/src/modules/uploads/uploads.controller.ts` | Validación mime, escritura a `public/uploads/<yyyy-mm>/`, response `{ url, filename, size, mime }` |
| `apps/backend/src/modules/uploads/uploads.controller.spec.ts` | Tests 401/403/200/rechazo mime/tamaño |

### Backend (modificado)
| Archivo | Cambio |
|---|---|
| `apps/backend/package.json` | + `multer` + `@types/multer` |
| `apps/backend/src/app.ts` | Registrar `uploadsAdminRouter` + `express.static('public/uploads')` |
| `apps/backend/src/modules/models/models.dto.admin.ts` | `segment: z.string().regex(/^[A-Z0-9_]+$/)` |
| `apps/backend/src/modules/models/models.service.ts` | `create`/`update` llaman `extendEnum` si `segment` no está en default |
| `apps/backend/src/modules/models/models.service.spec.ts` | Tests integración `extendEnum` + create/update |
| `apps/backend/src/modules/versions/versions.dto.admin.ts` | `fuel`/`transmission` a `z.string().regex(...)` |
| `apps/backend/src/modules/versions/versions.service.ts` | `create`/`update` llaman `extendEnum` para fuel/transmission |
| `apps/backend/src/modules/versions/versions.service.spec.ts` | Tests integración |
| `apps/backend/src/modules/maintenance/maintenance.controller.ts` | Nuevo handler `listAllPublic` |
| `apps/backend/src/modules/maintenance/maintenance.service.ts` | Método `listAllPublic()` con select mínimo |
| `apps/backend/src/modules/maintenance/maintenance.routes.ts` | `GET /` público (sin auth) |
| `apps/backend/src/modules/maintenance/maintenance.controller.spec.ts` | Test del endpoint público |

### Frontend (nuevo)
| Archivo | Responsabilidad |
|---|---|
| `apps/frontend/src/app/shared/ui/search-input.component.{ts,html,css}` | Input con lupa + X condicional |
| `apps/frontend/src/app/shared/ui/search-input.component.spec.ts` | Test X visible/oculto + clear |
| `apps/frontend/src/app/features/admin/fields/text-field.component.{ts,html,css}` | Input text con `[multiline]` |
| `apps/frontend/src/app/features/admin/fields/number-field.component.{ts,html,css}` | Input number |
| `apps/frontend/src/app/features/admin/fields/toggle-field.component.{ts,html,css}` | Switch accesible (`role="switch"`) |
| `apps/frontend/src/app/features/admin/fields/select-search.component.{ts,html,css}` | Combobox buscable (FK o enum + allowOther) |
| `apps/frontend/src/app/features/admin/fields/image-upload-field.component.{ts,html,css}` | Dropzone + preview + upload |

### Frontend (modificado)
| Archivo | Cambio |
|---|---|
| `apps/frontend/src/app/core/api.service.ts` | Método `upload(file: File)` |
| `apps/frontend/src/app/features/admin/entity-schemas.ts` | Tipos `FieldKind`/`FieldMeta` + tabla `FIELD_METAS` |
| `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html,css}` | Refactor declarativo con `FIELD_METAS`; ocultar `id`; sanitizar JSON |
| `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts` | Tests: id no se renderiza, JSON sanitizado, FK=select, enum=select+other, image=upload, boolean=toggle |
| `apps/frontend/src/app/features/admin/admin-dashboard.component.{ts,spec.ts}` | Mantención usa `/admin/maintenance` |
| `apps/frontend/src/app/features/admin/brands-admin.component.{ts,html,spec.ts}` | Usa `<app-search-input>` |
| `apps/frontend/src/app/features/admin/models-admin.component.{ts,html,spec.ts}` | Usa `<app-search-input>` |
| `apps/frontend/src/app/features/admin/versions-admin.component.{ts,html,spec.ts}` | Usa `<app-search-input>` |
| `apps/frontend/src/app/features/admin/equipment-admin.component.{ts,html,spec.ts}` | Usa `<app-search-input>` |
| `apps/frontend/src/app/features/admin/maintenance-admin.component.{ts,html,spec.ts}` | Filtra items por `versionId` |

---

## Task 1: Helper `extendEnum` (backend)

**Files:**
- Create: `apps/backend/src/shared/enum-extension.ts`
- Create: `apps/backend/src/shared/enum-extension.spec.ts`

**Interfaces:**
- Produces: `export async function extendEnum(prisma: PrismaClient, enumName: EnumName, newValue: string): Promise<void>`

- [ ] **Step 1: Escribir el test fallido**

`apps/backend/src/shared/enum-extension.spec.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { extendEnum, type EnumName } from "./enum-extension.js";

const prisma = new PrismaClient();

describe("extendEnum", () => {
  beforeEach(async () => {
    // Conexión al test DB (pglite configurado en vitest.config.ts)
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("rechaza valores con caracteres no permitidos (anti-SQL-injection)", async () => {
    await expect(extendEnum(prisma, "Segment", "lowercase")).rejects.toThrow(/Valor inválido/);
    await expect(extendEnum(prisma, "Segment", "BAD-VALUE")).rejects.toThrow(/Valor inválido/);
    await expect(extendEnum(prisma, "Segment", "")).rejects.toThrow(/Valor inválido/);
    await expect(
      extendEnum(prisma, "Segment", "'; DROP TABLE \"Model\"; --"),
    ).rejects.toThrow(/Valor inválido/);
  });

  it("agrega un valor nuevo al enum Segment y permite usarlo", async () => {
    const newValue = `TEST_SEGMENT_${Date.now()}`;
    await extendEnum(prisma, "Segment", newValue);
    await expect(
      prisma.$queryRawUnsafe<{ enumlabel: string }[]>(
        `SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Segment')`,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ enumlabel: newValue })]),
    );
  });

  it("es idempotente: llamar 2 veces con el mismo valor no rompe", async () => {
    const newValue = `TEST_DUP_${Date.now()}`;
    await extendEnum(prisma, "Fuel", newValue);
    await expect(extendEnum(prisma, "Fuel", newValue)).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/backend && npx vitest run src/shared/enum-extension.spec.ts`
Expected: FAIL con "Cannot find module './enum-extension.js'".

- [ ] **Step 3: Implementar el helper**

`apps/backend/src/shared/enum-extension.ts`:
```ts
import type { PrismaClient } from "@prisma/client";

export type EnumName = "Segment" | "Fuel" | "Transmission";

const ENUM_VALUE_REGEX = /^[A-Z0-9_]+$/;

export async function extendEnum(
  prisma: PrismaClient,
  enumName: EnumName,
  newValue: string,
): Promise<void> {
  if (!ENUM_VALUE_REGEX.test(newValue)) {
    throw new Error(`Valor inválido para enum ${enumName}: ${newValue}`);
  }
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS '${newValue}'`,
  );
  // Postgres cachea definiciones de enum por sesión. Forzamos reconnect.
  await prisma.$disconnect();
  await prisma.$connect();
}
```

- [ ] **Step 4: Correr el test, debe pasar**

Run: `cd apps/backend && npx vitest run src/shared/enum-extension.spec.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/shared/enum-extension.ts apps/backend/src/shared/enum-extension.spec.ts
git commit -m "feat(be): add extendEnum helper for dynamic enum extension"
```

---

## Task 2: DTOs relajados + integración en ModelsService

**Files:**
- Modify: `apps/backend/src/modules/models/models.dto.admin.ts`
- Modify: `apps/backend/src/modules/models/models.service.ts`
- Modify: `apps/backend/src/modules/models/models.service.spec.ts` (crear si no existe)

**Interfaces:**
- Consumes: `extendEnum` de Task 1
- Produces: `ModelsService.create(input)` y `ModelsService.update(id, input)` que extienden `Segment` cuando `input.segment` no está en default

- [ ] **Step 1: Escribir el test de integración fallido**

Agregar a `apps/backend/src/modules/models/models.service.spec.ts`:
```ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ModelsService } from "./models.service.js";

const prisma = new PrismaClient();
const svc = new ModelsService(prisma);

describe("ModelsService + extendEnum", () => {
  beforeEach(async () => {
    // Asumimos brand sembrada en el test setup.
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create() crea un modelo con un segmento nuevo (extiende enum)", async () => {
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const newSegment = `TEST_NEW_SEG_${Date.now()}`;
    const created = await svc.create({
      brandId: brand.id,
      name: `Modelo Test ${Date.now()}`,
      segment: newSegment,
      imageUrl: null,
      galleryUrls: [],
    });
    expect(created.segment).toBe(newSegment);
  });

  it("create() rechaza segmento con formato inválido", async () => {
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    await expect(
      svc.create({
        brandId: brand.id,
        name: "X",
        segment: "invalid-lowercase",
        imageUrl: null,
        galleryUrls: [],
      }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/backend && npx vitest run src/modules/models/models.service.spec.ts`
Expected: FAIL en `create()` porque el DTO rechaza el valor nuevo con `z.enum`.

- [ ] **Step 3: Relajar el DTO**

`apps/backend/src/modules/models/models.dto.admin.ts`:
```ts
import { z } from "zod";

export const SEGMENTS = ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

export const createModelSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(2).max(80),
  segment: z.string().min(1).max(40).regex(ENUM_REGEX),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).default([]),
});

export const updateModelSchema = createModelSchema.partial().omit({ brandId: true });

export type CreateModelInput = z.infer<typeof createModelSchema>;
export type UpdateModelInput = z.infer<typeof updateModelSchema>;
```

- [ ] **Step 4: Integrar extendEnum en ModelsService**

`apps/backend/src/modules/models/models.service.ts`, en `create()`:
```ts
import { extendEnum } from "../../shared/enum-extension.js";
import { SEGMENTS, type CreateModelInput } from "./models.dto.admin.js";

async create(input: CreateModelInput) {
  if (!SEGMENTS.includes(input.segment as (typeof SEGMENTS)[number])) {
    await extendEnum(this.prisma, "Segment", input.segment);
  }
  return this.prisma.model.create({
    data: input as Prisma.ModelUncheckedCreateInput,
  });
}
```

En `update()`:
```ts
async update(id: string, input: UpdateModelInput) {
  if (input.segment && !SEGMENTS.includes(input.segment as (typeof SEGMENTS)[number])) {
    await extendEnum(this.prisma, "Segment", input.segment);
  }
  // ... resto sin cambios
}
```

- [ ] **Step 5: Correr el test, debe pasar**

Run: `cd apps/backend && npx vitest run src/modules/models/models.service.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/models/
git commit -m "feat(be): relax model segment DTO + extend enum at runtime"
```

---

## Task 3: DTOs relajados + integración en VersionsService

**Files:**
- Modify: `apps/backend/src/modules/versions/versions.dto.admin.ts`
- Modify: `apps/backend/src/modules/versions/versions.service.ts`
- Modify: `apps/backend/src/modules/versions/versions.service.spec.ts`

**Interfaces:**
- Consumes: `extendEnum` de Task 1
- Produces: `VersionsService.create()` y `VersionsService.update()` que extienden `Fuel` y `Transmission`

- [ ] **Step 1: Test de integración**

Agregar a `apps/backend/src/modules/versions/versions.service.spec.ts`:
```ts
import { describe, expect, it, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { VersionsService } from "./versions.service.js";

const prisma = new PrismaClient();
const svc = new VersionsService(prisma);

describe("VersionsService + extendEnum", () => {
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create() crea una versión con fuel y transmission nuevos", async () => {
    const model = await prisma.model.findFirstOrThrow();
    const newFuel = `TEST_FUEL_${Date.now()}`;
    const newTrans = `TEST_TRANS_${Date.now()}`;
    const created = await svc.create({
      modelId: model.id,
      name: `Versión Test ${Date.now()}`,
      year: 2026,
      priceClp: 1000000,
      transmission: newTrans,
      fuel: newFuel,
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
    });
    expect(created.fuel).toBe(newFuel);
    expect(created.transmission).toBe(newTrans);
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/backend && npx vitest run src/modules/versions/versions.service.spec.ts`
Expected: FAIL por Zod enum.

- [ ] **Step 3: Relajar DTO**

`apps/backend/src/modules/versions/versions.dto.admin.ts`:
```ts
import { z } from "zod";

export const FUELS = ["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"] as const;
export const TRANSMISSIONS = ["MANUAL", "AUTOMATIC", "CVT", "DCT"] as const;
export const ENUM_REGEX = /^[A-Z0-9_]+$/;

export const createVersionSchema = z.object({
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

export const updateVersionSchema = createVersionSchema.partial().omit({ modelId: true });

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
export type UpdateVersionInput = z.infer<typeof updateVersionSchema>;
```

- [ ] **Step 4: Integrar extendEnum en VersionsService**

`apps/backend/src/modules/versions/versions.service.ts`, en `create()`:
```ts
import { extendEnum } from "../../shared/enum-extension.js";
import { FUELS, TRANSMISSIONS, type CreateVersionInput } from "./versions.dto.admin.js";

async create(input: CreateVersionInput) {
  const model = await this.prisma.model.findFirst({
    where: { id: input.modelId, deletedAt: null },
  });
  if (!model) throw notFound("Modelo no encontrado");

  if (!FUELS.includes(input.fuel as (typeof FUELS)[number])) {
    await extendEnum(this.prisma, "Fuel", input.fuel);
  }
  if (!TRANSMISSIONS.includes(input.transmission as (typeof TRANSMISSIONS)[number])) {
    await extendEnum(this.prisma, "Transmission", input.transmission);
  }

  return this.prisma.version.create({
    data: input as Prisma.VersionUncheckedCreateInput,
  });
}
```

En `update()` aplicar el mismo patrón para `fuel` y `transmission` cuando estén presentes.

- [ ] **Step 5: Correr el test, debe pasar**

Run: `cd apps/backend && npx vitest run src/modules/versions/versions.service.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/versions/
git commit -m "feat(be): relax version fuel/transmission DTO + extend enum at runtime"
```

---

## Task 4: Módulo `uploads/` (backend)

**Files:**
- Modify: `apps/backend/package.json` (sumar multer + @types/multer)
- Create: `apps/backend/src/modules/uploads/uploads.routes.ts`
- Create: `apps/backend/src/modules/uploads/uploads.controller.ts`
- Create: `apps/backend/src/modules/uploads/uploads.controller.spec.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Produces: `POST /api/v1/admin/uploads` → `{ data: { url, filename, size, mime } }`

- [ ] **Step 1: Sumar dependencias**

```bash
cd apps/backend && pnpm add multer && pnpm add -D @types/multer
```

- [ ] **Step 2: Escribir test del controller**

`apps/backend/src/modules/uploads/uploads.controller.spec.ts`:
```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../app.js";
import { prisma } from "../../infra/prisma.js";
import { loginAsAdmin } from "../../__tests__/helpers.js";

describe("uploadsController", () => {
  let app: express.Express;
  let cookie: string;

  beforeEach(async () => {
    app = createApp();
    cookie = await loginAsAdmin(app);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("401 sin auth", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .attach("file", Buffer.from("hello"), { filename: "x.png", contentType: "image/png" });
    expect(res.status).toBe(401);
  });

  it("200 happy path con PNG válido", async () => {
    // 1x1 PNG transparente
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
      "base64",
    );
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", png, { filename: "test.png", contentType: "image/png" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      url: expect.stringMatching(/^\/uploads\/\d{4}-\d{2}\/[A-Za-z0-9_-]+\.png$/),
      mime: "image/png",
    });
  });

  it("rechaza mime no-imagen", async () => {
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("hello"), { filename: "x.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(400);
  });

  it("rechaza archivo >5MB", async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 0);
    const res = await request(app)
      .post("/api/v1/admin/uploads")
      .set("Cookie", cookie)
      .attach("file", big, { filename: "big.png", contentType: "image/png" });
    expect(res.status).toBe(413);
  });
});
```

Nota: `__tests__/helpers.ts` debe exportar `loginAsAdmin(app)`. Si no existe, crearlo siguiendo el patrón de `auth.controller.spec.ts` (login con credenciales sembradas en `prisma/seed.ts`).

- [ ] **Step 3: Correr el test, debe fallar**

Run: `cd apps/backend && npx vitest run src/modules/uploads/uploads.controller.spec.ts`
Expected: FAIL con "Cannot find module".

- [ ] **Step 4: Implementar el controller**

`apps/backend/src/modules/uploads/uploads.controller.ts`:
```ts
import type { Request, Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { badRequest } from "../../shared/errors.js";

const ALLOWED_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const PUBLIC_DIR = path.resolve(process.cwd(), "public", "uploads");

export const uploadsController = {
  upload: ah(async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) throw badRequest("Archivo requerido");
    const ext = ALLOWED_MIMES[file.mimetype];
    if (!ext) throw badRequest(`Mime no permitido: ${file.mimetype}`);

    const now = new Date();
    const yyyyMm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dir = path.join(PUBLIC_DIR, yyyyMm);
    await mkdir(dir, { recursive: true });

    const filename = `${nanoid(10)}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, file.buffer);

    const url = `/uploads/${yyyyMm}/${filename}`;
    res.json(ok({ url, filename, size: file.size, mime: file.mimetype }));
  }),
};
```

- [ ] **Step 5: Implementar el router**

`apps/backend/src/modules/uploads/uploads.routes.ts`:
```ts
import { Router } from "express";
import multer from "multer";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { uploadsController } from "./uploads.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadsAdminRouter = Router();
uploadsAdminRouter.use(authenticate, requireRole("ADMIN"));
uploadsAdminRouter.post("/", upload.single("file"), uploadsController.upload);
```

- [ ] **Step 6: Registrar en app.ts**

En `apps/backend/src/app.ts`, agregar:
```ts
import express from "express";
import path from "node:path";
import { uploadsAdminRouter } from "./modules/uploads/uploads.routes.js";

// ... después de los otros routers
app.use("/api/v1/admin/uploads", uploadsAdminRouter);
app.use("/uploads", express.static(path.resolve(process.cwd(), "public", "uploads")));
```

- [ ] **Step 7: Correr el test, debe pasar**

Run: `cd apps/backend && npx vitest run src/modules/uploads/uploads.controller.spec.ts`
Expected: PASS (4/4).

- [ ] **Step 8: Commit**

```bash
git add apps/backend/package.json pnpm-lock.yaml apps/backend/src/modules/uploads/ apps/backend/src/app.ts
git commit -m "feat(be): add uploads module (local disk, multer, mime whitelist)"
```

---

## Task 5: Endpoint público `/maintenance`

**Files:**
- Modify: `apps/backend/src/modules/maintenance/maintenance.controller.ts`
- Modify: `apps/backend/src/modules/maintenance/maintenance.service.ts`
- Modify: `apps/backend/src/modules/maintenance/maintenance.routes.ts`
- Modify or Create: `apps/backend/src/modules/maintenance/maintenance.controller.spec.ts`

**Interfaces:**
- Produces: `GET /api/v1/maintenance` (sin auth) → `{ data: MaintenanceCost[] }` con shape mínimo

- [ ] **Step 1: Test del endpoint público**

En `apps/backend/src/modules/maintenance/maintenance.controller.spec.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../app.js";
import { prisma } from "../../infra/prisma.js";

describe("maintenance GET /", () => {
  let app: express.Express;
  beforeAll(() => { app = createApp(); });
  afterAll(async () => { await prisma.$disconnect(); });

  it("200 sin auth con shape correcto", async () => {
    const res = await request(app).get("/api/v1/maintenance");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          versionId: expect.any(String),
          mileageTag: expect.any(Number),
          costClp: expect.any(Number),
        }),
      );
    }
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/backend && npx vitest run src/modules/maintenance/maintenance.controller.spec.ts`
Expected: 404 (ruta no existe).

- [ ] **Step 3: Implementar service + controller + route**

En `apps/backend/src/modules/maintenance/maintenance.service.ts`, agregar:
```ts
listAllPublic() {
  return this.prisma.maintenanceCost.findMany({
    where: {
      deletedAt: null,
      version: { deletedAt: null, model: { deletedAt: null, brand: { deletedAt: null } } },
    },
    orderBy: [{ versionId: "asc" }, { mileageTag: "asc" }],
    select: { id: true, versionId: true, mileageTag: true, costClp: true },
  });
}
```

En `apps/backend/src/modules/maintenance/maintenance.controller.ts`, agregar:
```ts
listAllPublic: ah(async (_req: Request, res: Response) => {
  res.json(ok(await svc.listAllPublic()));
}),
```

En `apps/backend/src/modules/maintenance/maintenance.routes.ts`:
```ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { maintenanceController } from "./maintenance.controller.js";

export const maintenanceRouter = Router();
maintenanceRouter.get("/", maintenanceController.listAllPublic);
maintenanceRouter.get("/version/:versionId", maintenanceController.listByVersion);

export const maintenanceAdminRouter = Router();
maintenanceAdminRouter.use(authenticate, requireRole("ADMIN"));
maintenanceAdminRouter.get("/", maintenanceController.listAll);
maintenanceAdminRouter.post("/", maintenanceController.create);
maintenanceAdminRouter.patch("/:id", maintenanceController.update);
maintenanceAdminRouter.delete("/:id", maintenanceController.softDelete);
```

- [ ] **Step 4: Correr el test, debe pasar**

Run: `cd apps/backend && npx vitest run src/modules/maintenance/maintenance.controller.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/maintenance/
git commit -m "feat(be): public GET /maintenance endpoint for dashboard count"
```

---

## Task 6: ApiService.upload (frontend)

**Files:**
- Modify: `apps/frontend/src/app/core/api.service.ts`
- Create: `apps/frontend/src/app/core/api.service.spec.ts` (si no existe)

**Interfaces:**
- Produces: `upload(file: File): Promise<{ data: { url: string; filename: string; size: number; mime: string } }>`

- [ ] **Step 1: Test de ApiService.upload**

`apps/frontend/src/app/core/api.service.spec.ts`:
```ts
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { ApiService } from "./api.service";

describe("ApiService.upload", () => {
  it("envía FormData con el archivo y devuelve la URL del backend", async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(ApiService);
    const file = new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" });

    const promise = api.upload(file);
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne("/api/v1/admin/uploads");
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: { url: "/uploads/2026-07/abc.png", filename: "abc.png", size: 3, mime: "image/png" } });

    await expect(promise).resolves.toEqual({
      data: { url: "/uploads/2026-07/abc.png", filename: "abc.png", size: 3, mime: "image/png" },
    });
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/api.service.spec.ts' --watch=false`
Expected: FAIL porque `upload` no existe.

- [ ] **Step 3: Implementar upload**

`apps/frontend/src/app/core/api.service.ts`, agregar al final de la clase:
```ts
async upload(file: File): Promise<{ data: { url: string; filename: string; size: number; mime: string } }> {
  const fd = new FormData();
  fd.append('file', file);
  return firstValueFrom(
    this.http.post<{ data: { url: string; filename: string; size: number; mime: string } }>(
      `${ENV.apiBase}/admin/uploads`,
      fd,
      { withCredentials: true },
    ),
  );
}
```

- [ ] **Step 4: Correr el test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/api.service.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/core/api.service.ts apps/frontend/src/app/core/api.service.spec.ts
git commit -m "feat(fe): ApiService.upload with FormData"
```

---

## Task 7: `SearchInputComponent` compartido

**Files:**
- Create: `apps/frontend/src/app/shared/ui/search-input.component.ts`
- Create: `apps/frontend/src/app/shared/ui/search-input.component.html`
- Create: `apps/frontend/src/app/shared/ui/search-input.component.css`
- Create: `apps/frontend/src/app/shared/ui/search-input.component.spec.ts`

**Interfaces:**
- Produces: `selector: 'app-search-input'` con inputs `value` (model), `placeholder` (input), output `changed`

- [ ] **Step 1: Test del componente**

`apps/frontend/src/app/shared/ui/search-input.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SearchInputComponent] });
    fixture = TestBed.createComponent(SearchInputComponent);
    fixture.componentRef.setInput('placeholder', 'Buscar…');
    fixture.detectChanges();
  });

  it('no muestra la X cuando el value está vacío', () => {
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button[aria-label="Limpiar búsqueda"]');
    expect(btn).toBeNull();
  });

  it('muestra la X cuando hay value y emite "" al hacer click', () => {
    fixture.componentRef.setInput('value', 'toyota');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Limpiar búsqueda"]');
    expect(btn).toBeTruthy();
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((v: string) => emitted.push(v));
    btn.click();
    expect(emitted).toEqual(['']);
    expect(fixture.componentInstance.value()).toBe('');
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/search-input.component.spec.ts' --watch=false`
Expected: FAIL porque el componente no existe.

- [ ] **Step 3: Crear los archivos**

`apps/frontend/src/app/shared/ui/search-input.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Buscar…');
  readonly changed = output<string>();

  clear(): void {
    this.value.set('');
    this.changed.emit('');
  }

  onInput(v: string): void {
    this.value.set(v);
    this.changed.emit(v);
  }
}
```

`apps/frontend/src/app/shared/ui/search-input.component.html`:
```html
<div class="relative w-full">
  <input
    type="text"
    class="w-full rounded border border-border pl-9 pr-9 py-2 text-sm bg-surface"
    [value]="value()"
    (input)="onInput($any($event.target).value)"
    [placeholder]="placeholder()"
    [attr.aria-label]="placeholder()"
  />
  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-base pointer-events-none">search</span>
  @if (value()) {
    <button
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink rounded-full p-0.5"
      (click)="clear()"
      aria-label="Limpiar búsqueda"
    >
      <span class="material-symbols-outlined text-base">close</span>
    </button>
  }
</div>
```

`apps/frontend/src/app/shared/ui/search-input.component.css`:
```css
:host { display: block; width: 100%; }
```

- [ ] **Step 4: Correr el test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/search-input.component.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/shared/ui/search-input.component.*
git commit -m "feat(fe): shared SearchInputComponent with X to clear"
```

---

## Task 8: Integrar SearchInput en los 4 CRUD

**Files:**
- Modify: `apps/frontend/src/app/features/admin/brands-admin.component.{ts,html}`
- Modify: `apps/frontend/src/app/features/admin/models-admin.component.{ts,html}`
- Modify: `apps/frontend/src/app/features/admin/versions-admin.component.{ts,html}`
- Modify: `apps/frontend/src/app/features/admin/equipment-admin.component.{ts,html}`

**Interfaces:**
- Consumes: `<app-search-input>` de Task 7

- [ ] **Step 1: BrandsAdmin**

En `brands-admin.component.ts`, agregar import:
```ts
import { SearchInputComponent } from '../../shared/ui/search-input.component';
```

Y agregar a `imports` array: `SearchInputComponent`.

En `brands-admin.component.html`, reemplazar el `<input>` de búsqueda por:
```html
<app-search-input
  placeholder="Buscar marca…"
  [value]="search()"
  (changed)="onSearch($event)"
/>
```

- [ ] **Step 2: ModelsAdmin**

Mismo cambio en `models-admin.component.ts` (import + agregar a imports).
En `models-admin.component.html`:
```html
<app-search-input
  placeholder="Buscar modelo, marca o segmento…"
  [value]="search()"
  (changed)="onSearch($event)"
/>
```

- [ ] **Step 3: VersionsAdmin**

Mismo cambio. En `versions-admin.component.html`:
```html
<app-search-input
  placeholder="Buscar versión, modelo o año…"
  [value]="search()"
  (changed)="onSearch($event)"
/>
```

- [ ] **Step 4: EquipmentAdmin**

Mismo cambio. En `equipment-admin.component.html`:
```html
<app-search-input
  placeholder="Buscar equipamiento o categoría…"
  [value]="search()"
  (changed)="onSearch($event)"
/>
```

- [ ] **Step 5: Correr tests existentes**

Run: `cd apps/frontend && npx ng test --watch=false`
Expected: PASS (sin tests nuevos; los specs existentes deben seguir pasando).

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/features/admin/brands-admin.component.* apps/frontend/src/app/features/admin/models-admin.component.* apps/frontend/src/app/features/admin/versions-admin.component.* apps/frontend/src/app/features/admin/equipment-admin.component.*
git commit -m "feat(fe): use SearchInputComponent in all CRUD admin pages"
```

---

## Task 9: `TextFieldComponent` y `NumberFieldComponent`

**Files:**
- Create: `apps/frontend/src/app/features/admin/fields/text-field.component.{ts,html,css}`
- Create: `apps/frontend/src/app/features/admin/fields/number-field.component.{ts,html,css}`

**Interfaces:**
- Produces: `selector: 'app-text-field'` y `selector: 'app-number-field'` con `control: FormControl` input

- [ ] **Step 1: TextFieldComponent**

`apps/frontend/src/app/features/admin/fields/text-field.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  readonly control = input.required<FormControl<string | null>>();
  readonly multiline = input<boolean>(false);
}
```

`apps/frontend/src/app/features/admin/fields/text-field.component.html`:
```html
@if (multiline()) {
  <textarea
    rows="2"
    class="rounded border border-border px-2 py-1.5 text-sm bg-surface"
    [formControl]="$any(control())"
  ></textarea>
} @else {
  <input
    type="text"
    class="rounded border border-border px-2 py-1.5 text-sm bg-surface w-full"
    [formControl]="$any(control())"
  />
}
```

`apps/frontend/src/app/features/admin/fields/text-field.component.css`:
```css
:host { display: block; width: 100%; }
```

- [ ] **Step 2: NumberFieldComponent**

`apps/frontend/src/app/features/admin/fields/number-field.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-field',
  imports: [ReactiveFormsModule],
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberFieldComponent {
  readonly control = input.required<FormControl<number | null>>();
}
```

`apps/frontend/src/app/features/admin/fields/number-field.component.html`:
```html
<input
  type="number"
  class="rounded border border-border px-2 py-1.5 text-sm bg-surface w-full"
  [formControl]="$any(control())"
/>
```

`apps/frontend/src/app/features/admin/fields/number-field.component.css`:
```css
:host { display: block; width: 100%; }
```

- [ ] **Step 3: Build local**

Run: `cd apps/frontend && npx ng build --configuration development 2>&1 | tail -20`
Expected: sin errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/features/admin/fields/text-field.component.* apps/frontend/src/app/features/admin/fields/number-field.component.*
git commit -m "feat(fe): add TextField and NumberField reusable components"
```

---

## Task 10: `ToggleFieldComponent`

**Files:**
- Create: `apps/frontend/src/app/features/admin/fields/toggle-field.component.{ts,html,css}`
- Create: `apps/frontend/src/app/features/admin/fields/toggle-field.component.spec.ts`

**Interfaces:**
- Produces: `selector: 'app-toggle-field'` con `control: FormControl<boolean>` input

- [ ] **Step 1: Test**

`apps/frontend/src/app/features/admin/fields/toggle-field.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToggleFieldComponent } from './toggle-field.component';

describe('ToggleFieldComponent', () => {
  it('renderiza aria-checked=false cuando control.value es false', () => {
    TestBed.configureTestingModule({ imports: [ToggleFieldComponent] });
    const fixture = TestBed.createComponent(ToggleFieldComponent);
    const ctrl = new FormControl<boolean>(false, { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[role="switch"]');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('click cambia el valor del control y aria-checked', () => {
    TestBed.configureTestingModule({ imports: [ToggleFieldComponent] });
    const fixture = TestBed.createComponent(ToggleFieldComponent);
    const ctrl = new FormControl<boolean>(false, { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[role="switch"]');
    btn.click();
    expect(ctrl.value).toBe(true);
    fixture.detectChanges();
    expect(btn.getAttribute('aria-checked')).toBe('true');
  });
});
```

- [ ] **Step 2: Correr test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/toggle-field.component.spec.ts' --watch=false`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`apps/frontend/src/app/features/admin/fields/toggle-field.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle-field',
  imports: [ReactiveFormsModule],
  templateUrl: './toggle-field.component.html',
  styleUrl: './toggle-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleFieldComponent {
  readonly control = input.required<FormControl<boolean>>();

  toggle(): void {
    const c = this.control();
    c.setValue(!c.value);
    c.markAsDirty();
  }
}
```

`apps/frontend/src/app/features/admin/fields/toggle-field.component.html`:
```html
<button
  type="button"
  role="switch"
  [attr.aria-checked]="control().value"
  (click)="toggle()"
  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
  [class.bg-brand-600]="control().value"
  [class.bg-border]="!control().value"
>
  <span
    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
    [class.translate-x-6]="control().value"
    [class.translate-x-1]="!control().value"
  ></span>
</button>
```

`apps/frontend/src/app/features/admin/fields/toggle-field.component.css`:
```css
:host { display: inline-block; }
```

- [ ] **Step 4: Correr test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/toggle-field.component.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin/fields/toggle-field.component.*
git commit -m "feat(fe): ToggleFieldComponent accessible switch for booleans"
```

---

## Task 11: `SelectSearchComponent`

**Files:**
- Create: `apps/frontend/src/app/features/admin/fields/select-search.component.{ts,html,css}`
- Create: `apps/frontend/src/app/features/admin/fields/select-search.component.spec.ts`

**Interfaces:**
- Produces: combobox buscable con:
  - inputs: `control: FormControl<string>`, `options?: string[]`, `optionsApi?: string`, `optionLabel?: string`, `allowOther?: boolean`

- [ ] **Step 1: Test**

`apps/frontend/src/app/features/admin/fields/select-search.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectSearchComponent } from './select-search.component';

describe('SelectSearchComponent', () => {
  it('con options estáticas filtra la lista al tipear', async () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV', 'PICKUP']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = 'SU';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('SUV');
  });

  it('con optionsApi carga opciones via GET', async () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('optionsApi', '/brands');
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne('/api/v1/brands');
    req.flush({ data: [{ id: 'b1', name: 'Toyota' }, { id: 'b2', name: 'Ford' }] });
    await fixture.whenStable();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(items.length).toBe(2);
  });

  it('con allowOther permite tipear valor no listado y asignarlo al control', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV']);
    fixture.componentRef.setInput('allowOther', true);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = 'ELECTRIC_SUV';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[data-testid="select-other"]');
    expect(btn).toBeTruthy();
    btn.click();
    expect(ctrl.value).toBe('ELECTRIC_SUV');
  });
});
```

- [ ] **Step 2: Correr test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/select-search.component.spec.ts' --watch=false`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`apps/frontend/src/app/features/admin/fields/select-search.component.ts`:
```ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';

interface OptionItem { id?: string; value?: string; label: string; isOther?: boolean; }

@Component({
  selector: 'app-select-search',
  imports: [ReactiveFormsModule],
  templateUrl: './select-search.component.html',
  styleUrl: './select-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSearchComponent implements OnInit {
  private api = inject(ApiService);
  private el = inject(ElementRef<HTMLElement>);

  readonly control = input.required<FormControl<string>>();
  readonly options = input<string[] | null>(null);
  readonly optionsApi = input<string | null>(null);
  readonly optionLabel = input<string>('name');
  readonly allowOther = input<boolean>(false);

  readonly query = signal('');
  readonly open = signal(false);
  readonly remoteOptions = signal<{ id: string; [k: string]: unknown }[]>([]);
  private inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  readonly filtered = computed<OptionItem[]>(() => {
    const q = this.query().toLowerCase();
    const staticOpts: OptionItem[] = (this.options() ?? []).map((v) => ({ value: v, label: v }));
    const remoteOpts: OptionItem[] = this.remoteOptions().map((o) => ({
      id: o['id'] as string,
      label: String(o[this.optionLabel()] ?? ''),
    }));
    const all = [...staticOpts, ...remoteOpts];
    const matches = q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
    if (this.allowOther() && q && !matches.some((m) => m.label.toLowerCase() === q)) {
      matches.push({ label: `Otro: ${this.query()}`, isOther: true });
    }
    return matches;
  });

  ngOnInit(): void {
    if (this.optionsApi()) {
      void this.loadRemote();
    }
    const current = this.control().value;
    if (current) this.query.set(current);
  }

  private async loadRemote(): Promise<void> {
    try {
      const res = await this.api.get<{ data: { id: string }[] }>(this.optionsApi()!);
      this.remoteOptions.set(res.data as { id: string }[]);
    } catch {
      this.remoteOptions.set([]);
    }
  }

  onInput(v: string): void {
    this.query.set(v);
    this.open.set(true);
  }

  pick(item: OptionItem): void {
    if (item.isOther) {
      this.control().setValue(this.query().toUpperCase());
    } else {
      this.control().setValue(item.value ?? item.label);
    }
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
```

`apps/frontend/src/app/features/admin/fields/select-search.component.html`:
```html
<div class="relative w-full">
  <input
    #input
    type="text"
    role="combobox"
    [attr.aria-expanded]="open()"
    aria-autocomplete="list"
    [value]="query()"
    (input)="onInput($any($event.target).value)"
    (focus)="open.set(true)"
    (keydown.escape)="open.set(false)"
    class="w-full rounded border border-border px-2 py-1.5 text-sm bg-surface"
  />
  @if (open() && filtered().length > 0) {
    <ul role="listbox" class="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded border border-border bg-surface shadow-e2">
      @for (item of filtered(); track item.label) {
        <li
          role="option"
          class="px-3 py-1.5 text-sm cursor-pointer hover:bg-brand-50"
          [class.font-bold]="item.isOther"
          (click)="pick(item)"
        >
          @if (item.isOther) {
            <button type="button" data-testid="select-other" class="w-full text-left">{{ item.label }}</button>
          } @else {
            {{ item.label }}
          }
        </li>
      }
    </ul>
  }
</div>
```

`apps/frontend/src/app/features/admin/fields/select-search.component.css`:
```css
:host { display: block; width: 100%; }
```

- [ ] **Step 4: Correr test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/select-search.component.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin/fields/select-search.component.*
git commit -m "feat(fe): SelectSearchComponent (combobox with FK/enum/allowOther)"
```

---

## Task 12: `ImageUploadFieldComponent`

**Files:**
- Create: `apps/frontend/src/app/features/admin/fields/image-upload-field.component.{ts,html,css}`
- Create: `apps/frontend/src/app/features/admin/fields/image-upload-field.component.spec.ts`

**Interfaces:**
- Produces: `selector: 'app-image-upload-field'` con `control: FormControl<string | null>` input

- [ ] **Step 1: Test**

`apps/frontend/src/app/features/admin/fields/image-upload-field.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ImageUploadFieldComponent } from './image-upload-field.component';

describe('ImageUploadFieldComponent', () => {
  it('muestra preview cuando control.value es una URL', () => {
    TestBed.configureTestingModule({ imports: [ImageUploadFieldComponent] });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>('/uploads/2026-07/abc.png');
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img[data-testid="preview"]');
    expect(img.src).toContain('/uploads/2026-07/abc.png');
  });

  it('al seleccionar un archivo, sube y asigna la URL al control', async () => {
    TestBed.configureTestingModule({
      imports: [ImageUploadFieldComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>(null);
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' });
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input[type="file"]');
    Object.defineProperty(inputEl, 'files', { value: [file] });
    inputEl.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne('/api/v1/admin/uploads');
    req.flush({ data: { url: '/uploads/2026-07/xyz.png', filename: 'xyz.png', size: 3, mime: 'image/png' } });
    await fixture.whenStable();
    expect(ctrl.value).toBe('/uploads/2026-07/xyz.png');
  });

  it('botón borrar pone el control en null', () => {
    TestBed.configureTestingModule({ imports: [ImageUploadFieldComponent] });
    const fixture = TestBed.createComponent(ImageUploadFieldComponent);
    const ctrl = new FormControl<string | null>('/uploads/x.png');
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[data-testid="clear"]');
    btn.click();
    expect(ctrl.value).toBeNull();
  });
});
```

- [ ] **Step 2: Correr test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/image-upload-field.component.spec.ts' --watch=false`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`apps/frontend/src/app/features/admin/fields/image-upload-field.component.ts`:
```ts
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { ENV } from '../../../core/env';

@Component({
  selector: 'app-image-upload-field',
  imports: [ReactiveFormsModule],
  templateUrl: './image-upload-field.component.html',
  styleUrl: './image-upload-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadFieldComponent {
  private api = inject(ApiService);

  readonly control = input.required<FormControl<string | null>>();
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  previewUrl(): string | null {
    const v = this.control().value;
    if (!v) return null;
    if (v.startsWith('http')) return v;
    return `${ENV.apiBase.replace(/\/api\/v1$/, '')}${v}`;
  }

  async onFileChange(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.upload(file);
      this.control().setValue(res.data.url);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  clear(): void {
    this.control().setValue(null);
  }
}
```

`apps/frontend/src/app/features/admin/fields/image-upload-field.component.html`:
```html
<div class="flex flex-col gap-2 w-full">
  @if (previewUrl(); as url) {
    <div class="relative w-full h-32 rounded border border-border overflow-hidden bg-surface">
      <img data-testid="preview" [src]="url" alt="Preview" class="w-full h-full object-contain" />
      <button
        type="button"
        data-testid="clear"
        (click)="clear()"
        class="absolute top-1 right-1 rounded-full bg-surface/90 p-1 text-ink-muted hover:text-warn-dark"
        aria-label="Quitar imagen"
      >
        <span class="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  }
  <label class="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 text-sm cursor-pointer hover:bg-surface w-fit">
    <span class="material-symbols-outlined text-base">upload</span>
    <span>{{ uploading() ? 'Subiendo…' : 'Subir imagen' }}</span>
    <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event)" />
  </label>
  @if (error(); as err) {
    <p class="text-warn-dark text-xs">{{ err }}</p>
  }
</div>
```

`apps/frontend/src/app/features/admin/fields/image-upload-field.component.css`:
```css
:host { display: block; width: 100%; }
```

- [ ] **Step 4: Correr test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/image-upload-field.component.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin/fields/image-upload-field.component.*
git commit -m "feat(fe): ImageUploadFieldComponent with preview + upload"
```

---

## Task 13: `FIELD_METAS` en `entity-schemas.ts`

**Files:**
- Modify: `apps/frontend/src/app/features/admin/entity-schemas.ts`

**Interfaces:**
- Produces: tipos `FieldKind`, `FieldMeta` y constante `FIELD_METAS: Record<EntityKey, FieldMeta[]>`

- [ ] **Step 1: Extender el archivo**

Agregar al final de `apps/frontend/src/app/features/admin/entity-schemas.ts` (antes de los `export type` existentes):

```ts
export type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'foreignKey'
  | 'enumWithOther'
  | 'imageUrl'
  | 'array';

export interface FieldMeta {
  field: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  optionsApi?: string;
  optionLabel?: string;
}

const SEGMENTS = ['SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'CROSSOVER', 'COMMERCIAL'] as const;
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'DCT'] as const;
const FUELS = ['BENCINA', 'DIESEL', 'HYBRID', 'ELECTRIC'] as const;

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
    { field: 'galleryUrls', label: 'Galería', kind: 'array' },
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
```

Nota: esto duplica los `SEGMENTS`/`TRANSMISSIONS`/`FUELS` que ya están exportados arriba. Eliminar las declaraciones duplicadas previas (las 3 líneas `export const SEGMENTS = ...` en la parte superior del archivo). Mantener solo las declaradas aquí dentro del bloque de `FIELD_METAS` (sin `export` o con `export` según preferencia del autor).

- [ ] **Step 2: Verificar build**

Run: `cd apps/frontend && npx ng build --configuration development 2>&1 | tail -10`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/admin/entity-schemas.ts
git commit -m "feat(fe): add FieldMeta types and FIELD_METAS table for all entities"
```

---

## Task 14: Refactor `admin-edit-dialog` con `FIELD_METAS`

**Files:**
- Modify: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html}`
- Modify: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts`

**Interfaces:**
- Consumes: `FIELD_METAS`, `<app-text-field>`, `<app-number-field>`, `<app-toggle-field>`, `<app-select-search>`, `<app-image-upload-field>`
- Produces: dialog que itera `fieldMetas()`, nunca renderiza `id`, JSON inicial sanitizado

- [ ] **Step 1: Actualizar spec del dialog**

Reemplazar el contenido de `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts` con:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

describe('AdminEditDialogComponent', () => {
  function setup(entityKey: 'brand' | 'model' | 'version' | 'equipment' | 'maintenance') {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', entityKey);
    fixture.componentRef.setInput('apiPath', entityKey === 'maintenance' ? 'maintenance' : `${entityKey}s`);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  }

  it('carga el template y arma el form (brand)', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    expect(fixture.componentInstance.form().contains('name')).toBe(true);
  });

  it('nunca renderiza el campo id aunque el current lo incluya', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { id: 'abc-123', name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const labels: string[] = Array.from(fixture.nativeElement.querySelectorAll('label > span:first-child'))
      .map((el: Element) => el.textContent?.trim() ?? '');
    expect(labels.some((l) => l.toLowerCase().includes('id'))).toBe(false);
  });

  it('JSON inicial no incluye id', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { id: 'abc-123', name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const json = JSON.parse(fixture.componentInstance.jsonText());
    expect(json).not.toHaveProperty('id');
    expect(json).toEqual({ name: 'Toyota', logoUrl: null });
  });

  it('model con FK brandId renderiza app-select-search', async () => {
    const { fixture, http } = setup('model');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/model'));
    req.flush({ data: { brandId: '', name: '', segment: 'SEDAN', imageUrl: null, galleryUrls: [] } });
    await fixture.whenStable();
    fixture.detectChanges();
    const sel = fixture.nativeElement.querySelector('app-select-search');
    expect(sel).toBeTruthy();
  });

  it('version con booleans renderiza app-toggle-field', async () => {
    const { fixture, http } = setup('version');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    req.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('app-toggle-field');
    expect(toggles.length).toBe(3);
  });
});
```

- [ ] **Step 2: Correr test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/admin-edit-dialog.component.spec.ts' --watch=false`
Expected: FAIL (los nuevos asserts no se cumplen con la implementación actual).

- [ ] **Step 3: Refactorizar el TS**

Reemplazar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts`:

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
import { KeyValuePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import {
  entitySchemaByKey,
  FIELD_METAS,
  type EntityKey,
  type FieldMeta,
} from './entity-schemas';
import { TextFieldComponent } from './fields/text-field.component';
import { NumberFieldComponent } from './fields/number-field.component';
import { ToggleFieldComponent } from './fields/toggle-field.component';
import { SelectSearchComponent } from './fields/select-search.component';
import { ImageUploadFieldComponent } from './fields/image-upload-field.component';

type Tab = 'form' | 'json';
const HIDDEN_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

function sanitize(value: Record<string, unknown> | null): Record<string, unknown> {
  if (!value) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (HIDDEN_KEYS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

@Component({
  selector: 'app-admin-edit-dialog',
  imports: [
    ReactiveFormsModule,
    KeyValuePipe,
    TextFieldComponent,
    NumberFieldComponent,
    ToggleFieldComponent,
    SelectSearchComponent,
    ImageUploadFieldComponent,
  ],
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
  readonly loadError = signal<string | null>(null);
  readonly loading = signal(true);
  readonly form = signal<FormGroup>(this.fb.group({}));
  readonly isEdit = signal(false);

  readonly fieldMetas = computed<FieldMeta[]>(() => {
    const key = this.entityKey();
    const tpl = this.emptyTemplate();
    const all = FIELD_METAS[key] ?? [];
    // Defensa: si el backend agrega un campo nuevo al template y no está en FIELD_METAS,
    // lo agregamos al final como text por default.
    const known = new Set(all.map((m) => m.field));
    const extras: FieldMeta[] = [];
    for (const k of Object.keys(tpl)) {
      if (!known.has(k) && !HIDDEN_KEYS.has(k)) {
        extras.push({ field: k, label: k, kind: 'text' });
      }
    }
    return [...all, ...extras];
  });

  constructor() {
    effect(() => {
      const key = this.entityKey();
      const e = this.entity();
      this.isEdit.set(e !== null);
      void this.loadAndBuild(key, e);
    });
  }

  private async loadAndBuild(key: EntityKey, current: Record<string, unknown> | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const res = await this.api.get<{ data: Record<string, unknown> }>(
        `/admin/seed/template/${key}`,
      );
      const tpl = res.data;
      this.emptyTemplate.set(tpl);
      this.form.set(this.buildFormGroup(tpl, current));
      this.jsonText.set(JSON.stringify(sanitize(current) ?? tpl, null, 2));
    } catch (err) {
      this.loadError.set(`No se pudo cargar la plantilla: ${(err as Error).message}`);
    } finally {
      this.loading.set(false);
    }
  }

  private buildFormGroup(tpl: Record<string, unknown>, current: Record<string, unknown> | null): FormGroup {
    const value = sanitize(current) ?? tpl;
    const metas = FIELD_METAS[this.entityKey()] ?? [];
    const metaByField = new Map(metas.map((m) => [m.field, m]));
    const controls: Record<string, FormControl> = {};
    for (const k of Object.keys(tpl)) {
      if (HIDDEN_KEYS.has(k)) continue;
      const initial = (value as Record<string, unknown>)[k] ?? tpl[k];
      const ctrl = new FormControl(initial);
      const meta = metaByField.get(k);
      const required = !meta || (meta.kind !== 'foreignKey' && meta.kind !== 'imageUrl' && meta.kind !== 'array');
      if (required) ctrl.addValidators([Validators.required]);
      controls[k] = ctrl;
    }
    return this.fb.group(controls);
  }

  controlFor(field: string): FormControl {
    return this.form().get(field) as FormControl;
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
      this.form.set(this.buildFormGroup(this.emptyTemplate(), result.data));
      this.tab.set('form');
    } catch (e) {
      this.jsonError.set(`JSON inválido: ${(e as Error).message}`);
    }
  }

  onSubmit(): void {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.save.emit(form.getRawValue() as Record<string, unknown>);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
```

- [ ] **Step 4: Refactorizar el HTML**

Reemplazar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html`:

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
      @if (loadError(); as err) {
        <div class="rounded border border-warn bg-warn-light px-3 py-2 text-sm text-warn-dark mb-3">
          {{ err }}
        </div>
      }
      @if (loading()) {
        <p class="text-sm text-ink-muted">Cargando plantilla…</p>
      } @else if (tab() === 'form') {
        <form [formGroup]="form()" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          @for (meta of fieldMetas(); track meta.field) {
            <label class="flex flex-col text-xs">
              <span class="font-bold mb-1">
                {{ meta.label }} <span class="font-normal text-ink-muted">({{ meta.field }})</span>
              </span>
              @switch (meta.kind) {
                @case ('text')       { <app-text-field         [control]="$any(controlFor(meta.field))" /> }
                @case ('number')     { <app-number-field       [control]="$any(controlFor(meta.field))" /> }
                @case ('boolean')    { <app-toggle-field       [control]="$any(controlFor(meta.field))" /> }
                @case ('foreignKey') { <app-select-search      [control]="$any(controlFor(meta.field))" [optionsApi]="meta.optionsApi!" [optionLabel]="meta.optionLabel!" /> }
                @case ('enumWithOther') { <app-select-search   [control]="$any(controlFor(meta.field))" [options]="meta.options!" [allowOther]="true" /> }
                @case ('imageUrl')   { <app-image-upload-field [control]="$any(controlFor(meta.field))" /> }
                @case ('array')      { <app-text-field         [control]="$any(controlFor(meta.field))" [multiline]="true" /> }
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
        class="rounded-full bg-brand-600 text-white px-4 py-1.5 text-sm font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        [disabled]="loading()"
        (click)="onSubmit()"
      >Guardar</button>
    </footer>
  </div>
</div>
```

- [ ] **Step 5: Correr los tests, deben pasar**

Run: `cd apps/frontend && npx ng test --include='**/admin-edit-dialog.component.spec.ts' --watch=false`
Expected: PASS (5/5).

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/features/admin/admin-edit-dialog.component.* apps/frontend/src/app/features/admin/entity-schemas.ts
git commit -m "feat(fe): admin-edit-dialog declarative fields, hide id, FIELD_METAS"
```

---

## Task 15: Fix dashboard mantención

**Files:**
- Modify: `apps/frontend/src/app/features/admin/admin-dashboard.component.ts`
- Modify: `apps/frontend/src/app/features/admin/admin-dashboard.component.spec.ts` (crear si no existe)

- [ ] **Step 1: Test del dashboard**

`apps/frontend/src/app/features/admin/admin-dashboard.component.spec.ts`:
```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  it('carga las 5 cards y la de Mantención llama a /admin/maintenance', async () => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    const maintReq = http.expectOne('/api/v1/admin/maintenance');
    maintReq.flush({ data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }] });

    // Otras requests pueden existir; flush any.
    http.match(() => true).forEach((r) => r.flush({ data: [] }));

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const cards = fixture.componentInstance.cards();
    const maint = cards.find((c) => c.path === '/admin/maintenance');
    expect(maint?.count).toBe(3);
  });
});
```

- [ ] **Step 2: Correr test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/admin-dashboard.component.spec.ts' --watch=false`
Expected: FAIL (la URL actual es `/maintenance/version/__none__`).

- [ ] **Step 3: Cambiar el path**

`apps/frontend/src/app/features/admin/admin-dashboard.component.ts`, en `loadCounts()`:

Reemplazar:
```ts
this.load('Mantención', '/maintenance/version/__none__', 4).catch(() => undefined),
```
por:
```ts
this.load('Mantención', '/admin/maintenance', 4),
```

- [ ] **Step 4: Correr test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/admin-dashboard.component.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin/admin-dashboard.component.*
git commit -m "fix(fe): dashboard maintenance card uses /admin/maintenance"
```

---

## Task 16: Fix dedup mantención

**Files:**
- Modify: `apps/frontend/src/app/features/admin/maintenance-admin.component.{ts,spec.ts}`

- [ ] **Step 1: Test del filter por versionId**

Agregar a `apps/frontend/src/app/features/admin/maintenance-admin.component.spec.ts` (crear si no existe):

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MaintenanceAdminComponent } from './maintenance-admin.component';

describe('MaintenanceAdminComponent', () => {
  it('al cambiar de versión filtra los items por versionId', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MaintenanceAdminComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const versionsReq = http.expectOne((r) => r.url.includes('/api/v1/versions'));
    versionsReq.flush({
      data: {
        items: [
          { id: 'v1', name: '1.6', model: { name: 'Modelo A' } },
          { id: 'v2', name: '2.0', model: { name: 'Modelo B' } },
        ],
      },
    });

    await fixture.whenStable();
    fixture.componentInstance.onVersionChange('v1');
    fixture.detectChanges();

    const adminReq = http.expectOne('/api/v1/admin/maintenance');
    adminReq.flush({
      data: [
        { id: 'm1', versionId: 'v1', mileageTag: 10000, costClp: 50000 },
        { id: 'm2', versionId: 'v2', mileageTag: 30000, costClp: 80000 },
        { id: 'm3', versionId: 'v1', mileageTag: 60000, costClp: 120000 },
      ],
    });

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const items = fixture.componentInstance.displayed();
    expect(items.length).toBe(2);
    expect(items.every((i) => i.versionId === 'v1')).toBe(true);
  });
});
```

- [ ] **Step 2: Correr test, debe fallar**

Run: `cd apps/frontend && npx ng test --include='**/maintenance-admin.component.spec.ts' --watch=false`
Expected: FAIL (items muestra los 3 sin filtrar).

- [ ] **Step 3: Filtrar en loadMaintenance**

`apps/frontend/src/app/features/admin/maintenance-admin.component.ts`, en `loadMaintenance(versionId)`:

Reemplazar:
```ts
this.items.set(res.data);
```
por:
```ts
this.items.set(res.data.filter((m) => m.versionId === versionId));
```

- [ ] **Step 4: Correr test, debe pasar**

Run: `cd apps/frontend && npx ng test --include='**/maintenance-admin.component.spec.ts' --watch=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/admin/maintenance-admin.component.*
git commit -m "fix(fe): maintenance admin filters items by selected version"
```

---

## Task 17: Build global + commit final

- [ ] **Step 1: Backend tests**

Run: `npm -w apps/backend run test`
Expected: PASS (todos los specs).

- [ ] **Step 2: Frontend tests**

Run: `npm -w apps/frontend run test`
Expected: PASS (todos los specs).

- [ ] **Step 3: Backend build**

Run: `npm -w apps/backend run build`
Expected: sin errores de TypeScript.

- [ ] **Step 4: Frontend build**

Run: `npm -w apps/frontend run build`
Expected: sin errores de Angular.

- [ ] **Step 5: Smoke test manual**

- Iniciar backend: `npm -w apps/backend run dev`.
- Iniciar frontend: `npm -w apps/frontend run start`.
- Login como admin en `http://localhost:4200`.
- Verificar dashboard: card Mantención muestra el número correcto (>0).
- Ir a Marcas: buscador muestra X al tipear; X limpia. Editar marca: Logo es upload; aparece preview.
- Ir a Modelos: Nuevo modelo: Marca es select buscable; Segmento es select con "otro"; Imagen principal es upload.
- Ir a Versiones: Nueva versión: Modelo es select; Combustible/Transmisión son select con "otro"; los booleanos son toggles.
- Crear un modelo con segmento "ELECTRIC_SUV": backend persiste y al recargar el select incluye el nuevo valor.
- Ir a Mantención: seleccionar versión A → ver solo registros de A; cambiar a B → solo de B (sin duplicados).

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore: smoke test verified - admin polish v3 ready"
git log --oneline | head -20
```