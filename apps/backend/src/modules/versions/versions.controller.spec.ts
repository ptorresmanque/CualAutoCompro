import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

const seed = async () => {
  const toyota = await prisma.brand.create({ data: { name: "Toyota" } });
  const yaris = await prisma.model.create({ data: { brandId: toyota.id, name: "Yaris", segment: "HATCHBACK" } });
  const v = await prisma.version.create({
    data: {
      modelId: yaris.id, name: "XLS", year: 2026, priceClp: 14_990_000,
      transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 14, consumptionHighwayKmL: 19,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1100, trunkLiters: 286,
      airbagCount: 6, hasAbs: true, hasEsp: true, hasCruiseControl: true,
    },
  });
  return { versionId: v.id, brandId: toyota.id, modelId: yaris.id };
};

describe("GET /api/v1/versions/:id", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("retorna 200 con payload completo (brand, model, equipmentItems, maintenanceCosts) para id existente", async () => {
    const { versionId, brandId, modelId } = await seed();
    const res = await request(createApp()).get(`/api/v1/versions/${versionId}`);
    expect(res.status).toBe(200);
    expect(res.body.error).toBeNull();
    expect(res.body.data.id).toBe(versionId);
    expect(res.body.data.modelId).toBe(modelId);
    expect(res.body.data.model.brandId).toBe(brandId);
    expect(res.body.data.model.brand.name).toBe("Toyota");
    expect(Array.isArray(res.body.data.equipmentItems)).toBe(true);
    expect(Array.isArray(res.body.data.maintenanceCosts)).toBe(true);
  });

  it("retorna 404 NOT_FOUND para id inexistente", async () => {
    const res = await request(createApp()).get("/api/v1/versions/no-existe-este-id");
    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});