#!/usr/bin/env node
/**
 * Monitoreo de conexiones MySQL inactivas (Sleep) de este backend.
 *
 * Por que existe:
 *   En hostings con LVE (cPanel/CloudLinux) cada conexion TCP abierta cuenta
 *   como Entry Process (EP). Aunque apps/backend/__tests__/env-connection-limit.spec.ts
 *   garantiza connection_limit=10 + timeouts bajos en el pool Prisma, igual
 *   pueden quedar conexiones MySQL inactivas (Sleep) mucho tiempo si:
 *     - hay un reload de tsx watch sin disconnect limpio
 *     - el server MySQL tiene wait_timeout alto (default 28800s = 8h)
 *     - hay un query colgada que socket_timeout=30 no termina de cerrar
 *
 *   Este script detecta esos casos y avisa antes de que se acumulen a niveles
 *   que agoten los EPs del shared host.
 *
 * Uso:
 *   node scripts/check-db-connections.mjs
 *   node scripts/check-db-connections.mjs --warn-after-seconds 60 --critical-after-seconds 300
 *
 * Exit codes:
 *   0 = todo OK (cero sleep, o sleeps cortos)
 *   1 = hay sleeps que pasan el umbral de warning (log warning, no falla en CI)
 *   2 = hay sleeps que pasan el umbral critico (falla la corrida)
 *
 * NO es un fix automatico. Solo mira y reporta. El fix real es server-side
 * (reducir wait_timeout en MariaDB) o migrar a Prisma 6+ para tener
 * max_idle_connection_lifetime nativo.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

const DEFAULT_WARN_SECONDS = 120;
const DEFAULT_CRITICAL_SECONDS = 600;

function parseArgs(argv) {
  const args = { warn: DEFAULT_WARN_SECONDS, critical: DEFAULT_CRITICAL_SECONDS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--warn-after-seconds") args.warn = Number(argv[++i]);
    else if (a === "--critical-after-seconds") args.critical = Number(argv[++i]);
    else if (a === "--help" || a === "-h") {
      console.log(
        "Uso: node scripts/check-db-connections.mjs [--warn-after-seconds N] [--critical-after-seconds N]",
      );
      process.exit(0);
    }
  }
  return args;
}

function loadDatabaseUrl() {
  const candidates = [
    path.join(backendRoot, ".env.development"),
    path.join(backendRoot, ".env"),
  ];
  for (const filepath of candidates) {
    if (!existsSync(filepath)) continue;
    const content = readFileSync(filepath, "utf8");
    const match = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
    if (match) {
      return match[1].trim();
    }
  }
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  console.error("check-db-connections: DATABASE_URL no encontrado (.env, .env.development o env var).");
  process.exit(2);
}

function parseMysqlUrl(url) {
  const u = new URL(url);
  if (!u.protocol.startsWith("mysql")) {
    console.error(`check-db-connections: protocolo no soportado: ${u.protocol}`);
    process.exit(2);
  }
  return {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    host: u.hostname,
    port: u.port || "3306",
  };
}

function runMysqlQuery(auth, sql) {
  const args = [
    "-h",
    auth.host,
    "-P",
    auth.port,
    "-u",
    auth.user,
    `-p${auth.password}`,
    "-N",
    "-B",
    "-e",
    sql,
  ];
  const result = spawnSync("mysql", args, { encoding: "utf8" });
  if (result.status !== 0) {
    return { ok: false, stderr: result.stderr || "" };
  }
  return { ok: true, stdout: result.stdout || "" };
}

function listMySqlSleeps(auth) {
  const sql = `SELECT id, time FROM information_schema.processlist WHERE user='${auth.user.replace(/'/g, "''")}' AND command='Sleep' ORDER BY time DESC;`;
  const r = runMysqlQuery(auth, sql);
  if (!r.ok) {
    // Fallback: show all sleeps sorted by time and let user filter
    const fallbackSql = `SELECT id, user, time FROM information_schema.processlist WHERE command='Sleep' ORDER BY time DESC;`;
    const r2 = runMysqlQuery(auth, fallbackSql);
    if (!r2.ok) return { ok: false, stderr: r2.stderr };
    const rows = r2.stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [id, user, time] = line.split("\t");
      return { id, user, time: Number(time) };
    });
    return { ok: true, rows, scoped: false };
  }
  const rows = r.stdout.trim().split("\n").filter(Boolean).map((line) => {
    const [id, time] = line.split("\t");
    return { id, time: Number(time) };
  });
  return { ok: true, rows, scoped: true };
}

function formatSeconds(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m${s % 60}s`;
  return `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m`;
}

function main() {
  const { warn, critical } = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(warn) || !Number.isFinite(critical) || warn < 1 || critical < warn) {
    console.error(
      `check-db-connections: umbrales invalidos. warn=${warn} critical=${critical} (critical debe ser > warn)`,
    );
    process.exit(2);
  }

  const dbUrl = loadDatabaseUrl();
  const auth = parseMysqlUrl(dbUrl);

  const r = listMySqlSleeps(auth);
  if (!r.ok) {
    console.error(`check-db-connections: fallo consultando MariaDB: ${r.stderr.trim()}`);
    process.exit(2);
  }

  const ourSleeps = r.scoped
    ? r.rows
    : r.rows.filter((row) => row.user === auth.user);
  const ourTotal = ourSleeps.length;
  const warnings = ourSleeps.filter((row) => row.time >= warn);
  const criticals = ourSleeps.filter((row) => row.time >= critical);

  console.log(
    `[check-db-connections] user=${auth.user} host=${auth.host}:${auth.port} total_sleeps=${ourTotal} warn>=${warn}s critical>=${critical}s`,
  );

  if (ourTotal === 0) {
    console.log("[check-db-connections] OK: sin conexiones Sleep.");
    process.exit(0);
  }

  for (const row of ourSleeps) {
    const tag = row.time >= critical ? "CRITICAL" : row.time >= warn ? "WARN" : "info";
    console.log(`  [${tag}] id=${row.id} time=${formatSeconds(row.time)}`);
  }

  if (criticals.length > 0) {
    console.error(
      `[check-db-connections] ${criticals.length} conexion(es) Sleep superan ${critical}s. Probable leak o wait_timeout muy alto.`,
    );
    process.exit(2);
  }
  if (warnings.length > 0) {
    console.warn(
      `[check-db-connections] ${warnings.length} conexion(es) Sleep superan ${warn}s. Monitorear tendencia.`,
    );
    process.exit(1);
  }
  console.log("[check-db-connections] OK dentro de umbrales.");
  process.exit(0);
}

main();
