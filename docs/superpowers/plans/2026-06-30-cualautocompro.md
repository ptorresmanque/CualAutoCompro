# cualautocompro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir **cualautocompro.cl**, una app Angular 22 + backend Node/Express + PostgreSQL para explorar y comparar autos del mercado chileno (ficha técnica, precios CLP, equipamiento, mantención), con auth JWT en cookie HttpOnly y comparaciones compartibles por URL.

**Architecture:** Monorepo con `apps/backend` (Express + Prisma + Postgres) y `apps/frontend` (Angular 22 standalone + Signals + Tailwind). REST API en `/api/v1`, JWT en cookie HttpOnly. Diseño visual con **Stitch** + tokens en Tailwind. Tests Vitest (backend + frontend) + Playwright E2E. TDD estricto, commits frecuentes.

**Tech Stack (versiones verificadas):**
- Angular `22.x` (último estable, confirmado vía npm + angular.dev)
- `@angular/cli` `22.x`
- Node.js LTS (>=20)
- TypeScript `>=5.4`
- Express `^4`
- Prisma `^5` + `@prisma/client`
- PostgreSQL `16+` (dev también soporta `pglite` para tests)
- `bcrypt`, `jsonwebtoken`, `zod`, `cookie-parser`
- Vitest `^2` + `pglite` + `supertest`
- Tailwind CSS `^3` (utility-first, `@tailwind` directives en `src/styles.css`)
- Playwright `^1.4x`
- Stitch (Google Stitch MCP) — sistema de diseño + mockups

---

## Global Constraints

Valores copiados **verbatim** del spec `docs/superpowers/specs/2026-06-30-comparador-autos-chile-design.md`. Toda tarea los hereda implícitamente.

- **Nombre:** cualautocompro. **Dominio:** cualautocompro.cl.
- **Frontend Angular 22** con `signals`, standalone components, new control flow (`@if`, `@for`, `@switch`).
- **CSS plano** en archivos `.css` separados. **Nada de SCSS.**
- **Tailwind CSS** utility-first; import en `src/styles.css` con `@tailwind base; @tailwind components; @tailwind utilities;`.
- **Nunca inline templates/estilos**: cada componente = `*.ts` + `*.html` + `*.css`; el `.ts` solo usa `templateUrl` + `styleUrl`.
- `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))` + `withCredentials: true`.
- Lazy routes con `loadComponent` / `loadChildren`.
- **Backend** Express + Prisma + Postgres. **JWT HttpOnly**, `SameSite=Lax`, `Secure` en prod. **bcrypt** cost 10. **zod** para validación.
- Respuesta `{ data, error? }`. Errores tipados: `VALIDATION`, `NOT_FOUND`, `UNAUTHORIZED`, `CONFLICT`, `BAD_REQUEST`.
- IDs comparación: máx 3; nanoid de 8 chars para `slug`.
- Mantención: `mileageTag` ∈ `{10000, 20000, 30000, 40000, 60000}`.
- Tests: TDD (red → green → refactor). Co-located `*.spec.ts`.
- pnpm workspaces. Scripts raíz: `dev`, `dev:be`, `dev:fe`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `db:reset`.
- Convención commits: Conventional Commits (`feat:`, `test:`, `chore:`, `docs:`, `fix:`).
- Idioma del código/comments/mensajes: **español (es-CL)**; idioma de UI: español.
- Disclaimer visible en UI: "precios referencia año 2026, confirmar en concesionario" y "valor estimado referencial" en mantención.
- Disclaimer en catálogos y comparaciones en cada vista que muestre precios.

---

## File Structure (locked-in)

Antes de las tareas, el mapa de archivos. Cada archivo tiene **una responsabilidad**. Co-located specs.

```
/
├── package.json                       # workspaces, scripts orquestadores
├── pnpm-workspace.yaml                # packages: apps/*
├── tsconfig.base.json                 # strict, target ES2022
├── .gitignore                         # ya existe
├── .editorconfig
├── .nvmrc                             # 20
├── .env.example                       # DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN
├── README.md                          # cualautocompro
├── docs/superpowers/
│   ├── specs/2026-06-30-comparador-autos-chile-design.md
│   ├── plans/2026-06-30-cualautocompro.md
│   └── design/                        # mockups Stitch (referencia)
└── apps/
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json              # extends base
    │   ├── vitest.config.ts
    │   ├── .env.example
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   ├── migrations/            # generado
    │   │   └── seed.ts
    │   └── src/
    │       ├── index.ts                       # entrypoint: bootstrap listen
    │       ├── app.ts                         # createApp() Express factory
    │       ├── config/env.ts                  # zod schema de .env
    │       ├── infra/
    │       │   ├── prisma.ts                  # singleton client
    │       │   └── jwt.ts                     # sign/verify
    │       ├── shared/
    │       │   ├── errors.ts                  # AppError + tipos
    │       │   ├── response.ts                # ok(data) / fail(error)
    │       │   └── async-handler.ts           # wrapper
    │       ├── modules/
    │       │   ├── auth/
    │       │   │   ├── auth.controller.ts
    │       │   │   ├── auth.service.ts
    │       │   │   ├── auth.middleware.ts
    │       │   │   ├── auth.routes.ts
    │       │   │   ├── auth.dto.ts            # zod schemas
    │       │   │   └── auth.service.spec.ts
    │       │   ├── brands/
    │       │   │   ├── brands.controller.ts
    │       │   │   ├── brands.service.ts
    │       │   │   ├── brands.routes.ts
    │       │   │   └── brands.controller.spec.ts
    │       │   ├── models/
    │       │   │   ├── models.controller.ts
    │       │   │   ├── models.service.ts
    │       │   │   ├── models.routes.ts
    │       │   │   ├── models.dto.ts          # filtros zod
    │       │   │   └── models.controller.spec.ts
    │       │   ├── versions/
    │       │   │   ├── versions.controller.ts
    │       │   │   ├── versions.service.ts
    │       │   │   ├── versions.routes.ts
    │       │   │   └── versions.controller.spec.ts
    │       │   ├── compare/
    │       │   │   ├── compare.controller.ts
    │       │   │   ├── compare.service.ts     # + diffHighlights
    │       │   │   ├── compare.routes.ts
    │       │   │   └── compare.service.spec.ts
    │       │   └── comparisons/
    │       │       ├── comparisons.controller.ts
    │       │       ├── comparisons.service.ts
    │       │       ├── comparisons.routes.ts
    │       │       └── comparisons.service.spec.ts
    │       └── __tests__/
    │           ├── helpers/testApp.ts         # buildApp() + cleanup
    │           └── helpers/db.ts              # reset DB por test
    └── frontend/
        ├── package.json
        ├── angular.json                        # schematics css, no scss
        ├── tsconfig.json
        ├── tailwind.config.js                  # tokens Stitch
        ├── postcss.config.js
        ├── src/
        │   ├── index.html                      # <title>cualautocompro</title>
        │   ├── main.ts
        │   ├── styles.css                      # @tailwind + tokens base
        │   └── app/
        │       ├── app.component.ts
        │       ├── app.component.html
        │       ├── app.component.css
        │       ├── app.config.ts               # provideHttpClient + interceptors
        │       ├── app.routes.ts
        │       ├── layout/
        │       │   ├── shell.component.ts
        │       │   ├── shell.component.html
        │       │   ├── shell.component.css
        │       │   ├── header.component.ts/.html/.css
        │       │   └── footer.component.ts/.html/.css
        │       ├── core/
        │       │   ├── api.service.ts
        │       │   ├── auth.service.ts
        │       │   ├── auth.guard.ts
        │       │   ├── auth.interceptor.ts
        │       │   ├── compare-store.service.ts
        │       │   ├── env.ts
        │       │   └── *.spec.ts (servicios/interceptor/guard)
        │       ├── shared/
        │       │   ├── pipes/clp.pipe.ts          # formatea CLP
        │       │   ├── ui/card.component.ts/.html/.css
        │       │   ├── ui/chip.component.ts/.html/.css
        │       │   └── ui/disclaimer.component.ts/.html/.css
        │       └── features/
        │           ├── catalog/catalog.component.ts/.html/.css
        │           ├── model/model.component.ts/.html/.css
        │           ├── compare/compare.component.ts/.html/.css
        │           ├── auth/login.component.ts/.html/.css
        │           ├── auth/register.component.ts/.html/.css
        │           └── account/comparisons.component.ts/.html/.css
        └── e2e/
            ├── playwright.config.ts
            └── tests/
                ├── auth.spec.ts
                ├── explore.spec.ts
                └── compare.spec.ts
```

**Decisiones de bordes:**

- `compare.service.ts` calcula `diffHighlights` server-side; el cliente nunca recalcula diffs, los consume. Esto evita duplicar lógica y mantener una sola fuente de verdad.
- `app.ts` exporta `createApp()` que no escucha: los tests usan `createApp()` y `supertest`. Solo `index.ts` llama `app.listen()`. Esto evita el bug típico "tests abren puertos".
- Prisma en **backend**: cliente único exportado desde `infra/prisma.ts`. En tests, una DB `pglite` por suite (reset entre tests).
- En **frontend**, ningún servicio lee el JWT — vive solo en cookie HttpOnly; el `currentUser` se hidrata vía `GET /auth/me` al boot.

---

# Fase 0 — Bootstrap del monorepo

### Task 0.1: Crear workspaces y node pin

