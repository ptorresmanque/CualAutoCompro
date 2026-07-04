# Migración Backend PostgreSQL → MariaDB — Plan de Implementación

> **Para agentes:** REQUIRED SUB-SKILL: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Pasos usan checkbox (`- [ ]`) para tracking.

**Goal:** Migrar el backend de `cualautocompro` de PostgreSQL a MariaDB manteniendo Prisma como ORM y sin perder funcionalidad, con todos los tests pasando contra MariaDB.

**Architecture:** Cambio de provider en `schema.prisma` (`postgresql` → `mysql`), regeneración de migraciones, `galleryUrls String[]` → `Json` con helper de normalización, reescritura de 4 raw queries con sintaxis MariaDB (`?` placeholders, `CAST`), `extendEnum` queda como no-op (en MariaDB no hay DB-level enum). Helper `toGalleryUrls()` abstrae las diferencias de cómo Prisma entrega el `Json` (string en algunas versiones, objeto en otras).

**Tech Stack:** Node.js + Express, Prisma 5.20 + provider `mysql`, MariaDB 10.5+, Vitest.

## Global Constraints

- **MariaDB mínimo 10.5** (por `RETURNING` clause). Versiones < 10.5 rompen los INSERT/UPDATE raw.
- **Charset obligatorio: `utf8mb4`** en `DATABASE_URL` (soporte completo Unicode/emoji).
- **Prisma `Json` se mapea a `LONGTEXT`** en MariaDB (no a `JSON` nativo). El helper `toGalleryUrls()` maneja ambos formatos de retorno (string JSON u objeto/array ya parseado).
- **`mode: "insensitive"` NO funciona en MariaDB** (solo PostgreSQL/MongoDB). MariaDB usa collation `utf8mb4_unicode_ci` por defecto que ya es case-insensitive en `LIKE`.
- **No hay DB-level enums en MariaDB** con provider Prisma. Prisma los genera como `VARCHAR` sin `CHECK`. Por eso `extendEnum` queda como no-op.
- **Commits frecuentes**: cada tarea termina con su commit. Mensajes con prefijo `feat(be):`, `chore(be):`, `refactor(be):`, `test(be):` según corresponda.
- **TDD**: cuando aplique, escribir test que falla antes de la implementación. Para tareas sin test natural, integración con la suite existente sirve como verificación.

## Pre-requisitos

Antes de empezar la Tarea 1:
- Docker disponible (recomendado para MariaDB local reproducible).
- O MariaDB instalado vía brew/apt.

---

## Tarea 1: Provisionar MariaDB local y actualizar variables de entorno

**Files:**
- Modify: `.env.example` (raíz del repo)
- Modify: `apps/backend/.env.test.example`
- Create: `apps/backend/.env.test` (gitignored, contiene secretos locales)

**Interfaces:**
- Consumes: nothing
- Produces: MariaDB accesible en `localhost:3306`, archivos `.env*` apuntando a MariaDB.

- [ ] **Paso 1: Levantar MariaDB con Docker**

```bash
docker run -d --name cualautocompro-db \
  -e MARIADB_ROOT_PASSWORD=rootpass \
  -e MARIADB_DATABASE=cualautocompro \
  -e MARIADB_USER=cualauto \
  -e MARIADB_PASSWORD=cualauto \
  -p 3306:3306 \
  mariadb:11
```

- [ ] **Paso 2: Crear la base de datos de tests**

```bash
docker exec cualautocompro-db mariadb -uroot -prootpass \
  -e "CREATE DATABASE IF NOT EXISTS cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker exec cualautocompro-db mariadb -uroot -prootpass \
  -e "GRANT ALL ON cualautocompro_test.* TO 'cualauto'@'%';"
```

- [ ] **Paso 3: Verificar conexión**

```bash
docker exec cualautocompro-db mariadb -ucualauto -pcualauto \
  -e "SELECT VERSION();" cualautocompro
```

Esperado: muestra versión MariaDB 11.x.

- [ ] **Paso 4: Actualizar `.env.example` (raíz)**

Reemplazar `DATABASE_URL=postgresql://...` por:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro?charset=utf8mb4&connection_limit=10
```

- [ ] **Paso 5: Actualizar `apps/backend/.env.test.example`**

Reemplazar el contenido de `DATABASE_URL` por:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro_test?charset=utf8mb4
```

- [ ] **Paso 6: Crear `apps/backend/.env.test` desde el example**

```bash
cp apps/backend/.env.test.example apps/backend/.env.test
```

- [ ] **Paso 7: Commit**

```bash
git add .env.example apps/backend/.env.test.example
git commit -m "chore(be): apuntar DATABASE_URL a MariaDB"
```

---

## Tarea 2: Cambiar provider de Prisma, ajustar schema y regenerar migraciones

**Files:**
- Modify: `apps/backend/prisma/schema.prisma:6` (provider), `:27` (galleryUrls)
- Modify: `apps/backend/prisma/migrations/migration_lock.toml:3` (provider)
- Delete: `apps/backend/prisma/migrations/20260630120609_init/`
- Delete: `apps/backend/prisma/migrations/20260630152918_add_gallery_urls/`
- Delete: `apps/backend/prisma/migrations/20260701131931_favorites_and_versions_hash/`
- Delete: `apps/backend/prisma/migrations/20260701160000_favorite_version_id/`
- Delete: `apps/backend/prisma/migrations/20260701201118_add_user_role/`
- Delete: `apps/backend/prisma/migrations/20260701201531_add_deleted_at/`
- Create: `apps/backend/prisma/migrations/<timestamp>_init/migration.sql` (generado)

