import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { VersionsService } from "./versions.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("VersionsService + extendEnum", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    const toyota = await prisma.brand.create({ data: { name: "Toyota" } });
    await prisma.model.create({
      data: { brandId: toyota.id, name: "Yaris", segment: "HATCHBACK" },
    });
  });

  afterEach(async () => {
    // Reset version table only; enum extensions persist across tests (harmless).
    await prisma.version.deleteMany();
  });

  it("create() crea una versión con fuel y transmission nuevos (extiende enum)", async () => {
    const svc = new VersionsService(prisma);
    const model = await prisma.model.findFirstOrThrow({ where: { name: "Yaris" } });
    const newFuel = `TEST_FUEL_${Date.now()}`;
    const newTrans = `TEST_TRANS_${Date.now()}`;
    const created = await svc.create({
      modelId: model.id,
      name: `Versión Test ${Date.now()}`,
      year: 2026,
      priceClp: 1000000,
      transmission: newTrans,
      fuel: newFuel,
      engineDisplacementCc: 0,
      powerHp: 0,
      torqueNm: 0,
      consumptionCityKmL: 0,
      consumptionHighwayKmL: 0,
      lengthMm: 0,
      widthMm: 0,
      heightMm: 0,
      weightKg: 0,
      trunkLiters: 0,
      airbagCount: 0,
      hasAbs: false,
      hasEsp: false,
      hasCruiseControl: false,
    });
    expect(created.fuel).toBe(newFuel);
    expect(created.transmission).toBe(newTrans);
  });

  it("update() extiende el enum cuando se cambia fuel/transmission a valores nuevos", async () => {
    const svc = new VersionsService(prisma);
    const model = await prisma.model.findFirstOrThrow({ where: { name: "Yaris" } });
    const created = await svc.create({
      modelId: model.id,
      name: "Versión Base",
      year: 2026,
      priceClp: 1000000,
      transmission: "MANUAL",
      fuel: "BENCINA",
      engineDisplacementCc: 0,
      powerHp: 0,
      torqueNm: 0,
      consumptionCityKmL: 0,
      consumptionHighwayKmL: 0,
      lengthMm: 0,
      widthMm: 0,
      heightMm: 0,
      weightKg: 0,
      trunkLiters: 0,
      airbagCount: 0,
      hasAbs: false,
      hasEsp: false,
      hasCruiseControl: false,
    });
    const newFuel = `TEST_UPD_FUEL_${Date.now()}`;
    const newTrans = `TEST_UPD_TRANS_${Date.now()}`;
    const updated = await svc.update(created.id, {
      fuel: newFuel,
      transmission: newTrans,
    });
    expect(updated.fuel).toBe(newFuel);
    expect(updated.transmission).toBe(newTrans);
  });
});