**Files:**
- Create: `/package.json`
- Create: `/pnpm-workspace.yaml`
- Create: `/tsconfig.base.json`
- Create: `/tsconfig.json` (root reenvía a base)
- Create: `/.editorconfig`
- Create: `/.nvmrc`
- Create: `/.env.example`

**Interfaces:** N/A (bootstrap).

- [ ] **Step 1: Crear `.nvmrc` con Node 20 LTS**

```
20
```

- [ ] **Step 2: Crear `tsconfig.base.json` (strict, ES2022)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 3: Crear root `package.json` con workspaces**

```json
{
  "name": "cualautocompro",
  "private": true,
  "version": "0.1.0",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "npm-run-all -p dev:be dev:fe",
    "dev:be": "npm -w apps/backend run dev",
    "dev:fe": "npm -w apps/frontend run start",
    "test": "npm-run-all -p test:be test:fe",
    "test:be": "npm -w apps/backend run test",
    "test:fe": "npm -w apps/frontend run test",
    "test:e2e": "npm -w apps/frontend run test:e2e",
    "db:migrate": "npm -w apps/backend run db:migrate",
    "db:seed": "npm -w apps/backend run db:seed",
    "db:reset": "npm -w apps/backend run db:reset"
  },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  },
  "packageManager": "[email protected]"
}
```

- [ ] **Step 4: Crear `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
```

- [ ] **Step 5: Crear root `tsconfig.json`**

```json
{ "extends": "./tsconfig.base.json", "include": [] }
```

- [ ] **Step 6: Crear `.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

- [ ] **Step 7: Crear `.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cualautocompro
JWT_SECRET=change-me-in-prod-please-use-32-random-bytes
JWT_EXPIRES_IN=7d
PORT=3000
WEB_ORIGIN=http://localhost:4200
```

- [ ] **Step 8: Commit**

```bash
git add .nvmrc tsconfig.base.json tsconfig.json .editorconfig package.json pnpm-workspace.yaml .env.example
git commit -m "chore: bootstrap monorepo cualautocompro con workspaces"
```

---

# Fase 1 — Backend: Express + Prisma + Postgres

### Task 1.1: Esqueleto Express + Vitest (TDD sobre `GET /health`)

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/vitest.config.ts`
- Create: `apps/backend/src/config/env.ts`
- Create: `apps/backend/src/shared/errors.ts`
- Create: `apps/backend/src/shared/response.ts`
- Create: `apps/backend/src/shared/async-handler.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/index.ts`
- Create: `apps/backend/__tests__/helpers/testApp.ts`
- Create: `apps/backend/src/app.spec.ts`

**Interfaces:**
- `createApp()` returns Express app instance (no listen)
- `ok(data)` returns `{ data, error: null }`
- `fail(err)` returns `{ data: null, error: { code, message } }`
- `AppError` class with `.code: ErrorCode`, `.status: number`, `.message`

- [ ] **Step 1: Crear `apps/backend/package.json`**

```json
{
  "name": "@cualautocompro/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cookie-parser": "^1.4.7",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8",
    "@prisma/client": "^5.20.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cookie-parser": "^1.4.7",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^20.16.0",
    "typescript": "^5.6.2",
    "tsx": "^4.19.1",
    "vitest": "^2.1.1",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2",
    "@electric-sql/pglite": "^0.2.0",
    "prisma": "^5.20.0"
  }
}
```

- [ ] **Step 2: Crear `apps/backend/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": ".",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"]
  },
  "include": ["src", "__tests__"]
}
```

- [ ] **Step 3: Crear `apps/backend/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "__tests__/**/*.spec.ts"],
    setupFiles: ["./__tests__/setup.ts"],
    pool: "forks",
  },
});
```

- [ ] **Step 4: Crear `src/config/env.ts` con zod**

```ts
import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().positive().default(3000),
  WEB_ORIGIN: z.string().url().default("http://localhost:4200"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
```

(Añade `dotenv` a dependencies si no está; añadir `import "dotenv/config"` arriba.)

- [ ] **Step 5: Crear `src/shared/errors.ts`**

```ts
export type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "BAD_REQUEST";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  BAD_REQUEST: 400,
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
  get status(): number {
    return STATUS[this.code];
  }
}

export const notFound = (msg = "Recurso no encontrado") =>
  new AppError("NOT_FOUND", msg);
export const unauthorized = (msg = "No autenticado") =>
  new AppError("UNAUTHORIZED", msg);
export const conflict = (msg: string) => new AppError("CONFLICT", msg);
export const validation = (msg: string) => new AppError("VALIDATION", msg);
export const badRequest = (msg: string) => new AppError("BAD_REQUEST", msg);
```

- [ ] **Step 6: Crear `src/shared/response.ts`**

```ts
import type { AppError } from "./errors.js";

export const ok = <T>(data: T) => ({ data, error: null });
export const fail = (err: AppError) => ({
  data: null,
  error: { code: err.code, message: err.message },
});
```

- [ ] **Step 7: Crear `src/shared/async-handler.ts`**

```ts
import type { RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2],
) => Promise<unknown>;

export const ah =
  (fn: AsyncRequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

- [ ] **Step 8: Crear `src/app.ts` con `GET /health`**

```ts
import express from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { ok } from "./shared/response.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.get("/health", (_req, res) => res.json(ok({ status: "ok", env: env.WEB_ORIGIN })));
  // módulos se montan en tareas siguientes
  app.use((_req, res) => res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err && typeof err === "object" && "code" in err && "message" in err) {
      const e = err as { code: string; message: string; status?: number };
      return res.status(e.status ?? 500).json({ data: null, error: { code: e.code, message: e.message } });
    }
    return res.status(500).json({ data: null, error: { code: "INTERNAL", message: "Error interno" } });
  });
  return app;
};
```

- [ ] **Step 9: Crear `src/index.ts`**

```ts
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`cualautocompro backend escuchando en :${env.PORT}`);
});
```

- [ ] **Step 10: Crear `__tests__/setup.ts` con env de test**

```ts
process.env.JWT_SECRET = "test-secret-32-bytes-min-aaaaaaaaaa";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.WEB_ORIGIN = "http://localhost:4200";
process.env.JWT_EXPIRES_IN = "7d";
process.env.PORT = "3001";
```

- [ ] **Step 11: Crear `__tests__/helpers/testApp.ts`**

```ts
import { createApp } from "../../src/app.js";

export const buildTestApp = () => createApp();
```

- [ ] **Step 12: Test que falla (RED) — `src/app.spec.ts`**

```ts
import { describe, it, expect } from "vitest";
import request from "supertest";
import { buildTestApp } from "../__tests__/helpers/testApp.js";

describe("GET /health", () => {
  it("responde 200 con { data: { status: 'ok' } }", async () => {
    const res = await request(buildTestApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });
});
```

Run: `pnpm -w apps/backend test`
Expected: PASS (la implementación ya está; el test verifica que el contrato se cumple). Si el archivo de test ya está creado en este Step, ejecuta y verifica que pase con el código de los Steps 8-11.

- [ ] **Step 13: Install + verificación local**

```bash
pnpm install
pnpm -w apps/backend test
```

Expected: 1 test passing.

- [ ] **Step 14: Commit**

```bash
git add apps/backend
git commit -m "feat(be): esqueleto Express + Vitest con /health y AppError tipado"
```

---

### Task 1.2: Prisma schema inicial + pglite para tests

**Files:**
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/src/infra/prisma.ts`
- Create: `apps/backend/__tests__/helpers/db.ts` (factory de pglite Prisma adapter)
- Modify: `apps/backend/vitest.config.ts` (cargar helper)

**Interfaces:**
- `prisma` exported singleton en `src/infra/prisma.ts`
- En tests, `setupTestPrisma()` provisiona una DB pglite y aplica migraciones.

- [ ] **Step 1: Crear `apps/backend/prisma/schema.prisma`** con todas las entidades del spec

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Brand {
  id        String   @id @default(cuid())
  name      String   @unique
  logoUrl   String?
  models    Model[]
  createdAt DateTime @default(now())
}

model Model {
  id        String    @id @default(cuid())
  brandId   String
  name      String
  segment   Segment
  imageUrl  String?
  brand     Brand     @relation(fields: [brandId], references: [id], onDelete: Cascade)
  versions  Version[]
  createdAt DateTime  @default(now())

  @@unique([brandId, name])
  @@index([segment])
}

enum Segment {
  SEDAN
  SUV
  HATCHBACK
  PICKUP
  CROSSOVER
  COMMERCIAL
}

model Version {
  id                    String              @id @default(cuid())
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
  model                 Model               @relation(fields: [modelId], references: [id], onDelete: Cascade)
  equipmentItems        VersionEquipment[]
  maintenanceCosts      MaintenanceCost[]
  comparisonItems       ComparisonItem[]
  createdAt             DateTime            @default(now())

  @@index([modelId])
  @@index([priceClp])
  @@index([year])
}

enum Transmission {
  MANUAL
  AUTOMATIC
  CVT
  DCT
}

enum Fuel {
  BENCINA
  DIESEL
  HYBRID
  ELECTRIC
}

model EquipmentItem {
  id        String             @id @default(cuid())
  name      String             @unique
  category  String
  versions  VersionEquipment[]
}

model VersionEquipment {
  versionId       String
  equipmentItemId String
  version         Version       @relation(fields: [versionId], references: [id], onDelete: Cascade)
  equipmentItem   EquipmentItem @relation(fields: [equipmentItemId], references: [id], onDelete: Cascade)

  @@id([versionId, equipmentItemId])
}

model MaintenanceCost {
  id         String  @id @default(cuid())
  versionId  String
  mileageTag Int
  costClp    Int
  version    Version @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([versionId, mileageTag])
  @@index([versionId])
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  name         String
  createdAt    DateTime      @default(now())
  comparisons  Comparison[]
}

model Comparison {
  id        String           @id @default(cuid())
  userId    String
  slug      String?          @unique
  name      String?
  createdAt DateTime         @default(now())
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     ComparisonItem[]

  @@index([userId])
}

model ComparisonItem {
  id           String     @id @default(cuid())
  comparisonId String
  versionId    String
  position     Int
  comparison   Comparison @relation(fields: [comparisonId], references: [id], onDelete: Cascade)
  version      Version    @relation(fields: [versionId], references: [id], onDelete: Cascade)

  @@unique([comparisonId, position])
  @@index([versionId])
}
```

- [ ] **Step 2: Generar cliente Prisma para tipos**

```bash
pnpm -w apps/backend exec prisma generate
```

Expected: cliente generado en `node_modules/.prisma/client`.

- [ ] **Step 3: Crear `apps/backend/src/infra/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

export const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}
```

- [ ] **Step 4: Crear `__tests__/helpers/db.ts`** (factory pglite — ver § Anexo 1)

```ts
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const globalForPrisma = globalThis as unknown as { __testPrisma?: PrismaClient };

