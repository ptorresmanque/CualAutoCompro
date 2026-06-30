import { describe, it, expect, beforeEach } from "vitest";
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
    expect(u.passwordHash).not.toBe("secreto123");
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
