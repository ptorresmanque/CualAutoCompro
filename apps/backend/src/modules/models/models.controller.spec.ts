import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

const seed = async () => {
  const toyota = await prisma.brand.create({ data: { name: "Toyota" } });
  const yaris = await prisma.model.create({ data: { brandId: toyota.id, name: "Yaris", segment: "HATCHBACK" } });
  await prisma.version.create({
    data: {
      modelId: yaris.id, name: "XLS", year: 2026, priceClp: 14_990_000,
      transmission: "CVT", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 14, consumptionHighwayKmL: 19,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1100, trunkLiters: 286,
      airbagCount: 6, hasAbs: true, hasEsp: true, hasCruiseControl: true,
    },
  });
  await prisma.version.create({
    data: {
      modelId: yaris.id, name: "Sport", year: 2025, priceClp: 11_500_000,
      transmission: "MANUAL", fuel: "BENCINA", engineDisplacementCc: 1496,
      powerHp: 110, torqueNm: 140, consumptionCityKmL: 18, consumptionHighwayKmL: 22,
      lengthMm: 3940, widthMm: 1740, heightMm: 1480, weightKg: 1080, trunkLiters: 286,
      airbagCount: 4, hasAbs: true, hasEsp: true, hasCruiseControl: false,
    },
  });
  const mazda = await prisma.brand.create({ data: { name: "Mazda" } });
  await prisma.model.create({ data: { brandId: mazda.id, name: "CX-5", segment: "SUV" } });
};

describe("GET /api/v1/models", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
    await seed();
  });

  it("lista modelos paginados", async () => {
    const res = await request(createApp()).get("/api/v1/models");
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("filtra por brand (id)", async () => {
    const toyota = await prisma.brand.findFirst({ where: { name: "Toyota" } });
    const res = await request(createApp()).get(`/api/v1/models?brand=${toyota!.id}`);
    expect(res.body.data.items.every((m: { brandId: string }) => m.brandId === toyota!.id)).toBe(true);
  });

  it("filtra por segment=HATCHBACK", async () => {
    const res = await request(createApp()).get("/api/v1/models?segment=HATCHBACK");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.items.every((m: { segment: string }) => m.segment === "HATCHBACK")).toBe(true);
  });

  it("filtra por rango de precio desde versions", async () => {
    const res = await request(createApp()).get("/api/v1/models?priceMin=14000000");
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });

  describe("filtro consumptionMax (DB-level, semántica some)", () => {
    it("incluye modelos con al menos una versión que cumple consumptionMax=15 (Yaris:XLS 14≤15)", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=15");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
    });

    it("excluye modelos cuando ninguna versión cumple consumptionMax=10 (Yaris:XLS 14>10, Sport 18>10)", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=10");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeUndefined();
    });

    it("incluye modelos cuando ambas versiones cumplen consumptionMax=25", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=25");
      const yaris = res.body.data.items.find((m: { name: string }) => m.name === "Yaris");
      expect(yaris).toBeDefined();
    });

    it("excluye modelos sin versiones (Mazda CX-5) incluso con consumptionMax permisivo", async () => {
      const res = await request(createApp()).get("/api/v1/models?consumptionMax=100");
      const cx5 = res.body.data.items.find((m: { name: string }) => m.name === "CX-5");
      expect(cx5).toBeUndefined();
    });
  });
});