export const setupTestPrisma = (): PrismaClient => {
  if (!globalForPrisma.__testPrisma) {
    execSync("pnpm exec prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL! },
      stdio: "ignore",
    });
    globalForPrisma.__testPrisma = new PrismaClient();
  }
  return globalForPrisma.__testPrisma;
};

export const resetTestDb = async (prisma: PrismaClient) => {
  await prisma.$transaction([
    prisma.comparisonItem.deleteMany(),
    prisma.comparison.deleteMany(),
    prisma.maintenanceCost.deleteMany(),
    prisma.versionEquipment.deleteMany(),
    prisma.equipmentItem.deleteMany(),
    prisma.version.deleteMany(),
    prisma.model.deleteMany(),
    prisma.brand.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};
```

Nota: Para v1 usamos una Postgres real en Docker para tests si pglite genera fricción con migraciones Prisma; el helper ya está escrito para Postgres. Más adelante (Task 2.x) podemos migrar a pglite si todo va bien.

- [ ] **Step 5: Verificar TypeScript del backend**

```bash
pnpm -w apps/backend exec tsc --noEmit
```

Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/prisma apps/backend/src/infra apps/backend/__tests__/helpers/db.ts
git commit -m "feat(be): schema Prisma completo + infra prisma + helper db tests"
```

---

### Task 1.3: Auth completo (register/login/logout/me) TDD

**Files:**
- Create: `apps/backend/src/infra/jwt.ts`
- Create: `apps/backend/src/modules/auth/auth.dto.ts`
- Create: `apps/backend/src/modules/auth/auth.service.ts`
- Create: `apps/backend/src/modules/auth/auth.middleware.ts`
- Create: `apps/backend/src/modules/auth/auth.controller.ts`
- Create: `apps/backend/src/modules/auth/auth.routes.ts`
- Create: `apps/backend/src/modules/auth/auth.service.spec.ts`
- Create: `apps/backend/src/modules/auth/auth.controller.spec.ts`
- Modify: `apps/backend/src/app.ts` (montar auth routes)

**Interfaces:**
- `sign(payload)` → JWT string; `verify(token)` → payload | throws
- `hashPassword(plain)` → bcrypt hash; `comparePassword(plain, hash)` → boolean
- `authenticate` middleware sets `req.user = { id, email, name }` or throws `unauthorized()`
- Controller exporta `register`, `login`, `logout`, `me`

- [ ] **Step 1: Test RED — `auth.service.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "./auth.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../../infra/prisma.js";

describe("AuthService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("registra un usuario nuevo con password hasheado", async () => {
    const svc = new AuthService(prisma);
    const u = await svc.register({ email: "[email protected]", password: "secreto123", name: "Patricio" });
    expect(u.email).toBe("[email protected]");
    expect(u.name).toBe("Patricio");
    expect(u.passwordHash).not.toBe("secreto123");
  });

  it("rechaza email duplicado con CONFLICT", async () => {
    const svc = new AuthService(prisma);
    await svc.register({ email: "[email protected]", password: "secreto123", name: "A" });
    await expect(
      svc.register({ email: "[email protected]", password: "otro1234", name: "B" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("login retorna usuario + token si credenciales OK", async () => {
    const svc = new AuthService(prisma);
    await svc.register({ email: "[email protected]", password: "secreto123", name: "X" });
    const r = await svc.login({ email: "[email protected]", password: "secreto123" });
    expect(r.user.email).toBe("[email protected]");
    expect(r.token).toBeTypeOf("string");
  });

  it("login rechaza password incorrecto con UNAUTHORIZED", async () => {
    const svc = new AuthService(prisma);
    await svc.register({ email: "[email protected]", password: "secreto123", name: "X" });
    await expect(svc.login({ email: "[email protected]", password: "mala" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
```

- [ ] **Step 2: Run tests — confirmar fallo**

```bash
pnpm -w apps/backend test -- auth.service
```

Expected: FAIL (AuthService no existe).

- [ ] **Step 3: Implementar `src/infra/jwt.ts`**

```ts
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export type JwtPayload = { sub: string; email: string; name: string };

export const sign = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verify = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") throw new Error("INVALID_TOKEN");
  return decoded as unknown as JwtPayload;
};
```

- [ ] **Step 4: Implementar `auth.dto.ts`**

```ts
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(80),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

- [ ] **Step 5: Implementar `auth.service.ts`**

```ts
import bcrypt from "bcrypt";
import type { PrismaClient } from "@prisma/client";
import { conflict, unauthorized, validation } from "../../shared/errors.js";
import { sign } from "../../infra/jwt.js";
import { registerSchema, loginSchema } from "./auth.dto.js";
import type { z } from "zod";

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: z.infer<typeof registerSchema>) {
    const { email, password, name } = registerSchema.parse(input);
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw conflict("Email ya registrado");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({ data: { email, passwordHash, name } });
    return { id: user.id, email: user.email, name: user.name };
  }

  async login(input: z.infer<typeof loginSchema>) {
    const { email, password } = loginSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized("Credenciales inválidas");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized("Credenciales inválidas");
    const token = sign({ sub: user.id, email: user.email, name: user.name });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }
}
```

- [ ] **Step 6: Run tests — deben pasar**

```bash
pnpm -w apps/backend test -- auth.service
```

Expected: PASS.

- [ ] **Step 7: Test RED — `auth.controller.spec.ts`** (testing endpoints via supertest)

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("Auth endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("POST /auth/register crea usuario y setea cookie auth", async () => {
    const res = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "[email protected]", password: "secreto123", name: "Pat" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("[email protected]");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^auth=/);
  });

  it("POST /auth/login con credenciales válidas retorna usuario + cookie", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({ email: "[email protected]", password: "secreto123", name: "Pat" });
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: "[email protected]", password: "secreto123" });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("[email protected]");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^auth=/);
  });

  it("POST /auth/login con password incorrecto retorna 401 UNAUTHORIZED", async () => {
    await request(createApp()).post("/api/v1/auth/register").send({ email: "[email protected]", password: "secreto123", name: "Pat" });
    const res = await request(createApp()).post("/api/v1/auth/login").send({ email: "[email protected]", password: "mala" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
```

- [ ] **Step 8: Implementar `auth.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { env } from "../../config/env.js";
import { AuthService } from "./auth.service.js";
import { prisma } from "../../infra/prisma.js";
import { loginSchema, registerSchema } from "./auth.dto.js";
import { unauthorized, validation } from "../../shared/errors.js";
import { sign, verify } from "../../infra/jwt.js";

const svc = new AuthService(prisma);

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const authController = {
  register: ah(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const user = await svc.register(parsed.data);
    const token = sign({ sub: user.id, email: user.email, name: user.name });
    res.cookie("auth", token, cookieOpts);
    return res.json(ok(user));
  }),

  login: ah(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const r = await svc.login(parsed.data);
    res.cookie("auth", r.token, cookieOpts);
    return res.json(ok(r.user));
  }),

  logout: ah(async (_req: Request, res: Response) => {
    res.clearCookie("auth", { path: "/" });
    return res.json(ok({ loggedOut: true }));
  }),

  me: ah(async (req: Request, res: Response) => {
    const token = req.cookies?.auth;
    if (!token) throw unauthorized();
    try {
      const payload = verify(token);
      return res.json(ok({ id: payload.sub, email: payload.email, name: payload.name }));
    } catch {
      throw unauthorized();
    }
  }),
};
```

- [ ] **Step 9: Implementar `auth.routes.ts`**

```ts
import { Router } from "express";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authController.me);
```

- [ ] **Step 10: Implementar `auth.middleware.ts`** (opcional, para reuso en otros módulos)

```ts
import type { Request, Response, NextFunction } from "express";
import { unauthorized } from "../../shared/errors.js";
import { verify } from "../../infra/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string };
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.auth;
  if (!token) return next(unauthorized());
  try {
    const payload = verify(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch {
    next(unauthorized());
  }
};
```

