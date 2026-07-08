// Prepara un bundle listo para subir por FTP al servidor cPanel.
//
// Por que existe:
//   Algunos hostings cPanel compartidos no permiten escribir manualmente
//   a node_modules (ni por scp ni por upload). El workflow esperado es:
//     1. Local: build + vendor del cliente Prisma.
//     2. Local: este script arma un paquete con TODO lo necesario
//        para que el backend arranque sin necesidad de correr
//        'npm install' en el server.
//     3. Local: subir el .tar.gz / .zip resultante por FTP al server.
//     4. Server: extraer y arrancar con node dist/src/index.js.
//
// Que incluye el bundle:
//   - dist/                    codigo compilado (JS)
//   - vendor/prisma-client/    cliente Prisma pre-generado
//   - prisma/                  schema + migrations
//   - package.json             dependencias y scripts
//   - package-lock.json        para npm ci reproducible
//   - .env.example             plantilla (NO incluye .env real con secretos)
//   - README-DEPLOY.md         instrucciones rapidas para el server
//
// Que NO incluye:
//   - node_modules/            lo reconstruye npm ci en el server
//   - .env, .env.*             secretos (subir manualmente y seguro)
//   - .git/, docs/, scripts/   no necesarios en runtime
//   - src/, __tests__/         codigo fuente TS (ya compilado a dist/)
//
// Cuando usarlo:
//   Antes de cada deploy al server con LVE / node_modules de solo lectura.

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const APP_ROOT = path.join(__dirname, "..");
const BUNDLE_DIR = path.join(APP_ROOT, "dist-bundle");
const OUTPUT_TARBALL = path.join(APP_ROOT, "cualauto-backend-bundle.tar.gz");

function rimraf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    // Excluir archivos basura (macOS, etc.)
    if (entry.name === ".DS_Store" || entry.name === "Thumbs.db") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else if (entry.isSymbolicLink()) {
      const real = fs.realpathSync(s);
      if (fs.statSync(real).isDirectory()) {
        copyRecursive(real, d);
      } else {
        fs.copyFileSync(real, d);
      }
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function ensureExists(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`[bundle] Falta: ${label}`);
    console.error(`[bundle]   Esperado en: ${p}`);
    return false;
  }
  return true;
}

function listFiles(dir, prefix = "") {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listFiles(full, rel));
    } else if (!entry.isSymbolicLink()) {
      const size = fs.statSync(full).size;
      out.push({ rel, size });
    }
  }
  return out;
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

console.log("[bundle] Preparando bundle FTP para deploy...");

// 1. Verificar pre-requisitos
const checks = [
  [path.join(APP_ROOT, "dist"), "Build del backend (corre: npm run build -w apps/backend)"],
  [path.join(APP_ROOT, "vendor", "prisma-client"), "Vendor Prisma (corre: npm run vendor:prisma -w apps/backend)"],
  [path.join(APP_ROOT, "prisma"), "Schema y migraciones Prisma"],
  [path.join(APP_ROOT, "package.json"), "package.json"],
];
let allOk = true;
for (const [p, label] of checks) {
  if (!ensureExists(p, label)) allOk = false;
}
// Lockfile: package-lock.json en la raiz del monorepo.
const rootLockfile = path.join(APP_ROOT, "..", "..", "package-lock.json");
if (!fs.existsSync(rootLockfile)) {
  console.error("[bundle] Falta: package-lock.json en la raiz del monorepo");
  allOk = false;
}
if (!allOk) {
  process.exit(1);
}

// 2. Limpiar bundle previo
rimraf(BUNDLE_DIR);
rimraf(OUTPUT_TARBALL);
fs.mkdirSync(BUNDLE_DIR, { recursive: true });

// 3. Copiar artefactos
console.log("[bundle] Copiando dist/ ...");
copyRecursive(path.join(APP_ROOT, "dist"), path.join(BUNDLE_DIR, "dist"));

console.log("[bundle] Copiando vendor/prisma-client/ ...");
copyRecursive(path.join(APP_ROOT, "vendor", "prisma-client"),
              path.join(BUNDLE_DIR, "vendor", "prisma-client"));

console.log("[bundle] Copiando prisma/ ...");
copyRecursive(path.join(APP_ROOT, "prisma"), path.join(BUNDLE_DIR, "prisma"));

console.log("[bundle] Copiando package.json ...");
fs.copyFileSync(path.join(APP_ROOT, "package.json"),
                path.join(BUNDLE_DIR, "package.json"));