**Interfaces:**
- Consumes: MariaDB provisionada (Tarea 1)
- Produces: schema.prisma con `provider = "mysql"` y `galleryUrls Json`, lock file con `mysql`, una sola migración limpia.

- [ ] **Paso 1: Editar `apps/backend/prisma/schema.prisma` línea 6**

Cambiar `provider = "postgresql"` por `provider = "mysql"`.

- [ ] **Paso 2: Editar `apps/backend/prisma/schema.prisma` línea 27**

Cambiar `galleryUrls String[]  @default([])` por `galleryUrls Json      @default("[]")`.

- [ ] **Paso 3: Editar `apps/backend/prisma/prisma/migrations/migration_lock.toml` línea 3**

Cambiar `provider = "postgresql"` por `provider = "mysql"`.

- [ ] **Paso 4: Borrar las 6 subcarpetas de migraciones**

```bash
rm -rf apps/backend/prisma/migrations/20260630120609_init \
       apps/backend/prisma/migrations/20260630152918_add_gallery_urls \
       apps/backend/prisma/migrations/20260701131931_favorites_and_versions_hash \
       apps/backend/prisma/migrations/20260701160000_favorite_version_id \
       apps/backend/prisma/migrations/20260701201118_add_user_role \
       apps/backend/prisma/migrations/20260701201531_add_deleted_at
```

- [ ] **Paso 5: Regenerar migración inicial**

```bash
cd apps/backend
pnpm exec prisma migrate dev --name init
```

Esperado: crea `apps/backend/prisma/migrations/<timestamp>_init/migration.sql`. Si pregunta por "reset", confirmar.

- [ ] **Paso 6: Verificar el SQL generado**

```bash
cat apps/backend/prisma/migrations/<timestamp>_init/migration.sql
```

Verificar:
- NO hay `CREATE TYPE` (los enums deben ser `VARCHAR`).
- `galleryUrls` aparece como `LONGTEXT` (o `TEXT`) con default JSON `'[]'`.
- Hay `@@index`/`@@unique` para todos.

- [ ] **Paso 7: Regenerar Prisma Client**

```bash
pnpm exec prisma generate
```

Esperado: mensaje "Generated Prisma Client". Si hay errores de tipo por `galleryUrls` ahora siendo `Json` en vez de `String[]`, anotarlos para resolver en Tarea 7.

- [ ] **Paso 8: Confirmar que la DB está sincronizada**

```bash
pnpm exec prisma migrate status
```

Esperado: "Database schema is up to date".