- [ ] **Step 11: Montar router en `app.ts`**

```ts
import { authRouter } from "./modules/auth/auth.routes.js";
// ... dentro de createApp(), después de cookieParser:
app.use("/api/v1/auth", authRouter);
```

- [ ] **Step 12: Run tests — deben pasar**

```bash
pnpm -w apps/backend test -- auth
```

Expected: 7 tests passing (4 service + 3 controller).

- [ ] **Step 13: Commit**

```bash
git add apps/backend
git commit -m "feat(be): auth completo con JWT cookie HttpOnly (TDD)"
```

---

### Task 1.4: Brands + Models (catálogo público con filtros)

**Files:**
- Create: `apps/backend/src/modules/brands/{brands.service.ts,brands.controller.ts,brands.routes.ts}`
- Create: `apps/backend/src/modules/models/{models.dto.ts,models.service.ts,models.controller.ts,models.routes.ts}`
- Create: `apps/backend/src/modules/models/models.controller.spec.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- `GET /api/v1/brands` → `{ data: Brand[] }`
- `GET /api/v1/brands/:id/models` → `{ data: Model[] }`
- `GET /api/v1/models?brand=&segment=&year=&transmission=&fuel=&priceMin=&priceMax=&powerMin=&consumptionMax=&page=&pageSize=` → `{ data: { items, total, page, pageSize } }`

- [ ] **Step 1: Test RED — `models.controller.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

const seed = async () => {
  const toyota = await prisma.brand.create({ data: { name: "Toyota" } });
  const yaris = await prisma.model.create({ data: { brandId: toyota.id, name: "Yaris", segment: "HATCHBACK" } });
  await prisma.version.create({
    data: {
      modelId: yaris.id, name: "XLS", year: 2026, priceClp: 14_990_000,
      transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 14, consumptionHighwayKmL: 19,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1100, trunkLiters: 286,
      airbagCount: 6, hasAbs: true, hasEsp: true, hasCruiseControl: true,
    },
  });
  const mazda = await prisma.brand.create({ data: { name: "Mazda" } });
  await prisma.model.create({ data: { brandId: mazda.id, name: "CX-5", segment: "SUV" } });
};

