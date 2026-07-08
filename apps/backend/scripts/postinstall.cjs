// Wrapper de postinstall que evita el Out of Memory (OOM) en servidores
// con memoria limitada (cPanel + CloudLinux LVE, hostings compartidos).
//
// Por que existe:
//   Prisma 5.x carga un modulo WebAssembly (prisma_schema_build_bg.wasm)
//   para parsear el schema. La inicializacion del Wasm pide una memoria
//   inicial grande que el LVE de CloudLinux no permite asignar, lanzando:
//
//     RangeError: WebAssembly.Instance(): Out of memory:
//       Cannot allocate Wasm memory for new instance
//
//   Esto pasa en TODOS los hostings con LVE independientemente de
//   binaryTargets (que solo afecta que binarios del query engine se
//   descargan, no la inicializacion del Wasm del schema).
//
// Que hace este script:
//   - Detecta si estamos en un entorno con poca memoria (LVE o < 2GB RAM).
//   - Si lo estamos:
//       1. Omite 'prisma generate' (evita el OOM).
//       2. Copia el cliente Prisma pre-generado desde
//          apps/backend/vendor/prisma-client/ al lugar correcto en
//          node_modules/. Asi el backend arranca sin necesidad de
//          generar nada.
//       3. Si el vendor no existe, da instrucciones para crearlo.
//   - En entornos de desarrollo (>= 2GB RAM, sin LVE) ejecuta
//     'prisma generate' normalmente.
//
// Como pre-generar y commitear el vendor:
//   1. Local: npm install && npx prisma generate
//   2. Local: npm run vendor:prisma -w apps/backend
//   3. Local: git add apps/backend/vendor/ && git commit && git push

const { execSync } = require("node:child_process");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

const MIN_RAM_GB = 2;
const APP_ROOT = path.join(__dirname, "..");
const VENDORED_DIR = path.join(APP_ROOT, "vendor", "prisma-client");

function detectLVE() {
  try {
    const cgroups = fs.readFileSync("/proc/self/cgroup", "utf8");
    return /lve|cloudlinux/i.test(cgroups);
  } catch {
    return false;
  }
}

function detectCgroupMemoryLimitMB() {
  try {
    const data = fs.readFileSync("/proc/self/cgroup", "utf8");
    for (const line of data.split("\n")) {
      const parts = line.split(":");
      if (parts.length < 3) continue;
      const cgroupPath = parts[2] || "";
      const v2File = `/sys/fs/cgroup${cgroupPath}/memory.max`;
      const v1File = `/sys/fs/cgroup${cgroupPath}/memory.limit_in_bytes`;
      if (fs.existsSync(v2File)) {
        const v = fs.readFileSync(v2File, "utf8").trim();
        if (v !== "max") return Math.floor(parseInt(v, 10) / 1024 / 1024);
      } else if (fs.existsSync(v1File)) {
        const v = fs.readFileSync(v1File, "utf8").trim();
        return Math.floor(parseInt(v, 10) / 1024 / 1024);
      }
    }
  } catch {
    // ignore
  }
  return null;
}

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

function findPrismaClientTargetDir() {
  // Encuentra donde esta instalado @prisma/client para colocar
  // .prisma/client/ al lado (mismo node_modules).
  // Layout npm workspace (hoisted a raiz del monorepo):
  //   <repo-root>/node_modules/@prisma/client/index.js
  //   <repo-root>/node_modules/.prisma/client/
  const candidates = [
    path.join(APP_ROOT, "node_modules", "@prisma", "client"),
    path.join(APP_ROOT, "..", "..", "node_modules", "@prisma", "client"),
    path.join(APP_ROOT, "..", "node_modules", "@prisma", "client"),
  ];

  // Intento principal: usar require.resolve con el APP_ROOT como base.
  let resolved;
  try {
    resolved = require.resolve("@prisma/client", { paths: [APP_ROOT] });
  } catch {
    // Fallback: buscar manualmente.
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

  // En npm layout, .prisma/client queda junto a @prisma/client (mismo node_modules).
  const prismaClientDir = path.dirname(resolved); // .../@prisma/client
  const nodeModulesDir = path.dirname(prismaClientDir); // .../node_modules
  return path.join(nodeModulesDir, ".prisma", "client");
}

const totalRAMGB = os.totalmem() / 1024 ** 3;
const isLVE = detectLVE();
const cgroupLimitMB = detectCgroupMemoryLimitMB();
const lowCgroupLimit = cgroupLimitMB !== null && cgroupLimitMB < 2048;
const shouldSkip = isLVE || lowCgroupLimit || totalRAMGB < MIN_RAM_GB;

if (shouldSkip) {
  const reasons = [];
  if (isLVE) reasons.push("LVE/CloudLinux detectado");
  if (lowCgroupLimit) reasons.push(`limite cgroup ${cgroupLimitMB} MB`);
  if (totalRAMGB < MIN_RAM_GB)
    reasons.push(`RAM total del sistema ${totalRAMGB.toFixed(2)} GB`);

  console.log("[postinstall] Omitiendo 'prisma generate' por memoria limitada.");
  console.log(`[postinstall]   Razon: ${reasons.join(", ")}`);
  console.log(
    "[postinstall]   Prisma 5.x inicializa un WebAssembly que excede este limite."
  );
  console.log("[postinstall]");

  if (!fs.existsSync(VENDORED_DIR)) {
    console.log(
      "[postinstall] No se encontro el cliente Prisma pre-generado (vendor)."
    );
    console.log(`[postinstall]   Buscado en: ${VENDORED_DIR}`);
    console.log("[postinstall]");
    console.log("[postinstall] Para que el backend arranque, debes:");
    console.log("[postinstall]   1. En tu maquina local (con memoria suficiente):");
    console.log("[postinstall]      npm install");
    console.log("[postinstall]      npx prisma generate");
    console.log("[postinstall]      npm run vendor:prisma -w apps/backend");
    console.log(
      "[postinstall]      git add apps/backend/vendor/ && git commit && git push"
    );
    console.log(
      "[postinstall]   2. Volver a correr 'npm ci' en el server."
    );
    process.exit(0);
  }

  try {
    const targetDir = findPrismaClientTargetDir();
    console.log("[postinstall] Copiando cliente Prisma pre-generado (vendor):");
    console.log(`[postinstall]   desde: ${VENDORED_DIR}`);
    console.log(`[postinstall]   hacia: ${targetDir}`);
    copyRecursive(VENDORED_DIR, targetDir);
    const indexFile = path.join(targetDir, "index.js");
    if (!fs.existsSync(indexFile)) {
      throw new Error("tras copiar no existe " + indexFile);
    }
    console.log("[postinstall] OK - cliente Prisma instalado desde vendor.");
    process.exit(0);
  } catch (err) {
    console.log(`[postinstall] Error copiando vendor: ${err.message}`);
    console.log(
      "[postinstall] El backend probablemente fallara al primer query Prisma."
    );
    process.exit(0);
  }
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (err) {
  console.error("[postinstall] 'prisma generate' fallo:", err.message);
  process.exit(err.status || 1);
}