- [ ] **Paso 9: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(be): migrar schema.prisma de PostgreSQL a MariaDB"
```

---

## Tarea 2b: Cambiar enums a `String` en schema (decisión arquitectónica)

**Por qué:** Prisma genera columnas inline `ENUM('VAL1','VAL2',...)` para el provider `mysql`, no `VARCHAR`. Esto rompe la feature de "extender enums en runtime" porque cualquier valor fuera de la lista falla con `Data truncated`. Solución: cambiar los tipos enum a `String` en el schema para que Prisma genere `VARCHAR(191)`, aceptando cualquier string. Las constantes `SEGMENTS`/`FUELS`/`TRANSMISSIONS` en los services siguen validando los valores conocidos; los valores extendidos pasan vía raw SQL sin validación Prisma.

**Files:**
- Modify: `apps/backend/prisma/schema.prisma` (4 cambios: enum `Segment`, enum `Fuel`, enum `Transmission`, enum `UserRole`, y los usos en Model/Version/User)
- Modify: `apps/backend/prisma/migrations/<existing_init>/migration.sql` (regenerar para reflejar VARCHAR)
- Delete: `apps/backend/prisma/migrations/<existing_init>/` (para regenerar limpio)

**Interfaces:**
- Consumes: schema.prisma actual con provider mysql
- Produces: schema.prisma con campos `String` donde antes había enums, migración regenerada con columnas `VARCHAR(191)`.

- [ ] **Paso 1: Reemplazar los bloques `enum` en `schema.prisma`**

Localizar las líneas 39-101 de schema.prisma que contienen:

```prisma
enum Segment {
  SEDAN
  SUV
  HATCHBACK
  PICKUP
  CROSSOVER
  COMMERCIAL
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

enum UserRole {
  USER
  ADMIN
}
```

Reemplazar TODO el bloque por una sola línea de comentario:

```prisma
// Enums eliminados para MariaDB: Prisma genera columnas inline ENUM(...) que
// no se pueden extender en runtime. Usamos String + constantes SEGMENTS/
// FUELS/TRANSMISSIONS en services para validar valores conocidos y permitir
// valores extendidos vía raw SQL.
```

- [ ] **Paso 2: Reemplazar usos de los enums por `String` en schema.prisma**

- Línea 25: `segment     Segment` → `segment     String`
- Línea 54: `transmission          Transmission` → `transmission          String`
- Línea 55: `fuel                  Fuel` → `fuel                  String`
- Línea 140: `role         UserRole     @default(USER)` → `role         String     @default("USER")`

- [ ] **Paso 3: Borrar la migración init existente**

```bash
rm -rf apps/backend/prisma/migrations/<timestamp>_init
```

- [ ] **Paso 4: Regenerar Prisma Client (sin migración nueva — solo para tipos TS)**

```bash
cd apps/backend && pnpm exec prisma generate
```

- [ ] **Paso 5: Generar nueva migración con SQL workaround (shadow DB)**

Como `cualauto` no tiene `CREATE` global para shadow DB, usar `prisma migrate diff`:

```bash
cd apps/backend
pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_init/migration.sql
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_init
mv prisma/migrations/$(date +%Y%m%d%H%M%S)_init/migration.sql prisma/migrations/$(date +%Y%m%d%H%M%S)_init/migration.sql 2>/dev/null || true
# Lo correcto es crear el directorio primero:
TS=$(date +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${TS}_init
pnpm exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/${TS}_init/migration.sql
```

- [ ] **Paso 6: Aplicar la migración**

```bash
pnpm exec prisma migrate deploy
```

Esperado: "All migrations have been successfully applied".

- [ ] **Paso 7: Verificar que las columnas son VARCHAR**

```bash
cd apps/backend && cat prisma/migrations/<new_ts>_init/migration.sql | grep -A1 "segment\|transmission\|fuel\|role"
```

Esperado: `segment VARCHAR(191) NOT NULL`, etc. (no `ENUM(...)`).

- [ ] **Paso 8: Regenerar Prisma Client**

```bash
pnpm exec prisma generate
```

- [ ] **Paso 9: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(be): cambiar enums a String para aceptar valores extendidos en MariaDB"
```

---

## Tarea 3: Crear helper `toGalleryUrls` (TDD)

**Files:**
- Create: `apps/backend/src/shared/json.ts`
- Create: `apps/backend/src/shared/json.spec.ts`

**Interfaces:**
- Consumes: nothing (utility pura)
- Produces: `export function toGalleryUrls(value: Prisma.JsonValue | null | undefined): string[]`

- [ ] **Paso 1: Crear test file `apps/backend/src/shared/json.spec.ts`**

```ts
import { describe, expect, it } from "vitest";
import { toGalleryUrls } from "./json.js";

describe("toGalleryUrls", () => {
  it("devuelve [] para null", () => {
    expect(toGalleryUrls(null)).toEqual([]);
  });

  it("devuelve [] para undefined", () => {
    expect(toGalleryUrls(undefined)).toEqual([]);
  });

  it("parsea string JSON con array de strings", () => {
    expect(toGalleryUrls('["a","b"]')).toEqual(["a", "b"]);
  });

  it("devuelve [] para string JSON inválido", () => {
    expect(toGalleryUrls("no es json")).toEqual([]);
  });

  it("devuelve [] para JSON que no es array", () => {
    expect(toGalleryUrls('{"foo":"bar"}')).toEqual([]);
  });

  it("filtra elementos no-string del array", () => {
    expect(toGalleryUrls(["a", 1, null, "b"])).toEqual(["a", "b"]);
  });

  it("devuelve array tal cual si ya es array", () => {
    expect(toGalleryUrls(["x", "y"])).toEqual(["x", "y"]);
  });

  it("devuelve [] para string plano sin JSON", () => {
    expect(toGalleryUrls("plain-string")).toEqual([]);
  });

  it("devuelve [] para número", () => {
    expect(toGalleryUrls(42)).toEqual([]);
  });
});
```

- [ ] **Paso 2: Correr test, ver que falla**

```bash
cd apps/backend && pnpm test src/shared/json.spec.ts
```

Esperado: FAIL con "Cannot find module './json.js'".

- [ ] **Paso 3: Crear `apps/backend/src/shared/json.ts`**

```ts
import type { Prisma } from "@prisma/client";

/**
 * Normaliza el campo `galleryUrls` (tipo `Json` en schema) a `string[]`.
 *
 * MariaDB mapea `Json` a `LONGTEXT` y Prisma puede devolver el valor como
 * string JSON o como array ya parseado según versión. Esta función tolera
 * ambos formatos y filtra elementos no-string.
 */
export function toGalleryUrls(value: Prisma.JsonValue | null | undefined): string[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === "string");
      }
      return [];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }

  return [];
}
```

- [ ] **Paso 4: Correr test, ver que pasa**

```bash
pnpm test src/shared/json.spec.ts
```

Esperado: 9 tests pass.

- [ ] **Paso 5: Commit**

```bash
git add apps/backend/src/shared/json.ts apps/backend/src/shared/json.spec.ts
git commit -m "feat(be): helper toGalleryUrls para normalizar campo Json"
```

---

## Tarea 4: Refactorizar `extendEnum` a no-op para MariaDB (TDD)

**Files:**
- Modify: `apps/backend/src/shared/enum-extension.ts`
- Modify: `apps/backend/src/shared/enum-extension.spec.ts`

**Interfaces:**
- Consumes: nada (la firma no cambia)
- Produces: `extendEnum(_prisma, enumName, newValue)` solo valida regex, sin tocar la DB.

- [ ] **Paso 1: Crear test nuevo en `apps/backend/src/shared/enum-extension.spec.ts`**

Reemplazar todo el contenido por:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { extendEnum } from "./enum-extension.js";

describe("extendEnum (MariaDB no-op)", () => {
  const prisma = new PrismaClient();
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

  it("acepta un valor válido como no-op (no lanza ni toca la DB)", async () => {
    await expect(
      extendEnum(prisma, "Segment", "NEW_VALID_VALUE"),
    ).resolves.not.toThrow();
  });

  it("valida los 3 enums (Segment, Fuel, Transmission)", async () => {
    await expect(extendEnum(prisma, "Segment", "BAD VALUE")).rejects.toThrow();
    await expect(extendEnum(prisma, "Fuel", "BAD VALUE")).rejects.toThrow();
    await expect(extendEnum(prisma, "Transmission", "BAD VALUE")).rejects.toThrow();
    await expect(extendEnum(prisma, "Segment", "GOOD_VALUE")).resolves.not.toThrow();
    await expect(extendEnum(prisma, "Fuel", "GOOD_VALUE")).resolves.not.toThrow();
    await expect(extendEnum(prisma, "Transmission", "GOOD_VALUE")).resolves.not.toThrow();
  });
});
```

- [ ] **Paso 2: Correr test, ver que falla**

```bash
pnpm test src/shared/enum-extension.spec.ts
```

Esperado: FAIL porque `extendEnum` todavía ejecuta SQL Postgres que rompe contra MariaDB, o porque eliminamos tests que ahora compilan pero el test de rechazo de regex sigue pasando pero el de aceptación exitosa falla porque intenta `ALTER TYPE`.

- [ ] **Paso 3: Refactorizar `apps/backend/src/shared/enum-extension.ts`**

Reemplazar todo el contenido por:

```ts
import type { PrismaClient } from "@prisma/client";

export type EnumName = "Segment" | "Fuel" | "Transmission";

const ENUM_VALUE_REGEX = /^[A-Z0-9_]+$/;

/**
 * En MariaDB, Prisma mapea enums a `VARCHAR` sin `CHECK` constraint,
 * por lo que no hay nada que extender a nivel de DB. La validación
 * contra enums vive solo en el cliente Prisma generado y se evade
 * en los services usando raw SQL. Esta función queda como no-op para
 * preservar la API pública.
 *
 * Solo conservamos la validación de regex como guard contra SQL injection
 * si en el futuro alguien cambia la implementación.
 */
export async function extendEnum(
  _prisma: PrismaClient,
  enumName: EnumName,
  newValue: string,
): Promise<void> {
  if (!ENUM_VALUE_REGEX.test(newValue)) {
    throw new Error(`Valor inválido para enum ${enumName}: ${newValue}`);
  }
  // No-op en MariaDB.
}
```

- [ ] **Paso 4: Correr test, ver que pasa**

```bash
pnpm test src/shared/enum-extension.spec.ts
```

Esperado: 3 tests pass.

- [ ] **Paso 5: Commit**

```bash
git add apps/backend/src/shared/enum-extension.ts apps/backend/src/shared/enum-extension.spec.ts
git commit -m "refactor(be): extendEnum como no-op en MariaDB"
```

---

## Tarea 5: Reescribir raw SQL en `models.service.ts` (create + update)

**Cambios respecto al plan original:**
- Enums son ahora `String` (VARCHAR) en schema — no se necesita cast especial en INSERT.
- `CAST(? AS JSON)` se reemplaza por `?` directo (columna es `longtext`, no `JSON` válido como CAST target en MariaDB).
- `UPDATE` no soporta `RETURNING` en MariaDB → split en 2 queries (UPDATE, luego SELECT WHERE id=?).

**Files:**
- Modify: `apps/backend/src/modules/models/models.service.ts:152-180` (create raw INSERT)
- Modify: `apps/backend/src/modules/models/models.service.ts:187-225` (update raw UPDATE → split)

**Interfaces:**
- Consumes: `toGalleryUrls` (Tarea 3), `extendEnum` no-op (Tarea 4)
- Produces: `ModelsService.create()` y `ModelsService.update()` ejecutan SQL MariaDB-compatible.

- [ ] **Paso 1: Reemplazar el INSERT raw en `create()` (líneas 152-180)**

Reemplazar desde `await extendEnum(this.prisma, "Segment", input.segment);` (línea 152) hasta el cierre del bloque (línea 180, antes del `}` de la función) por:

```ts
    await extendEnum(this.prisma, "Segment", input.segment);
    const id = randomUUID();
    // SCHEMA-DRIFT NOTE: raw SQL is required because Prisma 5's query engine
    // validates enums against the codegen-time schema and rejects new values.
    // MariaDB uses `?` placeholders (not `$N`), VARCHAR columns (no enum
    // cast needed), and LONGTEXT for `Json` (bound as JSON-formatted string,
    // no CAST — MariaDB doesn't accept `CAST AS JSON`).
    const rows = await this.prisma.$queryRawUnsafe<Array<{
      id: string;
      brandId: string;
      name: string;
      segment: string;
      imageUrl: string | null;
      galleryUrls: string;
      deletedAt: Date | null;
      createdAt: Date;
    }>>(
      `INSERT INTO \`Model\` (id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`createdAt\`, \`deletedAt\`)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NULL)
       RETURNING id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`deletedAt\`, \`createdAt\``,
      id,
      input.brandId,
      input.name,
      input.segment,
      input.imageUrl ?? null,
      JSON.stringify(input.galleryUrls ?? []),
    );
    const row = rows[0]!;
    return {
      ...row,
      galleryUrls: toGalleryUrls(row.galleryUrls),
    };
```

- [ ] **Paso 2: Confirmar import de `toGalleryUrls` al inicio del archivo**

Verificar que existe:
```ts
import { toGalleryUrls } from "../../shared/json.js";
```
Si no existe (puede haber sido removido entre fixes), agregarlo junto a los otros imports de `../../shared/...`.

- [ ] **Paso 3: Reemplazar el UPDATE raw en `update()` (líneas 187-225)**

MariaDB no soporta `UPDATE ... RETURNING`. Split en 2 queries: UPDATE primero, luego SELECT para devolver la fila actualizada.

Reemplazar el bloque desde `if (newSegment) {` (línea 187) hasta el `return rows[0]!;` (línea 224) por:

```ts
    if (newSegment) {
      await extendEnum(this.prisma, "Segment", newSegment);
      const setClauses: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        setClauses.push("name = ?");
        values.push(input.name);
      }
      setClauses.push("segment = ?");
      values.push(input.segment);
      if (input.imageUrl !== undefined) {
        setClauses.push("`imageUrl` = ?");
        values.push(input.imageUrl);
      }
      if (input.galleryUrls !== undefined) {
        setClauses.push("`galleryUrls` = ?");
        values.push(JSON.stringify(input.galleryUrls));
      }
      values.push(id);
      // SCHEMA-DRIFT NOTE: raw UPDATE porque extendEnum agrega un valor
      // nuevo al enum runtime y Prisma's query engine lo rechazaría. En
      // MariaDB no hay RETURNING para UPDATE, así que hacemos SELECT
      // después para devolver la fila actualizada.
      const updateResult = await this.prisma.$executeRawUnsafe(
        `UPDATE \`Model\` SET ${setClauses.join(", ")} WHERE id = ? AND \`deletedAt\` IS NULL`,
        ...values,
      );
      if (updateResult === 0) throw notFound("Modelo no encontrado");
      const rows = await this.prisma.$queryRawUnsafe<Array<{
        id: string;
        brandId: string;
        name: string;
        segment: string;
        imageUrl: string | null;
        galleryUrls: string;
        deletedAt: Date | null;
        createdAt: Date;
      }>>(
        `SELECT id, \`brandId\`, name, segment, \`imageUrl\`, \`galleryUrls\`, \`deletedAt\`, \`createdAt\`
         FROM \`Model\` WHERE id = ? AND \`deletedAt\` IS NULL`,
        id,
      );
      const row = rows[0]!;
      return {
        ...row,
        galleryUrls: toGalleryUrls(row.galleryUrls),
      };
    }
```

- [ ] **Paso 4: Correr typecheck**

```bash
cd apps/backend && pnpm exec tsc --noEmit
```

Esperado: 5 errores restantes (los de `mode: insensitive` y `favorites.service.ts` — esos son de Tarea 7).

- [ ] **Paso 5: Correr tests del módulo**

```bash
pnpm test src/modules/models/models.service.spec.ts
```

Esperado: 5/5 pasan (los tests que usan `TEST_NEW_SEG_...` ahora funcionan porque la columna es VARCHAR).

- [ ] **Paso 6: Commit**

```bash
git add apps/backend/src/modules/models/models.service.ts
git commit -m "refactor(be): raw SQL de ModelsService compatible con MariaDB (VARCHAR + split UPDATE)"
```

---

## Tarea 6: Reescribir raw SQL en `versions.service.ts` (create + update)

**Cambios respecto al plan original:**
- Enums son `String` (VARCHAR) en schema — sin cast especial.
- `UPDATE` no soporta `RETURNING` en MariaDB → split en UPDATE + SELECT.

**Files:**
- Modify: `apps/backend/src/modules/versions/versions.service.ts:121-166` (create)
- Modify: `apps/backend/src/modules/versions/versions.service.ts:188-275` (update → split)

**Interfaces:**
- Consumes: `extendEnum` no-op (Tarea 4)
- Produces: `VersionsService.create()` y `VersionsService.update()` ejecutan SQL MariaDB-compatible.

- [ ] **Paso 1: Reemplazar el INSERT raw en `create()` (líneas 121-166)**

Reemplazar desde `const id = randomUUID();` (línea 121) hasta el cierre del bloque (línea 166, antes del `}` de la función) por:

```ts
    const id = randomUUID();
    // SCHEMA-DRIFT NOTE: raw SQL is required porque extendEnum agrega un
    // valor nuevo al enum runtime y Prisma's query engine lo rechazaría.
    // MariaDB uses `?` placeholders (not `$N`), VARCHAR columns (no enum
    // cast needed), backtick-quoted identifiers.
    const rows = await this.prisma.$queryRawUnsafe<VersionRow[]>(
      `INSERT INTO \`Version\` (
         id, \`modelId\`, name, year, \`priceClp\`, transmission, fuel,
         \`engineDisplacementCc\`, \`powerHp\`, \`torqueNm\`, \`consumptionCityKmL\`,
         \`consumptionHighwayKmL\`, \`lengthMm\`, \`widthMm\`, \`heightMm\`, \`weightKg\`,
         \`trunkLiters\`, \`airbagCount\`, \`hasAbs\`, \`hasEsp\`, \`hasCruiseControl\`,
         \`deletedAt\`, \`createdAt\`
       )
       VALUES (
         ?, ?, ?, ?, ?, ?, ?,
         ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?,
         NULL, NOW()
       )
       RETURNING ${VERSION_RETURNING}`,
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
    );
    return rows[0]!;