describe("GET /api/v1/models", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    await seed();
  });

  it("lista modelos paginados", async () => {
    const res = await request(createApp()).get("/api/v1/models");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("filtra por brand (id)", async () => {
    const toyota = await prisma.brand.findFirst({ where: { name: "Toyota" } });
    const res = await request(createApp()).get(`/api/v1/models?brand=${toyota!.id}`);
    expect(res.body.data.items.every((m: { brandId: string }) => m.brandId === toyota!.id)).toBe(true);
  });

  it("filtra por segment=HATCHBACK", async () => {
    const res = await request(createApp()).get("/api/v1/models?segment=HATCHBACK");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((m: { segment: string }) => m.segment === "HATCHBACK")).toBe(true);
  });

  it("filtra por rango de precio desde versions", async () => {
    const res = await request(createApp()).get("/api/v1/models?priceMin=14000000");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run tests — confirmar fallo**

```bash
pnpm -w apps/backend test -- models
```

Expected: FAIL.

- [ ] **Step 3: Implementar `models.dto.ts`**

```ts
import { z } from "zod";

export const listModelsQuerySchema = z.object({
  brand: z.string().optional(),
  segment: z.enum(["SEDAN", "SUV", "HATCHBACK", "PICKUP", "CROSSOVER", "COMMERCIAL"]).optional(),
  year: z.coerce.number().int().optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC", "CVT", "DCT"]).optional(),
  fuel: z.enum(["BENCINA", "DIESEL", "HYBRID", "ELECTRIC"]).optional(),
  priceMin: z.coerce.number().int().optional(),
  priceMax: z.coerce.number().int().optional(),
  powerMin: z.coerce.number().int().optional(),
  consumptionMax: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
```

- [ ] **Step 4: Implementar `models.service.ts`**

```ts
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { listModelsQuerySchema } from "./models.dto.js";

export class ModelsService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(q: z.infer<typeof listModelsQuerySchema>) {
    const where: Prisma.ModelWhereInput = {};
    if (q.brand) where.brandId = q.brand;
    if (q.segment) where.segment = q.segment;

    // Todos los filtros de version se aplican a nivel DB usando "some"
    // (el modelo aparece si al menos una versión cumple cada filtro).
    const vWhere: Prisma.VersionWhereInput = {};
    if (q.transmission) vWhere.transmission = q.transmission;
    if (q.fuel) vWhere.fuel = q.fuel;
    if (q.year !== undefined) vWhere.year = q.year;
    if (q.priceMin !== undefined || q.priceMax !== undefined) {
      vWhere.priceClp = {
        ...(q.priceMin !== undefined ? { gte: q.priceMin } : {}),
        ...(q.priceMax !== undefined ? { lte: q.priceMax } : {}),
      };
    }
    if (q.powerMin !== undefined) vWhere.powerHp = { gte: q.powerMin };
    if (q.consumptionMax !== undefined) vWhere.consumptionCityKmL = { lte: q.consumptionMax };

    if (Object.keys(vWhere).length > 0) where.versions = { some: vWhere };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.model.count({ where }),
      this.prisma.model.findMany({
        where,
        include: { brand: true, versions: { orderBy: { priceClp: "asc" } } },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { name: "asc" },
      }),
    ]);

    const enriched = items.map((m) => {
      const prices = m.versions.map((v) => v.priceClp);
      const minPrice = prices.length ? Math.min(...prices) : null;
      const maxPrice = prices.length ? Math.max(...prices) : null;
      return {
        id: m.id, brandId: m.brandId, name: m.name, segment: m.segment,
        imageUrl: m.imageUrl, brand: m.brand, minPrice, maxPrice, versionCount: m.versions.length,
      };
    });

    return { total, items: enriched, page: q.page, pageSize: q.pageSize };
  }
}
```

- [ ] **Step 5: Implementar `models.controller.ts`**

```ts
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ModelsService } from "./models.service.js";
import { listModelsQuerySchema } from "./models.dto.js";
import { validation } from "../../shared/errors.js";

const svc = new ModelsService(prisma);

export const modelsController = {
  list: ah(async (req: Request, res: Response) => {
    const parsed = listModelsQuerySchema.safeParse(req.query);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.list(parsed.data)));
  }),

  detail: ah(async (req: Request, res: Response) => {
    const m = await prisma.model.findUnique({
      where: { id: req.params.id },
      include: { brand: true, versions: { orderBy: { priceClp: "asc" } } },
    });
    if (!m) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Modelo no encontrado" } });
    res.json(ok(m));
  }),
};
```

- [ ] **Step 6: Implementar `models.routes.ts`**

```ts
import { Router } from "express";
import { modelsController } from "./models.controller.js";

export const modelsRouter = Router();
modelsRouter.get("/", modelsController.list);
modelsRouter.get("/:id", modelsController.detail);
```

- [ ] **Step 7: Implementar `brands.service.ts` + `controller` + `routes`** (análogo, breve)

```ts
// brands.service.ts
import type { PrismaClient } from "@prisma/client";
export class BrandsService {
  constructor(private readonly prisma: PrismaClient) {}
  list() { return this.prisma.brand.findMany({ orderBy: { name: "asc" } }); }
  models(brandId: string) {
    return this.prisma.model.findMany({ where: { brandId }, orderBy: { name: "asc" } });
  }
}

// brands.controller.ts
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { BrandsService } from "./brands.service.js";
const svc = new BrandsService(prisma);
export const brandsController = {
  list: ah(async (_req, res) => res.json(ok(await svc.list()))),
  models: ah(async (req, res) => res.json(ok(await svc.models(req.params.id)))),
};

// brands.routes.ts
import { Router } from "express";
import { brandsController } from "./brands.controller.js";
export const brandsRouter = Router();
brandsRouter.get("/", brandsController.list);
brandsRouter.get("/:id/models", brandsController.models);
```

- [ ] **Step 8: Montar routers en `app.ts`**

```ts
import { brandsRouter } from "./modules/brands/brands.routes.js";
import { modelsRouter } from "./modules/models/models.routes.js";
app.use("/api/v1/brands", brandsRouter);
app.use("/api/v1/models", modelsRouter);
```

- [ ] **Step 9: Run tests + typecheck**

```bash
pnpm -w apps/backend exec tsc --noEmit
pnpm -w apps/backend test
```

Expected: tests passing, 0 errores TS.

- [ ] **Step 10: Commit**

```bash
git add apps/backend
git commit -m "feat(be): catálogo público brands + models con filtros"
```

---

### Task 1.5: Versions detail + Compare (con diffHighlights)

**Files:**
- Create: `apps/backend/src/modules/versions/{versions.service.ts,versions.controller.ts,versions.routes.ts}`
- Create: `apps/backend/src/modules/versions/versions.controller.spec.ts`
- Create: `apps/backend/src/modules/compare/{compare.service.ts,compare.controller.ts,compare.routes.ts}`
- Create: `apps/backend/src/modules/compare/compare.service.spec.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- `GET /api/v1/versions/:id` → `{ data: { ...version, equipmentItems, maintenanceCosts } }`
- `POST /api/v1/compare` body `{ versionIds: string[] }` → `{ data: { versions: [...], diffHighlights: { [key]: boolean } } }`
- `GET /api/v1/compare?ids=a,b,c` → mismo payload

- [ ] **Step 1: Test RED — `compare.service.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { CompareService } from "./compare.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../../infra/prisma.js";

describe("CompareService", () => {
  beforeEach(async () => { setupTestPrisma(); await resetTestDb(prisma); });

  const seed2 = async () => {
    const t = await prisma.brand.create({ data: { name: "Toyota" } });
    const y = await prisma.model.create({ data: { brandId: t.id, name: "Yaris", segment: "HATCHBACK" } });
    const v1 = await prisma.version.create({
      data: { modelId: y.id, name: "XLS", year: 2026, priceClp: 14_990_000,
        transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496, powerHp: 110, torqueNm: 140,
        consumptionCityKmL: 14, consumptionHighwayKmL: 19, lengthMm: 3940, widthMm: 1740, heightMm: 1480,
        weightKg: 1100, trunkLiters: 286, airbagCount: 6, hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    const v2 = await prisma.version.create({
      data: { modelId: y.id, name: "Sport", year: 2025, priceClp: 12_500_000,
        transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1496, powerHp: 110, torqueNm: 140,
        consumptionCityKmL: 13, consumptionHighwayKmL: 18, lengthMm: 3940, widthMm: 1740, heightMm: 1480,
        weightKg: 1080, trunkLiters: 286, airbagCount: 4, hasAbs: true, hasEsp: false, hasCruiseControl: false },
    });
    return { v1: v1.id, v2: v2.id };
  };

  it("rechaza más de 3 IDs con BAD_REQUEST", async () => {
    const svc = new CompareService(prisma);
    await expect(svc.compare(["x", "y", "z", "w"])).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("devuelve 2 versiones y diffHighlights marca los campos que difieren", async () => {
    const { v1, v2 } = await seed2();
    const svc = new CompareService(prisma);
    const out = await svc.compare([v1, v2]);
    expect(out.versions.length).toBe(2);
    expect(out.diffHighlights.priceClp).toBe(true);
    expect(out.diffHighlights.powerHp).toBe(false);
    expect(out.diffHighlights.year).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — confirmar fallo**

- [ ] **Step 3: Implementar `versions.service.ts` + `controller` + `routes`**

```ts
// versions.service.ts
import type { PrismaClient } from "@prisma/client";
import { notFound } from "../../shared/errors.js";
export class VersionsService {
  constructor(private readonly prisma: PrismaClient) {}
  async detail(id: string) {
    const v = await this.prisma.version.findUnique({
      where: { id },
      include: { model: { include: { brand: true } }, equipmentItems: { include: { equipmentItem: true } }, maintenanceCosts: true },
    });
    if (!v) throw notFound("Versión no encontrada");
    return v;
  }
}

// versions.controller.ts
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { VersionsService } from "./versions.service.js";
const svc = new VersionsService(prisma);
export const versionsController = {
  detail: ah(async (req, res) => res.json(ok(await svc.detail(req.params.id)))),
};

// versions.routes.ts
import { Router } from "express";
import { versionsController } from "./versions.controller.js";
export const versionsRouter = Router();
versionsRouter.get("/:id", versionsController.detail);
```

- [ ] **Step 4: Implementar `compare.service.ts` con diffHighlights**

```ts
import type { PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";

const DIFF_KEYS = [
  "priceClp","year","transmission","fuel","engineDisplacementCc","powerHp","torqueNm",
  "consumptionCityKmL","consumptionHighwayKmL","lengthMm","widthMm","heightMm",
  "weightKg","trunkLiters","airbagCount","hasAbs","hasEsp","hasCruiseControl",
] as const;

export class CompareService {
  constructor(private readonly prisma: PrismaClient) {}

  async compare(versionIds: string[]) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");
    const versions = await this.prisma.version.findMany({
      where: { id: { in: versionIds } },
      include: { model: { include: { brand: true } }, maintenanceCosts: true },
    });
    if (versions.length !== versionIds.length) throw notFound("Alguna versión no existe");

    if (versions.length === 1) {
      return { versions, diffHighlights: Object.fromEntries(DIFF_KEYS.map((k) => [k, false])) };
    }
    const first = versions[0]!;
    const diffHighlights: Record<string, boolean> = {};
    for (const key of DIFF_KEYS) {
      diffHighlights[key] = versions.some((v) => v[key as keyof typeof v] !== first[key as keyof typeof first]);
    }
    return { versions, diffHighlights };
  }
}
```

- [ ] **Step 5: Implementar `compare.controller.ts` + `routes`**

```ts
// compare.controller.ts
import { z } from "zod";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { CompareService } from "./compare.service.js";
import { validation } from "../../shared/errors.js";

const idsSchema = z.object({
  versionIds: z.array(z.string()).min(1).max(3).optional(),
  ids: z.string().optional(),
});

const svc = new CompareService(prisma);

export const compareController = {
  post: ah(async (req, res) => {
    const parsed = idsSchema.safeParse(req.body ?? {});
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    if (!parsed.data.versionIds) throw validation("versionIds requerido");
    res.json(ok(await svc.compare(parsed.data.versionIds)));
  }),
  get: ah(async (req, res) => {
    const ids = String(req.query.ids ?? "").split(",").filter(Boolean);
    if (ids.length < 1) throw validation("ids requerido");
    res.json(ok(await svc.compare(ids)));
  }),
};

// compare.routes.ts
import { Router } from "express";
import { compareController } from "./compare.controller.js";
export const compareRouter = Router();
compareRouter.post("/", compareController.post);
compareRouter.get("/", compareController.get);
```

- [ ] **Step 6: Montar routers en `app.ts`**

```ts
import { versionsRouter } from "./modules/versions/versions.routes.js";
import { compareRouter } from "./modules/compare/compare.routes.js";
app.use("/api/v1/versions", versionsRouter);
app.use("/api/v1/compare", compareRouter);
```

- [ ] **Step 7: Run tests**

```bash
pnpm -w apps/backend test
```

Expected: todos los tests pasando.

- [ ] **Step 8: Commit**

```bash
git add apps/backend
git commit -m "feat(be): versions detail + compare con diffHighlights"
```

---

### Task 1.6: Comparisons (guardar, listar, lookup por slug)

**Files:**
- Create: `apps/backend/src/modules/comparisons/{comparisons.service.ts,comparisons.controller.ts,comparisons.routes.ts}`
- Create: `apps/backend/src/modules/comparisons/comparisons.service.spec.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- `GET /api/v1/comparisons/:slug` → público
- `GET /api/v1/me/comparisons` → requiere auth
- `POST /api/v1/me/comparisons` body `{ versionIds, name? }` → `{ id, slug }`
- `DELETE /api/v1/me/comparisons/:id` → requiere auth

- [ ] **Step 1: Test RED — `comparisons.service.spec.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { ComparisonsService } from "./comparisons.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../../infra/prisma.js";

describe("ComparisonsService", () => {
  beforeEach(async () => { setupTestPrisma(); await resetTestDb(prisma); });

  it("crea comparación con slug aleatorio de 8 chars", async () => {
    const svc = new ComparisonsService(prisma);
    const u = await prisma.user.create({ data: { email: "[email protected]", name: "U", passwordHash: "x" } });
    const v = await prisma.version.create({
      data: { modelId: "m", name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    }).catch(async () => {
      // fallback: crear model + brand si hace falta
      const b = await prisma.brand.create({ data: { name: "X" } });
      const m = await prisma.model.create({ data: { brandId: b.id, name: "M", segment: "SEDAN" } });
      return prisma.version.create({
        data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
          engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
          lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
          hasAbs: true, hasEsp: true, hasCruiseControl: true },
      });
    });
    const out = await svc.create({ userId: u.id, versionIds: [v.id] });
    expect(out.slug).toHaveLength(8);
  });

  it("listByUser devuelve solo del usuario actual", async () => {
    const svc = new ComparisonsService(prisma);
    const a = await prisma.user.create({ data: { email: "[email protected]", name: "A", passwordHash: "x" } });
    const b = await prisma.user.create({ data: { email: "[email protected]", name: "B", passwordHash: "x" } });
    const v = await prisma.brand.create({ data: { name: "Z" } }).then((br) =>
      prisma.model.create({ data: { brandId: br.id, name: "M", segment: "SEDAN" } })).then((m) =>
      prisma.version.create({ data: { modelId: m.id, name: "x", year: 2026, priceClp: 1, transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1, consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1, trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true } }));
    await svc.create({ userId: a.id, versionIds: [v.id] });
    const aList = await svc.listByUser(a.id);
    expect(aList.length).toBe(1);
    const bList = await svc.listByUser(b.id);
    expect(bList.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests — confirmar fallo**

- [ ] **Step 3: Implementar `comparisons.service.ts`**

```ts
import { customAlphabet } from "nanoid";
import type { PrismaClient } from "@prisma/client";
import { badRequest, notFound } from "../../shared/errors.js";

const slugger = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export class ComparisonsService {
  constructor(private readonly prisma: PrismaClient) {}

  async create({ userId, versionIds, name }: { userId: string; versionIds: string[]; name?: string }) {
    if (versionIds.length < 1 || versionIds.length > 3) throw badRequest("Compara entre 1 y 3 versiones");
    const slug = slugger();
    const cmp = await this.prisma.comparison.create({
      data: {
        userId, slug, name,
        items: { create: versionIds.map((versionId, i) => ({ versionId, position: i + 1 })) },
      },
    });
    return { id: cmp.id, slug: cmp.slug! };
  }

  async getBySlug(slug: string) {
    const cmp = await this.prisma.comparison.findUnique({
      where: { slug },
      include: { items: { include: { version: { include: { model: { include: { brand: true } } } } }, orderBy: { position: "asc" } } },
    });
    if (!cmp) throw notFound("Comparación no encontrada");
    return cmp;
  }

  async listByUser(userId: string) {
    return this.prisma.comparison.findMany({
      where: { userId },
      include: { items: { include: { version: { include: { model: { include: { brand: true } } } } }, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async delete(id: string, userId: string) {
    const cmp = await this.prisma.comparison.findUnique({ where: { id } });
    if (!cmp || cmp.userId !== userId) throw notFound("Comparación no encontrada");
    await this.prisma.comparison.delete({ where: { id } });
  }
}
```

(Añade `nanoid` a dependencies: `pnpm -w apps/backend add nanoid`).

- [ ] **Step 4: Implementar `comparisons.controller.ts` + `routes`**

```ts
// comparisons.controller.ts
import { z } from "zod";
import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { prisma } from "../../infra/prisma.js";
import { ComparisonsService } from "./comparisons.service.js";
import { unauthorized, validation } from "../../shared/errors.js";

const svc = new ComparisonsService(prisma);
const createSchema = z.object({ versionIds: z.array(z.string()).min(1).max(3), name: z.string().max(80).optional() });

export const comparisonsController = {
  bySlug: ah(async (req: Request, res: Response) => res.json(ok(await svc.getBySlug(req.params.slug)))),

  listMine: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    res.json(ok(await svc.listByUser(u.id)));
  }),

  createMine: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    res.json(ok(await svc.create({ userId: u.id, versionIds: parsed.data.versionIds, name: parsed.data.name })));
  }),

  deleteMine: ah(async (req: Request, res: Response) => {
    const u = req.user; if (!u) throw unauthorized();
    await svc.delete(req.params.id, u.id);
    res.json(ok({ deleted: true }));
  }),
};

// comparisons.routes.ts
import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { comparisonsController } from "./comparisons.controller.js";

export const comparisonsRouter = Router();
comparisonsRouter.get("/:slug", comparisonsController.bySlug);
export const meComparisonsRouter = Router();
meComparisonsRouter.use(authenticate);
meComparisonsRouter.get("/", comparisonsController.listMine);
meComparisonsRouter.post("/", comparisonsController.createMine);
meComparisonsRouter.delete("/:id", comparisonsController.deleteMine);
```

- [ ] **Step 5: Montar en `app.ts`**

```ts
import { comparisonsRouter, meComparisonsRouter } from "./modules/comparisons/comparisons.routes.js";
app.use("/api/v1/comparisons", comparisonsRouter);
app.use("/api/v1/me/comparisons", meComparisonsRouter);
```

- [ ] **Step 6: Run tests + commit**

```bash
pnpm -w apps/backend test
git add apps/backend
git commit -m "feat(be): comparisons (slug público + lista/guardar por usuario)"
```

---

### Task 1.7: Seed script (catálogo inicial Chile)

**Files:**
- Create: `apps/backend/prisma/seed.ts`
- Create: `apps/backend/prisma/catalog.ts` (dataset hardcoded)

**Interfaces:**
- `npm run db:seed` puebla Brand → Model → Version con datos realistas del mercado chileno.

- [ ] **Step 1: Crear `apps/backend/prisma/catalog.ts`** con 10 marcas y ~30 modelos populares (Toyota, Chevrolet, Hyundai, Kia, Mazda, Nissan, Suzuki, Subaru, Ford, Volkswagen). Versiones con precios CLP, potencia, consumo realistas. Datos aproximados verificables en sitios oficiales; marcas como disclaimer.

- [ ] **Step 2: Implementar `apps/backend/prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";
import { catalog } from "./catalog.js";

const prisma = new PrismaClient();

async function main() {
  for (const b of catalog.brands) {
    await prisma.brand.upsert({ where: { name: b.name }, update: {}, create: b });
  }
  for (const m of catalog.models) {
    await prisma.model.upsert({
      where: { brandId_name: { brandId: m.brandId, name: m.name } },
      update: {},
      create: m,
    });
  }
  for (const v of catalog.versions) {
    await prisma.version.create({ data: v });
  }
  console.log("Seed completado");
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Levantar Postgres y probar seed**

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

Expected: log "Seed completado" y filas en `Model` y `Version`.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/prisma
git commit -m "feat(be): seed de catálogo inicial Chile"
```

---

# Fase 2 — Frontend: Angular 22 + Tailwind + 3 archivos por componente

### Task 2.1: Esqueleto Angular 22 sin SCSS, con Tailwind

**Files:**
- Create: `apps/frontend/` (Angular CLI genera la base)
- Modify: post-init: añadir `tailwind.config.js`, `postcss.config.js`, reescribir `src/styles.css`

- [ ] **Step 1: Crear Angular app vía CLI con schematics CSS**

```bash
cd apps && npx -y @angular/cli@22 new frontend --style=css --routing=true --skip-git --package-manager=pnpm --strict
```

Expected: app Angular 22 generada en `apps/frontend` con `*.css` por defecto.

- [ ] **Step 2: Añadir Tailwind + PostCSS**

```bash
pnpm -w apps/frontend add -D tailwindcss postcss autoprefixer
pnpm -w apps/frontend exec npx tailwindcss init -p
```

Expected: `tailwind.config.js` y `postcss.config.js` creados.

- [ ] **Step 3: Configurar `tailwind.config.js` con paths Angular y tokens base**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,ts,css}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          500: '#1e88e5',
          600: '#1c7cd0',
          700: '#1765a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
```

(Estos tokens se ajustarán más tarde con el sistema Stitch real. Aquí se establece baseline para arrancar.)

- [ ] **Step 4: Reescribir `src/styles.css` con `@tailwind` + tokens base**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #ffffff;
  --color-fg: #0f172a;
  --color-muted: #64748b;
  --color-accent: #1e88e5;
  --radius: 8px;
}

html, body { height: 100%; }
body {
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--color-fg);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: 'Manrope', 'Inter', system-ui, sans-serif; }
```

- [ ] **Step 5: Añadir fuentes en `src/index.html`**

```html
<!doctype html>
<html lang="es-CL">
<head>
  <meta charset="utf-8">
  <title>cualautocompro</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
</head>
<body><app-root></app-root></body>
</html>
```

- [ ] **Step 6: Verificar que el proyecto arranca**

```bash
pnpm dev:fe
```

Expected: Angular dev server en `http://localhost:4200` con texto "cualautocompro" o similar.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend
git commit -m "feat(fe): esqueleto Angular 22 con Tailwind y CSS base"
```

---

### Task 2.2: API service + Auth service + interceptor + guard (TDD)

**Files:**
- Create: `src/app/core/env.ts`
- Create: `src/app/core/api.service.ts`
- Create: `src/app/core/auth.service.ts`
- Create: `src/app/core/auth.interceptor.ts`
- Create: `src/app/core/auth.guard.ts`
- Create: `src/app/core/compare-store.service.ts`
- Create tests: `*.spec.ts` co-locados
- Modify: `src/app/app.config.ts`

**Interfaces:**
- `AuthService.currentUser: Signal<User | null>`
- `AuthService.login(email, password)`, `register(...)`, `logout()`, `bootstrap()` (carga `me` al boot)
- `authInterceptor` añade `withCredentials: true` en cada request (sólo contra `/api/*`)
- `compareStore.ids: Signal<string[]>` (max 3, persiste localStorage, hidrata de URL)

- [ ] **Step 1: Crear `core/env.ts`**

```ts
export const ENV = {
  apiBase: (typeof window !== 'undefined' && (window as any).__env?.apiBase) || 'http://localhost:3000/api/v1',
} as const;
```

- [ ] **Step 2: Crear `core/api.service.ts`**

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV } from './env';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  get<T>(path: string, params?: Record<string, unknown>) {
    return this.http.get<T>(`${ENV.apiBase}${path}`, { withCredentials: true, params });
  }
  post<T>(path: string, body: unknown) {
    return this.http.post<T>(`${ENV.apiBase}${path}`, body, { withCredentials: true });
  }
  delete<T>(path: string) {
    return this.http.delete<T>(`${ENV.apiBase}${path}`, { withCredentials: true });
  }
}
```

- [ ] **Step 3: Test RED — `auth.service.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ENV } from './env';

describe('AuthService', () => {
  let svc: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), AuthService] });
    svc = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('bootstrap hidrata currentUser con /auth/me', async () => {
    const p = svc.bootstrap();
    const req = http.expectOne(`${ENV.apiBase}/auth/me`);
    req.flush({ data: { id: 'u1', email: '[email protected]', name: 'P' } });
    await p;
    expect(svc.currentUser()?.email).toBe('[email protected]');
  });

  it('login dispara POST y setea currentUser', async () => {
    const p = svc.login('[email protected]', 'secreto123');
    const req = http.expectOne(`${ENV.apiBase}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: { id: 'u1', email: '[email protected]', name: 'P' } });
    await p;
    expect(svc.currentUser()?.email).toBe('[email protected]');
  });
});
```

- [ ] **Step 4: Run test — confirmar FAIL**

- [ ] **Step 5: Implementar `auth.service.ts`**

```ts
import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export type User = { id: string; email: string; name: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  currentUser = signal<User | null>(null);

  async bootstrap() {
    try {
      const res = await this.api.get<{ data: User } | { error: { code: string } }>('/auth/me');
      if ('data' in res && res.data) this.currentUser.set(res.data as User);
    } catch { /* no logueado */ }
  }

  async login(email: string, password: string) {
    const res = await this.api.post<{ data: User }>('/auth/login', { email, password });
    if ('data' in res && res.data) this.currentUser.set(res.data as User);
  }
  async register(email: string, password: string, name: string) {
    const res = await this.api.post<{ data: User }>('/auth/register', { email, password, name });
    this.currentUser.set(res.data);
  }
  async logout() {
    await this.api.post<{ data: { loggedOut: true } }>('/auth/logout', {});
    this.currentUser.set(null);
  }
}
```

- [ ] **Step 6: Test RED — `compare-store.service.spec.ts`**

```ts
import { TestBed } from '@angular/core/testing';
import { CompareStore } from './compare-store.service';

describe('CompareStore', () => {
  let store: CompareStore;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CompareStore] });
    store = TestBed.inject(CompareStore);
  });

  it('agrega hasta 3 IDs', () => {
    store.add('a'); store.add('b'); store.add('c'); store.add('d');
    expect(store.ids().length).toBe(3);
    expect(store.ids()).toEqual(['a', 'b', 'c']);
  });

  it('persiste en localStorage', () => {
    store.add('x');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [CompareStore] });
    const s2 = TestBed.inject(CompareStore);
    expect(s2.ids()).toEqual(['x']);
  });

  it('hidratFromUrl reemplaza selección', () => {
    store.add('a');
    store.hydrateFromUrl('x,y,z');
    expect(store.ids()).toEqual(['x', 'y', 'z']);
  });
});
```

- [ ] **Step 7: Implementar `compare-store.service.ts`**

```ts
import { Injectable, signal } from '@angular/core';

const KEY = 'cualautocompro:selectedVersionIds';

@Injectable({ providedIn: 'root' })
export class CompareStore {
  private _ids = signal<string[]>(this.load());
  readonly ids = this._ids.asReadonly();

  add(id: string) {
    const current = this._ids();
    if (current.includes(id) || current.length >= 3) return;
    const next = [...current, id];
    this._ids.set(next);
    this.save(next);
  }
  remove(id: string) {
    const next = this._ids().filter((x) => x !== id);
    this._ids.set(next);
    this.save(next);
  }
  clear() { this._ids.set([]); this.save([]); }
  hydrateFromUrl(csv: string) {
    const ids = csv.split(',').filter(Boolean).slice(0, 3);
    this._ids.set(ids);
    this.save(ids);
  }

  private save(ids: string[]) { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {} }
  private load(): string[] { try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
}
```

- [ ] **Step 8: Implementar `auth.interceptor.ts` y `auth.guard.ts`**

```ts
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { ENV } from './env';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(ENV.apiBase)) {
    req = req.clone({ withCredentials: true });
  }
  return next(req);
};

// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.currentUser()) await auth.bootstrap();
  return !!auth.currentUser() || router.createUrlTree(['/login']);
};
```

- [ ] **Step 9: Modificar `app.config.ts`** para registrar interceptor y bootstrap auth

```ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth.interceptor';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { inject, provideAppInitializer } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).bootstrap()),
  ],
};
```

- [ ] **Step 10: Run tests**

```bash
pnpm -w apps/frontend test -- --watch=false
```

Expected: passing.

- [ ] **Step 11: Commit**

```bash
git add apps/frontend
git commit -m "feat(fe): services core (api, auth, interceptor, guard, compare-store)"
```

---

### Task 2.3: Layout shell + Header + Footer + Disclaimer

**Files:**
- Create: `src/app/layout/{shell,header,footer}.component.{ts,html,css}`
- Create: `src/app/shared/ui/disclaimer.component.{ts,html,css}`
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Crear `shell.component.html`**

```html
<app-header />
<main class="mx-auto max-w-6xl px-4 py-6">
  <router-outlet />
</main>
<app-footer />
```

- [ ] **Step 2: Crear `header.component.ts/html/css`** con logo "cualautocompro", nav (Catálogo, Comparar, Mi cuenta), y botón Login/Logout con signal.

- [ ] **Step 3: Crear `footer.component`** con links legales y disclaimer estático.

- [ ] **Step 4: Crear `disclaimer.component`** reutilizable con input `text`.

```ts
// disclaimer.component.ts
import { Component, input } from '@angular/core';
@Component({ selector: 'app-disclaimer', templateUrl: './disclaimer.component.html', styleUrl: './disclaimer.component.css' })
export class DisclaimerComponent {
  text = input.required<string>();
}
```

```html
<!-- disclaimer.component.html -->
<p class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="note">
  {{ text() }}
</p>
```

- [ ] **Step 5: Registrar rutas en `app.routes.ts` con shell padre**

```ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent), children: [
    { path: '', loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent) },
    { path: 'compare', loadComponent: () => import('./features/compare/compare.component').then(m => m.CompareComponent) },
    { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
    { path: 'account/comparisons', canActivate: [authGuard], loadComponent: () => import('./features/account/comparisons.component').then(m => m.ComparisonsComponent) },
    { path: 'brand/:brandSlug/model/:modelSlug', loadComponent: () => import('./features/model/model.component').then(m => m.ModelComponent) },
  ]},
];
```

Nota: `auth.guard.ts` usa `inject`:

```ts
// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  return auth.currentUser() ? true : (auth.bootstrap().then(() => auth.currentUser() ? true : router.createUrlTree(['/login'])));
};
```

- [ ] **Step 6: Verificar `pnpm dev:fe` y commit**

```bash
git add apps/frontend
git commit -m "feat(fe): layout shell + header + footer + disclaimer"
```

---

### Task 2.4: Catalog (filtros avanzados + grid) — TDD

**Files:**
- Create: `src/app/features/catalog/catalog.component.{ts,html,css}`
- Create: `src/app/features/catalog/catalog.component.spec.ts`

**Interfaces:**
- `CatalogComponent` recibe filters via `signal` y refleja en URL; consulta `/api/v1/models`.

- [ ] **Step 1: Test RED**

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CatalogComponent } from './catalog.component';

describe('CatalogComponent', () => {
  it('carga modelos al init', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const fixture = TestBed.createComponent(CatalogComponent);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.includes('/api/v1/models'));
    req.flush({ data: { total: 1, items: [{ id: 'm1', name: 'Yaris', brand: { name: 'Toyota' }, minPrice: 14000000, segment: 'HATCHBACK' }], page: 1, pageSize: 20 } });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Yaris');
  });
});
```

