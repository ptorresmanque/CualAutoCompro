# AGENTS.md — `apps/backend/`

Convenciones del backend de cualAutoCompro (Node 20+, Express 4, Prisma 6,
MariaDB 11, TypeScript ~6, Vitest 4). Scope: todo lo que está bajo
`apps/backend/`. Complementa al AGENTS.md raíz — aquel manda sobre lo
genérico, este sobre lo específico de backend.

## 1. Layout

```
apps/backend/
├── prisma/
│   ├── schema.prisma          # modelos + datasource + generator
│   ├── migrations/            # una carpeta por migración (YYYYMMDDHHMMSS_<slug>)
│   ├── seed.ts                # entrypoint de `npm run db:seed`
│   └── catalog.ts             # dataset de demo que consume seed.ts
├── scripts/
│   └── check-db-connections.mjs
├── src/
│   ├── index.ts               # entrypoint (createApp + listen)
│   ├── app.ts                 # createApp(): middlewares + routers (NO listen)
│   ├── server.ts              # createServer() + withGracefulShutdown()
│   ├── config/
│   │   └── env.ts             # carga .env + validación Zod + invariantes prod
│   ├── infra/
│   │   ├── prisma.ts          # singleton de PrismaClient (globalThis.__prisma)
│   │   └── jwt.ts             # sign/verify del cookie de sesión
│   ├── shared/                # utilities reutilizables (ver §5)
│   └── modules/<entity>/
│       ├── <entity>.routes.ts # Router con auth/role middlewares
│       ├── <entity>.controller.ts # ah(...) handlers, validación Zod, ok/validation
│       ├── <entity>.service.ts    # lógica + Prisma. Para admin: <entity>.dto.admin.ts
│       └── <entity>.spec.ts   # tests unitarios del service
├── __tests__/
│   ├── setup.ts               # carga .env.test, exige DATABASE_URL
│   ├── env-connection-limit.spec.ts  # contrato sobre DATABASE_URL
│   └── helpers/               # testApp.ts, db.ts, auth.ts
└── .env, .env.development, .env.test  # ignorados por git
```

Reglas:

- **Un módulo por dominio**. Cada subdirectorio bajo `src/modules/` cubre una
  entidad (versions, models, brands, etc.). Si un cambio toca más de un
  módulo, hay que coordinarlo (no crear cross-imports entre módulos; usar
  `shared/` si la utilidad es genuinamente transversal).
- **Admin vive en el mismo módulo**, no en un sub-módulo. Las rutas admin
  usan `<entity>AdminRouter` con `authenticate + requireRole("ADMIN")`
  aplicado en el router. Ver `versions.routes.ts` como referencia.
- **NO** poner lógica de negocio en el controller. Si el controller crece,
  extraer a `service.ts`.

## 2. Convenciones de código

### TypeScript / módulos

- `"type": "module"` en `package.json` y `"module": "ESNext"` en tsconfig.
  **Todos los imports terminan en `.js`** aunque el archivo fuente sea `.ts`
  (convención ESM del backend — Node resuelve `.js` → `.ts` vía tsx).
- `tsconfig` extiende `../../tsconfig.base.json`. No overridear strict.
- Type augmentation vive en el archivo que la necesita (ej.
  `Express.User` se augmenta en `auth/auth.middleware.ts`, no en un global).
- Para `noUncheckedIndexedAccess`: preferir guards explícitos
  (`if (!req.user) return next(unauthorized())`) en vez de `!` casts.

### Errores

- Toda ruta lanza errores con los helpers de `shared/errors.ts`
  (`notFound`, `validation`, `conflict`, `badRequest`, `forbidden`,
  `unauthorized`, `tooManyRequests`, `cannotDemoteSelf`). **Nunca** retornar
  `res.status(400).json(...)` directo — rompe el shape `{ data, error }`
  uniforme.
- El `AppError` lleva `code: ErrorCode` (string enum) y opcionalmente
  `details` (ej. Zod issues en `VALIDATION`).
- `OAuthError` es para errores OAuth que se propagan por redirect a
  `/login?error=<code>` (NO entran al `ErrorCode` enum).
