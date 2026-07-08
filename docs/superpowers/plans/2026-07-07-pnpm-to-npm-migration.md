# Migración pnpm → npm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el monorepo `cualautocompro` de pnpm a npm: configs raíz, scripts de deploy del backend, vendor Prisma, docs (incluida la guía PDF), y specs/plans históricos. Un solo commit cohesivo que deja el repo funcionando igual pero con npm.

**Architecture:** Migración atómica en una sola rama. El orden es deliberado para que ningún paso intermedio deje el repo roto: (a) configs y lockfile, (b) scripts backend coherentes con npm, (c) vendor Prisma regenerado (artefacto binario), (d) docs y PDF, (e) specs/plans históricos. Cada tarea es independientemente verificable.

**Tech Stack:** npm 10+, Node 20, Angular 22, Prisma 5.22, MariaDB 10.5+, reportlab (Python).

## Global Constraints

- Node.js 20+ (definido en `.nvmrc`).
- npm 10+ (viene con Node 20).
- Mantener `"workspaces": ["apps/*"]` en `package.json` raíz — esa sintaxis es válida para npm.
- El vendor Prisma (`apps/backend/vendor/prisma-client/`) sigue commiteado a git tras regenerarse.
- `apps/backend/scripts/postinstall.cjs` sigue detectando LVE / poca RAM — solo cambia el gestor que invocamos.
- `apps/backend/scripts/prepare-ftp-bundle.cjs` sigue generando tarball FTP autocontenido.
- `.gitignore` mantiene `pnpm-debug.log*` por defensa (innecesario pero no estorba).
- Cero cambios en `apps/backend/src/**` y `apps/frontend/src/**`.
- Cero cambios en `.superpowers/sdd/`.

---

### Task 1: Pre-checks y estado limpio

**Files:**
- Read: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `apps/backend/package.json`, `apps/frontend/package.json`, `apps/frontend/angular.json`

- [ ] **Step 1: Confirmar baseline antes de tocar nada**

```bash
git status
# Esperado: working tree clean o solo commits ahead de main sin cambios sin commitear
```

- [ ] **Step 2: Snapshot de las versiones actuales (para comparar después)**

```bash
cat package.json | grep -E '"name"|"version"|"packageManager"'
cat apps/backend/package.json | grep -E '"name"|"version"|"packageManager"'
cat apps/frontend/package.json | grep -E '"name"|"version"|"packageManager"'
cat apps/frontend/angular.json | grep -A1 '"cli"'
ls pnpm-lock.yaml pnpm-workspace.yaml 2>&1
# Esperado: packageManager: pnpm@10.34.4 en raíz y frontend; "packageManager": "pnpm" en angular.json
```

- [ ] **Step 3: Commit**

No hay cambios; continuar.

---

### Task 2: Editar configs raíz (sin `pnpm-lock` todavía)

**Files:**
- Modify: `package.json` (raíz)
- Modify: `apps/frontend/package.json`
- Modify: `apps/frontend/angular.json`

- [ ] **Step 1: Editar `package.json` raíz — quitar `packageManager`**

Eliminar la línea completa (incluyendo coma final si hace falta):

```json
  "packageManager": "pnpm@10.34.4"
```

Resultado esperado en `package.json`:

```json
{
  "name": "cualautocompro",
  "private": true,
  "version": "0.1.0",
  "workspaces": [
    "apps/*"
  ],
  "scripts": { ... },
  "devDependencies": {
    "npm-run-all": "^4.1.5"
  }
}
```

- [ ] **Step 2: Editar `apps/frontend/package.json` — quitar `packageManager`**

Eliminar la línea:

```json
  "packageManager": "pnpm@10.34.4",
```

- [ ] **Step 3: Editar `apps/frontend/angular.json` — cambiar `packageManager`**

En el bloque `"cli"`, cambiar `"packageManager": "pnpm"` por `"packageManager": "npm"`.

- [ ] **Step 4: Verificar que no quedan refs a `pnpm` en configs**

```bash
rg -n 'pnpm' package.json apps/*/package.json apps/*/angular.json
# Esperado: 0 resultados en estos 4 archivos
```

- [ ] **Step 5: Commit checkpoint**

```bash
git add package.json apps/frontend/package.json apps/frontend/angular.json
git commit -m "chore: quitar pnpm de configs raíz (paso 1/3)"
```

---

### Task 3: Borrar `pnpm-lock.yaml` y `pnpm-workspace.yaml`, regenerar con `npm install`

**Files:**
- Delete: `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Delete: `node_modules/`, `apps/backend/node_modules/`, `apps/frontend/node_modules/`, `apps/backend/vendor/prisma-client/` (regenerar)
- Create: `package-lock.json` (generado por npm)

- [ ] **Step 1: Borrar artefactos pnpm**

```bash
rm -f pnpm-lock.yaml pnpm-workspace.yaml
```

- [ ] **Step 2: Borrar node_modules y vendor Prisma viejo (paths pnpm-hardcoded)**

```bash
rm -rf node_modules
rm -rf apps/backend/node_modules
rm -rf apps/frontend/node_modules
rm -rf apps/backend/vendor/prisma-client
ls apps/backend/vendor/
# Esperado: solo archivos del repo (.gitkeep si existe)
```

- [ ] **Step 3: `npm install` desde raíz**

```bash
npm install
# Esperado: exit 0; "added N packages"; genera package-lock.json
ls package-lock.json
```

- [ ] **Step 4: Verificar que `pnpm-lock.yaml` sigue sin existir**

```bash
ls pnpm-lock.yaml 2>&1
# Esperado: "No such file or directory"
```

- [ ] **Step 5: Verificar estructura npm workspace**

```bash
ls node_modules/@prisma/client node_modules/.bin/prisma 2>&1
ls apps/backend/node_modules 2>&1 || echo "OK - hoisted a raíz"
# En npm workspaces normalmente todo va a la raíz; apps/* no tienen su propio node_modules.
```

- [ ] **Step 6: Commit checkpoint**

```bash
git add package-lock.json
git add -u
git status
# Esperado: solo package-lock.json y elimación de pnpm-lock.yaml/pnpm-workspace.yaml
git commit -m "chore: lockfile pnpm→npm (paso 2/3)"
```

---

### Task 4: Reescribir `apps/backend/scripts/postinstall.cjs`

**Files:**
- Modify: `apps/backend/scripts/postinstall.cjs`

- [ ] **Step 1: Reemplazar el comentario del header (líneas 28-31)**

Buscar:

```
//   1. Local: pnpm install && pnpm exec prisma generate
//   2. Local: pnpm run vendor:prisma
//   3. Local: git add apps/backend/vendor/ && git commit && git push
```

Reemplazar por:

```
//   1. Local: npm install && npx prisma generate
//   2. Local: npm run vendor:prisma -w apps/backend
//   3. Local: git add apps/backend/vendor/ && git commit && git push
```

- [ ] **Step 2: Reemplazar comentarios explicativos (líneas 99-101 y 126)**

Buscar:

```
  // Funciona tanto con npm como con pnpm:
  //   npm:  .../node_modules/@prisma/client/index.js
  //   pnpm: .../node_modules/.pnpm/@prisma+client@5.22.0_.../node_modules/@prisma/client/index.js
