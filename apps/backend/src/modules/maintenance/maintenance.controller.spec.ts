import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { loginAsAdmin } from "../../../__tests__/helpers/auth.js";
import { prisma } from "../../infra/prisma.js";

describe("maintenance GET /", () => {
  let app: express.Express;
  beforeAll(() => {
    app = createApp();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("200 sin auth con shape correcto", async () => {
    const res = await request(app).get("/api/v1/maintenance");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          versionId: expect.any(String),
          mileageTag: expect.any(Number),
          costClp: expect.any(Number),
        }),
      );
    }
  });
});

describe("GET /api/v1/admin/maintenance?versionId=", () => {
  const baseVersion = {
    year: 2026, priceClp: 10_000_000, transmission: "MANUAL", fuel: "BENCINA",
    powerHp: 100, torqueNm: 130, lengthMm: 4000, widthMm: 1700, heightMm: 1500,
    weightKg: 1100, trunkLiters: 300,
  };

  const seed = async () => {
    const brand = await prisma.brand.create({ data: { name: "Toyota" } });
    const model = await prisma.model.create({ data: { brandId: brand.id, name: "Yaris", segment: "HATCHBACK" } });
    const v1 = await prisma.version.create({ data: { ...baseVersion, modelId: model.id, name: "XLS" } });
    const v2 = await prisma.version.create({ data: { ...baseVersion, modelId: model.id, name: "Sport" } });
    await prisma.maintenanceCost.createMany({
      data: [
        { versionId: v1.id, mileageTag: 10_000, costClp: 250_000 },
        { versionId: v1.id, mileageTag: 20_000, costClp: 320_000 },
        { versionId: v2.id, mileageTag: 10_000, costClp: 180_000 },
      ],
    });
    return { v1, v2 };
  };

  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("filtra las mantenciones por versión y ajusta el total", async () => {
    const { v1 } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .get(`/api/v1/admin/maintenance?versionId=${v1.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((m: { versionId: string }) => m.versionId === v1.id)).toBe(true);
    expect(res.body.pagination.total).toBe(2);
  });

  it("sin versionId devuelve todas", async () => {
    await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app).get("/api/v1/admin/maintenance").set("Cookie", cookie);

    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(3);
  });

  it("combina versionId con la búsqueda q", async () => {
    const { v2 } = await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .get(`/api/v1/admin/maintenance?versionId=${v2.id}&q=Sport`)
      .set("Cookie", cookie);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].versionId).toBe(v2.id);
  });

  it("versionId inexistente devuelve lista vacía, no todo el catálogo", async () => {
    await seed();
    const app = createApp();
    const cookie = await loginAsAdmin(app);
    const res = await request(app)
      .get("/api/v1/admin/maintenance?versionId=no-existe")
      .set("Cookie", cookie);

    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });
});
