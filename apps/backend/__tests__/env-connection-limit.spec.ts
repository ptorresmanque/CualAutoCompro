import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

/**
 * Garantia: las plantillas commiteadas de variables de entorno deben declarar
 * en DATABASE_URL un pool chico y timeouts que eviten EP exhaustion en
 * cPanel/CloudLinux con LVE, y que corten queries/sockets/conexiones idle.
 *
 * Parametros y limites:
 *   - connection_limit: <= 10 (pool chico para dejar EP headroom)
 *   - connect_timeout:  <= 10s (cuanto espera Prisma al abrir socket TCP)
 *   - socket_timeout:  <= 30s (cuanto puede colgar una query en el server)
 *   - pool_timeout:    <= 10s (cuanto espera Prisma un slot libre en el pool)
 *   - max_idle_connection_lifetime: <= 300s (cerrar conexiones MySQL idle)
 *
 * Por que este contrato:
 *   - Sin connection_limit, Prisma default = num_cpus * 2 + 1 (~13).
 *     Cada conexion TCP abierta cuenta como EP bajo LVE.
 *   - connect_timeout corto limita huecos cuando la DB no responde al conectar.
 *   - socket_timeout corto mata queries zombie que consumieron un slot del pool
 *     indefinidamente (escenario "query colgada por bug en codigo de aplicacion").
 *   - pool_timeout corto hace que las requests fallen rapido en vez de hacer
 *     queue indefinida si el pool esta saturado.
 *   - max_idle_connection_lifetime es la feature introducida en Prisma 6 que
 *     cierra conexiones MySQL inactivas tras N segundos. Sin esto, en shared
 *     hosting las conexiones Sleep se acumulan hasta que MariaDB las mate por
 *     wait_timeout (default 28800s = 8h, fuera de nuestro control). Limite
 *     conservador: 300s (default de Prisma 6) — reduce el inventario de EPs
 *     inactivos a 5 min de "trabajo reciente".
 *
 * Si alguien sube estos limites sin justificacion documentada, el test falla y
 * se obliga a la conversacion de "tenemos EP headroom?" / "que query se cuelga?"
 * / "tenemos budget para conexiones idle?".
 *
 * NOTA: max_idle_connection_lifetime requiere Prisma 6+. En Prisma 5 las
 * conexiones idle se cierran solo en shutdown del proceso (server.ts) o
 * cuando el server MySQL las mata por wait_timeout (default 8h).
 */

const readEnvExample = (filename: string): string => {
  const filepath = path.join(backendRoot, filename);
  return readFileSync(filepath, "utf8");
};

const extractDbUrl = (envContent: string): string | null => {
  const match = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  return match ? (match[1] ?? null) : null;
};

const readParam = (dbUrl: string, name: string): number | null => {
  const match = dbUrl.match(new RegExp(`[?&]${name}=(\\d+)`));
  return match ? Number(match[1]) : null;
};

const MAX_CONNECTION_LIMIT = 10;
const MAX_CONNECT_TIMEOUT = 10;
const MAX_SOCKET_TIMEOUT = 30;
const MAX_POOL_TIMEOUT = 10;
const MAX_IDLE_CONNECTION_LIFETIME = 300;

interface PoolContract {
  filename: string;
  connectionLimit: number;
  connectTimeout: number;
  socketTimeout: number;
  poolTimeout: number;
  maxIdleConnectionLifetime: number;
}

const readPoolContract = (filename: string): PoolContract => {
  const content = readEnvExample(filename);
  const dbUrl = extractDbUrl(content);
  if (!dbUrl) {
    throw new Error(`${filename}: DATABASE_URL no declarado`);
  }
  return {
    filename,
    connectionLimit: readParam(dbUrl, "connection_limit") ?? -1,
    connectTimeout: readParam(dbUrl, "connect_timeout") ?? -1,
    socketTimeout: readParam(dbUrl, "socket_timeout") ?? -1,
    poolTimeout: readParam(dbUrl, "pool_timeout") ?? -1,
    maxIdleConnectionLifetime: readParam(dbUrl, "max_idle_connection_lifetime") ?? -1,
  };
};

const expectContract = (c: PoolContract): void => {
  const dbUrl = extractDbUrl(readEnvExample(c.filename)) ?? "";
  expect(
    c.connectionLimit,
    `${c.filename}: DATABASE_URL debe incluir connection_limit=N (1 <= N <= ${MAX_CONNECTION_LIMIT}). Encontrado: ${dbUrl || "(vacio)"}`,
  ).toBeGreaterThanOrEqual(1);
  expect(c.connectionLimit).toBeLessThanOrEqual(MAX_CONNECTION_LIMIT);

  expect(
    c.connectTimeout,
    `${c.filename}: DATABASE_URL debe incluir connect_timeout=N (1 <= N <= ${MAX_CONNECT_TIMEOUT}s). Encontrado: ${dbUrl || "(vacio)"}`,
  ).toBeGreaterThanOrEqual(1);
  expect(c.connectTimeout).toBeLessThanOrEqual(MAX_CONNECT_TIMEOUT);

  expect(
    c.socketTimeout,
    `${c.filename}: DATABASE_URL debe incluir socket_timeout=N (1 <= N <= ${MAX_SOCKET_TIMEOUT}s). Encontrado: ${dbUrl || "(vacio)"}`,
  ).toBeGreaterThanOrEqual(1);
  expect(c.socketTimeout).toBeLessThanOrEqual(MAX_SOCKET_TIMEOUT);

  expect(
    c.poolTimeout,
    `${c.filename}: DATABASE_URL debe incluir pool_timeout=N (1 <= N <= ${MAX_POOL_TIMEOUT}s). Encontrado: ${dbUrl || "(vacio)"}`,
  ).toBeGreaterThanOrEqual(1);
  expect(c.poolTimeout).toBeLessThanOrEqual(MAX_POOL_TIMEOUT);

  expect(
    c.maxIdleConnectionLifetime,
    `${c.filename}: DATABASE_URL debe incluir max_idle_connection_lifetime=N (Prisma 6+, 1 <= N <= ${MAX_IDLE_CONNECTION_LIFETIME}s). Cerrar conexiones MySQL inactivas tras ${MAX_IDLE_CONNECTION_LIFETIME}s evita acumular EPs en shared hosting. Encontrado: ${dbUrl || "(vacio)"}`,
  ).toBeGreaterThanOrEqual(1);
  expect(c.maxIdleConnectionLifetime).toBeLessThanOrEqual(MAX_IDLE_CONNECTION_LIFETIME);
};

describe("DATABASE_URL pool + timeouts (LVE/EP safety)", () => {
  it(".env.example", () => {
    expectContract(readPoolContract(".env.example"));
  });

  it(".env.development.example", () => {
    expectContract(readPoolContract(".env.development.example"));
  });
});