```

- [ ] **Paso 2: Reemplazar el UPDATE raw en `update()` (líneas 188-275)**

Split en UPDATE + SELECT (MariaDB no soporta `UPDATE ... RETURNING`).

Reemplazar todo el bloque desde `const setClauses: string[] = [];` (línea 188) hasta el `return rows[0]!;` (línea 275) por:

```ts
      const setClauses: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        setClauses.push("name = ?");
        values.push(input.name);
      }
      if (input.year !== undefined) {
        setClauses.push("year = ?");
        values.push(input.year);
      }
      if (input.priceClp !== undefined) {
        setClauses.push("`priceClp` = ?");
        values.push(input.priceClp);
      }
      if (input.transmission !== undefined) {
        setClauses.push("transmission = ?");
        values.push(input.transmission);
      }
      if (input.fuel !== undefined) {
        setClauses.push("fuel = ?");
        values.push(input.fuel);
      }
      if (input.engineDisplacementCc !== undefined) {
        setClauses.push("`engineDisplacementCc` = ?");
        values.push(input.engineDisplacementCc);
      }
      if (input.powerHp !== undefined) {
        setClauses.push("`powerHp` = ?");
        values.push(input.powerHp);
      }
      if (input.torqueNm !== undefined) {
        setClauses.push("`torqueNm` = ?");
        values.push(input.torqueNm);
      }
      if (input.consumptionCityKmL !== undefined) {
        setClauses.push("`consumptionCityKmL` = ?");
        values.push(input.consumptionCityKmL);
      }
      if (input.consumptionHighwayKmL !== undefined) {
        setClauses.push("`consumptionHighwayKmL` = ?");
        values.push(input.consumptionHighwayKmL);
      }
      if (input.lengthMm !== undefined) {
        setClauses.push("`lengthMm` = ?");
        values.push(input.lengthMm);
      }
      if (input.widthMm !== undefined) {
        setClauses.push("`widthMm` = ?");
        values.push(input.widthMm);
      }
      if (input.heightMm !== undefined) {
        setClauses.push("`heightMm` = ?");
        values.push(input.heightMm);
      }
      if (input.weightKg !== undefined) {
        setClauses.push("`weightKg` = ?");
        values.push(input.weightKg);
      }
      if (input.trunkLiters !== undefined) {
        setClauses.push("`trunkLiters` = ?");
        values.push(input.trunkLiters);
      }
      if (input.airbagCount !== undefined) {
        setClauses.push("`airbagCount` = ?");
        values.push(input.airbagCount);
      }
      if (input.hasAbs !== undefined) {
        setClauses.push("`hasAbs` = ?");
        values.push(input.hasAbs);
      }
      if (input.hasEsp !== undefined) {
        setClauses.push("`hasEsp` = ?");
        values.push(input.hasEsp);
      }
      if (input.hasCruiseControl !== undefined) {
        setClauses.push("`hasCruiseControl` = ?");
        values.push(input.hasCruiseControl);
      }
      values.push(id);
      // SCHEMA-DRIFT NOTE: raw UPDATE porque extendEnum agrega un valor
      // nuevo al enum runtime. En MariaDB no hay RETURNING para UPDATE,
      // así que hacemos SELECT después para devolver la fila actualizada.
      const updateResult = await this.prisma.$executeRawUnsafe(
        `UPDATE \`Version\` SET ${setClauses.join(", ")} WHERE id = ? AND \`deletedAt\` IS NULL`,
        ...values,
      );
      if (updateResult === 0) throw notFound("Versión no encontrada");
      const rows = await this.prisma.$queryRawUnsafe<VersionRow[]>(
        `SELECT ${VERSION_RETURNING} FROM \`Version\` WHERE id = ? AND \`deletedAt\` IS NULL`,
        id,
      );
      return rows[0]!;
