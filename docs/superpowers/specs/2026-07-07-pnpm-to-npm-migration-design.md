# Migración pnpm → npm

**Fecha:** 2026-07-07
**Estado:** Aprobado
**Proyecto:** cualautocompro (monorepo Angular 22 + Node.js/Express + Prisma + MariaDB)

## 1. Contexto y motivación

El proyecto está configurado como monorepo con `workspaces: ["apps/*"]` en el `package.json` raíz, pero declara `pnpm@10.34.4` como package manager y tiene `pnpm-workspace.yaml` + `pnpm-lock.yaml` (294 KB). La guía de despliegue (`docs/guia-despliegue-cpanel.pdf`) enseña paso a paso el flujo con pnpm.

El equipo quiere unificar el stack en npm para simplificar el setup local, evitar instalar pnpm global y estandarizar el deploy en hostings cPanel que ya tienen npm por defecto.

## 2. Alcance

### 2.1 Lo que cambia

- **Config raíz:** `package.json` (quitar `packageManager: pnpm@10.34.4`), eliminar `pnpm-workspace.yaml`, eliminar `pnpm-lock.yaml`, generar `package-lock.json`.
- **Frontend config:** `apps/frontend/package.json` (quitar `packageManager`), `apps/frontend/angular.json` (`"packageManager": "npm"`).
- **Scripts deploy backend:** reescribir `postinstall.cjs`, `vendor-prisma.cjs`, `prepare-ftp-bundle.cjs`.
- **Tests:** `apps/backend/__tests__/helpers/db.ts` (`pnpm exec` → `npx`).
- **Vendor Prisma:** regenerar `apps/backend/vendor/prisma-client/` borrando paths `.pnpm/...` hardcoded.
- **Docs:** `docs/setup.md`, `apps/backend/prisma/migrations/README.md`, `apps/backend/prisma/seed.ts` (comentario), `docs/generate_pdf.py` (script), `docs/guia-despliegue-cpanel.pdf` (regenerado).
- **Specs/plans históricos:** reemplazar `pnpm` por `npm` en `docs/superpowers/specs/*.md` y `docs/superpowers/plans/*.md`.

### 2.2 Lo que NO cambia

- Runtime (CORS, JWT, Prisma, lógica de negocio).
- `apps/backend/src/**`, `apps/frontend/src/**`.
- `.superpowers/sdd/*` (historial de diffs congelado).
- `.gitignore` (mantiene `pnpm-debug.log*` por defensa, no estorba).

## 3. Diseño de los cambios

### 3.1 Configs

- `package.json` (raíz): eliminar `"packageManager": "pnpm@10.34.4"`. Mantener `"workspaces": ["apps/*"]` (sintaxis npm válida).
- `apps/frontend/package.json`: eliminar `"packageManager": "pnpm@10.34.4"`.
- `apps/frontend/angular.json`: `"cli": { "packageManager": "npm" }`.
- `pnpm-workspace.yaml`: archivo borrado.
- `pnpm-lock.yaml`: archivo borrado.
- `package-lock.json`: generado por `npm install` en raíz.

### 3.2 Scripts backend

#### `apps/backend/scripts/postinstall.cjs`
- Mensajes al usuario: `pnpm install` → `npm install`, `pnpm exec prisma generate` → `npx prisma generate`, `pnpm run vendor:prisma` → `npm run vendor:prisma`.
- `findPrismaClientTargetDir()`: ya soporta ambos layouts; **simplificar** eliminando la rama pnpm (`require.resolve` con `paths: [APP_ROOT]` basta para npm workspace hoisted).
- Comentarios del header: actualizados.

#### `apps/backend/scripts/vendor-prisma.cjs`
- `resolveSourceDir()`: eliminar el caso 2 (pnpm layout); solo queda el caso 1 (npm layout).
- Mensajes de error: `pnpm install` → `npm install`, etc.

#### `apps/backend/scripts/prepare-ftp-bundle.cjs`
- `lockfileCandidates`: eliminar las dos rutas que apuntaban a `pnpm-lock.yaml`.
- `rootLockfile`: apuntar a `package-lock.json` y copiarlo al bundle.
- `README-DEPLOY.md` embebido: reescrito completamente. Ya no menciona `pnpm install`, ahora `npm ci --omit=dev --ignore-scripts`.
- Checks pre-flight: mensajes cambiados (`pnpm build` → `npm run build`, etc.).

#### `apps/backend/__tests__/helpers/db.ts`
- Línea 8: `execSync("pnpm exec prisma migrate deploy", ...)` → `execSync("npx prisma migrate deploy", ...)`.

#### `apps/backend/prisma/seed.ts`
- Comentario línea 13: `pnpm db:reset` → `npm run db:reset`.

### 3.3 Regeneración del vendor Prisma

Pasos locales (una sola vez, en máquina con RAM suficiente):
1. `npm install` (regenera `node_modules/`).
2. `npx prisma generate` (genera cliente Prisma en `node_modules/.prisma/client/`).
3. `npm run vendor:prisma -w apps/backend` (copia a `apps/backend/vendor/prisma-client/`).
4. `git add apps/backend/vendor/ && git commit`.

Tras esto, `rg '\.pnpm' apps/backend/vendor/prisma-client/` debe estar vacío.

### 3.4 Documentación

#### `docs/setup.md` (167 líneas)
Reemplazar las 17 referencias a `pnpm` por `npm`:
- Requisitos: `pnpm 10+` → `npm 10+`.
- Backend: `pnpm install` → `npm install`, `pnpm db:reset` → `npm run db:reset`, `pnpm dev:be` → `npm run dev:be`.
- Frontend: `pnpm dev:fe` → `npm run dev:fe`.
- Tests: `pnpm test` → `npm test`, etc.
- Migraciones: `pnpm db:migrate` → `npm run db:migrate`, `pnpm exec prisma migrate deploy` → `npx prisma migrate deploy`.
- Reset: `pnpm db:migrate` → `npm run db:migrate`.

