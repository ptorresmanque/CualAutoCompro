import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { CompareService } from "./compare.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { FuelPricesService } from "../fuel-prices/fuel-prices.service.js";

describe("CompareService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  const seed2 = async () => {
    const t = await prisma.brand.create({ data: { name: "Toyota" } });
    const y = await prisma.model.create({ data: { brandId: t.id, name: "Yaris", segment: "HATCHBACK" } });
    const v1 = await prisma.version.create({
      data: { modelId: y.id, name: "XLS", year: 2026, priceClp: 14_990_000,
        transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496, powerHp: 110, torqueNm: 140,
        consumptionCityKmL: 14, consumptionHighwayKmL: 19, lengthMm: 3940, widthMm: 1740, heightMm: 1480,
        weightKg: 1100, trunkLiters: 286 },
    });
    const v2 = await prisma.version.create({
      data: { modelId: y.id, name: "Sport", year: 2025, priceClp: 12_500_000,
        transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1496, powerHp: 110, torqueNm: 140,
        consumptionCityKmL: 13, consumptionHighwayKmL: 18, lengthMm: 3940, widthMm: 1740, heightMm: 1480,
        weightKg: 1080, trunkLiters: 286 },
    });
    return { v1: v1.id, v2: v2.id };
  };

  it("rechaza más de 3 IDs con BAD_REQUEST", async () => {
    const svc = new CompareService(prisma, new FuelPricesService(prisma));
    await expect(svc.compare(["x", "y", "z", "w"])).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("devuelve 2 versiones y diffHighlights marca los campos que difieren", async () => {
    const { v1, v2 } = await seed2();
    const svc = new CompareService(prisma, new FuelPricesService(prisma));
    const out = await svc.compare([v1, v2]);
    expect(out.versions.length).toBe(2);
    expect(out.diffHighlights.priceClp).toBe(true);
    expect(out.diffHighlights.powerHp).toBe(false);
    expect(out.diffHighlights.year).toBe(true);
  });

  it("con 1 versión, todos los diffHighlights son false", async () => {
    const { v1 } = await seed2();
    const svc = new CompareService(prisma, new FuelPricesService(prisma));
    const out = await svc.compare([v1]);
    expect(out.versions.length).toBe(1);
    expect(Object.values(out.diffHighlights).every((v) => v === false)).toBe(true);
  });

  it("diffHighlights incluye todos los DIFF_KEYS", async () => {
    const { v1, v2 } = await seed2();
    const svc = new CompareService(prisma, new FuelPricesService(prisma));
    const out = await svc.compare([v1, v2]);
    expect(Object.keys(out.diffHighlights).length).toBe(20);
  });
});

describe("CompareService.computeFillCost", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("BENCINA con fuelTankLiters usa precio vigente", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    await fuelSvc.create({ fuelType: "BENCINA", pricePerUnitClp: 1000, unit: "L" });
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "Sport",
        year: 2025,
        priceClp: 15000000,
        transmission: "AUTOMATIC",
        fuel: "BENCINA",
        engineDisplacementCc: 2000,
        powerHp: 150,
        torqueNm: 200,
        consumptionCityKmL: 12,
        consumptionHighwayKmL: 16,
        lengthMm: 4500,
        widthMm: 1800,
        heightMm: 1450,
        weightKg: 1300,
        trunkLiters: 450,
        fuelTankLiters: 50,
      },
    });
    const result = await compareSvc.compare([v.id]);
    expect(result.versions[0]?.computedFillCostClp).toBe(50000);
  });

  it("ELECTRIC con batteryCapacityKwh usa precio kWh", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    await fuelSvc.create({ fuelType: "ELECTRIC", pricePerUnitClp: 200, unit: "kWh" });
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "EV",
        year: 2025,
        priceClp: 25000000,
        transmission: "AUTOMATIC",
        fuel: "ELECTRIC",
        engineDisplacementCc: 0,
        powerHp: 200,
        torqueNm: 300,
        consumptionCityKmL: 0,
        consumptionHighwayKmL: 0,
        lengthMm: 4500,
        widthMm: 1800,
        heightMm: 1450,
        weightKg: 1700,
        trunkLiters: 400,
        batteryCapacityKwh: 60,
      },
    });
    const result = await compareSvc.compare([v.id]);
    expect(result.versions[0]?.computedFillCostClp).toBe(12000);
  });

  it("retorna null si no hay precio vigente para el fuelType", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "Sport",
        year: 2025,
        priceClp: 15000000,
        transmission: "AUTOMATIC",
        fuel: "BENCINA",
        engineDisplacementCc: 2000,
        powerHp: 150,
        torqueNm: 200,
        consumptionCityKmL: 12,
        consumptionHighwayKmL: 16,
        lengthMm: 4500,
        widthMm: 1800,
        heightMm: 1450,
        weightKg: 1300,
        trunkLiters: 450,
        fuelTankLiters: 50,
      },
    });
    const result = await compareSvc.compare([v.id]);
    expect(result.versions[0]?.computedFillCostClp).toBeNull();
  });

  it("diffHighlights incluye nuevas keys de costos", async () => {
    const fuelSvc = new FuelPricesService(prisma);
    const compareSvc = new CompareService(prisma, fuelSvc);
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "M", segment: "SEDAN" } });
    const a = await prisma.version.create({
      data: {
        modelId: model.id, name: "A", year: 2025, priceClp: 15000000,
        transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 2000, powerHp: 150, torqueNm: 200,
        consumptionCityKmL: 12, consumptionHighwayKmL: 16,
        lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300,
        trunkLiters: 450,
        circulationPermitClp: 100000, mandatoryInsuranceClp: 50000,
      },
    });
    const b = await prisma.version.create({
      data: {
        modelId: model.id, name: "B", year: 2025, priceClp: 18000000,
        transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 2000, powerHp: 150, torqueNm: 200,
        consumptionCityKmL: 12, consumptionHighwayKmL: 16,
        lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300,
        trunkLiters: 450,
        circulationPermitClp: 200000, mandatoryInsuranceClp: 80000,
      },
    });
    const result = await compareSvc.compare([a.id, b.id]);
    expect(result.diffHighlights.circulationPermitClp).toBe(true);
    expect(result.diffHighlights.mandatoryInsuranceClp).toBe(true);
  });
});
