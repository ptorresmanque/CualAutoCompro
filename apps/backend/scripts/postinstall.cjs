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
//   - Si lo estamos, OMITE 'prisma generate' con exit 0 y muestra las
//     instrucciones para usar un cliente pre-generado desde la maquina
//     de desarrollo. Asi 'npm ci' no falla aunque no haya cliente generado.
//   - En entornos de desarrollo (>= 2GB RAM, sin LVE) ejecuta 'prisma
//     generate' normalmente como antes.
//
// Como pre-generar el cliente en otra maquina:
//   1. pnpm install
//   2. pnpm exec prisma generate  (o el postinstall se ejecuta solo)
//   3. Subir apps/backend/node_modules/.prisma/client/ al server, dentro
//      de node_modules/.prisma/client/

const { execSync } = require("node:child_process");
const os = require("node:os");
const fs = require("node:fs");

const MIN_RAM_GB = 2;

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
    // v2: "0::/path"
    // v1: "N:cpu,cpuacct:/path"
    for (const line of data.split("\n")) {
      const parts = line.split(":");
      if (parts.length < 3) continue;
      const path = parts[2] || "";
      const v2File = `/sys/fs/cgroup${path}/memory.max`;
      const v1File = `/sys/fs/cgroup${path}/memory.limit_in_bytes`;
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
  console.log("[postinstall] Para usar Prisma en este server, pre-genera el");
  console.log("[postinstall] cliente desde una maquina con mas memoria:");
  console.log("[postinstall]");
  console.log("[postinstall]   # En tu maquina local (o CI):");
  console.log("[postinstall]   pnpm install");
  console.log("[postinstall]   pnpm exec prisma generate");
  console.log("[postinstall]");
  console.log(
    "[postinstall]   # Sube apps/backend/node_modules/.prisma/client/ al server:"
  );
  console.log(
    "[postinstall]   scp -r apps/backend/node_modules/.prisma/ \\\n" +
      "                    usuario@server:~/cualauto-backend/node_modules/"
  );
  console.log(
    "[postinstall]   # Luego en el server instala SIN scripts (saltando este postinstall):"
  );
  console.log(
    "[postinstall]   cd ~/cualauto-backend && npm ci --omit=dev --ignore-scripts"
  );
  console.log("[postinstall]");
  process.exit(0);
}

try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (err) {
  console.error("[postinstall] 'prisma generate' fallo:", err.message);
  process.exit(err.status || 1);
}