```

- [ ] **Paso 3: Correr typecheck**

```bash
cd apps/backend && pnpm exec tsc --noEmit
```

Esperado: 5 errores restantes (los de `mode: insensitive` y `favorites.service.ts`).

- [ ] **Paso 4: Correr tests del módulo**

```bash
pnpm test src/modules/versions
```

Esperado: pasan todos.

- [ ] **Paso 5: Commit**

```bash
git add apps/backend/src/modules/versions/versions.service.ts
git commit -m "refactor(be): raw SQL de VersionsService compatible con MariaDB (VARCHAR + split UPDATE)"
```

---

## Tarea 7: Aplicar `toGalleryUrls` en lecturas Prisma y remover `mode: "insensitive"`

**Files:**
- Modify: `apps/backend/src/modules/models/models.service.ts:19-20, 95-96` (filtros y `list()`)
- Modify: `apps/backend/src/modules/favorites/favorites.service.ts:147` (`toCard()`)

**Interfaces:**
- Consumes: `toGalleryUrls` (Tarea 3)
- Produces: `list()` y `listModels()` devuelven `galleryUrls: string[]` siempre; filtros de búsqueda sin `mode: "insensitive"`.

- [ ] **Paso 1: En `models.service.ts:19-20`, remover `mode: "insensitive"`**

Cambiar:

```ts
          { name: { contains: term, mode: "insensitive" } },
          { brand: { name: { contains: term, mode: "insensitive" } } },
