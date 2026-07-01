import { describe, expect, it } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "./role.middleware.js";
import { AppError } from "../../shared/errors.js";

const mockReq = (user: Express.Request["user"]): Request =>
  ({ user }) as unknown as Request;

const mockRes = (): Response => ({} as Response);
const mockNext = (): NextFunction & { called: boolean; err?: unknown } => {
  const fn = ((err?: unknown) => {
    fn.called = true;
    fn.err = err;
  }) as NextFunction & { called: boolean; err?: unknown };
  fn.called = false;
  return fn;
};

describe("requireRole", () => {
  it("sin user → unauthorized", () => {
    const next = mockNext();
    requireRole("ADMIN")(mockReq(undefined), mockRes(), next);
    expect(next.called).toBe(true);
    expect(next.err).toBeInstanceOf(AppError);
    expect((next.err as AppError).code).toBe("UNAUTHORIZED");
  });

  it("USER intentando ADMIN → forbidden", () => {
    const next = mockNext();
    requireRole("ADMIN")(mockReq({ id: "u1", email: "a@b.c", name: "x", role: "USER" }), mockRes(), next);
    expect((next.err as AppError).code).toBe("FORBIDDEN");
  });

  it("ADMIN accediendo ADMIN → next sin error", () => {
    const next = mockNext();
    requireRole("ADMIN")(mockReq({ id: "u1", email: "a@b.c", name: "x", role: "ADMIN" }), mockRes(), next);
    expect(next.called).toBe(true);
    expect(next.err).toBeUndefined();
  });
});