```

Reemplazar por:

```
  // Ubicacion esperada del cliente Prisma en npm workspace (hoisted a raíz):
  //   .../node_modules/@prisma/client/index.js
```

Buscar:

```
  // Resolver symlinks para llegar al directorio real dentro de .pnpm/.
```

Reemplazar por:

```
  // Resolver symlinks para llegar al directorio real del cliente Prisma.
```

- [ ] **Step 3: Simplificar `findPrismaClientTargetDir()`**

Reemplazar toda la función por esta versión simplificada (sin la lógica de fallback pnpm y sin `realpath`, porque en npm layout no hay symlinks a resolver en este punto):

```js
function findPrismaClientTargetDir() {
  // Ubicacion esperada en npm workspaces (hoisted a raiz del monorepo):
  //   <repo-root>/node_modules/@prisma/client/
  //   <repo-root>/node_modules/.prisma/client/
  const candidates = [
    path.join(APP_ROOT, "node_modules", "@prisma", "client"),
    path.join(APP_ROOT, "..", "..", "node_modules", "@prisma", "client"),
    path.join(APP_ROOT, "..", "node_modules", "@prisma", "client"),
  ];

  let resolved;
  try {
    resolved = require.resolve("@prisma/client", { paths: [APP_ROOT] });
  } catch {
    for (const c of candidates) {
      const indexFile = path.join(c, "index.js");
      if (fs.existsSync(indexFile)) {
        resolved = indexFile;
        break;
      }
    }
  }
  if (!resolved) {
    throw new Error("@prisma/client no encontrado en " + APP_ROOT);
  }

  // En npm workspace sin hoisting falla, .prisma/client queda junto a @prisma/client.
  const prismaClientDir = path.dirname(resolved); // .../@prisma/client
  const nodeModulesDir = path.dirname(prismaClientDir); // .../node_modules
  return path.join(nodeModulesDir, ".prisma", "client");
}
```

- [ ] **Step 4: Reemplazar mensajes al usuario (líneas 162-170)**

Buscar:

```
    console.log("[postinstall]      pnpm install");
    console.log("[postinstall]      pnpm exec prisma generate");
    console.log("[postinstall]      pnpm run vendor:prisma");
```

Reemplazar por:

```
    console.log("[postinstall]      npm install");
    console.log("[postinstall]      npx prisma generate");
    console.log("[postinstall]      npm run vendor:prisma -w apps/backend");
```

Buscar:

```
    "[postinstall]   2. Volver a correr 'pnpm install' (o 'npm ci') en el server."
```

Reemplazar por:

```
    "[postinstall]   2. Volver a correr 'npm ci' en el server."
```

- [ ] **Step 5: Verificar 0 referencias pnpm en el archivo**

```bash
rg -n 'pnpm' apps/backend/scripts/postinstall.cjs
# Esperado: 0 resultados
```

---

### Task 5: Reescribir `apps/backend/scripts/vendor-prisma.cjs`

**Files:**
- Modify: `apps/backend/scripts/vendor-prisma.cjs`

- [ ] **Step 1: Reemplazar comentarios del header (líneas 52, 56-57)**

Buscar:

```
  // Caso 1: npm layout (apps/backend/node_modules/.prisma/client/)
  if (fs.existsSync(path.join(SOURCE_DIR, "index.js"))) {
    return SOURCE_DIR;
  }
  // Caso 2: pnpm layout (node_modules/.pnpm/.../node_modules/.prisma/client/)
  // Lo localizamos via require.resolve + realpath.
  try {
    const resolved = require.resolve("@prisma/client", { paths: [APP_ROOT] });
    const realPath = fs.realpathSync(resolved);
    const prismaClientDir = path.dirname(realPath); // .../@prisma/client
    // Subir dos niveles: .../@prisma/client -> .../@prisma -> .../node_modules
    const nodeModulesDir = path.dirname(path.dirname(prismaClientDir));
    const pnpmSourceDir = path.join(nodeModulesDir, ".prisma", "client");
    if (fs.existsSync(path.join(pnpmSourceDir, "index.js"))) {
      return pnpmSourceDir;
    }
  } catch {
    // ignore
  }
  return null;
}
```

Reemplazar por (solo caso npm):

```
  // Layout npm workspace (hoisted a raiz del monorepo):
  //   <repo-root>/node_modules/.prisma/client/
  return SOURCE_DIR;
}
```

(Y devolver `SOURCE_DIR` directamente si existe; si no, `null`. Refactorizar a:)

```js
function resolveSourceDir() {
  // Layout npm workspace (hoisted a raiz del monorepo):
  //   <repo-root>/node_modules/.prisma/client/
  return fs.existsSync(path.join(SOURCE_DIR, "index.js")) ? SOURCE_DIR : null;
}
```

- [ ] **Step 2: Reemplazar mensajes de error (líneas 79-85)**

Buscar:

```
  console.error(
    "[vendor]   y en layouts pnpm (node_modules/.pnpm/.../node_modules/.prisma/client/)"
  );
  console.error("[vendor]");
  console.error("[vendor] Pasos:");
  console.error("[vendor]   1. pnpm install");
  console.error("[vendor]   2. pnpm exec prisma generate");
  console.error("[vendor]   3. pnpm run vendor:prisma");