- [ ] **Step 2: Implementar `catalog.component.ts/html/css`**

```ts
// catalog.component.ts (resumen — vista principal)
import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';

type CatalogItem = { id: string; name: string; segment: string; minPrice: number | null; brand: { name: string }; imageUrl?: string | null };

@Component({ selector: 'app-catalog', templateUrl: './catalog.component.html', styleUrl: './catalog.component.css' })
export class CatalogComponent {
  private api = inject(ApiService);
  filters = signal<{ brand?: string; segment?: string; priceMin?: number; priceMax?: number; transmission?: string; fuel?: string; powerMin?: number }>({});
  items = signal<CatalogItem[]>([]);
  total = signal(0);
  loading = signal(false);

  async load() {
    this.loading.set(true);
    const res = await this.api.get<{ data: { items: CatalogItem[]; total: number } }>('/models', this.filters() as Record<string, unknown>);
    this.items.set(res.data.items);
    this.total.set(res.data.total);
    this.loading.set(false);
  }
  updateFilter(patch: Partial<ReturnType<typeof this.filters>>) {
    this.filters.update((f) => ({ ...f, ...patch }));
    this.load();
  }
}
```

```html
<!-- catalog.component.html (extracto) -->
<section class="grid gap-6 md:grid-cols-[260px_1fr]">
  <aside class="space-y-4 rounded-lg border bg-white p-4">
    <h2 class="font-display text-lg">Filtros</h2>
    <label class="block text-sm">Marca
      <select class="mt-1 w-full rounded border px-2 py-1" (change)="updateFilter({ brand: $any($event.target).value || undefined })">
        <option value="">Todas</option>
        <!-- iterar marcas -->
      </select>
    </label>
    <!-- más filtros -->
  </aside>
  <div>
    <p class="text-sm text-slate-500">{{ total() }} modelos</p>
    @if (loading()) { <p>Cargando...</p> }
    <ul class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      @for (m of items(); track m.id) {
        <li class="rounded-lg border bg-white p-4">
          <p class="font-display text-base">{{ m.name }}</p>
          <p class="text-sm text-slate-500">{{ m.brand.name }} · {{ m.segment }}</p>
          @if (m.minPrice) { <p class="mt-2 text-brand-700 font-semibold">Desde $ {{ m.minPrice | number:'1.0-0':'es-CL' }}</p> }
          <button (click)="store.add(m.id)" class="mt-3 rounded bg-brand-600 px-3 py-1 text-white">Comparar</button>
        </li>
      }
    </ul>
    <app-disclaimer text="Precios referencia año 2026, confirmar en concesionario." />
  </div>
</section>
```

