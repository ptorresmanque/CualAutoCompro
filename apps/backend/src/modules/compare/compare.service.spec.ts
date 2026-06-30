import { describe, it, expect, beforeEach } from "vitest";
import { CompareService } from "./compare.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("CompareService", () => {
  beforeEach(async () => { setupTestPrisma(); await resetTestDb(prisma); });

  const seed2 = async () => {
    const t = await prisma.brand.create({ data: { name: "Toyota" } });
    const y = await prisma.model.create({ data: { brandId: t.id, name: "Yaris", segment: "HATCHBACK" } });
    const v1 = await prisma.version.create({
      data: { modelId: y.id, name: "XLS", year: 2026, priceClp: 14_990_000,
        transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496, powerHp: 110, torqueNm: 140,
        consumptionCityKmL: 14, consumptionHighwayKmL: 19, lengthMm: 3940, widthMm: 1740, heightMm: 1480,
        weightKg: 1100, trunkLiters: 286, airbagCount: 6, hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    const v2 = await prisma.version.create({
      data: { modelId: y.id, name: "Sport", year: 2025, priceClp: 12_500_000,
        transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1496, powerHp: 110, torqueNm: 140,
        consumptionCityKmL: 13, consumptionHighwayKmL: 18, lengthMm: 3940, widthMm: 1740, heightMm: 1480,
        weightKg: 1080, trunkLiters: 286, airbagCount: 4, hasAbs: true, hasEsp: false, hasCruiseControl: false },
    });
    return { v1: v1.id, v2: v2.id };
  };

  it("rechaza más de 3 IDs con BAD_REQUEST", async () => {
    const svc = new CompareService(prisma);
    await expect(svc.compare(["x", "y", "z", "w"])).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("devuelve 2 versiones y diffHighlights marca los campos que difieren", async () => {
    const { v1, v2 } = await seed2();
    const svc = new CompareService(prisma);
    const out = await svc.compare([v1, v2]);
    expect(out.versions.length).toBe(2);
    expect(out.diffHighlights.priceClp).toBe(true);
    expect(out.diffHighlights.powerHp).toBe(false);
    expect(out.diffHighlights.year).toBe(true);
  });

  it("con 1 versión, todos los diffHighlights son false", async () => {
    const { v1 } = await seed2();
    const svc = new CompareService(prisma);
    const out = await svc.compare([v1]);
    expect(out.versions.length).toBe(1);
    expect(Object.values(out.diffHighlights).every((v) => v === false)).toBe(true);
  });

  it("diffHighlights incluye todos los DIFF_KEYS (18 keys)", async () => {
    const { v1, v2 } = await seed2();
    const svc = new CompareService(prisma);
    const out = await svc.compare([v1, v2]);
    expect(Object.keys(out.diffHighlights).length).toBe(18);
  });
});