```

Reemplazar por:

```
  console.error(
    "[vendor]   esperado en apps/backend/node_modules/.prisma/client/"
  );
  console.error("[vendor]   (o en la raiz del monorepo: node_modules/.prisma/client/)");
  console.error("[vendor]");
  console.error("[vendor] Pasos:");
  console.error("[vendor]   1. npm install");
  console.error("[vendor]   2. npx prisma generate");
  console.error("[vendor]   3. npm run vendor:prisma -w apps/backend");
```

- [ ] **Step 3: Verificar 0 referencias pnpm**

```bash
rg -n 'pnpm' apps/backend/scripts/vendor-prisma.cjs
# Esperado: 0 resultados
```

---

### Task 6: Reescribir `apps/backend/scripts/prepare-ftp-bundle.cjs`

**Files:**
- Modify: `apps/backend/scripts/prepare-ftp-bundle.cjs`

- [ ] **Step 1: Reemplazar checks pre-flight (líneas 102-103)**

Buscar:

```
  [path.join(APP_ROOT, "dist"), "Build del backend (corre: pnpm build)"],
  [path.join(APP_ROOT, "vendor", "prisma-client"), "Vendor Prisma (corre: pnpm run vendor:prisma)"],
```

Reemplazar por:

```
  [path.join(APP_ROOT, "dist"), "Build del backend (corre: npm run build -w apps/backend)"],
  [path.join(APP_ROOT, "vendor", "prisma-client"), "Vendor Prisma (corre: npm run vendor:prisma -w apps/backend)"],