```

Por:

```ts
          { name: { contains: term } },
          { brand: { name: { contains: term } } },
```

(En MariaDB con collation `utf8mb4_unicode_ci` el `LIKE` ya es case-insensitive por defecto.)

- [ ] **Paso 2: En `models.service.ts:95-96`, usar `toGalleryUrls`**

Cambiar:

```ts
        imageUrl: m.imageUrl ?? m.galleryUrls[0] ?? null,
        galleryUrls: m.galleryUrls, brand: m.brand,
```

Por:

```ts
        galleryUrls: toGalleryUrls(m.galleryUrls),
        imageUrl: m.imageUrl ?? toGalleryUrls(m.galleryUrls)[0] ?? null,
        brand: m.brand,
```

Nota: se calcula `galleryUrls` una vez y se reutiliza para el fallback de `imageUrl`.

- [ ] **Paso 3: En `favorites.service.ts:147`, usar `toGalleryUrls`**

Agregar import al inicio:

```ts
import { toGalleryUrls } from "../../shared/json.js";
```

Cambiar línea 147:

```ts
      imageUrl: m.imageUrl ?? m.galleryUrls[0] ?? null,
```

Por:

```ts
      imageUrl: m.imageUrl ?? toGalleryUrls(m.galleryUrls)[0] ?? null,
