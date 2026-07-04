import { afterEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { extendEnum } from "./enum-extension.js";

describe("extendEnum (MariaDB no-op)", () => {
  const prisma = new PrismaClient();
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

  it("acepta un valor válido como no-op (no lanza ni toca la DB)", async () => {
    await expect(
      extendEnum(prisma, "Segment", "NEW_VALID_VALUE"),
    ).resolves.not.toThrow();
  });

  it("valida los 3 enums (Segment, Fuel, Transmission)", async () => {
    await expect(extendEnum(prisma, "Segment", "BAD VALUE")).rejects.toThrow();
    await expect(extendEnum(prisma, "Fuel", "BAD VALUE")).rejects.toThrow();
    await expect(extendEnum(prisma, "Transmission", "BAD VALUE")).rejects.toThrow();
    await expect(extendEnum(prisma, "Segment", "GOOD_VALUE")).resolves.not.toThrow();
    await expect(extendEnum(prisma, "Fuel", "GOOD_VALUE")).resolves.not.toThrow();
    await expect(extendEnum(prisma, "Transmission", "GOOD_VALUE")).resolves.not.toThrow();
  });
});
