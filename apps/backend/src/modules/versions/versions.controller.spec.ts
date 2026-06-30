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
  const climatizador = await prisma.equipmentItem.create({ data: { name: "Climatizador", category: "Confort" } });
  await prisma.versionEquipment.create({ data: { versionId: v.id, equipmentItemId: climatizador.id } });
  await prisma.maintenanceCost.create({ data: { versionId: v.id, mileageTag: 10000, costClp: 250000 } });
  await prisma.maintenanceCost.create({ data: { versionId: v.id, mileageTag: 20000, costClp: 320000 } });
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
  });

  it("equipmentItems retorna estructura anidada { equipmentItem: { name, category } }", async () => {
    const { versionId } = await seed();
    const res = await request(createApp()).get(`/api/v1/versions/${versionId}`);
    expect(res.body.data.equipmentItems).toHaveLength(1);
    expect(res.body.data.equipmentItems[0].equipmentItem.name).toBe("Climatizador");
    expect(res.body.data.equipmentItems[0].equipmentItem.category).toBe("Confort");
  });

  it("maintenanceCosts retorna fila por mileageTag (10k, 20k)", async () => {
    const { versionId } = await seed();
    const res = await request(createApp()).get(`/api/v1/versions/${versionId}`);
    expect(res.body.data.maintenanceCosts).toHaveLength(2);
    const tags = res.body.data.maintenanceCosts.map((m: { mileageTag: number }) => m.mileageTag).sort();
    expect(tags).toEqual([10000, 20000]);
  });

  it("retorna 404 NOT_FOUND para id inexistente", async () => {
    const res = await request(createApp()).get("/api/v1/versions/no-existe-este-id");
    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
