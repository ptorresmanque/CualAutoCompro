import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../infra/prisma.js";
import { CostService } from "./cost.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";

describe("CostService.calculate", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("lanza NOT_FOUND si la versión no existe", async () => {
    const svc = new CostService(prisma);
    await expect(svc.calculate("missing", 15_000)).rejects.toThrow(
      "Versión no encontrada",
    );
  });

  it("calcula costo de combustible usando kmL y precio vigente", async () => {
    const svc = new CostService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({
      data: { name: "Yaris", brandId: brand.id, segment: "HATCHBACK" },
    });
    await prisma.version.create({
      data: {
        modelId: model.id,
        name: "XLS",
        year: 2025,
        priceClp: 14_000_000,
        transmission: "AUTOMATIC",
        fuel: "BENCINA",
        engineDisplacementCc: 1500,
        powerHp: 110,
        torqueNm: 140,
        consumptionCityKmL: 14,
        consumptionHighwayKmL: 18,
        lengthMm: 4000, widthMm: 1700, heightMm: 1500,
        weightKg: 1100, trunkLiters: 320, airbagCount: 4,
        hasAbs: true, hasEsp: true, hasCruiseControl: true,
      },
    });
    await prisma.fuelPrice.create({
      data: { fuelType: "BENCINA", pricePerUnitClp: 1300, unit: "L" },
    });
    const version = await prisma.version.findFirst();
    const result = await svc.calculate(version!.id, 15_000);
    // city 4950km / 14 km/L + hw 10050km / 18 km/L = 353.6 + 558.3 ≈ 911.9 L
    // at 1300 CLP/L = ~1,185,520 CLP
    expect(result.fuelClp).toBeGreaterThan(1_100_000);
    expect(result.fuelClp).toBeLessThan(1_300_000);
    expect(result.totalClp).toBeGreaterThan(result.fuelClp);
    expect(result.meta.fuelUnit).toBe("L");
  });

  it("suma mantención para los mileageTag dentro del rango de km/año", async () => {
    const svc = new CostService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Mazda" } });
    const model = await prisma.model.create({
      data: { name: "3", brandId: brand.id, segment: "SEDAN" },
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "Touring",
        year: 2025,
        priceClp: 18_000_000,
        transmission: "AUTOMATIC",
        fuel: "BENCINA",
        engineDisplacementCc: 2000,
        powerHp: 150, torqueNm: 200,
        consumptionCityKmL: 12,
        consumptionHighwayKmL: 16,
        lengthMm: 4660, widthMm: 1800, heightMm: 1440,
        weightKg: 1400, trunkLiters: 450, airbagCount: 6,
        hasAbs: true, hasEsp: true, hasCruiseControl: true,
      },
    });
    await prisma.fuelPrice.create({
      data: { fuelType: "BENCINA", pricePerUnitClp: 1300, unit: "L" },
    });
    // 10k tag (dentro del rango) + 20k tag (fuera del rango con 15k km/año)
    await prisma.maintenanceCost.create({
      data: { versionId: version.id, mileageTag: 10_000, costClp: 80_000 },
    });
    await prisma.maintenanceCost.create({
      data: { versionId: version.id, mileageTag: 20_000, costClp: 150_000 },
    });

    const within = await svc.calculate(version.id, 15_000);
    expect(within.maintenanceClp).toBe(80_000);
    expect(within.meta.maintenanceMileages).toEqual([10_000]);

    const farRange = await svc.calculate(version.id, 25_000);
    expect(farRange.maintenanceClp).toBe(230_000);
    expect(farRange.meta.maintenanceMileages).toEqual([10_000, 20_000]);
  });

  it("incluye permiso de circulación y SOAP cuando están definidos", async () => {
    const svc = new CostService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Suzuki" } });
    const model = await prisma.model.create({
      data: { name: "Swift", brandId: brand.id, segment: "HATCHBACK" },
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "GL",
        year: 2025,
        priceClp: 12_000_000,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 1200,
        powerHp: 90, torqueNm: 120,
        consumptionCityKmL: 16,
        consumptionHighwayKmL: 20,
        lengthMm: 3840, widthMm: 1735, heightMm: 1495,
        weightKg: 950, trunkLiters: 265, airbagCount: 2,
        hasAbs: true, hasEsp: false, hasCruiseControl: false,
        circulationPermitClp: 250_000,
        mandatoryInsuranceClp: 180_000,
      },
    });

    const result = await svc.calculate(version.id, 10_000);
    expect(result.circulationPermitClp).toBe(250_000);
    expect(result.mandatoryInsuranceClp).toBe(180_000);
    expect(result.voluntaryInsuranceClp).toBe(0);
    // 10% del precio = 1.2M
    expect(result.depreciationClp).toBe(1_200_000);
  });

  it("cap kmPerYear al máximo permitido", async () => {
    const svc = new CostService(prisma);
    const brand = await prisma.brand.create({ data: { name: "Kia" } });
    const model = await prisma.model.create({
      data: { name: "Rio", brandId: brand.id, segment: "SEDAN" },
    });
    const version = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "LX",
        year: 2025,
        priceClp: 13_000_000,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 1400,
        powerHp: 100, torqueNm: 130,
        consumptionCityKmL: 15,
        consumptionHighwayKmL: 19,
        lengthMm: 4060, widthMm: 1725, heightMm: 1450,
        weightKg: 1050, trunkLiters: 325, airbagCount: 4,
        hasAbs: true, hasEsp: true, hasCruiseControl: false,
      },
    });
    const result = await svc.calculate(version.id, 1_000_000);
    expect(result.kmPerYear).toBeLessThanOrEqual(200_000);
  });
});
