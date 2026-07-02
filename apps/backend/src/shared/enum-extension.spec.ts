import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { extendEnum, type EnumName } from "./enum-extension.js";

const prisma = new PrismaClient();

describe("extendEnum", () => {
  beforeEach(async () => {
    // Conexión al test DB (pglite configurado en vitest.config.ts)
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("rechaza valores con caracteres no permitidos (anti-SQL-injection)", async () => {
    await expect(extendEnum(prisma, "Segment", "lowercase")).rejects.toThrow(/Valor inválido/);
    await expect(extendEnum(prisma, "Segment", "BAD-VALUE")).rejects.toThrow(/Valor inválido/);
    await expect(extendEnum(prisma, "Segment", "")).rejects.toThrow(/Valor inválido/);
    await expect(
      extendEnum(prisma, "Segment", "'; DROP TABLE \"Model\"; --"),
    ).rejects.toThrow(/Valor inválido/);
  });

  it("agrega un valor nuevo al enum Segment y permite usarlo", async () => {
    const newValue = `TEST_SEGMENT_${Date.now()}`;
    await extendEnum(prisma, "Segment", newValue);
    await expect(
      prisma.$queryRawUnsafe<{ enumlabel: string }[]>(
        `SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Segment')`,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ enumlabel: newValue })]),
    );
  });

  it("es idempotente: llamar 2 veces con el mismo valor no rompe", async () => {
    const newValue = `TEST_DUP_${Date.now()}`;
    await extendEnum(prisma, "Fuel", newValue);
    await expect(extendEnum(prisma, "Fuel", newValue)).resolves.not.toThrow();
  });
});