```

- [ ] **Paso 4: Actualizar la firma del parámetro `m` en `toCard()` (línea 119)**

Cambiar `galleryUrls: string[];` por `galleryUrls: Prisma.JsonValue;`. Si no tienes import de `Prisma`, agregarlo:

```ts
import { Prisma } from "@prisma/client";
```

- [ ] **Paso 5: Correr typecheck**

```bash
cd apps/backend && pnpm exec tsc --noEmit
```

Esperado: sin errores.

- [ ] **Paso 6: Commit**

```bash
git add apps/backend/src/modules/models/models.service.ts apps/backend/src/modules/favorites/favorites.service.ts
git commit -m "refactor(be): aplicar toGalleryUrls en lecturas y quitar mode insensitive"
```

---

## Tarea 8: Ajustar fixtures de tests que usan galleryUrls

**Files:**
- Modify: `apps/backend/src/modules/models/models.service.spec.ts` (líneas 23-30, 36-43, 50-56, 67-72, 111-117)
- Modify: `apps/backend/src/modules/favorites/favorites.service.spec.ts` (líneas 67-73, 82-85)

**Interfaces:**
- Consumes: spec files existentes
- Produces: tests pasan contra MariaDB sin asumir `galleryUrls` como `string[]` literal en la respuesta Prisma cruda.

- [ ] **Paso 1: Confirmar que Prisma acepta array literal en `data.galleryUrls`**

Prisma serializa arrays a JSON automáticamente al insertar en un campo `Json`. No hace falta cambiar la sintaxis de los fixtures; basta con que `toGalleryUrls` (Tarea 7) normalice lo que Prisma devuelve al leer.

No aplicar este paso si los tests pasan. Si Prisma se queja del tipo, saltar a la alternativa del Paso 2.

- [ ] **Paso 2 (alternativa): Si Prisma no acepta array literal, serializar en fixtures**

Solo aplicar si Paso 1 falla con error de tipo en `galleryUrls: [...]`.

En `models.service.spec.ts` líneas 28, 42, 55, 71, 116, reemplazar `galleryUrls: [...]` por `galleryUrls: JSON.stringify([...])`.

En `favorites.service.spec.ts` líneas 71 y 84, mismo tratamiento.

- [ ] **Paso 3: Correr tests de models**

```bash
cd apps/backend && pnpm test src/modules/models/models.service.spec.ts
```

Esperado: pasan todos.

- [ ] **Paso 4: Correr tests de favorites**

```bash
pnpm test src/modules/favorites/favorites.service.spec.ts
```

Esperado: pasan todos.

- [ ] **Paso 5: Commit**

```bash
git add apps/backend/src/modules/models/models.service.spec.ts apps/backend/src/modules/favorites/favorites.service.spec.ts
git commit -m "test(be): verificar round-trip de galleryUrls con columna Json"
```

Si no hubo cambios en los archivos, saltarse el commit.

---

## Tarea 9: Eliminar `@electric-sql/pglite` de devDependencies

**Files:**
- Modify: `apps/backend/package.json` (devDependencies)

**Interfaces:**
- Consumes: nothing
- Produces: `package.json` sin `@electric-sql/pglite`. `pnpm install` lo desinstala.

- [ ] **Paso 1: Editar `apps/backend/package.json`**

Localizar la línea:

```json
    "@electric-sql/pglite": "^0.2.0",