#### `apps/backend/prisma/migrations/README.md` (20 líneas)
- `pnpm exec prisma migrate deploy` → `npx prisma migrate deploy`.
- `pnpm db:migrate` → `npm run db:migrate`.

#### `docs/generate_pdf.py` (1255 líneas)
Reescritura sistemática de strings hardcoded:
- Portada: "Monorepo - pnpm workspaces" → "Monorepo - npm workspaces".
- Requisitos cliente: "pnpm 10+" → "npm 10+".
- Paso 3 (preparación local): todos los `pnpm install`, `pnpm --filter`, `pnpm exec` reemplazados.
- Paso 5.2 (instalar en server): mensaje entero reescrito; ya no aparece "use pnpm" ni "instale pnpm primero". Ahora: "use `npm ci --omit=dev --ignore-scripts`".
- Paso 5.2.bis (workflow Git): `pnpm install` → `npm install`, `pnpm exec prisma generate` → `npx prisma generate`, etc.
- Paso 5.2.ter (workflow FTP/bundle): idem; `pnpm-lock.yaml` → `package-lock.json`.
- Tabla comparativa Git vs FTP: "pnpm install --prod" → "npm ci --omit=dev".
- Paso 6 (frontend): todos los comandos de build.
- Paso 8 (migraciones y seed): mensajes al usuario.
- Paso 11 (troubleshooting): el caso OOM cambia "...durante pnpm install" → "...durante npm install".

Tras editar, regenerar PDF: `python3 docs/generate_pdf.py`.

#### Specs/plans históricos
Reemplazo mecánico en `docs/superpowers/specs/*.md` y `docs/superpowers/plans/*.md`:
- `pnpm install` → `npm install`
- `pnpm exec ` → `npx `
- `pnpm run X` → `npm run X`
- `pnpm db:X` → `npm run db:X`
- `pnpm --filter X` → `npm -w X`
- `pnpm dev:be/fe/test` → `npm run dev:be/fe/test`
- `pnpm-lock.yaml` → `package-lock.json`
- "este proyecto usa pnpm" → "este proyecto usa npm"

Excluir `.superpowers/sdd/`.

## 4. Orden de ejecución

1. Pre-checks: `npm ls --depth=0`.
2. Editar configs raíz.
3. Borrar `pnpm-lock.yaml` y `node_modules/`.
4. `npm install` en raíz → `package-lock.json`.
5. Editar scripts backend.
6. `npm install` de nuevo → valida postinstall en local.
7. `npm run vendor:prisma -w apps/backend`.
8. Editar docs (`setup.md`, README migraciones, comentario seed.ts).
9. Editar `docs/generate_pdf.py` y regenerar PDF.
10. Migrar specs/plans históricos.
11. Commit único + push (previa confirmación explícita).

## 5. Criterios de aceptación

| # | Check | Comando |
|---|---|---|
| 1 | No quedan refs a `pnpm` en código/configs | `rg -n 'pnpm' apps/ package.json apps/*/package.json apps/*/angular.json` → solo `.gitignore` |
| 2 | No quedan refs a `pnpm` en scripts backend | `rg -n 'pnpm' apps/backend/scripts/ apps/backend/__tests__/` → vacío |
| 3 | No quedan refs a `pnpm` en docs de setup/migraciones/PDF-script | `rg -n 'pnpm' docs/setup.md apps/backend/prisma/migrations/README.md docs/generate_pdf.py` → vacío |
| 4 | No quedan refs a `pnpm` en specs/plans | `rg -n 'pnpm' docs/superpowers/specs/ docs/superpowers/plans/` → vacío |
| 5 | PDF regenerado no contiene "pnpm" | `rg -a 'pnpm' docs/guia-despliegue-cpanel.pdf` → vacío |
| 6 | `package-lock.json` existe, `pnpm-lock.yaml` no | `ls package-lock.json pnpm-lock.yaml` |
| 7 | `npm install` corre limpio | exit 0 |
| 8 | Vendor regenerado sin paths `.pnpm/` | `rg '\.pnpm' apps/backend/vendor/prisma-client/` → vacío |
| 9 | Tests backend pasan | `npm run test:be` |
| 10 | Tests frontend pasan | `npm run test:fe` |
| 11 | E2E tests (Playwright) | `npm run test:e2e` |
| 12 | Build backend | `npm run build -w apps/backend` |
| 13 | Build frontend | `npm run build -w apps/frontend` |
| 14 | Bundle FTP generado | `npm run bundle:ftp -w apps/backend`; tarball contiene `package-lock.json`, no `pnpm-lock.yaml` |
| 15 | Backend arranca | `node dist/src/index.js`; `GET /health` ok |

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `npm install` resuelve versiones distintas y rompe algo | Diff de `npm ls` vs estructura actual; rebuild + test full |
| Vendor regenerado cambia binarios si hay drift de versiones Prisma | Verificar `binaryTargets` en `schema.prisma` antes; commit atómico |
| PDF regenerado cambia paginación | Aceptable; el contenido es lo que importa |
| Specs históricos pierden contexto temporal | Aceptable: el comando actual es lo que se ejecutará hoy |

## 7. Fuera de alcance

- Migración a yarn, bun u otro package manager.
- Actualización de versiones de dependencias.
- Cambios de lógica de runtime.
- Modificación de `apps/backend/src/**` o `apps/frontend/src/**`.
- Creación de PR / push sin confirmación explícita.
