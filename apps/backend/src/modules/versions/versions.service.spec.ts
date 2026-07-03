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
    await prisma.versionEquipment.deleteMany();
    await prisma.equipmentItem.deleteMany();
    await prisma.version.deleteMany();
  });

  it("listAll incluye equipmentItems con equipmentItem.{id,name,category}", async () => {
    const brand = await prisma.brand.create({ data: { name: `B-listAll-with-${Date.now()}` } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: `M-with-${Date.now()}`, segment: "SEDAN" },
    });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "v1",
        year: 2026,
        priceClp: 100,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1,
        consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1,
        trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true,
      },
    });
    const item = await prisma.equipmentItem.create({
      data: { name: `Aire acondicionado ${Date.now()}`, category: "Confort" },
    });
    await prisma.versionEquipment.create({
      data: { versionId: v.id, equipmentItemId: item.id },
    });

    const svc = new VersionsService(prisma);
    const all = await svc.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.equipmentItems).toHaveLength(1);
    expect(all[0]?.equipmentItems?.[0]?.equipmentItem).toEqual({
      id: item.id,
      name: item.name,
      category: "Confort",
    });
  });

  it("listAll retorna equipmentItems: [] para versiones sin items", async () => {
    const brand = await prisma.brand.create({ data: { name: `B-listAll-empty-${Date.now()}` } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: `M-empty-${Date.now()}`, segment: "SEDAN" },
    });
    await prisma.version.create({
      data: {
        modelId: model.id, name: "v1", year: 2026, priceClp: 0,
        transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
      },
    });

    const svc = new VersionsService(prisma);
    const all = await svc.listAll();
    expect(all[0]?.equipmentItems).toEqual([]);
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