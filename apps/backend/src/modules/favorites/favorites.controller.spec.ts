import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("Favorites endpoints", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("GET /me/favorites sin auth retorna 401", async () => {
    const res = await request(createApp()).get("/api/v1/me/favorites");
    expect(res.status).toBe(401);
  });

  it("POST es idempotente: 2do call devuelve 200 con created=false", async () => {
    const reg = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "fav" + "@" + "test.cl", password: "secreto123", name: "Fav" });
    const cookie = reg.headers["set-cookie"]?.[0] as string;
    const b = await prisma.brand.create({ data: { name: "T" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "Yaris", segment: "HATCHBACK" } });

    const r1 = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: m.id });
    expect(r1.status).toBe(200);
    expect(r1.body.data.created).toBe(true);

    const r2 = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: m.id });
    expect(r2.status).toBe(200);
    expect(r2.body.data.created).toBe(false);
  });

  it("DELETE quita y GET /models ya no lo incluye", async () => {
    const reg = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "fav2" + "@" + "test.cl", password: "secreto123", name: "Fav2" });
    const cookie = reg.headers["set-cookie"]?.[0] as string;
    const b = await prisma.brand.create({ data: { name: "T" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "Yaris", segment: "HATCHBACK" } });

    await request(createApp()).post("/api/v1/me/favorites").set("Cookie", cookie).send({ modelId: m.id });
    const del = await request(createApp()).delete(`/api/v1/me/favorites/${m.id}`).set("Cookie", cookie);
    expect(del.status).toBe(200);
    expect(del.body.data.removed).toBe(true);

    const list = await request(createApp()).get("/api/v1/me/favorites/models").set("Cookie", cookie);
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([]);
  });

  it("GET /models retorna shape esperado con brand y versions", async () => {
    const reg = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "fav3" + "@" + "test.cl", password: "secreto123", name: "Fav3" });
    const cookie = reg.headers["set-cookie"]?.[0] as string;
    const b = await prisma.brand.create({ data: { name: "T" } });
    const m = await prisma.model.create({ data: { brandId: b.id, name: "Yaris", segment: "HATCHBACK" } });
    await prisma.version.create({
      data: { modelId: m.id, name: "XLS", year: 2026, priceClp: 14990000, transmission: "AUTOMATIC", fuel: "BENCINA",
        engineDisplacementCc: 1500, powerHp: 120, torqueNm: 145, consumptionCityKmL: 14, consumptionHighwayKmL: 18,
        lengthMm: 4200, widthMm: 1760, heightMm: 1480, weightKg: 1100, trunkLiters: 360, airbagCount: 6,
        hasAbs: true, hasEsp: true, hasCruiseControl: true },
    });
    await request(createApp()).post("/api/v1/me/favorites").set("Cookie", cookie).send({ modelId: m.id });

    const res = await request(createApp()).get("/api/v1/me/favorites/models").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      name: "Yaris",
      brand: { name: "T" },
      minPrice: 14990000,
      versions: [expect.objectContaining({ powerHp: 120 })],
    });
  });

  it("POST con modelId inexistente retorna 404", async () => {
    const reg = await request(createApp())
      .post("/api/v1/auth/register")
      .send({ email: "fav4" + "@" + "test.cl", password: "secreto123", name: "Fav4" });
    const cookie = reg.headers["set-cookie"]?.[0] as string;
    const res = await request(createApp())
      .post("/api/v1/me/favorites")
      .set("Cookie", cookie)
      .send({ modelId: "no-existe" });
    expect(res.status).toBe(404);
  });
});