- En services que tiran a controladores de admin, pasar detalles tipados
  en `details` para que el frontend pueda mapear a campos del form
  (`err.backend.fields` en el cliente Angular).

### Controllers

- Handler envuelto en `ah(...)` (`shared/async-handler.ts`) — propagates
  rejections a Express.
- Para admin: `parsePagination(req.query.page, req.query.pageSize)` +
  `sendPaged(res, rows, total, params)`.
- Para admin: leer `q` con `typeof req.query.q === "string"` + `.trim()` +
  `if (term.length > 0)` antes de meterlo al where.
- Body validado con `schema.safeParse` + `validation("Datos inválidos",
  parsed.error.issues)` si falla. **No** `try { schema.parse }` directo.
- Para mutaciones que retornan recurso: `res.status(201).json(ok(...))`.

### Services

- `class XxxService { constructor(private readonly prisma: PrismaClient) {} }`.
- Para raw SQL (versión, enum extension, etc.): comentario "SCHEMA-DRIFT
  NOTE" explicando por qué no se usa el Prisma client tipado.
- Para INSERT/UPDATE con columnas explícitas: usar `??` con `null` y nunca
  `undefined` en los VALUES, y chequear que la cantidad de columnas ==
  cantidad de placeholders == cantidad de args. Bug histórico evitado
  múltiples veces.
- `softDelete`/`restore` son la convención de borrado (campo `deletedAt`
  en Prisma); el service filtra siempre `{ deletedAt: null }` salvo en
  restore.
- `list` y `listAll` siguen la convención: `list` es paginado y admin,
  `listAll` devuelve todo y es público (ej. equipment, fuel prices).

### Validación

- DTOs admin viven en `<entity>.dto.admin.ts` (`createXxxSchema` +
  `updateXxxSchema`) exportados con `z.infer` para tipos.
- Validaciones cross-field con `.superRefine()` (ej.
  `validateRecall`/`validateFuelFields` en `versions.dto.admin.ts`).
- Para campos enum-like que permiten extensión runtime (Fuel, Transmission,
  Segment): regex `^[A-Z0-9_]+$` en el schema + constantes exportadas
  desde el módulo (`SEGMENTS`, `FUELS`, `TRANSMISSIONS`) para que el
  frontend reuse las mismas listas.

## 3. Base de datos

### Prisma

- MariaDB. **No usar `enum` de Prisma** (mapea a `ENUM(...)` inline que
  no se puede extender en runtime) — usar `String` + validación runtime.
  Ver comentario en `schema.prisma` líneas 67-72.
- Cascade deletes: poner `onDelete: Cascade` en FKs hacia entidades que
  se soft-deleted (ej. `Version.modelId` → `Model`).
- `binaryTargets` siempre incluye `native` y `debian-openssl-3.0.x`
  (target obligatorio para cPanel/CloudLinux). Ver comentario al tope de
  `schema.prisma` para la justificación.

### Migraciones

- Naming: `YYYYMMDDHHMMSS_<slug>/migration.sql` con un directorio por
  migración. Ver `prisma/migrations/20260724120000_drop_version_security_fields/`
  como ejemplo reciente.
- Toda migración **destructiva** (DROP COLUMN, DROP TABLE, etc.) debe
  quedar explícita en el plan de la feature con justificación y, si es
  posible, plan de backup antes de mergear a `main`.
- Dev: `npm -w apps/backend run db:migrate` (genera + aplica + reset client).
- Prod: `npx prisma migrate deploy` (solo aplica pendientes; NO regenera).
  El `.env.development` es la DB local — NO apuntar a producción por
  accidente.

### Pool / timeouts

- `DATABASE_URL` debe llevar `connection_limit=10&connect_timeout=10
  &pool_timeout=10&socket_timeout=30&max_idle_connection_lifetime=300`.
  Hay un test (`__tests__/env-connection-limit.spec.ts`) que enforce esto
  sobre los `.env*.example`. Si lo subís, justificar el impacto en
  `docs/setup.md`.

## 4. Tests (Vitest)

- Cada service tiene su `<entity>.service.spec.ts`. Cobertura objetivo:
  casos happy path + al menos un caso de error por método público.