```

Borrarla (incluyendo la coma final si corresponde).

- [ ] **Paso 2: Eliminarlo del lockfile**

```bash
cd apps/backend && pnpm remove @electric-sql/pglite
```

Esperado: elimina del package.json y del pnpm-lock.yaml.

- [ ] **Paso 3: Commit**

```bash
git add apps/backend/package.json pnpm-lock.yaml
git commit -m "chore(be): remover @electric-sql/pglite (no se usa)"
```

---

## Tarea 10: Verificación end-to-end

**Files:**
- Modify: `docs/setup.md` o crear si no existe
- Modify: `README.md` raíz si menciona PostgreSQL
- Modify: `apps/backend/prisma/migrations/README.md` si menciona PostgreSQL

**Interfaces:**
- Consumes: todo lo construido en Tareas 1-9
- Produces: suite completa verde contra MariaDB, docs actualizados.

- [ ] **Paso 1: Correr suite completa de tests**

```bash
pnpm test
```

Esperado: todos los tests pasan. Si alguno falla, volver a la tarea correspondiente y resolver.

- [ ] **Paso 2: Correr seed y verificar que puebla datos**

```bash
cd apps/backend && pnpm db:reset
```

Esperado: crea las tablas, aplica migración, ejecuta seed sin errores.

- [ ] **Paso 3: Smoke test manual de Models**

Levantar backend:

```bash
pnpm dev:be
```

En otra terminal:

```bash
curl -s -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -d '{"brandId":"<id>","name":"Smoke Test","segment":"SEDAN","galleryUrls":["/uploads/a.jpg","/uploads/b.jpg"]}'
```

Esperado: 201 con `galleryUrls: ["/uploads/a.jpg","/uploads/b.jpg"]` en la respuesta.

```bash
curl -s http://localhost:3000/api/models | jq '.items[0].galleryUrls'
```

Esperado: array JSON con los URLs.

- [ ] **Paso 4: Verificar que `prisma migrate deploy` funciona (simulando producción)**

Resetear DB:

```bash
docker exec cualautocompro-db mariadb -ucualauto -pcualauto \
  -e "DROP DATABASE cualautocompro;"
docker exec cualautocompro-db mariadb -ucualauto -pcualauto \
  -e "CREATE DATABASE cualautocompro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Aplicar migraciones:

```bash
cd apps/backend && pnpm exec prisma migrate deploy
```

Esperado: aplica la migración init sin errores.

- [ ] **Paso 5: Actualizar `docs/setup.md` (crear si no existe)**

Crear o actualizar `docs/setup.md` con sección "Base de datos":

```markdown
## Base de datos

Este proyecto usa **MariaDB 10.5+** con Prisma ORM.

### Opción A: Docker (recomendado)

```bash
docker run -d --name cualautocompro-db \
  -e MARIADB_ROOT_PASSWORD=rootpass \
  -e MARIADB_DATABASE=cualautocompro \
  -e MARIADB_USER=cualauto \
  -e MARIADB_PASSWORD=cualauto \
  -p 3306:3306 \
  mariadb:11
```

### Opción B: Instalación local

- macOS: `brew install mariadb && brew services start mariadb`
- Ubuntu: `sudo apt install mariadb-server && sudo systemctl start mariadb`

### Crear las bases de datos

```sql
CREATE DATABASE cualautocompro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Variables de entorno

Copiar `.env.example` a `.env` y ajustar `DATABASE_URL`:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro?charset=utf8mb4
```

### Importante: charset utf8mb4

MariaDB debe usar `utf8mb4` para soportar emojis y caracteres Unicode completos. Esto se aplica tanto en la URL de conexión como en el `CREATE DATABASE`.
```

- [ ] **Paso 6: Commit final**

```bash
git add docs/setup.md README.md apps/backend/prisma/migrations/README.md
git commit -m "docs(be): actualizar setup a MariaDB 10.5+ con utf8mb4"
```

---

## Verificación final de criterios de aceptación

Después de la Tarea 10, verificar:

- [ ] `pnpm test` pasa contra MariaDB local.
- [ ] `pnpm db:migrate` aplica la nueva migración sin errores.
- [ ] `pnpm db:seed` puebla datos correctamente.
- [ ] `pnpm dev:be` arranca sin errores de conexión.
- [ ] Smoke test: `POST /api/models` con `galleryUrls` se persiste y se lee como array.
- [ ] `GET /api/models` devuelve `galleryUrls` como `string[]`.
- [ ] Admin puede crear Model/Version con valores de enum "extendidos" sin errores en runtime.
- [ ] No hay referencias a `pglite`, `pg_enum`, `pg_type`, `::"Enum"` o `::text[]` en el código:

```bash
cd apps/backend
grep -rn "pglite\|pg_enum\|pg_type\|::\"[A-Z]\|::text\[\]" src/ --include="*.ts" || echo "OK - sin referencias Postgres"
```

Esperado: `OK - sin referencias Postgres`.