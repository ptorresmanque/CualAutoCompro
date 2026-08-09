import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { VersionsService } from "./versions.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("VersionsService con enums abiertos", () => {
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
        trunkLiters: 1,
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
        trunkLiters: 0,
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
      hasRecall: false,
    });
    expect(created.fuel).toBe(newFuel);
    expect(created.transmission).toBe(newTrans);
  });

  it("listFuels()/listTransmissions() devuelven los canónicos más los creados con 'Otro'", async () => {
    const svc = new VersionsService(prisma);
    const model = await prisma.model.findFirstOrThrow({ where: { name: "Yaris" } });
    const newFuel = `TEST_FACET_FUEL_${Date.now()}`;
    const newTrans = `TEST_FACET_TRANS_${Date.now()}`;
    await svc.create({
      modelId: model.id,
      name: `Versión Facet ${Date.now()}`,
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
      hasRecall: false,
    });

    const fuels = await svc.listFuels();
    expect(fuels.map((f) => f.id)).toContain(newFuel);
    expect(fuels.map((f) => f.id)).toEqual(expect.arrayContaining(["BENCINA", "ELECTRIC"]));
    expect(fuels.find((f) => f.id === newFuel)?.count).toBe(1);

    const transmissions = await svc.listTransmissions();
    expect(transmissions.map((t) => t.id)).toContain(newTrans);
    expect(transmissions.map((t) => t.id)).toEqual(expect.arrayContaining(["MANUAL", "CVT"]));
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
      hasRecall: false,
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


describe("VersionsService price history", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("create inserta el precio inicial en VersionPriceHistory", async () => {
    const svc = new VersionsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({
      data: { name: "Corolla", brandId: brand.id, segment: "SEDAN" },
    });
    const version = await svc.create({
      modelId: model.id,
      name: "XLI",
      year: 2025,
      priceClp: 15_000_000,
      transmission: "AUTOMATIC",
      fuel: "BENCINA",
      engineDisplacementCc: 1800,
      powerHp: 140,
      torqueNm: 180,
      consumptionCityKmL: 14,
      consumptionHighwayKmL: 18,
      lengthMm: 4630, widthMm: 1780, heightMm: 1455,
      weightKg: 1300, trunkLiters: 470,
      hasRecall: false,
      recallUrl: null,
    });
    const history = await svc.listPriceHistory(version.id);
    expect(history.length).toBe(1);
    expect(history[0]!.priceClp).toBe(15_000_000);
    expect(history[0]!.note).toBe("Versión creada");
  });

  it("update registra un nuevo VersionPriceHistory al cambiar priceClp", async () => {
    const svc = new VersionsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Mazda" } });
    const model = await prisma.model.create({
      data: { name: "3", brandId: brand.id, segment: "SEDAN" },
    });
    const version = await svc.create({
      modelId: model.id,
      name: "Touring",
      year: 2025,
      priceClp: 18_000_000,
      transmission: "AUTOMATIC",
      fuel: "BENCINA",
      engineDisplacementCc: 2000,
      powerHp: 150, torqueNm: 200,
      consumptionCityKmL: 12, consumptionHighwayKmL: 16,
      lengthMm: 4660, widthMm: 1800, heightMm: 1440,
      weightKg: 1400, trunkLiters: 450,
      hasRecall: false,
      recallUrl: null,
    });
    await svc.update(version.id, { priceClp: 19_500_000, priceNote: "Ajuste Q1" });

    const history = await svc.listPriceHistory(version.id);
    expect(history.length).toBe(2);
    expect(history[1]!.priceClp).toBe(19_500_000);
    expect(history[1]!.note).toBe("Ajuste Q1");
  });

  it("update NO registra history si priceClp no cambia", async () => {
    const svc = new VersionsService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Kia" } });
    const model = await prisma.model.create({
      data: { name: "Rio", brandId: brand.id, segment: "SEDAN" },
    });
    const version = await svc.create({
      modelId: model.id,
      name: "LX",
      year: 2025,
      priceClp: 13_000_000,
      transmission: "MANUAL",
      fuel: "BENCINA",
      engineDisplacementCc: 1400,
      powerHp: 100, torqueNm: 130,
      consumptionCityKmL: 15, consumptionHighwayKmL: 19,
      lengthMm: 4060, widthMm: 1725, heightMm: 1450,
      weightKg: 1050, trunkLiters: 325,
      hasRecall: false,
      recallUrl: null,
    });
    await svc.update(version.id, { name: "LX Plus" });

    const history = await svc.listPriceHistory(version.id);
    expect(history.length).toBe(1);
  });
});