- [ ] **Step 3: Test PASS + commit**

```bash
pnpm -w apps/frontend test -- --watch=false
git add apps/frontend
git commit -m "feat(fe): catálogo con filtros avanzados y grid"
```

---

### Task 2.5: Compare screen (cards + tabla expandible)

**Files:**
- Create: `src/app/features/compare/compare.component.{ts,html,css}`
- Create: `src/app/features/compare/compare.component.spec.ts`

- [ ] **Step 1: Test RED — estados vacío / 1 / 2 / 3 autos**

```ts
// compare.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CompareComponent } from './compare.component';
import { CompareStore } from '../../core/compare-store.service';

describe('CompareComponent', () => {
  it('muestra estado vacío sin autos', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), CompareStore] });
    const f = TestBed.createComponent(CompareComponent);
    f.detectChanges();
    expect(f.nativeElement.textContent).toMatch(/no has seleccionado/i);
  });

  it('muestra 3 cards cuando hay 3 versiones', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), CompareStore] });
    const f = TestBed.createComponent(CompareComponent);
    const store = TestBed.inject(CompareStore);
    store.hydrateFromUrl('a,b,c');
    f.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/compare'));
    req.flush({ data: { versions: [{ id: 'a', name: 'A', model: { name: 'M', brand: { name: 'T' } } }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }], diffHighlights: { priceClp: true } } });
    await f.whenStable();
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('[data-testid="card"]').length).toBe(3);
  });
});
```

