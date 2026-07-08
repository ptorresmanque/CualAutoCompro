// Vendea (copia) el cliente Prisma generado a un directorio committeable.
//
// Por que existe:
//   En hostings con LVE (cPanel + CloudLinux) el comando 'prisma generate'
//   falla con 'WebAssembly.Instance(): Out of memory' durante el postinstall
//   de @prisma/client. Este proyecto usa --ignore-scripts en el deploy y
//   tampoco usa postinstall propio, por lo que el cliente Prisma debe venir
//   ya generado dentro del bundle FTP (vendorizado en git) y copiarse
//   manualmente tras npm ci (ver README-DEPLOY.md del bundle).
//
// Que hace:
//   - Verifica que existe el cliente Prisma generado por `npx prisma generate`.
//     Con npm workspaces, las dependencias se hoistean a la raiz del monorepo,
//     por lo que el cliente generado vive en <repo-root>/node_modules/.prisma/client/.
//   - Limpia apps/backend/vendor/prisma-client/.
//   - Copia recursivamente todo el contenido.
//
// Cuando usarlo:
//   1. Tras cambiar el schema.prisma o las binaryTargets.
//   2. Tras actualizar Prisma (cambio de version).
//   3. Antes de hacer deploy a un server con LVE.

const fs = require("node:fs");
const path = require("node:path");

const APP_ROOT = path.join(__dirname, "..");
const TARGET_DIR = path.join(APP_ROOT, "vendor", "prisma-client");

// Posibles ubicaciones del cliente Prisma generado por `prisma generate`.
// En npm workspaces (hoisting), vive en la raiz del monorepo.
const SOURCE_CANDIDATES = [
  path.join(APP_ROOT, "node_modules", ".prisma", "client"),     // apps/backend/node_modules/.prisma/client
  path.join(APP_ROOT, "..", "..", "node_modules", ".prisma", "client"), // repo-root/node_modules/.prisma/client
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
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
  return true;
}

function resolveSourceDir() {
  for (const candidate of SOURCE_CANDIDATES) {
    if (fs.existsSync(path.join(candidate, "index.js"))) {
      return candidate;
    }
  }
  return null;
}

const resolvedSource = resolveSourceDir();
if (!resolvedSource) {
  console.error("[vendor] No existe el cliente Prisma generado.");
  for (const candidate of SOURCE_CANDIDATES) {
    console.error(`[vendor]   Buscado en: ${candidate}`);
  }
  console.error("[vendor]");
  console.error("[vendor] Pasos:");
  console.error("[vendor]   1. npm install");
  console.error("[vendor]   2. npx prisma generate");
  console.error("[vendor]   3. npm run vendor:prisma -w apps/backend");
  process.exit(1);
}

if (fs.existsSync(TARGET_DIR)) {
  fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}

if (!copyRecursive(resolvedSource, TARGET_DIR)) {
  console.error(`[vendor] No se pudo copiar desde ${resolvedSource}`);
  process.exit(1);
}

console.log(`[vendor] Fuente: ${resolvedSource}`);

const totalSize = (() => {
  let bytes = 0;
  function walk(p) {
    for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
      const full = path.join(p, entry.name);
      if (entry.isDirectory()) walk(full);
      else bytes += fs.statSync(full).size;
    }
  }
  walk(TARGET_DIR);
  return bytes;
})();

const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
console.log(`[vendor] OK - cliente Prisma copiado a:`);
console.log(`[vendor]   ${TARGET_DIR}`);
console.log(`[vendor] Tamano total: ${sizeMB} MB`);
console.log("[vendor]");
console.log("[vendor] Para deployar en un server con LVE, commitea los");
console.log("[vendor] archivos y haz push:");
console.log("[vendor]   git add apps/backend/vendor/prisma-client/");
console.log("[vendor]   git commit -m 'chore(be): vendor prisma client'");
console.log("[vendor]   git push");
console.log("[vendor]");
console.log("[vendor] En el server, tras 'npm ci --omit=dev --ignore-scripts',");
console.log("[vendor] hay que copiar el vendor manualmente:");
console.log("[vendor]   mkdir -p node_modules/.prisma");
console.log("[vendor]   cp -r vendor/prisma-client node_modules/.prisma/client");