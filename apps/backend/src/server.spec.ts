import { describe, it, expect, afterEach, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { createServer, withGracefulShutdown } from "./server.js";

describe("createServer", () => {
  let server: Server | undefined;

  afterEach(() => {
    server?.close();
    server = undefined;
  });

  it("configura keepAliveTimeout = 30s y headersTimeout = 31s por defecto", () => {
    server = createServer(express());
    expect(server!.keepAliveTimeout).toBe(30_000);
    expect(server!.headersTimeout).toBe(31_000);
  });

  it("acepta overrides via options", () => {
    server = createServer(express(), { keepAliveTimeoutMs: 5_000, headersTimeoutMs: 6_000 });
    expect(server!.keepAliveTimeout).toBe(5_000);
    expect(server!.headersTimeout).toBe(6_000);
  });

  it("headersTimeout es estrictamente mayor que keepAliveTimeout (requisito de Node)", () => {
    server = createServer(express(), { keepAliveTimeoutMs: 10_000, headersTimeoutMs: 10_500 });
    expect(server!.headersTimeout).toBeGreaterThan(server!.keepAliveTimeout);
  });
});

describe("withGracefulShutdown", () => {
  let server: Server | undefined;
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    server?.close();
    server = undefined;
  });

  it("invoca el shutdownFn al recibir SIGTERM", async () => {
    server = createServer(express());
    const shutdownFn = vi.fn().mockResolvedValue(undefined);

    // onCompleted = noop: no queremos que el handler llame process.exit()
    // y mate al test runner.
    cleanup = withGracefulShutdown(server!, shutdownFn, () => {});
    process.emit("SIGTERM");

    await new Promise((resolve) => setImmediate(resolve));
    expect(shutdownFn).toHaveBeenCalledTimes(1);
  });

  it("invoca el shutdownFn al recibir SIGINT", async () => {
    server = createServer(express());
    const shutdownFn = vi.fn().mockResolvedValue(undefined);

    cleanup = withGracefulShutdown(server!, shutdownFn, () => {});
    process.emit("SIGINT");

    await new Promise((resolve) => setImmediate(resolve));
    expect(shutdownFn).toHaveBeenCalledTimes(1);
  });

  it("es idempotente: una sola invocacion aunque reciba varias senales seguidas", async () => {
    server = createServer(express());
    const shutdownFn = vi.fn().mockResolvedValue(undefined);

    cleanup = withGracefulShutdown(server!, shutdownFn, () => {});
    process.emit("SIGTERM");
    process.emit("SIGINT");
    process.emit("SIGTERM");

    await new Promise((resolve) => setImmediate(resolve));
    expect(shutdownFn).toHaveBeenCalledTimes(1);
  });

  it("desregistra handlers cuando se llama al cleanup", async () => {
    server = createServer(express());
    const shutdownFn = vi.fn().mockResolvedValue(undefined);

    cleanup = withGracefulShutdown(server!, shutdownFn, () => {});
    cleanup();
    cleanup = undefined;

    process.emit("SIGTERM");
    await new Promise((resolve) => setImmediate(resolve));
    expect(shutdownFn).not.toHaveBeenCalled();
  });
});