// Lockfile: package-lock.json es el del monorepo, no del backend individual.
// Mejor copiarlo desde la raiz.
if (fs.existsSync(rootLockfile)) {
  console.log("[bundle] Copiando package-lock.json ...");
  fs.copyFileSync(rootLockfile, path.join(BUNDLE_DIR, "package-lock.json"));
} else {
  console.log("[bundle] Aviso: package-lock.json no encontrado en la raiz del monorepo.");
}

console.log("[bundle] Copiando .env.example ...");
const envExample = path.join(APP_ROOT, ".env.example");
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(BUNDLE_DIR, ".env.example"));
}

// 4. Crear README-DEPLOY.md
const readme = `# cualauto-backend - bundle FTP

Paquete listo para subir por FTP y desplegar en hosting cPanel con LVE.

## Contenido

- dist/                    Codigo JS compilado (entrada: dist/src/index.js)
- vendor/prisma-client/    Cliente Prisma pre-generado (~48 MB)
- prisma/                  Schema y migraciones
- package.json             Dependencias y scripts
- package-lock.json        Lockfile para builds reproducibles (npm)
- .env.example             Plantilla de variables de entorno

## Pasos en el servidor

1. Subir este bundle por FTP y extraerlo en ~/cualauto-backend/

2. Crear .env con tus valores de produccion (NO subirlo por FTP):
   cp .env.example .env
   nano .env  # editar DATABASE_URL, JWT_SECRET, WEB_ORIGIN, ADMIN_*

3. Instalar dependencias de produccion saltando scripts de ciclo de vida
   (no hay postinstall nuestro; usar --ignore-scripts evita ejecutar
   los postinstall de paquetes de terceros como @prisma/client que
   pueden causar OOM en servidores con LVE):
   npm ci --omit=dev --ignore-scripts

4. Copiar el cliente Prisma pre-generado (vendor) a la ubicacion donde
   @prisma/client lo busca. Sin esto el backend fallara al primer
   query Prisma porque la instalacion con --ignore-scripts no genera
   el cliente:
   mkdir -p node_modules/.prisma
   cp -r vendor/prisma-client node_modules/.prisma/client

5. Aplicar migraciones de base de datos:
   npx prisma migrate deploy

6. (Opcional) Cargar datos iniciales:
   npx tsx prisma/seed.ts

7. Arrancar el backend (desde el Application Manager de cPanel):
   - Application root: ~/cualauto-backend
   - Application startup file: dist/src/index.js
   - O via linea de comandos:
     node dist/src/index.js

## Verificacion

curl https://api.midominio.com/health
# Respuesta esperada: {"data":{"status":"ok","env":"https://midominio.com"}}
`;
fs.writeFileSync(path.join(BUNDLE_DIR, "README-DEPLOY.md"), readme);

// 5. Crear tarball
console.log("[bundle] Creando tarball ...");
try {
  execSync(`tar -czf "${OUTPUT_TARBALL}" -C "${path.dirname(BUNDLE_DIR)}" "${path.basename(BUNDLE_DIR)}"`, {
    stdio: "pipe",
  });
} catch (err) {
  console.error("[bundle] Error creando tarball:", err.message);
  console.error("[bundle] El bundle quedo en:", BUNDLE_DIR);
  process.exit(1);
}

// 6. Resumen
const totalSize = (() => {
  let bytes = 0;
  function walk(p) {
    for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (fs.statSync(full).isFile()) bytes += fs.statSync(full).size;
    }
  }
  walk(BUNDLE_DIR);
  return bytes;
})();

console.log("");
console.log("=========================================");
console.log("Bundle FTP listo:");
console.log("=========================================");
console.log(`  Tarball:    ${OUTPUT_TARBALL}`);
console.log(`  Tamano:     ${humanSize(fs.statSync(OUTPUT_TARBALL).size)} (comprimido)`);
console.log(`  Descomp.:   ${humanSize(totalSize)}`);
console.log("");
console.log("Contenido:");
const files = listFiles(BUNDLE_DIR);
const top = files
  .sort((a, b) => b.size - a.size)
  .slice(0, 10);
for (const f of top) {
  console.log(`  ${humanSize(f.size).padStart(8)}  ${f.rel}`);
}
if (files.length > 10) {
  console.log(`  ... y ${files.length - 10} archivos mas`);
}
console.log("");
console.log("=========================================");
console.log("Siguiente paso:");
console.log("=========================================");
console.log("  1. Sube cualauto-backend-bundle.tar.gz por FTP al server.");
console.log("  2. En el server, extrae:");
console.log("       cd ~ && tar -xzf cualauto-backend-bundle.tar.gz");
console.log("       mv dist-bundle cualauto-backend");
console.log("  3. Crea .env y sigue README-DEPLOY.md");
console.log("");