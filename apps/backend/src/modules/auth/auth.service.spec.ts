import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthService } from "./auth.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("AuthService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("registra un usuario nuevo con password hasheado", async () => {
    const svc = new AuthService(prisma);
    const u = await svc.register({ email: "patricio" + "@" + "test.cl", password: "secreto123", name: "Patricio" });
    expect(u.email).toBe("patricio" + "@" + "test.cl");
    expect(u.name).toBe("Patricio");
    expect(u.role).toBe("USER");
    const dbUser = await prisma.user.findUnique({ where: { email: "patricio" + "@" + "test.cl" } });
    expect(dbUser?.passwordHash).not.toBe("secreto123");
    expect(dbUser?.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("rechaza email duplicado con CONFLICT", async () => {
    const svc = new AuthService(prisma);
    await svc.register({ email: "ana" + "@" + "test.cl", password: "secreto123", name: "Ana" });
    await expect(
      svc.register({ email: "ana" + "@" + "test.cl", password: "otro1234", name: "Bea" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("login retorna usuario + token si credenciales OK", async () => {
    const svc = new AuthService(prisma);
    await svc.register({ email: "xime" + "@" + "test.cl", password: "secreto123", name: "Ximena" });
    const r = await svc.login({ email: "xime" + "@" + "test.cl", password: "secreto123" });
    expect(r.user.email).toBe("xime" + "@" + "test.cl");
    expect(r.token).toBeTypeOf("string");
  });

  it("login rechaza password incorrecto con UNAUTHORIZED", async () => {
    const svc = new AuthService(prisma);
    await svc.register({ email: "xime" + "@" + "test.cl", password: "secreto123", name: "Ximena" });
    await expect(svc.login({ email: "xime" + "@" + "test.cl", password: "mala" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
describe("AuthService.forgotPassword/resetPassword", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("genera token y lo persiste cuando el email existe", async () => {
    const svc = new AuthService(prisma);
    await prisma.user.create({
      data: {
        email: "forgot@example.com",
        name: "Forgot",
        passwordHash: "x",
      },
    });
    const result = await svc.forgotPassword("forgot@example.com");
    expect(result.token).not.toBeNull();
    expect(result.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    const stored = await prisma.user.findUnique({
      where: { email: "forgot@example.com" },
    });
    expect(stored!.resetPasswordToken).toBe(result.token);
    expect(stored!.resetPasswordExpiresAt).toEqual(result.expiresAt);
  });

  it("retorna null silenciosamente si el email no existe (no leak)", async () => {
    const svc = new AuthService(prisma);
    const result = await svc.forgotPassword("nobody@example.com");
    expect(result.token).toBeNull();
    expect(result.expiresAt).toBeNull();
  });

  it("resetPassword actualiza el hash y limpia el token", async () => {
    const svc = new AuthService(prisma);
    const passwordHash = await import("bcrypt").then((b) =>
      b.hash("old-password", 4),
    );
    await prisma.user.create({
      data: {
        email: "reset@example.com",
        name: "Reset",
        passwordHash,
      },
    });
    const { token } = await svc.forgotPassword("reset@example.com");
    expect(token).toBeTruthy();
    await svc.resetPassword(token!, "new-password1");

    const user = await prisma.user.findUnique({
      where: { email: "reset@example.com" },
    });
    expect(user!.resetPasswordToken).toBeNull();
    expect(user!.resetPasswordExpiresAt).toBeNull();
    const bcrypt = await import("bcrypt");
    expect(await bcrypt.compare("new-password1", user!.passwordHash!)).toBe(true);
  });

  it("resetPassword rechaza tokens expirados", async () => {
    const svc = new AuthService(prisma);
    await prisma.user.create({
      data: {
        email: "expired@example.com",
        name: "Expired",
        passwordHash: "x",
        resetPasswordToken: "old-token",
        resetPasswordExpiresAt: new Date(Date.now() - 1000),
      },
    });
    await expect(
      svc.resetPassword("old-token", "new-password1"),
    ).rejects.toThrow("Token inválido o expirado");
  });
});
