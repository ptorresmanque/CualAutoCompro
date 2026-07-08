import http from "node:http";
import type { Express } from "express";
import { prisma } from "./infra/prisma.js";

const DEFAULT_KEEPALIVE_TIMEOUT_MS = 30_000;
const DEFAULT_HEADERS_TIMEOUT_MS = 31_000;
const DEFAULT_SHUTDOWN_HARD_TIMEOUT_MS = 10_000;

export interface ServerOptions {
  keepAliveTimeoutMs?: number;
  headersTimeoutMs?: number;
}

export type ShutdownFn = () => Promise<void> | void;

/**
 * Envuelve `app` en un `http.Server` con tuning de keepAlive/headers
 * apropriado para hostings con LVE (CloudLinux/cPanel).
 *
 * Por que:
 *   - Bajo LVE, cada conexión TCP abierta cuenta como Entry Process (EP).
 *     Sin tuning explicito, los defaults de Node son largos y pueden agotar EP.
 *   - `headersTimeout` debe ser estrictamente mayor que `keepAliveTimeout`
 *     por requisito del spec de Node (`ERR_HTTP_HEADERS_SENT` sino).
 */
export const createServer = (
  app: Express,
  options: ServerOptions = {},
): http.Server => {
  const server = http.createServer(app);
  server.keepAliveTimeout = options.keepAliveTimeoutMs ?? DEFAULT_KEEPALIVE_TIMEOUT_MS;
  server.headersTimeout = options.headersTimeoutMs ?? DEFAULT_HEADERS_TIMEOUT_MS;
  return server;
};

/**
 * Ejecuta el shutdown de forma idempotente:
 *   1. Llama `shutdownFn()` (cierra HTTP server + desconecta Prisma por defecto).
 *   2. Cuando termina, llama `onCompleted()` (por defecto `process.exit(0)`).
 *   3. Hard timeout: si nada termina, sale con codigo 1.
 *
 * Devuelve una tupla `[promise, cancel]` donde cancel desregistra ambos signals.
 */
export const withGracefulShutdown = (
  server: http.Server,
  shutdownFn: ShutdownFn = defaultShutdown(server),
  onCompleted: () => void = () => process.exit(0),
): (() => void) => {
  let triggered = false;

  const handler = (signal: NodeJS.Signals) => {
    if (triggered) return;
    triggered = true;

    // eslint-disable-next-line no-console
    console.log(`[${signal}] shutdown iniciado`);

    Promise.resolve(shutdownFn())
      .then(() => {
        // eslint-disable-next-line no-console
        console.log("[shutdown] OK");
        onCompleted();
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("[shutdown] error:", err);
        process.exit(1);
      });

    // Hard timeout para no quedarse colgado si algo no cierra.
    // `unref` evita que el timer bloquee la salida cuando todo va bien.
    const t = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.error(
        `[shutdown] timeout > ${DEFAULT_SHUTDOWN_HARD_TIMEOUT_MS}ms, forzando exit(1)`,
      );
      process.exit(1);
    }, DEFAULT_SHUTDOWN_HARD_TIMEOUT_MS);
    t.unref();
  };

  const onSigterm = () => handler("SIGTERM");
  const onSigint = () => handler("SIGINT");
  process.on("SIGTERM", onSigterm);
  process.on("SIGINT", onSigint);

  return () => {
    process.off("SIGTERM", onSigterm);
    process.off("SIGINT", onSigint);
  };
};

const defaultShutdown =
  (server: http.Server): ShutdownFn =>
  async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await prisma.$disconnect();
  };
