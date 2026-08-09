import { describe, expect, it, vi } from "vitest";
import { rateLimiter } from "./rate-limit.js";

describe("rateLimiter", () => {
  it("deja pasar hasta `max` y bloquea el siguiente", () => {
    const check = rateLimiter(1000, 3);
    expect([check("ip"), check("ip"), check("ip")]).toEqual([false, false, false]);
    expect(check("ip")).toBe(true);
  });

  it("cuenta por clave, no globalmente", () => {
    const check = rateLimiter(1000, 1);
    expect(check("a")).toBe(false);
    expect(check("b")).toBe(false);
    expect(check("a")).toBe(true);
  });

  it("libera cupo cuando la ventana se corre", () => {
    vi.useFakeTimers();
    try {
      const check = rateLimiter(1000, 1);
      expect(check("ip")).toBe(false);
      expect(check("ip")).toBe(true);
      vi.advanceTimersByTime(1001);
      expect(check("ip")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  // Si un intento bloqueado se contara, un cliente que insiste se extiende la
  // ventana solo y nunca vuelve a entrar.
  it("un intento bloqueado no corre la ventana", () => {
    vi.useFakeTimers();
    try {
      const check = rateLimiter(1000, 1);
      expect(check("ip")).toBe(false);
      vi.advanceTimersByTime(800);
      expect(check("ip")).toBe(true);
      vi.advanceTimersByTime(201);
      expect(check("ip")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reset() vacía los buckets", () => {
    const check = rateLimiter(1000, 1);
    expect(check("ip")).toBe(false);
    expect(check("ip")).toBe(true);
    check.reset();
    expect(check("ip")).toBe(false);
  });
});
