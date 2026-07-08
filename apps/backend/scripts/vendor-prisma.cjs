// Vendea (copia) el cliente Prisma generado a un directorio committeable.
//
// Por que existe:
//   En hostings con LVE (cPanel + CloudLinux) el comando 'prisma generate'
//   falla con 'WebAssembly.Instance(): Out of memory' durante el postinstall.
//   Para esos entornos, el cliente Prisma pre-generado debe venir con el
//   repositorio (vendorizado en git) y copiarse al lugar correcto por el
//   postinstall (que detecta LVE y no intenta regenerar).
//
// Que hace:
//   - Verifica que existe apps/backend/node_modules/.prisma/client/
//     (es decir, que ya se ejecuto 'prisma generate' en una maquina con
//     memoria suficiente).
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
const SOURCE_DIR = path.join(APP_ROOT, "node_modules", ".prisma", "client");
const TARGET_DIR = path.join(APP_ROOT, "vendor", "prisma-client");

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
  // Layout npm workspace (hoisted a raiz del monorepo).
  // Con npm workspaces, las dependencias se instalan en
  // <repo-root>/node_modules/ y apps/backend/node_modules no existe.
  // El cliente Prisma generado queda en <repo-root>/node_modules/.prisma/client/.
  if (fs.existsSync(path.join(SOURCE_DIR, "index.js"))) {
    return SOURCE_DIR;
  }
  return null;
}

const resolvedSource = resolveSourceDir();
if (!resolvedSource) {
  console.error("[vendor] No existe el cliente Prisma generado.");
  console.error(`[vendor]   Buscado en: ${SOURCE_DIR}`);
  console.error(
    "[vendor]   (con npm workspaces debe estar en <repo-root>/node_modules/.prisma/client/)"
  );
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
console.log("[vendor] El postinstall en el server detectara LVE y copiara");
console.log("[vendor] este vendor al lugar correcto en node_modules.");