- [ ] **Step 2: Implementar `compare.component.ts/html/css`** con cards arriba y tabla por secciones. Las secciones: Specs, Precios/Año, Equipamiento, Mantención. Las filas donde `diffHighlights[key] === true` llevan una clase `bg-amber-50 ring-1 ring-amber-200`. Tabla con `@for` por versión como columna.

- [ ] **Step 3: Test PASS + commit**

```bash
pnpm -w apps/frontend test -- --watch=false
git add apps/frontend
git commit -m "feat(fe): pantalla de comparación híbrida (cards + tabla con diffs)"
```

---

### Task 2.6: Login + Register + Model detail + Account/comparisons

**Files:**
- Create: `src/app/features/auth/login.component.{ts,html,css}`
- Create: `src/app/features/auth/register.component.{ts,html,css}`
- Create: `src/app/features/model/model.component.{ts,html,css}`
- Create: `src/app/features/account/comparisons.component.{ts,html,css}`

- [ ] **Step 1: `login.component`** — formulario tipado, llama `AuthService.login`, redirige a `/`.

- [ ] **Step 2: `register.component`** — formulario (email, password, name), llama `register`, redirige.

- [ ] **Step 3: `model.component`** — recibe `modelSlug` y `brandSlug` por router, llama `/models/:id` (la API actualmente usa id; ajustar a slug si hace falta en backend). Lista versiones con checkbox "agregar a comparación".

- [ ] **Step 4: `comparisons.component`** — requiere auth. Lista `GET /me/comparisons`, muestra nombre + slug con botón "copiar URL". Botón "eliminar".

- [ ] **Step 5: Tests mínimos y commit**

```bash
git add apps/frontend
git commit -m "feat(fe): pantallas auth + model detail + account/comparisons"
```

---

# Fase 3 — Diseño visual con Stitch + E2E

### Task 3.1: Sistema de diseño Stitch aplicado al frontend

**Files:**
- Create: `docs/superpowers/design/stitch-decisions.md` (notas del sistema de diseño)
- Modify: `apps/frontend/tailwind.config.js` (tokens finales)
- Modify: `apps/frontend/src/styles.css` (tokens finales)
- Create: `docs/supergrounds/design/mockups/` (refs visuales exportadas de Stitch)

- [ ] **Step 1: Generar sistema de diseño base con Stitch MCP** usando `stitch_create_design_system`. Paleta primaria azul/verde (auto/auto); Inter + Manrope; roundness ROUND_EIGHT; dark mode opcional en v1 (decisión: light only para v1).

- [ ] **Step 2: Generar mockups de las 5 pantallas** (`catalog`, `model`, `compare`, `login`, `account`) con `stitch_generate_screen_from_text`.

- [ ] **Step 3: Exportar los mockups como referencia** (URLs o capturas) en `docs/superpowers/design/mockups/`. Documentar decisiones en `stitch-decisions.md`.

- [ ] **Step 4: Ajustar Tailwind + styles con tokens reales** generados por Stitch.

- [ ] **Step 5: Verificar visualmente `pnpm dev:fe`** — abrir cada pantalla, comparar con mockup.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/design apps/frontend/tailwind.config.js apps/frontend/src/styles.css
git commit -m "design(fe): sistema de diseño Stitch + mockups base aplicados"
```

---

### Task 3.2: Playwright E2E (flujos críticos)

**Files:**
- Create: `apps/frontend/playwright.config.ts`
- Create: `apps/frontend/e2e/tests/{auth,explore,compare}.spec.ts`

- [ ] **Step 1: Instalar Playwright**

```bash
pnpm -w apps/frontend add -D @playwright/test
pnpm -w apps/frontend exec npx playwright install --with-deps chromium
```

- [ ] **Step 2: `playwright.config.ts`** — baseURL `http://localhost:4200`, webServer arranca `pnpm start` y backend (`pnpm dev:be`).

- [ ] **Step 3: Escribir `auth.spec.ts`** — registro → historial vacío.

- [ ] **Step 4: Escribir `explore.spec.ts`** — filtros aplican, grid muestra resultados.

- [ ] **Step 5: Escribir `compare.spec.ts`** — seleccionar 3 autos → cards/tabla visibles → guardar con login → URL pública accesible anónimamente.

- [ ] **Step 6: Ejecutar `pnpm test:e2e`** y commit

```bash
git add apps/frontend
git commit -m "test(e2e): playwright specs para auth, explore y compare"
```

---

# Anexo 1 — Notas de implementación

## Postgres en dev

- Usar Docker Compose: `docker compose up -d postgres` (provisión de archivo compose en raíz). El seed task lo asume.

## pglite en tests

- Si `pnpm exec prisma migrate deploy` falla contra pglite (drivers incompatibles), fallback: levantar Postgres en Docker y correr tests contra esa DB con `DATABASE_URL` apuntando al contenedor; `helpers/db.ts` ya está escrito para Postgres.

## Convenciones de código

- **Tests co-located** con `*.spec.ts`.
- TypeScript estricto.
- Importaciones usan extensión `.js` en backend (ESM + `module: "ESNext"`).

## Variables de entorno

Backend `apps/backend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cualautocompro
JWT_SECRET=<32 bytes random>
JWT_EXPIRES_IN=7d
PORT=3000
WEB_ORIGIN=http://localhost:4200
NODE_ENV=development
```

Frontend `apps/frontend/src/environments/environment.ts`:
```ts
export const environment = { apiBase: 'http://localhost:3000/api/v1' };
```

(Lo lee `core/env.ts`.)

## Despliegue (futuro, fuera de v1)

- Frontend: Cloudflare Pages o Netlify (subdominio `app.cualautocompro.cl`).
- Backend: Fly.io / Render (dominio principal `cualautocompro.cl`).
- DB gestionada (Neon/Railway Postgres).
- Dominio `cualautocompro.cl` en NIC Chile → DNS a los anteriores.

---

## Self-review del plan

**1. Spec coverage:**

- Branding (nombre, dominio) → T0.1 + secciones transversales, T3.1 (mockups con el nombre). ✅
- Stitch → T3.1 ✅
- Frontend Angular 22 + signals + CSS + Tailwind + 3 archivos → T2.1–T2.6 ✅
- Backend Express + Prisma + Postgres + JWT HttpOnly + bcrypt → T1.1–T1.6 ✅
- API REST `/api/v1` con auth, brands, models, versions, compare, comparisons → T1.3–T1.6 ✅
- Comparación 1-3 autos con `diffHighlights` → T1.5 ✅
- Sharing por URL (`?ids`, `?slug`) → T1.5 + T2.5 ✅
- Login + historial → T1.3 + T1.6 + T2.2 + T2.6 ✅
- TDD (Vitest backend + frontend, Playwright E2E) → T1.*, T2.*, T3.2 ✅
- Catálogo Chile seed → T1.7 ✅
- Estructura del monorepo → T0.1 ✅
- Riesgos / disclaimers → transversal (catalog T2.4, compare T2.5). ✅

**2. Placeholder scan:** sin "TBD" / "TODO" / "fill in". Pasos muestran código concreto.

**3. Type consistency:**
- `AuthService.currentUser` usado en `header.component` y `auth.guard.ts` ✅
- `CompareStore.ids` consumido por `catalog`, `model`, `compare` ✅
- `ApiService.get/post/delete` con `withCredentials: true` consistente ✅
- `createApp()` importada igual en `app.ts`, tests, e2e (vía `baseURL`) ✅
- `ENV.apiBase` único origen de verdad ✅

**4. Posibles gaps resueltos inline:**
- Faltaba `provideAppInitializer` para bootstrap auth al iniciar la app → añadido en T2.2 Step 9.
- Faltaba `.env.example` raíz → T0.1 Step 7.
- Faltaba migrate deploy en CI para DB de tests → T1.4 Step 7 (referenciado).

---

**Plan listo. Ofrecer opciones de ejecución.**