```

- [ ] **Step 2: Reemplazar `lockfileCandidates` y mensaje (líneas 111-121)**

Buscar:

```
// Lockfile: aceptar package-lock.json (npm) o pnpm-lock.yaml (pnpm) en raiz del monorepo.
const lockfileCandidates = [
  path.join(APP_ROOT, "package-lock.json"),
  path.join(APP_ROOT, "pnpm-lock.yaml"),
  path.join(APP_ROOT, "..", "..", "pnpm-lock.yaml"),
  path.join(APP_ROOT, "..", "..", "package-lock.json"),
];
const lockfileFound = lockfileCandidates.find((p) => fs.existsSync(p));
if (!lockfileFound) {
  console.error("[bundle] Falta: Lockfile (package-lock.json o pnpm-lock.yaml)");
  allOk = false;
}
```

Reemplazar por:

```
// Lockfile: package-lock.json en la raiz del monorepo.
const rootLockfile = path.join(APP_ROOT, "..", "..", "package-lock.json");
if (!fs.existsSync(rootLockfile)) {
  console.error("[bundle] Falta: package-lock.json en la raiz del monorepo");
  allOk = false;
}
```

- [ ] **Step 3: Reemplazar copia del lockfile (líneas 147-155)**

Buscar:

```
// Lockfile: pnpm-lock.yaml es el del monorepo, no del backend individual.
// Mejor copiar el pnpm-lock.yaml de la raiz.
const rootLockfile = path.join(APP_ROOT, "..", "..", "pnpm-lock.yaml");
if (fs.existsSync(rootLockfile)) {
  console.log("[bundle] Copiando pnpm-lock.yaml ...");
  fs.copyFileSync(rootLockfile, path.join(BUNDLE_DIR, "pnpm-lock.yaml"));
} else {
  console.log("[bundle] Aviso: pnpm-lock.yaml no encontrado en la raiz del monorepo.");
}
```

Reemplazar por:

```
// Lockfile: package-lock.json es el del monorepo, no del backend individual.
if (fs.existsSync(rootLockfile)) {
  console.log("[bundle] Copiando package-lock.json ...");
  fs.copyFileSync(rootLockfile, path.join(BUNDLE_DIR, "package-lock.json"));
} else {
  console.log("[bundle] Aviso: package-lock.json no encontrado en la raiz del monorepo.");
}
```

(La variable `rootLockfile` ya está definida en el paso anterior; eliminar esta redeclaración.)

- [ ] **Step 4: Reescribir el `README-DEPLOY.md` embebido (líneas 164-207)**

Buscar todo el bloque del template literal `readme` (líneas 164-207). Reemplazar por:

```js
const readme = `# cualauto-backend - bundle FTP

Paquete listo para subir por FTP y desplegar en hosting cPanel con LVE.

## Contenido

- dist/                    Codigo JS compilado (entrada: dist/src/index.js)
- vendor/prisma-client/    Cliente Prisma pre-generado (~48 MB)
- prisma/                  Schema y migraciones
- package.json             Dependencias y scripts
- package-lock.json        Lockfile para builds reproducibles
- .env.example             Plantilla de variables de entorno

## Pasos en el servidor

1. Subir este bundle por FTP y extraerlo en ~/cualauto-backend/

2. Crear .env con tus valores de produccion (NO subirlo por FTP):
   cp .env.example .env
   nano .env  # editar DATABASE_URL, JWT_SECRET, WEB_ORIGIN, ADMIN_*

3. Instalar dependencias de produccion saltando scripts (el postinstall
   detecta LVE y copia el vendor Prisma automaticamente):
   npm ci --omit=dev --ignore-scripts

4. Aplicar migraciones de base de datos:
   npx prisma migrate deploy

5. (Opcional) Cargar datos iniciales:
   npx tsx prisma/seed.ts

6. Arrancar el backend (desde el Application Manager de cPanel):
   - Application root: ~/cualauto-backend
   - Application startup file: dist/src/index.js
   - O via linea de comandos:
     node dist/src/index.js

## Verificacion

curl https://api.midominio.com/health
# Respuesta esperada: {"data":{"status":"ok","env":"https://midominio.com"}}
`;
```

- [ ] **Step 5: Verificar 0 referencias pnpm**

```bash
rg -n 'pnpm' apps/backend/scripts/prepare-ftp-bundle.cjs
# Esperado: 0 resultados
```

---

### Task 7: Editar `apps/backend/__tests__/helpers/db.ts`

**Files:**
- Modify: `apps/backend/__tests__/helpers/db.ts:8`

- [ ] **Step 1: Cambiar `pnpm exec` por `npx`**

Buscar:

```ts
    execSync("pnpm exec prisma migrate deploy", {
```

Reemplazar por:

```ts
    execSync("npx prisma migrate deploy", {
```

- [ ] **Step 2: Verificar**

```bash
rg -n 'pnpm' apps/backend/__tests__/helpers/db.ts
# Esperado: 0 resultados
```

---

### Task 8: Editar comentario en `apps/backend/prisma/seed.ts`

**Files:**
- Modify: `apps/backend/prisma/seed.ts:13`

- [ ] **Step 1: Cambiar `pnpm db:reset` por `npm run db:reset`**

Buscar:

```ts
// completo usar `pnpm db:reset` (definido en package.json).
```

Reemplazar por:

```ts
// completo usar `npm run db:reset` (definido en package.json).
```

- [ ] **Step 2: Verificar**

```bash
rg -n 'pnpm' apps/backend/prisma/seed.ts
# Esperado: 0 resultados
```

---

### Task 9: Regenerar vendor Prisma con npm

**Files:**
- Create: `apps/backend/vendor/prisma-client/` (regenerado desde cero con npm)

- [ ] **Step 1: Generar cliente Prisma**

```bash
cd apps/backend
npx prisma generate
# Esperado: "Generated Prisma Client (v5.22.0) to ./../node_modules/.prisma/client"
cd ../..
```

- [ ] **Step 2: Copiar a vendor**

```bash
npm run vendor:prisma -w apps/backend
# Esperado: "[vendor] OK - cliente Prisma copiado a: <repo>/apps/backend/vendor/prisma-client"
# Verificar tamano: "[vendor] Tamano total: ~48 MB"
```

- [ ] **Step 3: Verificar que el vendor NO contiene paths `.pnpm/`**

```bash
rg -n '\.pnpm' apps/backend/vendor/prisma-client/
# Esperado: 0 resultados
```

- [ ] **Step 4: Verificar que el cliente responde (smoke test)**

```bash
ls apps/backend/vendor/prisma-client/index.js apps/backend/vendor/prisma-client/edge.js apps/backend/vendor/prisma-client/schema.prisma
# Esperado: los 3 archivos existen
ls apps/backend/vendor/prisma-client/libquery_engine-linux-musl-openssl-3.0.x.so.node
# Esperado: existe (binaryTarget del proyecto)
```

---

### Task 10: Re-correr postinstall (validación local)

**Files:**
- Read: `apps/backend/scripts/postinstall.cjs`

- [ ] **Step 1: Re-instalar para que corra el postinstall**

```bash
npm install
# Esperado: exit 0; el postinstall hook se ejecuta (en entorno con RAM suficiente
# corre "npx prisma generate")
```

- [ ] **Step 2: Verificar que el cliente Prisma sigue donde debe**

```bash
ls node_modules/.prisma/client/index.js
# Esperado: existe
```

- [ ] **Step 3: Verificar mensaje del postinstall ya no menciona pnpm**

```bash
npm install 2>&1 | grep -i "pnpm"
# Esperado: 0 lineas (o solo la entrada "pnpm-debug.log*" del gitignore, sin output)
```

---

### Task 11: Build del backend

**Files:**
- Read: `apps/backend/dist/` (regenerado)

- [ ] **Step 1: Compilar**

```bash
npm run build -w apps/backend
# Esperado: exit 0; crea apps/backend/dist/src/index.js
```

- [ ] **Step 2: Smoke test arranque**

```bash
# Asumiendo MariaDB local corriendo con .env configurado
node apps/backend/dist/src/index.js &
PID=$!
sleep 3
curl -s http://localhost:3000/health
# Esperado: {"data":{"status":"ok","env":"http://localhost:4200"}}
kill $PID
```

Si falla la conexión a MariaDB, ejecutar solo el chequeo de sintaxis:

```bash
node -e "require('./apps/backend/dist/src/index.js')" 2>&1 | head -20
# Esperado: error de conexion MariaDB, NO error de modulo no encontrado
```

---

### Task 12: Reescribir `docs/setup.md`

**Files:**
- Modify: `docs/setup.md`

- [ ] **Step 1: Requisito `pnpm 10+` → `npm 10+` (línea 8)**

Buscar:

```markdown
- pnpm 10+ (`npm i -g pnpm`)
```

Reemplazar por:

```markdown
- npm 10+ (incluido con Node.js 20+)
```

- [ ] **Step 2: Sección Backend (líneas 109-118)**

Reemplazar:

```markdown
```bash
# instalar dependencias
pnpm install

# aplicar migraciones + seed
pnpm db:reset

# arrancar backend en modo dev
pnpm dev:be
```
```

Por:

```markdown
```bash
# instalar dependencias
npm install

# aplicar migraciones + seed
npm run db:reset

# arrancar backend en modo dev
npm run dev:be
```
```

- [ ] **Step 3: Sección Frontend (líneas 122-128)**

Reemplazar:

```markdown
```bash
pnpm dev:fe
```
```

Por:

```markdown
```bash
npm run dev:fe
```
```

- [ ] **Step 4: Sección Tests (líneas 130-141)**

Reemplazar `pnpm test` → `npm test`, `pnpm test:be` → `npm run test:be`, `pnpm test:fe` → `npm run test:fe`.

- [ ] **Step 5: Sección Migraciones (líneas 143-154)**

Reemplazar:
- `pnpm db:migrate` → `npm run db:migrate`
- `cd apps/backend && pnpm exec prisma migrate deploy` → `cd apps/backend && npx prisma migrate deploy`
- `pnpm db:seed` → `npm run db:seed`

- [ ] **Step 6: Sección Reset completo (líneas 156-167)**

Reemplazar `pnpm db:migrate` → `npm run db:migrate` y `pnpm db:seed` → `npm run db:seed`.

- [ ] **Step 7: Verificar**

```bash
rg -n 'pnpm' docs/setup.md
# Esperado: 0 resultados
```

---

### Task 13: Reescribir `apps/backend/prisma/migrations/README.md`

**Files:**
- Modify: `apps/backend/prisma/migrations/README.md`

- [ ] **Step 1: Reemplazar comandos**

```bash
# aplicar migraciones pendientes (producción / CI)
cd apps/backend && pnpm exec prisma migrate deploy

# desarrollo: crear/aplicar migración y regenerar cliente
pnpm db:migrate
```

Por:

```bash
# aplicar migraciones pendientes (producción / CI)
cd apps/backend && npx prisma migrate deploy

# desarrollo: crear/aplicar migración y regenerar cliente
npm run db:migrate
```

- [ ] **Step 2: Verificar**

```bash
rg -n 'pnpm' apps/backend/prisma/migrations/README.md
# Esperado: 0 resultados
```

---

### Task 14: Reescribir `docs/generate_pdf.py` y regenerar PDF

**Files:**
- Modify: `docs/generate_pdf.py`
- Overwrite: `docs/guia-despliegue-cpanel.pdf`

- [ ] **Step 1: Reemplazar línea 103 (portada: "Monorepo - pnpm workspaces")**

Buscar:

```python
        "Monorepo       - pnpm workspaces",
```

Reemplazar por:

```python
        "Monorepo       - npm workspaces",
```

- [ ] **Step 2: Reemplazar línea 232 (requisitos cliente)**

Buscar:

```python
    "Computadora con Node.js 20+ y pnpm 10+.",
```

Reemplazar por:

```python
    "Computadora con Node.js 20+ y npm 10+ (incluido con Node 20).",
```

- [ ] **Step 3: Reemplazar línea 292 (Paso 3.1)**

Buscar:

```python
story.append(code_block("pnpm install"))
```

Reemplazar por:

```python
story.append(code_block("npm install"))
```

- [ ] **Step 4: Reemplazar bloque líneas 310-322 (Pasos 3.3, 3.4, 3.5)**

Buscar:

```python
story.append(code_block("pnpm --filter @cualautocompro/backend build\n"
                       "# Salida: apps/backend/dist/"))
```

Reemplazar por:

```python
story.append(code_block("npm run build -w apps/backend\n"
                       "# Salida: apps/backend/dist/"))
```

Buscar:

```python
story.append(code_block("cd apps/frontend\n"
                       "pnpm exec ng build --configuration production\n"
                       "# Salida: apps/frontend/dist/frontend/browser/"))
```

Reemplazar por:

```python
story.append(code_block("cd apps/frontend\n"
                       "npx ng build --configuration production\n"
                       "# Salida: apps/frontend/dist/frontend/browser/"))
```

Buscar:

```python
story.append(code_block("# Levantar MariaDB local (Docker o brew services start mariadb)\n"
                       "cd apps/backend && pnpm start\n\n"
                       "# En otra terminal\n"
                       "cd apps/frontend && pnpm exec ng serve"))
```

Reemplazar por:

```python
story.append(code_block("# Levantar MariaDB local (Docker o brew services start mariadb)\n"
                       "cd apps/backend && npm start\n\n"
                       "# En otra terminal\n"
                       "cd apps/frontend && npx ng serve"))
```

- [ ] **Step 5: Reemplazar bloque líneas 391, 409-419 (Paso 5.1 estructura + Paso 5.2)**

Buscar:

```python
                       "  +- pnpm-lock.yaml        (o package-lock.json)\n"
```

Reemplazar por:

```python
                       "  +- package-lock.json     (lockfile para npm ci reproducible)\n"
```

Buscar:

```python
story.append(Paragraph(
    "<b>Nota importante:</b> este proyecto usa <b>pnpm</b> como gestor de paquetes, "
    "no npm. El lockfile es <i>pnpm-lock.yaml</i> (no existe <i>package-lock.json</i>). "
    "Por lo tanto <i>npm ci</i> no funciona en el server. Use siempre <i>pnpm "
    "install --prod --ignore-scripts</i>.",
    styles["Cuerpo"]))
```

Reemplazar por:

```python
story.append(Paragraph(
    "Este proyecto usa <b>npm</b> como gestor de paquetes (no pnpm). "
    "El lockfile es <i>package-lock.json</i>. Use <i>npm ci --omit=dev "
    "--ignore-scripts</i> para builds reproducibles en el server.",
    styles["Cuerpo"]))
```

Buscar:

```python
story.append(code_block("cd ~/cualauto-backend\n\n"
                       "# Si pnpm no esta disponible en el server, instalelo primero:\n"
                       "npm install -g pnpm\n\n"
                       "# Instalar dependencias de produccion saltando scripts:\n"
                       "pnpm install --prod --ignore-scripts"))
```

Reemplazar por:

```python
story.append(code_block("cd ~/cualauto-backend\n\n"
                       "# Instalar dependencias de produccion saltando scripts:\n"
                       "npm ci --omit=dev --ignore-scripts"))
```

- [ ] **Step 6: Reemplazar bloque 5.2.bis workflow Git (líneas 475-507)**

Buscar:

```python
story.append(code_block("# 1. Generar el cliente Prisma localmente\n"
                       "pnpm install\n"
                       "pnpm exec prisma generate\n\n"
                       "# 2. Copiar el cliente a un directorio committeable (vendor)\n"
                       "pnpm run vendor:prisma\n\n"
                       "# 3. Commitear y subir a git\n"
                       "git add apps/backend/vendor/prisma-client/\n"
                       "git commit -m \"chore(be): vendor prisma client\"\n"
                       "git push"))
```

Reemplazar por:

```python
story.append(code_block("# 1. Generar el cliente Prisma localmente\n"
                       "npm install\n"
                       "npx prisma generate\n\n"
                       "# 2. Copiar el cliente a un directorio committeable (vendor)\n"
                       "npm run vendor:prisma -w apps/backend\n\n"
                       "# 3. Commitear y subir a git\n"
                       "git add apps/backend/vendor/prisma-client/\n"
                       "git commit -m \"chore(be): vendor prisma client\"\n"
                       "git push"))
```

Buscar:

```python
    "<i>binaryTargets</i>, o actualizar la version de Prisma. Ejecuta <i>pnpm exec "
    "prisma generate && pnpm run vendor:prisma</i> y commitea el resultado.",
```

Reemplazar por:

```python
    "<i>binaryTargets</i>, o actualizar la version de Prisma. Ejecuta <i>npx "
    "prisma generate && npm run vendor:prisma -w apps/backend</i> y commitea el resultado.",
```

Buscar:

```python
story.append(code_block("# npm layout:\n"
                       "#   node_modules/@prisma/client/index.js\n"
                       "#   node_modules/.prisma/client/index.js\n\n"
                       "# pnpm layout:\n"
                       "#   node_modules/.pnpm/@prisma+client@VERSION_prisma@VERSION/\n"
                       "#       node_modules/@prisma/client/index.js\n"
                       "#   node_modules/.pnpm/@prisma+client@VERSION_prisma@VERSION/\n"
                       "#       node_modules/.prisma/client/index.js\n\n"
                       "# El wrapper detecta cual usar via require.resolve + realpath."))
```

Reemplazar por:

```python
story.append(code_block("# Layout npm (workspaces hoisted a raiz del monorepo):\n"
                       "#   node_modules/@prisma/client/index.js\n"
                       "#   node_modules/.prisma/client/index.js\n\n"
                       "# El wrapper resuelve el path via require.resolve.\n"
                       "# En npm workspace no hay symlinks entre @prisma/client y .prisma/client."))
```

- [ ] **Step 7: Reemplazar bloque 5.2.ter bundle FTP (líneas 524-625)**

Buscar:

```python
    "<b>pnpm-lock.yaml</b>: lockfile para builds reproducibles.",
```

Reemplazar por:

```python
    "<b>package-lock.json</b>: lockfile para builds reproducibles.",
```

Buscar (callout):

```python
    "<b>Que NO incluye</b>: <i>node_modules/</i> (lo reconstruye npm ci en el server), "
```

Reemplazar por:

```python
    "<b>Que NO incluye</b>: <i>node_modules/</i> (lo reconstruye <i>npm ci</i> en el server), "
```

Buscar:

```python
story.append(code_block("pnpm install\n"
                       "pnpm --filter @cualautocompro/backend run vendor:prisma\n"
                       "pnpm --filter @cualautocompro/backend build"))
```

Reemplazar por:

```python
story.append(code_block("npm install\n"
                       "npm run vendor:prisma -w apps/backend\n"
                       "npm run build -w apps/backend"))
```

Buscar:

```python
story.append(code_block("pnpm --filter @cualautocompro/backend run bundle:ftp\n\n"
                       "# Salida:\n"
                       "#   apps/backend/dist-bundle/                       (directorio)\n"
                       "#   apps/backend/cualauto-backend-bundle.tar.gz     (tarball, ~22 MB)"))
```

Reemplazar por:

```python
story.append(code_block("npm run bundle:ftp -w apps/backend\n\n"
                       "# Salida:\n"
                       "#   apps/backend/dist-bundle/                       (directorio)\n"
                       "#   apps/backend/cualauto-backend-bundle.tar.gz     (tarball, ~22 MB)"))
```

Buscar:

```python
    "<b>Este proyecto usa pnpm (no npm); no existe package-lock.json</b>, "
    "asi que <i>npm ci</i> no funciona. Use <i>pnpm install --prod</i>:",
```

Reemplazar por:

```python
    "Este proyecto usa <b>npm</b>. En el server use <i>npm ci --omit=dev</i>:",
```

Buscar:

```python
story.append(code_block("cd ~/cualauto-backend\n\n"
                       "# Si pnpm no esta disponible, instalelo primero:\n"
                       "npm install -g pnpm\n\n"
                       "# Instalar dependencias saltando el postinstall:\n"
                       "pnpm install --prod --ignore-scripts\n\n"
                       "# Verifica que el vendor Prisma quedo instalado:\n"
                       "ls node_modules/.prisma/client/libquery_engine-*\n"
                       "# Debe existir libquery_engine-linux-musl-openssl-3.0.x.so.node"))
```

Reemplazar por:

```python
story.append(code_block("cd ~/cualauto-backend\n\n"
                       "# Instalar dependencias de produccion saltando scripts:\n"
                       "npm ci --omit=dev --ignore-scripts\n\n"
                       "# Verifica que el vendor Prisma quedo instalado:\n"
                       "ls node_modules/.prisma/client/libquery_engine-*\n"
                       "# Debe existir libquery_engine-linux-musl-openssl-3.0.x.so.node"))
```

- [ ] **Step 8: Reemplazar tabla comparativa Git vs FTP (líneas 663-687)**

Cambiar la fila "Comando en server" en ambas columnas:

```python
    Paragraph("pnpm install --prod --ignore-scripts", styles["Cuerpo"]),
    Paragraph("tar -xzf + pnpm install --prod --ignore-scripts", styles["Cuerpo"]),
```

Por:

```python
    Paragraph("npm ci --omit=dev --ignore-scripts", styles["Cuerpo"]),
    Paragraph("tar -xzf + npm ci --omit=dev --ignore-scripts", styles["Cuerpo"]),
```

- [ ] **Step 9: Reemplazar bloque de verificaciones (líneas 669-670, 716)**

Buscar:

```python
    Paragraph("pnpm install --prod --ignore-scripts", styles["Cuerpo"]),
    Paragraph("tar -xzf + pnpm install --prod --ignore-scripts", styles["Cuerpo"]),
```

Por:

```python
    Paragraph("npm ci --omit=dev --ignore-scripts", styles["Cuerpo"]),
    Paragraph("tar -xzf + npm ci --omit=dev --ignore-scripts", styles["Cuerpo"]),
```

Buscar:

```python
    "<i>dist/src/index.js</i>, no en <i>dist/index.js</i>. El <i>npm start</i> "
```

(No requiere cambio si ya dice "npm start"; si dice "pnpm start", reemplazar por "npm start".)

- [ ] **Step 10: Reemplazar bloque Paso 6 frontend (líneas 851-881)**

Buscar:

```python
story.append(code_block("cd apps/frontend\n\n"
                       "# Build + verificacion automatica del bundle:\n"
                       "pnpm run build:prod\n"
```

Reemplazar por:

```python
story.append(code_block("cd apps/frontend\n\n"
                       "# Build + verificacion automatica del bundle:\n"
                       "npm run build:prod\n"
```

Buscar:

```python
    "Puedes correrlo solo con: <i>pnpm run verify:bundle</i>",
```

Reemplazar por:

```python
    "Puedes correrlo solo con: <i>npm run verify:bundle</i>",
```

- [ ] **Step 11: Reemplazar bloque Paso 8 migraciones/seed (líneas 1005-1023)**

Buscar:

```python
    "El cliente Prisma tipado se regenera automaticamente durante <i>pnpm install --prod</i> "
```

Reemplazar por:

```python
    "El cliente Prisma tipado se regenera automaticamente durante <i>npm ci --omit=dev</i> "
```

- [ ] **Step 12: Reemplazar bloque Paso 11 troubleshooting (líneas 1180-1191)**

Buscar:

```python
    ("postinstall falla con 'Out of memory' / 'LVE limits' durante pnpm install",
     "prisma generate inicializa un WebAssembly que excede el limite del LVE de CloudLinux. "
     "El proyecto incluye un wrapper (apps/backend/scripts/postinstall.cjs) que detecta "
     "el LVE y copia el cliente pre-generado desde apps/backend/vendor/prisma-client/. "
     "Para regenerar el vendor en una maquina con memoria: pnpm exec prisma generate "
     "&& pnpm run vendor:prisma && git commit/push. Ver paso 5.2.bis para el workflow "
     "completo."),
    ("No puedo subir archivos a node_modules manualmente",
     "No es necesario. El proyecto vendea el cliente Prisma en git "
     "(apps/backend/vendor/prisma-client/) y el postinstall lo copia automaticamente "
     "al lugar correcto en node_modules despues de pnpm install. Solo se necesita correr "
     "pnpm run vendor:prisma localmente y commitear, lo cual es flujo normal de git."),
```

Reemplazar por:

```python
    ("postinstall falla con 'Out of memory' / 'LVE limits' durante npm install",
     "prisma generate inicializa un WebAssembly que excede el limite del LVE de CloudLinux. "
     "El proyecto incluye un wrapper (apps/backend/scripts/postinstall.cjs) que detecta "
     "el LVE y copia el cliente pre-generado desde apps/backend/vendor/prisma-client/. "
     "Para regenerar el vendor en una maquina con memoria: npx prisma generate "
     "&& npm run vendor:prisma -w apps/backend && git commit/push. Ver paso 5.2.bis para el workflow "
     "completo."),
    ("No puedo subir archivos a node_modules manualmente",
     "No es necesario. El proyecto vendea el cliente Prisma en git "
     "(apps/backend/vendor/prisma-client/) y el postinstall lo copia automaticamente "
     "al lugar correcto en node_modules despues de npm ci. Solo se necesita correr "
     "npm run vendor:prisma localmente y commitear, lo cual es flujo normal de git."),
```

- [ ] **Step 13: Verificar 0 referencias pnpm en generate_pdf.py**

```bash
rg -n 'pnpm' docs/generate_pdf.py
# Esperado: 0 resultados
```

- [ ] **Step 14: Regenerar PDF**

```bash
python3 docs/generate_pdf.py
# Esperado: "PDF generado: /Users/.../docs/guia-despliegue-cpanel.pdf"
ls -la docs/guia-despliegue-cpanel.pdf
```

- [ ] **Step 15: Verificar PDF regenerado**

```bash
rg -a 'pnpm' docs/guia-despliegue-cpanel.pdf
# Esperado: 0 resultados (la cadena "pnpm" no aparece en el PDF)
```

---

### Task 15: Migrar specs/plans históricos

**Files:**
- Modify: `docs/superpowers/specs/*.md`
- Modify: `docs/superpowers/plans/*.md`

- [ ] **Step 1: Reemplazo mecánico en specs/**

```bash
cd docs/superpowers
# Backup para verificar después
cp -r specs specs.bak

# Aplicar transformaciones
for f in specs/*.md; do
  sed -i '' \
    -e 's/pnpm install/npm install/g' \
    -e 's/pnpm exec /npx /g' \
    -e 's/pnpm run /npm run /g' \
    -e 's/pnpm db:/npm run db:/g' \
    -e 's/pnpm --filter /npm -w /g' \
    -e 's/pnpm dev:/npm run dev:/g' \
    -e 's/pnpm test:/npm run test:/g' \
    -e 's/pnpm-lock\.yaml/package-lock.json/g' \
    -e 's/pnpm 10+/npm 10+/g' \
    -e 's/pnpm workspaces/npm workspaces/g' \
    -e 's/este proyecto usa pnpm/este proyecto usa npm/g' \
    -e 's/usa pnpm/usa npm/g' \
    -e 's/ de pnpm / de npm /g' \
    -e 's/a pnpm /a npm /g' \
    -e 's/con pnpm /con npm /g' \
    -e 's/`pnpm `/`npm` /g' \
    "$f"
done
```

- [ ] **Step 2: Reemplazo mecánico en plans/**

```bash
cd docs/superpowers
cp -r plans plans.bak

for f in plans/*.md; do
  sed -i '' \
    -e 's/pnpm install/npm install/g' \
    -e 's/pnpm exec /npx /g' \
    -e 's/pnpm run /npm run /g' \
    -e 's/pnpm db:/npm run db:/g' \
    -e 's/pnpm --filter /npm -w /g' \
    -e 's/pnpm dev:/npm run dev:/g' \
    -e 's/pnpm test:/npm run test:/g' \
    -e 's/pnpm-lock\.yaml/package-lock.json/g' \
    -e 's/pnpm 10+/npm 10+/g' \
    -e 's/pnpm workspaces/npm workspaces/g' \
    -e 's/este proyecto usa pnpm/este proyecto usa npm/g' \
    -e 's/usa pnpm/usa npm/g' \
    -e 's/ de pnpm / de npm /g' \
    -e 's/a pnpm /a npm /g' \
    -e 's/con pnpm /con npm /g' \
    -e 's/`pnpm `/`npm` /g' \
    "$f"
done
```

- [ ] **Step 3: Verificar 0 referencias pnpm en specs/plans**

```bash
rg -n 'pnpm' docs/superpowers/specs/ docs/superpowers/plans/
# Esperado: 0 resultados (especificaciones: listado de comandos y referencias)
```

Si quedan casos puntuales (e.g. frases como "el lockfile actual es pnpm-lock.yaml"), revisarlos manualmente y decidir si el cambio aplica o no.

- [ ] **Step 4: Limpiar backups**

```bash
rm -rf docs/superpowers/specs.bak docs/superpowers/plans.bak
```

---

### Task 16: Tests end-to-end

**Files:** (sin cambios — solo ejecución)

- [ ] **Step 1: Correr tests backend**

```bash
npm run test:be
# Esperado: exit 0
```

- [ ] **Step 2: Correr tests frontend**

```bash
npm run test:fe
# Esperado: exit 0
```

- [ ] **Step 3: Correr tests E2E**

```bash
npm run test:e2e
# Esperado: exit 0 (o los mismos resultados que antes de la migración)
```

- [ ] **Step 4: Generar bundle FTP como smoke test del script**

```bash
npm run bundle:ftp -w apps/backend
# Esperado: exit 0; tarball generado
ls apps/backend/cualauto-backend-bundle.tar.gz
# Verificar contenido:
tar -tzf apps/backend/cualauto-backend-bundle.tar.gz | grep -E "package-lock|pnpm-lock"
# Esperado: solo aparece package-lock.json, NO pnpm-lock.yaml
```

- [ ] **Step 5: Smoke test final del deploy con bundle**

```bash
# Extraer bundle en directorio temporal
TMPDIR=$(mktemp -d)
cd $TMPDIR
tar -xzf /Users/.../apps/backend/cualauto-backend-bundle.tar.gz
ls
# Esperado: dist/ prisma/ vendor/ package.json package-lock.json .env.example README-DEPLOY.md
```

(No requiere ejecutar npm ci completo, solo confirmar que el tarball tiene la estructura correcta.)

---

### Task 17: Verificación final + criterios de aceptación (1-15)

- [ ] **Step 1: Check 1 — refs pnpm en configs**

```bash
rg -n 'pnpm' package.json apps/*/package.json apps/*/angular.json
# Esperado: 0 resultados
```

- [ ] **Step 2: Check 2 — refs pnpm en scripts backend**

```bash
rg -n 'pnpm' apps/backend/scripts/ apps/backend/__tests__/
# Esperado: 0 resultados
```

- [ ] **Step 3: Check 3 — refs pnpm en docs**

```bash
rg -n 'pnpm' docs/setup.md apps/backend/prisma/migrations/README.md docs/generate_pdf.py
# Esperado: 0 resultados
```

- [ ] **Step 4: Check 4 — refs pnpm en specs/plans**

```bash
rg -n 'pnpm' docs/superpowers/specs/ docs/superpowers/plans/
# Esperado: 0 resultados
```

- [ ] **Step 5: Check 5 — PDF regenerado limpio**

```bash
rg -a 'pnpm' docs/guia-despliegue-cpanel.pdf
# Esperado: 0 resultados
```

- [ ] **Step 6: Check 6 — solo `package-lock.json`, no `pnpm-lock.yaml`**

```bash
ls package-lock.json && ! ls pnpm-lock.yaml
# Esperado: package-lock.json existe, pnpm-lock.yaml no
```

- [ ] **Step 7: Check 7 — `npm install` limpio**

```bash
rm -rf node_modules
npm install
# Esperado: exit 0; genera node_modules y package-lock.json
```

- [ ] **Step 8: Check 8 — vendor sin `.pnpm`**

```bash
rg '\.pnpm' apps/backend/vendor/prisma-client/
# Esperado: 0 resultados
```

- [ ] **Step 9: Checks 9-11 — tests**

```bash
npm run test:be
npm run test:fe
npm run test:e2e
# Esperado: los 3 exit 0
```

- [ ] **Step 10: Checks 12-13 — builds**

```bash
npm run build -w apps/backend
npm run build -w apps/frontend
# Esperado: exit 0 los 2
```

- [ ] **Step 11: Check 14 — bundle FTP**

```bash
npm run bundle:ftp -w apps/backend
tar -tzf apps/backend/cualauto-backend-bundle.tar.gz | grep -E "package-lock|pnpm-lock"
# Esperado: solo package-lock.json
```

- [ ] **Step 12: Check 15 — backend arranca**

```bash
# Asumiendo MariaDB local con la BD creada
npm run db:reset -w apps/backend 2>/dev/null || true
node apps/backend/dist/src/index.js &
PID=$!
sleep 3
curl -sf http://localhost:3000/health
# Esperado: {"data":{"status":"ok",...}}
kill $PID 2>/dev/null || true
```

- [ ] **Step 13: Commit final**

Si todos los checks pasan:

```bash
git status
# Esperado: solo pnpm-lock.yaml eliminado, package-lock.json nuevo,
#           apps/backend/vendor/prisma-client/ regenerado,
#           cambios en docs y scripts.
git add -A
git commit -m "chore: migración pnpm→npm (configs + scripts + vendor + docs + PDF + specs/plans)"
```

(No hacer `git push` sin confirmación explícita.)

---

### Task 18 (opcional): push a origin

- [ ] **Step 1: Pedir confirmación al usuario antes de push**

Mensaje esperado: "He completado la migración localmente y los 15 checks pasan. ¿Hago `git push` a `origin/main`?"

- [ ] **Step 2: Si el usuario confirma**

```bash
git push origin main
# Esperado: push exitoso
```