- Setup común: `setupTestPrisma()` + `resetTestDb(prisma)` en
  `__tests__/helpers/db.ts`. Tests de integración usan `__tests__/helpers/testApp.ts`
  + `auth.ts` para inyectar JWT.
- Suite usa `.env.test` (sin OAuth envs → `/auth/providers` devuelve
  `{google:false, apple:false}`). Si agregás OAuth en tests, seteá las
  envs en `__tests__/setup.ts` con valores dummy.
- `npm -w apps/backend run test` corre todo. `npm -w apps/backend run
  test:watch` para iterar.
- Si un cambio en producción rompe un test preexistente que asumía
  campos/datos viejos, **actualizar el test** (no es opcional). Pero si
  el test asume comportamiento que la feature nueva intencionalmente
  cambia, documentar en el plan/spec antes de tocarlo.

## 5. Shared utilities (referencia rápida)

- `errors.ts`: `AppError`, `OAuthError`, factories (`notFound`,
  `validation`, etc.). SIEMPRE usar factories — no `new AppError(...)`
  directo.
- `async-handler.ts`: `ah(fn)` para wrappear handlers async.
- `response.ts`: `ok(data)` y `fail(err)` para shape `{ data, error }`.
- `pagination.ts`: `parsePagination`, `pagedResponse`, `sendPaged`,
  `PagedResponse<T>`. Usar `PagedResponse` como tipo de retorno del
  endpoint paginado.
- `csv.ts`: `toCsv`/`parseCsv` (RFC-4180-ish).
- `slug.ts`: `slugify`/`safeSlug`.
- `json.ts`: `toGalleryUrls` (tolerar `Json` como string o array —
  Prisma/MariaDB a veces devuelve uno u otro).
- `image-url.ts`: zod helper para URLs (`/uploads/...` o absolutas).
- `enum-extension.ts`: `extendEnum` (no-op en MariaDB, conserva la API).
- `user-role.ts`: tipo `UserRole` + guards.

## 6. Seguridad / hosting (LVE)

El backend corre en cPanel/CloudLinux con LVE. Cada TCP socket cuenta
como Entry Process (EP). Defaults a respetar:

- Pool Prisma chico (`connection_limit=10`).
- `server.keepAliveTimeout = 30s` y `server.headersTimeout = 31s`
  (headers > keepAlive por requisito de Node). Tuning en `server.ts`.
- Shutdown idempotente con hard timeout de 10s (`withGracefulShutdown`).
- No agregar dependencias binarias nativas nuevas sin justificación
  (consumen EP y memoria).
- `cookies secure:false` en test, `secure:true` en prod (mismas sesión
  JWT, mismo flag de `httpOnly`).

`scripts/check-db-connections.mjs` reporta conexiones MySQL Sleep que
pueden acumular EPs. Útil para diagnosticar antes de un deploy.

## 7. Comandos

```bash
# Desarrollo
npm -w apps/backend run dev              # tsx watch + reload
npm -w apps/backend run build            # tsc -p tsconfig.json
npm -w apps/backend run start            # node dist/src/index.js (requiere build)

# DB
npm -w apps/backend run db:migrate       # prisma migrate dev (genera + aplica)
npm -w apps/backend run db:seed          # tsx prisma/seed.ts
npm -w apps/backend run db:reset         # prisma migrate reset --force
npx prisma migrate deploy                # prod (solo aplica)
node scripts/check-db-connections.mjs    # diagnóstico de EPs

# Tests
npm -w apps/backend run test             # vitest run
npm -w apps/backend run test:watch       # vitest
```

## 8. Lo que NO se hace

- ❌ Cambios a Prisma sin migración + entrada en el spec/plan.
- ❌ `res.status(...).json(...)` fuera de los formatos `ok`/`fail`.
- ❌ `throw new Error(...)` en handlers (usar factories de `errors.ts`).
- ❌ Mutar el client Prisma global directamente; pasar `prisma` por DI al
  service.
- ❌ Tocar `.env` de prod (`.env.development` es la DB local).
- ❌ Cambios que eleven `connection_limit`, `connect_timeout`,
  `socket_timeout` o `pool_timeout` por encima de los topes del test
  `env-connection-limit.spec.ts` sin justificación escrita.
