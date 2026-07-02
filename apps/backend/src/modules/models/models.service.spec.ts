import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ModelsService } from "./models.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("ModelsService + extendEnum", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    await prisma.brand.create({ data: { name: "Toyota" } });
  });

  afterEach(async () => {
    // Reset model table only; enum extensions persist across tests (harmless).
    await prisma.model.deleteMany();
  });

  it("create() crea un modelo con un segmento nuevo (extiende enum)", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const newSegment = `TEST_NEW_SEG_${Date.now()}`;
    const created = await svc.create({
      brandId: brand.id,
      name: `Modelo Test ${Date.now()}`,
      segment: newSegment,
      imageUrl: null,
      galleryUrls: [],
    });
    expect(created.segment).toBe(newSegment);
  });

  it("create() rechaza segmento con formato inválido antes de tocar la DB", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    await expect(
      svc.create({
        brandId: brand.id,
        name: "X",
        segment: "invalid-lowercase",
        imageUrl: null,
        galleryUrls: [],
      }),
    ).rejects.toThrow(/Valor inválido/);
  });

  it("update() extiende el enum cuando se cambia el segmento a un valor nuevo", async () => {
    const svc = new ModelsService(prisma);
    const brand = await prisma.brand.findFirstOrThrow({ where: { name: "Toyota" } });
    const created = await svc.create({
      brandId: brand.id,
      name: "Modelo Update",
      segment: "SEDAN",
      imageUrl: null,
      galleryUrls: [],
    });
    const newSegment = `TEST_UPD_SEG_${Date.now()}`;
    const updated = await svc.update(created.id, { segment: newSegment });
    expect(updated.segment).toBe(newSegment);
  });
});